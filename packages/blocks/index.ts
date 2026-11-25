import {NodeSchema,DocumentSchema,type StudioDocument,type StudioNode,type Style} from '../schema/v2';
import {insertNode,parentOf,type Result,type Subtree} from '../editor-core';
export const catalog=[
 {id:'hero-centered',name:'Hero centralizado',category:'Hero',description:'Título, descrição e chamada principal.'},
 {id:'hero-split',name:'Hero em duas colunas',category:'Hero',description:'Conteúdo e espaço para imagem.'},
 {id:'benefits-grid',name:'Benefícios em cards',category:'Benefícios',description:'Três cards responsivos.'},
 {id:'cta-banner',name:'Chamada de conversão',category:'CTA',description:'Convite e botão personalizáveis.'},
 {id:'footer-simple',name:'Rodapé essencial',category:'Rodapé',description:'Marca e texto institucional.'}
] as const;
export type BlockId=typeof catalog[number]['id'];
const px=(value:number)=>({value,unit:'px' as const});
export function createBlock(kind:BlockId,createId:()=>string,hasH1=false):Subtree{
 const nodes:Record<string,StudioNode>={};
 function node(type:StudioNode['type'],name:string,props:unknown,children:string[]=[],base:Style={},mobile?:Style){
  const id=createId();if(Object.hasOwn(nodes,id))throw Error('Duplicate generated ID');
  nodes[id]=NodeSchema.parse({id,type,name,props,children,styles:{base,...(mobile?{mobile}:{})},flags:{hidden:false,locked:false}});return id;
 }
 const heading=(text:string,level:number,size:number)=>node('heading','Título',{text,level},[],{fontSize:px(size),fontWeight:700},level===1?{fontSize:px(36)}:undefined);
 const text=(value:string)=>node('text','Texto',{text:value},[],{fontSize:px(18),lineHeight:1.5});
 const button=(label:string)=>node('button','Botão',{label},[],{backgroundColor:'#5945c2',color:'#ffffff',paddingTop:px(12),paddingBottom:px(12),paddingLeft:px(24),paddingRight:px(24),borderRadius:px(8)});
 const section=(name:string,children:string[],styles:Style={})=>node('section',name,{},children,{paddingTop:px(64),paddingBottom:px(64),paddingLeft:px(32),paddingRight:px(32),...styles},{paddingTop:px(36),paddingBottom:px(36),paddingLeft:px(20),paddingRight:px(20)});
 const stack:Style={display:'flex',flexDirection:'column',gap:px(16),alignItems:'start'};
 let rootId:string;
 switch(kind){
  case 'hero-centered':rootId=section('Hero centralizado',[heading('Sua próxima ideia começa aqui.',hasH1?2:1,56),text('Apresente sua proposta de valor em poucas palavras.'),button('Saiba mais')],{...stack,alignItems:'center',textAlign:'center',backgroundColor:'#e8e3fc',color:'#242433'});break;
  case 'hero-split':{
   const content=node('container','Conteúdo',{},[heading('Transforme sua ideia em realidade.',hasH1?2:1,48),text('Mostre o que torna sua solução diferente.'),button('Conhecer solução')],stack);
   const image=node('image','Imagem',{src:{kind:'placeholder'},alt:'Imagem ilustrativa da solução',decorative:false,fit:'cover'},[],{backgroundColor:'#d9d3eb',minHeight:px(240),borderRadius:px(12)});
   const grid=node('container','Duas colunas',{},[content,image],{display:'grid',gridColumns:2,gap:px(32),alignItems:'center'},{gridColumns:1});
   rootId=section('Hero em duas colunas',[grid],{backgroundColor:'#f7f6f2',color:'#242433'});break;
  }
  case 'benefits-grid':{
   const cards=['Benefício principal','Mais praticidade','Resultados'].map(name=>node('container',name,{},[heading(name,3,24),text('Explique aqui como este benefício ajuda seu público.')],{...stack,backgroundColor:'#ffffff',borderRadius:px(12),paddingTop:px(24),paddingBottom:px(24),paddingLeft:px(24),paddingRight:px(24)}));
   const grid=node('container','Grid de benefícios',{},cards,{display:'grid',gridColumns:3,gap:px(16)},{gridColumns:1});
   nodes[grid]={...nodes[grid],styles:{...nodes[grid].styles,tablet:{gridColumns:2}}};
   rootId=section('Benefícios',[heading('Por que escolher nossa solução?',2,36),grid],{...stack,alignItems:'stretch',backgroundColor:'#f7f6f2',color:'#242433'});break;
  }
  case 'cta-banner':rootId=section('Chamada de conversão',[heading('Pronto para começar?',2,36),text('Dê o próximo passo.'),button('Entrar em contato')],{...stack,alignItems:'center',textAlign:'center',backgroundColor:'#242433',color:'#ffffff'});break;
  case 'footer-simple':rootId=section('Rodapé essencial',[heading('Sua marca',2,24),text('Informações institucionais e direitos reservados.')],{...stack,alignItems:'center',textAlign:'center',backgroundColor:'#f7f6f2',color:'#242433'});break;
 }
 return {rootId,nodes};
}
export function insertBlock(doc:StudioDocument,kind:BlockId,selectedId:string|null,createId:()=>string):Result{
 const validated=DocumentSchema.safeParse(doc);if(!validated.success)return {ok:false,error:'INVALID_DOCUMENT'};
 try{
  const sub=createBlock(kind,createId,Object.values(doc.nodes).some(n=>n.type==='heading'&&n.props.level===1));
  let top=selectedId&&doc.nodes[selectedId]?doc.nodes[selectedId]:undefined;
  while(top&&top.id!==doc.rootId){const parent=parentOf(doc,top.id);if(!parent||parent.id===doc.rootId)break;top=parent;}
  const root=doc.nodes[doc.rootId],index=top&&top.id!==root.id?root.children.indexOf(top.id)+1:root.children.length;
  return insertNode(doc,sub,{parentId:root.id,index});
 }catch{return {ok:false,error:'INVALID_BLOCK'};}
}
