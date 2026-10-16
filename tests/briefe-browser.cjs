/* Briefkasten-Browserwege (Etappe 1). Echte Bildschirmklicks in 390×844 (DPR 2) und 1440×900, 2D und 3D.
   Aufruf: node tests/briefe-browser.cjs <schatz|haus7|brunnen>  (ohne Argument: alle drei).
   Fixture setzt nur Startort (Bett im Haus), Tageszeit, Vorräte und den Missionsstand VOR der Nacht.
   Brief kommt über eine echte Nacht, Lesen am echten Briefkasten, Wege/Reisen/Bau/Reparatur per Pointer.
   Einzige Zeit-Fixture: Brunnen-Mission setzt nach dem Lesen die Uhr auf 23:05 (statt 17 Spielstunden zu warten). */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-briefe';fs.mkdirSync(out,{recursive:true});
const SEGS=process.argv[2]?[process.argv[2]]:['schatz','haus7','brunnen'];
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const report=[];try{for(const seg of SEGS)for(const viewport of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
if(process.env.VIEWPORT&&viewport.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
const c=await b.newContext({viewport,deviceScaleFactor:viewport.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await p.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Post);
const tag=`${seg}-${viewport.width}-${gfx}`;
async function shot(name){const f=path.join(out,`${name}-${viewport.width}-${gfx}.png`);await p.waitForTimeout(500);await p.screenshot({path:f});return f;}
async function click(x,y,h=.05,actorOk=false){await p.waitForTimeout(450);
 /* Hunde/Figuren können vor einem Objekt stehen und den Klick abfangen (beobachtet: Pudel vor dem Briefkasten → Hundedialog).
    Dann wie eine Spielerin kurz warten, bis das Ziel frei ist; keine Teleports, keine verdeckten HUDs. */
 if(!actorOk)for(let i=0;i<60;i++){const blocker=await p.evaluate(({x,y,h,gfx})=>{const d=JMDEBUG,actors=[...Object.values(JM.ENG.NPCA).filter(a=>a.vis),...(d.RA.vis?[d.RA]:[]),...d.DOGS];
  if(gfx==='3d'){const r=JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio),hit=JM.R3.pick(...r);return hit&&hit.actor&&hit.actor!=='P'?String(hit.actor):null;}
  const a=actors.find(a=>Math.abs(x-a.x)<1.2&&y+.5>a.y-1.3&&y+.5<a.y+1.4);return a?(a.id||a.name||'figur'):null;},{x,y,h,gfx});if(!blocker)break;if(i===59)throw Error('Ziel dauerhaft verdeckt von '+blocker+' '+JSON.stringify({x,y}));await p.waitForTimeout(500);}const pixel=await p.evaluate(({x,y,h,gfx})=>gfx==='3d'?JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio):[(x*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{x,y,h,gfx});
 assert.ok(pixel[0]>0&&pixel[0]<viewport.width&&pixel[1]>0&&pixel[1]<viewport.height,'sichtbares Ziel '+JSON.stringify({x,y,pixel,gfx}));assert.equal(await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,pixel),'CANVAS','freies Weltziel '+JSON.stringify({x,y,pixel}));await p.mouse.click(...pixel);}
async function walk(x,y){await p.waitForTimeout(500);
 for(let attempt=0;attempt<12;attempt++){const target=await p.evaluate(({x,y,gfx})=>{const d=JMDEBUG,m=d.M,actors=[...Object.values(JM.ENG.NPCA).filter(a=>a.vis),...(d.RA.vis?[d.RA]:[]),...d.DOGS];
  for(const [dx,dy] of [[0,0],[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]]){const tx=x+dx,ty=y+dy;if(!JM.WALK.has(m.t[ty]?.[tx])||m.exits.some(e=>e.x===tx&&e.y===ty)||(m.id==='farm'&&JM.ENG.isField(tx,ty))||(d.S.forage[m.id]||[]).some(f=>f.x===tx&&f.y===ty)||actors.some(a=>Math.abs(tx-a.x)<1&&ty+.5>a.y-1.1&&ty+.5<a.y+1.2))continue;
   const r=gfx==='3d'?JM.R3.proj(tx+.5,ty+.5,.01).map(n=>n/devicePixelRatio):[(tx*16+8-Math.round(d.cam.x))*d.scale,(ty*16+8-Math.round(d.cam.y))*d.scale];if(r[0]<1||r[0]>=innerWidth-1||r[1]<1||r[1]>=innerHeight-1||document.elementFromPoint(r[0],r[1])?.tagName!=='CANVAS')continue;
   if(gfx==='3d'){const hit=JM.R3.pick(...r);if(!hit||hit.collectible||(hit.actor&&hit.actor!=='P')||Math.floor(hit.wx)!==tx||Math.floor(hit.wy)!==ty)continue;}return {x:tx,y:ty,r};}return null;},{x,y,gfx});
  if(!target){await p.waitForTimeout(400);continue;}await p.mouse.click(...target.r);
  try{await p.waitForFunction(({x,y})=>Math.abs(JMDEBUG.P.x-x)<.1&&Math.abs(JMDEBUG.P.y-y)<.1&&JMDEBUG.idle,target,{timeout:10000});return;}catch(e){if(attempt<4&&await S(()=>JMDEBUG.idle&&!JMDEBUG.busy.ui.panel&&!JMDEBUG.busy.ui.dialog)){console.error('Wegversuch wiederholt',tag,target);continue;}console.error('WEG',tag,target,await p.evaluate(()=>({map:JMDEBUG.M.id,p:[JMDEBUG.P.x,JMDEBUG.P.y],busy:JSON.stringify(JMDEBUG.busy),dlg:document.querySelector('#dlg')?.innerText})));await shot('wegproblem-'+seg);throw e;}}
 throw Error('kein sichtbarer freier Boden nahe '+x+','+y+' '+tag);}
async function map(id){await p.waitForFunction(id=>JMDEBUG.M.id===id&&!JMDEBUG.busy.ui.fade,id,{timeout:20000});await alive(id);}
// Spielschleife läuft nach jedem Kartenwechsel weiter (Animationszeit und Uhr steigen), auch mit aktivem Missionsziel.
async function alive(id){await p.bringToFront();const a=await p.evaluate(()=>[JM.ENG.gameT,JMDEBUG.S.min]);await p.waitForTimeout(700);const z=await p.evaluate(()=>[JM.ENG.gameT,JMDEBUG.S.min,JMDEBUG.M.id]);assert.ok(z[0]>a[0],'Animation läuft auf '+id);assert.deepEqual(errors,[],'keine Fehler auf '+id);}
async function dialogs(){for(let i=0;i<12&&await p.evaluate(()=>JMDEBUG.busy.ui.dialog);i++){await p.locator('#dlg').click();await p.waitForTimeout(250);}assert.equal(await p.evaluate(()=>JMDEBUG.busy.ui.dialog),false);}
async function close(){await p.getByRole('button',{name:'Schließen',exact:true}).click();}
const S=expr=>p.evaluate(expr);
async function sleep(){await click(11,3,.5);await p.getByRole('button',{name:'Gute Nacht',exact:true}).click();await p.waitForFunction(()=>!JMDEBUG.busy.ui.fade,null,{timeout:20000});await map('haus');
 /* Fixture: zufällige Tagesziele leeren, damit die Geldbilanz nur Miete/Missionen enthält */await S(()=>{JMDEBUG.S.daily.goals=[];});}
async function toFarm(){await walk(7,9);await click(7,10);await map('farm');}
async function diag(what){const d=await p.evaluate(()=>{const r=JMDEBUG.M.id;return {map:r,p:[JMDEBUG.P.x,JMDEBUG.P.y],idle:JMDEBUG.idle,busy:JSON.stringify(JMDEBUG.busy),min:JMDEBUG.S.min,dlg:document.querySelector('#dlg')?.innerText,panel:document.querySelector('#panel')?.innerText?.slice(0,200),notes:[...document.querySelectorAll('.note,#note,.toast')].map(n=>n.innerText).join('|')};});console.error('DIAG',what,tag,JSON.stringify(d));await shot('diag-'+what+'-'+seg);}
async function toMailbox(){await walk(6,8);await walk(7,8);await click(7,7,.6);try{await p.getByRole('heading',{name:'Briefkasten',exact:true}).waitFor({timeout:8000});}catch(e){await diag('briefkasten');throw e;}}
async function readLetter(title){const row=p.locator('[data-a="read"]',{hasText:title}).first();await row.scrollIntoViewIfNeeded();await row.click();await p.getByRole('heading',{name:title,exact:true}).waitFor();}
async function backHome(){await walk(9,8);await walk(7,8);await click(5,5,1);await map('haus');}
async function farmToVillage(){await walk(11,8);await walk(13,8);await walk(13,12);await walk(13,15);await walk(17,15);await walk(22,15);await click(27,15);await map('village');}
async function villageToFarm(){await walk(6,9);await walk(2,9);await click(0,9);await map('farm');await walk(21,15);await walk(17,15);await walk(13,15);await walk(13,11);await walk(13,8);await walk(9,8);}
async function villageSouthEast(){await walk(5,9);await walk(10,10);await walk(13,14);await walk(16,14);await walk(16,18);await walk(17,21);await walk(21,22);await walk(25,21);}
async function toCity(){await walk(29,21);await walk(29,17);await walk(29,14);await walk(30,14);await click(31,14);await map('bahnhof');await walk(8,9);await click(11,8,.7);await p.locator('[data-a="ride"]').click();await map('stadt');}
async function cityToHouse7(){await walk(12,20);await walk(9,20);await walk(7,20);}
async function cityHome(){await walk(10,20);await walk(13,18);await click(14,19,.7);await p.locator('[data-a="ride"]').click();await map('bahnhof');await walk(4,9);await click(0,9);await map('village');await walk(29,18);await walk(29,21);await walk(25,21);await walk(21,22);await walk(17,21);await walk(16,17);await walk(16,14);await walk(13,14);await walk(10,10);await villageToFarm();await backHome();}
async function mailCheck(minNew){const st=await S(()=>({n:JMDEBUG.S.mail.filter(m=>!m.read).length,day:JMDEBUG.S.day}));return st;}
async function reload(){await p.reload();await p.getByRole('button',{name:'Weiterspielen',exact:true}).click();await p.waitForFunction(()=>JMDEBUG.S&&!JMDEBUG.busy.ui.fade);await alive('reload');}

const before=await p.evaluate(({gfx,seg})=>{const s=JMDEBUG.newState('Briefe',[{name:'A',fell:'weiss'},{name:'B',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.flags.letter=true;s.flags.caveSeen=true;s.rene.met=true;s.rene.bf=9;s.rene.cudToday=2;s.qDone=JM.QUESTS.map(q=>q.id);
 s.map='haus';s.px=10;s.py=5;s.day=9;s.min=1200;s.money=5000;s.inv={holz:40,stein:40,kupfer:10};s.hintsCollapsed=false;s.daily={day:9,goals:[]};
 // Vorhandene gelesene Altpost: Postfach muss trotz vieler Briefe bedienbar bleiben.
 s.mail=Array.from({length:18},(_,i)=>({from:'rosa',t:'Alter Brief '+(i+1),b:'Gelesen.',read:true}));s.mailQ=[];
 const done={st:'fertig'};s.post={m:{schatz:seg==='schatz'?{st:''}:done,haus7:seg==='brunnen'?done:{st:''},brunnen:{st:''}},lastMyst:-20};
 if(seg==='haus7')s.city={plots:[{start:1,due:4,ready:true,tenant:'ida',since:2,lastRent:8},{start:1,due:4,ready:true,tenant:null,lastRent:0},{start:null,ready:false,tenant:null,lastRent:0}]};
 JMDEBUG.startGame(s,false);return {money:s.money,inv:{...s.inv}};},{gfx,seg});
for(let i=0;i<3;i++)await p.locator('#zOut').click();await map('haus');
const row={seg,width:viewport.width,gfx,shots:[]};

// --- Nacht 1: Geheimnisbrief kommt ---
await sleep();let st=await S(()=>({day:JMDEBUG.S.day,neu:JMDEBUG.S.mail.filter(m=>!m.read).map(m=>m.t),mis:JMDEBUG.S.post.m}));
assert.ok(st.neu.length>=1&&st.neu.length<=3,'1–3 neue Briefe: '+st.neu.join(' | '));row.night1=st.neu;
const TITLE={schatz:'Eine zerknitterte Karte',haus7:'Ein anonymer Brief',brunnen:'Eine seltsame Einladung'}[seg];assert.ok(st.neu.includes(TITLE),'Geheimnisbrief '+TITLE+' in '+st.neu);
await toFarm();await toMailbox();
// Bedienbarkeit: Zähler, Neu-Abschnitt, ältere Briefe einklappbar, Panel scrollbar statt überlaufend.
assert.match(await p.locator('#panel .sub').first().innerText(),new RegExp('^'+st.neu.length+' ungelesen'));assert.equal(await p.locator('[data-a="older"]').count(),1,'ältere Briefe zusammengefasst');
const ov=await S(()=>{const pn=document.getElementById('panel');return {sw:pn.scrollWidth,cw:pn.clientWidth};});assert.ok(ov.sw<=ov.cw+1,'kein waagrechter Überlauf');
row.shots.push(await shot('briefkasten-'+seg));await readLetter(TITLE);row.shots.push(await shot('brief-'+seg));
await p.locator('[data-a="back"]').click();await p.getByRole('heading',{name:'Briefkasten',exact:true}).waitFor();await close();await dialogs();

if(seg==='schatz'){
 assert.equal(await S(()=>JMDEBUG.S.post.m.schatz.st),'karte');assert.match(await p.locator('#qTitle').innerText(),/zerknitterte Karte/);
 await walk(13,12);await walk(13,16);await walk(13,20);await walk(13,24);await walk(13,28);await walk(13,30);await click(13,31);await map('forest');
 await walk(13,6);await walk(13,10);await walk(13,14);await walk(12,16);await walk(11,18);
 assert.equal(await S(()=>JMDEBUG.M.obj.filter(o=>o.k==='erdhuegel').length),3);row.shots.push(await shot('schatz-huegel'));
 const m0=await S(()=>JMDEBUG.S.money);await click(10,19,.2);await p.waitForTimeout(1500);assert.equal(await S(()=>JMDEBUG.S.money),m0,'falscher Hügel ohne Lohn');assert.equal(await S(()=>JMDEBUG.S.post.m.schatz.st),'karte');
 await walk(12,20);await walk(15,20);await walk(16,19);await click(17,19,.2);await p.waitForFunction(()=>JMDEBUG.S.post.m.schatz.st==='fertig');row.shots.push(await shot('schatz-gefunden'));await dialogs();
 const got=await S(()=>({money:JMDEBUG.S.money,kupfer:JMDEBUG.S.inv.kupfer,hills:JMDEBUG.M.obj.filter(o=>o.k==='erdhuegel').length}));assert.deepEqual(got,{money:m0+300,kupfer:before.inv.kupfer+3,hills:0});
 await click(17,19,.05);await p.waitForTimeout(1200);assert.equal(await S(()=>JMDEBUG.S.money),m0+300,'zweiter Klick ohne Lohn');
 await reload();assert.deepEqual(await S(()=>({st:JMDEBUG.S.post.m.schatz.st,money:JMDEBUG.S.money,kupfer:JMDEBUG.S.inv.kupfer,map:JMDEBUG.M.id,hills:JMDEBUG.M.obj.filter(o=>o.k==='erdhuegel').length})),{st:'fertig',money:m0+300,kupfer:before.inv.kupfer+3,map:'forest',hills:0});
 row.result={money:m0+300};
}
if(seg==='haus7'){
 // Mietanfrage (normaler Brief) über echte Oberfläche zusagen, Doppelklick zahlt/vermietet nichts doppelt.
 const money1=await S(()=>JMDEBUG.S.money);assert.equal(money1,before.money+60,'Ida-Miete genau einmal (Stadtabrechnung)');
 await toMailbox();await readLetter('Mietbrief aus Lindenstadt');assert.match(await p.locator('.letter').innerText(),/Zusammen: 60 G/);assert.equal(await p.locator('[data-a="claim"]').count(),0,'Quittung ohne Auszahlung');
 await p.locator('[data-a="back"]').click();await readLetter('Mietanfrage für Sonnenwinkel');await p.locator('[data-a="accept"]').dblclick({delay:80});await p.getByText('Du hast zugesagt.').waitFor();
 assert.equal(await S(()=>JMDEBUG.S.city.plots[1].tenant),'noah');assert.equal(await S(()=>JMDEBUG.S.money),money1);await close();
 assert.equal(await S(()=>JMDEBUG.S.post.m.haus7.st),'suche');
 await farmToVillage();await villageSouthEast();await toCity();await cityToHouse7();row.shots.push(await shot('haus7-verlassen'));
 await click(5,19,.8);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();assert.equal(await S(()=>JMDEBUG.S.post.m.haus7.st),'gesehen');
 await cityHome();await sleep();assert.ok((await S(()=>JMDEBUG.S.mail.filter(m=>!m.read).map(m=>m.t))).includes('Ein Schlüssel ohne Absender'));
 await toFarm();await toMailbox();await readLetter('Ein Schlüssel ohne Absender');await close();assert.equal(await S(()=>JMDEBUG.S.post.m.haus7.st),'schluessel');
 await farmToVillage();await villageSouthEast();await toCity();await cityToHouse7();await click(5,19,.8);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();
 await p.getByRole('heading',{name:'Haus Nummer 7',exact:true}).waitFor();const m2=await S(()=>({money:JMDEBUG.S.money,holz:JMDEBUG.S.inv.holz,stein:JMDEBUG.S.inv.stein}));
 await p.locator('[data-a="renovate"]').dblclick({delay:80});await p.waitForFunction(()=>JMDEBUG.S.post.m.haus7.st==='bau');await p.waitForTimeout(600);
 assert.deepEqual(await S(()=>({money:JMDEBUG.S.money,holz:JMDEBUG.S.inv.holz,stein:JMDEBUG.S.inv.stein})),{money:m2.money-800,holz:m2.holz-20,stein:m2.stein-10});
 assert.equal(await S(()=>JMDEBUG.M.obj.find(o=>o.act==='post:haus7').k),'bau3');row.shots.push(await shot('haus7-renovierung'));
 await reload();assert.equal(await S(()=>JMDEBUG.S.post.m.haus7.st),'bau');assert.equal(await S(()=>JMDEBUG.S.money),m2.money-800);
 await cityHome();await sleep();await sleep();const fin=await S(()=>({st:JMDEBUG.S.post.m.haus7.st,neu:JMDEBUG.S.mail.filter(m=>!m.read).map(m=>m.t),money:JMDEBUG.S.money,mail:JMDEBUG.S.mail.filter(m=>m.kind==='miete').map(m=>+(/Zusammen: (\d+) G/.exec(m.b)||[])[1])}));
 assert.equal(fin.st,'fertig');assert.ok(fin.neu.includes('Licht in Haus Nummer 7'),fin.neu.join('|'));
 // Geldbilanz: Start − 800 Renovierung + Summe aller Mietquittungen (Briefe sind Belege, keine zweite Zahlung).
 assert.equal(fin.money,before.money-800+fin.mail.reduce((a,n)=>a+n,0),JSON.stringify(fin));
 await toFarm();await toMailbox();await readLetter('Licht in Haus Nummer 7');await close();
 await farmToVillage();await villageSouthEast();await toCity();await cityToHouse7();await p.waitForFunction(()=>JM.ENG.NPCA.elva?.vis);
 assert.equal(await S(()=>JMDEBUG.M.obj.find(o=>o.act==='post:haus7').k),'house');row.shots.push(await shot('haus7-elva'));
 const e=await S(()=>({x:JM.ENG.NPCA.elva.x,y:JM.ENG.NPCA.elva.y}));await click(e.x,e.y,1,true);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();
 await reload();assert.equal(await S(()=>JMDEBUG.S.money),fin.money);row.result={money:fin.money};
}
if(seg==='brunnen'){
 assert.equal(await S(()=>JMDEBUG.S.post.m.brunnen.st),'einladung');
 await farmToVillage();await villageSouthEast();await walk(27,21);row.shots.push(await shot('brunnen-alt'));
 await click(28,21,.4);await p.waitForTimeout(800);assert.equal(await S(()=>JMDEBUG.S.post.m.brunnen.st),'einladung','tagsüber passiert nichts');
 await S(()=>{JMDEBUG.S.min=1385;});/* Zeit-Fixture: 23:05 */await click(28,21,.4);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);row.shots.push(await shot('brunnen-mitternacht'));
 assert.equal(await S(()=>JMDEBUG.S.post.m.brunnen.st),'dokument');await dialogs();await p.waitForFunction(()=>JMDEBUG.M.id==='haus'&&!JMDEBUG.busy.ui.fade,null,{timeout:20000});
 const neu=await S(()=>JMDEBUG.S.mail.filter(m=>!m.read).map(m=>m.t));assert.ok(neu.includes('Altes Dokument')&&neu.includes('Brief von einem Geist'),neu.join('|'));
 await toFarm();await toMailbox();await readLetter('Altes Dokument');await p.locator('[data-a="back"]').click();await readLetter('Brief von einem Geist');await close();
 await farmToVillage();await villageSouthEast();await walk(27,21);const m3=await S(()=>({money:JMDEBUG.S.money,stein:JMDEBUG.S.inv.stein,kupfer:JMDEBUG.S.inv.kupfer}));
 await click(28,21,.4);await p.getByRole('heading',{name:'Der alte Brunnen',exact:true}).waitFor();await p.locator('[data-a="repair"]').dblclick({delay:80});await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();
 assert.deepEqual(await S(()=>({money:JMDEBUG.S.money,stein:JMDEBUG.S.inv.stein,kupfer:JMDEBUG.S.inv.kupfer,st:JMDEBUG.S.post.m.brunnen.st,k:JMDEBUG.M.obj.find(o=>o.act==='post:brunnen').k})),{money:m3.money-300,stein:m3.stein-15,kupfer:m3.kupfer-5,st:'fertig',k:'brunnen_neu'});
 row.shots.push(await shot('brunnen-repariert'));await S(()=>{JMDEBUG.S.can.w=2;});await click(28,21,.4);await p.waitForFunction(()=>JMDEBUG.S.can.w===JMDEBUG.S.can.max);
 await reload();assert.deepEqual(await S(()=>({st:JMDEBUG.S.post.m.brunnen.st,money:JMDEBUG.S.money,k:JMDEBUG.M.obj.find(o=>o.act==='post:brunnen')?.k})),{st:'fertig',money:m3.money-300,k:'brunnen_neu'});
 assert.equal(await S(()=>JM.Post.target(JMDEBUG.S)),null);row.result={money:m3.money-300};
}
assert.deepEqual(errors,[]);report.push(row);console.log('Briefe',tag,'OK',JSON.stringify(row.result));await c.close();
}fs.writeFileSync(path.join(out,`briefe-browser-${SEGS.join('-')}.json`),JSON.stringify(report,null,2));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;})
/* Chrome startet gelegentlich Hilfsprozesse (Crashpad, GoogleUpdater), die die stderr-Pipe erben und offen halten;
   Node würde dann nach erfolgreichem Lauf nie enden (beobachtet: Prozess hing nach „OK“). Daher ausdrücklich beenden. */
.finally(()=>process.exit());
