import { useState, useEffect } from 'react';
import './App.css';
import LotteryCreation from './components/LotteryCreation';
import LotteryDetails from './components/LotteryDetails';
import LotteryList from './components/LotteryList';
import Header from './components/Header';
import { ConnectButton, useWallet, WalletProvider } from "@suiet/wallet-kit";

// Contract constants
const PACKAGE_ID = 'PACKAGE_ID';
const OWNER_OBJECT_ID = 'OWNER_OBJECT_ID';

function App() {
  return (
    <WalletProvider>
      <div className="app-container">
        <Header />
        <MainContent />
      </div>
    </WalletProvider>
  );
}

function MainContent() {
  const { connected } = useWallet();
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'details', 'create'

  if (!connected) {
    return (
      <div className="connect-wallet-container">
        <h2>Connect your wallet to use the Decentralized Lottery</h2>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="navigation">
        <button onClick={() => { setView('list'); setSelectedLottery(null); }}>All Lotteries</button>
        <button onClick={() => setView('create')}>Create Lottery</button>
      </div>

      {view === 'list' && (
        <LotteryList
          onSelectLottery={(lottery) => {
            setSelectedLottery(lottery);
            setView('details');
          }}
        />
      )}

      {view === 'details' && selectedLottery && (
        <LotteryDetails
          lottery={selectedLottery}
          onBack={() => {
            setSelectedLottery(null);
            setView('list');
          }}
        />
      )}

      {view === 'create' && (
        <LotteryCreation
          onCreated={() => {
            setView('list');
          }}
        />
      )}
    </div>
  );
}

export default App;