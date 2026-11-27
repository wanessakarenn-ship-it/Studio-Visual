import {DocumentSchema,type StudioDocument} from '../schema/v2';
import {renderStaticDocument} from '../renderer/v2/ssr';
import {generateCSS} from '../renderer/v2/styles';
import {validateImage,type Asset,MAX_LIBRARY_BYTES} from '../assets';
import {createZip,type ZipEntry} from './zip';
export type ExportIssue={severity:'error'|'warning';message:string;nodeId?:string};
const extensions:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'};
export function auditExport(doc:StudioDocument,assets:readonly Asset[]):ExportIssue[]{
 const issues:ExportIssue[]=[],ids=new Set(assets.map(a=>a.id)),anchors=new Set(Object.values(doc.nodes).flatMap(n=>n.anchor?[n.anchor]:[]));
 if(!doc.title.trim())issues.push({severity:'warning',message:'Título da página vazio.'});
 if(!doc.metadata.description?.trim())issues.push({severity:'warning',message:'Descrição SEO ausente.'});
 const headings=Object.values(doc.nodes).filter(n=>n.type==='heading'&&n.props.level===1);
 if(headings.length!==1)issues.push({severity:'warning',message:'Recomenda-se um único H1.'});
 for(const n of Object.values(doc.nodes)){
  const warn=(message:string)=>issues.push({severity:'warning',message,nodeId:n.id});
  if(n.type==='image'){
   if(n.props.src.kind==='asset'&&!ids.has(n.props.src.assetId))issues.push({severity:'error',message:'Arquivo local ausente: '+n.name,nodeId:n.id});
   if(n.props.src.kind==='placeholder')warn('Imagem provisória: '+n.name);
   if(n.props.src.kind==='url')warn('Imagem externa depende de conexão: '+n.name);
   if(!n.props.decorative&&!n.props.alt.trim())warn('Texto alternativo ausente: '+n.name);
  }
  if(n.type==='button'){const href=n.props.href;if(!href)warn('Botão sem destino: '+n.name);else if(href.startsWith('#')&&!anchors.has(href.slice(1)))warn('Âncora inexistente: '+href);}
 }
 return issues;
}
export async function buildExport(input:unknown,assets:readonly Asset[]){
 const doc=DocumentSchema.parse(input),issues=auditExport(doc,assets);
 if(issues.some(i=>i.severity==='error'))throw Error(issues.filter(i=>i.severity==='error').map(i=>i.message).join('; '));
 const encoder=new TextEncoder(),entries:ZipEntry[]=[],sources:Record<string,string>={};
 const add=(name:string,text:string)=>entries.push({name,data:encoder.encode(text)});
 const used=new Set(Object.values(doc.nodes).flatMap(n=>n.type==='image'&&n.props.src.kind==='asset'?[n.props.src.assetId]:[]));
 let total=0;
 for(const id of used){
  const a=assets.find(x=>x.id===id)!;await validateImage(a.blob);
  const ext=extensions[a.blob.type];if(!ext)throw Error('Unsupported image');
  total+=a.blob.size;if(total>MAX_LIBRARY_BYTES)throw Error('Export asset limit');
  const name='assets/'+id+'.'+ext;sources[id]=name;entries.push({name,data:new Uint8Array(await a.blob.arrayBuffer())});
 }
 add('index.html',renderStaticDocument(doc,sources,true));add('styles.css',generateCSS(doc));add('studio-document.json',JSON.stringify(doc,null,2));
 add('README.md','# Studio Visual — exportação estática\n\nAbra index.html ou hospede os arquivos mantendo a estrutura. Imagens externas exigem conexão. Botões sem link não enviam dados. O JSON é uma referência editável; a reimportação de imagens a partir do ZIP ainda não está disponível.\n\nAvisos:\n'+issues.map(i=>'- '+i.message).join('\n'));
 return {bytes:createZip(entries),entries:entries.map(e=>e.name),issues};
}
