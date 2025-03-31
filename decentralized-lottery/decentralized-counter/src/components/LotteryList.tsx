import React, { useState, useEffect } from 'react';

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

  // useEffect(() => {
    // const fetchLotteries = async () => {
      // try {
      //   const provider = new JsonRpcProvider();
        
      //   // Query for LotteryCreatedEvents
      //   const events = await provider.queryEvents({
      //     query: {
      //       MoveEventType: `${PACKAGE_ID}::decentralized_lottery::LotteryCreatedEvent`
      //     },
      //     limit: 50,
      //   });
        
      //   // Transform events into lottery objects
      //   const fetchedLotteries = events.data.map(event => {
      //     const parsedEvent = event.parsedJson as any;
      //     return {
      //       id: parsedEvent.id,
      //       name: parsedEvent.name,
      //       price: parsedEvent.price / 1_000_000_000, // Convert MIST to SUI
      //       startTime: parsedEvent.start_time,
      //       endTime: parsedEvent.end_time,
      //       createdAt: parsedEvent.created_at,
      //       createdBy: parsedEvent.created_by,
      //       ticketUrl: parsedEvent.ticket_url,
      //     };
      //   });
        
      //   setLotteries(fetchedLotteries);
      // } catch (error) {
      //   console.error('Error fetching lotteries:', error);
      // } finally {
      //   setLoading(false);
      // }
    // };
    
    // fetchLotteries();

    
  // }, []);

  // if (loading) {
  //   return <div className="loading">Loading lotteries...</div>;
  // }

  useEffect(() => {
    const dummyLotteries: Lottery[] = [
      {
        id: "1",
        name: "Mega SUI Jackpot",
        price: 10,
        startTime: Date.now() - 1000000, // Started in the past
        endTime: Date.now() + 5000000, // Ends in the future
        createdAt: Date.now() - 2000000,
        createdBy: "0x123",
        ticketUrl: "https://pbs.twimg.com/profile_images/1892528995352154112/dwu9PI0R_400x400.jpg",
      },
      {
        id: "2",
        name: "Sui Lucky Draw",
        price: 5,
        startTime: Date.now() + 1000000, // Starts in the future
        endTime: Date.now() + 7000000,
        createdAt: Date.now() - 1000000,
        createdBy: "0x456",
        ticketUrl: "https://pbs.twimg.com/profile_images/1892528995352154112/dwu9PI0R_400x400.jpg",
      },
      {
        id: "3",
        name: "Golden Sui Lottery",
        price: 20,
        startTime: Date.now() - 5000000,
        endTime: Date.now() - 1000000, // Ended in the past
        createdAt: Date.now() - 6000000,
        createdBy: "0x789",
        ticketUrl: "https://pbs.twimg.com/profile_images/1892528995352154112/dwu9PI0R_400x400.jpg",
      },
    ];
  
    setLotteries(dummyLotteries);
    setLoading(false);
  }, []);
  

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