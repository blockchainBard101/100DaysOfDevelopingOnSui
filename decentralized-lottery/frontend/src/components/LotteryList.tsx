import React, { useState, useEffect } from 'react';
import axios from "axios";
import { apiUrl } from '../utils';

interface Lottery {
  id: string;
  name: string;
  price: number;
  startTime: number;
  endTime: number;
  createdAt: number;
  creatorAddress: string;
  pricePool: number;
  winningId: string;
  winnerAddress: string;
  ticketUrl: string;
  commissionWithdrawn: boolean;
  pricePoolWithdrawn: boolean;
}

interface LotteryListProps {
  onSelectLottery: (lottery: Lottery) => void;
}

const LotteryList: React.FC<LotteryListProps> = ({ onSelectLottery }) => {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLotteries = async () => {
      try {
        const response = await axios.get(`${apiUrl}`);
        // console.log(response.data);
        const formattedLotteries = response.data.map((lottery: any) => ({
          id: lottery.id,
          name: lottery.name,
          price: lottery.ticketPrice / 1_000_000_000,
          startTime: lottery.startTime,
          endTime: lottery.endTime,
          createdAt: lottery.createdAt,
          creatorAddress: lottery.creatorAddress,
          pricePool: lottery.pricePool / 1_000_000_000,
          winningId: lottery.winnerId,
          winnerAddress: lottery.winnerAddress,
          ticketUrl: lottery.ticketUrl,
          commissionWithdrawn: lottery.commissionWithdrawn,
          pricePoolWithdrawn: lottery.pricePoolWithdrawn,
        }));
        console.log(formattedLotteries);
        setLotteries(formattedLotteries);
      } catch (error) {
        console.error('Error fetching lotteries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLotteries();

    
  }, []);

  if (loading) {
    return <div className="loading">Loading lotteries...</div>;
  }


  if (lotteries.length === 0) {
    return <div className="no-lotteries">No lotteries found. Create one to get started!</div>;
  }

  return (
    <div className="lottery-list">
      <h2>Active Lotteries</h2>
      <div className="lottery-grid">
        {lotteries.map(lottery => (
          <div 
            key={lottery.id} 
            className="lottery-card"
            onClick={() => onSelectLottery(lottery)}
          >
            <div className="lottery-image">
              <img src={lottery.ticketUrl} alt={lottery.name} />
            </div>
            <div className="lottery-info">
              <h3>{lottery.name}</h3>
              <p>Price: {lottery.price} SUI</p>
              <p>Ends: {new Date(lottery.endTime).toLocaleDateString()}</p>
              <div className="lottery-status">
                {Date.now() < new Date(lottery.startTime).getTime() ? (
                  <span className="status upcoming">Upcoming</span>
                ) : Date.now() < new Date(lottery.endTime).getTime() ? (
                  <span className="status active">Active</span>
                ) : (
                  <span className="status ended">Ended</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LotteryList;