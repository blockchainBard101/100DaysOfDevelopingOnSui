#[test_only]
module smart_contract::smart_contract_tests;

use smart_contract::decentralized_lottery::{Self,  Owner};
use sui::{
    test_scenario::{Self as ts, Scenario}, 
    package::Publisher, 
    test_utils::assert_eq, 
    clock, coin, 
    sui::SUI,
    random::{Self, update_randomness_state_for_testing, Random},
};
use std::string::String;

const ENotImplemented: u64 = 0;
const OWNER : address = @0x0;
const CREATOR : address = @0xA;
const PLAYER : address = @0xB;
const PLAYER2 : address = @0xC;
const PLAYER3 : address = @0xD;
const CALLER : address = @0xE;


fun call_init(scenario: &mut Scenario) {
    decentralized_lottery::call_init(scenario.ctx());
}

fun call_edit_commission(owner_commission: u8, creator_commission: u8, scenario: &mut Scenario){
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
    let mut lottery = scenario.take_shared<decentralized_lottery::Lottery>();
    let mut clock = clock::create_for_testing(scenario.ctx());
    clock.increment_for_testing(2);
    let price = lottery.get_ticket_price();
    let payment_coin = coin::mint_for_testing<SUI>(price, scenario.ctx());
    owner.buy_ticket(&mut lottery, payment_coin, &clock, scenario.ctx());
    ts::return_shared(lottery);
    ts::return_shared(owner);
    clock.destroy_for_testing();
}

fun call_get_winnner(random_state: &Random, scenario: &mut Scenario){
    let mut lottery = scenario.take_shared<decentralized_lottery::Lottery>();
    let mut clock = clock::create_for_testing(scenario.ctx());
    clock.increment_for_testing(99);
    lottery.determine_winner(random_state, &clock, scenario.ctx());
    ts::return_shared(lottery);
    clock.destroy_for_testing();
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
    scenario.end();
}

#[test]
fun test_get_winner() {
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
#[test, expected_failure(abort_code = ::smart_contract::smart_contract_tests::ENotImplemented)]
fun test_smart_contract_fail() {
    abort ENotImplemented
}

