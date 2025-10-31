import { IsString, IsUUID } from "class-validator"


export class AddIntegrationToAgentDto {
    @IsUUID()
    agentId: string;

    @IsString()
    integration: string
}