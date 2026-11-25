import {describe,it,expect} from 'vitest';
import golden from '../schema/v2/fixtures/golden-page.json';
import {DocumentSchema,resolveStyle} from '../schema/v2';
import {catalog,insertBlock} from './index';
import {createSession,applyResult,undo} from '../editor-core/history';
const fixture=()=>DocumentSchema.parse(golden);
function ids(){let i=1000;return ()=> 'b5100800-0000-4000-8000-'+String(i++).padStart(12,'0');}
describe('Studio Blocks',()=>{
 it('inserts every catalog block into a valid document',()=>{const generate=ids();let doc=fixture();for(const block of catalog){const r=insertBlock(doc,block.id,null,generate);if(!r.ok)throw Error(r.error);doc=r.document;}expect(DocumentSchema.safeParse(doc).success).toBe(true);expect(doc.nodes[doc.rootId].children).toHaveLength(9);});
 it('inserts after the selected top-level section',()=>{const d=fixture(),hero=d.nodes[d.rootId].children[0];const r=insertBlock(d,'cta-banner',d.nodes[hero].children[0],ids());if(!r.ok)throw Error(r.error);expect(r.document.nodes[d.rootId].children[1]).toBe(r.selectedId);});
 it('avoids a second H1 when adding a hero',()=>{const r=insertBlock(fixture(),'hero-centered',null,ids());if(!r.ok)throw Error(r.error);expect(Object.values(r.document.nodes).filter(n=>n.type==='heading'&&n.props.level===1)).toHaveLength(1);});
 it('creates responsive benefit columns',()=>{const r=insertBlock(fixture(),'benefits-grid',null,ids());if(!r.ok)throw Error(r.error);const grid=Object.values(r.document.nodes).find(n=>n.name==='Grid de benefícios')!;expect(['base','tablet','mobile'].map(b=>resolveStyle(grid.styles,b as 'base'|'tablet'|'mobile').gridColumns)).toEqual([3,2,1]);});
 it('inserts and undoes a whole block as one operation',()=>{const d=fixture(),s=applyResult(createSession(d),insertBlock(d,'hero-split',null,ids()));expect(s.past).toHaveLength(1);expect(undo(s).document).toEqual(d);});
 it('rejects repeated generated IDs without modifying source',()=>{const d=fixture();expect(insertBlock(d,'hero-centered',null,()=>d.rootId).ok).toBe(false);expect(d).toEqual(fixture());});
});
