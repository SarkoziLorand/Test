import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";


export class CreateCompanyDto {
    @IsString() 
    @MinLength(5, {message: "A company name should have at least 5 chars."})
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(3, {message: "You vat number should be longer than 3 chars."})
    vat_number: string;

    @IsOptional()
    @IsString()
    country: string

    @IsOptional()
    @IsString()
    zip_code: string

    @IsOptional()
    @IsString()
    address: String
}