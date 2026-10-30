import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles('ADMIN')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('caves')
  @Roles('ADMIN')
  async getAllCaves() {
    return this.adminService.getAllCaves();
  }

  @Get('logs')
  @Roles('ADMIN')
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('stats')
  @Roles('ADMIN', 'DEV')
  async getStats() {
    return this.adminService.getStats();
  }
}
