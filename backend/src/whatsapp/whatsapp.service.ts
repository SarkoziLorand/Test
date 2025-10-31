import { Injectable, Logger } from '@nestjs/common';
import QRCode from 'qrcode';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg as any;
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappGateway } from './whatsapp.gateway';
import { ChatLockService } from './chat-lock.service';
import { QueueService } from './queue.service';

import * as path from 'path';
import * as fs from 'fs';
import { AiService } from './ai.service';
import { WhitelistScope } from '@prisma/client';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger('WhatsappService');
    private clients = new Map<string, InstanceType<any>>();
    private status = new Map<string, { state: string; ts: string; reason?: string }>();

    private baseDataPath = path.join(process.cwd(), 'whatsapp_sessions');

    private ensureBaseDir() {
        try { fs.mkdirSync(this.baseDataPath, { recursive: true }); } catch { }
        return this.baseDataPath;
    }

    private localSessionDir(agentId: string) {
        return path.join(this.baseDataPath, `session-${agentId}`);
    }

    private deleteLocalSession(agentId: string) {
        const dir = this.localSessionDir(agentId);
        try {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        } catch { }
    }

    constructor(
        private prisma: PrismaService,
        private gateway: WhatsappGateway,
        private locks: ChatLockService,
        private queues: QueueService,
        private aiService: AiService
    ) { }

    async startClient(agentId: string) {
        if (this.clients.has(agentId)) {
            this.logger.log(`Client for agent ${agentId} already started`);
            return;
        }

        console.log(`[WhatsappService] Starting client for agent ${agentId}`);

        this.ensureBaseDir();
        await this.setAgentState(agentId, "INITIALIZING");

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: agentId,
                dataPath: this.baseDataPath,
            }),
            puppeteer: {
                headless: 'new',
                protocolTimeout: 0,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--no-first-run',
                    '--disable-default-apps',
                    '--disable-features=site-per-process',
                    '--no-zygote',
                ],
            },
            restartOnAuthFail: true,
            takeoverOnConflict: false,
            takeoverTimeoutMs: 0,
        });

        this.wireEvents(agentId, client);
        this.clients.set(agentId, client);

        try {
            console.log(`[WhatsappService] Initializing client for ${agentId}`);
            await client.initialize();
            console.log(`[WhatsappService] Client initialized successfully for ${agentId}`);
        } catch (e: any) {
            console.error(`[WhatsappService] Initialize ERROR for ${agentId}:`, e?.message || e);
            this.clients.delete(agentId);
            await this.setAgentState(agentId, 'DISCONNECTED');
            throw e;
        }
    }

    async stopClient(agentId: string) {
        console.log(agentId);

        console.log(`[WhatsappService] Stopping client for ${agentId}`);
        const client = this.clients.get(agentId);
        if (!client) {
            console.log(`[WhatsappService] No client found for ${agentId}`);
            return;
        }

        try {
            await client.destroy();
            console.log(`[WhatsappService] Client destroyed for ${agentId}`);
        } catch (e) {
            console.error(`[WhatsappService] Error destroying client for ${agentId}:`, e);
        }

        this.clients.delete(agentId);
        await this.setAgentState(agentId, 'DISCONNECTED');
    }

    async resetSession(agentId: string) {
        console.log(`[WhatsappService] Resetting session for ${agentId}`);

        const client = this.clients.get(agentId);
        if (client) {
            try { await client.destroy(); } catch { }
        }

        this.deleteLocalSession(agentId);

        await this.setAgentState(agentId, 'REQUESTING_QR');

        try {
            await this.startClient(agentId);
        } catch (e) {
            console.error(`[WhatsappService] Error restarting after reset for ${agentId}`);
        }
    }

    getStatus(agentId: string) {
        return this.status.get(agentId) || { state: 'DISCONNECTED', ts: new Date().toISOString() };
    }

    private wireEvents(agentId: string, client: any) {
        console.log(`[WhatsappService] Wiring events for ${agentId}`);

        let tearingDown = false;

        const safeDeleteFromMap = () => {
            const current = this.clients.get(agentId);
            if (current === client) {
                this.clients.delete(agentId);
            }
        };

        const recreateClient = async () => {
            const fresh = new Client({
                authStrategy: new LocalAuth({
                    clientId: agentId,
                    dataPath: this.baseDataPath,
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-extensions',
                        '--no-first-run',
                        '--disable-default-apps',
                    ],
                },
                restartOnAuthFail: true,
                takeoverOnConflict: false,
                takeoverTimeoutMs: 0,
            });

            this.wireEvents(agentId, fresh);
            this.clients.set(agentId, fresh);

            await this.setAgentState(agentId, 'INITIALIZING');
            await fresh.initialize();
            return fresh;
        };

        client.on('qr', async (qr: string) => {
            try {
                const data = await QRCode.toDataURL(qr);
                this.gateway.emitQr(agentId, { dataUrl: data });
                await this.setAgentState(agentId, "REQUESTING_QR");
            } catch {
                console.error(`[weebjs] QR encoded error for ${agentId}`);
            }
        });

        client.on('authenticated', async () => {
            console.log(`[wwebjs] authenticated ${agentId}`);
            await this.setAgentState(agentId, 'AUTHENTICATED');
        });

        client.on('ready', async () => {
            await this.setAgentState(agentId, 'CONNECTED');

            const phone = client?.info?.wid?.user ?? null;

            if (phone){
                console.log(`Phone number is: ${phone}`);
                await this.prisma.agent.update({
                    where:{
                        id: agentId
                    },
                    data: {
                        phoneNumber: phone
                    }
                });
            }

        });

        client.on('auth_failure', async (msg: string) => {
            if (tearingDown) return;
            tearingDown = true;

            console.error(`[wwebjs] auth_failure ${agentId} : ${msg}`);
            this.gateway.emitError(agentId, { message: 'Auth failure' });

            this.deleteLocalSession(agentId);
            await this.setAgentState(agentId, 'REQUESTING_QR');

            try { await client.destroy?.(); } catch { }

            safeDeleteFromMap();

            try {
                await recreateClient();
            } catch {
                console.log(`[wwebjs] recreate client failed for ${agentId}`);
                await this.setAgentState(agentId, 'DISCONNECTED');
            }
        });

        client.on('disconnected', async (reason: string) => {
            if (tearingDown) return;
            tearingDown = true;

            console.warn(`[wwebjs] disconnected ${agentId}: ${reason}`);

            const reasonUp = (reason || '').toUpperCase();
            const looksLikeLogout =
                reasonUp.includes('LOGOUT') ||
                reasonUp.includes('UNPAIRED') ||
                reasonUp.includes('INVALID') ||
                reasonUp.includes('REVOKED');

            if (looksLikeLogout) {
                this.deleteLocalSession(agentId);
                await this.setAgentState(agentId, 'REQUESTING_QR');
            } else {
                await this.setAgentState(agentId, 'DISCONNECTED');
            }

            try { await client.destroy?.(); } catch { }
            safeDeleteFromMap();

            if (looksLikeLogout) {
                try { await recreateClient(); } catch (e: any) {
                    console.error(`[wwebjs] recreate client failed for ${agentId}:`, e?.message || e);
                }
            }
        });

        client.on('error', (error: any) => {
            console.error(`[wwebjs] client error ${agentId}:`, error);
        });

        client.on('message', async (msg: any) => {
            try {
                const agent = await this.prisma.agent.findUnique({
                    where: { id: agentId },
                    select: {
                        id: true,
                        whitelist: {
                            select: {
                                scope: true,
                                identifier: true
                            }
                        },
                        blacklist: {
                            select: {
                                scope: true,
                                identifier: true,
                            }
                        }
                    }
                });

                if (!agent)
                    return;

                const authorJid = msg?.author ?? msg?.from;

                const author = authorJid?.split('@')[0];

                console.log("The message is from: ", author);

                const isBlackListed = agent.blacklist.some(e => e.identifier === author);
                if (isBlackListed) {
                    console.log("this entry is blacklisted");
                    return;
                }

                const isWhiteListed = agent.whitelist.some(entry => entry.scope === WhitelistScope.ALL)
                    || agent.whitelist.some(entry => entry.identifier === author);
                if (!isWhiteListed) {
                    console.log("this is not whitelisted");
                    return;
                }

                if (msg?.fromMe) return;
                if (msg?.from === 'status@broadcast') return;

                const chat = await msg.getChat();
                const chatId = chat.id._serialized;

                await this.aiService.getOrCreateThread(agentId, chatId);

                const addedMessageToQueue = await this.queues.addMessageToQueue(
                    agentId, chatId, msg
                );

                console.log(addedMessageToQueue);
                if (addedMessageToQueue) {
                    await this.locks.getLock(agentId, chatId).runExclusive(async () => {
                        await this.queues.processMessageFromQueue(agentId, chatId, this.aiService.processMessageWithAi.bind(this.aiService));
                    });
                }

                console.log(`[wwebjs] auto-replied "ok" to ${agentId} -> ${msg?.from}`);
            } catch (e: any) {
                console.error(`[wwebjs] failed to auto-reply to ${agentId} -> ${msg?.from}:`, e?.message || e);
            }
        });
    }

    private async setAgentState(
        agentId: string,
        state: 'REQUESTING_QR' | 'INITIALIZING' | 'AUTHENTICATED' | 'CONNECTED' | 'DISCONNECTED',
        reason?: string
    ) {
        const ts = new Date().toISOString();
        console.log(`[WhatsappService] State change for ${agentId}: ${state} (${reason || 'no reason'})`);

        this.status.set(agentId, { state, ts, reason });
        this.gateway.emitStatus(agentId, { state, ts, reason });

        try {
            await this.prisma.agent.update({
                where: { id: agentId },
                data: {
                    state,
                    lastStateChangeAt: new Date(),
                },
            });
        } catch (e) {
            console.error(`[WhatsappService] Error updating agent state in DB for ${agentId}:`, e);
        }
    }

    async saveSession(agentId: string): Promise<boolean> {
        const client = this.clients.get(agentId);
        if (!client) {
            console.log(`[WhatsappService] saveSession(): No client for ${agentId}`);
            return fs.existsSync(this.localSessionDir(agentId));
        }
        return fs.existsSync(this.localSessionDir(agentId));
    }
}
