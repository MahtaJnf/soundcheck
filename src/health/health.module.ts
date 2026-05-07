import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule],
  providers: [HealthService],
  exports: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
