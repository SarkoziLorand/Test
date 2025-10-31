import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappGateway } from './whatsapp.gateway';
import { ChatLockService } from './chat-lock.service';
import { ThreadMappingService } from './thread-mapping.service';
import { QueueService } from './queue.service';
import { AiService } from './ai.service';
import { OcrService } from '../ocr/orc.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EncryptkeysModule } from 'src/encryptkeys/encryptkeys.module';


@Module({
  imports: [
    EncryptkeysModule,
    AuthModule,      
    PrismaModule, 
  ],
  providers: [WhatsappService, WhatsappGateway, ChatLockService, ThreadMappingService, QueueService, AiService, OcrService],
  controllers: [WhatsappController]
})
export class WhatsappModule { }
