import React, { useState } from 'react';
import { useWallet } from "@suiet/wallet-kit";
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, OWNER_OBJECT_ID } from '../utils';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { suiClient } from '../utils';

interface LotteryCreationProps {
  onCreated: () => void;
}

type CreatedEvent = {
  created_at: string; // Assuming it's a timestamp stored as a string
  created_by: string; // Ethereum/Sui address
  creator_commision_percentage: number;
  end_time: string; // Timestamp as a string
  id: string; // Unique identifier (hash)
  name: string;
  owner_commision_percentage: number;
  percentage_decimals: number;
  price: string; // Price as a string (probably a big number)
  start_time: string; // Timestamp as a string
  ticket_url: string; // URL
};

const LotteryCreation: React.FC<LotteryCreationProps> = ({ onCreated }) => {
  const wallet = useWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [ticketUrl, setTicketUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !ticketPrice || !startTime || !endTime || !ticketUrl) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      const startTimeMs = new Date(startTime).getTime();
      const endTimeMs = new Date(endTime).getTime();
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::create_lottery`,
        arguments: [
          tx.object(OWNER_OBJECT_ID),
          tx.pure.string(name),
          tx.pure.string(description),
          tx.pure.u64(Number(ticketPrice) * 1_000_000_000),
          tx.pure.u64(startTimeMs),
          tx.pure.u64(endTimeMs),
          tx.pure.vector("u8", new TextEncoder().encode(ticketUrl)),
          tx.object("0x6"),
        ],
      });

      const txResult = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      const eventsResult = await suiClient.queryEvents({ query: { Transaction: txResult.digest } });
      if (eventsResult != undefined){
        const eventData = eventsResult.data[0]?.parsedJson as CreatedEvent
        const lotteryData = {
            id: eventData.id,
            name: eventData.name,
            description: description,
            ticketPrice: eventData.price,
            startTime: eventData.start_time,
            endTime: eventData.end_time,
            creatorAddress: eventData.created_by,
            ticketUrl: eventData.ticket_url,
            createdAt: eventData.created_at,
            pricePool: 0
        };
        try {
            const response = await axios.post("http://localhost:3000/lotteries/createLottery", {
                ...lotteryData,
                ticketPrice: lotteryData.ticketPrice.toString()
            });
    
            console.log("Lottery created:", response.data);
        } catch (error) {
            console.error("Error creating lottery:", error.response?.data || error.message);
        }
        console.log(eventData);
        console.log(Number(ticketPrice) * 1_000_000_000);
      }
      console.log('Created lottery:');
      onCreated();
    } catch (error) {
      console.error('Error creating lottery:', error);
      alert('Failed to create lottery. Check console for details.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="lottery-creation">
      <h2>Create New Lottery</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lottery Name"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Lottery Description"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Ticket Price (SUI)</label>
          <input
            type="number"
            step="0.01"
            value={ticketPrice}
            onChange={(e) => setTicketPrice(e.target.value)}
            placeholder="0.1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Start Time</label>
          <DatePicker
            selected={startTime}
            onChange={(date) => setStartTime(date)}
            showTimeSelect
            dateFormat="Pp"
          />
        </div>

      <div className="form-group">
          <label>End Time</label>
          <DatePicker
            selected={endTime}
            onChange={(date) => setEndTime(date)}
            showTimeSelect
            dateFormat="Pp"
          />
        </div>
        
        <div className="form-group">
          <label>Ticket Image URL</label>
          <input
            type="text"
            value={ticketUrl}
            onChange={(e) => setTicketUrl(e.target.value)}
            placeholder="https://example.com/ticket-image.png"
            required
          />
        </div>
        
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Lottery'}
        </button>
      </form>
    </div>
  );
};

export default LotteryCreation;