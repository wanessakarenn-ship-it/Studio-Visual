import {moveNode,parentOf,type Result,type Position} from '../../../packages/editor-core';
import type {StudioDocument} from '../../../packages/schema/v2';
export type DropZone='before'|'inside'|'after';
export function dropPosition(doc:StudioDocument,source:string,target:string,zone:DropZone):Position|null{
 if(source===target||source===doc.rootId||!doc.nodes[source]||!doc.nodes[target])return null;
 const old=parentOf(doc,source);
 if(!old)return null;
 if(zone==='inside')return {parentId:target,index:doc.nodes[target].children.filter(id=>id!==source).length};
 const parent=parentOf(doc,target);if(!parent)return null;
 const siblings=parent.children.filter(id=>id!==source);
 const index=siblings.indexOf(target);if(index<0)return null;
 return {parentId:parent.id,index:index+(zone==='after'?1:0)};
}
export function resolveDrop(doc:StudioDocument,source:string,target:string,zone:DropZone):Result{
 const pos=dropPosition(doc,source,target,zone);
 return pos?moveNode(doc,source,pos):{ok:false,error:'INVALID_DROP'};
}
