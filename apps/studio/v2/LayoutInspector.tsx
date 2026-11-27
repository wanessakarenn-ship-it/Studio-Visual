import {useState} from 'react';
import {resolveStyle,DimensionSchema,type StudioDocument,type StudioNode,type Breakpoint,type Style} from '../../../packages/schema/v2';
import {updateStyles,resetStyle,parentOf,type Result} from '../../../packages/editor-core';
import {resolveInspectorValue} from './inspector';
import {styleOrigin,stylePatch} from './layout';
type Props={doc:StudioDocument;node:StudioNode;breakpoint:Breakpoint;command:(result:Result)=>void};
type Unit='px'|'%'|'rem'|'vw'|'vh';
const units:Unit[]=['px','%','rem','vw','vh'];
const bpLabels={base:'Desktop',tablet:'Tablet',mobile:'Mobile'};
function DimensionField({label,value,apply,auto}:{label:string;value:unknown;apply:(value:unknown)=>void;auto?:boolean}){
 const parsed=DimensionSchema.safeParse(value);
 const [number,setNumber]=useState(parsed.success?String(parsed.data.value):'');
 const [unit,setUnit]=useState<Unit>(parsed.success?parsed.data.unit:'px');
 const valid=number.trim()!==''&&DimensionSchema.safeParse({value:Number(number),unit}).success;
 return <div className="dimension-field"><label>{label}<input type="number" min="0" max="10000" step="any" value={number} onChange={e=>setNumber(e.target.value)}/></label><label>Unidade<select value={unit} onChange={e=>setUnit(e.target.value as Unit)}>{units.map(u=><option key={u}>{u}</option>)}</select></label><button disabled={!valid} onClick={()=>apply({value:Number(number),unit})}>Aplicar</button>{auto&&<button onClick={()=>apply('auto')}>Auto</button>}</div>;
}
export function LayoutInspector({doc,node,breakpoint,command}:Props){
 const effective=resolveStyle(node.styles,breakpoint);
 const [error,setError]=useState('');
 let locked=node.flags.locked,p=parentOf(doc,node.id);
 while(p){locked||=p.flags.locked;p=parentOf(doc,p.id);}
 function apply(key:keyof Style,value:unknown){try{const patch=stylePatch(key,value);setError('');command(updateStyles(doc,node.id,breakpoint,patch));}catch{setError('Valor inválido para '+key);}}
 function origin(key:keyof Style){const source=styleOrigin(node,breakpoint,key);const raw=effective[key];return <div className="style-origin"><span>{source?bpLabels[source]:'Padrão CSS'}{raw&&typeof raw==='object'&&'token' in raw?' · '+raw.token:''}</span><button disabled={node.styles[breakpoint]?.[key]===undefined} onClick={()=>command(resetStyle(doc,node.id,breakpoint,key))}>Restaurar</button></div>;}
 function choice(key:keyof Style,label:string,options:[string,string][]){return <div className="layout-field"><label>{label}<select value={String(effective[key]??'')} onChange={e=>{if(e.target.value)apply(key,e.target.value);}}><option value="" disabled>Padrão CSS</option>{options.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label>{origin(key)}</div>;}
 function dim(key:keyof Style,label:string,auto=false){const value=resolveInspectorValue(effective[key],doc.tokens);return <div className="layout-field" key={key}><DimensionField key={JSON.stringify(value)} label={label} value={value} apply={v=>apply(key,v)} auto={auto}/>{origin(key)}</div>;}
 const container=['root','section','container'].includes(node.type);
 return <fieldset className="layout-inspector" disabled={locked}><legend>Layout · {bpLabels[breakpoint]}</legend>{locked&&<p>Componente bloqueado.</p>}{error&&<p role="alert">{error}</p>}
 {container&&<details open><summary>Estrutura</summary>{choice('display','Modo de layout',[['block','Fluxo'],['flex','Flexbox'],['grid','Grid'],['none','Oculto']])}
 {effective.display==='flex'&&<>{choice('flexDirection','Direção',[['row','Horizontal'],['column','Vertical']])}{choice('flexWrap','Quebra de linha',[['nowrap','Sem quebra'],['wrap','Com quebra']])}</>}
 {effective.display==='grid'&&<div className="layout-field"><label>Colunas<select value={String(effective.gridColumns??1)} onChange={e=>apply('gridColumns',Number(e.target.value))}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>{origin('gridColumns')}</div>}
 {(effective.display==='flex'||effective.display==='grid')&&<>{choice('justifyContent','Distribuição',[['start','Início'],['center','Centro'],['end','Fim'],['space-between','Entre elementos']])}{choice('alignItems','Alinhamento',[['start','Início'],['center','Centro'],['end','Fim'],['stretch','Esticar']])}{dim('gap','Espaçamento entre elementos')}</>}</details>}
 <details open><summary>Dimensões</summary>{dim('width','Largura',true)}{dim('maxWidth','Largura máxima')}{dim('minHeight','Altura mínima')}</details>
 <details><summary>Espaçamento</summary>{dim('paddingTop','Padding superior')}{dim('paddingRight','Padding direito')}{dim('paddingBottom','Padding inferior')}{dim('paddingLeft','Padding esquerdo')}{dim('marginTop','Margem superior')}{dim('marginBottom','Margem inferior')}</details>
 <details><summary>Aparência</summary><div className="layout-field"><label>Fundo<input type="color" value={String(resolveInspectorValue(effective.backgroundColor,doc.tokens)??'#ffffff').slice(0,7)} onChange={e=>apply('backgroundColor',e.target.value)}/></label>{origin('backgroundColor')}</div>{dim('borderRadius','Arredondamento')}{choice('textAlign','Alinhamento de texto',[['left','Esquerda'],['center','Centro'],['right','Direita']])}<label>Opacidade<input type="range" min="0" max="1" step=".05" value={effective.opacity??1} onChange={e=>apply('opacity',Number(e.target.value))}/></label>{origin('opacity')}</details>
 </fieldset>;
}
