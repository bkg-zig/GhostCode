import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TokensService } from './tokens.service';

@ApiTags('tokens')
@Controller('user/tokens')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return this.tokensService.getBalance(req.user.userId);
  }

  @Post('recharge')
  async recharge(@Request() req, @Body() body: { amount: number }) {
    return this.tokensService.recharge(req.user.userId, body.amount);
  }
}
