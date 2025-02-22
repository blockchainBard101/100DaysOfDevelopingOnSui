"use client";
import { useState, useEffect } from 'react';
// import { ConnectButton } from '@mysten/wallet-kit';
// import { JsonRpcProvider, devnetConnection } from '@mysten/sui.js';
import { Button} from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// const provider = new JsonRpcProvider(devnetConnection);
// const CONTRACT_ADDRESS = "<YOUR_SMART_CONTRACT_ADDRESS>";
export default function Home() {
  const [loading, setLoading] = useState(false);
  const [userCounters, setUserCounters] = useState([]);
  const [globalCounter, setGlobalCounter] = useState(0);

  const walletAddress = "0x716f3c01d2c8bc9e607aaf07725fc20ca82b2c0379e5d50a27752675291c254e";

  useEffect(() => {
    console.log(userCounters);
    fetchCounters();
  }, []);

  async function fetchCounters() {
    try {
      // const counters = await provider.getOwnedObjects({ owner: CONTRACT_ADDRESS });
      const counters = { data: [
        {
          id: "0x08b196c09fedb74a7fa8028205dcd5e80faab4f3f9507a35fd25e203afa4905e",
          data: {
            value: 0,
          }
        },
        {
          id: "0xe18e09468d946a1a14533907b4717bc7d7d0611931662439f1e2bfe98b140940",
          data: {
            value: 0,
          }
        },
        
      ] };
      setUserCounters(counters?.data || []);
      const totalValue = counters?.data.reduce((sum, counter) => sum + (counter.data?.value || 0), 0);
      setGlobalCounter(totalValue);
    } catch (error) {
      console.error("Failed to fetch counters:", error);
    }
  }

  async function handleTransaction(action: string, counterId: string) {
    setLoading(true);
    try {
      console.log(`Performing ${action} action on counter ${counterId}...`);
      // Simulate transaction logic
      setUserCounters(prevCounters =>
        prevCounters.map(counter =>
          counter.id === counterId
            ? { ...counter, data: { ...counter.data, value: action === "increment" ? counter.data.value + 1 : action === "decrement" ? counter.data.value - 1 : 0 } }
            : counter
        )
      );
      setGlobalCounter(prev => (action === "increment" ? prev + 1 : action === "decrement" ? prev - 1 : prev));
    } catch (error) {
      console.error("Transaction failed:", error);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 text-gray-900 p-6 relative w-full">
      <div className="absolute top-4 right-6">
        <Button className="bg-purple-500 text-white hover:bg-purple-600 px-4 py-2 rounded-lg shadow-md">
          🔗 Connect Wallet
        </Button>
      </div>
      <Card className="p-6 bg-white rounded-2xl shadow-2xl text-center border border-gray-200 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-blue-600">BlockchainBard's Simple Counter</h1>
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Global Counter</h2>
          <a href={`https://etherscan.io/address/${walletAddress}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
          </a>
          <p className="text-4xl sm:text-5xl font-bold my-3 text-blue-500">{globalCounter}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => setGlobalCounter(globalCounter + 1)} disabled={loading} className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg shadow-md">
              ➕ Increment
            </Button>
            <Button onClick={() => setGlobalCounter(globalCounter - 1)} disabled={loading || globalCounter === 0} className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg shadow-md">
              ➖ Decrement
            </Button>
          </div>
        </div>
        <Button onClick={() => handleTransaction("create", null)} disabled={loading} className="bg-green-500 text-white hover:bg-green-600 px-5 py-2 rounded-lg shadow-md mt-4">
          🎉 Create Counter
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold mt-8 text-gray-700">Your Counters</h2>
        <ul className="mt-4 w-full flex flex-col items-center">
          {userCounters.map((counter, index) => (
            <li key={counter.id} className="flex flex-col items-center bg-gray-100 p-4 rounded-lg shadow-lg border border-gray-300 mb-4 w-full max-w-xs sm:max-w-sm md:max-w-md">
              <p className="text-lg font-semibold text-gray-800 flex flex-col items-center gap-2">
                <a href={`https://etherscan.io/tx/${counter.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                  {counter.id ? `${counter.id.slice(0, 6)}...${counter.id.slice(-4)}` : "Unknown"}
                </a>
                <span className="text-blue-500 text-xl font-bold mt-1">{counter.data?.value || 0}</span>
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Button onClick={() => handleTransaction("increment", counter.id)} disabled={loading} className="bg-blue-500 text-white hover:bg-blue-600 px-3 py-1 rounded-md">
                  ➕ Increment
                </Button>
                <Button onClick={() => handleTransaction("decrement", counter.id)} disabled={loading || counter.data.value === 0} className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 rounded-md">
                  ➖ Decrement
                </Button>
                <Button onClick={() => handleTransaction("delete", counter.id)} disabled={loading} className="bg-gray-500 text-white hover:bg-gray-600 px-3 py-1 rounded-md">
                  ❌ Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );


}

