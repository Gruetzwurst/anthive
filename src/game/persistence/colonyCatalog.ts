export function sortColonies<T extends {id:string;savedAt:string;lastPlayedAt?:string}>(rows:readonly T[]):T[]{
 return [...rows].sort((a,b)=>(b.lastPlayedAt??b.savedAt).localeCompare(a.lastPlayedAt??a.savedAt)||a.id.localeCompare(b.id));
}
export type DeleteStage='offer'|'exporting'|'confirm'|'delete'|'cancelled';
export type DeleteAction='cancel'|'export'|'withoutExport'|'exportFailed'|'exportSucceeded'|'confirm';
export function deleteConfirmation(stage:DeleteStage,action:DeleteAction):DeleteStage{
 if(action==='cancel')return 'cancelled';
 if(stage==='offer')return action==='export'?'exporting':action==='withoutExport'?'confirm':'offer';
 if(stage==='exporting')return action==='exportFailed'?'offer':action==='exportSucceeded'?'confirm':'exporting';
 if(stage==='confirm'&&action==='confirm')return 'delete';return stage;
}
export function colonyExportFilename(name:string,savedAt:string):string{
 const safe=name.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/[. ]+$/,'').trim()||'Kolonie';
 return `${safe}-${savedAt.replace(/[:]/g,'-')}.anthive.json`;
}
