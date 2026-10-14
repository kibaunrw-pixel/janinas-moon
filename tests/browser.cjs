const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 const context=await browser.newContext({viewport,deviceScaleFactor:1});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.JMDEBUG);
 await page.evaluate(()=>{const d=JMDEBUG,s=d.newState('Testhof',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.map='haus';s.px=3;s.py=5;s.inv={ei:4,weizen:1,zwiebel:1};s.sound=false;s.music=false;s.flags.letter=true;d.startGame(s,false);});
 // Echte Objektinteraktion: Kühlschrank antippen, Weg laufen, UI bedienen.
 await page.evaluate(()=>JMDEBUG.tap(1,3));
 await page.getByRole('heading',{name:'Kühlschrank',exact:true}).waitFor({timeout:8000});
 await page.locator('[data-a="in1"][data-k="ei"]').click();
 assert.equal(await page.evaluate(()=>JMDEBUG.S.fridge.ei),1);
 await page.getByRole('button',{name:'Schließen',exact:true}).click();
 await page.evaluate(()=>JMDEBUG.tap(2,3));await page.getByRole('heading',{name:'Küche',exact:true}).waitFor();
 await page.locator('[data-a="cook"][data-k="suppe"]').click();
 assert.equal(await page.evaluate(()=>JMDEBUG.S.inv.suppe),1);
 await page.getByRole('button',{name:'Schließen',exact:true}).click();
 await page.evaluate(()=>{JMDEBUG.S.rod=1;JMDEBUG.S.hold='rute';JMDEBUG.S.min=720;JMDEBUG.setMap('forest',24,5);});
 await page.evaluate(()=>JMDEBUG.tap(24,2));await page.waitForFunction(()=>JMDEBUG.M.id==='hoehle');
 for(let depth=2;depth<=10;depth++){await page.evaluate(()=>JMDEBUG.tap(10,2));await page.waitForFunction(d=>JMDEBUG.M.depth===d,depth,{timeout:15000});}
 assert.equal(await page.evaluate(()=>JMDEBUG.M.id),'hoehle10');
 await page.evaluate(()=>JMDEBUG.tap(13,7));await page.waitForFunction(()=>JMDEBUG.busy.fish==='wait');
 assert.ok(['sternenschuppe','kristallforelle'].includes(await page.evaluate(()=>JMDEBUG.FISH.k)));
 assert.deepEqual(errors,[]);
 await page.evaluate(()=>{JMDEBUG.FISH.phase=null;JMDEBUG.S.money=10000;Object.assign(JMDEBUG.S.inv,{holz:70,stein:40,eisen:8});JMDEBUG.S.npc.timo.met=true;JMDEBUG.S.min=720;JMDEBUG.setMap('village',20,14);});
 await page.evaluate(()=>JMDEBUG.tap(25,11));await page.waitForFunction(()=>JMDEBUG.M.id==='i_zimmerei');
 await page.evaluate(()=>JMDEBUG.tap(3,4));await page.getByRole('heading',{name:'Timos Zimmerei',exact:true}).waitFor();
 await page.locator('[data-a="buildhouse"][data-k="1"]').click();assert.equal(await page.evaluate(()=>JMDEBUG.S.money),9000);
 await page.getByRole('button',{name:'Schließen',exact:true}).click();
 // Beschleunigt nur das Testtempo, nicht die Bauabschlussfunktion.
 for(let i=0;i<2;i++){await page.evaluate(()=>JMDEBUG.endDay(false));await page.waitForFunction(()=>!JMDEBUG.busy.ui.fade,{timeout:10000});}
 assert.equal(await page.evaluate(()=>JMDEBUG.S.house.level),1);assert.equal(await page.evaluate(()=>JMDEBUG.M.w),18);
 const wood=await page.evaluate(()=>{const d=JMDEBUG;d.setMap('farm',5,8);const entry=Object.entries(d.S.field).find(([,f])=>f.o==='branch');const [x,y]=entry[0].split(',').map(Number);const before=d.S.inv.holz||0;d.doField(x,y);return (d.S.inv.holz||0)-before;});assert.equal(wood,2);
 assert.deepEqual(errors,[]);console.log('Browser Kühlschrank/Küche/Mine/Zimmermann/Holz',viewport,'OK');
 await context.close();}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
