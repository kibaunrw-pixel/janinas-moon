const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 const context=await browser.newContext({viewport,deviceScaleFactor:1});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await page.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok);
 await page.evaluate(()=>{const d=JMDEBUG,s=d.newState('Auswahltest',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.sound=false;s.music=false;s.min=720;s.flags.letter=true;s.mess=[{map:'farm',x:2,y:7,k:'socke'}];d.startGame(s,false);});
 await page.waitForTimeout(1200);
 const hit=await page.evaluate(()=>{const p=JM.R3.proj(2.5,7.5,.42);return {p,hit:JM.R3.pick(p[0],p[1])};});
 assert.equal(Math.floor(hit.hit.wx),2);assert.equal(Math.floor(hit.hit.wy),7,'Sprite-Mitte muss Sockenkachel statt Gebäude/Boden treffen');
 await page.mouse.click(hit.p[0],hit.p[1]);await page.waitForFunction(()=>JMDEBUG.S.mess.length===0,{timeout:15000});
 assert.equal(await page.evaluate(()=>JMDEBUG.S.stats.tidy),1);assert.equal(await page.evaluate(()=>JMDEBUG.busy.ui.dialog),false);
 const fieldBefore=await page.evaluate(()=>JSON.stringify(JMDEBUG.S.field['4,10']));
 await page.evaluate(()=>{JMDEBUG.setMap('farm',5,11);JMDEBUG.S.mess=[{map:'farm',x:4,y:10,k:'socke'}];const d=JMDEBUG.DOGS[0];d.x=d.tx=4;d.y=d.ty=10;d.timer=999;});await page.waitForTimeout(500);
 const p2=await page.evaluate(()=>JM.R3.proj(4.5,10.5,.42));console.log('Feld-Repro',viewport,await page.evaluate(p=>({pick:JM.R3.pick(p[0],p[1]),screen:p,el:document.elementFromPoint(p[0],p[1])?.outerHTML.slice(0,180),p:{x:JMDEBUG.P.x,y:JMDEBUG.P.y},ui:JMDEBUG.busy}),p2));await page.mouse.dblclick(p2[0],p2[1]);await page.waitForFunction(()=>JMDEBUG.S.mess.length===0).catch(async e=>{console.log('Feld-Fehlerzustand',await page.evaluate(()=>({mess:JMDEBUG.S.mess,stats:JMDEBUG.S.stats,ui:JMDEBUG.busy,p:{x:JMDEBUG.P.x,y:JMDEBUG.P.y,path:JMDEBUG.P.path},hold:JMDEBUG.S.hold})));throw e;});assert.equal(await page.evaluate(()=>JMDEBUG.S.stats.tidy),2);assert.equal(await page.evaluate(()=>JSON.stringify(JMDEBUG.S.field['4,10'])),fieldBefore,'Sammelobjekt darf nicht Feldarbeit starten');
 assert.deepEqual(errors,[]);console.log('3D Socke künstlicher Repro + Tierüberlappung/Feld/Doppeltipp',viewport,'OK');await context.close();
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
