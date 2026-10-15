/* Synthetische Vorräte, echte DOM-Transfers in isolierten Browsern. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-stadt';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
for(const viewport of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
 const context=await browser.newContext({viewport});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await page.waitForFunction(()=>window.JMDEBUG);
 await page.evaluate(gfx=>{const d=JMDEBUG,s=d.newState('Synthetischer Scrolltest',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx=gfx;s.map='haus';s.px=3;s.py=5;s.sound=false;s.music=false;s.flags.letter=true;s.inv=Object.fromEntries(Object.keys(JM.ITEMS).filter(JM.Ausbau.food).map(k=>[k,12]));d.startGame(s,false);},gfx);
 await page.evaluate(()=>JMDEBUG.tap(1,3));await page.getByRole('heading',{name:'Kühlschrank',exact:true}).waitFor();
 const row=page.locator('.storage-row').nth(8),input=row.locator('input').first(),button=row.locator('[data-a="inn"]');await input.fill('3');await button.scrollIntoViewIfNeeded();
 const before=await button.boundingBox();const k=await button.getAttribute('data-k');const total=await page.evaluate(k=>JMDEBUG.S.inv[k]+(JMDEBUG.S.fridge[k]||0),k);
 await button.click();const after=await page.locator(`[data-a="inn"][data-k="${k}"]`).boundingBox();
 assert.ok(Math.abs(after.y-before.y)<3,`Kühlschrank-Anker bleibt sichtbar: vorher ${before.y}, nachher ${after.y}`);
 assert.equal(await page.locator('#qty-'+k).inputValue(),'3','gewählte Menge erhalten');
 assert.equal(await page.evaluate(k=>JMDEBUG.S.fridge[k],k),3);
 await page.locator(`[data-a="inn"][data-k="${k}"]`).click();assert.equal(await page.evaluate(k=>JMDEBUG.S.fridge[k],k),6);
 assert.equal(await page.evaluate(k=>JMDEBUG.S.inv[k]+JMDEBUG.S.fridge[k],k),total);
 await page.screenshot({path:path.join(out,`transfer-${viewport.width}-${gfx}.png`)});
 await page.getByRole('button',{name:'Schließen',exact:true}).click();
 await page.evaluate(()=>JMDEBUG.openBag('ship'));assert.equal(await page.locator('#panel').evaluate(e=>e.scrollTop),0,'neuer Dialog beginnt oben');
 const last=page.locator('[data-a="sel"]').last(),lastKey=await last.getAttribute('data-k');await last.click();
 const ship=page.locator(`[data-a="ship1"][data-k="${lastKey}"]`);await ship.scrollIntoViewIfNeeded();const shipBefore=await ship.boundingBox();await ship.click();const shipAfter=await ship.boundingBox();assert.ok(Math.abs(shipAfter.y-shipBefore.y)<3,'Versand behält Position und Auswahl');
 await page.locator('[data-a="shipall1"]').click();assert.equal(await page.locator(`[data-a="sel"][data-k="${lastKey}"]`).count(),0,'letzter geleerter Bestand verschwindet');assert.equal(await page.evaluate(k=>JMDEBUG.S.ship[k],lastKey),12,'keine Duplikate');
 // Fallback am Listenende: gültige Position statt Sprung nach oben.

 assert.ok(await page.locator('#panel').evaluate(e=>e.scrollTop>0&&e.scrollTop<=Math.max(0,e.scrollHeight-e.clientHeight)+1),'verschwundene Auswahl erhält gültigen geklemmten Kontext');
 await page.getByRole('button',{name:'Schließen',exact:true}).click();await page.evaluate(()=>JMDEBUG.openBag('bag'));assert.equal(await page.locator('#panel').evaluate(e=>e.scrollTop),0);
 await page.getByRole('button',{name:'Schließen',exact:true}).click();await page.evaluate(()=>JMDEBUG.tap(1,3));await page.getByRole('heading',{name:'Kühlschrank',exact:true}).waitFor();assert.equal(await page.locator('#panel').evaluate(e=>e.scrollTop),0);assert.equal(await page.locator('#qty-'+k).inputValue(),'1','neuer Besuch hat frische Mengenauswahl');
 await page.waitForTimeout(1500);await page.reload();await page.getByRole('button',{name:'Weiterspielen',exact:true}).click();await page.waitForFunction(()=>JMDEBUG.S?.name==='Synthetischer Scrolltest');assert.equal(await page.evaluate(k=>JMDEBUG.S.fridge[k],k),6,'Bestand nach Reload');
 assert.deepEqual(errors,[]);console.log('Transfer-Kontext',viewport.width,gfx,'OK');await context.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
