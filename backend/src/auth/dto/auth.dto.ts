import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString() name: string;
    @IsEmail() email: string;
    @MinLength(8) password: string;
}

export class LoginDto {
    @IsEmail() email: string;
    @IsString() password: string;
}

export class RefreshDto {
    @IsString() refreshToken: string;
}
