import { Controller, Get, Post, Param, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { LotteryService } from './lottery.service';
import { LotteryData, TicketData } from 'src/types/lottery.type';

@Controller('lotteries')
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) {}

  @Post('createLottery')
  async createLottery(@Body() data: LotteryData) {
    return await this.lotteryService.createLottery(data);
  }

  @Get()
  async getAllLotteries() {
    return await this.lotteryService.getAllLotteries();
  }

  @Get(':id')
  async getLottery(@Param('id') id: string) {
    const lottery = await this.lotteryService.getLottery(id);
    if (!lottery) throw new NotFoundException('Lottery not found');
    return lottery;
  }

  @Post(':id/buy')
  async buyTicket(@Param('id') id: string, @Body() data: TicketData) {
    return await this.lotteryService.buyTicket(id, data);
  }

  @Post(':id/draw')
  async drawWinner(@Param('id') id: string) {
    return await this.lotteryService.drawWinner(id);
  }

  @Post(':id/withdraw')
  async withdraw(@Param('id') id: string, @Body() data: { account: string }) {
    return await this.lotteryService.withdraw(id, data.account);
  }

  @Get(':id/tickets')
  async getTickets(@Param('id') id: string) {
    return await this.lotteryService.getTicketsByLotteryId(id);
  }
}
