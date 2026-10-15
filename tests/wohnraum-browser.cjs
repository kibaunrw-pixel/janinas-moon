/* Bereits bezahlte synthetische Stände; Treppen/Wege ausschließlich Bildschirm-Pointer. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-stadt';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});try{for(const viewport of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d'])for(const level of [1,2]){
 if(process.env.VIEWPORT&&viewport.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX||process.env.LEVEL&&level!==+process.env.LEVEL)continue;
 const c=await b.newContext({viewport,deviceScaleFactor:viewport.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto('http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok);
 await p.evaluate(({gfx,level})=>{const d=JMDEBUG,s=d.newState('Synthetischer Altbau',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.flags.letter=true;s.house={level,job:null};s.money=777;s.maxE=100+level*10;s.inv={ei:4,holz:3};s.fridge={ei:6};s.map='farm';s.px=5;s.py=8;d.startGame(s,false);}, {gfx,level});
 for(let i=0;i<3;i++)await p.locator('#zOut').click();
 async function click(x,y,h=.05){await p.waitForTimeout(500);const pixel=await p.evaluate(({x,y,h,gfx})=>{if(gfx==='3d'){const r=JM.R3.proj(x+.5,y+.5,h),cv=document.querySelector('#game'),d=devicePixelRatio;return [r[0]/d,r[1]/d];}return [(x*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale];},{x,y,h,gfx});assert.ok(pixel[0]>0&&pixel[0]<viewport.width&&pixel[1]>80&&pixel[1]<viewport.height-100,'sichtbarer Pointer '+JSON.stringify({x,y,pixel,gfx}));const hit=await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,pixel);assert.equal(hit,'CANVAS');await p.mouse.click(...pixel);}
 async function walk(x,y){await click(x,y);try{await p.waitForFunction(({x,y})=>Math.abs(JMDEBUG.P.x-x)<.1&&Math.abs(JMDEBUG.P.y-y)<.1&&JMDEBUG.idle,{x,y},{timeout:8000});}catch(e){console.error('Wegproblem',x,y,await p.evaluate(()=>({map:JMDEBUG.M.id,p:[JMDEBUG.P.x,JMDEBUG.P.y],ui:JMDEBUG.busy.ui,visible:document.visibilityState})));await p.screenshot({path:path.join(out,'wohnraum-wegproblem.png')});throw e;}}
 await click(5,5,1);await p.waitForFunction(()=>JMDEBUG.M.id==='haus');await p.waitForFunction(()=>!JMDEBUG.busy.ui.fade);
 await walk(10,7);await walk(14,6);await click(16,4,.65);await p.waitForFunction(()=>JMDEBUG.M.id==='haus_oben');await p.waitForFunction(()=>!JMDEBUG.busy.ui.fade);
 await walk(5,8);await walk(9,8);if(level===2){await walk(12,7);await walk(15,7);await walk(17,6);}
 await p.screenshot({path:path.join(out,`wohnetage-stufe${level}-${viewport.width}-${gfx}.png`)});
 // Aktive Hof-Aufgabe bleibt bestehen: Wegweiser muss auf der neuen Karte jeden Frame laufen.
 const before=await p.evaluate(()=>({money:JMDEBUG.S.money,e:JMDEBUG.S.maxE,inv:JMDEBUG.S.inv,fridge:JMDEBUG.S.fridge}));assert.deepEqual(before,{money:777,e:100+level*10,inv:{ei:4,holz:3},fridge:{ei:6}});
 if(level===2){await walk(15,7);await walk(12,7);}await walk(9,8);await walk(5,8);await click(2,8,.6);await p.waitForFunction(()=>JMDEBUG.M.id==='haus');await p.waitForFunction(()=>!JMDEBUG.busy.ui.fade);
 await walk(14,6);await walk(10,8);await walk(7,9);await click(7,10);await p.waitForFunction(()=>JMDEBUG.M.id==='farm');assert.deepEqual(errors,[]);
 console.log('Altbau Haus→Treppe→Wohnetage→Hof',viewport.width,gfx,'Stufe',level,'OK');await c.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
