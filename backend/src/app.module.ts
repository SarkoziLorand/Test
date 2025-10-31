import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { ConfigModule } from '@nestjs/config';
import { CompaniesModule } from './companies/companies.module';
import { AgentModule } from './agent/agent.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { OcrModule } from './ocr/ocr.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AgentConfigModule } from './agent-config/agent-config.module';
import { EncryptkeysModule } from './encryptkeys/encryptkeys.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}),PrismaModule, UsersModule, AuthModule, CompaniesModule, AgentModule, WhatsappModule, OcrModule, ConversationsModule, AgentConfigModule, EncryptkeysModule],
  controllers: [UsersController, AuthController],
})
export class AppModule {}
