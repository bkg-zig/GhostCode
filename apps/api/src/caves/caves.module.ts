import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CavesController } from './caves.controller';
import { CavesService } from './caves.service';
import { ApiKeyGuard } from '../auth/guards/apikey.guard';

@Module({
  imports: [AuthModule],
  controllers: [CavesController],
  providers: [CavesService, ApiKeyGuard],
  exports: [CavesService],
})
export class CavesModule {}
