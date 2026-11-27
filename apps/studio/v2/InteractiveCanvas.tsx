import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {StudioDocument} from '../../../packages/schema/v2';
import type {AssetSources} from '../../../packages/renderer/v2/assetSources';
import {renderStaticDocument} from '../../../packages/renderer/v2/ssr';
import type {Shortcut} from './shortcuts';
import type {DropZone} from './drop';
import {buildCanvasHTML,parseCanvasMessage} from './bridge';
// Immutable editor snapshots are retained by history; weak keys do not extend their lifetime.
const rendered=new WeakMap<StudioDocument,{assets:AssetSources;edit:{channel:string;html:string};preview?:string}>();
function canvasPayload(document:StudioDocument,assets:AssetSources,preview:boolean){
 let cached=rendered.get(document);
 if(!cached||cached.assets!==assets){const channel=crypto.randomUUID();cached={assets,edit:{channel,html:buildCanvasHTML(document,channel,assets)}};rendered.set(document,cached);}
 if(!preview)return cached.edit;
 cached.preview??=renderStaticDocument(document,assets);return {channel:cached.edit.channel,html:cached.preview};
}
type Props={zoom:number;onShortcut:(action:Shortcut)=>void;assets:AssetSources;document:StudioDocument;selectedId:string|null;preview:boolean;width:number;onSelect:(id:string)=>void;onEdit:(id:string,text:string)=>void;onDrop:(id:string,targetId:string,zone:DropZone)=>void};
export function InteractiveCanvas({zoom,onShortcut,assets,document,selectedId,preview,width,onSelect,onEdit,onDrop}:Props){
 const frame=useRef<HTMLIFrameElement>(null);
 const [readyChannel,setReadyChannel]=useState('');
 const payload=useMemo(()=>canvasPayload(document,assets,preview),[document,preview,assets]);
 useLayoutEffect(()=>{
  if(preview)return;
  const sendSelection=()=>frame.current?.contentWindow?.postMessage({channel:payload.channel,kind:'selection',id:selectedId},'*');
  const listener=(event:MessageEvent)=>{if(event.source!==frame.current?.contentWindow||event.origin!=='null')return;const msg=parseCanvasMessage(event.data,payload.channel,document);if(!msg)return;if(msg.kind==='ready'){setReadyChannel(payload.channel);sendSelection();}else if(msg.kind==='select')onSelect(msg.id);else if(msg.kind==='edit')onEdit(msg.id,msg.text);else if(msg.kind==='shortcut')onShortcut(msg.action);else onDrop(msg.id,msg.targetId,msg.zone);};
  window.addEventListener('message',listener);sendSelection();return()=>window.removeEventListener('message',listener);
 },[document,onSelect,onEdit,onDrop,onShortcut,payload,preview,selectedId]);
 return <div className="scaled-canvas" style={{width:width*zoom,height:760*zoom}}><iframe key={preview?'preview':'edit'} ref={frame} data-bridge-ready={preview?undefined:readyChannel===payload.channel?'true':'false'} title={preview?'Prévia isolada da página':'Canvas de edição'} sandbox={preview?'':'allow-scripts'} srcDoc={payload.html} style={{width,height:760,transform:'scale('+zoom+')',transformOrigin:'top left',margin:0}}/></div>;
}
