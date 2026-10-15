const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-abnahme';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 const context=await browser.newContext({viewport,deviceScaleFactor:1}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.JMDEBUG);
 await page.evaluate(()=>{const d=JMDEBUG,s=d.newState('Regression',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx='2d';s.min=720;s.sound=false;s.music=false;s.map='haus';s.px=4;s.py=5;s.inv={ei:9,holz:60,stein:40,eisen:8};s.money=10000;s.flags.letter=true;s.npc.timo={p:20,met:true,talk:1,gift:0,r3:false};d.startGame(s,false);});
 const snap=async name=>{const p=path.join(out,name+'-'+viewport.width+'.png');await page.screenshot({path:p});console.log('Beleg',p);};
 await page.evaluate(()=>JMDEBUG.tap(1,3));await page.getByRole('heading',{name:'Kühlschrank',exact:true}).waitFor();
 await page.locator('#qty-ei').fill('3');await page.locator('[data-a="inn"][data-k="ei"]').click();assert.equal(await page.evaluate(()=>JMDEBUG.S.fridge.ei),3);
 await page.locator('[data-a="inall"][data-k="ei"]').click();assert.equal(await page.evaluate(()=>JMDEBUG.S.fridge.ei),9);
 await page.locator('[data-a="out1"][data-k="ei"]').click();assert.equal(await page.evaluate(()=>JMDEBUG.S.inv.ei),1);
 await page.locator('#qty-ei').fill('2');await page.locator('[data-a="outn"][data-k="ei"]').click();assert.equal(await page.evaluate(()=>JMDEBUG.S.inv.ei),3);
 await snap('kuehlschrank-2d');assert.equal(await page.locator('#panel').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Panel darf horizontal nicht überlaufen');
 await page.getByRole('button',{name:'Schließen',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'Weiterspielen',exact:true}).click();assert.equal(await page.evaluate(()=>JMDEBUG.S.fridge.ei),6);assert.equal(await page.evaluate(()=>JMDEBUG.S.inv.ei),3);
 // Produktion: Erz wirklich bearbeiten, Ebenenwechsel und Reload dürfen es nicht verdoppeln.
 await page.evaluate(()=>JMDEBUG.setMap('hoehle',10,14));const rock=await page.evaluate(()=>({...JMDEBUG.S.rocks[0]})),count=await page.evaluate(()=>JMDEBUG.S.rocks.length);
 for(let i=0;i<rock.hp;i++){await page.evaluate(r=>JMDEBUG.tap(r.x,r.y),rock);await page.waitForFunction(()=>JMDEBUG.idle);await page.waitForTimeout(300);}
 assert.equal(await page.evaluate(()=>JMDEBUG.S.rocks.length),count-1);
 await page.evaluate(()=>JMDEBUG.tap(10,2));await page.waitForFunction(()=>JMDEBUG.M.depth===2);await page.waitForFunction(()=>!JMDEBUG.busy.ui.fade);await page.evaluate(()=>JMDEBUG.tap(10,16));await page.waitForFunction(()=>JMDEBUG.M.depth===1);assert.equal(await page.evaluate(()=>JMDEBUG.S.rocks.length),count-1);
 await page.reload();await page.getByRole('button',{name:'Weiterspielen',exact:true}).click();assert.equal(await page.evaluate(()=>JMDEBUG.S.rocks.length),count-1);
 await page.evaluate(()=>JMDEBUG.tap(10,16));await page.waitForFunction(()=>JMDEBUG.M.id==='forest');await page.waitForFunction(()=>!JMDEBUG.busy.ui.fade);await page.evaluate(()=>JMDEBUG.tap(24,2));await page.waitForFunction(()=>JMDEBUG.M.id==='hoehle');assert.equal(await page.evaluate(()=>JMDEBUG.S.rocks.length),count);
 // Beide Hausstufen über Ladenangebot und reguläres Bett, einschließlich Reload während Bau.
 for(const level of [1,2]){
 await page.evaluate(()=>{JMDEBUG.S.min=720;JMDEBUG.setMap('village',20,14);});await page.evaluate(()=>JMDEBUG.tap(25,11));await page.waitForFunction(()=>JMDEBUG.M.id==='i_zimmerei');await page.waitForFunction(()=>!JMDEBUG.busy.ui.fade);await page.evaluate(()=>JMDEBUG.tap(3,4));await page.getByRole('heading',{name:'Timos Zimmerei',exact:true}).waitFor();
 await page.locator(`[data-a="buildhouse"][data-k="${level}"]`).click();assert.equal(await page.locator(`[data-a="buildhouse"][data-k="${level}"]`).isDisabled(),true);
 await snap('zimmermann-stufe'+level+'-2d');await page.reload();await page.getByRole('button',{name:'Weiterspielen',exact:true}).click();assert.equal(await page.evaluate(()=>JMDEBUG.S.house.job.level),level);
 await page.evaluate(()=>JMDEBUG.setMap('haus',10,5));
 for(let i=0;i<(level===1?2:3);i++){await page.evaluate(()=>JMDEBUG.tap(11,3));await page.getByRole('button',{name:'Gute Nacht',exact:true}).click();await page.waitForFunction(()=>!JMDEBUG.busy.ui.fade,{timeout:10000});}
 assert.equal(await page.evaluate(()=>JMDEBUG.S.house.level),level);assert.equal(await page.evaluate(()=>JMDEBUG.M.w),14+level*4);await snap('haus-stufe'+level+'-2d');
 await page.evaluate(()=>JMDEBUG.tap(14,3));await page.getByRole('heading',{name:'Kühlschrank',exact:true}).waitFor();assert.equal(await page.evaluate(()=>JMDEBUG.S.fridge.ei),6);await page.getByRole('button',{name:'Schließen',exact:true}).click();
 }
 assert.equal(await page.evaluate(()=>JMDEBUG.S.maxE),120);assert.deepEqual(errors,[]);console.log('2D Mengen/Reload/Abbau/Durchlauf/Bett/beide Ausbauten',viewport,'OK');await context.close();
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
