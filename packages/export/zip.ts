export type ZipEntry={name:string;data:Uint8Array};
const table=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let bit=0;bit<8;bit++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(data:Uint8Array){let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function createZip(entries:ZipEntry[]):Uint8Array<ArrayBuffer>{
 if(entries.length>65535)throw Error('ZIP entry limit');
 const encoder=new TextEncoder(),names=new Set<string>(),parts:Uint8Array[]=[],central:Uint8Array[]=[];
 let offset=0,centralSize=0;
 for(const entry of entries){
  if(!/^[a-zA-Z0-9_./-]+$/.test(entry.name)||entry.name.split('/').some(p=>!p||p==='.'||p==='..')||names.has(entry.name))throw Error('Unsafe or duplicate ZIP entry');
  names.add(entry.name);const name=encoder.encode(entry.name),size=entry.data.length,crc=crc32(entry.data);
  if(name.length>65535||size>0xffffffff||offset+size+30+name.length>0xffffffff)throw Error('ZIP32 size limit');
  const local=new Uint8Array(30+name.length),l=new DataView(local.buffer);
  l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);l.setUint32(14,crc,true);l.setUint32(18,size,true);l.setUint32(22,size,true);l.setUint16(26,name.length,true);local.set(name,30);
  const dir=new Uint8Array(46+name.length),d=new DataView(dir.buffer);
  d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,size,true);d.setUint32(24,size,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);dir.set(name,46);
  parts.push(local,entry.data);central.push(dir);offset+=local.length+size;centralSize+=dir.length;
 }
 if(offset+centralSize+22>0xffffffff)throw Error('ZIP32 size limit');
 const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
 const result=new Uint8Array(offset+centralSize+22);let pos=0;for(const part of [...parts,...central,end]){result.set(part,pos);pos+=part.length;}return result;
}
