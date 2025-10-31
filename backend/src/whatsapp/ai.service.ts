import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ThreadMappingService } from './thread-mapping.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { Chat, Message } from 'whatsapp-web.js';
import { OcrService } from 'src/ocr/orc.service';
import { QueuedMessage } from './types';
import { EncryptkeysService } from 'src/encryptkeys/encryptkeys.service';


export interface WhatsappChat {
    sendSeen(): Promise<void>;
    sendStateTyping(): Promise<void>;
    clearState(): Promise<void>;
}

export interface WhatsappMessageWrapper {
    message: {

    }
}

type ParsedLLM = {
    replyText: string;
    shouldRespond: boolean;
}

@Injectable()
export class AiService {
    private cache: Map<string, string>;

    constructor(
        private prisma: PrismaService,
        private threadMapping: ThreadMappingService,
        private cfg: ConfigService,
        private ocr: OcrService,
        private encryptService : EncryptkeysService
    ) {
        this.cache = this.threadMapping.getCacheMapping();
    }

    private key(agentId: string, chatId: string) {
        return `${agentId}:${chatId}`;
    }

    async getOrCreateThread(agentId: string, chatId: string): Promise<string> {
        const k = this.key(agentId, chatId);
        const cached = this.cache.get(k);
        if (cached) return cached;

        const openAiClient = await this.getOpenAiClientForAgentId(agentId);

        const existing = await this.prisma.chatThreadMap.findUnique({
            where: { agentId_chatId: { agentId, chatId } },
        });

        if (existing && await this.isValidThread(existing.threadId, agentId)) {
            this.cache.set(k, existing.threadId);
            return existing.threadId;
        }

        const newThread = await openAiClient.beta.threads.create();

        const upserted = await this.prisma.chatThreadMap.upsert({
            where: {
                agentId_chatId: { agentId, chatId }, // requires a unique constraint
            },
            update: {
                threadId: newThread.id, // what to update if record already exists
            },
            create: {
                agentId,
                chatId,
                threadId: newThread.id, // what to create if record doesn't exist
            },
        });


        this.cache.set(k, upserted.threadId);
        return upserted.threadId;
    }

    async isValidThread(threadId: string, agentId: string): Promise<boolean> {
        const openAiClient = await this.getOpenAiClientForAgentId(agentId);


        try {
            console.log(`[ai.js] Validating thread ${threadId}`);
            const existingThread = await openAiClient.beta.threads.retrieve(threadId);
            return true;
        }
        catch (err) {
            console.log(`[ai.js] The thread is no longer valid ${threadId}`);
            return false;
        }
    }

    async processMessageWithAi(
        agentId: string,
        chatId: string,
        message: QueuedMessage,
    ) {
        // this may be confuzing but we are getting the WhatsAppMessage object
        // from the Queue Message object which adds timestamp and processed label
        const msg = message.message;

        try {
            const chat = await msg.getChat();

            await this.showTypingIndicator(chat);

            const mediaContent = await this.getMediaContentFromFiles(msg);

            const { replyText, shouldRespond } = await this.generateAiResponse(
                agentId,
                chatId,
                msg,
                mediaContent
            );

            const threadId = await this.getOrCreateThread(agentId, chatId);

            await this.removeTypingIndicator(chat);

            if (shouldRespond) {
                await msg.reply(replyText);

                await this.prisma.messageChat.create({
                    data: {
                        agentId: agentId,
                        chatId: chatId,
                        threadId: threadId,
                        message: msg,
                        sender:  msg?.author ?? msg?.from
                    }
                })
            }
        } catch (err) {
            console.log(err);
            try {
                await msg.reply(`Error in processing message with AI `, err);
            } catch (err) {
                console.log(err);
                const chat = await msg.getChat();
                await this.removeTypingIndicator(chat).catch(() => void 0);
            }
        }
    }
    private async showTypingIndicator(groupChat: Chat) {
        try {
            await groupChat.sendSeen();
            await groupChat.sendStateTyping();
        } catch (err: any) {
            // todo remote this and change to logger
            console.warn(`Error with chat state: ${err?.message || err}`);
        }
    }

    private async removeTypingIndicator(groupChat: Chat) {
        try {
            await groupChat.sendSeen();
            await groupChat.sendStateTyping();
        } catch (err) {
            // todo remove and change this with logger
            console.log("this typing wrong");
        }
    }

