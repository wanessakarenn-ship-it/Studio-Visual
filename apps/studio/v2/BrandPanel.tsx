import {useState} from 'react';
import {resolveStyle,type StudioDocument,type StudioNode,type Breakpoint,type Style} from '../../../packages/schema/v2';
import {categories,properties,setToken,removeToken,bindToken,detachToken,tokenUsage,type Category} from '../../../packages/brand';
import type {Result} from '../../../packages/editor-core';
const labels:Record<Category,string>={color:'Cores',fontSize:'Tipografia',space:'Espaçamento',radius:'Arredondamento'};
type Unit='px'|'%'|'rem'|'vw'|'vh';
export function BrandPanel({doc,command}:{doc:StudioDocument;command:(r:Result)=>void}){
 const [category,setCategory]=useState<Category>('color'),[name,setName]=useState(''),[color,setColor]=useState('#5945c2'),[amount,setAmount]=useState('16'),[unit,setUnit]=useState<Unit>('px');
 return <details><summary>Studio Brand</summary><p>Tokens desta página. Mudanças afetam todos os componentes vinculados.</p><label>Categoria<select value={category} onChange={e=>{setCategory(e.target.value as Category);setName('');}}>{categories.map(c=><option key={c} value={c}>{labels[c]}</option>)}</select></label>
 {Object.entries(doc.tokens[category]).map(([key,value])=><div key={key} className="layout-field"><strong>{key}</strong><small> · {tokenUsage(doc,category,key)} vínculos</small><button onClick={()=>{setName(key);if(typeof value==='string')setColor(value.slice(0,7));else{setAmount(String(value.value));setUnit(value.unit);}}}>Editar</button><button disabled={tokenUsage(doc,category,key)>0} onClick={()=>command(removeToken(doc,category,key))}>Excluir</button></div>)}
 <label>Nome do token<input value={name} maxLength={64} onChange={e=>setName(e.target.value)}/></label>{category==='color'?<label>Cor<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>:<><label>Valor<input type="number" min={0} max={10000} value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Unidade<select value={unit} onChange={e=>setUnit(e.target.value as Unit)}>{['px','%','rem','vw','vh'].map(u=><option key={u}>{u}</option>)}</select></label></>}
 <button disabled={!name.trim()||(category!=='color'&&!amount.trim())} onClick={()=>command(setToken(doc,category,name.trim(),category==='color'?color:{value:Number(amount),unit}))}>Salvar token</button></details>;
}
export function TokenBinding({doc,node,breakpoint,command}:{doc:StudioDocument;node:StudioNode;breakpoint:Breakpoint;command:(r:Result)=>void}){
 const [property,setProperty]=useState<keyof Style>('color');
 const category=properties[property]!;
 const raw=resolveStyle(node.styles,breakpoint)[property],local=node.styles[breakpoint]?.[property];
 return <details><summary>Vincular design token</summary><label>Propriedade<select value={property} onChange={e=>setProperty(e.target.value as keyof Style)}>{Object.keys(properties).map(p=><option key={p}>{p}</option>)}</select></label><label>Token<select value="" onChange={e=>{if(e.target.value)command(bindToken(doc,node.id,breakpoint,property,e.target.value));}}><option value="">Escolher token</option>{Object.keys(doc.tokens[category]).map(name=><option key={name}>{name}</option>)}</select></label><small>{raw&&typeof raw==='object'&&'token' in raw?raw.token:'Sem vínculo efetivo'}</small><button disabled={!local||typeof local!=='object'||!('token' in local)} onClick={()=>command(detachToken(doc,node.id,breakpoint,property))}>Desvincular mantendo valor</button></details>;
}
