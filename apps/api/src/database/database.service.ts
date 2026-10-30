import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@ghost/database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await prisma.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await prisma.$disconnect();
  }

  get client() {
    return prisma;
  }
}
