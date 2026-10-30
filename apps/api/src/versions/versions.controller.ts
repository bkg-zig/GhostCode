import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VersionsService } from './versions.service';

@ApiTags('versions')
@Controller('caves/versions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Post()
  async createVersion(@Request() req, @Body() body: { caveId: string; summary?: string }) {
    return this.versionsService.createVersion(body.caveId, req.user.userId, body.summary);
  }

  @Get(':caveId')
  async listVersions(@Param('caveId') caveId: string) {
    return this.versionsService.listVersions(caveId);
  }
}
