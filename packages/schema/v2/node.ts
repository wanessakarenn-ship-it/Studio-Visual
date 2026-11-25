import {z} from 'zod';
import {ResponsiveStylesSchema} from './styles';
export const IdSchema=z.string().uuid();
export function isSafeHref(value:string):boolean {
 if(!value||value.length>2048||Array.from(value).some(c=>c.charCodeAt(0)<=32||c.charCodeAt(0)===127||c.charCodeAt(0)===92))return false;
 if(value.startsWith('#'))return /^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(value);
 if(value.startsWith('/'))return !value.startsWith('//');
 try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}
}
const common=z.object({id:IdSchema,name:z.string().max(120),anchor:z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/).max(120).optional(),children:z.array(IdSchema).max(500),styles:ResponsiveStylesSchema,flags:z.object({hidden:z.boolean(),locked:z.boolean()}).strict()});
const empty=z.object({}).strict();
export const NodeSchema=z.discriminatedUnion('type',[
 common.extend({type:z.literal('root'),props:empty}).strict(),
 common.extend({type:z.literal('section'),props:empty}).strict(),
 common.extend({type:z.literal('container'),props:empty}).strict(),
 common.extend({type:z.literal('heading'),props:z.object({text:z.string().max(10000),level:z.number().int().min(1).max(6)}).strict()}).strict(),
 common.extend({type:z.literal('text'),props:z.object({text:z.string().max(10000)}).strict()}).strict(),
 common.extend({type:z.literal('button'),props:z.object({label:z.string().max(10000),href:z.string().refine(isSafeHref).optional()}).strict()}).strict(),
 common.extend({type:z.literal('image'),props:z.object({src:z.discriminatedUnion('kind',[z.object({kind:z.literal('asset'),assetId:IdSchema}).strict(),z.object({kind:z.literal('url'),url:z.string().max(2048).url().refine(v=>isSafeHref(v)&&v.startsWith('https://'))}).strict(),z.object({kind:z.literal('placeholder')}).strict()]),alt:z.string().max(500),decorative:z.boolean(),fit:z.enum(['cover','contain'])}).strict()}).strict(),
 common.extend({type:z.literal('divider'),props:empty}).strict()
]);
export type StudioNode=z.infer<typeof NodeSchema>;
export type NodeType=StudioNode['type'];
export type NodeId=z.infer<typeof IdSchema>;
export function acceptsChild(parent:NodeType,child:NodeType):boolean {
 if(child==='root')return false;
 if(parent==='root')return child==='section'||child==='container';
 return (parent==='section'||parent==='container')&&child!=='section';
}
