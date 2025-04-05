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

  @Post(':id/priceWithdrawn')
  async priceWithdrawn(@Param('id') id: string) {
    return await this.lotteryService.priceWithdrawn(id);
  }

  @Post(':id/commissionWithdrawn')
  async commissionWithdrawn(@Param('id') id: string) {
    return await this.lotteryService.commissionWithdrawn(id);
  }

  @Post(':id/setWinner')
  async setWinner(@Param('id') id: string, @Body() data: { winning_id: string }) {
    return await this.lotteryService.setWinner(id, data);
  }

  @Get(':id/tickets')
  async getTickets(@Param('id') id: string) {
    // console.log('getTickets', id);
    return await this.lotteryService.getTicketsByLotteryId(id);
  }
}
