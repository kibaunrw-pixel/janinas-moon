/* Etappe 5 – Ziele, Geld, Spannung: echte Bildschirmklicks, seriell, 390×844 und 1440×900, jeweils 2D/3D.
   Fixtures setzen vor JMDEBUG.startGame nur Ort, Tag, Uhrzeit, Vorräte und den erreichten Spielstand (Stadtstufe, erledigte Missionen).
   Käufe, Bauaufträge, Lieferungen, Wettbewerb und Hofausbau laufen über sichtbare Klicks. Nächte vergehen über JMDEBUG.endDay
   (gleicher Tageswechsel wie das Bett), der Rückweg in die Stadt danach über JMDEBUG.setMap als Ortsfixture. Jeder Strang lädt mittendrin neu. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||path.join(__dirname,'..','docs','belege','etappe5');fs.mkdirSync(out,{recursive:true});
const ALL=['migration','material','stadt','stadt5','hof','ziele','auftrag','wettbewerb'],SEGS=process.argv[2]?process.argv[2].split(','):ALL,base=process.env.BASE_URL||'http://127.0.0.1:8765/';
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const report=[];let failed=0;
try{for(const seg of SEGS)for(const vp of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
 if(process.env.VIEWPORT&&vp.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
 const c=await b.newContext({viewport:vp,deviceScaleFactor:vp.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const row={seg,width:vp.width,gfx,shots:[],errors};try{
  await p.goto(base);await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Ziele);
  const S=(fn,arg)=>p.evaluate(fn,arg),shot=async n=>{const f=path.join(out,`${n}-${vp.width}-${gfx}.png`);await p.screenshot({path:f});row.shots.push(f);return f;};
  // Janinas Stand: 38.500 G, Haus ausgebaut, drei Mieter, alle alten Missionen und Aufgaben erledigt
  const fx={migration:{map:'farm',px:6,py:9},material:{map:'i_zimmerei',px:6,py:6},stadt:{map:'stadt',px:16,py:10,inv:{holz:80,stein:60,weizen:20}},stadt5:{map:'stadt',px:36,py:12,stufe:5},
   hof:{map:'i_zimmerei',px:6,py:6,inv:{eisen:10}},ziele:{map:'haus',px:5,py:4},auftrag:{map:'stadt',px:16,py:14},wettbewerb:{map:'stadt',px:15,py:17,day:25,inv:{kuerbis:2,koi:1,ei:3}}}[seg];
  await p.evaluate(({gfx,fx,seg})=>{const s=JMDEBUG.newState('Janina',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.day=fx.day||73;s.min=600;s.weather='sun';s.money=38500;s.qDone=JM.QUESTS.map(q=>q.id);
   s.house={level:2,job:null};s.maxE=120;s.energy=120;s.hens=[{n:'Erna',c:0,h:8,pet:0},{n:'Berta',c:1,h:6,pet:0},{n:'Lotti',c:0,h:5,pet:0}];s.flags.letter=s.flags.forestSeen=s.flags.villageSeen=s.flags.caveSeen=true;
   for(const id in s.npc)s.npc[id].met=true;s.inv=Object.assign({},fx.inv||{});
   const old=seg==='migration';if(!old){JM.Ausbau.migrate(s);}else{JM.Ausbau.migrate(s);delete s.ziele;s.mail=s.mail.filter(m=>m.ziele!=='start');}
   s.city.plots=s.city.plots.map((p,i)=>({start:10+i,due:13+i,ready:true,tenant:['ida','noah','mara'][i],since:14+i,lastRent:72,rating:5}));for(const id of Object.keys(s.post.m))s.post.m[id].st='fertig';
   if(!old){if(fx.stufe){s.ziele.stufe=fx.stufe;for(const id of Object.keys(JM.Ziele.GEB))if(JM.Ziele.GEB[id].stufe<=fx.stufe)s.ziele.betrieb[id]={since:70,last:72};}s.mail.forEach(m=>m.read=true);}
   s.daily={day:s.day,goals:[]};s.map=fx.map;s.px=fx.px;s.py=fx.py;
   if(old){localStorage.setItem('janinas-moon-v2',JSON.stringify(s));return;}JMDEBUG.startGame(s,false);},{gfx,fx,seg});
  async function reload(){await p.reload();await p.getByRole('button',{name:'Weiterspielen',exact:true}).click();await p.waitForFunction(()=>JMDEBUG.S&&!JMDEBUG.busy.ui.fade);await p.waitForTimeout(800);}
  if(seg==='migration')await reload();
  row.start=await S(()=>({map:JMDEBUG.M.id,x:JMDEBUG.P.x,y:JMDEBUG.P.y,objs:JMDEBUG.M.obj.map(o=>o.k+':'+o.act).slice(0,12)}));console.log('START',JSON.stringify(row.start));
  for(let i=0;i<3;i++)await p.locator('#zOut').click();await p.waitForTimeout(800);
  async function pixel(x,y,h=.2){return p.evaluate(({x,y,h,gfx})=>gfx==='3d'?JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio):[(x*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{x,y,h,gfx});}
  async function click(x,y,h=.2,wait=true){const r=await pixel(x,y,h);assert.ok(r[0]>0&&r[0]<vp.width&&r[1]>0&&r[1]<vp.height,'Ziel sichtbar '+JSON.stringify({x,y,r}));assert.equal(await p.evaluate(r=>document.elementFromPoint(...r)?.tagName,r),'CANVAS','Ziel nicht vom HUD verdeckt '+JSON.stringify({x,y,r}));await p.mouse.click(...r);
   if(wait){await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog||JMDEBUG.busy.ui.panel,null,{timeout:20000});await p.waitForTimeout(400);}}
  async function dialogs(){for(let i=0;i<16&&await S(()=>JMDEBUG.busy.ui.dialog);i++){await p.locator('#dlg').click();await p.waitForTimeout(250);}assert.equal(await S(()=>JMDEBUG.busy.ui.dialog),false);}
  async function btn(a){const l=p.locator(`[data-a="${a}"]`);await l.waitFor();assert.equal(await l.isDisabled(),false,'Knopf aktiv: '+a);const box=await l.boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=vp.width+1,'Knopf im Bild: '+a);await l.click();await p.waitForTimeout(450);}
  async function closePanel(){if(await S(()=>JMDEBUG.busy.ui.panel)){await p.locator('[data-a="close"]').last().click();await p.waitForTimeout(300);}}
  async function night(map,x,y){await S(()=>JMDEBUG.endDay());await p.waitForFunction(()=>!JMDEBUG.busy.ui.fade,null,{timeout:15000});await p.waitForTimeout(600);await dialogs();if(map)await S(({map,x,y})=>JMDEBUG.setMap(map,x,y),{map,x,y});await p.waitForTimeout(900);}
  const obj=(k)=>S(k=>{const o=JMDEBUG.M.obj.find(o=>o.k===k||o.act===k);return o&&{x:o.x,y:o.y,w:o.w||1,h:o.h||1};},k);
  // Freies, unbearbeitetes Beet (ohne Unkraut/Stein) suchen; bei Gold auch die beiden Nachbarn. Spielerin stellt sich darüber (Ortsfixture).
  async function freiesBeet(y0,y1,drei){const t=await S(({y0,y1,drei})=>{const M=JMDEBUG.M,S=JMDEBUG.S,ok=(x,y)=>M.t[y]&&M.t[y][x]===JM.T.FELD&&!(S.field[x+','+y]&&(S.field[x+','+y].t||S.field[x+','+y].o||S.field[x+','+y].c));
   for(let y=y0;y<=y1;y++)for(let x=4;x<=10;x++)if(ok(x,y)&&(!drei||ok(x-1,y)&&ok(x+1,y))&&JM.WALK.has(M.t[y-1][x]))return [x,y];return null;},{y0,y1,drei});assert.ok(t,'freies Beet');await S(([x,y])=>JMDEBUG.setMap('farm',x,y-1),t);await p.waitForTimeout(900);return t;}
  async function clickObj(k,hh){const o=await obj(k);assert.ok(o,'Objekt '+k);await click(o.x+Math.floor((o.w-1)/2),o.y+o.h-1,hh??(o.h>1?1:.6));}

  if(seg==='migration'){
   assert.equal(await S(()=>JMDEBUG.S.money),38500);assert.deepEqual(await S(()=>JMDEBUG.S.city.plots.map(p=>p.tenant)),['ida','noah','mara']);
   assert.match(await S(()=>document.querySelector('#quest').innerText),/Lindenstadt wächst|Bäckerei/);await shot('migration-hinweis');
   const mb=await obj('mail');await click(mb.x,mb.y,.6);await p.getByRole('heading',{name:'Briefkasten'}).waitFor();assert.match(await S(()=>document.querySelector('#panel').innerText),/Lindenstadt will wachsen/);await shot('migration-brief');
   await p.locator('[data-a="read"]').first().click();await p.waitForTimeout(500);assert.match(await S(()=>document.body.innerText),/Bäckerei|Timo/);await shot('migration-brief-offen');
   row.result={geld:38500,brief:true,hinweis:true};
  }
  if(seg==='material'){
   await clickObj('counter');await p.getByRole('heading',{name:'Timos Zimmerei'}).waitFor();await shot('material-timo');
   await btn('buy"][data-k="stein"][data-n="10');assert.equal(await S(()=>JMDEBUG.S.inv.stein),10);assert.equal(await S(()=>JMDEBUG.S.money),38500-300);
   await reload();assert.equal(await S(()=>JMDEBUG.S.inv.stein),10);assert.equal(await S(()=>JM.Ziele.restHeute(JMDEBUG.S,'stein')),50,'Tageslimit nach Reload');
   await clickObj('counter');await p.getByRole('heading',{name:'Timos Zimmerei'}).waitFor();for(let i=0;i<5;i++)await btn('buy"][data-k="stein"][data-n="10');
   assert.equal(await S(()=>JMDEBUG.S.inv.stein),60);assert.equal(await p.locator('[data-a="buy"][data-k="stein"][data-n="1"]').isDisabled(),true,'Tageslimit erreicht');await shot('material-limit');
   await btn('buy"][data-k="holz"][data-n="10');assert.equal(await S(()=>JMDEBUG.S.inv.holz),10);row.result={stein:60,holz:10,geld:await S(()=>JMDEBUG.S.money)};
  }
  if(seg==='stadt'){
   await shot('stadt-stufe1');await clickObj('stadtplan');await p.getByRole('heading',{name:'Stadtentwicklung'}).waitFor();await shot('stadt-plan');
   await btn('stufe-bauen');await p.waitForTimeout(800);assert.equal(await S(()=>JMDEBUG.S.money),38500-12000);assert.equal(await S(()=>JMDEBUG.S.ziele.bau.stufe),2);
   assert.ok(await obj('bau1'),'Baustelle Phase 1 sichtbar');await closePanel();await p.waitForTimeout(500);
   const bpos=[31,8];await S(({x,y})=>JMDEBUG.setMap('stadt',x,y),{x:bpos[0],y:bpos[1]});await p.waitForTimeout(900);await shot('stadt-bau1');
   await reload();assert.equal(await S(()=>JMDEBUG.S.ziele.bau.stufe),2);assert.ok(await obj('bau1'));
   await night('stadt',...bpos);assert.ok(await obj('bau2'));await shot('stadt-bau2');await night('stadt',...bpos);assert.ok(await obj('bau3'));await shot('stadt-bau3');
   await night('stadt',...bpos);assert.equal(await S(()=>JMDEBUG.S.ziele.stufe),2);assert.ok(await obj('baeckerei'));await S(()=>{JMDEBUG.S.min=600;});await p.waitForTimeout(1200);await shot('stadt-baeckerei');
   await clickObj('baeckerei');await p.getByRole('heading',{name:'Friedas Bäckerei'}).waitFor();await shot('stadt-baeckerei-panel');const m0=await S(()=>JMDEBUG.S.money);await btn('ankauf-baeckerei');
   assert.equal(await S(()=>JMDEBUG.S.money),m0+20*50);assert.equal(await S(()=>JMDEBUG.S.inv.weizen||0),0);await closePanel();
   row.result={stufe:2,ankauf:1000};
  }
  if(seg==='stadt5'){
   await shot('stadt5-ost');for(const [k,hd] of [['hotel','Hotel Lindenhof'],['blumenladen','Lottes Blumenladen'],['villa','Villa am Lindenhang']]){const o=await obj(k);await S(({x,y})=>JMDEBUG.setMap('stadt',x,y),{x:o.x+2,y:o.y+o.h+(k==='villa'?1:0)});/* vor der Villa steht seit dem Feinschliff ein Zaun mit Tor */await p.waitForTimeout(900);await shot('stadt5-'+k);await clickObj(k);await p.getByRole('heading',{name:hd}).waitFor();await shot('stadt5-'+k+'-panel');await closePanel();}
   const pv=await obj('parkpavillon');await S(({x,y})=>JMDEBUG.setMap('stadt',x,y),{x:pv.x+3,y:pv.y+2});await p.waitForTimeout(900);await shot('stadt5-park');
   await reload();assert.equal(await S(()=>JMDEBUG.S.ziele.stufe),5);row.result={gebaeude:4,park:true};
  }
  if(seg==='hof'){
   await clickObj('counter');await p.getByRole('heading',{name:'Timos Zimmerei'}).waitFor();await btn('hofausbau');await p.getByRole('heading',{name:'Hof ausbauen bei Timo'}).waitFor();await shot('hof-panel');
   await btn('hof-silber');assert.equal(await S(()=>JMDEBUG.S.ziele.hof.job.k),'silber');assert.equal(await S(()=>JMDEBUG.S.money),38500-8000);await reload();assert.equal(await S(()=>JMDEBUG.S.ziele.hof.job.k),'silber');
   await night('farm',6,9);assert.equal(await S(()=>JMDEBUG.S.ziele.hof.silber),true);
   // Gießen ohne Energie: Beet umgraben (1 Energie), dann gießen (0)
   await S(()=>{JMDEBUG.S.hold='auto';JMDEBUG.S.min=600;});const [sx,sy]=await freiesBeet(11,19);const e0=await S(()=>JMDEBUG.S.energy);await click(sx,sy,.1,false);await p.waitForFunction(k=>JMDEBUG.S.field[k]?.t,sx+','+sy,{timeout:15000});await p.waitForTimeout(500);
   assert.equal(await S(()=>JMDEBUG.S.energy),e0-1,'Umgraben kostet 1');await click(sx,sy,.1,false);await p.waitForFunction(k=>JMDEBUG.S.field[k]?.w,sx+','+sy,{timeout:15000});await p.waitForTimeout(400);assert.equal(await S(()=>JMDEBUG.S.energy),e0-1,'Gießen kostet nichts');
   // Neues Feldstück und Goldwerkzeug über Timo beauftragen
   await S(()=>{const s=JMDEBUG.S;s.inv.holz=40;s.inv.stein=30;s.inv.silber=10;s.inv.mondquarz=3;s.money+=80000;});await S(()=>JMDEBUG.setMap('i_zimmerei',6,6));await p.waitForTimeout(800);
   await clickObj('counter');await btn('hofausbau');await btn('hof-felder');await night('farm',7,19);await night('farm',7,19);assert.equal(await S(()=>JMDEBUG.M.t[21][7]===JM.T.FELD),true,'neues Beet');await shot('hof-feldstueck');
   {const [fx2,fy2]=await freiesBeet(20,22);await click(fx2,fy2,.1,false);await p.waitForFunction(k=>JMDEBUG.S.field[k]?.t,fx2+','+fy2,{timeout:15000});}
   await S(()=>{JMDEBUG.S.min=600;JMDEBUG.setMap('i_zimmerei',6,6);});await p.waitForTimeout(800);await clickObj('counter');await btn('hofausbau');await btn('hof-gold');await night('farm',6,14);await night('farm',6,14);
   {await S(()=>{JMDEBUG.S.min=600;});const [gx,gy]=await freiesBeet(11,22,true);await click(gx,gy,.1,false);await p.waitForFunction(k=>JMDEBUG.S.field[k]?.t,gx+','+gy,{timeout:15000});await p.waitForTimeout(500);assert.equal(await S(([x,y])=>!!(JMDEBUG.S.field[(x-1)+','+y]?.t&&JMDEBUG.S.field[(x+1)+','+y]?.t),[gx,gy]),true,'Gold: drei Beete pro Schlag');}await shot('hof-gold');
   row.result={silber:true,felder:true,gold:true};
  }
  if(seg==='ziele'){
   const tr=await obj('trophaeen');await click(tr.x,tr.y,.8);await p.getByRole('heading',{name:'Trophäenwand'}).waitFor();await shot('ziele-trophaeenregal');await closePanel();
   await p.locator('#bMenu').click();await p.waitForTimeout(500);await p.locator('[data-a="tab"][data-k="ziele"]').first().click();await p.waitForTimeout(500);
   const txt=await S(()=>document.querySelector('#panel').innerText);assert.match(txt,/Stadt-Sterne/);assert.match(txt,/Hof-Sterne/);assert.match(txt,/Nächstes Ziel/);assert.match(txt,/Trophäenwand/);assert.match(txt,/38\.500 \/ 12\.000 G/);await shot('ziele-tagebuch');
   await reload();row.result={sterne:true,trophaeen:true};
  }
  if(seg==='auftrag'){
   const a=await S(()=>JMDEBUG.S.ziele.auftrag);assert.equal(a.st,'offen');await S(({k,n})=>{JMDEBUG.S.inv[k==='fisch'?'forelle':k]=n;},{k:a.k,n:a.n});
   await clickObj('auftragstafel');await p.getByRole('heading',{name:/Großauftrag/}).waitFor();await shot('auftrag-panel');
   await S(({k,n})=>{JMDEBUG.S.inv[k==='fisch'?'forelle':k]=3;},{k:a.k});await p.locator('[data-a="close"]').last().click();await p.waitForTimeout(300);await clickObj('auftragstafel');await btn('auftrag-liefern');assert.equal(await S(()=>JMDEBUG.S.ziele.auftrag.got),3);
   await reload();assert.equal(await S(()=>JMDEBUG.S.ziele.auftrag.got),3);await S(({k,n})=>{JMDEBUG.S.inv[k==='fisch'?'forelle':k]=n;},{k:a.k,n:a.n-3});const m0=await S(()=>JMDEBUG.S.money);
   await clickObj('auftragstafel');await btn('auftrag-liefern');await p.waitForTimeout(400);assert.equal(await S(()=>JMDEBUG.S.ziele.auftrag.st),'fertig');assert.equal(await S(()=>JMDEBUG.S.money),m0+a.rew);await shot('auftrag-erfuellt');row.result={lohn:a.rew};
  }
  if(seg==='wettbewerb'){
   assert.match(await S(()=>document.querySelector('#quest').innerText),/Erntewettbewerb/);await shot('wettbewerb-stand');await clickObj('wettbewerbstand');await p.getByRole('heading',{name:'Erntewettbewerb mit Greta'}).waitFor();
   await btn('wett-koi');await reload();assert.deepEqual(await S(()=>JMDEBUG.S.ziele.wett.items),['koi']);await clickObj('wettbewerbstand');await btn('wett-kuerbis');await btn('wett-kuerbis');await shot('wettbewerb-panel');
   const m0=await S(()=>JMDEBUG.S.money);await btn('wett-bewerten');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await p.waitForFunction(()=>/Punkte/.test(document.querySelector('#dlgT').textContent),null,{timeout:10000});await shot('wettbewerb-greta');await dialogs();
   assert.equal(await S(()=>JMDEBUG.S.money),m0+3000);assert.ok(await S(()=>JM.Ziele.trophaeen(JMDEBUG.S).some(t=>/Erntewettbewerb/.test(t.t))));row.result={punkte:1120,preis:3000};
  }
  const raf=await p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now();(function f(){n++;if(performance.now()-t<2000)requestAnimationFrame(f);else r({frames:n,ms:performance.now()-t});})();}));row.raf=raf;if(raf.frames<10)throw Error('rAF nahezu angehalten: '+JSON.stringify(raf));assert.deepEqual(errors,[]);
 }catch(e){failed++;row.error=String(e&&e.stack||e).slice(0,1500);console.error('FEHLER',seg,vp.width,gfx,row.error);try{await p.screenshot({path:path.join(out,`fehler-${seg}-${vp.width}-${gfx}.png`)});}catch(_){}}
 report.push(row);console.log(JSON.stringify({seg,width:vp.width,gfx,ok:!row.error,raf:row.raf,result:row.result}));await c.close();
}}finally{await b.close();fs.writeFileSync(path.join(out,`report-browser-${process.env.VIEWPORT||'alle'}-${process.env.GFX||'alle'}-${process.argv[2]||'alle'}.json`),JSON.stringify(report,null,2));}
if(failed)process.exitCode=1;else console.log('OK etappe5-browser');process.exit(process.exitCode||0);})().catch(e=>{console.error(e);process.exit(1);});
