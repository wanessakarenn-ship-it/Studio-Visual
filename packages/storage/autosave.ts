import type {StudioDocument} from '../schema/v2';
import type {StorageAdapter,StoredDocument} from './index';
export type SaveState='dirty'|'saving'|'saved'|'error';
export class Autosave {
 private timer:ReturnType<typeof setTimeout>|undefined;
 private pending:StudioDocument|null=null;
 private running:Promise<void>|null=null;
 private revision:number|null;
 private stopped=false;
 constructor(private readonly storage:StorageAdapter,private readonly id:string,revision:number|null,private readonly notify:(state:SaveState,error?:unknown)=>void,private readonly delay=800){this.revision=revision;}
 schedule(document:StudioDocument){
  if(this.stopped)throw new Error('Autosave disposed');
  if(document.id!==this.id)throw new Error('Wrong document');
  this.pending=document;this.notify('dirty');
  clearTimeout(this.timer);this.timer=setTimeout(()=>{void this.flush().catch(()=>undefined);},this.delay);
 }
 async flush():Promise<void>{
  clearTimeout(this.timer);this.timer=undefined;
  if(this.running){await this.running;if(this.pending&&!this.stopped)await this.flush();return;}
  if(!this.pending||this.stopped)return;
  const document=this.pending;this.pending=null;this.notify('saving');
  const task=async()=>{
   try{
    const saved:StoredDocument=await this.storage.save(document,this.revision);
    this.revision=saved.revision;this.notify(this.pending?'dirty':'saved');
   }catch(error){this.pending??=document;this.notify('error',error);throw error;}
  };
  this.running=task();
  try{await this.running;}finally{this.running=null;}
 }
 dispose(){this.stopped=true;clearTimeout(this.timer);}
}
