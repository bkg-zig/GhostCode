import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TokensService {
  constructor(private readonly db: DatabaseService) {}

  async getBalance(userId: string) {
    const apiKey = await this.db.client.apiKey.findFirst({
      where: { userId, isActive: true },
    });

    return {
      balance: apiKey?.tokenBalance || 0,
      limit: apiKey?.tokenLimit,
    };
  }

  async recharge(userId: string, amount: number) {
    const apiKey = await this.db.client.apiKey.findFirst({
      where: { userId, isActive: true },
    });

    if (!apiKey) {
      throw new Error('No active API key found');
    }

    await this.db.client.apiKey.update({
      where: { id: apiKey.id },
      data: { tokenBalance: { increment: amount } },
    });

    await this.db.client.tokenUsage.create({
      data: {
        userId,
        projectId: (await this.db.client.project.findFirst({ where: { userId } }))!.id,
        apiKeyId: apiKey.id,
        action: 'INSTALL',
        direction: 'CREDIT',
        tokens: amount,
      },
    });

    return { newBalance: apiKey.tokenBalance + amount };
  }
}
