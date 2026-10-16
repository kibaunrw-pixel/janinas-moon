/* Briefkasten-Ereignisse W61–W65 (Etappe 1b). Echte Bildschirmklicks in 390×844 (DPR 2) und 1440×900, 2D und 3D.
   Aufruf: node tests/ereignisse-browser.cjs <vermisst|verkauf|villa|tuer|bewohner>  (ohne Argument: alle fünf).
   Fixture setzt nur Startort (Bett), Tageszeit, Vorräte, Mieter und Missionsstand VOR der Nacht. Brief kommt über
   eine echte Nacht, Lesen am Briefkasten, Wege/Reisen/Entscheidungen per Pointer.
   Zeit-Fixtures (statt stundenlang zu warten, jeweils ausgewiesen): Villa 10:00 am Stadtbrunnen; Bewohner 7:30 Bahnhof,
   11:40 Dorf, 16:40 Stadt. Helfer (Klick, Weg, Reisen) unverändert aus briefe-browser.cjs übernommen. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-ereignisse';fs.mkdirSync(out,{recursive:true});
const SEGS=process.argv[2]?[process.argv[2]]:['vermisst','verkauf','villa','tuer','bewohner'];
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const report=[];try{for(const seg of SEGS)for(const viewport of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
if(process.env.VIEWPORT&&viewport.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
const c=await b.newContext({viewport,deviceScaleFactor:viewport.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await p.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Post&&JM.Post.EVENTS);
const tag=`${seg}-${viewport.width}-${gfx}`;
async function shot(name){const f=path.join(out,`${name}-${viewport.width}-${gfx}.png`);await p.waitForTimeout(500);await p.screenshot({path:f});return f;}
async function click(x,y,h=.05,actorOk=false){await p.waitForTimeout(450);
 /* Hunde/Figuren können vor einem Objekt stehen und den Klick abfangen (beobachtet: Pudel vor dem Briefkasten → Hundedialog).
    Dann wie eine Spielerin kurz warten, bis das Ziel frei ist; keine Teleports, keine verdeckten HUDs. */
 if(!actorOk)for(let i=0;i<60;i++){const blocker=await p.evaluate(({x,y,h,gfx})=>{const d=JMDEBUG,actors=[...Object.values(JM.ENG.NPCA).filter(a=>a.vis),...(d.RA.vis?[d.RA]:[]),...d.DOGS];
  if(gfx==='3d'){const r=JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio),hit=JM.R3.pick(...r);return hit&&hit.actor&&hit.actor!=='P'?String(hit.actor):null;}
  const a=actors.find(a=>Math.abs(x-a.x)<1.2&&y+.5>a.y-1.3&&y+.5<a.y+1.4);return a?(a.id||a.name||'figur'):null;},{x,y,h,gfx});if(!blocker)break;if(i===59)throw Error('Ziel dauerhaft verdeckt von '+blocker+' '+JSON.stringify({x,y}));await p.waitForTimeout(500);}const pixel=await p.evaluate(({x,y,h,gfx})=>gfx==='3d'?JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio):[(x*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{x,y,h,gfx});
 assert.ok(pixel[0]>0&&pixel[0]<viewport.width&&pixel[1]>0&&pixel[1]<viewport.height,'sichtbares Ziel '+JSON.stringify({x,y,pixel,gfx}));assert.equal(await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,pixel),'CANVAS','freies Weltziel '+JSON.stringify({x,y,pixel}));await p.mouse.click(...pixel);}
/* Ergänzung gegenüber briefe-browser: Liegt das Ziel außerhalb des Bildes (3D am Rechner nah gezoomt), geht die Figur
   wie eine Spielerin erst auf den sichtbaren freien Boden, der dem Ziel am nächsten ist (keine Teleports). */
async function stepToward(x,y){const t=await p.evaluate(({x,y,gfx})=>{const d=JMDEBUG,m=d.M,out=[];for(let ty=0;ty<m.h;ty++)for(let tx=0;tx<m.w;tx++){if(!JM.WALK.has(m.t[ty][tx])||m.exits.some(e=>e.x===tx&&e.y===ty))continue;
  const r=gfx==='3d'?JM.R3.proj(tx+.5,ty+.5,.01).map(n=>n/devicePixelRatio):[(tx*16+8-Math.round(d.cam.x))*d.scale,(ty*16+8-Math.round(d.cam.y))*d.scale];if(r[0]<20||r[0]>=innerWidth-20||r[1]<130||r[1]>=innerHeight-130||document.elementFromPoint(r[0],r[1])?.tagName!=='CANVAS')continue;
  if(gfx==='3d'){const h=JM.R3.pick(...r);if(!h||h.obj||h.actor||h.collectible||Math.floor(h.wx)!==tx||Math.floor(h.wy)!==ty)continue;}out.push({tx,ty,r,dist:Math.hypot(tx-x,ty-y)});}out.sort((a,b)=>a.dist-b.dist);return out[0]||null;},{x,y,gfx});
 if(!t)return false;await p.mouse.click(...t.r);await p.waitForTimeout(300);await p.waitForFunction(()=>JMDEBUG.idle,null,{timeout:15000});await p.waitForTimeout(800);return true;}
