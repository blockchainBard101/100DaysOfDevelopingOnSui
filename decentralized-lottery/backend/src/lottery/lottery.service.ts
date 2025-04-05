import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LotteryData, TicketData } from 'src/types/lottery.type';
import { Logger } from '@nestjs/common';

@Injectable()
export class LotteryService {
  constructor(private prisma: PrismaService) {}

  async createLottery(data: LotteryData) {
    const existingLottery = await this.prisma.prismaClient.lottery.findUnique({
      where: {
        id: data.id
      }
    });

    if (existingLottery) {
      // Logger.warn(`Lottery with ID ${data.id} already exists`, 'LotteryService');
      // throw new Error(`Lottery with ID ${data.id} already exists`);
      // Or return false if you prefer not to throw an error
      return false;
    }
    

    const ticketPrice = BigInt(data.ticketPrice);
    const startTime = new Date(Number(data.startTime));
    const endTime = new Date(Number(data.endTime))
    const createdAt = new Date(Number(data.createdAt))
    const lottery = await this.prisma.prismaClient.lottery.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        ticketPrice,
        startTime, 
        endTime,
        creatorAddress: data.creatorAddress,
        ticketUrl: data.ticketUrl,
        createdAt,
        pricePool: data.pricePool,
      },
    });

    // console.log(lottery);
    return true;
  }

  async getAllLotteries() {
    return await this.prisma.prismaClient.lottery.findMany();
  }

  async getLottery(id: string) {
    return await this.prisma.prismaClient.lottery.findUnique({ where: { id } });
  }

  async buyTicket(id, data: TicketData ) {
    const lottery = await this.prisma.prismaClient.lottery.findUnique({ where: { id } });
    if (!lottery) throw new NotFoundException('Lottery not found');
    const pricePool = Number(data.pricePool);
    await this.prisma.prismaClient.lottery.update({
      where: { id },
      data: { pricePool },
    });
    const boughtAt = new Date(Number(data.boughtAt))
    const ticketNumber = Number(data.ticketNumber)
    await this.prisma.prismaClient.ticket.create({
      data: {
        id: data.id,
        lotteryId: data.lotteryId,
        buyer: data.buyer,
        ticketNumber,
        boughtAt,
      },
    });
    return true
  }

  async setWinner(lotteryId: string, data: { winning_id: string }) {
    const lottery = await this.prisma.prismaClient.lottery.findUnique({ where: { id: lotteryId }, include: { tickets: true } });
    if (!lottery || lottery.tickets.length === 0) throw new BadRequestException('No tickets sold');

    const winningTicket = lottery.tickets.find(ticket => ticket.id === data.winning_id);
    
    await this.prisma.prismaClient.lottery.update({
      where: { id: lotteryId },
      data: { winnerId: data.winning_id, winnerAddress: winningTicket?.buyer },
    });

    return winningTicket?.buyer ;
  }

  async priceWithdrawn(lotteryId: string) {
    const lottery = await this.prisma.prismaClient.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery || !lottery.winnerId) throw new BadRequestException('No winner declared');
    
    await this.prisma.prismaClient.lottery.update({
      where: { id: lotteryId },
      data: { pricePoolWithdrawn: true },
    });

    return true;
  }

  async commissionWithdrawn(lotteryId: string) {
    const lottery = await this.prisma.prismaClient.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery || !lottery.winnerId) throw new BadRequestException('No winner declared');
    await this.prisma.prismaClient.lottery.update({
      where: { id: lotteryId },
      data: { commissionWithdrawn: true },
    });
    return true;
  }

  async getTicketsByLotteryId(lotteryId: string) {
    const tickets = await this.prisma.prismaClient.ticket.findMany({
      where: { lotteryId },
    });
    // console.log('tickets', tickets);
  
    // if (!tickets.length) throw new NotFoundException('No tickets found for this lottery');
  
    return tickets;
  }
  
}
