
# 🎰 Decentralized Lottery Smart on Sui

A fully on-chain, decentralized lottery protocol built with the Sui Move programming language. This module enables trustless lottery creation, participation, and winner selection, with transparent revenue sharing between lottery creators and platform owners.

---

## 🧠 Features

- 🎟️ Users can buy lottery tickets (NFTs).
- 🎉 Random winner selection after the lottery ends using Sui's on-chain randomness.
- 💰 Automatic split of ticket revenue between:
  - Lottery creator (commission)
  - Protocol owner (commission)
  - Prize pool (for the winner)
- 📤 Winner & creator can withdraw their rewards trustlessly.
- 🧾 Events emitted for every critical action (creation, buy, win, withdraw, etc.).
- 🔐 Authorization checks using `Publisher` for critical actions (like commission edits or withdrawals).

---

## 📦 Module Structure

### Structs

| Struct                    | Purpose |
|--------------------------|---------|
| `DECENTRALIZED_LOTTERY`  | Empty struct used to initialize the module |
| `Owner`                  | Represents protocol owner with commission config and balance |
| `Lottery`                | Represents a specific lottery |
| `Ticket` (from import)   | Represents a user’s ticket |
| Events (`*Event`)        | Emits key state changes (created, bought, winner, withdrawal, etc.) |

### Constants

Error codes used for validation:
- `EInvalidPrice`
- `ELotteryInProgress`
- `ELotteryAlreadyCompleted`
- `ENoParticipants`
- `ENotLotteryWinner`
- `ENoPricePool`
- `ENoCommisionPool`
- `ENotLotteryCreator`
- `ENotAuthorized`

---

## 🛠️ Functions

### Initialization

- `call_init(ctx)` – Test-only. Initializes the protocol with an `Owner`.
- `init(DECENTRALIZED_LOTTERY, ctx)` – Internal setup for the contract.

### Admin

- `edit_commission(...)` – Update the commission percentages. Only callable by `Publisher`.

### Lottery Lifecycle

- `create_lottery(...)` – Deploy a new lottery with metadata and ticket price.
- `buy_ticket(...)` – Users purchase a ticket; ticket is minted and revenue distributed.
- `determine_winner(...)` – Picks a winner using `Random`. Can only be called after end time.

### Withdrawals

- `withdraw_price(...)` – Winner claims prize pool.
- `withdraw_commission(...)` – Lottery creator claims their commission.
- `withdraw_owner_commission(...)` – Protocol owner claims accumulated platform commissions.

### Getters

- `get_ticket_price(lottery)` – Get ticket price.
- `get_lottery_winning_ticket(lottery)` – Returns winning ticket ID if exists.

---

## ⚙️ Commission Logic

Commission percentages are stored in hundredths (decimals = 2):
- For example: `owner_commission_percentage = 250` → 2.5%

Commission split during ticket purchase:
- Winner Prize = 100% - Owner % - Creator %
- All balances are managed using `Balance<SUI>`.

---

## 🔐 Access Control

| Function                  | Restriction |
|--------------------------|-------------|
| `edit_commission`        | Must come from `Publisher` |
| `withdraw_owner_commission` | Must come from `Publisher` |
| `withdraw_commission`    | Only the creator of the lottery |
| `withdraw_price`         | Only the winner's ticket ID matches |

---

## 📤 Events

The contract emits the following events:
- `LotteryCreatedEvent`
- `LotteryTicketBuyEvent`
- `LotteryWinnerEvent`
- `PriceWithdrawEvent`
- `CommissionWithdrawEvent`
- `OwnerCommissionWithdrawEvent`
- `EditedCommissionEvent`

These events can be indexed to build performant frontend UIs or analytics dashboards.

---

## 🧪 Testing

Use `call_init()` in test environments to bootstrap the contract and deploy the `Owner` object.

---

## 🚀 Deployment Guide (High-Level)

1. Deploy `ticket` module first.
2. Deploy `decentralized_lottery` module.
3. Call `call_init()` to set up ownership and commission logic.
4. Create lotteries, buy tickets, determine winners, and distribute prizes.

---

## 🧱 Dependencies

- `ticket` module (must expose `Ticket` struct and `buy_ticket` function)
- Sui Framework modules:
  - `clock`, `random`, `url`, `table`, `coin`, `event`, `package`, etc.

---