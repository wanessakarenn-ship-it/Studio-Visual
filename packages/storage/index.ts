import {z} from 'zod';
import {DocumentSchema,migrateDocument,type StudioDocument} from '../schema/v2';
const Envelope=z.object({revision:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),savedAt:z.string().datetime(),document:DocumentSchema}).strict();
export type StoredDocument=z.infer<typeof Envelope>;
export type LoadResult={status:'empty'}|{status:'ready';value:StoredDocument}|{status:'recovered';value:StoredDocument;raw:string}|{status:'invalid';raw:string};
export interface StorageAdapter {
 load(id:string):Promise<LoadResult>;
 save(document:StudioDocument,expectedRevision:number|null):Promise<StoredDocument>;
}
export interface KeyValueStore {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export class StorageConflict extends Error {constructor(){super('Document revision conflict');this.name='StorageConflict';}}
const Bundle=z.object({current:z.unknown(),backup:z.unknown().nullable()}).strict();
export const MAX_JSON_LENGTH=32*1024*1024;
function parseBounded(raw:string):unknown {if(raw.length>MAX_JSON_LENGTH)throw new Error('Document exceeds import limit');return JSON.parse(raw);}
function readEnvelope(input:unknown,id:string):StoredDocument|null{
 const r=Envelope.safeParse(input);return r.success&&r.data.document.id===id?r.data:null;
}
export class LocalStorageAdapter implements StorageAdapter {
 constructor(private readonly store:KeyValueStore,private readonly now:()=>Date=()=>new Date()){}
 private key(id:string){return 'studio-visual-v2:'+id;}
 private read(id:string):LoadResult{
  const raw=this.store.getItem(this.key(id));if(raw===null)return {status:'empty'};
  try{
   const bundle=Bundle.parse(parseBounded(raw));
   const current=readEnvelope(bundle.current,id);
   if(current)return {status:'ready',value:current};
   const backup=readEnvelope(bundle.backup,id);
   if(backup)return {status:'recovered',value:backup,raw};
  }catch{/* Preserve the original bytes for explicit recovery. */}
  return {status:'invalid',raw};
 }
 async load(id:string){return this.read(id);}
 async save(document:StudioDocument,expectedRevision:number|null):Promise<StoredDocument>{
  const valid=DocumentSchema.parse(document);
  const existing=this.read(valid.id);
  if(existing.status==='invalid'||existing.status==='recovered')throw new Error('Explicit recovery required');
  const previous=existing.status==='ready'?existing.value:null;
  if((previous?.revision??null)!==expectedRevision)throw new StorageConflict();
  const current=Envelope.parse({revision:(previous?.revision??0)+1,savedAt:this.now().toISOString(),document:valid});
  const raw=JSON.stringify({current,backup:previous});
  if(raw.length>MAX_JSON_LENGTH)throw new Error('Storage document limit exceeded');
  this.store.setItem(this.key(valid.id),raw);
  return current;
 }
}
export function exportJSON(document:StudioDocument):string{return JSON.stringify(DocumentSchema.parse(document),null,2);}
export function importJSON(raw:string,createId:()=>string):StudioDocument{return migrateDocument(parseBounded(raw),createId);}
export function recoverAsCopy(result:Extract<LoadResult,{status:'recovered'}>,newId:string):StudioDocument{
 if(newId===result.value.document.id)throw new Error('Recovery requires a new document ID');
 return DocumentSchema.parse({...result.value.document,id:newId});
}
export function readLegacy(store:KeyValueStore,createId:()=>string):{document:StudioDocument;raw:string}|null{
 const raw=store.getItem('studio-visual-page-v1');
 return raw===null?null:{document:importJSON(raw,createId),raw};
}
