#[test_only]
module smart_contract::smart_contract_tests;

use smart_contract::decentralized_lottery::{
    Self,  
    Owner, 
    Lottery,
    ENotLotteryWinner,
    
    };
use smart_contract::ticket::Ticket;
use sui::{
    test_scenario::{Self as ts, Scenario}, 
    package::Publisher, 
    test_utils::assert_eq, 
    clock, coin, 
    sui::SUI,
    table,
    random::{Self, update_randomness_state_for_testing, Random},
};
use std::{
    string::String,
    debug,
};

const ENotImplemented: u64 = 0;
const ENoWinningTicket: u64 = 1;


const OWNER : address = @0x0;
const CREATOR : address = @0xA;
const PLAYER : address = @0xB;
const PLAYER2 : address = @0xC;
const PLAYER3 : address = @0xD;
const CALLER : address = @0xE;

fun call_init(scenario: &mut Scenario) {
    decentralized_lottery::call_init(scenario.ctx());
}

fun call_edit_commission(owner_commission: u32, creator_commission: u32, scenario: &mut Scenario){
    let cap = scenario.take_from_sender<Publisher>();
    let mut owner = scenario.take_shared<Owner>();
    owner.edit_commission(&cap, owner_commission, creator_commission);
    scenario.return_to_sender(cap);
    ts::return_shared(owner);
}

fun call_create_lottery(name: String, description: String, ticket_price: u64, scenario: &mut Scenario){
    let owner = scenario.take_shared<Owner>();
    let mut start_clock = clock::create_for_testing(scenario.ctx());
    start_clock.increment_for_testing(1);
    let mut end_clock = clock::create_for_testing(scenario.ctx());
    end_clock.increment_for_testing(5);
    let mut clock = clock::create_for_testing(scenario.ctx());
    clock.increment_for_testing(2);
    owner.create_lottery(name, description, ticket_price, start_clock.timestamp_ms(), end_clock.timestamp_ms(), b"", &clock, scenario.ctx());
    ts::return_shared(owner);
    clock.destroy_for_testing();
    start_clock.destroy_for_testing();
    end_clock.destroy_for_testing();
}

fun call_buy_ticket(scenario: &mut Scenario){
    let mut owner = scenario.take_shared<Owner>();
    let mut lottery = scenario.take_shared<Lottery>();
    let mut clock = clock::create_for_testing(scenario.ctx());
    clock.increment_for_testing(2);
    let price = lottery.get_ticket_price();
    let payment_coin = coin::mint_for_testing<SUI>(price, scenario.ctx());
    owner.buy_ticket(&mut lottery, payment_coin, &clock, scenario.ctx());
    
    // let ticket = scenario.take_from_sender<Ticket>();
    // let ticket_id = ticket::get_id(&ticket);
    ts::return_shared(lottery);
    ts::return_shared(owner);
    // scenario.return_to_sender(ticket);
    clock.destroy_for_testing();
    
    // debug::print(&ticket_id);
    // ticket_id
}

fun get_ticket_id(scenario: &mut Scenario): ID{
    let ticket_ids = scenario.ids_for_sender<Ticket>();
    // debug::print(&ticket_ids);
    let ticket = scenario.take_from_sender<Ticket>();
    // debug::print(&ticket);
    let id = ticket_ids.borrow(ticket_ids.length()-1);
    
    scenario.return_to_sender(ticket);
    *id
}
fun call_get_winnner(random_state: &Random, scenario: &mut Scenario){
    let mut lottery = scenario.take_shared<Lottery>();
    let mut clock = clock::create_for_testing(scenario.ctx());
    clock.increment_for_testing(7);
    lottery.determine_winner(random_state, &clock, scenario.ctx());
    ts::return_shared(lottery);
    clock.destroy_for_testing(); 
}

fun call_withdraw_price(addr: address, ticket_id: ID, lottery: &mut Lottery, scenario: &mut Scenario){
    let lticket = scenario.take_from_address_by_id<Ticket>(addr, ticket_id);
    let mut clock = clock::create_for_testing(scenario.ctx());
    clock.increment_for_testing(8);
    lottery.withdraw_price(&lticket,&clock, scenario.ctx());
    ts::return_to_address(addr, lticket); 
    clock.destroy_for_testing();
}

