import React, { useState, useEffect } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = 'YOUR_PACKAGE_ID';
const OWNER_OBJECT_ID = 'YOUR_OWNER_OBJECT_ID';

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
  boughtAt: number;
}

interface Winner {
  id: string;
  winner: string;
  winningPrice: number;
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

  const isActive = Date.now() >= lottery.startTime && Date.now() <= lottery.endTime;
  const isEnded = Date.now() > lottery.endTime;
  const isCreator = account?.address === lottery.createdBy;
  
  useEffect(() => {
    const fetchLotteryData = async () => {
      try {
        const provider = new useSuiProvider();
        
        // Fetch tickets for this lottery
        const ticketEvents = await provider.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::decentralized_lottery::LotteryTicketBuyEvent`,
            MoveEventField: {
              path: "/id",
              value: lottery.id
            }
          },
          limit: 100,
        });
        
        const fetchedTickets = ticketEvents.data.map(event => {
          const parsedEvent = event.parsedJson as any;
          return {
            id: parsedEvent.id,
            number: parsedEvent.ticket_number,
            boughtAt: parsedEvent.bought_at,
          };
        });
        
        setTickets(fetchedTickets);
        
        if (account) {
          // Filter user's tickets
          // This is simplified - in reality you'd need to query tickets by owner
          // which requires additional indexing or querying the contract objects
          setUserTickets(fetchedTickets.filter(ticket => {
            // Placeholder for ticket ownership check
            return false; // Replace with actual logic
          }));
        }
        
        // Check if winner has been determined
        const winnerEvents = await provider.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::decentralized_lottery::LotteryWinnerEvent`,
            MoveEventField: {
              path: "/id",
              value: lottery.id
            }
          },
          limit: 1,
        });
        
        if (winnerEvents.data.length > 0) {
          const winnerEvent = winnerEvents.data[0].parsedJson as any;
          setWinner({
            id: winnerEvent.id,
            winner: winnerEvent.winner,
            winningPrice: winnerEvent.winning_price / 1_000_000_000, // Convert MIST to SUI
          });
        }
      } catch (error) {
        console.error('Error fetching lottery data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLotteryData();
  }, [lottery, account]);

  const handleBuyTicket = async () => {
    if (!account) return;
    
    setBuyingTicket(true);
    try {
    //   const provider = new JsonRpcProvider();
      
      // Get the Clock object and lottery object
      const tx = new Transaction();
      
      const [clock] = tx.moveCall({
        target: '0x6::clock::clock',
      });
      
      // Create SUI coin for payment
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(lottery.price * 1_000_000_000)]); // Convert SUI to MIST
      
      // Buy ticket
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::buy_ticket`,
        arguments: [
          tx.object(OWNER_OBJECT_ID),
          tx.object(lottery.id),
          coin,
          clock,
        ],
      });
      
      // Execute transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      
      console.log('Bought ticket:', result);
      
      // Refresh ticket list
      setTickets([...tickets, {
        id: 'new-ticket', // Placeholder ID, would need to fetch the actual one
        number: tickets.length,
        boughtAt: Date.now(),
      }]);
      
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
    //   const provider = new JsonRpcProvider();
      
      // Create transaction to determine winner
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
    //   const provider = new JsonRpcProvider();
      
      // This is simplified - in a real app you'd need to:
      // 1. Determine if the current user owns the winning ticket
      // 2. Get the ticket object ID
      
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
        transactionBlock: tx,
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
      <button className="back-button" onClick={onBack}>← Back to Lotteries</button>
      
      <div className="lottery-header">
        <div className="lottery-image-large">
          <img src={lottery.ticketUrl} alt={lottery.name} />
        </div>
        
        <div className="lottery-info-large">
          <h2>{lottery.name}</h2>
          <p className="lottery-status">
            {Date.now() < lottery.startTime ? (
              <span className="status upcoming">Upcoming</span>
            ) : Date.now() < lottery.endTime ? (
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
          
          {isActive && (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LotteryDetails;