export type LotteryData = {
  id: string;
  name: string;
  description: string;
  ticketPrice: bigint;
  startTime: Date;
  endTime: Date;
  creatorAddress: string;
  ticketUrl: string;
  createdAt: Date;
  pricePool: number;
};


export type TicketData = {
  id: string,
  lotteryId:  string,
  buyer: string,
  ticketNumber: number,
  boughtAt: Date,
  pricePool: number,
}