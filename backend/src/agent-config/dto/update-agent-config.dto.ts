import { IsString, IsUUID } from "class-validator"


export class UpdateAgentConfig {
    @IsUUID()
    entryId: string;

    @IsString()
    key: string
}