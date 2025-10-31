import { IsString, IsUUID } from "class-validator"


export class UpdateApiKeyForIntegration {
    @IsUUID()
    entryId: string;

    @IsString()
    keyPreview: string
}