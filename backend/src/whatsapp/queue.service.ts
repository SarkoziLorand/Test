import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ThreadMappingService } from './thread-mapping.service';
import { QueuedMessage, ChatQueueState } from './types';
import { AiService } from './ai.service';
import { Message } from 'whatsapp-web.js';

@Injectable()
export class QueueService {
    private readonly logger = new Logger('QueueService');
    private queues = new Map<string, ChatQueueState>();

    constructor(
        private prisma: PrismaService,
        private AI: AiService,
    ) { }

    private key(agentId: string, chatId: string) {
        return `${agentId}:${chatId}`;
    }

    private getQueue(agentId: string, chatId: string): ChatQueueState {
        const k = this.key(agentId, chatId);
        if (!this.queues.has(k)) {
            this.queues.set(k, { messagesList: [] });
        }
        return this.queues.get(k)!;
    }

    async addMessageToQueue(agentId: string, chatId: string, message: any) {
        const uniqueMessageId = message._data.id._serialized;

        const ts = message.timestamp * 1000;

        try {
            await this.prisma.inboundMessage.create({
                data: { agentId, chatId, uniqueMessageId, ts: new Date(ts) },
            });
        } catch (e: any) {
            this.logger.debug(`Duplicate inbound ${uniqueMessageId} for agent ${agentId}, skipping enqueue`);
            return false;
        }

        const queue = this.getQueue(agentId, chatId);
        queue.messagesList.push({
            uniqueMessageId,
            ts: ts,
            message,
            processed: false,
        });

        return true;
    }

    async processMessageFromQueue(agentId: string, chatId: string, aiHandler: (agentId: string, chatId: string, queued: QueuedMessage) => Promise<void>) {
        const queue = this.getQueue(agentId, chatId);


        while (true) {
            const open = queue.messagesList.filter(m => !m.processed);
            if (open.length === 0) break;

            open.sort((a, b) => a.ts - b.ts);
            const next = open[0];

            try {

                await this.AI.getOrCreateThread(agentId, chatId);

                await aiHandler(agentId, chatId, next);

                next.processed = true;

                queue.messagesList = queue.messagesList.filter(m => !m.processed);
            } catch (err) {
                this.logger.error(`AI/process error for ${agentId}:${chatId}`, err as any);
                next.processed = true;
                queue.messagesList = queue.messagesList.filter(m => !m.processed);
            }
        }
    }
}
