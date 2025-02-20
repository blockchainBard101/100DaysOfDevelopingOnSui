    module smart_contract::simple_counter;
    const COUNTER_ZERO : u64 = 0;

    public struct Counter has key, store{
        id: UID,
        value: u64
    }

    fun init(ctx: &mut TxContext) {
        let counter = Counter{
            id: object::new(ctx),
            value: 0
        };
        transfer::public_share_object(counter);
    }

    public fun create_counter(ctx: &mut TxContext){
        let counter = Counter{
            id: object::new(ctx),
            value: 0
        };
        transfer::public_share_object(counter);
    }

    public fun delete_counter(counter: Counter){
        let Counter{id, value: _} = counter;
        object::delete(id);
    }

    public fun increment(counter: &mut Counter){
        counter.value = counter.value + 1;
    }

    public fun decrement(counter: &mut Counter){
        assert!(counter.value > 0, COUNTER_ZERO);
        counter.value = counter.value - 1;
    }

    public fun get_value(counter: &Counter) : u64{
        return counter.value
    }
