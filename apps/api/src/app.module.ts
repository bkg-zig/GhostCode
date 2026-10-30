import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CavesModule } from './caves/caves.module';
import { TokensModule } from './tokens/tokens.module';
import { VersionsModule } from './versions/versions.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    CavesModule,
    TokensModule,
    VersionsModule,
    AdminModule,
    WebsocketModule,
  ],
})
export class AppModule {}
