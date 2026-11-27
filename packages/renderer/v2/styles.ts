import type {Style,StudioDocument,Tokens} from '../../schema/v2';
const px=(value:number)=>value+'px';
function resolve(value:unknown,tokens:Tokens):unknown {
 if(typeof value==='object'&&value!==null&&'token' in value){
  const [category,key]=String(value.token).split('.');
  if(!Object.hasOwn(tokens,category)||!Object.hasOwn(tokens[category as keyof Tokens],key))throw new Error('Unknown token');
  return resolve(tokens[category as keyof Tokens][key],tokens);
 }
 if(typeof value==='object'&&value!==null&&'value' in value&&'unit' in value)return String(value.value)+String(value.unit);
 return value;
}
export function styleDeclarations(style:Style,tokens:Tokens):string{
 const declarations:string[]=[];
 for(const [key,raw] of Object.entries(style)){
  const value=resolve(raw,tokens);
  if(key==='gridColumns'){declarations.push('grid-template-columns:repeat('+value+',minmax(0,1fr))');continue;}
  const name=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  declarations.push(name+':'+String(value));
 }
 return declarations.join(';');
}
export function nodeClass(id:string){return 'sv-node-'+id;}
export function generateCSS(doc:StudioDocument):string{
 const base=['.sv-page,.sv-page *{box-sizing:border-box}.sv-page{font-family:system-ui,sans-serif;overflow-wrap:anywhere}.sv-page h1,.sv-page h2,.sv-page h3,.sv-page h4,.sv-page h5,.sv-page h6,.sv-page p{margin:0}.sv-page img{max-width:100%;height:auto}.sv-page a{display:inline-block;text-decoration:none}.sv-page [hidden]{display:none!important}'];
 const tablet:string[]=[],mobile:string[]=[];
 for(const node of Object.values(doc.nodes)){
  const selector='.'+nodeClass(node.id);
  base.push(selector+'{'+styleDeclarations(node.styles.base,doc.tokens)+'}');
  if(node.styles.tablet)tablet.push(selector+'{'+styleDeclarations(node.styles.tablet,doc.tokens)+'}');
  if(node.styles.mobile)mobile.push(selector+'{'+styleDeclarations(node.styles.mobile,doc.tokens)+'}');
 }
 return base.join('\n')+'\n@media(max-width:'+px(1024)+'){'+tablet.join('\n')+'}\n@media(max-width:'+px(767)+'){'+mobile.join('\n')+'}';
}
