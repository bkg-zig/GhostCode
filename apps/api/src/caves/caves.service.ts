import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ApiKey } from '@ghost/database';
import { createHash } from 'crypto';
import { posix as pathPosix } from 'path';

@Injectable()
export class CavesService {
  constructor(private readonly db: DatabaseService) {}

  async createCave(userId: string, name: string, language: string) {
    const project = await this.db.client.project.findFirst({
      where: { userId },
      include: { caves: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.caves.length >= project.maxCaves) {
      throw new BadRequestException(`Max caves limit reached (${project.maxCaves})`);
    }

    const cave = await this.db.client.cave.create({
      data: {
        projectId: project.id,
        name,
        language: language.toUpperCase() as any,
        ramMb: parseInt(process.env.CAVE_DEFAULT_RAM_MB || '512'),
        cpuMillicores: parseInt(process.env.CAVE_DEFAULT_CPU_MILLICORES || '500'),
        tokensPerRun: parseInt(process.env.TOKEN_COST_RUN || '50'),
        status: 'ACTIVE',
      },
    });

    await this.db.client.auditEvent.create({
      data: {
        actorUserId: userId,
        entityType: 'CAVE',
        entityId: cave.id,
        action: 'CREATE',
        payload: { name, language },
      },
    });

    return cave;
  }

  async listCaves(userId: string) {
    const project = await this.db.client.project.findFirst({
      where: { userId },
      include: {
        caves: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return project?.caves || [];
  }

  private async requireCave(caveId: string, userId: string) {
    const cave = await this.db.client.cave.findFirst({
      where: {
        id: caveId,
        project: { userId },
      },
      select: { id: true, projectId: true },
    });

    if (!cave) {
      throw new NotFoundException('Cave not found');
    }

    return cave;
  }

  private normalizePath(input: string): string {
    if (typeof input !== 'string') {
      throw new BadRequestException('File path must be a string');
    }

    const trimmed = input.trim();
    if (!trimmed) {
      throw new BadRequestException('File path is required');
    }

    const withForwardSlashes = trimmed.replace(/\\/g, '/');
    const normalized = pathPosix.normalize(withForwardSlashes);
    if (normalized.startsWith('..') || normalized.startsWith('/')) {
      throw new BadRequestException('Invalid file path');
    }

    return normalized;
  }

  async listFiles(caveId: string, userId: string) {
    const cave = await this.requireCave(caveId, userId);
    const files = await this.db.client.file.findMany({
      where: { caveId: cave.id },
      select: {
        path: true,
        size: true,
        updatedAt: true,
      },
      orderBy: [{ path: 'asc' }],
    });

    return {
      files: files.map((file) => ({
        path: file.path,
        name: file.path.split('/').pop(),
        size: file.size,
        updatedAt: file.updatedAt,
      })),
    };
  }

  async getFileContent(caveId: string, userId: string, rawPath: string | undefined) {
    if (!rawPath) {
      throw new BadRequestException('File path is required');
    }

    const cave = await this.requireCave(caveId, userId);
    const normalizedPath = this.normalizePath(rawPath);

    const file = await this.db.client.file.findFirst({
      where: {
        caveId: cave.id,
        path: normalizedPath,
      },
      include: { blob: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return {
      path: file.path,
      name: file.path.split('/').pop(),
      content: file.blob.content.toString('utf-8'),
      size: file.size,
      updatedAt: file.updatedAt,
    };
  }

  async writeFile(
    caveId: string,
    userId: string,
    dto: { path: string; content: string },
  ) {
    const cave = await this.requireCave(caveId, userId);
    const normalizedPath = this.normalizePath(dto.path);
    const content = dto.content ?? '';
    const buffer = Buffer.from(content, 'utf-8');
    const size = buffer.byteLength;
    const sha = createHash('sha256').update(buffer).digest('hex');

    const file = await this.db.client.$transaction(async (tx) => {
      await tx.fileBlob.upsert({
        where: { sha },
        create: {
          sha,
          content: buffer,
        },
        update: {},
      });

      return tx.file.upsert({
        where: {
          caveId_path: {
            caveId: cave.id,
            path: normalizedPath,
          },
        },
        update: {
          contentSha: sha,
          size,
        },
        create: {
          caveId: cave.id,
          path: normalizedPath,
          contentSha: sha,
          size,
        },
      });
    });

    return {
      path: file.path,
      name: file.path.split('/').pop(),
      size: file.size,
      updatedAt: file.updatedAt,
    };
  }

  async renameFile(
    caveId: string,
    userId: string,
    dto: { path: string; newPath: string },
  ) {
    const cave = await this.requireCave(caveId, userId);
    const fromPath = this.normalizePath(dto.path);
    const toPath = this.normalizePath(dto.newPath);

    if (fromPath === toPath) {
      throw new BadRequestException('New path must be different from current path');
    }

    const updated = await this.db.client.$transaction(async (tx) => {
      const existing = await tx.file.findFirst({
        where: {
          caveId: cave.id,
          path: fromPath,
        },
      });

      if (!existing) {
        throw new NotFoundException('File not found');
      }

      const target = await tx.file.findFirst({
        where: {
          caveId: cave.id,
          path: toPath,
        },
      });

      if (target) {
        throw new BadRequestException('Target path already exists');
      }

      return tx.file.update({
        where: { id: existing.id },
        data: { path: toPath },
      });
    });

    return {
      path: updated.path,
      name: updated.path.split('/').pop(),
      size: updated.size,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteFile(caveId: string, userId: string, rawPath: string | undefined) {
    if (!rawPath) {
      throw new BadRequestException('File path is required');
    }

    const cave = await this.requireCave(caveId, userId);
    const normalizedPath = this.normalizePath(rawPath);

    await this.db.client.$transaction(async (tx) => {
      const file = await tx.file.findFirst({
        where: {
          caveId: cave.id,
          path: normalizedPath,
        },
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      await tx.file.delete({
        where: { id: file.id },
      });

      const remaining = await tx.file.count({
        where: { contentSha: file.contentSha },
      });

      if (remaining === 0) {
        await tx.fileBlob.delete({
          where: { sha: file.contentSha },
        });
      }
    });

    return { path: normalizedPath };
  }

  async getCave(caveId: string, userId: string) {
    const cave = await this.db.client.cave.findFirst({
      where: {
        id: caveId,
        project: { userId },
      },
      include: {
        files: true,
        versions: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!cave) {
      throw new NotFoundException('Cave not found');
    }

    return cave;
  }

  async executeCave(caveId: string, code: string, userId: string, apiKey: ApiKey) {
    const cave = await this.getCave(caveId, userId);
    if (!apiKey || apiKey.userId !== userId) {
      throw new BadRequestException('API key does not belong to the authenticated user');
    }

    if (apiKey.tokenBalance < cave.tokensPerRun) {
      throw new BadRequestException('Insufficient tokens');
    }

    const ghostServerUrl = process.env.GHOST_SERVER_URL;
    const ghostServerApiKey = process.env.GHOST_SERVER_API_KEY || process.env.GHOST_API_KEY;
    const ghostLogWsUrl = process.env.GHOST_LOG_WS_URL;

    if (!ghostServerUrl || !ghostServerApiKey) {
      throw new InternalServerErrorException('Ghost server configuration missing');
    }

    const sanitizeUrl = (value: string) => value.replace(/\/$/, '');
    let response: Response;
    try {
      response = await fetch(`${sanitizeUrl(ghostServerUrl)}/api/caves/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ghostServerApiKey}`,
        },
        body: JSON.stringify({
          cave_id: cave.id,
          language: String(cave.language).toLowerCase(),
          code,
        }),
      });
    } catch (error) {
      throw new InternalServerErrorException('Unable to reach ghost execution service');
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.jobId) {
      const detail =
        (payload && (payload.detail || payload.error)) ||
        `Ghost server responded with status ${response.status}`;
      throw new BadRequestException(detail);
    }

    const updatedKey = await this.db.client.apiKey.update({
      where: { id: apiKey.id },
      data: { tokenBalance: { decrement: cave.tokensPerRun } },
    });

    await this.db.client.tokenUsage.create({
      data: {
        userId,
        projectId: cave.projectId,
        caveId: cave.id,
        apiKeyId: apiKey.id,
        action: 'RUN',
        direction: 'DEBIT',
        tokens: cave.tokensPerRun,
      },
    });

    const baseWsUrl = ghostLogWsUrl
      ? sanitizeUrl(ghostLogWsUrl)
      : `${sanitizeUrl(ghostServerUrl.replace(/^http/, 'ws'))}/ws/logs`;

    return {
      jobId: payload.jobId,
      logStreamUrl: `${baseWsUrl}/${payload.jobId}`,
      tokensUsed: cave.tokensPerRun,
      tokenBalance: updatedKey.tokenBalance,
    };
  }
}
