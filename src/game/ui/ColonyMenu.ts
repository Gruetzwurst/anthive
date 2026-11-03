import {downloadColonyFile} from './colonyDownload.ts';
import {ColonyRepository} from '../persistence/colonyRepository.ts';
import type {ColonyMetadata} from '../persistence/colonyRepository.ts';
import {createColonySession,captureColony,parseColony,MAX_SAVE_BYTES} from '../persistence/colonySession.ts';
import type {ColonySave} from '../persistence/colonySession.ts';
import {suggestImportName,normalizedColonyName} from '../persistence/colonyTransfer.ts';
import type {ColonySession} from '../persistence/colonySession.ts';
import {BrowserColonyWriteLock} from '../persistence/colonyWriteLock.ts';
import {deleteConfirmation} from '../persistence/colonyCatalog.ts';
import type {DeleteStage} from '../persistence/colonyCatalog.ts';

const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',className=''):HTMLElementTagNameMap[K]=>{
 const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;
};
const date=(value:string)=>new Date(value).toLocaleString('de-DE');
/** Native forms keep menu text readable and keyboard accessible independently of map zoom. */
export class ColonyMenu {
 private root:HTMLElement;
 private content:HTMLElement;
 private status:HTMLElement;
 private repository:ColonyRepository;
 private open:(session:ColonySession)=>void;
 private rows:ColonyMetadata[]=[];
 private lastId:string|null=null;
 private validLast=false;
 private selected:string|null=null;
 private shown=20;
 private busy=false;
 private destroyed=false;
 private deleteStage:DeleteStage='offer';
 private recoveryShown=20;
 constructor(host:HTMLElement,repository:ColonyRepository,open:(session:ColonySession)=>void){
  this.repository=repository;this.open=open;
  this.root=node('section','','colony-menu');this.root.id='colony-menu';this.root.setAttribute('aria-labelledby','colony-menu-title');
  const header=node('header');const title=node('h1','ANTHIVE');title.id='colony-menu-title';header.append(title,node('p','Deine Kolonien. Dein nächster Spieltag.'));
  this.status=node('p','','colony-menu-status');this.status.setAttribute('role','status');
  this.content=node('div','','colony-menu-content');this.root.append(header,this.status,this.content);host.append(this.root);
 }
 async refresh():Promise<void>{
  this.root.dataset.ready='false';
  try{
   [this.rows,this.lastId]=await Promise.all([this.repository.list(),this.repository.lastPlayedId()]);
   if(this.destroyed)return;
   this.selected=this.rows.some(r=>r.id===this.selected)?this.selected:this.lastId;
   this.validLast=false;
   if(this.lastId&&this.rows.some(r=>r.id===this.lastId)){
    try{await this.repository.load(this.lastId);this.validLast=true;}
    catch{this.message('Der letzte Spielstand ist nicht nutzbar. Wähle eine andere Kolonie oder prüfe ihre Sicherungen.',true);}
   }
   this.home();
  }catch(error){this.message(error,true);this.home();}
  finally{if(!this.destroyed)this.root.dataset.ready='true';}
 }
 private message(value:unknown,error=false):void{
  this.status.textContent=value instanceof Error?value.message:String(value);
  this.status.classList.toggle('error',error);this.status.setAttribute('role',error?'alert':'status');
 }
 private button(label:string,fn:()=>void|Promise<void>,id?:string):HTMLButtonElement{
  const button=node('button',label);button.type='button';if(id)button.id=id;
  button.addEventListener('click',()=>{if(!this.busy)void this.run(fn);});return button;
 }
 private async run(fn:()=>void|Promise<void>):Promise<void>{
  if(this.busy||this.destroyed)return;this.busy=true;
  const controls=[...this.root.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('input,button,select')].map(el=>({el,disabled:el.disabled}));
  for(const {el}of controls)el.disabled=true;
  try{await fn();}catch(error){if(!this.destroyed)this.message(error,true);}
  finally{this.busy=false;for(const {el,disabled}of controls)el.disabled=disabled;}
 }
 private home():void{
  this.content.replaceChildren();const last=this.rows.find(r=>r.id===this.lastId);
  if(last){const card=node('div','','colony-last');card.append(node('h2',last.name),node('p',`Tag ${Math.floor(last.gameDay)+1} · ${last.antCount} Ameisen`));this.content.append(card);}
  else this.content.append(node('p',this.rows.length?'Wähle eine Kolonie aus der Verwaltung.':'Noch keine Kolonie gespeichert. Gründe deine erste Kolonie.'));
  const resume=this.button('Letzte Kolonie fortsetzen',()=>this.play(this.lastId!),'continue-colony');resume.disabled=!this.validLast;
  const actions=node('div','','colony-actions');actions.append(resume,this.button('Neue Kolonie',()=>this.newForm(),'new-colony'),this.button('Kolonien verwalten',()=>this.manage(),'manage-colonies'),this.button('Spielstand importieren',()=>this.importFile(),'import-colony'));this.content.append(actions);
 }
 private newForm():void{
  const form=node('form');form.id='new-colony-form';const label=node('label','Koloniename');
  const input=node('input');input.id='colony-name';input.name='name';input.required=true;input.autocomplete='off';label.append(input);
  const submit=node('button','Kolonie gründen');submit.type='submit';
  form.append(node('h2','Neue Kolonie'),label,submit,this.button('Abbrechen',()=>this.home()));
  form.addEventListener('submit',event=>{event.preventDefault();if(this.busy)return;
   const name=input.value.trim();if(!name){this.message('Bitte einen Kolonienamen eingeben.',true);return;}
   void this.run(async()=>{
    const session=createColonySession({id:crypto.randomUUID(),name});
    await this.withLock(session.id,canWrite=>this.repository.save(session,{canWrite}));
    this.open(session);
   });
  });this.content.replaceChildren(form);input.focus();
 }
 private async play(id:string):Promise<void>{const session=await this.repository.load(id);if(!this.destroyed)this.open(session);}
 private async withLock<T>(id:string,work:(canWrite:()=>boolean)=>Promise<T>):Promise<T>{
  const lock=new BrowserColonyWriteLock();
  try{if(!await lock.acquire(id))throw new Error('Diese Kolonie ist in einem anderen Tab aktiv. Schließe sie dort zuerst.');return await work(()=>lock.held);}
  finally{await lock.release();}
 }
 private manage():void{
  this.content.replaceChildren(node('h2','Kolonien verwalten'),this.button('Zurück',()=>this.home()),this.button('Aktualisieren',async()=>{await this.refresh();this.manage();}),this.button('Spielstand importieren',()=>this.importFile()));
  if(!this.rows.length){this.content.append(node('p','Keine Kolonien vorhanden.'));return;}
  const list=node('div','','colony-list');list.setAttribute('role','list');
  for(const row of this.rows.slice(0,this.shown)){
   const article=node('article','','colony-row');article.dataset.colonyId=row.id;article.setAttribute('role','listitem');
   const title=node('label','','colony-choice'),radio=node('input');radio.type='radio';radio.name='selected-colony';radio.value=row.id;radio.checked=row.id===this.selected;
   radio.addEventListener('change',()=>{this.selected=row.id;});title.append(radio,node('strong',row.name));
   article.append(title,node('p',`Tag ${Math.floor(row.gameDay)+1} · ${row.antCount} Ameisen · Gespeichert: ${date(row.savedAt)} · Sicherungen: ${row.backupCount??0}/3`));
   const actions=node('div','','colony-actions');
   actions.append(this.button('Spielen',()=>this.play(row.id)),this.button('Umbenennen',()=>this.renameForm(row)),this.button('Exportieren',()=>this.download(row)),this.button('Sicherungen',()=>this.backups(row)),this.button('Löschen',()=>{this.deleteStage='offer';this.deleteForm(row);}));
   article.append(actions);list.append(article);
  }
  this.content.append(list);
  if(this.rows.length>this.shown)this.content.append(this.button('Weitere Kolonien anzeigen',()=>{this.shown+=20;this.manage();}));
 }
 private renameForm(row:ColonyMetadata):void{
  const form=node('form');form.id='rename-colony-form';const label=node('label','Neuer Name'),input=node('input');input.name='name';input.value=row.name;input.required=true;label.append(input);
  const submit=node('button','Umbenennen');submit.type='submit';form.append(node('h2','Kolonie umbenennen'),label,submit,this.button('Abbrechen',()=>this.manage()));
  form.addEventListener('submit',event=>{event.preventDefault();if(this.busy)return;void this.run(async()=>{
   await this.withLock(row.id,canWrite=>this.repository.rename(row.id,input.value,canWrite));
   this.rows=await this.repository.list();this.message('Kolonie umbenannt.');this.manage();
  });});this.content.replaceChildren(form);input.focus();
 }
 private async download(row:ColonyMetadata):Promise<void>{
  const session=await this.repository.load(row.id);this.downloadSnapshot(captureColony(session));
 }
 private downloadSnapshot(save:ColonySave):void{
  downloadColonyFile(save);
  this.message('Datei zum Download angeboten. Bitte prüfe, ob sie sicher gespeichert wurde.');
 }
 private async backups(row:ColonyMetadata):Promise<void>{
  const section=node('section');section.id='colony-backups';section.append(node('h2',`Sicherungen: ${row.name}`));const slots=await this.repository.listBackups(row.id);
  for(const slot of [1,2,3] as const){const info=slots.find(x=>x.slot===slot);let valid=false,text='Noch nicht erstellt';
   if(info){try{await this.repository.readBackup(row.id,slot);text=`${date(info.savedAt)} · gültig`;valid=true;}catch{text=`${date(info.savedAt)} · nicht nutzbar`;}}
   const entry=node('div','','colony-backup-row');entry.dataset.backupSlot=String(slot);entry.append(node('p',`Sicherung ${slot}: ${text}`));
   if(valid&&info)entry.append(this.button('Wiederherstellen',async()=>this.restoreForm(row,await this.repository.readBackup(row.id,slot),info.savedAt,canWrite=>this.repository.restoreBackup(row.id,slot,row.revision,canWrite))),this.button('Exportieren',async()=>this.downloadSnapshot(await this.repository.readBackup(row.id,slot))));
   section.append(entry);
  }
  const copies=await this.repository.listRecoveryCopies(row.id);
  section.append(node('h3','Zusätzliche Sicherheitskopien'));
  if(!copies.length)section.append(node('p','Noch keine Sicherheitskopie angelegt.'));
  for(const copy of copies.slice(0,this.recoveryShown)){
   const entry=node('div','','colony-backup-row');entry.dataset.recoveryId=copy.id;
   let valid=false;try{await this.repository.readRecoveryCopy(row.id,copy.id);valid=true;}catch{}
   entry.append(node('p',`${copy.name} · Stand ${date(copy.originalSavedAt)} · vor ${copy.reason==='restore'?'Wiederherstellen':copy.reason==='migration'?'Formatumstellung':'Ersetzen'} gesichert · ${valid?'gültig':'nicht nutzbar'}`));
   if(valid)entry.append(this.button('Wiederherstellen',async()=>this.restoreForm(row,await this.repository.readRecoveryCopy(row.id,copy.id),copy.originalSavedAt,canWrite=>this.repository.restoreRecoveryCopy(row.id,copy.id,row.revision,canWrite))),this.button('Exportieren',async()=>this.downloadSnapshot(await this.repository.readRecoveryCopy(row.id,copy.id))));
   section.append(entry);
  }
  if(copies.length>this.recoveryShown)section.append(this.button('Weitere Sicherheitskopien anzeigen',async()=>{this.recoveryShown+=20;await this.backups(row);}));
  section.append(this.button('Zurück',()=>this.manage()));this.content.replaceChildren(section);
 }
 private async changed(message:string,selected?:string):Promise<void>{
  if(selected)this.selected=selected;await this.refresh();this.message(message);this.manage();
 }
 private failure(error:unknown,row:ColonyMetadata):void{
  this.message(`${error instanceof Error?error.message:String(error)} Vorgang abgebrochen; bisheriger Stand bleibt erhalten.`,true);
  this.content.querySelector('[data-storage-actions]')?.remove();
  const actions=node('div','','colony-actions');actions.dataset.storageActions='true';
  actions.append(this.button('Aktuellen Stand exportieren',()=>this.download(row)),this.button('Kolonien verwalten',()=>this.manage()));this.content.append(actions);
 }
 private async restoreForm(row:ColonyMetadata,save:ColonySave,timestamp:string,write:(canWrite:()=>boolean)=>Promise<void>):Promise<void>{
  const section=node('section');section.id='restore-colony-panel';
  let intact=true;try{await this.repository.load(row.id);}catch{intact=false;}
  section.append(node('h2',`${row.name} wiederherstellen?`),node('p',`Gewählte Sicherung: ${date(timestamp)} · Tag ${Math.floor(save.state.clock.elapsedSeconds/save.state.clock.secondsPerGameDay)+1} · ${save.state.workforce.workers.size} Ameisen.`),node('p','Fortschritt seit diesem Stand geht beim Zurücksetzen verloren. Der Koloniename bleibt erhalten.'));
  section.append(node('p',intact?'Der bisherige gültige Stand wird zusätzlich als Sicherheitskopie erhalten. Reicht der Speicher dafür nicht, wird abgebrochen.':'Der aktuelle Stand ist nicht nutzbar und kann keine gültige Sicherheitskopie bilden. Vorhandene gültige Sicherungen bleiben erhalten.'));
  section.append(this.button('Wiederherstellung bestätigen',async()=>{try{await this.withLock(row.id,write);await this.changed('Kolonie wiederhergestellt. Vorhandene automatische Backups bleiben erhalten.',row.id);}catch(error){this.failure(error,row);}}),this.button('Aktuellen Stand exportieren',()=>this.download(row)),this.button('Abbrechen',()=>this.backups(row)));
  this.content.replaceChildren(section);
 }
 private importFile():void{
  const section=node('section');section.id='import-file-panel';const label=node('label','Koloniedatei auswählen'),input=node('input');input.type='file';input.id='colony-import-file';input.accept='.json,.anthive.json,application/json';label.append(input);
  input.addEventListener('change',()=>{const file=input.files?.[0];if(!file)return;void this.run(async()=>{
   if(file.size>MAX_SAVE_BYTES)throw new Error('Die Datei ist größer als 32 MiB. Es wurde nichts verändert.');
   const save=parseColony(await file.text());this.rows=await this.repository.list();this.importForm(save,file.name);
  });});section.append(node('h2','Spielstand importieren'),label,node('p','Die Datei wird vor jeder Änderung geprüft.'),this.button('Abbrechen',()=>this.home()));this.content.replaceChildren(section);input.focus();
 }
 private importForm(save:ColonySave,filename:string):void{
  const form=node('form');form.id='import-colony-form';const conflict=this.rows.some(r=>normalizedColonyName(r.name)===normalizedColonyName(save.name));
  form.append(node('h2','Geprüften Spielstand importieren'),node('p',`${filename}: ${save.name} · Tag ${Math.floor(save.state.clock.elapsedSeconds/save.state.clock.secondsPerGameDay)+1} · ${save.state.workforce.workers.size} Ameisen.`));
  if(conflict)form.append(node('p','Eine Kolonie mit diesem Namen ist bereits vorhanden. Als neue Kolonie mit eigenem Namen zu importieren ist vorausgewählt.'));
  const newLabel=node('label','Als neue Kolonie importieren'),newMode=node('input');newMode.type='radio';newMode.name='importMode';newMode.value='new';newMode.checked=true;newLabel.prepend(newMode);
  const nameLabel=node('label','Name der neuen Kolonie'),name=node('input');name.name='name';name.required=true;name.value=suggestImportName(save.name,this.rows);nameLabel.append(name);
  const replaceLabel=node('label','Bewusst eine bestehende Kolonie ersetzen'),replaceMode=node('input');replaceMode.type='radio';replaceMode.name='importMode';replaceMode.value='replace';replaceMode.disabled=!this.rows.length;replaceLabel.prepend(replaceMode);
  const targetLabel=node('label','Zu ersetzende Kolonie'),target=node('select');target.name='target';target.disabled=true;target.required=true;
  const placeholder=node('option','Bitte Zielkolonie auswählen');placeholder.value='';target.append(placeholder);
  for(const row of this.rows){const option=node('option',`${row.name} · Tag ${Math.floor(row.gameDay)+1} · ${date(row.savedAt)}`);option.value=row.id;target.append(option);}targetLabel.append(target);
  const submit=node('button','Als neue Kolonie importieren');submit.type='submit';
  const mode=()=>{name.disabled=replaceMode.checked;target.disabled=!replaceMode.checked;submit.textContent=replaceMode.checked?'Ersetzen prüfen':'Als neue Kolonie importieren';};newMode.addEventListener('change',mode);replaceMode.addEventListener('change',mode);
  form.append(newLabel,nameLabel,replaceLabel,targetLabel,submit,this.button('Abbrechen',()=>this.home()));
  form.addEventListener('submit',event=>{event.preventDefault();if(this.busy)return;void this.run(async()=>{
   if(replaceMode.checked){const row=this.rows.find(r=>r.id===target.value);if(!row)throw new Error('Bitte die Zielkolonie bewusst auswählen.');await this.replaceForm(row,save,filename);return;}
   const proposed=name.value.trim();if(!proposed)throw new Error('Bitte einen Namen eingeben.');
   const existing=await this.repository.list();if(existing.some(r=>normalizedColonyName(r.name)===normalizedColonyName(proposed)))throw new Error('Dieser Name ist bereits vorhanden. Bitte einen anderen Namen wählen.');
   try{const session=await this.repository.importNew(save,proposed);await this.changed('Datei als neue unabhängige Kolonie importiert.',session.id);}
   catch(error){this.message(error,true);const actions=node('div','','colony-actions');actions.append(this.button('Geprüfte Datei exportieren',()=>this.downloadSnapshot(save)),this.button('Kolonien verwalten',()=>this.manage()));form.append(actions);}
  });});this.content.replaceChildren(form);name.focus();
 }
 private async replaceForm(row:ColonyMetadata,save:ColonySave,filename:string):Promise<void>{
  const section=node('section');section.id='replace-colony-panel';
  section.append(node('h2',`${row.name} ersetzen?`),node('p',`Ziel: ${row.name} · gespeichert ${date(row.savedAt)}. Quelle: ${save.name} aus ${filename}.`),node('p','Der bisherige Hauptstand und seine drei automatischen Backups werden ersetzt. Die Kolonie heißt danach wie der importierte Stand.'));
  let intact=true;try{await this.repository.load(row.id);}catch{intact=false;}
  section.append(node('p',intact?'Der bisherige gültige Hauptstand wird zuvor zusätzlich als Sicherheitskopie erhalten. Ohne Platz für diese Kopie wird abgebrochen.':'Der bisherige Hauptstand ist nicht nutzbar und kann deshalb nicht sicher ersetzt werden. Stelle zuerst eine Sicherung wieder her oder importiere die Datei als neue Kolonie.'));
  section.append(this.button('Vorher exportieren',()=>this.download(row)),this.button('Bestehende Kolonie endgültig ersetzen',async()=>{try{await this.withLock(row.id,canWrite=>this.repository.replaceImported(row.id,save,row.revision,canWrite));await this.changed('Gewählte Kolonie ersetzt. Andere Kolonien bleiben erhalten.',row.id);}catch(error){this.failure(error,row);}}),this.button('Abbrechen',()=>this.importForm(save,filename)));
  if(!intact)section.querySelectorAll('button')[1].disabled=true;
  this.content.replaceChildren(section);
 }
 private deleteForm(row:ColonyMetadata):void{
  const section=node('section');section.id='delete-colony-panel';section.dataset.stage=this.deleteStage;section.append(node('h2',`${row.name} löschen?`));
  section.append(node('p','Die Kolonie und ihre lokalen Sicherungen werden dauerhaft gelöscht. Andere Kolonien bleiben erhalten.'));
  if(this.deleteStage==='offer'){
   section.append(node('p','Möchtest du die Kolonie vorher als Datei exportieren?'));
   section.append(this.button('Erst exportieren',async()=>{
    this.deleteStage=deleteConfirmation(this.deleteStage,'export');
    try{await this.download(row);this.deleteStage=deleteConfirmation(this.deleteStage,'exportSucceeded');}
    catch(error){this.deleteStage=deleteConfirmation(this.deleteStage,'exportFailed');this.deleteForm(row);throw error;}
    this.deleteForm(row);
   }),this.button('Ohne Export löschen',()=>{this.deleteStage=deleteConfirmation(this.deleteStage,'withoutExport');this.deleteForm(row);}));
  }else if(this.deleteStage==='confirm'){
   section.append(node('p','Bitte endgültig bestätigen. Ein angebotener Download ersetzt nicht die Prüfung deiner Datei.'));
   section.append(this.button('Kolonie endgültig löschen',async()=>{
    this.deleteStage=deleteConfirmation(this.deleteStage,'confirm');
    try{await this.withLock(row.id,canWrite=>this.repository.remove(row.id,row.revision,canWrite));}
    catch(error){this.deleteStage='confirm';throw error;}
    [this.rows,this.lastId]=await Promise.all([this.repository.list(),this.repository.lastPlayedId()]);
    if(this.selected===row.id)this.selected=null;if(this.lastId===null)this.validLast=false;
    this.message('Kolonie gelöscht.');this.manage();
   }));
  }
  section.append(this.button('Abbrechen',()=>{this.deleteStage=deleteConfirmation(this.deleteStage,'cancel');this.manage();}));this.content.replaceChildren(section);
 }
 destroy():void{this.destroyed=true;this.root.remove();}
}
