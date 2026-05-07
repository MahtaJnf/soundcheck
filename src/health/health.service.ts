import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async check() {
    await this.prismaService.$queryRaw`SELECT 1 AS result`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
