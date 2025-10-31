import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyUserConnectionDto } from './dto/create-company-user.dto';

@Controller('companies')
export class CompaniesController {

    constructor(private readonly companieService: CompaniesService){}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getCompaniesForUser(@CurrentUser() user: any) {
        return await this.companieService.getCompaniesForUser(user.sub);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Post()
    async createCompany(@Body() dto : CreateCompanyDto) {
        return await this.companieService.createCompany(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Post('connection')
    async createcompanyuserconnection(@Body() dto : CompanyUserConnectionDto) {
        return await this.companieService.connectUserWithCompany(dto);
    }

}
