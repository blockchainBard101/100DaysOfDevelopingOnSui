import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LotteryService {
  constructor(private prisma: PrismaService) {}

  async createLottery(data: any) {
    return await this.prisma.lottery.create({ data });
  }

  async getAllLotteries() {
    return await this.prisma.lottery.findMany();
  }

  async getLottery(id: string) {
    return await this.prisma.lottery.findUnique({ where: { id } });
  }

  async buyTicket(lotteryId: string, buyer: string) {
    const lottery = await this.prisma.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery) throw new NotFoundException('Lottery not found');

    return await this.prisma.ticket.create({
      data: {
        lotteryId,
        buyer,
        ticketNumber: Math.floor(Math.random() * 1000), // Replace with smart contract logic if needed
      },
    });
  }

  async drawWinner(lotteryId: string) {
    const lottery = await this.prisma.lottery.findUnique({ where: { id: lotteryId }, include: { tickets: true } });
    if (!lottery || lottery.tickets.length === 0) throw new BadRequestException('No tickets sold');

    const winnerTicket = lottery.tickets[Math.floor(Math.random() * lottery.tickets.length)];
    
    await this.prisma.lottery.update({
      where: { id: lotteryId },
      data: { winnerId: winnerTicket.id },
    });

    return { message: 'Winner selected', winner: winnerTicket.buyer };
  }

  async withdraw(lotteryId: string, account: string) {
    const lottery = await this.prisma.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery || !lottery.winnerId) throw new BadRequestException('No winner declared');

    // Implement smart contract logic for payout here
    return { message: 'Winnings withdrawn', account, amount: 100 }; // Replace with blockchain logic
  }
}
