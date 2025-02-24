"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getObject } from "./utils";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const PACKAGE_ID = "0x4b344f8b316f0c7cd70941a1ff750d91ae703384c512e6f0de26e1f6b7b77357";
const GLOBAL_COUNTER = "0x8cec41d1cd30ec456edd4bbe86f70f7daff3aacd0447e8defb4414d3105293ac";

export default function Home() {
  const [globalCounter, setGlobalCounter] = useState(0);
  const [counters, setCounters] = useState<{ [id: string]: number }>({});
  useEffect(() => {
    try {
      const savedCounters = localStorage.getItem("user_counters");
      if (savedCounters) setCounters(JSON.parse(savedCounters));
    } catch (error) {
      console.error("Failed to parse localStorage data:", error);
    }
  }, []);


  const wallet = useWallet();
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  useEffect(() => {
    fetchCounters();
  }, []);

  useEffect(() => {
    localStorage.setItem("user_counters", JSON.stringify(counters));
  }, [Object.keys(counters).length]);
  
  const fetchCounters = useCallback(async () => {
    try {
      const global_count = await getObject(GLOBAL_COUNTER);
      setGlobalCounter(global_count);
    } catch (error) {
      console.error("Failed to fetch counters:", error);
    }
  }, []);

  const fetchEventsWithRetry = async (txDigest : string, maxRetries = 5, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await client.queryEvents({ query: { Transaction: txDigest } });
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const handleTx = async (action: string, counterId : string | null = null) => {
    try {
      const tx = new Transaction();
      const isGlobal = counterId === GLOBAL_COUNTER;
  
      tx.moveCall({
        target: `${PACKAGE_ID}::simple_counter::${action}`,
        arguments: counterId ? [tx.object(counterId)] : [],
      });
  
      const txResult = await wallet.signAndExecuteTransaction({ transaction: tx });
      const eventsResult = await fetchEventsWithRetry(txResult.digest);
      if (eventsResult != undefined){
        // const eventData = eventsResult.data[0]?.parsedJson;
        const eventData = eventsResult.data[0]?.parsedJson as { id: string; value: number };
        if (!eventData) throw new Error("No event data found");
        if (isGlobal) {
          setGlobalCounter(eventData.value);
        } else {
          setCounters((prev) => {
            const updatedCounters = { ...prev };
            if (action === "delete_counter") delete updatedCounters[counterId as string];
            else updatedCounters[eventData.id] = eventData.value;
            return updatedCounters;
          });
        }
    }
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };
  

  const countersList = useMemo(() => (
    Object.entries(counters).map(([id, value]) => (
      <li key={id} className="flex flex-col items-center bg-gray-100 p-4 rounded-lg shadow-lg border border-gray-300 mb-4 w-full max-w-xs sm:max-w-sm md:max-w-md">
        <p className="text-lg font-semibold text-gray-800 flex flex-col items-center gap-2">
          <a href={`https://suiscan.xyz/testnet/object/${id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
            {id ? `${id.slice(0, 6)}...${id.slice(-4)}` : "Unknown"}
          </a>
          <span className="text-blue-500 text-xl font-bold mt-1">{value}</span>
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Button onClick={() => handleTx("increment", id)} disabled={!wallet.connected} className="bg-blue-500 text-white hover:bg-blue-600 px-3 py-1 rounded-md">
            ➕ Increment
          </Button>
          <Button onClick={() => handleTx("decrement", id)} disabled={!wallet.connected || value === 0} className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 rounded-md">
            ➖ Decrement
          </Button>
          <Button onClick={() => handleTx("delete_counter", id)} disabled={!wallet.connected} className="bg-gray-500 text-white hover:bg-gray-600 px-3 py-1 rounded-md">
            ❌ Delete
          </Button>
        </div>
      </li>
    ))
  ), [counters, wallet.connected]); // Depend only on counters and wallet status
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 text-gray-900 p-6 relative w-full">
      <div className="absolute top-4 right-6">
        <ConnectButton/>
      </div>
      <Card className="p-6 bg-white rounded-2xl shadow-2xl text-center border border-gray-200 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-blue-600">BlockchainBard Simple Counter</h1>
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Global Counter</h2>
          <a href={`https://suiscan.xyz/testnet/object/${GLOBAL_COUNTER}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
            {GLOBAL_COUNTER ? `${GLOBAL_COUNTER.slice(0, 6)}...${GLOBAL_COUNTER.slice(-4)}` : "Connect Wallet"}
          </a>
          <p className="text-4xl sm:text-5xl font-bold my-3 text-blue-500">{globalCounter}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => handleTx("increment", GLOBAL_COUNTER)} disabled={!wallet.connected} className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg shadow-md">
              ➕ Increment
            </Button>
            <Button onClick={() => handleTx("decrement", GLOBAL_COUNTER)} disabled={!wallet.connected || globalCounter === 0} className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg shadow-md">
              ➖ Decrement
            </Button>
          </div>
        </div>
        <Button onClick={() => handleTx("create_counter", null)} disabled={!wallet.connected} className="bg-green-500 text-white hover:bg-green-600 px-5 py-2 rounded-lg shadow-md mt-4">
          🎉 Create Counter
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold mt-8 text-gray-700">Your Counters</h2>
        <ul className="mt-4 w-full flex flex-col items-center">
        {countersList} {/* Use the memoized list here */}
      </ul>
      </Card>
    </div>
  );


}

