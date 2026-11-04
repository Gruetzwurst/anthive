import type {QueenSnapshot} from '../simulation/queenSystem.ts';
import type {WorldPoint} from './worldTypes.ts';

/** Each label belongs to one living queen, including her own buffer and timer. */
export function queenLayingLabels(queens:QueenSnapshot['queens'],fallback:WorldPoint,secondsPerDay:number){
  return queens.map(queen=>{
    const origin=queen.position??fallback;
    const seconds=queen.daysUntilNextEgg===null?null:Math.max(0,Math.ceil(queen.daysUntilNextEgg*secondsPerDay-1e-8));
    return {id:queen.id,position:{x:origin.x-108,y:origin.y+28},
      text:seconds===null?`Eiablage pausiert · ${queen.bufferCount} warten`:`Nächstes Ei ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} · ${queen.bufferCount} warten`};
  });
}
