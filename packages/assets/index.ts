import {IdSchema} from '../schema/v2';
export type Asset={id:string;name:string;mime:string;size:number;blob:Blob;createdAt:string};
export const MAX_ASSET_BYTES=5*1024*1024;
export const MAX_LIBRARY_BYTES=50*1024*1024;
export async function validateImage(blob:Blob):Promise<void>{
 if(blob.size===0||blob.size>MAX_ASSET_BYTES)throw Error('Imagem deve ter até 5 MiB.');
 const h=new Uint8Array(await blob.slice(0,12).arrayBuffer());
 const ascii=(a:number,b:number)=>String.fromCharCode(...h.slice(a,b));
 const valid=blob.type==='image/png'&&[137,80,78,71,13,10,26,10].every((v,i)=>h[i]===v)||blob.type==='image/jpeg'&&h[0]===255&&h[1]===216&&h[2]===255||blob.type==='image/gif'&&['GIF87a','GIF89a'].includes(ascii(0,6))||blob.type==='image/webp'&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';
 if(!valid)throw Error('Formato inválido. Use PNG, JPEG, WebP ou GIF.');
}
export async function createAsset(file:File,id:string):Promise<Asset>{
 IdSchema.parse(id);await validateImage(file);
 const bitmap=await createImageBitmap(file);try{if(bitmap.width*bitmap.height>24000000)throw Error('Imagem excede 24 megapixels.');}finally{bitmap.close();}
 return {id,name:file.name.slice(0,180),mime:file.type,size:file.size,blob:file,createdAt:new Date().toISOString()};
}
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('studio-visual-assets',1);r.onupgradeneeded=()=>{r.result.createObjectStore('images',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Biblioteca bloqueada por outra aba.'));});}
export async function listAssets():Promise<Asset[]>{
 const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('images','readonly'),r=tx.objectStore('images').getAll();tx.oncomplete=()=>resolve(r.result as Asset[]);tx.onabort=()=>reject(tx.error??Error('Leitura interrompida'));tx.onerror=()=>reject(tx.error);});}finally{db.close();}
}
export async function saveAsset(asset:Asset):Promise<void>{
 IdSchema.parse(asset.id);await validateImage(asset.blob);
 if(asset.size!==asset.blob.size||asset.mime!==asset.blob.type)throw Error('Metadados inválidos');
 const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('images','readwrite'),store=tx.objectStore('images'),r=store.getAll();let failure:Error|undefined;
 r.onsuccess=()=>{const all=r.result as Asset[];if(all.reduce((sum,a)=>sum+a.size,0)+asset.size>MAX_LIBRARY_BYTES){failure=Error('Limite local da biblioteca: 50 MiB.');tx.abort();return;}store.add(asset);};
 tx.oncomplete=()=>resolve();tx.onabort=()=>reject(failure??tx.error??Error('Gravação interrompida'));tx.onerror=()=>reject(tx.error);});}finally{db.close();}
}
export function assetDataURL(asset:Asset):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>typeof r.result==='string'?resolve(r.result):reject(Error('Imagem inválida'));r.onerror=()=>reject(r.error);r.readAsDataURL(asset.blob);});}