    private parseJsonLLMResponse(contentPart: any): ParsedLLM {
        let replyText = "I couldn't generate a response.";
        let shouldRespond = false;

        if (contentPart?.type === 'text') {
            replyText = contentPart.text.value as string;
            try {
                const obj = JSON.parse(replyText);
                replyText = obj.reply || replyText;
                shouldRespond = obj.shouldRespond === true;
            } catch (err) {
                console.log("to replace this with propper logging");
            }
        }

        return { replyText, shouldRespond };
    }

    private async getMediaContentFromFiles(
        msg: Message
    ): Promise<string[]> {
        const results: string[] = [];

        if (!msg.hasMedia) {
            return results;
        }

        try {
            const media = await msg.downloadMedia();

            if (!media) return results;

            const mimeType = media.mimetype || 'application/octet-stream';
            const buffer = Buffer.from(media.data, 'base64');
            const phoneNumber = String(msg.from ?? "").replace(/@.*/, '');

            const textDump = await this.ocr.processPictureBytes(
                { buffer, mime: mimeType },
                phoneNumber
            );

            results.push(textDump);
        } catch (err) {
            console.log("do the funny logging here ");
        }
        return results;
    }

    private getFullGptPrompt(msg: Message, mediaContent: string[]) {
        const userMessage = msg.body || "";

        let gptPrompt = `The user has asked: ${userMessage}`

        if (mediaContent.length > 0) {
            gptPrompt += '\nThis is the context from files provided by the user:'
        }
        gptPrompt += `\n\nReturn the final answer as JSON with keys: reply, shouldRespond. Only output a single valid JSON object.`;

        let fullFileContent = '';

        mediaContent.forEach((content, i) => {
            const fileName = `File${i}`;
            gptPrompt += `\n\nIn the file ${fileName} you have the following data:\n${content}\nEnd of file ${fileName}`;
            fullFileContent += content;
        });

        return { gptPrompt, fullFileContent };
    }

    private async getOpenAiClientForAgentId(agentId: string): Promise<OpenAI> {
        const openAiApiKey = await this.prisma.agent.findUnique({
            where: {
                id: agentId
            },
            select: {
                apiKeys: {
                    where: {
                        name: "OPENAIAPIKEY",
                    },
                    select: {
                        key: true
                    }
                }
            }
        });

        const apiKey = openAiApiKey?.apiKeys[0]?.key;
        
        if (!apiKey) {
            throw new Error("there is no api key for this agent" + agentId.toString());
        }

        const decrypedApiKey = this.encryptService.decrypt(apiKey);

        return new OpenAI({ apiKey: decrypedApiKey });
    }

    private async generateAiResponse(
        agentId: string,
        chatId: string,
        msg: Message,
        mediaContent: string[]
    ): Promise<ParsedLLM> {

        const { gptPrompt } = this.getFullGptPrompt(msg, mediaContent);

        const threadId = await this.getOrCreateThread(agentId, chatId);

        const openAiClient = await this.getOpenAiClientForAgentId(agentId);

        await openAiClient.beta.threads.messages.create(threadId, {
            role: 'user',
            content: gptPrompt
        });

        const agentWithAssistantId = await this.prisma.agent.findUnique({
            where: {
                id: agentId
            },
            select: {
                id: true,
                assistant_id: true
            }
        });

        if (agentWithAssistantId === null) {
            console.log("this is not ok something is worng in db");
            return {
                replyText: "Something went wrong",
                shouldRespond: true
            }
        }

        const run = await openAiClient.beta.threads.runs.create(threadId, {
            assistant_id: agentWithAssistantId.assistant_id,
            response_format: { type: 'json_object' }
        });

        const contentPart = await this.getAnswerFromGpt(threadId, run.id, agentId);

        return this.parseJsonLLMResponse(contentPart);
    }

    private async getAnswerFromGpt(
        threadId: string,
        runId: string,
        agentId: string
    ) {
        const MAX_ATTEMPTS = 60;
        const WAIT_TIME_MS = 1000;
        let attempts = 0;

        const openAiClient = await this.getOpenAiClientForAgentId(agentId);


        while (attempts < MAX_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, WAIT_TIME_MS));
            const runStatus = await openAiClient.beta.threads.runs.retrieve(
                runId,
                { thread_id: threadId },
            );
            attempts++;

            if (runStatus.status === 'requires_action') {
                console.log("i wanna use a tool :) ");
            }

            if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
                throw new Error(`Run ended with status: ${runStatus.status}`);
            }

            if (runStatus.status === 'completed') {
                const messages = await openAiClient.beta.threads.messages.list(
                    threadId,
                    { limit: 1 },
                );
                return messages.data[0]?.content?.[0];
            }
        }

        throw new Error('Run timeout - took too long to complete');
    }

}
