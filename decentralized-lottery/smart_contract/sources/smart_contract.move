module smart_contract::decentralized_lottery;

use smart_contract::ticket::{Self, Ticket};
use sui::{sui::SUI, clock::Clock, url::{Self, Url}, balance::{Self,Balance}, coin::{Self,Coin}, random::{Random, new_generator}, table::{Self, Table}, event, package::{Self, Publisher}};
use std::string::String;

const EInvalidPrice : u64= 0;
const ELotteryInProgress : u64 = 1;
const ELotteryAlreadyCompleted : u64 = 2;
const ENoParticipants : u64 = 3;
const ENotLotteryWinner : u64 = 4;
const ENoPricePool : u64 = 5;
const ENoCommisionPool : u64 = 6;
const ENotLotteryCreator : u64 = 7;
const ENotAuthorized : u64 = 8;

public struct DECENTRALIZED_LOTTERY has drop{}

public struct Owner has key{
    id: UID,
    owner_commision_percentage: u8,
    creator_commision_percentage : u8,
    commissions: Balance<SUI>,
    decimal: u8,
}

public struct Lottery has key{
    id: UID,
    name: String,
    description: String,
    ticket_price: u64,
    tickets: Table<u64, ID>,
    winner: Option<ID>,
    start_time: u64,
    end_time: u64,
    creator_commission: Balance<SUI>,
    price_pool: Balance<SUI>,
    ticket_url: Url,
    created_at: u64,
    created_by: address,
    owner_commision_percentage: u8,
    creator_commision_percentage: u8,
    percentage_decimals: u8,
}

public struct LotteryCreatedEvent has copy, drop{
    id: ID,
    name: String,
    price: u64,
    start_time: u64,
    end_time: u64,
    created_at: u64,  
    created_by: address,
    ticket_url: Url,
    owner_commision_percentage: u8,
    creator_commision_percentage: u8,
    percentage_decimals: u8,
}

public struct LotteryTicketBuy has copy, drop{
    id: ID,
    name: String,
    price: u64,
    ticket_number: u64,
    start_time: u64,
    end_time: u64,
    bought_at: u64,
    created_at: u64,
    ticket_url: Url,
}

public struct LotteryWinner has copy, drop{
    id: ID,
    name: String,
    winner: ID,
    winning_price: u64,
    start_time: u64,
    end_time: u64,
    ticket_url: Url,
    created_at: u64,
}

fun init(otw: DECENTRALIZED_LOTTERY, ctx: &mut TxContext){
    let publisher : Publisher = package::claim(otw, ctx);
    let owner = Owner{
        id: object::new(ctx),
        owner_commision_percentage: 0,
        creator_commision_percentage: 0,
        commissions: balance::zero(),
        decimal: 2,
    };
    transfer::public_transfer(publisher, ctx.sender());
    transfer::share_object(owner);
}

public entry fun edit_commission(owner: &mut Owner, cap: &Publisher, owner_commision_percentage: u8, creator_commision_percentage: u8){
    assert!(cap.from_module<Owner>(), ENotAuthorized);
    owner.owner_commision_percentage = owner_commision_percentage;
    owner.creator_commision_percentage = creator_commision_percentage;
}

public fun create_lottery(creator: &Owner, name: String, description: String, ticket_price: u64, start_time: u64, end_time: u64, ticket_url: vector<u8>, clock: &Clock, ctx: &mut TxContext){
    let lottery = Lottery{
        id: object::new(ctx),
        name,
        description,
        ticket_price: ticket_price,
        tickets: table::new<u64, ID>(ctx),
        winner: option::none(),
        start_time: start_time,
        end_time: end_time,
        creator_commission: balance::zero(),
        price_pool: balance::zero(),
        ticket_url: url::new_unsafe_from_bytes(ticket_url),
        created_at: clock.timestamp_ms(),
        created_by: ctx.sender(),
        owner_commision_percentage: creator.owner_commision_percentage,
        creator_commision_percentage: creator.creator_commision_percentage,
        percentage_decimals: creator.decimal,
    };
    event::emit(LotteryCreatedEvent{
        id: *lottery.id.as_inner(),
        name: lottery.name,
        price: lottery.ticket_price,
        start_time: lottery.start_time,
        end_time: lottery.end_time,
        created_at: lottery.created_at,
        created_by: lottery.created_by,
        ticket_url: lottery.ticket_url,
        owner_commision_percentage: creator.owner_commision_percentage,
        creator_commision_percentage: creator.creator_commision_percentage,
        percentage_decimals: creator.decimal,
    });
    transfer::share_object(lottery);
}

