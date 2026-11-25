import {useEffect,useState} from 'react';
import {assetDataURL,createAsset,listAssets,saveAsset,type Asset} from '../../../packages/assets';
import type {AssetSources} from '../../../packages/renderer/v2/assetSources';
import type {StudioNode} from '../../../packages/schema/v2';
export function useAssets(){
 const [assets,setAssets]=useState<Asset[]>([]),[sources,setSources]=useState<AssetSources>({}),[error,setError]=useState('');
 useEffect(()=>{let active=true;void (async()=>{try{const all=await listAssets();const entries=await Promise.all(all.map(async a=>[a.id,await assetDataURL(a)] as const));if(active){setAssets(old=>Array.from(new Map([...all,...old].map(a=>[a.id,a])).values()));setSources(old=>({...Object.fromEntries(entries),...old}));}}catch(e){if(active)setError(String(e));}})();return()=>{active=false;};},[]);
 async function upload(file:File){try{setError('');const a=await createAsset(file,crypto.randomUUID());await saveAsset(a);const src=await assetDataURL(a);setAssets(old=>[...old,a]);setSources(old=>({...old,[a.id]:src}));}catch(e){setError(String(e));}}
 return {assets,sources,error,upload};
}
export function AssetLibrary({assets,sources,error,upload,onChoose}:{assets:Asset[];sources:AssetSources;error:string;upload:(file:File)=>Promise<void>;onChoose:(id:string)=>void}){
 const [busy,setBusy]=useState(false);
 return <section className="asset-library"><h2>Studio Assets</h2><small>Selecione um componente de imagem para aplicar um arquivo.</small><label>Importar imagem<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(file){setBusy(true);try{await upload(file);}finally{setBusy(false);}}}}/></label>{error&&<p role="alert">{error}</p>}<small>Até 5 MiB por imagem · 50 MiB na biblioteca local</small><div className="asset-list" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,maxHeight:260,overflow:'auto'}}>{assets.map(a=><button key={a.id} onClick={()=>onChoose(a.id)}><img src={sources[a.id]} alt="" style={{width:'100%',height:65,objectFit:'contain'}}/><span style={{overflowWrap:'anywhere'}}>{a.name}</span></button>)}</div></section>;
}
export function ImageInspector({node,update}:{node:Extract<StudioNode,{type:'image'}>;update:(props:Record<string,unknown>)=>void}){
 const src=node.props.src;
 return <fieldset><legend>Imagem</legend><small>{src.kind==='asset'?'Arquivo local':src.kind==='url'?'URL externa':'Espaço reservado'}</small><label>URL HTTPS<input key={JSON.stringify(src)} defaultValue={src.kind==='url'?src.url:''} placeholder="https://..." onBlur={e=>{const v=e.target.value.trim();if(v&&!(src.kind==='url'&&src.url===v))update({src:{kind:'url',url:v}});}}/></label><label>Texto alternativo<input maxLength={500} value={node.props.alt} onChange={e=>update({alt:e.target.value})}/></label><label><input type="checkbox" checked={node.props.decorative} onChange={e=>update({decorative:e.target.checked})}/>Imagem decorativa</label><label>Enquadramento<select value={node.props.fit} onChange={e=>update({fit:e.target.value})}><option value="contain">Conter</option><option value="cover">Cobrir</option></select></label><button onClick={()=>update({src:{kind:'placeholder'}})}>Remover referência</button></fieldset>;
}
