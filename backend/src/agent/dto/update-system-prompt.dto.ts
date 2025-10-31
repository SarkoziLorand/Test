import { IsString, IsUUID } from "class-validator"


export class UpdateSystemPromptDto {
    @IsUUID()
    agentId: string;

    @IsString()
    prompt: string
}