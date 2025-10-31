import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { WhitelistScope } from '@prisma/client';

export enum ListType {
    WHITELIST = 'whitelist',
    BLACKLIST = 'blacklist',
}

export class UpdatePermissionsList {
    @IsUUID()
    entryId: string;

    @IsEnum(ListType, { message: 'listType must be either whitelist or blacklist' })
    listType: ListType;

    @IsOptional()
    @IsEnum(WhitelistScope, { message: 'scope must be GROUP, CONTACT, or ALL' })
    scope?: WhitelistScope;

    @IsOptional()
    @IsString()
    identifier?: string;
}
