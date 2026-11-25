import {createElement,type ReactNode} from 'react';
import {DocumentSchema,isSafeHref,type StudioDocument,type StudioNode} from '../../schema/v2';
import {nodeClass,generateCSS} from './styles';
function NodeView({node,document}:{node:StudioNode;document:StudioDocument}){
 const attrs={className:nodeClass(node.id)+(node.type==='root'?' sv-page':''),id:node.anchor,hidden:node.flags.hidden||undefined};
 const children:ReactNode=node.children.map(id=><NodeView key={id} node={document.nodes[id]} document={document}/>);
 switch(node.type){
  case 'root':return <main {...attrs}>{children}</main>;
  case 'section':return <section {...attrs}>{children}</section>;
  case 'container':return <div {...attrs}>{children}</div>;
  case 'heading':return createElement('h'+node.props.level,attrs,node.props.text);
  case 'text':return <p {...attrs}>{node.props.text}</p>;
  case 'button':return node.props.href&&isSafeHref(node.props.href)?<a {...attrs} href={node.props.href}>{node.props.label}</a>:<button {...attrs} type="button" disabled>{node.props.label}</button>;
  case 'image':return node.props.src.kind==='url'?<img {...attrs} src={node.props.src.url} alt={node.props.decorative?'':node.props.alt} style={{objectFit:node.props.fit}}/>:<div {...attrs} role={node.props.decorative?undefined:'img'} aria-label={node.props.decorative?undefined:node.props.alt||'Imagem indisponível'}>{'Imagem indisponível'}</div>;
  case 'divider':return <hr {...attrs}/>;
 }
}
export function PageRenderer({document}:{document:StudioDocument}){
 const valid=DocumentSchema.parse(document);
 return <><style>{generateCSS(valid)}</style><NodeView document={valid} node={valid.nodes[valid.rootId]}/></>;
}
