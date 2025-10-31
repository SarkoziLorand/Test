import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }
    // TODO remove these
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ADMIN, Role.SUPERADMIN)
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.auth.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.auth.login(dto);
    }

    @Post('refresh')
    async refresh(@Body() dto: RefreshDto) {
        const payload = await this.auth.refresh(dto.refreshToken);
        return payload;
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Req() req: any) {
        return this.auth.logoutAll(req.user.sub);
    }
}
