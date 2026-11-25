import {describe,it,expect} from 'vitest';
import golden from '../schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../schema/v2';
import {setToken,removeToken,bindToken,detachToken,tokenUsage} from './index';
import {generateCSS} from '../renderer/v2/styles';
import {createSession,applyResult,undo} from '../editor-core/history';
const fixture=()=>DocumentSchema.parse(golden);
describe('Studio Brand',()=>{
 it('updates linked styles without changing nodes',()=>{const d=fixture(),r=setToken(d,'color','primary','#112233');if(!r.ok)throw Error(r.error);expect(r.document.nodes).toBe(d.nodes);expect(generateCSS(r.document)).toContain('#112233');expect(d.tokens.color.primary).not.toBe('#112233');});
 it('protects referenced tokens',()=>{const d=fixture();expect(tokenUsage(d,'color','primary')).toBeGreaterThan(0);expect(removeToken(d,'color','primary')).toEqual({ok:false,error:'TOKEN_IN_USE'});});
 it('validates token names and types',()=>{const d=fixture();expect(setToken(d,'color','__proto__','#ffffff').ok).toBe(false);expect(setToken(d,'space','invalid','#ffffff').ok).toBe(false);});
 it('binds and detaches only the selected breakpoint',()=>{const d=fixture(),id=d.nodes[d.rootId].children[0];const b=bindToken(d,id,'mobile','backgroundColor','primary');if(!b.ok)throw Error(b.error);const r=detachToken(b.document,id,'mobile','backgroundColor');if(!r.ok)throw Error(r.error);expect(r.document.nodes[id].styles.mobile?.backgroundColor).toBe(d.tokens.color.primary);expect(r.document.nodes[id].styles.base).toEqual(d.nodes[id].styles.base);});
 it('supports undo of a global token edit',()=>{const d=fixture();const s=applyResult(createSession(d),setToken(d,'color','primary','#123456'));expect(undo(s).document).toEqual(d);});
});
