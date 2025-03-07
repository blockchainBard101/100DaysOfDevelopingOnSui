module smart_contract::decentralized_lottery;

use smart_contract::ticket;
use sui::{sui::SUI, clock::Clock, url::{Self, Url}, balance::{Self,Balance}, coin::{Self,Coin}, random::{Random, new_generator}, table::{Self, Table}};
use std::string::String;

const EInvalidPrice : u64= 0;
const ELotteryInProgress : u64 = 1;
const ELotteryAlreadyCompleted : u64 = 2;
const ENoParticipants : u64 = 3;

public struct Lottery has key{
    id: UID,
    name: String,
    description: String,
    ticket_price: u64,
    tickets: Table<u64, ID>,
    winner: Option<ID>,
    start_time: u64,
    end_time: u64,
    price_pool: Balance<SUI>,
    ticket_url: Url,
    created_at: u64
}

public fun create_lottery(name: String, description: String, ticket_price: u64, start_time: u64, end_time: u64, ticket_url: vector<u8>, clock: &Clock, ctx: &mut TxContext){
    let lottery = Lottery{
        id: object::new(ctx),
        name,
        description,
        ticket_price: ticket_price,
        tickets: table::new<u64, ID>(ctx),
        winner: option::none(),
        start_time: start_time,
        end_time: end_time,
        price_pool: balance::zero(),
        ticket_url: url::new_unsafe_from_bytes(ticket_url),
        created_at: clock.timestamp_ms(),
    };

    transfer::share_object(lottery);
}

public fun buy_ticket(
    lottery: &mut Lottery, 
    coin: Coin<SUI>, 
    clock: &Clock, 
    ctx: &mut TxContext
    ){
    assert!(coin.value() == lottery.ticket_price, EInvalidPrice);
    let ticket_number = lottery.tickets.length();
    let ticket_id = ticket::buy_ticket(
        *lottery.name.as_bytes(),
        lottery.ticket_price, 
        *lottery.id.as_inner(), 
        *lottery.description.as_bytes(), 
        lottery.ticket_url , 
        lottery.start_time,
        lottery.end_time, 
        ticket_number, 
        clock, 
        ctx);
    
    lottery.tickets.add(ticket_number, ticket_id);
    coin::put(&mut lottery.price_pool, coin);
}

entry fun get_winner(
    lottery: &mut Lottery, 
    r: &Random, 
    clock: &Clock, 
    ctx: &mut TxContext
    ){
    assert!(lottery.end_time <= clock.timestamp_ms(), ELotteryInProgress);
    assert!(lottery.winner.is_none(), ELotteryAlreadyCompleted);
    assert!(lottery.tickets.length() > 0, ENoParticipants);
    let mut generator = r.new_generator(ctx);
    let winner = generator.generate_u64_in_range(0, lottery.tickets.length());
    let winner_ticket_id = lottery.tickets.borrow(winner);
    lottery.winner = option::some(*winner_ticket_id);
}