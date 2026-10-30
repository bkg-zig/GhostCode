import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    let apiKey: string | null = null;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    }

    if (!apiKey) {
      throw new UnauthorizedException('API key required (use Authorization: Bearer <api-key>)');
    }

    const result = await this.authService.validateApiKey(apiKey);
    
    if (!result) {
      throw new UnauthorizedException('Invalid API key');
    }
    request.apiKey = result.apiKey;
    request.apiKeyUser = result.user;
    
    return true;
  }
}
