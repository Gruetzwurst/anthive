import {serializeColony} from '../persistence/colonySession.ts';
import type {ColonySave} from '../persistence/colonySession.ts';
import {colonyExportFilename} from '../persistence/colonyCatalog.ts';
/** Works without writing browser storage, including export of unsaved live progress. */
export function downloadColonyFile(save:ColonySave):void{
 const payload=serializeColony(save),url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
 try{
  const link=document.createElement('a');link.href=url;link.download=colonyExportFilename(save.name,new Date().toISOString());document.body.append(link);
  try{link.click();}finally{link.remove();}
 }finally{setTimeout(()=>URL.revokeObjectURL(url),60000);}
}
