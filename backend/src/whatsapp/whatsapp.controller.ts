import { Controller, Post, Param, Get, HttpCode } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('agents/:agentId/whatsapp')
export class WhatsappController {
  constructor(private wapp: WhatsappService) {}

  @Post('start')
  async start(@Param('agentId') agentId: string) {
    await this.wapp.startClient(agentId);
    return { ok: true };
  }

  @Post('stop')
  async stop(@Param('agentId') agentId: string) {
    await this.wapp.stopClient(agentId);
    return { ok: true };
  }

  @Post('reset')
  async reset(@Param('agentId') agentId: string) {
    await this.wapp.resetSession(agentId);
    return { ok: true };
  }

  @Get('status')
  @HttpCode(200)
  async status(@Param('agentId') agentId: string) {
    return this.wapp.getStatus(agentId);
  }
}
