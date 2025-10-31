import { ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { combineAll } from 'rxjs';
import { CompanyUserConnectionDto } from './dto/create-company-user.dto';

@Injectable()
export class CompaniesService {

    constructor(private prisma: PrismaService) { }

    async getCompaniesForUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true }, 
        });

        if (!user) throw new NotFoundException('Not valid user id.');

        let companies: {id: string; name: string; status: CompanyStatus}[] = [];
        if (user.role === 'USER') {
            companies = await this.prisma.company.findMany({
                where: {
                    members: {
                        some: { id: userId },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    status: true,
                },
                orderBy: {
                    name: 'asc',
                },
            });
        } else {
            companies = await this.prisma.company.findMany({
                select: {
                    id: true,
                    name: true,
                    status: true
                }
            });
        }

        return companies;
    }

    async createCompany(companyDto: CreateCompanyDto) {

        const exists = await this.prisma.company.findUnique({
            where: {
                vat_number: companyDto.vat_number
            }
        });

        if(exists) throw new ConflictException("This vat number is alreay in use");

        const newCompany = this.prisma.company.create({
            data: {
                vat_number: companyDto.vat_number,
                email: companyDto.email,
                name: companyDto.name,
                address: companyDto.address ? companyDto.address.toString() : undefined,
                zip_code: companyDto.zip_code ? companyDto.zip_code.toString() : undefined,
                country: companyDto.country ? companyDto.country.toString() : undefined
            }
        });

        return newCompany;
    }

    async connectUserWithCompany(connection: CompanyUserConnectionDto) {
        if(!connection.companyId || !connection.userId)
            throw new HttpException("We should have company and user ids set.", HttpStatus.BAD_REQUEST);

        try {
            await this.prisma.company.update({
                where: { id: connection.companyId },
                data: { members: { connect: { id: connection.userId } } },
            });
        } catch(err) {
            throw new HttpException("An error has accoured when updating the db.", HttpStatus.BAD_REQUEST);
        }
    }

}
