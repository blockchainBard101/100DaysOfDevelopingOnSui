import React, { useState, useEffect } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, OWNER_OBJECT_ID, suiClient, apiUrl } from '../utils';
import axios from 'axios';

interface Lottery {
  id: string;
  name: string;
  price: number;
  startTime: number;
  endTime: number;
  creatorAddress: number;
  pricePool: number;
  createdBy: string;
  winningId: string;
  winnerAddress: string;
  ticketUrl: string;
  commissionWithdrawn: boolean;
  pricePoolWithdrawn: boolean;
}

interface LotteryDetailsProps {
  lottery: Lottery;
  onBack: () => void;
}

interface getWinner{
  id: string;
  name: string;
  winner: string;
  winningPrice: number;
  start_time: number;
  end_time: number;
  ticket_url: string;
  created_at: number;
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
  winningId: string;
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
  buyer: string,
  price_pool: number,
}

const LotteryDetails: React.FC<LotteryDetailsProps> = ({ lottery }) => {
  const wallet = useWallet();
  let account = wallet.account;
  const [withdrawnPrice, setWithdrawnPrice] = useState(false);
  const [price_pool, setPricePool] = useState(lottery.pricePool);
  const [withdrawnCommission, setWithdrawnCommission] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  // const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [determiningWinner, setDeterminingWinner] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // const isActive = Date.now() >= new Date(lottery.startTime).getTime() && Date.now() <= new Date(lottery.endTime).getTime();
  const isEnded = Date.now() > new Date(lottery.endTime).getTime();
  const isCreator = account?.address === lottery?.creatorAddress.toString();
  const isUpcoming = Date.now() <= new Date(lottery.startTime).getTime()
  
  useEffect(() => {
    const fetchLotteryData = async () => {
      // console.log(lottery, account);
      try {
        const tickets = await axios.get(`${apiUrl}/${lottery.id}/tickets`);
        const fetchedTickets = tickets.data.map((ticket : any) => ({
          id: ticket.id,  
          number: ticket.ticketNumber,
          boughtAt: ticket.boughtAt,
          buyer: ticket.buyer,
        }));
        
        setTickets(fetchedTickets);
        
        // if (account) {
        //   setUserTickets(fetchedTickets.filter((ticket: any) => ticket.owner === account));
        // }
        
        if(lottery.winningId && lottery.winnerAddress){
          const winnerData = {
            id: lottery.id,
            winner: lottery.winnerAddress,
            winningId: lottery.winningId,
            winningPrice: lottery.price * tickets.data.length * 0.9,
          };
          setWinner(winnerData);
          setWithdrawnPrice(lottery.pricePoolWithdrawn);
          setWithdrawnCommission(lottery.commissionWithdrawn);
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
      const tx = new Transaction();
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
        // console.log('Bought ticket:', eventsResult);
        const eventData = eventsResult.data[0]?.parsedJson as TicketEvent
        const ticketData = {
            id: eventData.id,
            lotteryId: eventData.lotter_id,
            buyer: eventData.buyer,
            ticketNumber: eventData.ticket_number,
            boughtAt: eventData.bought_at,
            pricePool: eventData.price_pool,
        };
        setPricePool(eventData.price_pool / 1_000_000_000);
        // console.log(ticketData);
        try {
          await axios.post(`${apiUrl}/${lottery.id}/buy`, ticketData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
            console.error("Error creating lottery:", (error as any).response?.data || (error as any).message);
        }
      setTickets([...tickets, {
        id: eventData.id,
        number: ticketData.ticketNumber,
        boughtAt: new Date(Number(ticketData.boughtAt)),
        buyer: ticketData.buyer
      }]);
      }
      
    } catch (error) {
      console.error('Error buying ticket:', error);
      // alert('Failed to buy ticket. Check console for details.');
    } finally {
      setBuyingTicket(false);
    }
  };

  const handleDetermineWinner = async () => {
    if (!account) return;
    setDeterminingWinner(true);
    try {
      const tx = new Transaction();
      // Determine winner
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::determine_winner`,
        arguments: [
          tx.object(lottery.id),
          tx.object.random(),
          tx.object("0x6"),
        ],
      });
      
      // Execute transaction
      const txResult = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      const eventsResult = await suiClient.queryEvents({ query: { Transaction: txResult.digest } });
      if (eventsResult != undefined){
        // console.log('Winner determined:', eventsResult);
        const eventData = eventsResult.data[0]?.parsedJson as getWinner;
        const winnerData = {
          winning_id: eventData.winner
        }
        try {
          const response = await axios.post(`${apiUrl}/${lottery.id}/setWinner`, winnerData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          // console.log("winner selected:", response.data);
          setWinner({
            id: lottery.id,
            winningId: eventData.winner,
            winner: response.data,
            winningPrice: lottery.price * tickets.length * 0.9,
          });
        } catch (error) {
            console.error("Error creating lottery:", (error as any).response?.data || (error as any).message);
        }
      }
    } catch (error) {
      console.error('Error determining winner:', error);
      // alert('Failed to determine winner. Check console for details.');
    } finally {
      setDeterminingWinner(false);
    }
  };

  const handleWithdrawPrize = async () => {
    if (!account || !winner) return;
    setWithdrawing(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::withdraw_price`,
        arguments: [
          tx.object(lottery.id),
          tx.object(lottery.winningId),
          tx.object("0x6"),
        ],
      });
      
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      console.log(result);
      if (result){
        try {
          const response = await axios.post(`${apiUrl}/${lottery.id}/priceWithdrawn`);
          setWithdrawnPrice(response.data);
        } catch (error) {
            console.error("Error creating lottery:", (error as any).response?.data || (error as any).message);
        }
        
      }
      // console.log('Withdrew prize:', result);
      // alert('Prize withdrawn successfully!');
      
    } catch (error) {
      // console.error('Error withdrawing prize:', error);
      // alert('Failed to withdraw prize. Check console for details.');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawCommission = async () => {
    if (!account) return;
    setWithdrawing(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::withdraw_commission`,
        arguments: [
          tx.object(lottery.id),
          tx.object("0x6"),
        ],
      });
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      if (result){
        try {
          const response = await axios.post(`${apiUrl}/${lottery.id}/commissionWithdrawn`);
          // console.log(response.data);
          setWithdrawnCommission(response.data);
        } catch (error) {
            console.error("Error creating lottery:", (error as any).response?.data || (error as any).message);
        }
        
      }
      // console.log('Withdrew commission:', result);
      // alert('Commission withdrawn successfully!');
      
    } catch (error) {
      console.error('Error withdrawing commission:', error);
      // alert('Failed to withdraw commission. Check console for details.');
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
          <p>
            id: <a href={`https://suiscan.xyz/testnet/object/${lottery.id}`} target="_blank" rel="noopener noreferrer">
              {lottery.id.slice(0, 6)}...{lottery.id.slice(-4)}
            </a>
          </p>
          <p>Ticket Price: {lottery.price} SUI</p>
          <p>Start Time: {new Date(lottery.startTime).toLocaleString()}</p>
          <p>End Time: {new Date(lottery.endTime).toLocaleString()}</p>
          <p>Total Tickets Sold: {tickets.length}</p>
          <p>Prize Pool: {price_pool} SUI (approx.)</p>
          
          {isUpcoming && (
            <button 
              className="buy-ticket-button" 
              onClick={handleBuyTicket}
              disabled={buyingTicket}
            >
              {buyingTicket ? 'Buying...' : 'Buy Ticket'}
            </button>
          )}
          
          {isEnded && !winner && (
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
              <p>
                Winning Ticket: <a href={`https://suiscan.xyz/testnet/object/${winner.winningId}`} target="_blank" rel="noopener noreferrer">
                    {winner.winningId.slice(0, 6)}...{winner.winningId.slice(-4)}
                  </a>
                </p>
              <p>Prize Amount: {winner.winningPrice.toFixed(2)} SUI</p>
              
              {account?.address == lottery.winnerAddress && !withdrawnPrice && (
                <button 
                  className="withdraw-prize-button" 
                  onClick={handleWithdrawPrize}
                  disabled={withdrawing}
                >
                  {withdrawing ? 'Withdrawing...' : 'Withdraw Prize'}
                </button>
              )}
              
              {isCreator && !withdrawnCommission && (
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