import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConversationsService {

    constructor(
        private prisma: PrismaService
    ) { }

    private readonly conversationSelect = {
        chatId: true,
        threadId: true,
        agentId: true,
        sender: true,
        createdAt: true,
        message: true,
        agent: {
            select: {
                id: true,
                name: true,
                phoneNumber: true,
                company: {
                    select: { id: true, name: true },
                },
            },
        },
    } satisfies Prisma.MessageChatSelect;

    private baseFindMany(where: Prisma.MessageChatWhereInput) {
        return this.prisma.messageChat.findMany({
            where,
            select: this.conversationSelect,
            distinct: ['chatId', 'agentId'],
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllAgentChatsForUser(userId: string) {
        return this.baseFindMany({
            agent: {
                company: {
                    members: {
                        some: {
                            id: userId
                        }
                    }
                }
            }
        });
    }

    async findAllAgentChats() {
        return this.baseFindMany({});
    }

    async getMessagesFromChatIdForUser(userId: string, chatId: string) {
        return this.prisma.messageChat.findMany({
            where: {
                chatId,
                agent: {
                    company: {
                        members: {
                            some: {
                                id: userId
                            }
                        }
                    }
                }
            },
            select: this.conversationSelect,
            orderBy: {
                createdAt: 'asc'
            }
        });
    }

    async getMessagesFromChatId(chatId: string) {
        return this.prisma.messageChat.findMany({
            where: {
                chatId
            },
            select: this.conversationSelect,
            orderBy: {
                createdAt: 'asc'
            }
        })
    }
}
