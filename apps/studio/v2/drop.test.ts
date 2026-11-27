import {describe,it,expect} from 'vitest';
import golden from '../../../packages/schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../../../packages/schema/v2';
import {resolveDrop,dropPosition} from './drop';
import {createSession,applyResult,undo} from '../../../packages/editor-core/history';
const id=(i:number)=>'b5100800-0000-4000-8000-'+String(i).padStart(12,'0');
const fixture=()=>DocumentSchema.parse(golden);
describe('layer drop',()=>{
 it('moves before a sibling using post-removal index',()=>{const d=fixture();expect(dropPosition(d,id(9),id(15),'before')).toEqual({parentId:id(8),index:1});const r=resolveDrop(d,id(9),id(15),'before');if(!r.ok)throw Error(r.error);expect(r.document.nodes[id(8)].children).toEqual([id(12),id(9),id(15)]);});
 it('moves after a sibling',()=>{const r=resolveDrop(fixture(),id(9),id(15),'after');if(!r.ok)throw Error(r.error);expect(r.document.nodes[id(8)].children).toEqual([id(12),id(15),id(9)]);});
 it('moves inside another container',()=>{const r=resolveDrop(fixture(),id(10),id(12),'inside');if(!r.ok)throw Error(r.error);expect(r.document.nodes[id(12)].children.at(-1)).toBe(id(10));});
 it('rejects root, self and cycle moves',()=>{const d=fixture();expect(resolveDrop(d,d.rootId,id(2),'inside').ok).toBe(false);expect(resolveDrop(d,id(9),id(9),'inside').ok).toBe(false);expect(resolveDrop(d,id(8),id(9),'inside').ok).toBe(false);});
 it('rejects terminal and locked destinations',()=>{const d=fixture();expect(resolveDrop(d,id(10),id(11),'inside').ok).toBe(false);d.nodes[id(12)].flags.locked=true;expect(resolveDrop(d,id(10),id(12),'inside').ok).toBe(false);});
 it('records a valid drop as one undoable operation',()=>{const d=fixture();const s=applyResult(createSession(d),resolveDrop(d,id(10),id(12),'inside'));expect(s.past).toHaveLength(1);expect(undo(s).document).toEqual(d);});
});
