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
 assert.deepEqual(errors,[]);console.log('Browser Kühlschrank/Küche/Mine',viewport,'OK');
 await context.close();}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
