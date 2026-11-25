import {DocumentSchema,TokensSchema,type Tokens,type StudioDocument,type Breakpoint,type Style} from '../schema/v2';
import {updateStyles,type Result} from '../editor-core';
export type Category=keyof Tokens;
export const categories:Category[]=['color','fontSize','space','radius'];
export const properties:Partial<Record<keyof Style,Category>>={color:'color',backgroundColor:'color',fontSize:'fontSize',borderRadius:'radius',width:'space',maxWidth:'space',minHeight:'space',gap:'space',paddingTop:'space',paddingRight:'space',paddingBottom:'space',paddingLeft:'space',marginTop:'space',marginBottom:'space'};
export function tokenUsage(doc:StudioDocument,category:Category,name:string):number{
 let count=0;for(const n of Object.values(doc.nodes))for(const style of Object.values(n.styles))for(const value of Object.values(style))if(value&&typeof value==='object'&&'token' in value&&value.token===category+'.'+name)count++;return count;
}
function finish(doc:StudioDocument,tokens:Tokens):Result{
 const next={...doc,tokens};return DocumentSchema.safeParse(next).success?{ok:true,document:next}:{ok:false,error:'INVALID_TOKEN'};
}
export function setToken(doc:StudioDocument,category:Category,name:string,value:unknown):Result{
 if(!categories.includes(category)||!/^[a-zA-Z0-9_-]{1,64}$/.test(name)||['__proto__','constructor','prototype'].includes(name))return {ok:false,error:'INVALID_TOKEN'};
 const candidate=TokensSchema.safeParse({...doc.tokens,[category]:{...doc.tokens[category],[name]:value}});
 return candidate.success?finish(doc,candidate.data):{ok:false,error:'INVALID_TOKEN'};
}
export function removeToken(doc:StudioDocument,category:Category,name:string):Result{
 if(!Object.hasOwn(doc.tokens[category],name))return {ok:false,error:'UNKNOWN_TOKEN'};
 if(tokenUsage(doc,category,name))return {ok:false,error:'TOKEN_IN_USE'};
 const values={...doc.tokens[category]};delete values[name];
 return finish(doc,{...doc.tokens,[category]:values});
}
export function bindToken(doc:StudioDocument,id:string,bp:Breakpoint,property:keyof Style,name:string):Result{
 const category=properties[property];if(!category||!Object.hasOwn(doc.tokens[category],name))return {ok:false,error:'UNKNOWN_TOKEN'};
 return updateStyles(doc,id,bp,{[property]:{token:category+'.'+name}});
}
export function detachToken(doc:StudioDocument,id:string,bp:Breakpoint,property:keyof Style):Result{
 const node=doc.nodes[id];if(!node)return {ok:false,error:'INVALID_NODE'};
 const raw=node.styles[bp]?.[property];if(!raw||typeof raw!=='object'||!('token' in raw))return {ok:false,error:'NO_LOCAL_TOKEN'};
 const category=properties[property],name=raw.token.split('.')[1];
 if(!category||!Object.hasOwn(doc.tokens[category],name))return {ok:false,error:'UNKNOWN_TOKEN'};
 return updateStyles(doc,id,bp,{[property]:doc.tokens[category][name]});
}
