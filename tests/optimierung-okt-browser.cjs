/* Optimierung Oktober 2026 – echte Bildschirmklicks, seriell: 390×844 und 1440×900, jeweils 2D/3D.
   Segmente: osten (Hecke am Bahnhofsweg), tuer (Waldtür ohne Brief → Gewölbe → Mondtor), karte (Tagebuch-Karte mit
   Mine-Ebenen), meteor (Nachtüberraschung auf dem Hof). Fixtures nur vor JMDEBUG.startGame. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||path.join(__dirname,'..','docs','belege','optimierung-okt');fs.mkdirSync(out,{recursive:true});
const ALL=['osten','tuer','karte','meteor'],SEGS=process.argv[2]?process.argv[2].split(','):ALL,base=process.env.BASE_URL||'http://127.0.0.1:8765/';
const FX={osten:{map:'village',px:26,py:14,day:20,min:600},tuer:{map:'forest',px:7,py:4,day:14,min:1200,tuer:''},karte:{map:'farm',px:5,py:8,day:20,min:600,tuer:'fertig',max:7},meteor:{map:'farm',px:5,py:8,day:20,min:600,meteor:true}};
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const report=[];let failed=0;
try{for(const seg of SEGS)for(const vp of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
 if(process.env.VIEWPORT&&vp.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
 const c=await b.newContext({viewport:vp,deviceScaleFactor:vp.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const row={seg,width:vp.width,gfx,shots:[],errors};try{
  await p.goto(base);await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Nacht);
  const fx=FX[seg];
  await p.evaluate(({gfx,fx})=>{const s=JMDEBUG.newState('Optimierung',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.map=fx.map;s.px=fx.px;s.py=fx.py;s.day=fx.day;s.min=fx.min;s.weather=s.tomorrow='sun';s.money=38500;s.flags.letter=s.flags.forestSeen=s.flags.villageSeen=s.flags.caveSeen=true;s.qDone=JM.QUESTS.map(q=>q.id);JM.Ausbau.migrate(s);
   if(fx.tuer!==undefined)s.post.m.tuer.st=fx.tuer;else s.post.m.tuer.st='fertig';if(fx.max)s.mine.max=fx.max;s.daily={day:s.day,goals:[]};s.mail=[];s.mailQ=[];
   if(fx.meteor){s.nacht.ev={k:'meteor',day:s.day,hp:3};s.nacht.last=s.day;}JMDEBUG.startGame(s,false);},{gfx,fx});
  for(let i=0;i<3;i++)await p.locator('#zOut').click();await p.waitForTimeout(800);
  const S=fn=>p.evaluate(fn),shot=async n=>{const f=path.join(out,`${seg}-${n}-${vp.width}-${gfx}.png`);await p.screenshot({path:f});row.shots.push(path.basename(f));return f;};
  async function pixel(x,y,h=.2){return p.evaluate(({x,y,h,gfx})=>gfx==='3d'?JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio):[(x*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{x,y,h,gfx});}
  async function click(x,y,h=.2){const r=await pixel(x,y,h);assert.ok(r[0]>0&&r[0]<vp.width&&r[1]>0&&r[1]<vp.height,'Ziel sichtbar '+JSON.stringify({x,y,r}));assert.equal(await p.evaluate(r=>document.elementFromPoint(...r)?.tagName,r),'CANVAS','frei bei '+JSON.stringify({x,y}));await p.mouse.click(...r);await p.waitForTimeout(300);}
  const map=id=>p.waitForFunction(id=>JMDEBUG.M.id===id&&!JMDEBUG.busy.ui.fade,id,{timeout:25000});
  async function dialogs(){for(let i=0;i<12&&await S(()=>JMDEBUG.busy.ui.dialog);i++){await p.locator('#dlg').click();await p.waitForTimeout(200);}}
  const idle=()=>p.waitForFunction(()=>JMDEBUG.idle&&!JMDEBUG.busy.ui.fade,null,{timeout:25000});
  if(seg==='osten'){
   // Tipp auf die Baumhecke über dem Weg (früher: Figur bleibt mit „Ein schöner alter Baum“ an der Hecke stehen).
   assert.equal(await S(()=>JMDEBUG.M.t[13][31]===JM.T.BAUM),true);await shot('dorf-vorher');await click(31,13,.3);await map('bahnhof');row.hecke='bahnhof';
   await idle();await shot('bahnhof');
   // Rückweg über die zweite Spur: Tipp neben den Kartenrand.
   await p.evaluate(()=>{JMDEBUG.setMap('bahnhof',3,10);});await p.waitForTimeout(500);await click(0,11,.2);await map('village');
   row.zurueck=await S(()=>[Math.round(JMDEBUG.P.x),Math.round(JMDEBUG.P.y)]);
   // Untere Hecke neben der neuen zweiten Spur.
   await p.evaluate(()=>{JMDEBUG.setMap('village',26,15);});await p.waitForTimeout(500);await click(31,16,.3);await map('bahnhof');row.unten=await S(()=>[Math.round(JMDEBUG.P.x),Math.round(JMDEBUG.P.y)]);}
  if(seg==='tuer'){
   await shot('hang');assert.equal(await S(()=>JMDEBUG.M.obj.find(o=>o.act==='post:ev:tuer64').k),'waldtuer');
   await click(5,2,.8);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog,null,{timeout:20000});await p.waitForTimeout(1500);row.text=await p.locator('#dlg').innerText();await dialogs();await map('waldtuer');
   assert.deepEqual(await S(()=>({st:JMDEBUG.S.post.m.tuer.st,self:JMDEBUG.S.post.m.tuer.self})),{st:'offen',self:14},'ohne Brief selbst gefunden');await idle();await shot('gewoelbe-vollmond');
   await click(9,3,1);await map('vollmondwald');row.tor='vollmondwald';await idle();await shot('vollmondwald');}
  if(seg==='karte'){
   await p.getByRole('button',{name:/Tagebuch/}).click();await p.locator('[data-a="tab"][data-k="map"]').click();await p.waitForTimeout(400);
   const ids=await p.$$eval('[data-a="go"]',bs=>bs.map(b=>b.dataset.k));row.ziele=ids;
   for(const id of ['bahnhof','stadt','waldtuer','hoehle','hoehle7'])assert.ok(ids.includes(id),'Karte enthält '+id);assert.ok(!ids.includes('hoehle8'),'keine unerreichte Ebene');
   const btns=await p.$$eval('[data-a="go"]',bs=>bs.map(b=>{const r=b.getBoundingClientRect();return [r.left,r.right,innerWidth];}));for(const [l,r,w] of btns)assert.ok(l>=0&&r<=w+1,'Knopf im Bild');
   await shot('tagebuch-karte');await p.locator('[data-a="go"][data-k="hoehle7"]').scrollIntoViewIfNeeded();await p.locator('[data-a="go"][data-k="hoehle7"]').click();await map('hoehle7');
   row.mine=await S(()=>({id:JMDEBUG.M.id,rocks:JMDEBUG.S.rocks.length,max:JMDEBUG.S.mine.max}));assert.ok(row.mine.rocks>0);await idle();await shot('ebene7');}
  if(seg==='meteor'){
   const o=await S(()=>{const o=JMDEBUG.M.obj.find(o=>o.act==='nacht:meteor');return o&&{x:o.x,y:o.y,k:o.k};});assert.ok(o,'Meteorit auf dem Hof');row.pos=o;
   await p.evaluate(o=>{JMDEBUG.setMap('farm',o.x,o.y+2);},o);await p.waitForTimeout(700);await shot('meteorit');
   const inv0=await S(()=>({m:JMDEBUG.S.inv.meteorit||0,q:JMDEBUG.S.inv.mondquarz||0}));
   for(let i=0;i<3;i++){await click(o.x,o.y,.3);await p.waitForFunction(()=>JMDEBUG.idle||JMDEBUG.busy.ui.dialog,null,{timeout:20000});await p.waitForTimeout(400);if(i===1)await shot('meteorit-risse');}
   await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog,null,{timeout:20000});await dialogs();
   const inv=await S(()=>({m:JMDEBUG.S.inv.meteorit||0,q:JMDEBUG.S.inv.mondquarz||0,ev:JMDEBUG.S.nacht.ev}));assert.deepEqual(inv,{m:inv0.m+1,q:inv0.q+2,ev:null});
   assert.equal(await S(()=>JMDEBUG.M.obj.some(o=>o.act==='nacht:meteor')),false);row.belohnung=inv;}
  assert.deepEqual(errors,[]);row.ok=true;
 }catch(e){failed++;row.ok=false;row.err=String(e&&e.stack||e).slice(0,900);try{row.state=await p.evaluate(()=>({map:JMDEBUG.M.id,P:[JMDEBUG.P.x,JMDEBUG.P.y],ui:JMDEBUG.busy.ui}));await p.screenshot({path:path.join(out,`FEHLER-${seg}-${vp.width}-${gfx}.png`)});}catch{}}
 report.push(row);console.log(JSON.stringify(row));await c.close();}
}finally{fs.writeFileSync(path.join(out,'bericht-'+(process.argv[2]||'alle')+'.json'),JSON.stringify(report,null,1));await Promise.race([b.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failed?1:0);}})();
