import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddIntegrationToAgentDto } from './dto/add-integraion.dto';
import { UpdateIntegrationStatus } from './dto/udpate_integration_status.dto';
import { UpdateApiKeyForIntegration } from './dto/update-apikey.dto';
import { EncryptkeysService } from 'src/encryptkeys/encryptkeys.service';
import { UpdateAgentConfig } from './dto/update-agent-config.dto';

@Injectable()
export class AgentConfigService {

    constructor(
        private prismaService: PrismaService,
        private encryptService: EncryptkeysService
    ) { }


    async getAllConfigurationsForAgent(agentId: string, userId: string, userRole: Role) {
        const hasAccess = await this.verifyIfUserHasAccess(userId, agentId, userRole);

        console.log(hasAccess, userRole)

        if (!hasAccess) throw new UnauthorizedException('You are not allowed to see these');

        console.log("from here ? ");

        const [
            agentFlags,
            integrations,
            standaloneConfigs,
        ] = await Promise.all([
            this.prismaService.agentFlag.findMany({ where: { agentId } }),
            this.prismaService.integrations.findMany({
                select: {
                    id: true,
                    name: true,
                    apiKeys: {
                        where: { agentId },
                        select: { id: true, keyPreview: true, name: true },
                    },
                    agentConfig: {
                        where: { agentId },
                        select: { id: true, name: true, key: true },
                    },
                },
            }),
            this.prismaService.agentConfig.findMany({
                where: { agentId, integrationId: null },
                select: { id: true, name: true, key: true },
            }),
        ]);

        return {
            agentId,
            integrations: (integrations ?? []).map((it) => ({
                id: it.id,
                name: it.name,
                apiKeys: it.apiKeys ?? [],
                agentConfig: it.agentConfig ?? [],
            })),
            standaloneAgentConfigs: standaloneConfigs ?? [],
            agentFlags: agentFlags ?? [],
        };
    }

    async verifyIfUserHasAccess(userId: string, agentId: string, userRole: Role) {
        if (userRole === Role.ADMIN || userRole === Role.SUPERADMIN)
            return true;

        const isAllowed = await this.prismaService.agent.count({
            where: {
                id: agentId,
                company: {
                    members: {
                        some: {
                            id: userId
                        }
                    }
                }
            }
        });

        return !!isAllowed;
    }

    async getAllPossibleIntegrations() {
        console.log("helloooooooo1123123123ooo");
        const integrations = await this.prismaService.integrations.findMany({
            select: {
                name: true
            }
        });

        return integrations;
    }

    async updateStatusForAgentIntegration(dto: UpdateIntegrationStatus) {

        try {
            await this.prismaService.agentFlag.update({
                where: {
                    agentId_flagName: {
                        agentId: dto.agentId,
                        flagName: dto.integration,
                    },
                },
                data: {
                    status: dto.status,
                },
            });

        } catch (err) {
            console.log("There was an error updating the integration", err);
            throw new BadRequestException("There was a problem updating the integration flag");
        }

    }

    async addIntegrationToAgent(dto: AddIntegrationToAgentDto) {

        let flag: any = null;
        try {
            flag = await this.prismaService.agentFlag.create({
                data: {
                    agentId: dto.agentId,
                    flagName: dto.integration,
                    status: "OFF"
                }
            });
        } catch (err) {
            console.log("There was an error crating the flag");
        }

        if (!flag) {
            try {
                flag = await this.prismaService.agentFlag.findFirst({
                    where: {
                        flagName: dto.integration
                    }
                });
            } catch (err) {
                throw new BadRequestException("We could not create the integration for the agent");
            }
        }

        if (dto.integration === 'Smoobu') {

            let smoobu_api_key: any = null;
            let smoobu_partener_token: any = null;

            try {
                smoobu_api_key = await this.prismaService.agentApiKey.create({
                    data: {
                        agentId: dto.agentId,
                        key: "",
                        keyPreview: "",
                        name: "SMOOBUAPIKEY",
                        integrationId: "cmfph4ljl0000k1ow8p9yzvpi"
                    }
                });

                smoobu_partener_token = await this.prismaService.agentApiKey.create({
                    data: {
                        agentId: dto.agentId,
                        key: "",
                        keyPreview: "",
                        name: "SMOOBUPARTENERTOKEN",
                        integrationId: "cmfph4ljl0000k1ow8p9yzvpi"
                    }
                });
            } catch (err) {
                console.log("There was an error putting the smobu cred or they exist");
            }

            if (!smoobu_api_key || !smoobu_api_key) {
                throw new BadRequestException("Something went wrong when setting up smoobu credentials.");
            }

            return true;
        }

        if (dto.integration === "ElevenLabs") {
            let elevenlabsapikey: any = null;
            let elevenlabsprompt: any = null;

            try {
                elevenlabsapikey = await this.prismaService.agentApiKey.create({
                    data: {
                        agentId: dto.agentId,
                        key: "",
                        keyPreview: "",
                        name: "ELEVENLABSAPIKEY",
                        integrationId: "cmfph5e0y0000k13odpqnhtqz"
                    }
                });

                elevenlabsprompt = await this.prismaService.agentConfig.create({
                    data: {
                        agentId: dto.agentId,
                        key: "You are a helpful assistant for hotels and HORECA.",
                        name: "ELEVENLABSPROMPT",
                        integrationId: "cmfph5e0y0000k13odpqnhtqz"
                    }
                });
            } catch (err) {
                console.log("There was an error putting the smobu cred or they exist");
            }

            if (!elevenlabsapikey || !elevenlabsprompt) {
                throw new BadRequestException("Something went wrong when setting up smoobu credentials.");
            }

            return true;
        }

        if (dto.integration === 'WhatsApp') {

            return true;
        }

        throw new BadRequestException("That integration is not available");
    }

    async updateAgentConfigs(dto: UpdateAgentConfig) {
        try {
            await this.prismaService.agentConfig.update({
                where: {
                    id: dto.entryId
                },
                data: {
                    key: dto.key
                }
            });
        } catch (err) {
            console.log("There was an error updating the agent configs.", err);
            throw new BadRequestException("There was an error updating the agent configs.");
        }
    }

    async updateApiKeyForIntegration(dto: UpdateApiKeyForIntegration) {
        try {

            const keyToSafe = this.encryptService.encrypt(dto.keyPreview);

            await this.prismaService.agentApiKey.update({
                where: {
                    id: dto.entryId
                },
                data: {
                    key: keyToSafe,
                    keyPreview: dto.keyPreview.slice(
                        -(dto.keyPreview.length > 10 ? 7 : 1)
                    ),
                }
            })

        } catch (err) {
            console.log("Error when updating api key", err);
            throw new BadRequestException("There was an error updating the ApiKey");
        }
    }

    async getPhoneNumberForAgent(agentId: string) {
        try {
            return await this.prismaService.agent.findUnique({
                where: {
                    id: agentId
                },
                select: {
                    phoneNumber: true
                }
            });
        } catch (err) {
            throw new BadRequestException("There is an error with your request for phone number");
        }
    }

}
