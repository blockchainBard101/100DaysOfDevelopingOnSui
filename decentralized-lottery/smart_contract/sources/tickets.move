module smart_contract::ticket;
use std::string::{Self, String};
use sui::url::Url;
use sui::event;
use sui::clock::{Clock};

public struct Ticket has key, store {
    id: UID,                 
    lottery_name: String,            
    description: String,
    lottery_id: ID,
    price: u64,       
    url: Url,
    lotttey_start_time: u64,
    lotttey_end_time: u64,
    bought_at: u64,
    owner : address,
    ticket_number: u64,
}

public struct TicketMinted has copy, drop {
    object_id: ID,         
    owner: address,   
    price: u64,
    name: String,  
    ticket_number: u64,
    lottery_id: ID         
}

public fun name(ticket: &Ticket): &String {
    &ticket.lottery_name
}

public fun get_id(ticket: &Ticket): ID {
    *ticket.id.as_inner()
}


public fun get_owner(ticket: &Ticket): address {
    ticket.owner
}

public fun description(ticket: &Ticket): &String {
    &ticket.description
}

public fun url(ticket: &Ticket): &Url {
    &ticket.url
}

#[allow(lint(self_transfer))]
public fun buy_ticket(
    lottery_name: vector<u8>,
    price: u64,
    lottery_id: ID,
    description: vector<u8>,
    url: Url,
    start_time: u64,
    end_time: u64,
    ticket_number: u64,
    clock: &Clock,          
    ctx: &mut TxContext
): ID {
    let sender = ctx.sender();
    let ticket =Ticket{
        id: object::new(ctx),      
        lottery_name: string::utf8(lottery_name),        
        description: string::utf8(description),   
        lottery_id,
        price,
        url: url,
        lotttey_start_time: start_time,
        lotttey_end_time: end_time,
        bought_at: clock.timestamp_ms(),
        owner: sender,
        ticket_number
    };

    event::emit(TicketMinted {
        object_id: object::id(&ticket),
        owner: sender,
        price: price,
        name: ticket.lottery_name,
        ticket_number,
        lottery_id
    });

    let ticket_id = object::id(&ticket);
    transfer::public_transfer(ticket, sender);
    ticket_id
}

public fun burn(
    ticket: Ticket,
    _: &mut TxContext
) {
    let Ticket { id, lottery_name: _, description: _, lottery_id: _,price: _, url: _ ,lotttey_start_time: _, lotttey_end_time: _, bought_at : _, owner: _, ticket_number: _} = ticket;
    id.delete();
}