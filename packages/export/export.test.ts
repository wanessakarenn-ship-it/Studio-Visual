import {describe,it,expect} from 'vitest';
import golden from '../schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../schema/v2';
import {insertBlock} from '../blocks';
import {updateProps} from '../editor-core';
import {buildExport,auditExport} from './index';
import {crc32,createZip} from './zip';
const fixture=()=>DocumentSchema.parse(golden);
function imageDoc(){let i=1000;const r=insertBlock(fixture(),'hero-split',null,()=> 'b5100800-0000-4000-8000-'+String(i++).padStart(12,'0'));if(!r.ok)throw Error(r.error);const n=Object.values(r.document.nodes).find(n=>n.type==='image')!;const assetId='b5100800-0000-4000-8000-000000009999';const u=updateProps(r.document,n.id,{src:{kind:'asset',assetId}});if(!u.ok)throw Error(u.error);return {doc:u.document,assetId};}
describe('export',()=>{
 it('writes known CRC32',()=>expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926));
 it('rejects traversal and duplicate names',()=>{const data=new Uint8Array();expect(()=>createZip([{name:'../x',data}])).toThrow();expect(()=>createZip([{name:'x',data},{name:'x',data}])).toThrow();});
 it('creates static files without editor scripts',async()=>{const r=await buildExport(fixture(),[]);expect(r.entries).toEqual(['index.html','styles.css','studio-document.json','README.md']);const text=new TextDecoder().decode(r.bytes);expect(text).toContain('href="styles.css"');expect(text).toContain('@media(max-width:767px)');expect(text).not.toContain('<script');expect(new DataView(r.bytes.buffer).getUint32(0,true)).toBe(0x04034b50);expect(new DataView(r.bytes.buffer).getUint32(r.bytes.length-22,true)).toBe(0x06054b50);});
 it('blocks missing local assets',async()=>{const {doc}=imageDoc();expect(auditExport(doc,[]).some(i=>i.severity==='error')).toBe(true);await expect(buildExport(doc,[])).rejects.toThrow();});
 it('includes only referenced raster assets',async()=>{const {doc,assetId}=imageDoc();const blob=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});const a={id:assetId,name:'hero.png',mime:blob.type,size:blob.size,blob,createdAt:'2026-11-25'};const r=await buildExport(doc,[a,{...a,id:'other'}]);expect(r.entries.filter(n=>n.startsWith('assets/'))).toEqual(['assets/'+assetId+'.png']);expect(new TextDecoder().decode(r.bytes)).toContain('src="assets/'+assetId+'.png"');});
});
