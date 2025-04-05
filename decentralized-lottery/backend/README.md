# 🎰 Decentralized Lottery API – Sui Chain

This project powers a decentralized lottery system built on the [Sui blockchain](https://sui.io). It indexes on-chain events into a PostgreSQL database via Prisma to provide fast, reliable access to lottery and ticket data.

## 🚀 Features

- Create and manage lotteries
- Buy tickets
- Set winners and handle withdrawals
- Fetch all lotteries and tickets
- Withdraw prize and commission funds
- Syncs blockchain events into an off-chain DB

---

## 📦 API Endpoints

All endpoints are prefixed with `/lotteries`.

### `POST /lotteries/createLottery`

**Description:** Create a new lottery.

**Body:**

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "ticketPrice": "100000000", 
  "startTime": "timestamp",
  "endTime": "timestamp",
  "creatorAddress": "string",
  "ticketUrl": "string",
  "createdAt": "timestamp",
  "pricePool": 0
}
```

**Response:**  
`true` on success or `false` if the lottery already exists.

---

### `GET /lotteries`

**Description:** Get all lotteries.

**Response:**  
Array of lottery objects.

---

### `GET /lotteries/:id`

**Description:** Get a single lottery by ID.

**Response:**  
Lottery object or 404 if not found.

---

### `POST /lotteries/:id/buy`

**Description:** Buy a ticket for a lottery.

**Body:**

```json
{
  "id": "ticket-id",
  "lotteryId": "lottery-id",
  "buyer": "wallet-address",
  "ticketNumber": 1,
  "boughtAt": "timestamp",
  "pricePool": 100
}
```

**Response:**  
`true` if successful.

---

### `POST /lotteries/:id/setWinner`

**Description:** Set the winning ticket for a lottery.

**Body:**

```json
{
  "winning_id": "ticket-id"
}
```

**Response:**  
Returns winner's address or throws error if no tickets exist.

---

### `POST /lotteries/:id/priceWithdrawn`

**Description:** Mark prize as withdrawn by winner.

**Response:**  
`true` if successful.

---

### `POST /lotteries/:id/commissionWithdrawn`

**Description:** Mark commission as withdrawn by creator.

**Response:**  
`true` if successful.

---

### `GET /lotteries/:id/tickets`

**Description:** Get all tickets purchased for a specific lottery.

**Response:**  
Array of ticket objects.

---

## 🧠 Database Models (Prisma)

### `Lottery`

| Field               | Type     |
|---------------------|----------|
| id                  | String   |
| name                | String   |
| description         | String   |
| ticketPrice         | BigInt   |
| startTime           | DateTime |
| endTime             | DateTime |
| creatorAddress      | String   |
| ticketUrl           | String   |
| createdAt           | DateTime |
| pricePool           | Int      |
| winnerId            | String?  |
| winnerAddress       | String?  |
| commissionWithdrawn | Boolean  |
| pricePoolWithdrawn  | Boolean  |

---

### `Ticket`

| Field        | Type     |
|--------------|----------|
| id           | String   |
| lotteryId    | String   |
| buyer        | String   |
| ticketNumber | Int      |
| boughtAt     | DateTime |

---

### `Commission`

| Field              | Type   |
|--------------------|--------|
| id                 | String |
| lotteryId          | String |
| ownerCommission    | BigInt |
| creatorCommission  | BigInt |
| collected          | Bool   |

---

## 🛠 Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL + Prisma
- **Blockchain:** Sui
- **Event Syncing:** Off-chain indexing from on-chain events

---

## 📌 Notes

- All time values should be passed as UNIX timestamps in milliseconds.
- Data consistency is maintained by indexing on-chain events like lottery creation, ticket purchases, and winner declarations into the database.
- Designed to support real-time UX without querying the chain directly every time.

---