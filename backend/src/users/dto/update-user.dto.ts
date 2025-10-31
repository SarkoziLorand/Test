import { IsEmail, IsOptional, IsString, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @MinLength(8) password?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
