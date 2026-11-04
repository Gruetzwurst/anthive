import type {WorldPoint} from '../world/worldTypes.ts';
import {QUEEN_SUPPLY_CONFIG} from './simulationConfig.ts';

export const queenSupplyRoomId=(queenId:string)=>`queen-supply-${queenId}`;
export function emptyQueenSupplyRoom(queen:{id:string;position:WorldPoint;operational:boolean}){
  const stock=(kind:'food'|'water')=>({amount:0,target:QUEEN_SUPPLY_CONFIG.perDay[kind]*QUEEN_SUPPLY_CONFIG.reserveDays,
    capacity:QUEEN_SUPPLY_CONFIG.perDay[kind]*QUEEN_SUPPLY_CONFIG.reserveDays,refilling:true,consumed:0,unmet:0});
  return {id:queenSupplyRoomId(queen.id),specialization:'care' as const,capacity:1,operational:queen.operational,
    position:{...queen.position},larvae:0,royal:false,adultQueen:true,food:stock('food'),water:stock('water')};
}
