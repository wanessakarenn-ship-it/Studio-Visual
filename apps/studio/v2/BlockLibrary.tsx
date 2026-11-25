import {useState} from 'react';
import {catalog,insertBlock} from '../../../packages/blocks';
import type {StudioDocument} from '../../../packages/schema/v2';
import type {Result} from '../../../packages/editor-core';
export function BlockLibrary({doc,selectedId,command}:{doc:StudioDocument;selectedId:string|null;command:(r:Result)=>void}){
 const [query,setQuery]=useState('');
 const blocks=catalog.filter(b=>(b.name+' '+b.category+' '+b.description).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim()));
 return <section className="block-library"><h2>Studio Blocks</h2><label>Buscar blocos<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hero, benefícios, CTA…"/></label>{blocks.map(b=><button className="block-card" key={b.id} onClick={()=>command(insertBlock(doc,b.id,selectedId,()=>crypto.randomUUID()))}><span className={'block-mini '+b.id} aria-hidden="true"><i/><i/><i/></span><strong>{b.name}</strong><small>{b.description}</small><span className="block-add">+ Inserir seção</span></button>)}{!blocks.length&&<p>Nenhum bloco encontrado.</p>}</section>;
}
