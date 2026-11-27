import {useState} from 'react';
import type {StudioDocument} from '../../../packages/schema/v2';
import type {Asset} from '../../../packages/assets';
import {auditExport,buildExport} from '../../../packages/export';
export function ExportPanel({document,assets}:{document:StudioDocument;assets:Asset[]}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const issues=auditExport(document,assets);
 async function save(){setBusy(true);setError('');try{const result=await buildExport(document,assets);const url=URL.createObjectURL(new Blob([result.bytes],{type:'application/zip'}));const a=window.document.createElement('a');a.href=url;a.download='landing-page.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(String(e));}finally{setBusy(false);}}
 return <><button onClick={()=>setOpen(v=>!v)}>Exportar ZIP</button>{open&&<section role="dialog" aria-label="Exportar landing page" style={{background:'#252530',border:'1px solid #454453',padding:16,borderRadius:8,maxWidth:440}}><h2>Studio Export</h2><p>HTML, CSS, imagens locais utilizadas e documento JSON.</p>{issues.length===0?<p>Nenhum aviso detectado.</p>:<ul>{issues.map((i,index)=><li key={index}>{i.severity==='error'?'Erro: ':'Aviso: '}{i.message}</li>)}</ul>}{error&&<p role="alert">{error}</p>}<button disabled={busy||issues.some(i=>i.severity==='error')} onClick={()=>void save()}>{busy?'Preparando…':'Baixar ZIP'}</button><button onClick={()=>setOpen(false)}>Fechar</button></section>}</>;
}
