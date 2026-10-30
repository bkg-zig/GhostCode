import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class VersionsService {
  constructor(private readonly db: DatabaseService) {}

  async createVersion(caveId: string, userId: string, summary?: string) {
    const version = await this.db.client.version.create({
      data: {
        caveId,
        authorUserId: userId,
        summary: summary || 'Auto-saved version',
        changeset: {},
        usedTokens: parseInt(process.env.TOKEN_COST_VERSION || '5'),
      },
    });

    return version;
  }

  async listVersions(caveId: string) {
    return this.db.client.version.findMany({
      where: { caveId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }
}
