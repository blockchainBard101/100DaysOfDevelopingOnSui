module smart_contract::decentralized_lottery;

use smart_contract::ticket::{Self, Ticket};
use sui::sui::SUI;
use sui::coin::Coin;
use sui::clock;

const EInvalidPrice : u64= 0;

public struct Lottery has key{
    id: UID,
    ticket_price: u64,
    tickets: vector<Ticket>,
    winner: Option<address>,
    start_time: u64,
    end_time: u64,
    price_pool: u64
}

public fun create_lottery(ticket_price: u64, start_time: u64, end_time: u64, ctx: &mut TxContext){
    let lottery = Lottery{
        id: object::new(ctx),
        ticket_price: ticket_price,
        tickets: vector::empty<Ticket>(),
        winner: option::none(),
        start_time: start_time,
        end_time: end_time,
        price_pool: 0
    };

    transfer::share_object(lottery);
}

public fun buy_ticket(lottery: &mut Lottery, coin: Coin<SUI>){
    assert!(coin.value() == lottery.ticket_price, EInvalidPrice);
    ticket.buy_ticket();
}