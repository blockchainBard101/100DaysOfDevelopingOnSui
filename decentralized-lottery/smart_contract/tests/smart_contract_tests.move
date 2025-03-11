#[test_only]
module smart_contract::smart_contract_tests;

use smart_contract::decentralized_lottery;
use sui::test_scenario as ts;


const ENotImplemented: u64 = 0;

const CREATOR : address = @0xA;

#[test]
fun test_call_init() {
    let mut scenario = ts::begin(CREATOR);{
        decentralized_lottery::call_init(scenario.ctx());
    };
    scenario.end();
}

#[test]
fun test_create_lottery() {
    
}

#[test, expected_failure(abort_code = ::smart_contract::smart_contract_tests::ENotImplemented)]
fun test_smart_contract_fail() {
    abort ENotImplemented
}

