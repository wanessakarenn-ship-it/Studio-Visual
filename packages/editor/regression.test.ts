import { describe, expect, it } from 'vitest';
import { insertNode, moveNode, updateNode, removeNode } from './operations';
import { PageSchema, type Page, type StudioNode } from '../schema';

const node = (i: number): StudioNode => ({
  id: 'b5100800-0000-4000-8000-' + String(i).padStart(12, '0'),
  kind: 'text', text: String(i), color: '#242433', size: 18, padding: 24
});
const fixture = (): Page => ({version: 1, title: 'Regression', nodes: [node(1), node(2), node(3)]});

describe('legacy editor regression baseline', () => {
  it('moves without mutating the source', () => {
    const page = fixture();
    const next = moveNode(page, node(1).id, 2);
    expect(next.nodes.map(n => n.text)).toEqual(['2','3','1']);
    expect(page.nodes.map(n => n.text)).toEqual(['1','2','3']);
    expect(PageSchema.safeParse(next).success).toBe(true);
  });
  it('rejects invalid movement and unknown selection', () => {
    const page = fixture();
    expect(moveNode(page, node(1).id, -1)).toBe(page);
    expect(moveNode(page, node(1).id, 0.5)).toBe(page);
    expect(moveNode(page, null, 1)).toBe(page);
    expect(moveNode(page, node(3).id, 1)).toBe(page);
  });
  it('rejects duplicate IDs and unsafe style values', () => {
    const page = fixture();
    expect(insertNode(page, node(1))).toBe(page);
    expect(updateNode(page, node(1).id, {color: 'url(x)'})).toBe(page);
    expect(updateNode(page, node(1).id, {size: 97})).toBe(page);
  });
  it('preserves identity on unknown removal and original content on valid removal', () => {
    const page = fixture();
    expect(removeNode(page, null)).toBe(page);
    expect(removeNode(page, node(2).id).nodes.map(n => n.text)).toEqual(['1','3']);
    expect(page.nodes).toHaveLength(3);
  });
  it('enforces the document limit without truncation', () => {
    const page: Page = {version: 1, title: 'Limit', nodes: Array.from({length:500}, (_,i) => node(i+1))};
    expect(insertNode(page, node(501))).toBe(page);
  });
});
