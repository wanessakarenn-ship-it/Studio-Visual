import {describe,it,expect} from 'vitest';
import golden from '../schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../schema/v2';
import {copySubtree,pasteSubtree} from './clipboard';
import {createSession,applyResult,undo} from './history';
const d=()=>DocumentSchema.parse(golden);
const id=(i:number)=>'b5100800-0000-4000-8000-'+String(i).padStart(12,'0');
function ids(){let n=1000;return ()=>id(n++);}
describe('component clipboard',()=>{
 it('copies a subtree and remaps IDs and anchors',()=>{const doc=d(),clip=copySubtree(doc,id(2))!;const r=pasteSubtree(doc,clip,id(2),ids());if(!r.ok)throw Error(r.error);expect(r.selectedId).not.toBe(id(2));expect(r.document.nodes[r.selectedId!].anchor).not.toBe(doc.nodes[id(2)].anchor);expect(DocumentSchema.safeParse(r.document).success).toBe(true);});
 it('resolves source tokens and preserves source document',()=>{const doc=d(),clip=copySubtree(doc,id(2))!;const r=pasteSubtree(doc,clip,null,ids());if(!r.ok)throw Error(r.error);expect(doc).toEqual(d());expect(r.document.nodes[r.selectedId!].styles.base.backgroundColor).toBe(doc.tokens.color.hero);});
 it('supports one undoable paste',()=>{const doc=d(),clip=copySubtree(doc,id(2))!;const s=applyResult(createSession(doc),pasteSubtree(doc,clip,null,ids()));expect(undo(s).document).toEqual(doc);});
 it('rejects root copy and duplicate IDs',()=>{const doc=d();expect(copySubtree(doc,doc.rootId)).toBeNull();expect(pasteSubtree(doc,copySubtree(doc,id(2))!,null,()=>doc.rootId).ok).toBe(false);});
});
