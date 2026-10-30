import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { CavesService } from './caves.service';
import { ApiKeyGuard } from '../auth/guards/apikey.guard';

class FileWriteDto {
  @IsString()
  @MinLength(1)
  path: string;

  @IsString()
  content: string;
}

class FileRenameDto {
  @IsString()
  @MinLength(1)
  path: string;

  @IsString()
  @MinLength(1)
  newPath: string;
}

@ApiTags('caves')
@Controller('caves')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CavesController {
  constructor(private readonly cavesService: CavesService) {}

  @Get('list')
  async listCaves(@Request() req) {
    return this.cavesService.listCaves(req.user.userId);
  }

  @Post('create')
  async createCave(@Request() req, @Body() body: { name: string; language: string }) {
    return this.cavesService.createCave(req.user.userId, body.name, body.language);
  }

  @Get(':id')
  async getCave(@Param('id') id: string, @Request() req) {
    return this.cavesService.getCave(id, req.user.userId);
  }

  @Get(':id/files')
  async listFiles(@Param('id') id: string, @Request() req) {
    return this.cavesService.listFiles(id, req.user.userId);
  }

  @Get(':id/files/content')
  async getFileContent(@Param('id') id: string, @Query('path') path: string, @Request() req) {
    return this.cavesService.getFileContent(id, req.user.userId, path);
  }

  @Put(':id/files')
  async writeFile(@Param('id') id: string, @Request() req, @Body() dto: FileWriteDto) {
    return this.cavesService.writeFile(id, req.user.userId, dto);
  }

  @Post(':id/files/rename')
  async renameFile(@Param('id') id: string, @Request() req, @Body() dto: FileRenameDto) {
    return this.cavesService.renameFile(id, req.user.userId, dto);
  }

  @Delete(':id/files')
  async deleteFile(@Param('id') id: string, @Query('path') path: string, @Request() req) {
    return this.cavesService.deleteFile(id, req.user.userId, path);
  }

  @Post('execute')
  @UseGuards(ApiKeyGuard)
  async executeCave(@Request() req, @Body() body: { caveId: string; code: string }) {
    return this.cavesService.executeCave(body.caveId, body.code, req.user.userId, req.apiKey);
  }
}
