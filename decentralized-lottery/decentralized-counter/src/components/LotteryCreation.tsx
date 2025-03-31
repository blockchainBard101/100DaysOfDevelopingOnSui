import React, { useState } from 'react';
import { useWallet } from "@suiet/wallet-kit";
// import { JsonRpcProvider} from '@mysten/sui';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = 'YOUR_PACKAGE_ID';
const OWNER_OBJECT_ID = 'YOUR_OWNER_OBJECT_ID';

interface LotteryCreationProps {
  onCreated: () => void;
}

const LotteryCreation: React.FC<LotteryCreationProps> = ({ onCreated }) => {
  const wallet = useWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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
    //   const provider = new JsonRpcProvider();
      
      // Convert times to timestamps
      const startTimeMs = new Date(startTime).getTime();
      const endTimeMs = new Date(endTime).getTime();
      
      // Create transaction block
      const tx = new Transaction();
      
      // Get the Clock object
      const [clock] = tx.moveCall({
        target: '0x6::clock::clock',
      });
      
      // Create lottery
      tx.moveCall({
        target: `${PACKAGE_ID}::decentralized_lottery::create_lottery`,
        arguments: [
          tx.object(OWNER_OBJECT_ID),
          tx.pure(name),
          tx.pure(description),
          tx.pure(Number(ticketPrice) * 1_000_000_000), // Convert SUI to MIST
          tx.pure(startTimeMs),
          tx.pure(endTimeMs),
          tx.pure(Buffer.from(ticketUrl).toString('hex')),
          clock,
        ],
      });
      
      // Execute transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      
      console.log('Created lottery:', result);
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
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>End Time</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
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