import {describe,it,expect} from 'vitest';
import golden from '../schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../schema/v2';
import {LocalStorageAdapter} from '../storage';
import {listPages,renamePage,copyPage} from './index';
const id='b5100800-0000-4000-8000-000000009999';
function memory(){const m=new Map<string,string>();return {get length(){return m.size;},key:(i:number)=>Array.from(m.keys())[i]??null,getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};}
describe('Studio Pages',()=>{
 it('discovers existing documents without an index migration',async()=>{const store=memory(),a=new LocalStorageAdapter(store),d=DocumentSchema.parse(golden);await a.save(d,null);await a.save(copyPage(d,id),null);store.setItem('studio-visual-page-v1','legacy');expect(await listPages(store,a)).toHaveLength(2);});
 it('retains corrupt documents in the listing',async()=>{const store=memory(),a=new LocalStorageAdapter(store);store.setItem('studio-visual-v2:'+id,'broken');expect(await listPages(store,a)).toEqual([{id,result:{status:'invalid',raw:'broken'}}]);});
 it('renames without mutating source',()=>{const d=DocumentSchema.parse(golden),r=renamePage(d,'  Nova página  ');if(!r.ok)throw Error(r.error);expect(r.document.title).toBe('Nova página');expect(d.title).toBe(golden.title);expect(renamePage(d,' ').ok).toBe(false);});
 it('copies with independent document identity and preserved assets and nodes',()=>{const d=DocumentSchema.parse(golden),c=copyPage(d,id);expect(c.id).toBe(id);expect(c.nodes).toEqual(d.nodes);expect(c.tokens).toEqual(d.tokens);expect(()=>copyPage(d,d.id)).toThrow();});
 it('does not overwrite existing pages when saving copies',async()=>{const store=memory(),a=new LocalStorageAdapter(store),d=DocumentSchema.parse(golden);await a.save(d,null);const c=copyPage(d,id);await a.save(c,null);await expect(a.save(c,null)).rejects.toThrow();expect(await a.load(d.id)).toMatchObject({status:'ready',value:{document:d,revision:1}});});
});
