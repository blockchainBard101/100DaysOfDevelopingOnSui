import { ConnectButton } from "@suiet/wallet-kit";

const Header = () => {
  // const { connected, account } = useWallet();
  
  return (
    <header className="header">
      <div className="logo">
        <h1>Decentralized Lottery</h1>
      </div>
      <div className="wallet-info">
        {/* {connected && account && (
          <div className="account-info">
            <span className="address">{`${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 4)}`}</span>
          </div>
        )} */}
        <ConnectButton />
      </div>
    </header>
  );
};

export default Header;