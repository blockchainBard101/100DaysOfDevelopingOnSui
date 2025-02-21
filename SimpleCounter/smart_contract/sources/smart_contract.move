module smart_contract::simple_counter;
use sui::event;
const COUNTER_ZERO : u64 = 0;
const COUNTER_NOT_OWNER : u64 = 1;

public struct Counter has key, store{
    id: UID,
    value: u64,
    creator: address
}

public struct CounterCreatedEvent has copy, drop{
    id: ID,
    value: u64
}

public struct CounterChangeEvent has copy, drop{
    id: ID,
    value: u64,
    increment: bool
}

public struct CounterDeletedEvent has copy, drop{
    id: ID
} 
fun init(ctx: &mut TxContext) {
    let counter = Counter{
        id: object::new(ctx),
        value: 0,
        creator: ctx.sender()
    };

    let created_event = CounterCreatedEvent{
        id: *counter.id.as_inner(),
        value: counter.value
    };
    event::emit(created_event);
    transfer::public_share_object(counter);
}

public fun create_counter(ctx: &mut TxContext){
    let counter = Counter{
        id: object::new(ctx),
        value: 0,
        creator: ctx.sender()
    };
    let created_event = CounterCreatedEvent{
        id: *counter.id.as_inner(),
        value: counter.value
    };
    event::emit(created_event);
    transfer::public_share_object(counter);
}

public fun delete_counter(counter: Counter, ctx: &mut TxContext){
    assert!(counter.creator == ctx.sender(), COUNTER_NOT_OWNER);
    let Counter{id, value: _, creator: _} = counter;
    let deleted_event = CounterDeletedEvent{
        id: *id.as_inner()
    };
    event::emit(deleted_event);
    object::delete(id);
}

public fun increment(counter: &mut Counter){
    counter.value = counter.value + 1;
    let event = CounterChangeEvent{
        id: *counter.id.as_inner(),
        value: counter.value,
        increment: true
    };
    event::emit(event);
}

public fun decrement(counter: &mut Counter){
    assert!(counter.value > 0, COUNTER_ZERO);
    counter.value = counter.value - 1;
    counter.value = counter.value + 1;
    let event = CounterChangeEvent{
        id: *counter.id.as_inner(),
        value: counter.value,
        increment: false
    };
    event::emit(event);
}

public fun get_value(counter: &Counter) : u64{
    return counter.value
}

#[test_only]
public fun call_init(ctx: &mut TxContext){
    init(ctx);
}