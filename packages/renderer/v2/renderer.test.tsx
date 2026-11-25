import {describe,it,expect} from 'vitest';
import golden from '../../schema/v2/fixtures/golden-page.json';
import {DocumentSchema} from '../../schema/v2';
import {generateCSS} from './styles';
import {renderStaticDocument} from './ssr';
describe('independent renderer',()=>{
 it('renders the complete semantic landing',()=>{const html=renderStaticDocument(golden);expect(html).toContain('<!doctype html>');expect(html).toContain('<h1');expect(html).toContain('Da ideia à publicação.');expect(html).toContain('href="#cta"');expect(html).toContain('lang="pt-BR"');});
 it('resolves tokens and responsive grid CSS',()=>{const css=generateCSS(DocumentSchema.parse(golden));expect(css).toContain('#5945C2');expect(css).toContain('repeat(3,minmax(0,1fr))');expect(css).toContain('repeat(1,minmax(0,1fr))');expect(css).toContain('@media(max-width:767px)');expect(css).not.toContain('color.primary');});
 it('escapes text instead of interpreting markup',()=>{const doc=DocumentSchema.parse(golden);const heading=Object.values(doc.nodes).find(n=>n.type==='heading');if(!heading||heading.type!=='heading')throw new Error('Missing heading');heading.props.text='<script>alert(1)</script>';const html=renderStaticDocument(doc);expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');});
 it('rejects invalid input before rendering',()=>expect(()=>renderStaticDocument({schemaVersion:3})).toThrow());
});
