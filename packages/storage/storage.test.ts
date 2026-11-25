import {describe,it,expect,vi} from 'vitest';
import golden from '../schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../schema/v2';
import {LocalStorageAdapter,StorageConflict,exportJSON,importJSON,readLegacy,recoverAsCopy,type KeyValueStore} from './index';
import {Autosave} from './autosave';
function memory(){const data=new Map<string,string>();const store:KeyValueStore={getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);}};return {data,store};}
const fixture=()=>DocumentSchema.parse(golden);
const id='b5100800-0000-4000-8000-000000009999';
describe('local storage v2',()=>{
 it('round trips JSON without data loss',()=>{const d=fixture();expect(importJSON(exportJSON(d),()=>id)).toEqual(d);});
 it('saves revisions and retains the previous valid version',async()=>{const {store,data}=memory();const a=new LocalStorageAdapter(store);const d=fixture();await a.save(d,null);await a.save({...d,title:'Updated'},1);const raw=JSON.parse(data.get('studio-visual-v2:'+d.id)!);expect(raw.backup.document.title).toBe(d.title);expect(await a.load(d.id)).toMatchObject({status:'ready',value:{revision:2}});});
 it('rejects stale sequential writes',async()=>{const {store}=memory();const a=new LocalStorageAdapter(store);const d=fixture();await a.save(d,null);await expect(a.save(d,null)).rejects.toBeInstanceOf(StorageConflict);});
 it('recovers a valid backup without rewriting corrupt data',async()=>{const {store,data}=memory();const a=new LocalStorageAdapter(store);const d=fixture();await a.save(d,null);await a.save(d,1);const key='studio-visual-v2:'+d.id;const raw=JSON.parse(data.get(key)!);raw.current.document.rootId=id;const broken=JSON.stringify(raw);data.set(key,broken);const r=await a.load(d.id);expect(r.status).toBe('recovered');if(r.status!=='recovered')throw Error('Expected recovery');expect(recoverAsCopy(r,id).id).toBe(id);await expect(a.save(d,1)).rejects.toThrow();expect(data.get(key)).toBe(broken);});
 it('preserves invalid JSON',async()=>{const {store,data}=memory();const d=fixture();data.set('studio-visual-v2:'+d.id,'{broken');const a=new LocalStorageAdapter(store);expect(await a.load(d.id)).toEqual({status:'invalid',raw:'{broken'});await expect(a.save(d,null)).rejects.toThrow();});
 it('propagates quota errors',async()=>{const {store}=memory();store.setItem=()=>{throw Error('Quota exceeded');};await expect(new LocalStorageAdapter(store).save(fixture(),null)).rejects.toThrow('Quota exceeded');});
 it('reads legacy without modifying the original',()=>{const {store,data}=memory();const raw=JSON.stringify({version:1,title:'Legacy',nodes:[]});store.setItem('studio-visual-page-v1',raw);let i=1000;const r=readLegacy(store,()=> 'b5100800-0000-4000-8000-'+String(i++).padStart(12,'0'));expect(r?.document.title).toBe('Legacy');expect(data.get('studio-visual-page-v1')).toBe(raw);});
 it('rejects unsupported imports',()=>expect(()=>importJSON('{"schemaVersion":3}',()=>id)).toThrow());
});
describe('autosave',()=>{
 it('debounces and saves the latest document',async()=>{vi.useFakeTimers();try{const {store}=memory();const a=new LocalStorageAdapter(store);const d=fixture();const states:string[]=[];const s=new Autosave(a,d.id,null,state=>states.push(state));s.schedule(d);s.schedule({...d,title:'Latest'});await vi.advanceTimersByTimeAsync(800);expect(await a.load(d.id)).toMatchObject({status:'ready',value:{revision:1,document:{title:'Latest'}}});expect(states.at(-1)).toBe('saved');s.dispose();}finally{vi.useRealTimers();}});
 it('reports failure and permits explicit retry',async()=>{const {store}=memory();const d=fixture();const write=store.setItem;store.setItem=()=>{throw Error('Quota');};const states:string[]=[];const s=new Autosave(new LocalStorageAdapter(store),d.id,null,state=>states.push(state));s.schedule(d);await expect(s.flush()).rejects.toThrow('Quota');expect(states.at(-1)).toBe('error');store.setItem=write;await s.flush();expect(states.at(-1)).toBe('saved');s.dispose();});
});
