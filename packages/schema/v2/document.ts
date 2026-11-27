import {z} from 'zod';
import {IdSchema,NodeSchema,acceptsChild} from './node';
import {TokensSchema,type Tokens} from './styles';
export const SCHEMA_VERSION=2;
export const MAX_NODES=502; // Preserve all 500 legacy elements plus two structural nodes.
export const MAX_DEPTH=32;
const Shape=z.object({schemaVersion:z.literal(2),id:IdSchema,title:z.string().max(200),rootId:IdSchema,nodes:z.record(IdSchema,NodeSchema),tokens:TokensSchema,metadata:z.object({language:z.string().min(1).max(35),description:z.string().max(500).optional()}).strict()}).strict();
export type StudioDocument=z.infer<typeof Shape>;
export const DocumentSchema=Shape.superRefine((doc,ctx)=>{
 const issue=(message:string,path:(string|number)[]=['nodes'])=>ctx.addIssue({code:z.ZodIssueCode.custom,message,path});
 const ids=Object.keys(doc.nodes);
 if(ids.length>MAX_NODES){issue('Node limit exceeded');return;}
 if(doc.nodes[doc.rootId]?.type!=='root'){issue('Invalid root');return;}
 const seen=new Set<string>(),anchors=new Set<string>();
 const pending=[{id:doc.rootId,depth:0}];
 while(pending.length){
  const {id,depth}=pending.pop()!;
  if(depth>MAX_DEPTH){issue('Depth limit exceeded');continue;}
  if(seen.has(id)){issue('Cycle or multiple parents: '+id);continue;}
  const n=doc.nodes[id];
  if(!n){issue('Missing node: '+id);continue;}
  seen.add(id);
  if(n.id!==id)issue('Mismatched node ID: '+id);
  if(id!==doc.rootId&&n.type==='root')issue('Multiple roots');
  if(n.anchor){if(anchors.has(n.anchor))issue('Duplicate anchor: '+n.anchor);anchors.add(n.anchor);}
  for(const child of n.children){
   const target=doc.nodes[child];
   if(target&&!acceptsChild(n.type,target.type))issue('Invalid composition: '+id+' / '+child);
   pending.push({id:child,depth:depth+1});
  }
  for(const [bp,style] of Object.entries(n.styles)){
   for(const [property,value] of Object.entries(style)){
    if(typeof value==='object'&&value!==null&&'token' in value){
     const [category,key]=String(value.token).split('.');
     if(!Object.hasOwn(doc.tokens,category)||!Object.hasOwn(doc.tokens[category as keyof Tokens],key))issue('Unknown token: '+value.token,['nodes',id,'styles',bp,property]);
    }
   }
  }
 }
 if(seen.size!==ids.length)issue('Orphan nodes');
});
