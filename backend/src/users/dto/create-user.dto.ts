import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsOptional() @IsEnum(Role) role?: Role; 
}
