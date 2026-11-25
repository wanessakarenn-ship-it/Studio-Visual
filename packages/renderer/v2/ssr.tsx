import {renderToStaticMarkup} from 'react-dom/server';
import {DocumentSchema} from '../../schema/v2';
import type {AssetSources} from './assetSources';
import {PageRenderer} from './PageRenderer';
export function renderStaticDocument(input:unknown,assets:AssetSources={},externalCSS=false):string{
 const document=DocumentSchema.parse(input);
 return '<!doctype html>'+renderToStaticMarkup(<html lang={document.metadata.language}><head><meta charSet="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>{document.title}</title>{externalCSS&&<link rel="stylesheet" href="styles.css"/>}{document.metadata.description&&<meta name="description" content={document.metadata.description}/>}</head><body style={{margin:0}}><PageRenderer document={document} assets={assets} inlineCSS={!externalCSS}/></body></html>);
}
