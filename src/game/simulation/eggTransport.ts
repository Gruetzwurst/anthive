import type {WorldPoint} from '../world/worldTypes.ts';
export type EggRequest={eggId:string;roomId:string;position:WorldPoint;destination:WorldPoint};
export interface EggTransport {
 readonly snapshot:{chambers:readonly {id:string;position?:WorldPoint;operational:boolean}[]};
 getEggRequests():EggRequest[];
 claimEgg(id:string,carrier:string):boolean;
 pickUpEgg(id:string,carrier:string):boolean;
 deliverEgg(id:string,carrier:string):boolean;
 releaseEgg(id:string,carrier:string,position:WorldPoint):void;
}
/** Normal and royal eggs keep their own identities; nurses share one workflow. */
export class CombinedEggTransport implements EggTransport {
 private normal:EggTransport;private royal:EggTransport;
 constructor(normal:EggTransport,royal:EggTransport){this.normal=normal;this.royal=royal;}
 private owner(id:string){return id.startsWith('royal-')?this.royal:this.normal;}
 get snapshot(){return {chambers:[...this.normal.snapshot.chambers,...this.royal.snapshot.chambers]};}
 getEggRequests(){return [...this.normal.getEggRequests(),...this.royal.getEggRequests()];}
 claimEgg(id:string,c:string){return this.owner(id).claimEgg(id,c);}
 pickUpEgg(id:string,c:string){return this.owner(id).pickUpEgg(id,c);}
 deliverEgg(id:string,c:string){return this.owner(id).deliverEgg(id,c);}
 releaseEgg(id:string,c:string,p:WorldPoint){this.owner(id).releaseEgg(id,c,p);}
}
