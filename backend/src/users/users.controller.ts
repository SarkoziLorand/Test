import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {

    constructor(private readonly userService: UsersService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@CurrentUser() user: any) {
        return this.userService.safeUser(user.sub);
    }

}