async function walk(x,y,n=0){await p.waitForTimeout(500);
 for(let attempt=0;attempt<12;attempt++){const target=await p.evaluate(({x,y,gfx})=>{const d=JMDEBUG,m=d.M,actors=[...Object.values(JM.ENG.NPCA).filter(a=>a.vis),...(d.RA.vis?[d.RA]:[]),...d.DOGS];
  for(const [dx,dy] of [[0,0],[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]]){const tx=x+dx,ty=y+dy;if(!JM.WALK.has(m.t[ty]?.[tx])||m.exits.some(e=>e.x===tx&&e.y===ty)||(m.id==='farm'&&JM.ENG.isField(tx,ty))||(d.S.forage[m.id]||[]).some(f=>f.x===tx&&f.y===ty)||actors.some(a=>Math.abs(tx-a.x)<1&&ty+.5>a.y-1.1&&ty+.5<a.y+1.2))continue;
   const r=gfx==='3d'?JM.R3.proj(tx+.5,ty+.5,.01).map(n=>n/devicePixelRatio):[(tx*16+8-Math.round(d.cam.x))*d.scale,(ty*16+8-Math.round(d.cam.y))*d.scale];if(r[0]<1||r[0]>=innerWidth-1||r[1]<1||r[1]>=innerHeight-1||document.elementFromPoint(r[0],r[1])?.tagName!=='CANVAS')continue;
   if(gfx==='3d'){const hit=JM.R3.pick(...r);if(!hit||hit.collectible||(hit.actor&&hit.actor!=='P')||Math.floor(hit.wx)!==tx||Math.floor(hit.wy)!==ty)continue;}return {x:tx,y:ty,r};}return null;},{x,y,gfx});
  if(!target){await p.waitForTimeout(400);continue;}await p.mouse.click(...target.r);
  try{await p.waitForFunction(({x,y})=>Math.abs(JMDEBUG.P.x-x)<.1&&Math.abs(JMDEBUG.P.y-y)<.1&&JMDEBUG.idle,target,{timeout:10000});return;}catch(e){if(attempt<4&&await S(()=>JMDEBUG.idle&&!JMDEBUG.busy.ui.panel&&!JMDEBUG.busy.ui.dialog)){console.error('Wegversuch wiederholt',tag,target);continue;}console.error('WEG',tag,target,await p.evaluate(()=>({map:JMDEBUG.M.id,p:[JMDEBUG.P.x,JMDEBUG.P.y],busy:JSON.stringify(JMDEBUG.busy),dlg:document.querySelector('#dlg')?.innerText})));await shot('wegproblem-'+seg);throw e;}}
 if(n<6&&await stepToward(x,y))return walk(x,y,n+1);
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
/* Hunde können sich zwischen Prüfung und Tipp vor den Briefkasten bewegen (beobachtet im vollen Lauf haus7 390/3D: Dialog „A schaut dich mit großen Augen an.“).
   Dann wie eine Spielerin: Hundedialog über die Oberfläche schließen und erneut tippen, höchstens dreimal. */
async function toMailbox(){await walk(6,8);await walk(7,8);
 for(let attempt=0;;attempt++){await click(7,7,.6);const got=await Promise.race([p.getByRole('heading',{name:'Briefkasten',exact:true}).waitFor({timeout:8000}).then(()=>'panel'),p.waitForFunction(()=>window.JMDEBUG&&JMDEBUG.busy.ui.dialog,null,{timeout:8000}).then(()=>'dialog')]).catch(()=>'nichts');
  if(got==='panel'||await p.getByRole('heading',{name:'Briefkasten',exact:true}).isVisible())return;if(attempt>=3||got!=='dialog'){await diag('briefkasten');throw Error('Briefkasten nicht geöffnet: '+got);}
  console.error('Briefkastentipp abgefangen, Versuch',attempt+1,await p.evaluate(()=>document.querySelector('#dlg')?.innerText?.slice(0,60)));
  const dog=p.locator('#dlg button',{hasText:'Streicheln'});if(await dog.count())await dog.first().click();await dialogs();await p.waitForFunction(()=>JMDEBUG.idle,null,{timeout:10000});if(await S(()=>Math.round(JMDEBUG.P.x)!==7||Math.round(JMDEBUG.P.y)!==8))await walk(7,8);}}
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

async function stadtToBahnhof(){await walk(10,20);await walk(13,18);await click(14,19,.7);await p.locator('[data-a="ride"]').click();await map('bahnhof');}
async function toForest(){await walk(13,12);await walk(13,16);await walk(13,20);await walk(13,24);await walk(13,28);await walk(13,30);await click(13,31);await map('forest');}
async function talkTo(id){await p.waitForFunction(id=>JM.ENG.NPCA[id]?.vis,id,{timeout:20000});const e=await p.evaluate(id=>({x:JM.ENG.NPCA[id].x,y:JM.ENG.NPCA[id].y}),id);await click(e.x,e.y,1,true);}
const FIX={vermisst:{done:['schatz','haus7','brunnen'],plots:[{start:1,due:4,ready:true,tenant:'ida',since:2,lastRent:8},{start:null,ready:false,tenant:null,lastRent:0},{start:null,ready:false,tenant:null,lastRent:0}]},
 verkauf:{done:['schatz','haus7','brunnen'],plots:null},
 villa:{done:['schatz','haus7','brunnen','verkauf'],plots:[{start:1,due:4,ready:true,tenant:null,lastRent:0},{start:1,due:4,ready:true,tenant:null,lastRent:0},{start:1,due:4,ready:true,tenant:null,lastRent:0}]},
 tuer:{done:['schatz','haus7','brunnen','verkauf','villa'],plots:null},
 bewohner:{done:['schatz','haus7','brunnen','verkauf','villa','tuer'],plots:null}}[seg];
const before=await p.evaluate(({gfx,fx})=>{const s=JMDEBUG.newState('Ereignisse',[{name:'A',fell:'weiss'},{name:'B',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.flags.letter=true;s.flags.caveSeen=s.flags.forestSeen=true;s.rene.met=true;s.rene.bf=9;s.rene.cudToday=2;s.qDone=JM.QUESTS.map(q=>q.id);
 s.map='haus';s.px=10;s.py=5;s.day=9;s.min=1200;s.money=5000;s.inv={holz:40,stein:40,kupfer:10};s.daily={day:9,goals:[]};s.mail=[];s.mailQ=[];
 const m={};for(const id of JM.Post.MISSIONS)m[id]={st:fx.done.includes(id)?'fertig':''};s.post={m,lastMyst:-20};if(fx.plots)s.city={plots:fx.plots};
 JMDEBUG.startGame(s,false);return {money:s.money,inv:{...s.inv}};},{gfx,fx:FIX});
for(let i=0;i<3;i++)await p.locator('#zOut').click();await map('haus');
const row={seg,width:viewport.width,gfx,shots:[]};
const TITLE={vermisst:'Ida ist verschwunden',verkauf:'Ein Haus zu verkaufen',villa:'Anfrage wegen der Villa',tuer:'Eine Tür im Hang',bewohner:'Ein geheimnisvoller Neuer'}[seg];
await sleep();const neu=await S(()=>JMDEBUG.S.mail.filter(m=>!m.read).map(m=>m.t));assert.ok(neu.length>=1&&neu.length<=3,'1–3 neue Briefe: '+neu.join('|'));assert.ok(neu.includes(TITLE),'Ereignisbrief '+TITLE+' in '+neu.join('|'));
await toFarm();await toMailbox();row.shots.push(await shot('briefkasten-'+seg));await readLetter(TITLE);row.shots.push(await shot('brief-'+seg));
await p.locator('[data-a="back"]').click();await p.getByRole('heading',{name:'Briefkasten',exact:true}).waitFor();await close();await dialogs();
const money=()=>S(()=>JMDEBUG.S.money);
if(seg==='vermisst'){
 assert.equal(await S(()=>JMDEBUG.S.post.m.vermisst.st),'suche');assert.equal(await money(),before.money+60,'Miete von Ida trotz Verschwinden');
 await farmToVillage();await villageSouthEast();await toCity();assert.equal(await S(()=>JM.ENG.NPCA.ida?.vis||false),false,'Ida nicht in der Stadt');
 await walk(13,14);await walk(13,10);await walk(9,10);await walk(7,8);row.shots.push(await shot('vermisst-zettel'));await click(7,7,.7);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();assert.equal(await S(()=>JMDEBUG.S.post.m.vermisst.st),'spur');
 await stadtToBahnhof();await p.waitForFunction(()=>JM.ENG.NPCA.ida?.vis,null,{timeout:20000});assert.ok(await S(()=>JMDEBUG.M.obj.some(o=>o.k==='koffer')));
 await walk(8,8);row.shots.push(await shot('vermisst-bahnhof'));const m0=await money(),t0=await S(()=>JMDEBUG.S.inv.tee||0);
 await talkTo('ida');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);row.shots.push(await shot('vermisst-wiedersehen'));await dialogs();
 assert.deepEqual(await S(()=>({st:JMDEBUG.S.post.m.vermisst.st,tenant:JMDEBUG.S.city.plots[0].tenant})),{st:'fertig',tenant:'ida'});assert.equal(await money(),m0+150);assert.equal(await S(()=>JMDEBUG.S.inv.tee),t0+2);
 await talkTo('ida').catch(()=>{});await p.waitForTimeout(800);await dialogs();assert.equal(await money(),m0+150,'zweites Gespräch ohne Lohn');
 await reload();assert.deepEqual(await S(()=>({st:JMDEBUG.S.post.m.vermisst.st,money:JMDEBUG.S.money,koffer:JMDEBUG.M.obj.some(o=>o.k==='koffer'),bahnhof:(JM.Stadt.location(JMDEBUG.S,'ida',false)||{}).map==='bahnhof'})),{st:'fertig',money:m0+150,koffer:false,bahnhof:false});
 row.result={money:m0+150};
}
if(seg==='verkauf'){
 assert.equal(await S(()=>JMDEBUG.S.post.m.verkauf.st),'angebot');const plot=await S(()=>JMDEBUG.S.post.m.verkauf.plot);assert.equal(plot,0);
 await farmToVillage();await villageSouthEast();await toCity();await walk(13,14);await walk(13,10);await walk(12,8);await walk(8,10);await walk(4,8);row.shots.push(await shot('verkauf-ruine'));
 await click(5,5,1);await p.getByRole('heading',{name:'Verlassenes Haus · Lindenhof',exact:true}).waitFor();const m0=await money();
 await p.locator('[data-a="kaufen"]').dblclick({delay:80});await p.waitForFunction(()=>JMDEBUG.S.post.m.verkauf.st==='fertig');await p.waitForTimeout(600);await dialogs();
 assert.deepEqual(await S(()=>({money:JMDEBUG.S.money,ready:JMDEBUG.S.city.plots[0].ready,k:JMDEBUG.M.obj.find(o=>o.act==='plot:0'&&o.k!=='board')?.k,ruin:JMDEBUG.M.obj.some(o=>o.act==='post:ev:haus62')})),{money:m0-900,ready:true,k:'house',ruin:false});
 row.shots.push(await shot('verkauf-gekauft'));await reload();assert.deepEqual(await S(()=>({money:JMDEBUG.S.money,ready:JMDEBUG.S.city.plots[0].ready,st:JMDEBUG.S.post.m.verkauf.st})),{money:m0-900,ready:true,st:'fertig'});row.result={money:m0-900};
}
if(seg==='villa'){
 assert.equal(await S(()=>JMDEBUG.S.post.m.villa.st),'treffen');await farmToVillage();await villageSouthEast();await toCity();
 await S(()=>{JMDEBUG.S.min=600;});/* Zeit-Fixture 10:00 */await walk(12,14);await walk(10,14);await p.waitForFunction(()=>JM.ENG.NPCA.falk?.vis,null,{timeout:30000});row.shots.push(await shot('villa-falk'));
 const wahl=gfx==='2d'?'elva':'geld';const m0=await money(),p0=await S(()=>JMDEBUG.S.npc.elva.p);
 await talkTo('falk');await p.getByRole('heading',{name:'Herr Falk am Stadtbrunnen',exact:true}).waitFor();row.shots.push(await shot('villa-entscheidung'));
 await p.locator(`[data-a="${wahl}"]`).dblclick({delay:80});await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();
 const got=await S(()=>({st:JMDEBUG.S.post.m.villa.st,wahl:JMDEBUG.S.post.m.villa.wahl,money:JMDEBUG.S.money,elva:JMDEBUG.S.npc.elva.p,falk:JM.ENG.NPCA.falk?.vis||false}));
 assert.deepEqual(got,{st:'fertig',wahl,money:m0+(wahl==='geld'?250:0),elva:p0+(wahl==='elva'?150:0),falk:false});
 await reload();assert.deepEqual(await S(()=>({money:JMDEBUG.S.money,st:JMDEBUG.S.post.m.villa.st})),{money:got.money,st:'fertig'});row.result=got;
}
if(seg==='tuer'){
 assert.equal(await S(()=>JMDEBUG.S.post.m.tuer.st),'suche');await toForest();await walk(13,6);await walk(13,3);await walk(9,3);await walk(5,3);row.shots.push(await shot('tuer-hang'));
 await click(5,2,.8);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();await map('waldtuer');row.shots.push(await shot('tuer-gewoelbe'));
 const m0=await money(),q0=await S(()=>JMDEBUG.S.inv.mondquarz||0);await click(5,3,.4);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();
 assert.deepEqual(await S(()=>({st:JMDEBUG.S.post.m.tuer.st,money:JMDEBUG.S.money,q:JMDEBUG.S.inv.mondquarz})),{st:'fertig',money:m0+200,q:q0+2});
 await click(5,3,.4);await p.waitForTimeout(900);assert.equal(await money(),m0+200,'leere Truhe');
 await click(8,3,.6);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);const txt=await p.locator('#dlg').innerText();await dialogs();row.shots.push(await shot('tuer-tafel'));
 await walk(5,6);await click(5,7);await map('forest');assert.equal(await S(()=>JMDEBUG.M.obj.find(o=>o.act==='post:ev:tuer64').k),'waldtuer_offen');
 await reload();assert.deepEqual(await S(()=>({money:JMDEBUG.S.money,st:JMDEBUG.S.post.m.tuer.st,map:JMDEBUG.M.id})),{money:m0+200,st:'fertig',map:'forest'});row.result={money:m0+200};
}
if(seg==='bewohner'){
 assert.equal(await S(()=>JMDEBUG.S.post.m.bewohner.st),'beobachten');await farmToVillage();await villageSouthEast();
 await walk(29,21);await walk(29,17);await walk(29,14);await walk(30,14);await click(31,14);await map('bahnhof');
 await S(()=>{JMDEBUG.S.min=450;});/* Zeit-Fixture 7:30 */await walk(5,8);await talkTo('jonas');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);row.shots.push(await shot('bewohner-bahnhof'));await dialogs();
 await walk(4,9);await click(0,9);await map('village');await S(()=>{JMDEBUG.S.min=700;});/* 11:40 */await walk(29,18);await walk(29,21);await walk(26,22);await talkTo('jonas');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();
 assert.equal(await S(()=>JMDEBUG.S.post.m.bewohner.seen.length),2);const m0=await money();
 await walk(29,21);await walk(29,17);await walk(29,14);await walk(30,14);await click(31,14);await map('bahnhof');await walk(8,9);await click(11,8,.7);await p.locator('[data-a="ride"]').click();await map('stadt');
 await S(()=>{JMDEBUG.S.min=1000;});/* 16:40 */await walk(12,14);await walk(10,12);await talkTo('jonas');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);row.shots.push(await shot('bewohner-geheimnis'));await dialogs();
 assert.deepEqual(await S(()=>({st:JMDEBUG.S.post.m.bewohner.st,money:JMDEBUG.S.money})),{st:'fertig',money:m0+250});
 await talkTo('jonas');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();assert.equal(await money(),m0+250,'danach normales Gespräch');
 await reload();assert.deepEqual(await S(()=>({money:JMDEBUG.S.money,st:JMDEBUG.S.post.m.bewohner.st})),{money:m0+250,st:'fertig'});row.result={money:m0+250};
}
assert.deepEqual(errors,[]);report.push(row);console.log('Ereignis',tag,'OK',JSON.stringify(row.result));await c.close();
}fs.writeFileSync(path.join(out,`ereignisse-browser-${SEGS.join('-')}.json`),JSON.stringify(report,null,2));}finally{await Promise.race([b.close(),new Promise(r=>setTimeout(r,8000))]);}})().catch(e=>{console.error(e);process.exitCode=1;})
/* Chrome-Hilfsprozesse halten sonst die Ausgabe offen (siehe briefe-browser.cjs). */
.finally(()=>process.exit());
