import { IsString, IsUUID } from "class-validator"


export class UpdateIntegrationStatus {
    @IsUUID()
    agentId: string;

    @IsString()
    integration: string

    @IsString()
    status: string
}