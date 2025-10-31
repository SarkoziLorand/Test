import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { WhitelistScope } from '@prisma/client';

export enum ListType {
  WHITELIST = 'whitelist',
  BLACKLIST = 'blacklist',
}

export class DeletePermissionsList {
  @IsUUID()
  entryId: string;

  @IsEnum(ListType, { message: 'listType must be either whitelist or blacklist' })
  listType: ListType;
}
