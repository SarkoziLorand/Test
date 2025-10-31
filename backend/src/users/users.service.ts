import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async createLocal(dto: CreateUserDto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new ConflictException('Email already in use');
        const passwordHash = await argon2.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
                role: 'USER',
            },
        });
        return this.safe(user);
    }

    async safeUser(id: string) {
        console.log(id);
        const user = await this.prisma.user.findUnique({ where: { id } });
        return this.safe(user);
    }

    private safe(user: any) {
        if (!user) return null;
        const { passwordHash, ...rest } = user;
        return rest;
    }

    async validateUser(email: string, password: string) {
        console.log(email);
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;
        const ok = await argon2.verify(user.passwordHash, password);
        if (!ok) return null;
        return this.safe(user);
    }

    async updateUser(id: string, dto: UpdateUserDto) {
        const data: any = { ...dto };
        if (dto.password) {
            data.passwordHash = await argon2.hash(dto.password);
            delete data.password;
        }
        const user = await this.prisma.user.update({ where: { id }, data });
        return this.safe(user);
    }
}
