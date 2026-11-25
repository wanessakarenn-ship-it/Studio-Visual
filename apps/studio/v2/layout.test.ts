import {describe,it,expect} from 'vitest';
import golden from '../../../packages/schema/v2/fixtures/golden-page.json';
import {DocumentSchema,resolveStyle} from '../../../packages/schema/v2';
import {updateStyles,resetStyle} from '../../../packages/editor-core';
import {generateCSS} from '../../../packages/renderer/v2/styles';
import {styleOrigin,stylePatch} from './layout';
const fixture=()=>DocumentSchema.parse(golden);
describe('layout inspector',()=>{
 it('shows the active source breakpoint',()=>{const d=fixture(),n=Object.values(d.nodes).find(n=>n.name==='Grid')!;expect(styleOrigin(n,'mobile','gridColumns')).toBe('mobile');expect(styleOrigin(n,'mobile','gap')).toBe('base');expect(styleOrigin(n,'mobile','minHeight')).toBeNull();});
 it('updates mobile grid without affecting desktop',()=>{const d=fixture(),n=Object.values(d.nodes).find(n=>n.name==='Grid')!;const r=updateStyles(d,n.id,'mobile',stylePatch('gridColumns',2));if(!r.ok)throw Error(r.error);expect(resolveStyle(r.document.nodes[n.id].styles,'base').gridColumns).toBe(3);expect(resolveStyle(r.document.nodes[n.id].styles,'mobile').gridColumns).toBe(2);});
 it('resets to inherited tablet columns',()=>{const d=fixture(),n=Object.values(d.nodes).find(n=>n.name==='Grid')!;const r=resetStyle(d,n.id,'mobile','gridColumns');if(!r.ok)throw Error(r.error);expect(resolveStyle(r.document.nodes[n.id].styles,'mobile').gridColumns).toBe(2);});
 it('rejects invalid dimensions and grid values',()=>{expect(()=>stylePatch('width',{value:-1,unit:'px'})).toThrow();expect(()=>stylePatch('gap',{value:12,unit:'bad'})).toThrow();expect(()=>stylePatch('gridColumns',13)).toThrow();});
 it('serializes flex and responsive dimensions into CSS',()=>{const d=fixture(),id=d.nodes[d.rootId].children[0];const r=updateStyles(d,id,'mobile',{display:'flex',flexDirection:'row',gap:{value:2,unit:'rem'}});if(!r.ok)throw Error(r.error);expect(generateCSS(r.document)).toContain('display:flex;flex-direction:row;gap:2rem');});
});
