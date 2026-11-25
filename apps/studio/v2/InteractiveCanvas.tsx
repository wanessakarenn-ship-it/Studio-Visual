import {useEffect,useMemo,useRef} from 'react';
import type {StudioDocument} from '../../../packages/schema/v2';
import type {AssetSources} from '../../../packages/renderer/v2/assetSources';
import {renderStaticDocument} from '../../../packages/renderer/v2/ssr';
import type {DropZone} from './drop';
import {buildCanvasHTML,parseCanvasMessage} from './bridge';
type Props={assets:AssetSources;document:StudioDocument;selectedId:string|null;preview:boolean;width:number;onSelect:(id:string)=>void;onEdit:(id:string,text:string)=>void;onDrop:(id:string,targetId:string,zone:DropZone)=>void};
export function InteractiveCanvas({assets,document,selectedId,preview,width,onSelect,onEdit,onDrop}:Props){
 const frame=useRef<HTMLIFrameElement>(null);
 const payload=useMemo(()=>{const channel=crypto.randomUUID();return {channel,html:preview?renderStaticDocument(document,assets):buildCanvasHTML(document,channel,assets)};},[document,preview,assets]);
 useEffect(()=>{
  if(preview)return;
  const sendSelection=()=>frame.current?.contentWindow?.postMessage({channel:payload.channel,kind:'selection',id:selectedId},'*');
  const listener=(event:MessageEvent)=>{if(event.source!==frame.current?.contentWindow||event.origin!=='null')return;const msg=parseCanvasMessage(event.data,payload.channel,document);if(!msg)return;if(msg.kind==='ready')sendSelection();else if(msg.kind==='select')onSelect(msg.id);else if(msg.kind==='edit')onEdit(msg.id,msg.text);else onDrop(msg.id,msg.targetId,msg.zone);};
  window.addEventListener('message',listener);sendSelection();return()=>window.removeEventListener('message',listener);
 },[document,onSelect,onEdit,onDrop,payload,preview,selectedId]);
 return <iframe key={preview?'preview':'edit'} ref={frame} title={preview?'Prévia isolada da página':'Canvas de edição'} sandbox={preview?'':'allow-scripts'} srcDoc={payload.html} style={{width}}/>;
}
