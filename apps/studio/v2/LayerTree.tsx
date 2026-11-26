import {memo,useRef,useState,type DragEvent} from 'react';
import {acceptsChild,type StudioDocument} from '../../../packages/schema/v2';
import {moveNode,parentOf,descendants,type Result} from '../../../packages/editor-core';
import {resolveDrop,type DropZone} from './drop';
type Props={doc:StudioDocument;selected:string|null;select:(id:string)=>void;command:(result:Result)=>void};
function LayerTreeView({doc,selected,select,command}:Props){
 const source=useRef<string|null>(null);
 const [indicator,setIndicator]=useState<{id:string;zone:DropZone}|null>(null);
 const [collapsed,setCollapsed]=useState<Set<string>>(()=>new Set());
 function clear(){source.current=null;setIndicator(null);}
 function zone(e:DragEvent,id:string):DropZone{
  const rect=e.currentTarget.getBoundingClientRect(),ratio=(e.clientY-rect.top)/Math.max(1,rect.height);
  const n=doc.nodes[id];
  if(n.type==='root')return 'inside';
  return (n.type==='section'||n.type==='container')&&ratio>.25&&ratio<.75?'inside':ratio<.5?'before':'after';
 }
 function row(id:string,depth:number){
  const n=doc.nodes[id],active=indicator?.id===id?indicator.zone:undefined;
  const canDrag=id!==doc.rootId&&!n.flags.locked;
  return <li key={id}>
   <div className={'layer-row'+(active?' drop-'+active:'')} onDragOver={e=>{if(!source.current)return;e.stopPropagation();const z=zone(e,id);const r=resolveDrop(doc,source.current,id,z);if(!r.ok){e.dataTransfer.dropEffect='none';setIndicator(null);return;}e.preventDefault();e.dataTransfer.dropEffect='move';setIndicator({id,zone:z});}} onDragLeave={e=>{if(!(e.relatedTarget instanceof Node)||!e.currentTarget.contains(e.relatedTarget))setIndicator(null);}} onDrop={e=>{e.preventDefault();e.stopPropagation();const from=source.current;if(from)command(resolveDrop(doc,from,id,zone(e,id)));clear();}}>
    <button className="layer" style={{paddingLeft:12+depth*14}} aria-pressed={selected===id} draggable={canDrag} onDragStart={e=>{if(!canDrag){e.preventDefault();return;}source.current=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);select(id);}} onDragEnd={clear} onClick={()=>select(id)}>{n.flags.locked?'🔒 ':''}{n.flags.hidden?'◌ ':''}{n.name||n.type}</button>
    {n.children.length>0&&<button className="layer-toggle" aria-label={(collapsed.has(id)?'Expandir ':'Recolher ')+n.name} aria-expanded={!collapsed.has(id)} onClick={()=>setCollapsed(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;})}>{collapsed.has(id)?'+':'−'}</button>}
   </div>
   {n.children.length>0&&!collapsed.has(id)&&<ul>{n.children.map(child=>row(child,depth+1))}</ul>}
  </li>;
 }
 return <><p className="layer-help">Arraste para antes, depois ou dentro. Também é possível mover pelo painel de propriedades.</p><ul>{row(doc.rootId,0)}</ul></>;
}
// Content-only edits do not affect the layer hierarchy or labels.
export const LayerTree=memo(LayerTreeView,(previous,next)=>{
 if(previous.selected!==next.selected||previous.doc.rootId!==next.doc.rootId)return false;
 const a=previous.doc.nodes,b=next.doc.nodes,ids=Object.keys(a);
 if(ids.length!==Object.keys(b).length)return false;
 return ids.every(id=>{const x=a[id],y=b[id];return !!y&&(x===y||(x.type===y.type&&x.name===y.name&&x.flags.locked===y.flags.locked&&x.flags.hidden===y.flags.hidden&&x.children.length===y.children.length&&x.children.every((child,i)=>child===y.children[i])));});
});
export function MoveControls({doc,id,command}:{doc:StudioDocument;id:string;command:(result:Result)=>void}){
 const current=parentOf(doc,id);
 const [destination,setDestination]=useState(current?.id??'');
 const blocked=new Set(descendants(doc,id));
 const options=Object.values(doc.nodes).filter(n=>!blocked.has(n.id)&&acceptsChild(n.type,doc.nodes[id].type));
 const parent=options.find(n=>n.id===destination);
 // Validate the full graph only when the user actually commits a move.
 const canMove=!!parent&&!doc.nodes[id].flags.locked&&!parent.flags.locked;
 return <section className="move-controls"><label>Mover para contêiner<select value={parent?destination:''} onChange={e=>setDestination(e.target.value)}><option value="">Selecione o destino</option>{options.map(n=><option key={n.id} value={n.id}>{n.name||n.type} ({n.id.slice(-6)})</option>)}</select></label><button disabled={!canMove} onClick={()=>{if(parent)command(moveNode(doc,id,{parentId:parent.id,index:parent.children.filter(child=>child!==id).length}));}}>Mover para o final</button></section>;
}
