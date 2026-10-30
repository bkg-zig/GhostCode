import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async getAllUsers() {
    return this.db.client.user.findMany({
      include: {
        apiKeys: true,
        projects: { include: { caves: true } },
      },
    });
  }

  async getAllCaves() {
    return this.db.client.cave.findMany({
      include: {
        project: { include: { user: true } },
      },
    });
  }

  async getAuditLogs(limit = 100) {
    return this.db.client.auditEvent.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actorUser: true,
      },
    });
  }

  async getStats() {
    const [totalUsers, totalCaves, totalTokenUsage] = await Promise.all([
      this.db.client.user.count(),
      this.db.client.cave.count(),
      this.db.client.tokenUsage.aggregate({
        _sum: { tokens: true },
      }),
    ]);

    return {
      totalUsers,
      totalCaves,
      totalTokensUsed: totalTokenUsage._sum.tokens || 0,
    };
  }
}
