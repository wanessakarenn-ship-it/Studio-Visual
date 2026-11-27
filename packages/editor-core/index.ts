import {DocumentSchema,acceptsChild,type StudioDocument,type StudioNode,type Breakpoint,type Style} from '../schema/v2';
export type Position={parentId:string;index:number};
export type Subtree={rootId:string;nodes:Record<string,StudioNode>};
export type Result={ok:true;document:StudioDocument;selectedId?:string}|{ok:false;error:string};
const fail=(error:string):Result=>({ok:false,error});
const finish=(document:StudioDocument,selectedId?:string):Result=>DocumentSchema.safeParse(document).success?{ok:true,document,selectedId}:fail('INVALID_DOCUMENT');
export function parentOf(doc:StudioDocument,id:string){return Object.values(doc.nodes).find(n=>n.children.includes(id));}
export function descendants(doc:StudioDocument,id:string):string[]{
 const seen=new Set<string>(),stack=[id];
 while(stack.length){const next=stack.pop()!;if(seen.has(next))continue;seen.add(next);stack.push(...(doc.nodes[next]?.children??[]));}
 return [...seen];
}
function locked(doc:StudioDocument,id:string):boolean{
 const seen=new Set<string>();
 let current:StudioNode|undefined=doc.nodes[id];
 while(current){if(seen.has(current.id)||current.flags.locked)return true;seen.add(current.id);current=parentOf(doc,current.id);}
 return false;
}
function validIndex(index:number,length:number){return Number.isInteger(index)&&index>=0&&index<=length;}
export function insertNode(doc:StudioDocument,sub:Subtree,pos:Position):Result{
 const p=doc.nodes[pos.parentId],n=sub.nodes[sub.rootId];
 if(!p||!n||!acceptsChild(p.type,n.type))return fail('INVALID_PARENT');
 if(locked(doc,p.id))return fail('LOCKED');
 if(!validIndex(pos.index,p.children.length))return fail('INVALID_INDEX');
 if(Object.keys(sub.nodes).some(id=>Object.hasOwn(doc.nodes,id)))return fail('DUPLICATE_ID');
 const children=[...p.children];children.splice(pos.index,0,n.id);
 return finish({...doc,nodes:{...doc.nodes,...structuredClone(sub.nodes),[p.id]:{...p,children}}},n.id);
}
export function moveNode(doc:StudioDocument,id:string,pos:Position):Result{
 const n=doc.nodes[id],p=doc.nodes[pos.parentId],old=parentOf(doc,id);
 if(!n||!p||!old||id===doc.rootId)return fail('INVALID_NODE');
 if(descendants(doc,id).includes(p.id))return fail('CYCLE');
 if(locked(doc,id)||locked(doc,p.id))return fail('LOCKED');
 if(!acceptsChild(p.type,n.type))return fail('INVALID_PARENT');
 const previous=old.children.filter(x=>x!==id);
 const children=old.id===p.id?previous:[...p.children];
 if(!validIndex(pos.index,children.length))return fail('INVALID_INDEX');
 children.splice(pos.index,0,id);
 if(old.id===p.id&&children.every((x,i)=>x===old.children[i]))return {ok:true,document:doc,selectedId:id};
 return finish({...doc,nodes:{...doc.nodes,[old.id]:{...old,children:previous},[p.id]:{...p,children}}},id);
}
export function removeNode(doc:StudioDocument,id:string):Result{
 const parent=parentOf(doc,id);
 if(!parent||id===doc.rootId)return fail('INVALID_NODE');
 const ids=descendants(doc,id);
 if(ids.some(x=>locked(doc,x)))return fail('LOCKED');
 const nodes={...doc.nodes};
 for(const x of ids)delete nodes[x];
 nodes[parent.id]={...parent,children:parent.children.filter(x=>x!==id)};
 return finish({...doc,nodes},parent.id);
}
export function duplicateNode(doc:StudioDocument,id:string,createId:()=>string):Result{
 const parent=parentOf(doc,id);
 if(!parent||id===doc.rootId)return fail('INVALID_NODE');
 if(locked(doc,id))return fail('LOCKED');
 const ids=descendants(doc,id),map=new Map<string,string>(),used=new Set(Object.keys(doc.nodes));
 for(const old of ids){const next=createId();if(used.has(next))return fail('DUPLICATE_ID');used.add(next);map.set(old,next);}
 const anchors=new Set(Object.values(doc.nodes).flatMap(n=>n.anchor?[n.anchor]:[])),anchorMap=new Map<string,string>();
 for(const old of ids){const a=doc.nodes[old].anchor;if(!a)continue;let i=1,next='';do{const suffix='-copy-'+i++;next=a.slice(0,120-suffix.length)+suffix;}while(anchors.has(next));anchors.add(next);anchorMap.set(a,next);}
 const nodes:Record<string,StudioNode>={};
 for(const old of ids){
  const n=structuredClone(doc.nodes[old]);n.id=map.get(old)!;n.children=n.children.map(x=>map.get(x)!);
  if(n.anchor)n.anchor=anchorMap.get(n.anchor);
  if(n.type==='button'&&n.props.href?.startsWith('#')){const target=anchorMap.get(n.props.href.slice(1));if(target)n.props.href='#'+target;}
  nodes[n.id]=n;
 }
 return insertNode(doc,{rootId:map.get(id)!,nodes},{parentId:parent.id,index:parent.children.indexOf(id)+1});
}
function edit(doc:StudioDocument,id:string,fn:(n:StudioNode)=>StudioNode):Result{
 const n=doc.nodes[id];if(!n)return fail('INVALID_NODE');if(locked(doc,id))return fail('LOCKED');
 return finish({...doc,nodes:{...doc.nodes,[id]:fn(n)}},id);
}
export function updateProps(doc:StudioDocument,id:string,props:Record<string,unknown>):Result{
 return edit(doc,id,n=>({...n,props:{...n.props,...structuredClone(props)}} as StudioNode));
}
export function updateStyles(doc:StudioDocument,id:string,bp:Breakpoint,changes:Partial<Style>):Result{
 return edit(doc,id,n=>({...n,styles:{...n.styles,[bp]:{...n.styles[bp],...structuredClone(changes)}}}));
}
export function resetStyle(doc:StudioDocument,id:string,bp:Breakpoint,property:keyof Style):Result{
 return edit(doc,id,n=>{const style={...n.styles[bp]};delete style[property];return {...n,styles:{...n.styles,[bp]:style}};});
}
export function renameNode(doc:StudioDocument,id:string,name:string):Result{return edit(doc,id,n=>({...n,name}));}
export function setNodeFlags(doc:StudioDocument,id:string,flags:Partial<StudioNode['flags']>):Result{
 const n=doc.nodes[id];if(!n||id===doc.rootId)return fail('INVALID_NODE');const p=parentOf(doc,id);if(p&&locked(doc,p.id))return fail('LOCKED');
 return finish({...doc,nodes:{...doc.nodes,[id]:{...n,flags:{...n.flags,...flags}}}},id);
}
