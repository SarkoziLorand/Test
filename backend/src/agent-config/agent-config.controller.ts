import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AgentConfigService } from './agent-config.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AddIntegrationToAgentDto } from './dto/add-integraion.dto';
import { UpdateIntegrationStatus } from './dto/udpate_integration_status.dto';
import { UpdateApiKeyForIntegration } from './dto/update-apikey.dto';
import { UpdateAgentConfig } from './dto/update-agent-config.dto';

@Controller('agent-config')
export class AgentConfigController {

    constructor(private configService: AgentConfigService) { }

    @UseGuards(JwtAuthGuard)
    @Get('cfg/:agentId')
    async getAllConfigs(@CurrentUser() user: any, @Param('agentId') agentId) {
        console.log("we get here ?", agentId);
        console.log(user);
        return await this.configService.getAllConfigurationsForAgent(agentId, user.sub, user.role);
    }

    @UseGuards(JwtAuthGuard)
    @Get('integrations')
    async getAllIntegrations() {
        return await this.configService.getAllPossibleIntegrations();
    }

    @UseGuards(JwtAuthGuard)
    @Post('integrations')
    async addIntegrationToAgent(@Body() dto: AddIntegrationToAgentDto) {
        return await this.configService.addIntegrationToAgent(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('integrations-status')
    async updateIntegrationStatus(@Body() dto: UpdateIntegrationStatus) {
        return await this.configService.updateStatusForAgentIntegration(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('apikeys')
    async updateApiKeyForIntegration(@Body() dto: UpdateApiKeyForIntegration) {
        return await this.configService.updateApiKeyForIntegration(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('agentcfg')
    async updateAgentConfig(@Body() dto: UpdateAgentConfig) {
        return await this.configService.updateAgentConfigs(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('phone-number/:agentId')
    async getPhoneNumberForAgent(@Param('agentId') agentId: string) {
        return await this.configService.getPhoneNumberForAgent(agentId);
    }

}