public fun buy_ticket(
    owner: &mut Owner,
    lottery: &mut Lottery, 
    mut payment_coin: Coin<SUI>, 
    clock: &Clock, 
    ctx: &mut TxContext
    ){
    assert!(payment_coin.value() == lottery.ticket_price, EInvalidPrice);
    let ticket_number = lottery.tickets.length();
    let ticket_id = ticket::buy_ticket(
        *lottery.name.as_bytes(),
        lottery.ticket_price, 
        *lottery.id.as_inner(), 
        *lottery.description.as_bytes(), 
        lottery.ticket_url, 
        lottery.start_time,
        lottery.end_time, 
        ticket_number, 
        clock, 
        ctx);
    lottery.tickets.add(ticket_number, ticket_id);
    let owner_commission = get_percent(payment_coin.value(), owner.owner_commision_percentage as u64, owner.decimal as u64);
    let creator_commission = get_percent(payment_coin.value(), owner.creator_commision_percentage as u64, owner.decimal as u64);
    let owner_commision_coin = payment_coin.split(owner_commission, ctx);
    let creator_commision_coin = payment_coin.split(creator_commission, ctx);
    coin::put(&mut owner.commissions, owner_commision_coin);
    coin::put(&mut lottery.creator_commission, creator_commision_coin);
    coin::put(&mut lottery.price_pool, payment_coin);
    event::emit(LotteryTicketBuy{
        id: *lottery.id.as_inner(),
        name: lottery.name,
        price: lottery.ticket_price,
        ticket_number: ticket_number,
        start_time: lottery.start_time,
        end_time: lottery.end_time,
        bought_at: clock.timestamp_ms(),
        created_at: lottery.created_at,
        ticket_url: lottery.ticket_url,
    });
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
    event::emit(LotteryWinner{
        id: *lottery.id.as_inner(),
        name: lottery.name,
        winner: *winner_ticket_id,
        winning_price: lottery.price_pool.value(),
        start_time: lottery.start_time,
        end_time: lottery.end_time,
        ticket_url: lottery.ticket_url,
        created_at: lottery.created_at,
    });
}

#[allow(lint(self_transfer))]
public fun withdraw_price(lottery: &mut Lottery, lticket: &Ticket, clock: &Clock, ctx: &mut TxContext){
    assert!(lottery.winner.is_some(), ELotteryInProgress);
    assert!(lottery.end_time <= clock.timestamp_ms(), ELotteryInProgress);
    assert!(lottery.winner == option::some(ticket::get_id(lticket)), ENotLotteryWinner);
    assert!(lottery.price_pool.value() > 0, ENoPricePool);
    let price_balance = lottery.price_pool.withdraw_all();
    let price_coin = price_balance.into_coin(ctx);
    transfer::public_transfer(price_coin, ctx.sender());
}

#[allow(lint(self_transfer))]
public fun withdraw_commission(lottery: &mut Lottery, clock: &Clock, ctx: &mut TxContext){
    assert!(lottery.winner.is_some(), ELotteryInProgress);
    assert!(lottery.end_time <= clock.timestamp_ms(), ELotteryInProgress);
    assert!(lottery.creator_commission.value() > 0, ENoCommisionPool);
    assert!(lottery.created_by == ctx.sender(), ENotLotteryCreator);
    let commission_balance = lottery.creator_commission.withdraw_all();
    let commission_coin = commission_balance.into_coin(ctx);
    transfer::public_transfer(commission_coin, ctx.sender());
}

#[allow(lint(self_transfer))]
public fun withdraw_owner_commission(owner: &mut Owner, cap : &Publisher, ctx: &mut TxContext){
    assert!(cap.from_module<Owner>(), ENotAuthorized);
    assert!(owner.commissions.value() > 0, ENoCommisionPool);
    let commission_balance = owner.commissions.withdraw_all();
    let commission_coin = commission_balance.into_coin(ctx);
    transfer::public_transfer(commission_coin, ctx.sender());
}

fun get_percent(amount: u64, percent: u64, decimals: u64): u64 {
    let scaled_percent = percent * pow(10, decimals);
    let scale = pow(100, decimals);
    amount * scaled_percent / scale
}

fun pow(base: u64, exp: u64): u64 {
    let mut result = 1;
    let mut i = 0;
    while (i < exp) {
        result = result * base;
        i = i + 1;
    };
    result
}

#[test_only]
public fun call_init(ctx: &mut TxContext){
    let otw = DECENTRALIZED_LOTTERY{};
    init(otw, ctx);
}