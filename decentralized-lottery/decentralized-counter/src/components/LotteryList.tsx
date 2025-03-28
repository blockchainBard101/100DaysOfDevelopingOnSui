import React, { useState, useEffect } from 'react';
import { JsonRpcProvider } from '@mysten/sui';

const PACKAGE_ID = 'YOUR_PACKAGE_ID';

interface Lottery {
  id: string;
  name: string;
  price: number;
  startTime: number;
  endTime: number;
  createdAt: number;
  createdBy: string;
  ticketUrl: string;
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
        const provider = new JsonRpcProvider();
        
        // Query for LotteryCreatedEvents
        const events = await provider.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::decentralized_lottery::LotteryCreatedEvent`
          },
          limit: 50,
        });
        
        // Transform events into lottery objects
        const fetchedLotteries = events.data.map(event => {
          const parsedEvent = event.parsedJson as any;
          return {
            id: parsedEvent.id,
            name: parsedEvent.name,
            price: parsedEvent.price / 1_000_000_000, // Convert MIST to SUI
            startTime: parsedEvent.start_time,
            endTime: parsedEvent.end_time,
            createdAt: parsedEvent.created_at,
            createdBy: parsedEvent.created_by,
            ticketUrl: parsedEvent.ticket_url,
          };
        });
        
        setLotteries(fetchedLotteries);
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
                {Date.now() < lottery.startTime ? (
                  <span className="status upcoming">Upcoming</span>
                ) : Date.now() < lottery.endTime ? (
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