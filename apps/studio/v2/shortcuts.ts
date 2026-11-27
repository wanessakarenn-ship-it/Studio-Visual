export const shortcuts=['undo','redo','save','duplicate','copy','paste','delete','escape','rename','up','down'] as const;
export type Shortcut=typeof shortcuts[number];
export function isShortcut(value:unknown):value is Shortcut{return typeof value==='string'&&(shortcuts as readonly string[]).includes(value);}
type Key={key:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;shiftKey:boolean;isComposing:boolean;repeat:boolean};
export function shortcutFor(e:Key,editing:boolean):Shortcut|null{
 if(editing||e.isComposing||e.repeat)return null;
 const key=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
 if(mod&&!e.altKey){switch(key){case 'z':return e.shiftKey?'redo':'undo';case 'y':return 'redo';case 's':return 'save';case 'd':return 'duplicate';case 'c':return 'copy';case 'v':return 'paste';default:return null;}}
 if(!mod&&e.altKey)return key==='arrowup'?'up':key==='arrowdown'?'down':null;
 if(!mod&&!e.altKey)return key==='delete'?'delete':key==='escape'?'escape':key==='f2'?'rename':null;
 return null;
}
