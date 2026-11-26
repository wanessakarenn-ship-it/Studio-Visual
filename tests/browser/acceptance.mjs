import {chromium} from 'playwright';
import {auditParity,performanceCheck} from './extended.mjs';
import {execFileSync,spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=process.argv[2],out=path.join(root,'artifacts/browser');
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port','4173','--strictPort'],{cwd:root,stdio:'inherit'});
let browser,page;
const report=[];let diagnostics=[];
async function check(name,fn){await fn();report.push({name,status:'passed'});console.log('PASS',name);}
try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4173/studio-v2.html')).ok)break;}catch{/* Wait for the preview server to become available. */}await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({headless:true});
 page=await browser.newPage({viewport:{width:1920,height:1080},acceptDownloads:true});
 const errors=[];diagnostics=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')diagnostics.push(m.text());});await page.exposeFunction('recordCanvasMessage',m=>{diagnostics.push(m);});await page.addInitScript(()=>{window.addEventListener('message',e=>{if(e.data?.kind&&typeof e.data?.channel==='string')window.recordCanvasMessage({kind:e.data.kind,origin:e.origin,id:e.data.id});});});
 await page.goto('http://127.0.0.1:4173/studio-v2.html');
 await check('Create Golden Page',async()=>{await page.getByRole('button',{name:'Abrir Golden Page',exact:true}).click();await page.getByRole('status').filter({hasText:'Salvo neste navegador'}).waitFor();});
 const frame=()=>page.frameLocator('iframe[title="Canvas de edição"]');
 await check('Render and select heading',async()=>{await frame().locator('html[data-studio-bridge-ready=true]').waitFor({state:'attached'});await frame().locator('h1').waitFor();await frame().locator('h1').click();await page.locator('.layer[aria-pressed="true"]').filter({hasText:'Título principal'}).waitFor();await page.getByRole('textbox',{name:'Conteúdo',exact:true}).waitFor();});
 await check('Edit and save heading',async()=>{await page.getByRole('textbox',{name:'Conteúdo',exact:true}).fill('Homologação Studio Visual');await page.getByRole('button',{name:'Salvar',exact:true}).click();await frame().locator('h1').filter({hasText:'Homologação Studio Visual'}).waitFor();await page.getByRole('status').filter({hasText:'Salvo neste navegador'}).waitFor();});
 await check('Responsive viewport widths',async()=>{for(const [device,width] of [['base',1440],['tablet',768],['mobile',390]]){await page.getByLabel('Dispositivo').selectOption(device);const actual=await frame().locator('html').evaluate(()=>window.innerWidth);assert.equal(actual,width);await page.screenshot({path:path.join(out,device+'.png')});}});
 await check('Reload preserves saved text',async()=>{await page.reload();await frame().locator('h1').filter({hasText:'Homologação Studio Visual'}).waitFor();});
 await check('Upload and render local raster image',async()=>{await page.getByRole('button',{name:/Hero em duas colunas/}).click();await page.locator('.layer').filter({hasText:/^\s*Imagem\s*$/}).last().click();const png=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=64;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#5945c2';ctx.fillRect(0,0,64,64);return c.toDataURL('image/png').split(',')[1];}),'base64');await page.getByLabel('Importar imagem').setInputFiles({name:'acceptance.png',mimeType:'image/png',buffer:png});await page.getByRole('button',{name:/acceptance\.png/}).click();await frame().locator('img[src^="data:image/png"]').waitFor();await frame().locator('img[src^="data:image/png"]').first().evaluate(async img=>{await img.decode();if(!img.naturalWidth)throw Error('Image failed to decode');});});
 await check('Preview contains no editing scripts',async()=>{await page.getByRole('button',{name:'Prévia',exact:true}).click();const preview=page.frameLocator('iframe[title="Prévia isolada da página"]');await preview.locator('h1').waitFor();assert.equal(await preview.locator('script').count(),0);await page.getByRole('button',{name:'Editar',exact:true}).click();});
 await check('Export ZIP download',async()=>{await page.getByRole('button',{name:'Exportar ZIP',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar ZIP',exact:true}).click();const download=await downloadPromise;await download.saveAs(path.join(out,'landing-page.zip'));assert.ok((await readFile(path.join(out,'landing-page.zip'))).length>100);});
 await check('ZIP extraction and standalone parity / accessibility',async()=>{
  execFileSync('unzip',['-t',path.join(out,'landing-page.zip')],{stdio:'inherit'});
  execFileSync('python3',[path.join(root,'tests/browser/check_export.py'),path.join(out,'landing-page.zip')],{stdio:'inherit'});
  const extracted=path.join(out,'exported');await mkdir(extracted,{recursive:true});
  execFileSync('unzip',['-o',path.join(out,'landing-page.zip'),'-d',extracted],{stdio:'inherit'});
  await page.getByRole('button',{name:'Fechar',exact:true}).last().click();
  await auditParity(page,browser,extracted,out);
 });
 await check('500 component performance',async()=>{await performanceCheck(browser,root,out);});
 await check('No uncaught application errors',async()=>assert.deepEqual(errors,[]));
}catch(error){report.push({status:'failed',message:String(error)});if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally{await writeFile(path.join(out,'diagnostics.json'),JSON.stringify(diagnostics,null,2));await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();server.kill();}
