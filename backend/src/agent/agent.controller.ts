import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateAgentDto } from './dto/create-agetn.dto';
import { CreateListEntryDto } from './dto/list-agent-create.dto';
import { UpdateSystemPromptDto } from './dto/update-system-prompt.dto';
import { DeletePermissionsList } from './dto/detele-permission-list.dto';
import { UpdatePermissionsList } from './dto/update-permission-list.dto';


@Controller('agent')
export class AgentController {

    constructor(private readonly agentService: AgentService){}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getCompaniesForUser(@CurrentUser() user: any) {
        return await this.agentService.getAllAgentsForUsers(user.sub);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Post()
    async createAgent(@Body() agentDto : CreateAgentDto){
        return await this.agentService.createAgent(agentDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Post('permission-list')
    async addToWhiteOrBlackList(@Body() dto: CreateListEntryDto) {
        return await this.agentService.addToAllowedList(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Patch('permission-list')
    async updateToWhiteOrBlackList(@Body() dto: UpdatePermissionsList) {
        return await this.agentService.updateAllowedList(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Delete('permission-list')
    async deleteToWhiteOrBlackList(@Body() dto: DeletePermissionsList) {
        return await this.agentService.deleteAllowedList(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('permission-list')
    async getBlackOrWhiteList(
        @Query('agentId') agentId: string,
        @Query('listType') listType: string
    ) {
        return await this.agentService.getWhiteOrBlackList(agentId, listType);
    }

    @UseGuards(JwtAuthGuard) 
    @Patch('agent-prompt')
    async updateSystemPromptForAgent(@Body() dto: UpdateSystemPromptDto) {
        return await this.agentService.updateAgentPrompt(dto);
    }

    @UseGuards(JwtAuthGuard) 
    @Get('agent-prompt/:agentId')
    async getSystemPromptForAgent(@Param('agentId') agentId: string) {
        return await this.agentService.getAgentPrompt(agentId);
    }

     
}
