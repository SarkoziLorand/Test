import { Module } from '@nestjs/common';
import { EncryptkeysService } from './encryptkeys.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EncryptkeysService],
  exports: [EncryptkeysService]
})
export class EncryptkeysModule { }
