#[test_only]
module smart_contract::smart_contract_tests;
use smart_contract::simple_counter::{Self, Counter};
use sui::test_utils::assert_eq;
use sui::test_scenario as ts;

const CREATOR : address = @0xA;
const CALLER : address = @0xB;
#[test]
fun test_call_init() {
    let mut scenario = ts::begin(CREATOR);{
        simple_counter::call_init(scenario.ctx());
    };

    let effects = ts::next_tx(&mut scenario, CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

#[test]
fun test_call_create_counter() {
    let mut scenario = ts::begin(CREATOR);{
        simple_counter::create_counter(scenario.ctx());
    };
    let effects = ts::next_tx(&mut scenario, CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}
#[test]
fun test_increment_init_counter() {
    let mut scenario = ts::begin(CREATOR);
    {
        simple_counter::call_init(scenario.ctx());
    };
    ts::next_tx(&mut scenario, CALLER);
    {
        let mut counter: Counter = ts::take_shared(&scenario);
        simple_counter::increment(&mut counter);
        ts::return_shared(counter);
    };
    let effects = ts::next_tx(&mut scenario, CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

#[test]
fun test_increment_counter() {
    let mut scenario = ts::begin(CREATOR);
    {
        simple_counter::create_counter(scenario.ctx());
    };
    ts::next_tx(&mut scenario, CALLER);
    {
        let mut counter: Counter = ts::take_shared(&scenario);
        simple_counter::increment(&mut counter);
        ts::return_shared(counter);
    };
    let effects = ts::next_tx(&mut scenario, CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

#[test]
fun test_decrement_counter() {
    let mut scenario = ts::begin(CREATOR);
    {
        simple_counter::create_counter(scenario.ctx());
    };
    ts::next_tx(&mut scenario, CALLER);
    {
        let mut counter: Counter = ts::take_shared(&scenario);
        simple_counter::increment(&mut counter);
        ts::return_shared(counter);
    };
    ts::next_tx(&mut scenario, CALLER);
    {
        let mut counter: Counter = ts::take_shared(&scenario);
        simple_counter::decrement(&mut counter);
        ts::return_shared(counter);
    };
    let effects = ts::next_tx(&mut scenario, CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

#[test]
fun test_delete_counter() {
    let mut scenario = ts::begin(CREATOR);
    {
        simple_counter::create_counter(scenario.ctx());
    };
    ts::next_tx(&mut scenario, CREATOR);
    {
        let counter: Counter = ts::take_shared(&scenario);
        simple_counter::delete_counter(counter, scenario.ctx());
    };
    let effects = ts::next_tx(&mut scenario, CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

#[test, expected_failure(abort_code = ::smart_contract::simple_counter::COUNTER_NOT_OWNER)]
fun test_delete_counter_fail() {
    let mut scenario = ts::begin(CREATOR);
    {
        simple_counter::create_counter(scenario.ctx());
    };
    ts::next_tx(&mut scenario, CALLER);
    {
        let counter: Counter = ts::take_shared(&scenario);
        simple_counter::delete_counter(counter, scenario.ctx());
    };
    let effects = ts::next_tx(&mut scenario, CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

#[test, expected_failure(abort_code = ::smart_contract::simple_counter::COUNTER_ZERO)]
fun test_decrement_counter_fail() {
    let mut scenario = ts::begin(CREATOR);
    {
        simple_counter::create_counter(scenario.ctx());
    };
    ts::next_tx(&mut scenario, CALLER);
    {
        let mut counter: Counter = ts::take_shared(&scenario);
        simple_counter::decrement(&mut counter);
        ts::return_shared(counter);
    };
    let effects = ts::next_tx(&mut scenario, CREATOR);
    assert_eq(effects.num_user_events(), 1);
    scenario.end();
}

