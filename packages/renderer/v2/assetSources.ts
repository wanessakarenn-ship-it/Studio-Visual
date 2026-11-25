export type AssetSources=Readonly<Record<string,string>>;
export function safeAssetSource(sources:AssetSources,id:string):string|undefined{
 if(!Object.hasOwn(sources,id))return undefined;
 const src=sources[id];
 return /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(src)||/^assets\/[0-9a-f-]{36}\.(?:png|jpg|webp|gif)$/i.test(src)?src:undefined;
}
