import { IsString } from "class-validator";


export class CompanyUserConnectionDto {
    @IsString()
    userId: string;

    @IsString()
    companyId: string;
}