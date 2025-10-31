import { IsString, IsUUID } from "class-validator"


export class CreateAgentDto {
    @IsUUID()
    companyId: string
    
    @IsString()
    name: string
    
    @IsString()
    assistantId: string
    
    @IsString()
    apiKey: string
}