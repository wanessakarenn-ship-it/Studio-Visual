import {describe,it,expect} from 'vitest';
import {validateImage,MAX_ASSET_BYTES} from './index';
import {safeAssetSource} from '../renderer/v2/assetSources';
import {DocumentSchema} from '../schema/v2';
import golden from '../schema/v2/fixtures/golden-page.json';
import {insertBlock} from '../blocks';
import {updateProps} from '../editor-core';
import {renderStaticDocument} from '../renderer/v2/ssr';
const png=new Uint8Array([137,80,78,71,13,10,26,10]);
describe('assets',()=>{
 it('accepts supported PNG signature',async()=>expect(validateImage(new Blob([png],{type:'image/png'}))).resolves.toBeUndefined());
 it('rejects SVG and spoofed MIME',async()=>{await expect(validateImage(new Blob(['<svg/>'],{type:'image/svg+xml'}))).rejects.toThrow();await expect(validateImage(new Blob(['bad'],{type:'image/png'}))).rejects.toThrow();});
 it('rejects oversized files',async()=>expect(validateImage(new Blob([new Uint8Array(MAX_ASSET_BYTES+1)],{type:'image/png'}))).rejects.toThrow());
 it('rejects unsafe asset source strings',()=>{expect(safeAssetSource({a:'javascript:alert(1)'},'a')).toBeUndefined();expect(safeAssetSource({a:'data:image/svg+xml;base64,AAAA'},'a')).toBeUndefined();expect(safeAssetSource({a:'data:image/png;base64,AAAA'},'a')).toBe('data:image/png;base64,AAAA');});
 it('renders mapped image assets without embedding bytes in document JSON',()=>{let i=1000;const d=DocumentSchema.parse(golden);const r=insertBlock(d,'hero-split',null,()=> 'b5100800-0000-4000-8000-'+String(i++).padStart(12,'0'));if(!r.ok)throw Error(r.error);const n=Object.values(r.document.nodes).find(n=>n.type==='image')!;const assetId='b5100800-0000-4000-8000-000000009999';const u=updateProps(r.document,n.id,{src:{kind:'asset',assetId}});if(!u.ok)throw Error(u.error);expect(renderStaticDocument(u.document,{[assetId]:'data:image/png;base64,AAAA'})).toContain('data:image/png;base64,AAAA');expect(JSON.stringify(u.document)).not.toContain('base64');expect(renderStaticDocument(u.document)).toContain('Imagem indisponível');});
});
