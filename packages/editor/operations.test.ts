import {describe, it, expect} from 'vitest';
import {emptyPage, type StudioNode} from '../schema';
import {insertNode, moveNode, updateNode, removeNode} from './operations';
const first: StudioNode = {id:'b5100800-0000-4000-8000-000000000000',kind:'text',text:'A',color:'#123456',size:18,padding:0};
const second = {...first,id:'b5100800-0000-4000-8000-000000000001',text:'B'};
const page = {...emptyPage,nodes:[first,second]};
describe('editor operations', () => {
  it('inserts without mutating the original',()=>{expect(insertNode(emptyPage,first).nodes).toEqual([first]);expect(emptyPage.nodes).toEqual([]);});
  it('rejects duplicate IDs',()=>expect(insertNode(page,first)).toBe(page));
  it('enforces the 500 node limit',()=>{const full={...emptyPage,nodes:Array.from({length:500},(_,i)=>({...first,id:'b5100800-0000-4000-8000-'+String(i+10).padStart(12,'0')}))};expect(insertNode(full,first)).toBe(full);});
  it('moves nodes without changing the source',()=>{expect(moveNode(page,first.id,1).nodes).toEqual([second,first]);expect(page.nodes).toEqual([first,second]);});
  it('ignores invalid moves',()=>{expect(moveNode(page,first.id,-1)).toBe(page);expect(moveNode(page,null,1)).toBe(page);});
  it('validates property changes',()=>{expect(updateNode(page,first.id,{size:500})).toBe(page);expect(updateNode(page,first.id,{text:'New'}).nodes[0].text).toBe('New');});
  it('removes only the selected node',()=>{expect(removeNode(page,first.id).nodes).toEqual([second]);expect(removeNode(page,null)).toBe(page);});
});
