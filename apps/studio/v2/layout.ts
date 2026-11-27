import {StyleSchema,type Style,type Breakpoint,type StudioNode} from '../../../packages/schema/v2';
export function styleOrigin(node:StudioNode,bp:Breakpoint,key:keyof Style):Breakpoint|null{
 const order:Breakpoint[]=bp==='mobile'?['mobile','tablet','base']:bp==='tablet'?['tablet','base']:['base'];
 return order.find(b=>node.styles[b]?.[key]!==undefined)??null;
}
export function stylePatch<K extends keyof Style>(key:K,value:unknown):Partial<Style>{
 return StyleSchema.parse({[key]:value});
}
