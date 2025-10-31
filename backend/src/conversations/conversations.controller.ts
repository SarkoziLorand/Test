import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('conversations')
export class ConversationsController {

    constructor(
        private conversationService: ConversationsService
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    list(@CurrentUser() user: any) {
        return user.role === Role.USER
            ? this.conversationService.findAllAgentChatsForUser(user.sub)
            : this.conversationService.findAllAgentChats();
    }
    
    @UseGuards(JwtAuthGuard)
    @Get(':chatId')
    getByChatId(@CurrentUser() user: any, @Param('chatId') chatId: string) {
        return user.role === Role.USER
            ? this.conversationService.getMessagesFromChatIdForUser(user.sub, chatId)
            : this.conversationService.getMessagesFromChatId(chatId);
    }


}