fun call_withdraw_commission(scenario: &mut Scenario, lottery: &mut Lottery){
    let mut clock = clock::create_for_testing(scenario.ctx());
    clock.increment_for_testing(9);
    lottery.withdraw_commission(&clock, scenario.ctx());
    clock.destroy_for_testing();
}

fun call_withdraw_owner_commission(scenario: &mut Scenario){
    let mut owner = scenario.take_shared<Owner>();
    let publisher = scenario.take_from_sender<Publisher>();
    let mut clock = clock::create_for_testing(scenario.ctx());
    clock.increment_for_testing(9);
    owner.withdraw_owner_commission(&publisher, scenario.ctx());
    ts::return_shared(owner);
    clock.destroy_for_testing();
    scenario.return_to_sender( publisher);
}

#[test]
fun test_call_init() {
    let mut scenario = ts::begin(OWNER);
    call_init(&mut scenario);
    scenario.end();
}

#[test]
fun test_edit_commission() {
    let mut scenario = ts::begin(OWNER);
    call_init(&mut scenario);
    scenario.next_tx(OWNER);
    call_edit_commission(10,10,&mut scenario);
    let effects =  scenario.next_tx(OWNER);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

#[test]
fun test_create_lottery() {
    let mut scenario = ts::begin(OWNER);
    call_init(&mut scenario);
    scenario.next_tx(OWNER);
    call_edit_commission(1,1,&mut scenario);
    scenario.next_tx(CREATOR);
    call_create_lottery(b"name".to_string(), b"description".to_string(), 100000000, &mut scenario);
    let effects =  scenario.next_tx(CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

#[test]
fun test_buy_ticket() {
    let mut scenario = ts::begin(OWNER);
    call_init(&mut scenario);
    scenario.next_tx(OWNER);
    call_edit_commission(1,1,&mut scenario);
    scenario.next_tx(CREATOR);
    call_create_lottery(b"name".to_string(), b"description".to_string(), 100000000, &mut scenario);
    scenario.next_tx(PLAYER);
    call_buy_ticket(&mut scenario);
    let effects =  scenario.next_tx(PLAYER);
    assert_eq(effects.num_user_events(), 2);
    // debug::print(&effects);
    scenario.end();
}

#[test]
fun test_determine_winner() {
    let mut scenario = ts::begin(OWNER);
    random::create_for_testing(scenario.ctx());
    scenario.next_tx(OWNER);
    let mut random_state: Random = scenario.take_shared();
    random_state.update_randomness_state_for_testing(
        0,
        x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F",
        scenario.ctx(),
    );
    call_init(&mut scenario);

    scenario.next_tx(OWNER);
    call_edit_commission(1,1,&mut scenario);
    
    scenario.next_tx(CREATOR);
    call_create_lottery(b"name".to_string(), b"description".to_string(), 100000000, &mut scenario);
    
    scenario.next_tx(PLAYER);
    call_buy_ticket(&mut scenario);
    
    scenario.next_tx(PLAYER2);
    call_buy_ticket(&mut scenario);
    
    scenario.next_tx(PLAYER3);
    call_buy_ticket(&mut scenario);
    
    scenario.next_tx(CALLER);
    call_get_winnner(&random_state, &mut scenario);
    let effects =  scenario.next_tx(CALLER);
    assert_eq(effects.num_user_events(), 1);
    ts::return_shared(random_state);
    scenario.end();
}

#[test]
fun test_withdraw_price(){
    let mut scenario = ts::begin(OWNER);
    let mut tickets_id = table::new<ID, address>(scenario.ctx());
    random::create_for_testing(scenario.ctx());
    scenario.next_tx(OWNER);
    let mut random_state: Random = scenario.take_shared();
    random_state.update_randomness_state_for_testing(
        0,
        x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F",
        scenario.ctx(),
    );
    call_init(&mut scenario);

    scenario.next_tx(OWNER);
    call_edit_commission(1,1,&mut scenario);
    
    scenario.next_tx(CREATOR);
    call_create_lottery(b"name".to_string(), b"description".to_string(), 100000000, &mut scenario);
    
    scenario.next_tx(PLAYER);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER);

    scenario.next_tx(PLAYER2);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER2);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER2);

    scenario.next_tx(PLAYER3);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER3);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER3);

    scenario.next_tx(PLAYER2);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER2);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER2);

    scenario.next_tx(PLAYER3);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER3);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER3);
    
    scenario.next_tx(CALLER);
    call_get_winnner(&random_state, &mut scenario);

    scenario.next_tx(CALLER);
    let mut lottery = scenario.take_shared<Lottery>();

    let winning_ticket_id = decentralized_lottery::get_lottery_winning_ticket(&lottery);
    assert!(winning_ticket_id.is_some(), ENoWinningTicket);
    let winning_ticket_address = *tickets_id.borrow(*winning_ticket_id.borrow());

    scenario.next_tx(winning_ticket_address);
    call_withdraw_price(winning_ticket_address, *winning_ticket_id.borrow(), &mut lottery,&mut scenario);
    
    let effects =  scenario.next_tx(winning_ticket_address);
    assert_eq(effects.num_user_events(), 1);
    ts::return_shared(random_state);
    ts::return_shared(lottery);
    debug::print(&winning_ticket_address);
    table::drop(tickets_id);
    scenario.end();
}

