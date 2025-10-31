import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agetn.dto';
import OpenAI from 'openai';
import { CreateListEntryDto, ListType } from './dto/list-agent-create.dto';
import { EncryptkeysService } from 'src/encryptkeys/encryptkeys.service';
import { UpdateSystemPromptDto } from './dto/update-system-prompt.dto';
import { List } from 'whatsapp-web.js';
import { DeletePermissionsList } from './dto/detele-permission-list.dto';
import { UpdatePermissionsList } from './dto/update-permission-list.dto';

@Injectable()
export class AgentService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly encryptService: EncryptkeysService
    ) { }

    async getAllAgentsForUsers(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!user) throw new NotFoundException('Not valid user id.');

        if (user.role === Role.USER) {
            const agents = this.prisma.agent.findMany({
                where: {
                    company: {
                        members: {
                            some: { id: userId }
                        }
                    }
                },
                select: {
                    id: true,
                    assistant_id: true,
                    name: true,
                    state: true,
                    system_prompt: true,
                    company: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            return agents;
        }

        const agents = this.prisma.agent.findMany({
            select: {
                id: true,
                assistant_id: true,
                name: true,
                state: true,
                system_prompt: true,
                company: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return agents;
    }

    async createAgent(agentDto: CreateAgentDto) {
        let sys_prompt: string | null = "";
        try {
            const clientOpenAi = new OpenAI({
                apiKey: agentDto.apiKey
            });

            const assistant = await clientOpenAi.beta.assistants.retrieve(agentDto.assistantId);

            sys_prompt = assistant.instructions;
        } catch (err) {
            throw new HttpException("The OpenAI ApiKey or Assistant id is invalid ", err);
        }

        const agent = await this.prisma.agent.create({
            data: {
                assistant_id: agentDto.assistantId,
                name: agentDto.name,
                system_prompt: sys_prompt && sys_prompt !== "" ? sys_prompt : undefined,
                company: {
                    connect: { id: agentDto.companyId }
                }
            },
            select: {
                id: true,
                name: true,
                assistant_id: true,
                company: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        const apiKeyToSafe = this.encryptService.encrypt(agentDto.apiKey);

        const apiKey = await this.prisma.agentApiKey.create({
            data: {
                key: apiKeyToSafe,
                name: "OPENAIAPIKEY",
                agent: {
                    connect: { id: agent.id }
                },
                keyPreview: agentDto.apiKey.slice(
                    -(agentDto.apiKey.length > 10 ? 7 : 1)
                ),
                integration: {
                    connectOrCreate: {
                        where: { name: "OpenAi" },
                        create: { name: "OpenAi" },
                    },
                },
            }
        });

        return agent;
    }

    async addToAllowedList(listAgentDto: CreateListEntryDto) {
        if (listAgentDto.listType === ListType.WHITELIST) {
            return await this.prisma.agentWhitelistEntry.create({
                data: {
                    agentId: listAgentDto.agentId,
                    scope: listAgentDto.scope,
                    identifier: listAgentDto.identifier
                }
            });
        }

        if (listAgentDto.listType === ListType.BLACKLIST) {
            return await this.prisma.agentBlacklistEntry.create({
                data: {
                    agentId: listAgentDto.agentId,
                    scope: listAgentDto.scope,
                    identifier: listAgentDto.identifier
                }
            });
        }

        throw new BadRequestException("There is no list to match the param.");
    }

    async deleteAllowedList(dto: DeletePermissionsList) {
        try {
            if (dto.listType === ListType.WHITELIST) {
                return await this.prisma.agentWhitelistEntry.delete({
                    where: {
                        id: dto.entryId
                    }
                });
            }

            if (dto.listType === ListType.BLACKLIST) {
                return await this.prisma.agentBlacklistEntry.delete({
                    where: {
                        id: dto.entryId
                    }
                });
            }

            throw new BadRequestException("There is no list to match the param.");
        } catch (err) {
            throw new BadRequestException("There was an error deleting the list" + err.toString());
        }
    }

    async updateAllowedList(dto: UpdatePermissionsList) {
        try {
            const updateData: Record<string, any> = {}

            if (dto.identifier !== null && dto.identifier !== undefined) {
                updateData.identifier = dto.identifier;
            }

            if (dto.scope !== null && dto.scope !== undefined) {
                updateData.scope = dto.scope;
            }

            if (Object.keys(updateData).length === 0) {
                throw new BadRequestException("There is nothing to update");
            }

            if (dto.listType === ListType.WHITELIST) {
                return await this.prisma.agentWhitelistEntry.update({
                    where: {
                        id: dto.entryId
                    },
                    data: updateData
                });
            }

            if (dto.listType === ListType.BLACKLIST) {
                return await this.prisma.agentBlacklistEntry.update({
                    where: {
                        id: dto.entryId
                    },
                    data: updateData
                });
            }

            throw new BadRequestException("There is no list to match the param.");
        } catch (err) {
            throw new BadRequestException("There was an error updating the list" + err.toString())
        }
    }

    async getWhiteOrBlackList(agentId: string, listType: string) {

        if (!agentId || !listType) {
            throw new BadRequestException("There is no agentId or listType");
        }

        if (listType === ListType.WHITELIST) {
            return await this.prisma.agentWhitelistEntry.findMany({ where: { agentId } });
        }
        if (listType === ListType.BLACKLIST) {
            return await this.prisma.agentBlacklistEntry.findMany({ where: { agentId } })
        }
        throw new BadRequestException("There is no valid list with that name");
    }

    async updateAgentPrompt(dto: UpdateSystemPromptDto) {
        const agentId = dto.agentId;
        const prompt = dto.prompt;

        try {
            await this.prisma.agent.update({
                where: {
                    id: agentId
                },
                data: {
                    system_prompt: prompt
                }
            });

            const agent = await this.prisma.agent.findUnique({
                where: {
                    id: agentId
                },
                select: {
                    assistant_id: true,
                    apiKeys: {
                        where: {
                            name: "OPENAIAPIKEY"
                        },
                        select: {
                            key: true
                        }
                    }
                }
            });

            if (!agent || agent.apiKeys.length === 0) {
                return { "changed": false };
            }

            const apiKeyDecoded = this.encryptService.decrypt(agent.apiKeys[0].key);

            const clientOpenAi = new OpenAI({
                apiKey: apiKeyDecoded
            });

            const updatedAssistant = await clientOpenAi.beta.assistants.update(
                agent.assistant_id,
                {
                    instructions: prompt
                }
            );

            console.log("The prompt agent was updated");

            return { "changed": true };
        } catch (err) {
            console.error("There is an error updating the agent prompt", err);
            return { "changed": false };
        }
    }

    async getAgentPrompt(agentId: string) {
        if (!agentId) {
            throw new BadRequestException("agentId is required for this path.")
        }

        return await this.prisma.agent.findUnique({
            where: {
                id: agentId
            },
            select: {
                system_prompt: true
            }
        });
    }

}
