import type {StudioDocument} from '../../../packages/schema/v2';
import {renderStaticDocument} from '../../../packages/renderer/v2/ssr';
export type CanvasMessage={kind:'ready'}|{kind:'select';id:string}|{kind:'edit';id:string;text:string};
export function parseCanvasMessage(value:unknown,channel:string,doc:StudioDocument):CanvasMessage|null{
 if(typeof value!=='object'||value===null||!('channel' in value)||value.channel!==channel||!('kind' in value))return null;
 if(value.kind==='ready')return {kind:'ready'};
 if(!('id' in value)||typeof value.id!=='string'||!Object.hasOwn(doc.nodes,value.id))return null;
 if(value.kind==='select')return {kind:'select',id:value.id};
 const node=doc.nodes[value.id];
 if(value.kind==='edit'&&'text' in value&&typeof value.text==='string'&&value.text.length<=10000&&(node.type==='heading'||node.type==='text'||node.type==='button')){
  let current= node;
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
export function buildCanvasHTML(doc:StudioDocument,channel:string):string{
 if(!/^[a-zA-Z0-9-]+$/.test(channel))throw Error('Invalid canvas channel');
 const html=renderStaticDocument(doc);
 const locked=new Set<string>();
 const walk=(id:string,ancestorLocked:boolean)=>{const node=doc.nodes[id],isLocked=ancestorLocked||node.flags.locked;if(isLocked)locked.add(id);node.children.forEach(child=>walk(child,isLocked));};
 walk(doc.rootId,false);
 const editable=Object.values(doc.nodes).filter(n=>!locked.has(n.id)&&['heading','text','button'].includes(n.type)).map(n=>n.id);
 const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'nonce-'+channel+'\'; style-src \'unsafe-inline\'; img-src https:; base-uri \'none\'; form-action \'none\'">';
 const script=`<style>.sv-hover{outline:1px dashed #7864e8!important;outline-offset:-1px}.sv-selected{outline:2px solid #7864e8!important;outline-offset:-2px}.sv-page button:disabled{pointer-events:auto}.sv-page [contenteditable]{cursor:text!important;white-space:pre-wrap}</style><script nonce="${channel}">
 (()=>{const channel=${JSON.stringify(channel)},editable=new Set(${JSON.stringify(editable)});
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
 send('ready');
 })();</script>`;
 return html.replace('<head>','<head>'+csp).replace(/<\/body>$/,script+'</body>').replace(/<\/body><\/html>$/,script+'</body></html>');
}
