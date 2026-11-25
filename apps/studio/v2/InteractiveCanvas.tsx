import {useEffect,useMemo,useRef} from 'react';
import type {StudioDocument} from '../../../packages/schema/v2';
import {renderStaticDocument} from '../../../packages/renderer/v2/ssr';
import {buildCanvasHTML,parseCanvasMessage} from './bridge';
type Props={document:StudioDocument;selectedId:string|null;preview:boolean;width:number;onSelect:(id:string)=>void;onEdit:(id:string,text:string)=>void};
export function InteractiveCanvas({document,selectedId,preview,width,onSelect,onEdit}:Props){
 const frame=useRef<HTMLIFrameElement>(null);
 const payload=useMemo(()=>{const channel=crypto.randomUUID();return {channel,html:preview?renderStaticDocument(document):buildCanvasHTML(document,channel)};},[document,preview]);
 useEffect(()=>{
  if(preview)return;
  const sendSelection=()=>frame.current?.contentWindow?.postMessage({channel:payload.channel,kind:'selection',id:selectedId},'*');
  const listener=(event:MessageEvent)=>{if(event.source!==frame.current?.contentWindow||event.origin!=='null')return;const msg=parseCanvasMessage(event.data,payload.channel,document);if(!msg)return;if(msg.kind==='ready')sendSelection();else if(msg.kind==='select')onSelect(msg.id);else onEdit(msg.id,msg.text);};
  window.addEventListener('message',listener);sendSelection();return()=>window.removeEventListener('message',listener);
 },[document,onSelect,onEdit,payload,preview,selectedId]);
 return <iframe key={preview?'preview':'edit'} ref={frame} title={preview?'Prévia isolada da página':'Canvas de edição'} sandbox={preview?'':'allow-scripts'} srcDoc={payload.html} style={{width}}/>;
}
