import {acceptsChild,type StudioDocument,type StudioNode,type Style,type Tokens} from '../schema/v2';
import {descendants,parentOf,insertNode,type Result,type Subtree} from './index';
export type ComponentClipboard={version:1;subtree:Subtree;tokens:Tokens};
export function copySubtree(doc:StudioDocument,id:string):ComponentClipboard|null{
 if(!doc.nodes[id]||id===doc.rootId)return null;
 const nodes=Object.fromEntries(descendants(doc,id).map(key=>[key,structuredClone(doc.nodes[key])]));
 return {version:1,subtree:{rootId:id,nodes},tokens:structuredClone(doc.tokens)};
}
export function pasteSubtree(doc:StudioDocument,data:ComponentClipboard,selectedId:string|null,createId:()=>string):Result{
 const fail=(error:string):Result=>({ok:false,error});
 if(data.version!==1)return fail('INVALID_CLIPBOARD');
 const root=data.subtree.nodes[data.subtree.rootId];if(!root)return fail('INVALID_CLIPBOARD');
 const mapping=new Map<string,string>(),used=new Set(Object.keys(doc.nodes));
 for(const id of Object.keys(data.subtree.nodes)){const next=createId();if(used.has(next))return fail('DUPLICATE_ID');used.add(next);mapping.set(id,next);}
 const anchors=new Set(Object.values(doc.nodes).flatMap(n=>n.anchor?[n.anchor]:[])),anchorMap=new Map<string,string>();
 for(const n of Object.values(data.subtree.nodes)){if(!n.anchor)continue;let next=n.anchor,i=1;while(anchors.has(next)){const suffix='-copy-'+i++;next=n.anchor.slice(0,120-suffix.length)+suffix;}anchors.add(next);anchorMap.set(n.anchor,next);}
 const nodes:Record<string,StudioNode>={};
 for(const old of Object.values(data.subtree.nodes)){
  const n=structuredClone(old);n.id=mapping.get(old.id)!;n.children=n.children.map(id=>mapping.get(id)!);
  if(n.anchor)n.anchor=anchorMap.get(n.anchor);
  if(n.type==='button'&&n.props.href?.startsWith('#')){const target=anchorMap.get(n.props.href.slice(1));if(target)n.props.href='#'+target;}
  for(const style of Object.values(n.styles)){for(const [key,value] of Object.entries(style)){if(value&&typeof value==='object'&&'token' in value){const [category,name]=value.token.split('.');if(!Object.hasOwn(data.tokens,category)||!Object.hasOwn(data.tokens[category as keyof Tokens],name))return fail('UNKNOWN_TOKEN');Object.assign(style,{[key as keyof Style]:data.tokens[category as keyof Tokens][name]});}}}
  nodes[n.id]=n;
 }
 let selected=selectedId?doc.nodes[selectedId]:undefined;
 let parent=selected&&acceptsChild(selected.type,root.type)?selected:selected?parentOf(doc,selected.id):undefined;
 while(parent&&!acceptsChild(parent.type,root.type)){selected=parent;parent=parentOf(doc,parent.id);}
 parent??=doc.nodes[doc.rootId];
 if(!acceptsChild(parent.type,root.type))return fail('INVALID_PARENT');
 const index=selected&&parent.children.includes(selected.id)?parent.children.indexOf(selected.id)+1:parent.children.length;
 return insertNode(doc,{rootId:mapping.get(root.id)!,nodes},{parentId:parent.id,index});
}
