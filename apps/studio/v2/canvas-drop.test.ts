import {describe,it,expect} from 'vitest';
import golden from '../../../packages/schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../../../packages/schema/v2';
import {parseCanvasMessage,buildCanvasHTML} from './bridge';
const id=(i:number)=>'b5100800-0000-4000-8000-'+String(i).padStart(12,'0');
const doc=()=>DocumentSchema.parse(golden);
const message={kind:'drop',channel:'test',id:id(10),targetId:id(12),zone:'inside'};
describe('canvas drop bridge',()=>{
 it('accepts validated moves',()=>expect(parseCanvasMessage(message,'test',doc())).toEqual({kind:'drop',id:id(10),targetId:id(12),zone:'inside'}));
 it('rejects unsupported zones and foreign channels',()=>{expect(parseCanvasMessage({...message,zone:'outside'},'test',doc())).toBeNull();expect(parseCanvasMessage(message,'other',doc())).toBeNull();});
 it('rejects locked destinations',()=>{const d=doc();d.nodes[id(12)].flags.locked=true;expect(parseCanvasMessage(message,'test',d)).toBeNull();});
 it('rejects cycles',()=>expect(parseCanvasMessage({...message,id:id(8),targetId:id(9)},'test',doc())).toBeNull());
 it('adds editing-only drag listeners',()=>expect(buildCanvasHTML(doc(),'test')).toContain("document.addEventListener('dragstart'"));
});
