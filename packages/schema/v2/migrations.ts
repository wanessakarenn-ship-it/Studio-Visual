import {PageSchema} from '../index';
import {DocumentSchema,type StudioDocument} from './document';
import type {StudioNode} from './node';
export function migrateDocument(input:unknown,createId:()=>string):StudioDocument{
 if(typeof input!=='object'||input===null)throw new Error('Invalid document');
 if('schemaVersion' in input)return DocumentSchema.parse(input);
 const legacy=PageSchema.parse(input);
 const used=new Set(legacy.nodes.map(n=>n.id));
 const allocate=()=>{const id=createId();if(used.has(id))throw new Error('ID collision');used.add(id);return id;};
 const rootId=allocate(),containerId=allocate(),id=allocate();
 const nodes:Record<string,StudioNode>={};
 const flags=()=>({hidden:false,locked:false});
 nodes[rootId]={id:rootId,type:'root',name:'Página',props:{},children:[containerId],styles:{base:{}},flags:flags()};
 nodes[containerId]={id:containerId,type:'container',name:'Conteúdo migrado',props:{},children:legacy.nodes.map(n=>n.id),styles:{base:{}},flags:flags()};
 for(const n of legacy.nodes){
  const padding={value:n.padding,unit:'px' as const};
  const base={id:n.id,name:n.kind,children:[],flags:flags(),styles:{base:{color:n.color,fontSize:{value:n.size,unit:'px' as const},paddingTop:padding,paddingRight:padding,paddingBottom:padding,paddingLeft:padding}}};
  nodes[n.id]=n.kind==='heading'?{...base,type:'heading',props:{text:n.text,level:2}}:n.kind==='button'?{...base,type:'button',props:{label:n.text}}:{...base,type:'text',props:{text:n.text}};
 }
 return DocumentSchema.parse({schemaVersion:2,id,title:legacy.title,rootId,nodes,tokens:{color:{},space:{},radius:{},fontSize:{}},metadata:{language:'pt-BR'}});
}
