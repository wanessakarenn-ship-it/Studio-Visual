import {DocumentSchema,IdSchema,type StudioDocument} from '../schema/v2';
import type {Result} from '../editor-core';
import type {StorageAdapter,LoadResult} from '../storage';
export interface KeyIndex {length:number;key(index:number):string|null}
export type PageEntry={id:string;result:Exclude<LoadResult,{status:'empty'}>};
export async function listPages(index:KeyIndex,storage:StorageAdapter):Promise<PageEntry[]>{
 const ids=new Set<string>();
 for(let i=0;i<index.length;i++){const key=index.key(i);if(!key?.startsWith('studio-visual-v2:'))continue;const id=key.slice('studio-visual-v2:'.length);if(IdSchema.safeParse(id).success)ids.add(id);}
 const entries:PageEntry[]=[];
 for(const id of ids){const result=await storage.load(id);if(result.status!=='empty')entries.push({id,result});}
 return entries.sort((a,b)=>{const date=(e:PageEntry)=>e.result.status==='invalid'?'':e.result.value.savedAt;return date(b).localeCompare(date(a))||a.id.localeCompare(b.id);});
}
export function renamePage(doc:StudioDocument,title:string):Result{
 const value=title.trim();if(!value||value.length>200)return {ok:false,error:'INVALID_TITLE'};
 if(value===doc.title)return {ok:true,document:doc};
 const result=DocumentSchema.safeParse({...doc,title:value});return result.success?{ok:true,document:result.data}:{ok:false,error:'INVALID_DOCUMENT'};
}
export function copyPage(doc:StudioDocument,newId:string):StudioDocument{
 if(newId===doc.id)throw Error('Copy requires a new document ID');
 return DocumentSchema.parse({...doc,id:newId,title:doc.title.slice(0,192)+' (cópia)'});
}
