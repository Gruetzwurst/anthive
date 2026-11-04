/** Build legacy fixtures from today's model without leaking new feeding state into old schemas. */
export function withoutQueenFeeding(save){
 const b=save.state.broodSupply,ids=new Set([...b.rooms.values()].filter(r=>r.adultQueen).map(r=>r.id));
 const refund=(kind,amount)=>{const store=[...save.state.resources.stores.values()].find(s=>s.resource===kind);if(store)store.amount+=amount;b.withdrawn[kind]=Math.max(0,b.withdrawn[kind]-amount);};
 for(const id of ids){const r=b.rooms.get(id);for(const k of ['food','water'])refund(k,r[k].amount+r[k].consumed);b.rooms.delete(id);b.shortage.rooms.delete(id);}
 for(const n of b.nurses.values())if(ids.has(n.targetRoomId)||ids.has(n.job?.roomId)){
  if(n.load){refund(n.load.resource,n.load.amount);n.load=null;}delete n.targetRoomId;n.job=null;n.retry=0;
 }
 for(const r of b.rooms.values())delete r.adultQueen;
 save.state.adultSupply.config.queenPerDay={food:1,water:1};return save;
}
