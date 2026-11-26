import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const axePath=require.resolve('axe-core/axe.min.js');
async function snapshot(locator){
 return locator.evaluate(root=>Array.from(root.querySelectorAll('[class*="sv-node-"]')).map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {tag:n.tagName,text:n.matches('img')?n.alt:n.children.length?'':n.textContent,rect:[r.x,r.y,r.width,r.height].map(v=>Math.round(v*10)/10),font:s.fontSize,color:s.color,background:s.backgroundColor,display:s.display,grid:s.gridTemplateColumns};}));
}
export async function auditParity(page,browser,extracted,out){
 const standalone=await browser.newPage();const findings=[];
 try{
 for(const [device,width] of [['base',1440],['tablet',768],['mobile',390]]){
  await page.getByLabel('Dispositivo').selectOption(device);
  await page.getByRole('button',{name:'Prévia',exact:true}).click();
  const preview=page.frameLocator('iframe[title="Prévia isolada da página"]');
  await preview.locator('main').waitFor();
  await standalone.setViewportSize({width,height:760});
  await standalone.goto(pathToFileURL(path.join(extracted,'index.html')).href);
  await standalone.locator('main').waitFor();
  await standalone.locator('img').first().evaluate(img=>img.decode());
  await preview.locator('img').first().evaluate(img=>img.decode());
  const a=await snapshot(preview.locator('body')),b=await snapshot(standalone.locator('body'));
  await standalone.screenshot({path:path.join(out,'export-'+device+'.png'),fullPage:true});
  await page.screenshot({path:path.join(out,'preview-'+device+'.png')});
  findings.push({device,width,nodes:a.length,match:JSON.stringify(a)===JSON.stringify(b),preview:a,export:b});
  await writeFile(path.join(out,'parity.json'),JSON.stringify(findings,null,2));
  assert.deepEqual(a,b,'DOM geometry and computed style parity '+device);
  assert.equal(await standalone.locator('script').count(),0);
  assert.equal(await standalone.locator('html').evaluate(el=>el.scrollWidth<=window.innerWidth),true,'No horizontal overflow '+device);
  await page.getByRole('button',{name:'Editar',exact:true}).click();
 }
 await standalone.addScriptTag({path:axePath});
 const result=await standalone.evaluate(async()=>await window.axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
 await writeFile(path.join(out,'accessibility.json'),JSON.stringify(result,null,2));
 assert.equal(result.violations.filter(v=>['critical','serious'].includes(v.impact)).length,0,'Serious/critical WCAG violations in exported page');
 }finally{await standalone.close();}
}
export async function performanceCheck(browser,root,out){
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 try{
 const fixture=JSON.parse(await readFile(path.join(root,'packages/schema/v2/fixtures/golden-page.json'),'utf8'));
 const section=fixture.nodes[fixture.nodes[fixture.rootId].children[0]];
 for(let i=Object.keys(fixture.nodes).length;i<500;i++){const id='b5100800-0000-4000-8000-'+String(10000+i).padStart(12,'0');fixture.nodes[id]={id,type:'text',name:'Stress '+i,props:{text:'Componente '+i},children:[],styles:{base:{}},flags:{hidden:false,locked:false}};section.children.push(id);}
 await page.goto('http://127.0.0.1:4173/studio-v2.html');
 await page.evaluate(doc=>{localStorage.setItem('studio-visual-v2:'+doc.id,JSON.stringify({current:{revision:1,savedAt:new Date().toISOString(),document:doc},backup:null}));localStorage.setItem('studio-visual-v2-active',doc.id);},fixture);
 const started=performance.now();await page.reload();const frame=page.frameLocator('iframe[title="Canvas de edição"]');await frame.locator('h1').waitFor();const reopenMs=performance.now()-started;
 assert.equal(await frame.locator('[class*="sv-node-"]').count(),500);
 await frame.locator('h1').click();const input=page.getByRole('textbox',{name:'Conteúdo',exact:true});await input.waitFor();
 const edit=[],undo=[];
 for(let i=0;i<20;i++){let t=performance.now();await input.fill('Stress edit '+i);await frame.locator('h1').filter({hasText:'Stress edit '+i}).waitFor();edit.push(performance.now()-t);t=performance.now();await page.getByRole('button',{name:'Desfazer',exact:true}).click();await frame.locator('h1').filter({hasText:'Da ideia à publicação.'}).waitFor();undo.push(performance.now()-t);}
 const p95=a=>[...a].sort((x,y)=>x-y)[Math.ceil(a.length*.95)-1];
 const result={nodes:500,reopenMs,editP95Ms:p95(edit),undoP95Ms:p95(undo),edit,undo,environment:'Chromium GitHub Actions Ubuntu 24.04',thresholds:{reopenMs:1000,editP95Ms:100,undoP95Ms:100}};
 await writeFile(path.join(out,'performance.json'),JSON.stringify(result,null,2));
 console.log('Performance metrics:',JSON.stringify({reopenMs:result.reopenMs,editP95Ms:result.editP95Ms,undoP95Ms:result.undoP95Ms,thresholds:result.thresholds}));
 assert.ok(reopenMs<=1000&&p95(edit)<=100&&p95(undo)<=100,'Performance budget exceeded (includes browser automation and iframe reload)');
 }finally{await page.close();}
}