#[test]
fun test_withdraw_commission(){
    
    let mut scenario = ts::begin(OWNER);
    let mut tickets_id = table::new<ID, address>(scenario.ctx());
    random::create_for_testing(scenario.ctx());CREATOR;
    scenario.next_tx(OWNER);
    let mut random_state: Random = scenario.take_shared();
    random_state.update_randomness_state_for_testing(
        0,
        x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F",
        scenario.ctx(),
    );
    call_init(&mut scenario);

    scenario.next_tx(OWNER);
    call_edit_commission(1,1,&mut scenario);
    
    scenario.next_tx(CREATOR);
    call_create_lottery(b"name".to_string(), b"description".to_string(), 100000000, &mut scenario);
    
    scenario.next_tx(PLAYER);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER);

    scenario.next_tx(PLAYER2);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER2);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER2);

    scenario.next_tx(PLAYER3);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER3);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER3);
    
    scenario.next_tx(CALLER);
    call_get_winnner(&random_state, &mut scenario);

    scenario.next_tx(CALLER);
    let mut lottery = scenario.take_shared<Lottery>();

    let winning_ticket_id = decentralized_lottery::get_lottery_winning_ticket(&lottery);
    assert!(winning_ticket_id.is_some(), ENoWinningTicket);

    scenario.next_tx(CREATOR);
    call_withdraw_commission(&mut scenario, &mut lottery);
    
    let effects =  scenario.next_tx(CREATOR);
    assert_eq(effects.num_user_events(), 1);
    ts::return_shared(random_state);
    ts::return_shared(lottery);
    table::drop(tickets_id);
    scenario.end();
}

#[test]
fun test_withdraw_owner_commission(){
    let mut scenario = ts::begin(OWNER);
    let mut tickets_id = table::new<ID, address>(scenario.ctx());
    random::create_for_testing(scenario.ctx());
    scenario.next_tx(OWNER);
    let mut random_state: Random = scenario.take_shared();
    random_state.update_randomness_state_for_testing(
        0,
        x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F",
        scenario.ctx(),
    );
    call_init(&mut scenario);

    scenario.next_tx(OWNER);
    call_edit_commission(1,1,&mut scenario);
    
    scenario.next_tx(CREATOR);
    call_create_lottery(b"name".to_string(), b"description".to_string(), 100000000, &mut scenario);
    
    scenario.next_tx(PLAYER);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER);

    scenario.next_tx(PLAYER2);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER2);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER2);

    scenario.next_tx(PLAYER3);
    call_buy_ticket(&mut scenario);
    scenario.next_tx(PLAYER3);
    tickets_id.add(get_ticket_id(&mut scenario), PLAYER3);
    
    scenario.next_tx(CALLER);
    call_get_winnner(&random_state, &mut scenario);

    scenario.next_tx(CALLER);
    let lottery = scenario.take_shared<Lottery>();

    let winning_ticket_id = decentralized_lottery::get_lottery_winning_ticket(&lottery);
    assert!(winning_ticket_id.is_some(), ENoWinningTicket);

    scenario.next_tx(OWNER);
    call_withdraw_owner_commission(&mut scenario);
    
    let effects =  scenario.next_tx(OWNER);
    assert_eq(effects.num_user_events(), 1);
    ts::return_shared(random_state);
    ts::return_shared(lottery);
    table::drop(tickets_id);
    scenario.end();
}