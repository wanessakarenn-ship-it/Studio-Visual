import { z } from 'zod';
export const NodeSchema = z.object({id:z.string().uuid(),kind:z.enum(['heading','text','button','section']),text:z.string().max(10000),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),size:z.number().int().min(12).max(96),padding:z.number().int().min(0).max(120)});
export const PageSchema=z.object({version:z.literal(1),title:z.string().max(200),nodes:z.array(NodeSchema).max(500)}).superRefine((page,ctx)=>{if(new Set(page.nodes.map(n=>n.id)).size!==page.nodes.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Duplicate node IDs'});});
export type Page=z.infer<typeof PageSchema>;
export type StudioNode=z.infer<typeof NodeSchema>;
export const emptyPage:Page={version:1,title:'Nova página',nodes:[]};
export function createNode(kind:StudioNode['kind']):StudioNode{return {id:crypto.randomUUID(),kind,text:kind==='heading'?'Novo título':kind==='button'?'Saiba mais':kind==='section'?'Nova seção':'Seu texto aqui',color:'#242433',size:kind==='heading'?40:18,padding:24};}
