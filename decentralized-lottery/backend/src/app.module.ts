import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LotteryModule } from './lottery/lottery.module';

@Module({
  imports: [PrismaModule, LotteryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
