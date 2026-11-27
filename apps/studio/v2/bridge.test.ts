import {describe,it,expect} from 'vitest';
import golden from '../../../packages/schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../../../packages/schema/v2';
import {buildCanvasHTML,parseCanvasMessage} from './bridge';
import {resolveInspectorValue} from './inspector';
const doc=()=>DocumentSchema.parse(golden);
const channel='test-channel';
describe('canvas bridge',()=>{
 it('adds a nonce-restricted script only to editing HTML',()=>{const html=buildCanvasHTML(doc(),channel);expect(html).toContain('script-src \'nonce-test-channel\'');expect(html).toContain('<script nonce="test-channel">');});
 it('rejects invalid channels and unknown IDs',()=>{const d=doc();expect(parseCanvasMessage({kind:'select',channel:'other',id:d.rootId},channel,d)).toBeNull();expect(parseCanvasMessage({kind:'select',channel,id:'unknown'},channel,d)).toBeNull();});
 it('rejects edits under a locked ancestor',()=>{const d=doc();const hero=d.nodes[d.rootId].children[0];d.nodes[hero].flags.locked=true;expect(parseCanvasMessage({kind:'edit',channel,id:d.nodes[hero].children[0],text:'Changed'},channel,d)).toBeNull();});
 it('accepts valid text edits and rejects oversized payloads',()=>{const d=doc(),id=d.nodes[d.nodes[d.rootId].children[0]].children[0];expect(parseCanvasMessage({kind:'edit',channel,id,text:'Changed'},channel,d)).toEqual({kind:'edit',id,text:'Changed'});expect(parseCanvasMessage({kind:'edit',channel,id,text:'x'.repeat(10001)},channel,d)).toBeNull();});
 it('resolves real token values',()=>{expect(resolveInspectorValue({token:'fontSize.hero'},doc().tokens)).toEqual({value:64,unit:'px'});});
});
