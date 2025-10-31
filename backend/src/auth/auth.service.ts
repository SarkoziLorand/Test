import { Injectable, UnauthorizedException, ForbiddenException, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import ms from 'ms';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';

@Injectable()
export class AuthService {
    constructor(
        private users: UsersService,
        private prisma: PrismaService,
        private jwt: JwtService,
        private cfg: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        const user = await this.users.createLocal(dto);
        const tokens = await this.issueTokens(user);
        return { user, ...tokens };
    }

    async login(dto: LoginDto) {
        const user = await this.users.validateUser(dto.email, dto.password);
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const tokens = await this.issueTokens(user);
        return { user, ...tokens };
    }

    async refresh(presentedToken: string) {
        const parsed: any = this.jwt.verify(presentedToken, { secret: this.cfg.get('JWT_REFRESH_SECRET') });

        console.log(parsed);
        const userId = parsed.sub as string;
        //if (parsed.sub !== userId) throw new UnauthorizedException();

        const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: await argon2.hash(presentedToken) } });

        const token = await this.prisma.refreshToken.findFirst({
            where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });
        if (!token || !(await argon2.verify(token.tokenHash, presentedToken))) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        await this.prisma.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
        const payload = await this.prisma.user.findUnique({ where: { id: userId } });
        const user = this.users['safe'](payload);
        const tokens = await this.issueTokens(user);
        return { user, ...tokens };
    }

    async logoutAll(userId: string) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return { success: true };
    }

    private async issueTokens(user: any) {
        const accessTtl = this.cfg.get('JWT_ACCESS_TTL') || '15m';
        const refreshTtl = this.cfg.get('JWT_REFRESH_TTL') || '30d';

        const accessPayload = { sub: user.id, role: user.role, email: user.email, typ: 'access' };
        const refreshPayload = { sub: user.id, typ: 'refresh' };

        const accessToken = await this.jwt.signAsync(accessPayload, {
            secret: this.cfg.get('JWT_ACCESS_SECRET'),
            expiresIn: accessTtl,
        });

        const decoded = this.jwt.decode(accessToken) as { exp?: number } | null;
        const accessExp =
            typeof decoded?.exp === 'number'
                ? decoded.exp
                : Math.floor((Date.now() + ms(accessTtl)) / 1000); 

        const refreshToken = await this.jwt.signAsync(refreshPayload, {
            secret: this.cfg.get('JWT_REFRESH_SECRET'),
            expiresIn: refreshTtl,
        });

        const tokenHash = await argon2.hash(refreshToken);
        const refreshExpDate = new Date(Date.now() + ms(refreshTtl));
        await this.prisma.refreshToken.create({
            data: { userId: user.id, tokenHash, expiresAt: refreshExpDate },
        });

        return {
            accessToken,
            accessExp,                         
            refreshToken,
            refreshExp: refreshExpDate.toISOString(), 
        };
    }
}

function ms(str: string): number {
    const m = str.match(/^(\d+)([smhd])$/i);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    return n * (unit === 's' ? 1e3 : unit === 'm' ? 60e3 : unit === 'h' ? 3600e3 : 86400e3);
}
