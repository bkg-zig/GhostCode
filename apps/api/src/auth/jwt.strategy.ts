import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.ghost_token || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.db.client.user.findUnique({
      where: { id: payload.sub },
      include: { apiKeys: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      apiKeyId: payload.apiKeyId,
    };
  }
}
