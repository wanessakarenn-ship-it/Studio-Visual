import { PageSchema, type Page, type StudioNode } from '../schema';

export function insertNode(page: Page, node: StudioNode): Page {
  const result = PageSchema.safeParse({...page, nodes: [...page.nodes, node]});
  return result.success ? result.data : page;
}

export function moveNode(page: Page, id: string | null, delta: number): Page {
  const index = page.nodes.findIndex(node => node.id === id);
  const target = index + delta;
  if (!Number.isInteger(delta) || index < 0 || target < 0 || target >= page.nodes.length || target === index) return page;
  const nodes = [...page.nodes];
  const [node] = nodes.splice(index, 1);
  nodes.splice(target, 0, node);
  return {...page, nodes};
}

export function updateNode(page: Page, id: string | null, patch: Partial<Omit<StudioNode, 'id'>>): Page {
  if (!page.nodes.some(node => node.id === id)) return page;
  const result = PageSchema.safeParse({...page, nodes: page.nodes.map(node => node.id === id ? {...node, ...patch, id: node.id} : node)});
  return result.success ? result.data : page;
}

export function removeNode(page: Page, id: string | null): Page {
  if (!page.nodes.some(node => node.id === id)) return page;
  return {...page, nodes: page.nodes.filter(node => node.id !== id)};
}
