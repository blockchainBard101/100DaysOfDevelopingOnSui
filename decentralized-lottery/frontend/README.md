# 🎰 Decentralized Lottery dApp on Sui

A decentralized, on-chain lottery application built using React, Sui Move smart contracts, and the Suiet Wallet Kit. This dApp enables users to create, participate in, and manage lottery games securely and transparently on the Sui blockchain. Tickets are minted as NFTs, and prizes are distributed programmatically once a winner is determined.

## 🚀 Features

- 🎟️ Buy lottery tickets using SUI
- 🧠 Determine lottery winner on-chain
- 💰 Withdraw prize and commission funds
- 🛠️ React frontend integrated with Suiet Wallet
- 🔗 On-chain events synced to backend via REST API
- 🧾 NFTs as tickets for verifiability and traceability

---
0x054f652174f93b2bbcc078b669ab04da07e129175443ea3ab372a46427c899f5
## 🛠️ Tech Stack

| Layer        | Tech                     |
|-------------|--------------------------|
| Blockchain   | [Sui Move](https://docs.sui.io/), Sui Testnet  |
| Wallet       | [Suiet Wallet Kit](https://docs.suiet.app/) |
| Frontend     | React + TypeScript       |
| API & Backend| Node.js/Express + Axios |
| Storage      | Off-chain DB (e.g., MongoDB/PostgreSQL) for ticket history and state sync |
| Other Tools  | Axios, Tailwind CSS (optional), SuiJS SDK |

---

## 📦 Smart Contract Info

- **Package ID:** `PACKAGE_ID` *(replace with actual ID)*
- **Main Module:** `decentralized_lottery`
- **Key Functions:**
  - `buy_ticket`
  - `determine_winner`
  - `withdraw_price`
  - `withdraw_commission`

---


## 🧪 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/sui-lottery-dapp.git
cd sui-lottery-dapp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a `.env` file with:

```env
VITE_PACKAGE_ID=0x...
VITE_OWNER_OBJECT_ID=0x...
VITE_API_URL=https://your-backend-api.com
```

### 4. Run the dApp

```bash
npm run dev
```

---

## 🔐 Wallet Integration

This dApp uses [Suiet Wallet Kit](https://docs.suiet.app/) for wallet connection and transaction signing.

Make sure to:
- Install the Suiet browser extension.
- Connect to **Testnet** before interacting with the app.

---

## 🔄 Backend API (Expected Routes)

| Route | Method | Description |
|-------|--------|-------------|
| `/:lotteryId/tickets` | GET | Get all tickets for a lottery |
| `/:lotteryId/buy` | POST | Save ticket info to database |
| `/:lotteryId/setWinner` | POST | Store winner in backend |
| `/:lotteryId/priceWithdrawn` | POST | Mark prize as withdrawn |
| `/:lotteryId/commissionWithdrawn` | POST | Mark commission as withdrawn |

> Replace `:lotteryId` with the actual lottery object ID.

---


## 🧑‍💻 Contributing

PRs are welcome! Open an issue to discuss changes or bugs before starting a major refactor.

---

## 📜 License

MIT ©blockchainBard
