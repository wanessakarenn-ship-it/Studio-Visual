import {describe,it,expect} from 'vitest';
import {shortcutFor} from './shortcuts';
const base={key:'z',ctrlKey:true,metaKey:false,altKey:false,shiftKey:false,isComposing:false,repeat:false};
describe('shortcuts',()=>{
 it('supports ctrl and meta undo',()=>{expect(shortcutFor(base,false)).toBe('undo');expect(shortcutFor({...base,ctrlKey:false,metaKey:true},false)).toBe('undo');});
 it('supports redo and save',()=>{expect(shortcutFor({...base,shiftKey:true},false)).toBe('redo');expect(shortcutFor({...base,key:'s'},false)).toBe('save');});
 it('does not intercept text editing or IME',()=>{expect(shortcutFor(base,true)).toBeNull();expect(shortcutFor({...base,isComposing:true},false)).toBeNull();expect(shortcutFor({...base,repeat:true},false)).toBeNull();});
});
