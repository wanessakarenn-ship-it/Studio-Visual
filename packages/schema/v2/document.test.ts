import {describe,it,expect} from 'vitest';
import {DocumentSchema,migrateDocument,resolveStyle,isSafeHref} from './index';
import type {Page} from '../index';
const id=(i:number)=>'b5100800-0000-4000-8000-'+String(i).padStart(12,'0');
const legacy=(count=1):Page=>({version:1,title:'Legacy',nodes:Array.from({length:count},(_,i)=>({id:id(i+1),kind:'text',text:'Original '+i,color:'#242433',size:18,padding:24}))});
function fixture(count=1){let i=1000;return migrateDocument(legacy(count),()=>id(i++));}
describe('v2 document contract',()=>{
 it('preserves legacy content and does not mutate the source',()=>{const old=legacy();const before=JSON.stringify(old);let i=1000;const doc=migrateDocument(old,()=>id(i++));expect(doc.nodes[id(1)].props).toEqual({text:'Original 0'});expect(JSON.stringify(old)).toBe(before);expect(DocumentSchema.safeParse(doc).success).toBe(true);});
 it('preserves all 500 legacy nodes',()=>expect(Object.keys(fixture(500).nodes)).toHaveLength(502));
 it('rejects future versions',()=>expect(()=>migrateDocument({schemaVersion:3},()=>id(1000))).toThrow());
 it('rejects duplicate generated IDs',()=>expect(()=>migrateDocument(legacy(),()=>id(1))).toThrow());
 it('rejects orphan nodes',()=>{const doc=fixture();doc.nodes[doc.rootId].children=[];expect(DocumentSchema.safeParse(doc).success).toBe(false);});
 it('rejects a missing child',()=>{const doc=fixture();doc.nodes[doc.rootId].children.push(id(999));expect(DocumentSchema.safeParse(doc).success).toBe(false);});
 it('rejects multiple parents or duplicate child references',()=>{const doc=fixture();doc.nodes[doc.rootId].children.push(doc.nodes[doc.rootId].children[0]);expect(DocumentSchema.safeParse(doc).success).toBe(false);});
 it('rejects cycles',()=>{const doc=fixture();const c=doc.nodes[doc.rootId].children[0];doc.nodes[c].children.push(c);expect(DocumentSchema.safeParse(doc).success).toBe(false);});
 it('rejects children on terminal nodes',()=>{const doc=fixture(2);doc.nodes[id(1)].children.push(id(2));expect(DocumentSchema.safeParse(doc).success).toBe(false);});
 it('rejects missing tokens',()=>{const doc=fixture();doc.nodes[id(1)].styles.base.color={token:'color.missing'};expect(DocumentSchema.safeParse(doc).success).toBe(false);});
 it('rejects incompatible token categories',()=>{const doc=fixture();expect(DocumentSchema.safeParse({...doc,nodes:{...doc.nodes,[id(1)]:{...doc.nodes[id(1)],styles:{base:{color:{token:'space.4'}}}}}}).success).toBe(false);});
 it('resolves responsive inheritance in order',()=>expect(resolveStyle({base:{fontWeight:400,color:'#111111'},tablet:{fontWeight:600},mobile:{color:'#222222'}},'mobile')).toEqual({fontWeight:600,color:'#222222'}));
 it('rejects unsafe hrefs',()=>{for(const url of ['javascript:alert(1)','//evil.test','/\\evil.test','data:text/html,x','https://user:pass@example.com'])expect(isSafeHref(url)).toBe(false);});
 it('accepts supported hrefs',()=>{for(const url of ['https://example.com','/contato','#cta'])expect(isSafeHref(url)).toBe(true);});
});
