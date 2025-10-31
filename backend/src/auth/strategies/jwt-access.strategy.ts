import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(cfg: ConfigService) {
        const secret = cfg.get<string>('JWT_ACCESS_SECRET');
        if (!secret) {
            throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
        }
        
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: secret,
            ignoreExpiration: false,
        });
    }
    async validate(payload: any) {
        return payload;
    }
}