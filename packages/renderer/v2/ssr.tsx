import {renderToStaticMarkup} from 'react-dom/server';
import {DocumentSchema} from '../../schema/v2';
import {PageRenderer} from './PageRenderer';
export function renderStaticDocument(input:unknown):string{
 const document=DocumentSchema.parse(input);
 return '<!doctype html>'+renderToStaticMarkup(<html lang={document.metadata.language}><head><meta charSet="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>{document.title}</title>{document.metadata.description&&<meta name="description" content={document.metadata.description}/>}</head><body style={{margin:0}}><PageRenderer document={document}/></body></html>);
}
