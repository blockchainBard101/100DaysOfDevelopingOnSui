import React, { useState, useEffect } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, OWNER_OBJECT_ID, suiClient } from '../utils';
import axios from 'axios';

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

interface LotteryDetailsProps {
  lottery: Lottery;
  onBack: () => void;
}

interface Ticket {
  id: string;
  number: number;
  boughtAt: Date;
  buyer: string
}

interface Winner {
  id: string;
  winner: string;
  winningPrice: number;
}

interface TicketEvent {
  id: string,
  name: string,
  price: number,
  start_time: string,
  ticket_number: number,
  end_time: string,
  bought_at: number,
  created_at: number,
  ticket_url: number,
  lotter_id: string,
  buyer: string
}

const LotteryDetails: React.FC<LotteryDetailsProps> = ({ lottery, onBack }) => {
  const wallet = useWallet();
  let account = wallet.account;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [determiningWinner, setDeterminingWinner] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const isActive = Date.now() >= new Date(lottery.startTime).getTime() && Date.now() <= new Date(lottery.endTime).getTime();
  const isEnded = Date.now() > new Date(lottery.endTime).getTime();
  const isCreator = account?.address === lottery.createdBy;
  const isUpcoming = Date.now() <= new Date(lottery.startTime).getTime()
  
  useEffect(() => {
    const fetchLotteryData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/lotteries/${lottery.id}/tickets`);
        const fetchedTickets = response.data.map((ticket : any) => ({
          id: ticket.id,
          number: ticket.ticketNumber,
          boughtAt: ticket.boughtAt,
          buyer: ticket.buyer,
        }));
        
        setTickets(fetchedTickets);
        
        if (account) {
          setUserTickets(fetchedTickets.filter((ticket: any) => ticket.owner === account));
        }
        
        // // Check if winner has been determined
        // const winnerEvents = await provider.queryEvents({
        //   query: {
        //     MoveEventType: `${PACKAGE_ID}::decentralized_lottery::LotteryWinnerEvent`,
        //     MoveEventField: {
        //       path: "/id",
        //       value: lottery.id
        //     }
        //   },
        //   limit: 1,
        // });
        
        // if (winnerEvents.data.length > 0) {
        //   const winnerEvent = winnerEvents.data[0].parsedJson as any;
        //   setWinner({
        //     id: winnerEvent.id,
        //     winner: winnerEvent.winner,
        //     winningPrice: winnerEvent.winning_price / 1_000_000_000, // Convert MIST to SUI
        //   });
        // }
      } catch (error) {
        console.error('Error fetching lottery data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLotteryData();
  }, [lottery, account]);

//   useEffect(() => {
//     const fetchLotteryData = async () => {
//         // Simulating fetched ticket data
//         const fetchedTickets = [
//             { id: 'ticket_001', number: 1, boughtAt: Date.now() - 50000, buyer: "0x11" },
//             { id: 'ticket_002', number: 2, boughtAt: Date.now() - 40000, buyer: "0x11" },
//             { id: 'ticket_003', number: 3, boughtAt: Date.now() - 30000 , buyer: "0x11"},
//         ];
//         setTickets(fetchedTickets);

//         if (account) {
//             // Simulate filtering user-owned tickets (assuming user owns ticket_002)
//             setUserTickets(fetchedTickets.filter(ticket => ticket.id === 'ticket_002'));
//         }

//         // Simulating fetched winner data
//         // const dummyWinner = {
//         //     id: lottery.id,
//         //     winner: '0xabcdef123456789',
//         //     winningPrice: fetchedTickets.length * lottery.price * 0.9, // Simulate 90% of the prize pool
//         // };
//         // setWinner(dummyWinner);

//         setLoading(false);
//     };

//     fetchLotteryData();
// }, [lottery, account]);


  const handleBuyTicket = async () => {
    if (!account) return;
    setBuyingTicket(true);
    try {
      const tx = new Transaction();
      // Create SUI coin for payment
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(lottery.price * 1_000_000_000)]); // Convert SUI to MIST
      
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::buy_ticket`,
        arguments: [
          tx.object(OWNER_OBJECT_ID),
          tx.object(lottery.id),
          coin,
          tx.object("0x6"),
        ],
      });
      
      const txResult = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      const eventsResult = await suiClient.queryEvents({ query: { Transaction: txResult.digest } });
      if (eventsResult != undefined){
        console.log('Bought ticket:', eventsResult);
        const eventData = eventsResult.data[0]?.parsedJson as TicketEvent
        const ticketData = {
            id: eventData.id,
            lotteryId: eventData.lotter_id,
            buyer: eventData.buyer,
            ticketNumber: eventData.ticket_number,
            boughtAt: eventData.bought_at,
        };
        try {
          const response = await axios.post(`http://localhost:3000/lotteries/${lottery.id}/buy`, ticketData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log("Lottery created:", response.data);
      } catch (error) {
          console.error("Error creating lottery:", error.response?.data || error.message);
      }
      // Refresh ticket list
      setTickets([...tickets, {
        id: eventData.id, // Placeholder ID, would need to fetch the actual one
        number: ticketData.ticketNumber,
        boughtAt: new Date(Number(ticketData.boughtAt)),
        buyer: ticketData.buyer
      }]);
      }
      
    } catch (error) {
      console.error('Error buying ticket:', error);
      alert('Failed to buy ticket. Check console for details.');
    } finally {
      setBuyingTicket(false);
    }
  };

  const handleDetermineWinner = async () => {
    if (!account) return;
    
    setDeterminingWinner(true);
    try {
      const tx = new Transaction();
      
      const [clock] = tx.moveCall({
        target: '0x6::clock::clock',
      });
      
      // Get a random object
      // In actual implementation, you'd use a proper random generator from Sui
      const [random] = tx.moveCall({
        target: '0x2::random::new_generator',
        arguments: [
          tx.object('0x6'), // Placeholder for a proper entropy source ID
        ],
      });
      
      // Determine winner
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::determine_winner`,
        arguments: [
          tx.object(lottery.id),
          random,
          clock,
        ],
      });
      
      // Execute transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      
      console.log('Determined winner:', result);
      
      // Refresh winner info
      // This is simplified - would need to query the updated object or events
      setWinner({
        id: lottery.id,
        winner: 'pending-fetch', // Placeholder
        winningPrice: lottery.price * tickets.length * 0.9, // Approximation accounting for commissions
      });
      
    } catch (error) {
      console.error('Error determining winner:', error);
      alert('Failed to determine winner. Check console for details.');
    } finally {
      setDeterminingWinner(false);
    }
  };

  const handleWithdrawPrize = async () => {
    if (!account || !winner) return;
    
    setWithdrawing(true);
    try {
      const tx = new Transaction();
      
      const [clock] = tx.moveCall({
        target: '0x6::clock::clock',
      });
      
      // Withdraw prize
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::withdraw_price`,
        arguments: [
          tx.object(lottery.id),
          tx.object('YOUR_TICKET_OBJECT_ID'), // You'd need to find the user's winning ticket ID
          clock,
        ],
      });
      
      // Execute transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      
      console.log('Withdrew prize:', result);
      alert('Prize withdrawn successfully!');
      
    } catch (error) {
      console.error('Error withdrawing prize:', error);
      alert('Failed to withdraw prize. Check console for details.');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawCommission = async () => {
    if (!account) return;
    
    setWithdrawing(true);
    try {
    //   const provider = new JsonRpcProvider();
      
      const tx = new Transaction();
      
      const [clock] = tx.moveCall({
        target: '0x6::clock::clock',
      });
      
      // Withdraw commission
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::withdraw_commission`,
        arguments: [
          tx.object(lottery.id),
          clock,
        ],
      });
      
      // Execute transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      
      console.log('Withdrew commission:', result);
      alert('Commission withdrawn successfully!');
      
    } catch (error) {
      console.error('Error withdrawing commission:', error);
      alert('Failed to withdraw commission. Check console for details.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading lottery details...</div>;
  }

  return (
    <div className="lottery-details">      
      <div className="lottery-header">
        <div className="lottery-image-large">
          <img src={lottery.ticketUrl} alt={lottery.name} />
        </div>
        
        <div className="lottery-info-large">
          <h2>{lottery.name}</h2>
          <p className="lottery-status">
            {Date.now() < new Date(lottery.startTime).getTime() ? (
              <span className="status upcoming">Upcoming</span>
            ) : Date.now() < new Date(lottery.endTime).getTime() ? (
              <span className="status active">Active</span>
            ) : (
              <span className="status ended">Ended</span>
            )}
          </p>
          <p>Ticket Price: {lottery.price} SUI</p>
          <p>Start Time: {new Date(lottery.startTime).toLocaleString()}</p>
          <p>End Time: {new Date(lottery.endTime).toLocaleString()}</p>
          <p>Total Tickets Sold: {tickets.length}</p>
          <p>Prize Pool: {(lottery.price * tickets.length * 0.9).toFixed(2)} SUI (approx.)</p>
          
          {isUpcoming && (
            <button 
              className="buy-ticket-button" 
              onClick={handleBuyTicket}
              disabled={buyingTicket}
            >
              {buyingTicket ? 'Buying...' : 'Buy Ticket'}
            </button>
          )}
          
          {isEnded && !winner && isCreator && (
            <button 
              className="determine-winner-button" 
              onClick={handleDetermineWinner}
              disabled={determiningWinner}
            >
              {determiningWinner ? 'Processing...' : 'Determine Winner'}
            </button>
          )}
          
          {winner && (
            <div className="winner-info">
              <h3>Winner Determined!</h3>
              <p>Winning Ticket: {winner.winner.substring(0, 10)}...</p>
              <p>Prize Amount: {winner.winningPrice.toFixed(2)} SUI</p>
              
              {/* This logic is simplified - you'd need to check if user owns the winning ticket */}
              {account && (
                <button 
                  className="withdraw-prize-button" 
                  onClick={handleWithdrawPrize}
                  disabled={withdrawing}
                >
                  {withdrawing ? 'Withdrawing...' : 'Withdraw Prize'}
                </button>
              )}
              
              {isCreator && (
                <button 
                  className="withdraw-commission-button" 
                  onClick={handleWithdrawCommission}
                  disabled={withdrawing}
                >
                  {withdrawing ? 'Withdrawing...' : 'Withdraw Commission'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="lottery-tickets">
        <h3>Tickets Sold</h3>
        {tickets.length === 0 ? (
          <p>No tickets sold yet.</p>
        ) : (
          <div className="ticket-grid">
            {tickets.map(ticket => (
              <div key={ticket.id} className="ticket-card">
                <p>Ticket #{ticket.number}</p>
                <p>Purchased: {new Date(ticket.boughtAt).toLocaleString()}</p>
                <p>
                  id: <a href={`https://suiscan.xyz/testnet/object/${ticket.id}`} target="_blank" rel="noopener noreferrer">
                    {ticket.id.slice(0, 6)}...{ticket.id.slice(-4)}
                  </a>
                </p>
                <p>
                  Buyer: <a href={`https://suiscan.xyz/address/${ticket.buyer}`} target="_blank" rel="noopener noreferrer">
                    {ticket.buyer.slice(0, 6)}...{ticket.buyer.slice(-4)}
                  </a>
                </p>
              </div>
            ))}
          </div>

        )}
      </div>
    </div>
  );
};

export default LotteryDetails;