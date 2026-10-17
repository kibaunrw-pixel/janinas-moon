/* Etappe 5 – Rahmung: neue Gebäude, Baustelle, Park, Feldstück, Wettbewerbsstand und Trophäenregal liegen sichtbar zwischen den HUD-Leisten. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||path.join(__dirname,'..','docs','belege','etappe5');fs.mkdirSync(out,{recursive:true});
const SCENES={
 baustelle:{map:'stadt',px:31,py:8,stufe:1,bau:2,phase:1,target:[30,6,1],k:'bau2'},
 baeckerei:{map:'stadt',px:31,py:8,stufe:2,target:[30,6,1],k:'baeckerei'},
 blumenladen:{map:'stadt',px:37,py:8,stufe:3,target:[37,6,1],k:'blumenladen'},
 villa:{map:'stadt',px:44,py:8,stufe:4,target:[44,6,1.4],k:'villa'},
 hotel:{map:'stadt',px:40,py:21,stufe:5,target:[40,20,1.6],k:'hotel'},
 park:{map:'stadt',px:30,py:19,stufe:3,target:[27,18,1],k:'parkpavillon'},
 feldstueck:{map:'farm',px:7,py:19,stufe:1,felder:true,target:[7,21,.1]},
 wettbewerb:{map:'stadt',px:15,py:17,stufe:2,day:25,target:[15,16,.6],k:'wettbewerbstand'},
 trophaeen:{map:'haus',px:5,py:4,stufe:2,target:[4,3,.8],k:'trophaeen'}};
(async()=>{const base=process.env.BASE_URL||'http://127.0.0.1:8765/',b=await chromium.launch({channel:'chrome',headless:true}),rows=[];let failed=0;
try{for(const width of [390,1440])for(const gfx of ['2d','3d'])for(const [scene,fx] of Object.entries(SCENES)){
 if(process.env.VIEWPORT&&width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
 const vp={width,height:width===390?844:900},c=await b.newContext({viewport:vp,deviceScaleFactor:width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 try{await p.goto(base);await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Ziele);
 await p.evaluate(({gfx,fx})=>{const s=JMDEBUG.newState('Rahmung',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.day=fx.day||73;s.min=600;s.weather='sun';s.money=38500;s.qDone=JM.QUESTS.map(q=>q.id);s.house={level:2,job:null};
  JM.Ausbau.migrate(s);s.city.plots=s.city.plots.map((p,i)=>({start:1,due:2,ready:true,tenant:['ida','noah','mara'][i],since:3,lastRent:72,rating:5}));for(const id of Object.keys(s.post.m))s.post.m[id].st='fertig';
  const z=s.ziele;z.stufe=fx.stufe;for(const id of Object.keys(JM.Ziele.GEB))if(JM.Ziele.GEB[id].stufe<=fx.stufe)z.betrieb[id]={since:70,last:72};if(fx.bau)z.bau={stufe:fx.bau,start:s.day-fx.phase,due:s.day+3-fx.phase};z.hof.felder=!!fx.felder;
  z.troph=[{id:'stadt2',t:'Stadtstufe 2 · Marktflecken',day:60},{id:'auftrag1',t:'Erster Großauftrag erfüllt',day:66}];s.mail.forEach(m=>m.read=true);s.daily={day:s.day,goals:[]};
  s.map=fx.map;s.px=fx.px;s.py=fx.py;JMDEBUG.startGame(s,false);},{gfx,fx});
 for(let i=0;i<3;i++)await p.locator('#zOut').click();await p.waitForTimeout(1400);
 assert.equal(await p.evaluate(()=>JMDEBUG.M.id),fx.map,'Startkarte '+scene);if(fx.k)assert.ok(await p.evaluate(k=>JMDEBUG.M.obj.some(o=>o.k===k),fx.k),'Motiv vorhanden '+fx.k);
 const t=fx.target,r=await p.evaluate(({t,gfx})=>gfx==='3d'?JM.R3.proj(t[0]+.5,t[1]+.5,t[2]).map(n=>n/devicePixelRatio):[(t[0]*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(t[1]*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{t,gfx});
 const top=await p.locator('#hud').evaluate(e=>e.getBoundingClientRect().bottom),q=await p.locator('#questBox').evaluate(e=>e.hidden?0:e.getBoundingClientRect().bottom),bottom=await p.locator('#bottom').evaluate(e=>e.getBoundingClientRect().top);
 assert.ok(r[0]>8&&r[0]<width-8&&r[1]>Math.max(top,q)&&r[1]<bottom,'wichtiges Motiv frei '+JSON.stringify({scene,width,gfx,r,top,q,bottom}));assert.equal(await p.evaluate(r=>document.elementFromPoint(...r)?.tagName,r),'CANVAS');
 const f=path.join(out,`rahmung-${scene}-${width}-${gfx}.png`);await p.screenshot({path:f});const raf=await p.evaluate(()=>new Promise(done=>{let n=0;const t=performance.now();(function q(){n++;if(performance.now()-t<2000)requestAnimationFrame(q);else done({frames:n,ms:performance.now()-t});})();}));assert.ok(raf.frames>=10);assert.deepEqual(errors,[]);
 rows.push({scene,width,gfx,target:r,top,q,bottom,raf,file:f});console.log('OK Rahmung',scene,width,gfx,raf.frames);
 }catch(e){failed++;rows.push({scene,width,gfx,error:String(e).slice(0,600)});console.error('FEHLER Rahmung',scene,width,gfx,String(e).slice(0,600));try{await p.screenshot({path:path.join(out,`fehler-rahmung-${scene}-${width}-${gfx}.png`)});}catch(_){}}
 await c.close();
}}finally{await b.close();fs.writeFileSync(path.join(out,`report-rahmung-${process.env.VIEWPORT||'alle'}-${process.env.GFX||'alle'}.json`),JSON.stringify(rows,null,2));}
process.exit(failed?1:0);})().catch(e=>{console.error(e);process.exit(1);});
