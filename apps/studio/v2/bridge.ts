import type {StudioDocument,StudioNode} from '../../../packages/schema/v2';
import type {AssetSources} from '../../../packages/renderer/v2/assetSources';
import {renderStaticDocument} from '../../../packages/renderer/v2/ssr';
import {isShortcut,type Shortcut} from './shortcuts';
import {resolveDrop,type DropZone} from './drop';
export type CanvasMessage={kind:'shortcut';action:Shortcut}|{kind:'ready'}|{kind:'select';id:string}|{kind:'edit';id:string;text:string}|{kind:'drop';id:string;targetId:string;zone:DropZone};
export function parseCanvasMessage(value:unknown,channel:string,doc:StudioDocument):CanvasMessage|null{
 if(typeof value!=='object'||value===null||!('channel' in value)||value.channel!==channel||!('kind' in value))return null;
 if(value.kind==='ready')return {kind:'ready'};
 if(value.kind==='shortcut')return 'action' in value&&isShortcut(value.action)?{kind:'shortcut',action:value.action}:null;
 if(!('id' in value)||typeof value.id!=='string'||!Object.hasOwn(doc.nodes,value.id))return null;
 if(value.kind==='drop'){
  if(!('targetId' in value)||typeof value.targetId!=='string'||!('zone' in value)||(value.zone!=='before'&&value.zone!=='inside'&&value.zone!=='after'))return null;
  if(!resolveDrop(doc,value.id,value.targetId,value.zone).ok)return null;
  return {kind:'drop',id:value.id,targetId:value.targetId,zone:value.zone};
 }
 if(value.kind==='select')return {kind:'select',id:value.id};
 const node=doc.nodes[value.id];
 if(value.kind==='edit'&&'text' in value&&typeof value.text==='string'&&value.text.length<=10000&&(node.type==='heading'||node.type==='text'||node.type==='button')){
  let current:StudioNode= node;
  while(current){
   if(current.flags.locked)return null;
   const parent=Object.values(doc.nodes).find(n=>n.children.includes(current.id));
   if(!parent)break;
   current=parent;
  }
  return {kind:'edit',id:value.id,text:value.text};
 }
 return null;
}
export function buildCanvasHTML(doc:StudioDocument,channel:string,assets:AssetSources={}):string{
 if(!/^[a-zA-Z0-9-]+$/.test(channel))throw Error('Invalid canvas channel');
 const html=renderStaticDocument(doc,assets);
 const locked=new Set<string>();
 const walk=(id:string,ancestorLocked:boolean)=>{const node=doc.nodes[id],isLocked=ancestorLocked||node.flags.locked;if(isLocked)locked.add(id);node.children.forEach(child=>walk(child,isLocked));};
 walk(doc.rootId,false);
 const editable=Object.values(doc.nodes).filter(n=>!locked.has(n.id)&&['heading','text','button'].includes(n.type)).map(n=>n.id);
 const draggable=Object.values(doc.nodes).filter(n=>n.id!==doc.rootId&&!locked.has(n.id)).map(n=>n.id);
 const containers=Object.values(doc.nodes).filter(n=>['root','section','container'].includes(n.type)).map(n=>n.id);
 const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'nonce-'+channel+'\'; style-src \'unsafe-inline\'; img-src https: data:; base-uri \'none\'; form-action \'none\'">';
 const script=`<style>.sv-hover{outline:1px dashed #7864e8!important;outline-offset:-1px}.sv-selected{outline:2px solid #7864e8!important;outline-offset:-2px}.sv-page button:disabled{pointer-events:auto}.sv-drop-before{box-shadow:inset 0 3px #5945c2!important}.sv-drop-after{box-shadow:inset 0 -3px #5945c2!important}.sv-drop-inside{outline:3px dashed #5945c2!important;outline-offset:-3px}.sv-page [contenteditable]{cursor:text!important;white-space:pre-wrap}</style><script nonce="${channel}">
 (()=>{const channel=${JSON.stringify(channel)},editable=new Set(${JSON.stringify(editable)});
 const draggable=new Set(${JSON.stringify(draggable)}),containers=new Set(${JSON.stringify(containers)}),rootId=${JSON.stringify(doc.rootId)};
 const send=(kind,extra={})=>parent.postMessage({channel,kind,...extra},'*');
 const target=e=>e instanceof Element?e.closest('[class*="sv-node-"]'):null;
 const idOf=e=>e&&Array.from(e.classList).find(c=>c.startsWith('sv-node-'))?.slice(8);
 let selected=null,hover=null,editing=null,original='';
 const select=id=>{selected?.classList.remove('sv-selected');selected=id?document.getElementsByClassName('sv-node-'+id)[0]:null;selected?.classList.add('sv-selected');};
 const finish=commit=>{if(!editing)return;const e=editing;editing=null;const text=e.innerText;e.removeAttribute('contenteditable');if(!commit||text.length>10000)e.textContent=original;else if(text!==original)send('edit',{id:idOf(e),text});};
 document.addEventListener('click',e=>{if(editing&&editing.contains(e.target))return;e.preventDefault();const n=target(e.target),id=idOf(n);if(id){select(id);send('select',{id});}},true);
 document.addEventListener('pointerover',e=>{const n=target(e.target);if(n===hover)return;hover?.classList.remove('sv-hover');hover=n;hover?.classList.add('sv-hover');});
 document.addEventListener('pointerout',e=>{if(!e.relatedTarget){hover?.classList.remove('sv-hover');hover=null;}});
 document.addEventListener('dblclick',e=>{const n=target(e.target),id=idOf(n);if(!id||!editable.has(id))return;e.preventDefault();if(editing===n)return;finish(true);editing=n;original=n.innerText;n.setAttribute('contenteditable','plaintext-only');n.focus();});
 document.addEventListener('focusout',e=>{if(e.target===editing)finish(true);});
 document.addEventListener('keydown',e=>{if(!editing||e.isComposing)return;if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();const node=editing;finish(e.key==='Enter');node.blur();}});
 window.addEventListener('message',e=>{if(e.source!==parent||e.data?.channel!==channel||e.data?.kind!=='selection')return;select(typeof e.data.id==='string'?e.data.id:null);});
 let dragSource=null,marked=null;
 const clearDrop=()=>{if(marked)marked.classList.remove('sv-drop-before','sv-drop-after','sv-drop-inside');marked=null;};
 for(const el of document.querySelectorAll('[class*="sv-node-"]')){if(draggable.has(idOf(el)))el.setAttribute('draggable','true');}
 const destination=e=>{
  const n=target(e.target),id=idOf(n);if(!n||!id||id===dragSource)return null;
  const r=n.getBoundingClientRect(),ratio=(e.clientY-r.top)/Math.max(r.height,1);
  const zone=id===rootId?'inside':containers.has(id)&&ratio>.25&&ratio<.75?'inside':ratio<.5?'before':'after';
  const source=document.getElementsByClassName('sv-node-'+dragSource)[0];
  if(!source||source.contains(n))return null;
  return {n,id,zone};
 };
 document.addEventListener('dragstart',e=>{const n=target(e.target),id=idOf(n);if(editing||!draggable.has(id)){e.preventDefault();return;}dragSource=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);});
 document.addEventListener('dragover',e=>{if(!dragSource)return;clearDrop();const d=destination(e);if(!d)return;e.preventDefault();e.dataTransfer.dropEffect='move';marked=d.n;marked.classList.add('sv-drop-'+d.zone);});
 document.addEventListener('drop',e=>{if(!dragSource)return;e.preventDefault();const d=destination(e);if(d)send('drop',{id:dragSource,targetId:d.id,zone:d.zone});dragSource=null;clearDrop();});
 document.addEventListener('dragend',()=>{dragSource=null;clearDrop();});
 document.addEventListener('keydown',e=>{
 if(editing||e.isComposing||e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable]'))return;
 const key=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;let action=null;
 if(mod&&!e.altKey){action=key==='z'?(e.shiftKey?'redo':'undo'):key==='y'?'redo':key==='s'?'save':key==='d'?'duplicate':key==='c'?'copy':key==='v'?'paste':null;}
 else if(!mod&&e.altKey)action=key==='arrowup'?'up':key==='arrowdown'?'down':null;
 else if(!mod&&!e.altKey)action=key==='delete'?'delete':key==='escape'?'escape':key==='f2'?'rename':null;
 if(action){if(e.repeat)return;e.preventDefault();send('shortcut',{action});}
 });
 document.documentElement.setAttribute('data-studio-bridge-ready','true');
 send('ready');
 })();</script>`;
 return html.replace('<head>',()=>'<head>'+csp).replace(/<\/body>(<\/html>)?\s*$/,(_,closing:string|undefined)=>script+'</body>'+(closing??''));
}
