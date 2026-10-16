const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 const context=await browser.newContext({viewport,deviceScaleFactor:1});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.JMDEBUG);
 await page.evaluate(()=>{const d=JMDEBUG,s=d.newState('Testhof',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.map='haus';s.px=3;s.py=5;s.inv={ei:4,weizen:1,zwiebel:1};s.sound=false;s.music=false;s.flags.letter=true;d.startGame(s,false);});
 const fs=require('node:fs'),path=require('node:path'),out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-abnahme';fs.mkdirSync(out,{recursive:true});
 const snap=async name=>{await page.waitForTimeout(350);const p=path.join(out,name+'-'+viewport.width+'.png');await page.screenshot({path:p});console.log('Beleg',p);};
 // Echte Objektinteraktion: Kühlschrank antippen, Weg laufen, UI bedienen.
 await page.evaluate(()=>JMDEBUG.tap(1,3));
 await page.getByRole('heading',{name:'Kühlschrank',exact:true}).waitFor({timeout:8000});
 await page.locator('[data-a="in1"][data-k="ei"]').click();
 assert.equal(await page.evaluate(()=>JMDEBUG.S.fridge.ei),1);
 await page.locator('[data-a="inall"][data-k="ei"]').click();assert.equal(await page.evaluate(()=>JMDEBUG.S.inv.ei||0),0);
 await page.getByRole('button',{name:'Schließen',exact:true}).click();
 await page.evaluate(()=>JMDEBUG.tap(2,3));await page.getByRole('heading',{name:'Küche',exact:true}).waitFor();
 await page.locator('[data-a="cook"][data-k="suppe"]').click();
 assert.equal(await page.evaluate(()=>JMDEBUG.S.inv.suppe),1);
 await page.getByRole('button',{name:'Schließen',exact:true}).click();
 await page.evaluate(()=>{JMDEBUG.S.rod=1;JMDEBUG.S.min=720;JMDEBUG.setMap('forest',24,5);JMDEBUG.openBag('bag');});await page.getByRole('button',{name:'Schließen',exact:true}).click();await page.locator('#hotbar [data-k="rute"]').click();
 await page.evaluate(()=>JMDEBUG.tap(24,2));await page.waitForFunction(()=>JMDEBUG.M.id==='hoehle');
 for(let depth=2;depth<=10;depth++){await page.evaluate(()=>JMDEBUG.tap(10,2));await page.waitForFunction(d=>JMDEBUG.M.depth===d,depth,{timeout:15000});}
 assert.equal(await page.evaluate(()=>JMDEBUG.M.id),'hoehle10');await snap('magischer-teich-3d');
 await page.evaluate(()=>JMDEBUG.tap(11,7));await page.waitForFunction(()=>JMDEBUG.idle);for(let i=0;i<3;i++)await page.locator('#zOut').click();await page.waitForTimeout(500);const waterPixel=await page.evaluate(()=>JM.R3.proj(15.5,7.5,.04));await page.mouse.click(waterPixel[0],waterPixel[1]);await page.waitForFunction(()=>JMDEBUG.busy.fish==='wait');await snap('teich-angelplatz-3d');
 assert.ok(['sternenschuppe','kristallforelle'].includes(await page.evaluate(()=>JMDEBUG.FISH.k)));
 const selected=await page.evaluate(()=>JMDEBUG.FISH.k);
 await page.waitForFunction(()=>JMDEBUG.busy.fish==='bite');await page.mouse.click(viewport.width/2,viewport.height/2);
 await page.waitForFunction(()=>JMDEBUG.busy.fish==='reel');
 const fishBox=await page.locator('#fishcv').boundingBox();await page.mouse.move(fishBox.x+30,fishBox.y+80);let held=false;
 for(let i=0;i<240;i++){const f=await page.evaluate(()=>({phase:JMDEBUG.FISH.phase,fy:JMDEBUG.FISH.fy,z:JMDEBUG.FISH.zone,v:JMDEBUG.FISH.zv}));if(f.phase!=='reel')break;const hold=f.fy>f.z+.16+f.v*.12;if(hold!==held){if(hold)await page.mouse.down();else await page.mouse.up();held=hold;}await page.waitForTimeout(50);}
 if(held)await page.mouse.up();assert.equal(await page.evaluate(k=>JMDEBUG.S.fishLog[k],selected),1,'Magischen Fisch regulär einholen');
 await page.evaluate(()=>JMDEBUG.openBook('coll'));await page.getByText('Magischer Teich · Ebene 10',{exact:true}).waitFor();assert.ok((await page.locator('#panel').innerText()).includes(await page.evaluate(k=>JM.ITEMS[k].n,selected)));await page.getByRole('button',{name:'Schließen',exact:true}).click();
 await page.evaluate(()=>JMDEBUG.setMap('farm',9,8));await page.evaluate(()=>JMDEBUG.tap(9,7));await page.getByRole('heading',{name:'Versandkiste',exact:true}).waitFor();await page.locator(`[data-a="sel"][data-k="${selected}"]`).click();await page.locator(`[data-a="ship1"][data-k="${selected}"]`).click();await page.getByRole('button',{name:'Schließen',exact:true}).click();
 assert.deepEqual(errors,[]);
 await page.evaluate(()=>{JMDEBUG.S.money=10000;Object.assign(JMDEBUG.S.inv,{holz:70,stein:40,eisen:8});JMDEBUG.S.npc.timo.met=true;JMDEBUG.S.min=720;JMDEBUG.setMap('village',20,14);});
 await page.evaluate(()=>JMDEBUG.tap(25,11));await page.waitForFunction(()=>JMDEBUG.M.id==='i_zimmerei');
 await page.evaluate(()=>JMDEBUG.tap(3,4));await page.getByRole('heading',{name:'Timos Zimmerei',exact:true}).waitFor();
 await page.locator('[data-a="buildhouse"][data-k="1"]').click();assert.equal(await page.evaluate(()=>JMDEBUG.S.money),9000);
 await page.getByRole('button',{name:'Schließen',exact:true}).click();
 // Beschleunigt nur das Testtempo, nicht die Bauabschlussfunktion.
 for(let i=0;i<2;i++){await page.evaluate(()=>JMDEBUG.endDay(false));await page.waitForFunction(()=>!JMDEBUG.busy.ui.fade,{timeout:10000});}
 assert.equal(await page.evaluate(()=>JMDEBUG.S.house.level),1);assert.equal(await page.evaluate(()=>JMDEBUG.M.w),18);
 await page.waitForTimeout(350);const fridgeHit=await page.evaluate(()=>{const p=JM.R3.proj(14.5,3.5,1);return JM.R3.pick(p[0],p[1]);});assert.equal(Math.floor(fridgeHit.wx),14);assert.equal(Math.floor(fridgeHit.wy),3,'3D muss nach Bauabschluss den neuen Kühlschrank statt veralteter Raumgeometrie auswählen');
 await snap('haus-stufe1-3d');
 const wood=await page.evaluate(()=>{const d=JMDEBUG;d.setMap('farm',5,8);const entry=Object.entries(d.S.field).find(([,f])=>f.o==='branch');const [x,y]=entry[0].split(',').map(Number);const before=d.S.inv.holz||0;d.doField(x,y);return (d.S.inv.holz||0)-before;});assert.equal(wood,2);
 await page.evaluate(()=>JMDEBUG.openBook('opt'));
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Sicherung exportieren',exact:true}).click();const download=await downloadPromise;
 const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(backup.house.level,1);assert.equal(backup.name,'Testhof');
 assert.deepEqual(errors,[]);console.log('Browser Kühlschrank/Küche/Mine/Zimmermann/Holz/Export',viewport,'OK');
 await context.close();}
 }finally{/* Begrenzt: Chrome-Hilfsprozesse (GoogleUpdater, Crashpad) halten sonst Chromes stdio offen und close() endet nie. */await Promise.race([browser.close(),new Promise(r=>setTimeout(r,8000))]);}
})().catch(e=>{console.error(e);process.exitCode=1})
/* Ausdrücklich beenden: von Chrome gestartete Hilfsprozesse (Crashpad, GoogleUpdater) können die geerbte stderr-Pipe offen halten. */
.finally(()=>process.exit());
