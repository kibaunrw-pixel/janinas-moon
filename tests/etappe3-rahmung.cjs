/* Café-Rahmung: echter Türeintritt, Zoomknöpfe, alle Möbel auch mit drittem Tisch.
   Fixture: fertiges Café mit allen freigeschalteten Möbeln und echten Vitrinenwaren.
   Keine Teleports nach dem Start, keine Änderungen an Wegen oder Sitzplätzen. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/profiles/coder/cache/scratch/e3-rahmung';
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
try{for(const width of [390,1440])for(const gfx of ['2d','3d']){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:width===390?2:1});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Cafe);
 await p.evaluate(gfx=>{const s=JMDEBUG.newState('Rahmung',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);
  s.gfx=gfx;s.sound=s.music=false;s.map='village';s.px=6;s.py=15;s.day=14;s.min=600;s.weather='sun';s.qDone=JM.QUESTS.map(q=>q.id);
  JM.Ausbau.migrate(s);s.cafe.st='fertig';s.cafe.unlock={blumen:14,tisch3:14,kuchen:14};s.cafe.vit={mondkuchen:2,erdbeere:3,nudeln:2};s.cafe.sent.idee=1;
  JMDEBUG.startGame(s,false);},gfx);
 await p.waitForTimeout(1600);
 await p.screenshot({path:path.join(out,`cafe-eingang-${width}-${gfx}.png`)});
 const pixel=await p.evaluate(gfx=>gfx==='3d'?JM.R3.proj(6.5,13.5,.9).map(n=>n/devicePixelRatio):[(6*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(13*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],gfx);
 await p.mouse.click(...pixel);await p.waitForFunction(()=>JMDEBUG.M.id==='i_cafe'&&!JMDEBUG.busy.ui.fade);
 const before=await p.evaluate(()=>JSON.stringify({t:JMDEBUG.M.t,obj:JMDEBUG.M.obj,decor:JMDEBUG.M.decor,seats:JM.Cafe.SEATS}));
 for(const zoom of ['normal','nah','weit']){
  if(zoom!=='normal')for(let i=0;i<8;i++)await p.locator(zoom==='nah'?'#zIn':'#zOut').click();
  await p.waitForTimeout(1400);
  const points=await p.evaluate(gfx=>{const d=JMDEBUG,ps=[];
   if(gfx==='3d'){for(const x of [.9,13.1])for(const y of [3.1,8.9])for(const h of [0,2.3])ps.push(JM.R3.proj(x,y,h).map(n=>n/devicePixelRatio));}
   else for(const x of [0,14])for(const y of [2,10])ps.push([(x*16-Math.round(d.cam.x))*d.scale,(y*16-Math.round(d.cam.y))*d.scale]);
   return ps.map(([x,y])=>({x,y,tag:document.elementFromPoint(x,y)?.tagName}));},gfx);
  for(const r of points){assert.ok(r.x>8&&r.x<width-8&&r.y>120&&r.y<(width===390?730:790),'Raum vollständig im freien Bereich '+JSON.stringify({width,gfx,zoom,r}));assert.equal(r.tag,'CANVAS','kein HUD über dem Raum');}
  assert.equal(await p.evaluate(()=>JSON.stringify({t:JMDEBUG.M.t,obj:JMDEBUG.M.obj,decor:JMDEBUG.M.decor,seats:JM.Cafe.SEATS})),before,'Zoom ändert weder Wege noch Möbel/Sitzplätze');
  if(zoom==='nah')await p.screenshot({path:path.join(out,`cafe-drei-tische-${width}-${gfx}.png`)});
  report.push({width,gfx,zoom,points});
 }
 assert.deepEqual(errors,[]);await context.close();console.log('OK Rahmung',width,gfx);
}}finally{await browser.close();fs.writeFileSync(path.join(out,'report-rahmung.json'),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
