import { z } from 'zod';
export const BreakpointSchema=z.enum(['base','tablet','mobile']);
export const ColorSchema=z.string().regex(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/);
export const DimensionSchema=z.object({value:z.number().finite().min(0).max(10000),unit:z.enum(['px','%','rem','vw','vh'])}).strict();
const ref=(category:string)=>z.object({token:z.string().regex(new RegExp('^'+category+'\\.[a-zA-Z0-9_-]{1,64}$'))}).strict();
const color=z.union([ColorSchema,ref('color')]);
const space=z.union([DimensionSchema,ref('space')]);
const font=z.union([DimensionSchema,ref('fontSize')]);
const radius=z.union([DimensionSchema,ref('radius')]);
export const StyleSchema=z.object({
 display:z.enum(['block','flex','grid','none']),flexDirection:z.enum(['row','column']),flexWrap:z.enum(['wrap','nowrap']),
 justifyContent:z.enum(['start','center','end','space-between']),alignItems:z.enum(['start','center','end','stretch']),
 gridColumns:z.number().int().min(1).max(12),width:z.union([space,z.literal('auto')]),maxWidth:space,minHeight:space,
 paddingTop:space,paddingRight:space,paddingBottom:space,paddingLeft:space,marginTop:space,marginBottom:space,gap:space,
 color,backgroundColor:color,fontSize:font,fontWeight:z.number().int().min(100).max(900),lineHeight:z.number().min(.8).max(4),textAlign:z.enum(['left','center','right']),borderRadius:radius,opacity:z.number().min(0).max(1)
}).partial().strict();
export const ResponsiveStylesSchema=z.object({base:StyleSchema,tablet:StyleSchema.optional(),mobile:StyleSchema.optional()}).strict();
const key=z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/).refine(k=>!['__proto__','constructor','prototype'].includes(k));
export const TokensSchema=z.object({color:z.record(key,ColorSchema),space:z.record(key,DimensionSchema),radius:z.record(key,DimensionSchema),fontSize:z.record(key,DimensionSchema)}).strict();
export type Breakpoint=z.infer<typeof BreakpointSchema>;
export type Style=z.infer<typeof StyleSchema>;
export type Tokens=z.infer<typeof TokensSchema>;
export function resolveStyle(styles:z.infer<typeof ResponsiveStylesSchema>,breakpoint:Breakpoint):Style {
 return {...styles.base,...(breakpoint!=='base'?styles.tablet:{}),...(breakpoint==='mobile'?styles.mobile:{})};
}
