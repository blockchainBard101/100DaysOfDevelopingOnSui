module smart_contract::ticket;
use std::string::{Self, String};
use sui::url::{Self, Url};
use sui::event;

public struct Ticket has key, store {
    id: UID,                 
    name: String,            
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
    lottery_number: u64         
}

public fun name(ticket: &Ticket): &String {
    &ticket.name
}

public fun description(ticket: &Ticket): &String {
    &ticket.description
}

public fun url(ticket: &Ticket): &Url {
    &ticket.url
}

#[allow(lint(self_transfer))]
public fun mint_to_sender(
    name: vector<u8>,
    price: u64,
    description: vector<u8>,
    url: vector<u8>,
    start_time: u64,
    end_time: u64,          
    ctx: &mut TxContext
){
    let sender = ctx.sender();

    let ticket =Ticket{
        id: object::new(ctx),      
        name: string::utf8(name),     
        price,    
        description: string::utf8(description),   
        url: url::new_unsafe_from_bytes(url),
        start_time,
        end_time
    };

    event::emit(TicketMinted {
        object_id: object::id(&ticket),
        owner: sender,
        price: price,
        name: ticket.name,
    });

    transfer::public_transfer(ticket, sender);
}

public fun burn(
    ticket: Ticket,
    _: &mut TxContext
) {
    let Ticket { id, name: _,price: _, description: _, url: _ ,start_time: _, end_time: _} = ticket;
    id.delete();
}