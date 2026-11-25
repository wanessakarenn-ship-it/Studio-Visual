import {describe,it,expect} from 'vitest';
import golden from './fixtures/golden-page.json';
import {DocumentSchema,resolveStyle} from './index';
describe('golden page',()=>{
 it('validates the reference landing',()=>expect(DocumentSchema.safeParse(golden).success).toBe(true));
 it('contains one H1 and three responsive cards',()=>{const doc=DocumentSchema.parse(golden);const nodes=Object.values(doc.nodes);expect(nodes.filter(n=>n.type==='heading'&&n.props.level===1)).toHaveLength(1);const grid=nodes.find(n=>n.name==='Grid')!;expect(grid.children).toHaveLength(3);expect(resolveStyle(grid.styles,'base').gridColumns).toBe(3);expect(resolveStyle(grid.styles,'mobile').gridColumns).toBe(1);});
 it('rejects mismatched IDs',()=>{const doc=DocumentSchema.parse(golden);doc.nodes[doc.rootId].id=doc.id;expect(DocumentSchema.safeParse(doc).success).toBe(false);});
 it('rejects duplicate anchors',()=>{const doc=DocumentSchema.parse(golden);doc.nodes[doc.rootId].anchor='cta';expect(DocumentSchema.safeParse(doc).success).toBe(false);});
});
