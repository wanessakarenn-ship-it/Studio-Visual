import type {Tokens} from '../../../packages/schema/v2';
export function resolveInspectorValue(value:unknown,tokens:Tokens):unknown{
 if(typeof value==='object'&&value!==null&&'token' in value){
  const [category,key]=String(value.token).split('.');
  if(Object.hasOwn(tokens,category)&&Object.hasOwn(tokens[category as keyof Tokens],key))return tokens[category as keyof Tokens][key];
  return undefined;
 }
 return value;
}
