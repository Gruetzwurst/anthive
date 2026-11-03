export class SaveErrorDialog {
 private dialog:HTMLDialogElement;
 private message:HTMLParagraphElement;
 constructor(host:HTMLElement,actions:{exportCurrent:()=>void;retry:()=>Promise<void>;manage:()=>void}){
  this.dialog=document.createElement('dialog');this.dialog.id='save-error-dialog';this.dialog.setAttribute('aria-labelledby','save-error-title');
  const title=document.createElement('h2');title.id='save-error-title';title.textContent='Spielstand nicht gesichert';
  this.message=document.createElement('p');this.message.setAttribute('role','alert');
  const hint=document.createElement('p');hint.textContent='Du kannst den aktuellen Stand einschließlich ungesicherter Fortschritte als Datei exportieren. Vorhandene Kolonien und Sicherungen werden nicht automatisch gelöscht.';
  const buttons=document.createElement('div');buttons.className='colony-actions';
  const button=(label:string,action:string,fn:()=>void)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.action=action;b.onclick=fn;buttons.append(b);return b;};
  button('Aktuellen Stand exportieren','export-current',()=>{try{actions.exportCurrent();this.message.textContent='Datei zum Download angeboten. Bitte prüfe, ob sie sicher gespeichert wurde.';}catch(error){this.show(String(error));}});
  const retry=button('Erneut speichern','retry-save',()=>{retry.disabled=true;void actions.retry().then(()=>this.close()).catch(error=>this.show(String(error))).finally(()=>{retry.disabled=false;});});
  button('Kolonien verwalten','manage-colonies',actions.manage);
  button('Weiter spielen','continue-playing',()=>this.close());
  this.dialog.append(title,this.message,hint,buttons);host.append(this.dialog);
 }
 show(message:string):void{this.message.textContent=message;if(!this.dialog.open)this.dialog.showModal();}
 close():void{if(this.dialog.open)this.dialog.close();}
 destroy():void{this.dialog.remove();}
}
