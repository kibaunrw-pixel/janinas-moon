/* Etappe 2 – Lebendiges Dorf und Romantik. Echte Bildschirmklicks in 390×844 (DPR 2) und 1440×900, 2D und 3D.
   Aufruf: node tests/etappe2-browser.cjs <geheimnis|streit|paar|picknick|ausflug|jahrestag|geburtstag>  (ohne Argument: alle).
   Fixtures (ausgewiesen): Startort, Tag, Uhrzeit, Herzen und Vorgeschichte werden VOR dem Start gesetzt. Zeit-Fixtures
   (S.min/S.day direkt) ersetzen nur das Warten auf eine Uhrzeit oder einen nächsten Tag; Briefe kommen über echte Nächte,
   Gespräche, Auswahl, Wege, Reisen und Tagebuch laufen über Pointer. Helfer (Klick, Weg, Reisen) aus ereignisse-browser.cjs. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-etappe2';fs.mkdirSync(out,{recursive:true});
const ALL=['geheimnis','streit','paar','picknick','ausflug','jahrestag','geburtstag'];
const SEGS=process.argv[2]?process.argv[2].split(','):ALL;
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const report=[];let failed=0;try{for(const seg of SEGS)for(const viewport of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
if(process.env.VIEWPORT&&viewport.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
const c=await b.newContext({viewport,deviceScaleFactor:viewport.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await p.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Rom&&JM.Dorf);
const tag=`${seg}-${viewport.width}-${gfx}`;
const dialogBounds=[];
async function checkChoices(){const rows=await p.evaluate(()=>[...document.querySelectorAll('#dlgC button')].filter(b=>b.getBoundingClientRect().height).map(b=>{const r=b.getBoundingClientRect();return {text:b.textContent,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,scroll:b.scrollWidth,client:b.clientWidth,viewport:[innerWidth,innerHeight]};}));
 for(const r of rows){assert.ok(r.x>=0&&r.right<=viewport.width&&r.y>=0&&r.bottom<=viewport.height&&r.scroll<=r.client+1,'Antwort vollständig im Viewport: '+JSON.stringify(r));if(!dialogBounds.some(b=>b.text===r.text))dialogBounds.push(r);}}
async function shot(name){await checkChoices();const f=path.join(out,`${name}-${viewport.width}-${gfx}.png`);await p.waitForTimeout(500);await p.screenshot({path:f});return f;}
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
 /* Fixture: zufällige Tagesziele und automatische Kuschelansprache ausschließen, damit Bilanz und Gesprächsfolge deterministisch bleiben (wie im Startspielstand). */await S(()=>{JMDEBUG.S.daily.goals=[];JMDEBUG.S.rene.cudToday=2;});}
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

/* ---------- Ergänzungen Etappe 2 ---------- */
async function untilChoice(txt){for(let i=0;i<20;i++){const btn=p.locator('#dlgC button',{hasText:txt});if(await btn.count()&&await btn.first().isVisible()){await checkChoices();return btn.first();}
  if(!await S(()=>JMDEBUG.busy.ui.dialog))throw Error('Dialog ohne Auswahl „'+txt+'“ beendet');await p.locator('#dlg').click();await p.waitForTimeout(300);}throw Error('Auswahl nicht gefunden: '+txt);}
async function pickChoice(txt){const btn=await untilChoice(txt);await p.waitForTimeout(250);await btn.click();await p.waitForTimeout(400);}
async function dlgText(){return S(()=>document.querySelector('#dlgT')?.textContent||'');}
async function seenText(re){for(let i=0;i<20;i++){await p.waitForTimeout(150);const t=await dlgText();if(re.test(t))return t;if(!await S(()=>JMDEBUG.busy.ui.dialog))break;await p.locator('#dlg').click();await p.waitForTimeout(300);}throw Error('Text nicht gesehen: '+re);}
async function tapRene(){await p.waitForFunction(()=>JMDEBUG.RA.vis&&!JMDEBUG.RA.path.length,null,{timeout:20000});await p.waitForTimeout(400);
 const pixel=await p.evaluate(gfx=>{const d=JMDEBUG,a=d.RA,sit=JM.ENG.seated(a);return gfx==='3d'?JM.R3.proj(a.x+.5-(sit?.45:0),a.y+.62,.7+(sit?.14:0)).map(n=>n/devicePixelRatio):[(a.x*16+8-(sit?7:0)-Math.round(d.cam.x))*d.scale,(a.y*16+5-Math.round(d.cam.y))*d.scale];},gfx);
 assert.equal(await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,pixel),'CANVAS','René sichtbar antippen');await p.mouse.click(...pixel);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog,null,{timeout:20000});}
/* Liegt die Figur außerhalb des Bildes (3D mobil nah gezoomt), geht die Spielerin erst in ihre Nähe. */
async function talk(id){await p.waitForFunction(id=>JM.ENG.NPCA[id]?.vis,id,{timeout:20000});
 for(let n=0;n<5;n++){const far=await p.evaluate(({id,gfx})=>{const a=JM.ENG.NPCA[id],d=JMDEBUG;const r=gfx==='3d'?JM.R3.proj(a.x+.5,a.y+.5,1).map(n=>n/devicePixelRatio):[(a.x*16+8-Math.round(d.cam.x))*d.scale,(a.y*16+8-Math.round(d.cam.y))*d.scale];
  return r[0]>12&&r[0]<innerWidth-12&&r[1]>12&&r[1]<innerHeight-12?null:[Math.round(a.x),Math.round(a.y)];},{id,gfx});
  if(!far)break;if(!await stepToward(far[0],far[1]))break;}
 await talkTo(id);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog||JMDEBUG.busy.ui.panel,null,{timeout:30000});}
async function book(tab){await p.locator('#bMenu').click();await p.getByRole('heading',{name:'Tagebuch',exact:true}).waitFor();await p.locator('[data-a="tab"][data-k="'+tab+'"]').click();await p.waitForTimeout(300);}
async function bookText(){return S(()=>document.querySelector('#panel')?.innerText||'');}
const rom=()=>S(()=>JSON.parse(JSON.stringify(JMDEBUG.S.rom)));const dorf=()=>S(()=>JSON.parse(JSON.stringify(JMDEBUG.S.dorf)));
/* Szenenbild: nah heranzoomen (wie eine Spielerin mit +), Bild, wieder zurück */
async function sceneShot(name){if(await S(()=>JMDEBUG.busy.ui.dialog||JMDEBUG.busy.ui.panel))return shot(name);for(let i=0;i<3;i++)await p.locator('#zIn').click();await p.waitForTimeout(1000);const f=await shot(name);for(let i=0;i<3;i++)await p.locator('#zOut').click();await p.waitForTimeout(400);return f;}
/* Zeit-Fixture: nur Uhrzeit/Tag setzen (statt warten), danach Karten wie im Spiel neu anwenden */
async function fixTime(min,dayAdd){await p.evaluate(([m,d])=>{const s=JMDEBUG.S;if(d)s.day+=d;s.min=m;JMDEBUG.refreshPost();},[min,dayAdd||0]);await p.waitForTimeout(600);}

const FIX={
 geheimnis:{map:'village',px:9,py:21,day:9,min:600,hearts:{henk:2},flags:{h5_henk:true}},
 streit:{map:'village',px:16,py:14,day:12,min:470,hearts:{lin:2},inv:{milch:1}},
 paar:{map:'village',px:16,py:13,day:9,min:380,hearts:{mei:3},dorf:{sec:{mei:{st:3,day:2,paid:2}}}},
 picknick:{map:'haus',px:10,py:5,day:9,min:1200},
 ausflug:{map:'village',px:28,py:14,day:9,min:900,rom:{pick:{n:1,last:5,first:5},mv:{st:'fertig',day:6},mem:[{k:'picknick',day:5,place:'see',choice:'uns',t:'Picknick am Waldsee',txt:'Erstes Picknick.',l:6}]},plots:[{start:null,ready:false,tenant:null,lastRent:0},{start:null,ready:false,tenant:null,lastRent:0},{start:1,due:4,ready:true,tenant:'mara',since:2,lastRent:8}]},
 jahrestag:{map:'haus',px:4,py:6,day:26,min:1070},
 geburtstag:{map:'haus',px:10,py:5,day:33,min:1200}}[seg];
const before=await p.evaluate(({gfx,fx})=>{const s=JMDEBUG.newState('Etappe2',[{name:'A',fell:'weiss'},{name:'B',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.flags.letter=true;s.flags.caveSeen=s.flags.forestSeen=true;s.rene.met=true;s.rene.bf=fx.day;s.rene.cudToday=2;s.qDone=JM.QUESTS.map(q=>q.id);
 s.map=fx.map;s.px=fx.px;s.py=fx.py;s.day=fx.day;s.min=fx.min;s.weather='sun';s.tomorrow='sun';s.money=3000;s.inv=Object.assign({},fx.inv||{});s.hold='auto';s.daily={day:fx.day,goals:[]};s.mail=[];s.mailQ=[];
 for(const id of JM.NPC_ORDER){s.npc[id].met=true;s.npc[id].p=100;}for(const [id,h] of Object.entries(fx.hearts||{}))s.npc[id].p=h*100;
 const m={};for(const id of JM.Post.MISSIONS)m[id]={st:''};s.post={m,lastMyst:fx.day+30};if(fx.plots)s.city={plots:fx.plots};
 if(fx.dorf)s.dorf=fx.dorf;if(fx.rom)s.rom=fx.rom;Object.assign(s.flags,fx.flags||{});
 JMDEBUG.startGame(s,false);return {inv:{...s.inv}};},{gfx,fx:FIX});
for(let i=0;i<3;i++)await p.locator('#zOut').click();await map(FIX.map);
const row={seg,width:viewport.width,gfx,shots:[]};
try{

if(seg==='geheimnis'){ // W01: Henk, drei Teile; Reload mitten in der Geschichte; Lohn einmal
 await walk(9,22);await talk('henk');row.shots.push(await shot('geheimnis-teil1'));await seenText(/nicht schwimmen/);await dialogs();
 assert.equal((await dorf()).sec.henk.st,1);await reload();await book('herz');const t1=await bookText();assert.match(t1,/Henks Geheimnis am Fluss · 1 von 3/);assert.match(t1,/Nächster Teil ab 4 Herzen/);row.shots.push(await shot('geheimnis-tagebuch'));await close();
 await S(()=>{JMDEBUG.S.npc.henk.p=400;});await fixTime(600,1);await talk('henk');await seenText(/Frau aus dem Dorf/);await dialogs();assert.equal((await dorf()).sec.henk.st,2);
 await S(()=>{JMDEBUG.S.npc.henk.p=600;});await fixTime(600,1);const f0=await S(()=>JMDEBUG.S.inv.forelle||0);await talk('henk');await seenText(/Hedwig/);row.shots.push(await sceneShot('geheimnis-teil3'));await dialogs();
 assert.equal((await dorf()).sec.henk.st,3);assert.equal(await S(()=>JMDEBUG.S.inv.forelle),f0+3);
 await talk('henk');await dialogs();assert.equal(await S(()=>JMDEBUG.S.inv.forelle),f0+3,'kein zweiter Lohn');await reload();assert.equal(await S(()=>JMDEBUG.S.inv.forelle),f0+3);assert.equal((await dorf()).sec.henk.st,3);
 await book('herz');assert.match(await bookText(),/3 von 3/);row.shots.push(await shot('geheimnis-tagebuch-fertig'));await close();row.result={henk:3};}
if(seg==='streit'){ // W02 Streit Lin–Paula + W04 Tratsch + W38 Bewohnergeburtstag (Paula, 12. Frühling)
 await talk('lin');await seenText(/ungenießbar/);await dialogs();assert.equal((await dorf()).streit.st,'lin');
 await walk(16,17);await walk(17,21);await fixTime(480);await S(()=>{JMDEBUG.S.hold='milch';});await talk('paula');await pickChoice('Schenken');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await p.waitForTimeout(900);const gt=await dlgText();assert.match(gt,/am liebsten/,'Geburtstagsantwort: '+gt);row.shots.push(await sceneShot('streit-paula-geburtstag'));await dialogs();
 assert.equal((await dorf()).bd['paula:1'].lv,'love');await S(()=>{JMDEBUG.S.hold='auto';});
 await talk('paula');await seenText(/unglaublich scharf/);await dialogs();assert.equal((await dorf()).streit.st,'zettel');
 await reload();await walk(16,17);await walk(16,15);await fixTime(480);await talk('lin');await pickChoice('Sie meint es ehrlich');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await p.waitForTimeout(900);row.shots.push(await sceneShot('streit-versoehnung'));await dialogs();
 assert.equal((await dorf()).streit.st,'versoehnt');await walk(14,12);await walk(13,11);await fixTime(480);await talk('rosa');await p.waitForTimeout(900);const g=await dlgText();assert.match(g,/vertragen sich wieder/,'Tratsch: '+g);row.shots.push(await shot('streit-tratsch'));await dialogs();
 await book('herz');const bt=await bookText();assert.match(bt,/Lin & Paula · Wieder Freunde/);assert.match(bt,/Rosa: „Lin und Paula vertragen/);assert.match(bt,/Paula · Jahr 1 · Milch · Lieblingsgeschenk/);row.shots.push(await shot('streit-tagebuch'));await close();
 await reload();assert.equal((await dorf()).streit.st,'versoehnt');row.result={streit:'versoehnt'};}
if(seg==='paar'){ // W06 Mei und Timo
 await talk('mei');await seenText(/Holz/);await dialogs();assert.equal((await dorf()).paar.st,'hinweis');
 /* Timo morgens vor der Zimmerei liegt in 3D mobil hinter dem Tierhof-Dach; deshalb (Zeit-Fixture) am Nachmittag auf dem Dorfplatz (17,13). */
 await fixTime(1030);await p.waitForFunction(()=>{const a=JM.ENG.NPCA.timo;return a&&a.vis&&Math.round(a.x)===17&&Math.round(a.y)===13&&!a.path.length;},null,{timeout:30000});await walk(16,15);
 await talk('timo');await pickChoice('Ich bringe ihr beides');await dialogs();assert.equal((await dorf()).paar.st,'brief');
 await reload();await p.waitForFunction(()=>{const a=JM.ENG.NPCA.mei;return a&&a.vis&&!a.path.length;},null,{timeout:30000});await talk('mei');await pickChoice('Am Dorfbrunnen');await dialogs();const d=await dorf();assert.equal(d.paar.st,'treffen');assert.equal(d.paar.meet,10,'nach 17 Uhr verabredet: morgen');
 await book('cal');assert.match(await bookText(),/Mei & Timo/);await close();
 await fixTime(1085,1);await p.waitForFunction(()=>JM.ENG.NPCA.mei?.vis&&JM.ENG.NPCA.timo?.vis,null,{timeout:30000});await walk(14,13);await p.waitForTimeout(1500);row.shots.push(await sceneShot('paar-treffen'));
 await talk('mei');await pickChoice('Timo, du wolltest');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await dialogs();await p.waitForTimeout(500);row.shots.push(await sceneShot('paar-zusammen'));
 assert.equal((await dorf()).paar.st,'paar');assert.deepEqual(await S(()=>[JM.Stadt.location(JMDEBUG.S,'mei',false),JM.Stadt.location(JMDEBUG.S,'timo',false)].map(l=>l&&[l.x,l.y])),[[14,12],[15,12]]);
 await reload();assert.equal((await dorf()).paar.st,'paar');await book('herz');assert.match(await bookText(),/Mei & Timo · Ein Paar/);await close();row.result={paar:'paar'};}
if(seg==='picknick'){ // W25 Picknick per Brief, W28 Brief danach, W26 Missverständnis mit Herzbank
 await sleep();const neu=await S(()=>JMDEBUG.S.mail.filter(m=>!m.read).map(m=>m.t));assert.ok(neu.length>=1&&neu.length<=3,'1–3 Briefe: '+neu.join('|'));assert.ok(neu.includes('Eine Einladung'),neu.join('|'));
 await toFarm();await toMailbox();await readLetter('Eine Einladung');row.shots.push(await shot('picknick-brief'));
 await p.locator('[data-a="rom"]',{hasText:'Waldsee · heute 12 Uhr'}).click();await p.waitForTimeout(400);assert.equal((await rom()).date.place,'see');
 await p.locator('[data-a="back"]').click();await close();await dialogs();
 await walk(9,8);await toForest();await walk(13,8);await walk(13,14);await walk(15,18);await fixTime(690);await walk(15,21);await tapRene();await seenText(/12 Uhr/);await dialogs();assert.equal((await rom()).pick.n,0);await fixTime(725);
 await p.waitForFunction(()=>JMDEBUG.RA.vis&&JMDEBUG.M.obj.some(o=>o.k==='picknick'),null,{timeout:20000});await p.waitForTimeout(1200);row.shots.push(await sceneShot('picknick-decke'));
 assert.ok(await S(()=>JMDEBUG.S.min>=720&&JMDEBUG.S.min<900),'Picknick tatsächlich im Fenster');await tapRene();await untilChoice('Wolken');row.shots.push(await sceneShot('picknick-szene'));
 await reload();assert.equal((await rom()).pick.n,0,'Reload vor der Wahl: noch kein Picknick');await tapRene();await pickChoice('Wolken');await dialogs();await p.waitForTimeout(400);row.shots.push(await sceneShot('picknick-herzen'));
 let r=await rom();assert.equal(r.pick.n,1);assert.equal(r.mem.length,1);
 await reload();await tapRene();await dialogs();r=await rom();assert.equal(r.pick.n,1,'kein zweites Picknick');assert.equal(r.mem.length,1);
 await book('herz');assert.match(await bookText(),/Picknick am Waldsee/);row.shots.push(await shot('picknick-tagebuch'));await close();
 await walk(13,14);await walk(13,8);await walk(13,2);await click(13,0);await map('farm');await walk(13,24);await walk(13,12);await backHome();await sleep();
 await fixTime(380);await tapRene();await dialogs();/* Frühstück */await tapRene();await seenText(/erledigen/);await dialogs();assert.equal((await rom()).mv.st,'ausweichen');
 await toFarm();await toMailbox();await readLetter('Nach unserem Picknick');assert.match(await bookText(),/Wolkenpudel/);row.shots.push(await shot('picknick-brief-danach'));await p.locator('[data-a="back"]').click();await close();await dialogs();
 await backHome();await sleep();await fixTime(380);await tapRene();await dialogs();await tapRene();await pickChoice('keine Lust mehr');await dialogs();assert.equal((await rom()).mv.st,'fertig');
 await toFarm();await walk(9,8);await walk(13,12);await walk(16,15);await p.waitForTimeout(3000);/* Hinweistext abwarten */await walk(20,16);await p.waitForTimeout(800);assert.ok(await S(()=>JMDEBUG.M.obj.some(o=>o.k==='herzbank')));row.shots.push(await sceneShot('herzbank'));
 await click(21,17,.5);await p.waitForFunction(()=>JMDEBUG.S.rom.bankDay===JMDEBUG.S.day,null,{timeout:15000});
 await reload();assert.equal((await rom()).mv.st,'fertig');row.result={pick:1,mv:'fertig'};}
if(seg==='ausflug'){ // W30 Ausflug über das Tagebuch, Zug nach Lindenstadt, Auswahl
 await book('herz');await p.locator('[data-a="rom"]',{hasText:'Ausflug: Stadtbrunnen Lindenstadt · heute 17 Uhr'}).click();await p.waitForTimeout(500);assert.equal((await rom()).date.k,'ausflug');
 await p.locator('[data-a="tab"][data-k="cal"]').click();await p.waitForTimeout(300);assert.match(await bookText(),/Ausflug/);row.shots.push(await shot('ausflug-kalender'));await close();
 await walk(29,14);await walk(30,14);await click(31,14);await map('bahnhof');await walk(8,9);await click(11,8,.7);await p.locator('[data-a="ride"]').click();await map('stadt');
 await fixTime(1025);await walk(12,18);await walk(10,17);await walk(9,16);await walk(9,15);await p.waitForFunction(()=>JMDEBUG.RA.vis,null,{timeout:20000});await p.waitForTimeout(1200);row.shots.push(await sceneShot('ausflug-tisch'));
 await tapRene();await untilChoice('Mara');row.shots.push(await sceneShot('ausflug-auswahl'));await pickChoice('Mara');await dialogs();await p.waitForTimeout(400);row.shots.push(await sceneShot('ausflug-herzen'));
 const r=await rom();assert.equal(r.aus.n,1);assert.match(r.mem.at(-1).txt,/Geige/);await reload();assert.equal((await rom()).aus.n,1);row.result={aus:1};}
if(seg==='jahrestag'){ // W31
 await book('cal');assert.match(await bookText(),/Jahrestag/);await close();
 await fixTime(1085);await p.waitForFunction(()=>JMDEBUG.RA.vis&&JMDEBUG.M.obj.some(o=>o.k==='tisch_jt'),null,{timeout:20000});await walk(4,5);await p.waitForTimeout(1200);row.shots.push(await sceneShot('jahrestag-kerzen'));
 await tapRene();await pickChoice('Den Brief sofort lesen');await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await p.waitForTimeout(1500);row.shots.push(await sceneShot('jahrestag-brief'));await dialogs();await p.waitForTimeout(300);row.shots.push(await sceneShot('jahrestag-herzen'));
 let r=await rom();assert.ok(r.jtDone[1]);await reload();await tapRene();await p.waitForTimeout(600);const t=await dlgText();assert.ok(!/Jahrestag/.test(t),'keine zweite Feier: '+t);await dialogs();
 await book('herz');await p.selectOption('#romD-jt','13');await p.locator('[data-a="romdate"][data-k="jt"]').click();await p.waitForTimeout(400);await close();await reload();r=await rom();assert.deepEqual([r.jt.s,r.jt.d],[1,13]);assert.equal(Object.keys(r.jtDone).length,1);
 await fixTime(1100,1);await tapRene();await p.waitForTimeout(600);assert.ok(!/Jahrestag/.test(await dlgText()),'Datum verschoben: im selben Jahr nicht noch einmal');await dialogs();row.result={jt:1};}
if(seg==='geburtstag'){ // W38 Janinas Geburtstag (6. Herbst)
 await sleep();assert.equal(await S(()=>JMDEBUG.S.day),34);const neu=await S(()=>JMDEBUG.S.mail.filter(m=>!m.read).map(m=>m.t));assert.ok(neu.length>=1&&neu.length<=3,neu.join('|'));assert.ok(neu.includes('Alles Gute zum Geburtstag!'),neu.join('|'));
 await fixTime(425);await tapRene();await seenText(/Geburtstag/);row.shots.push(await sceneShot('geburtstag-rene'));await dialogs();assert.equal(await S(()=>JMDEBUG.S.inv.nudeln),2);
 await toFarm();await toMailbox();await readLetter('Alles Gute zum Geburtstag!');await p.locator('[data-a="claim"]').click();await p.waitForTimeout(400);assert.equal(await S(()=>JMDEBUG.S.inv.erdbeere),3);row.shots.push(await shot('geburtstag-post'));
 await p.locator('[data-a="back"]').click();await close();await dialogs();
 await fixTime(605);await p.waitForFunction(()=>JM.ENG.NPCA.mei?.vis&&JM.ENG.NPCA.rosa?.vis,null,{timeout:30000});await walk(12,8);await p.waitForTimeout(1200);row.shots.push(await sceneShot('geburtstag-besuch'));
 await talk('mei');await seenText(/Überraschung/);await dialogs();await p.waitForTimeout(300);row.shots.push(await sceneShot('geburtstag-feier'));
 assert.deepEqual(await S(()=>[JMDEBUG.S.inv.tee,JMDEBUG.S.inv.rolle]),[2,2]);await reload();await talk('mei');await dialogs();assert.deepEqual(await S(()=>[JMDEBUG.S.inv.tee,JMDEBUG.S.inv.rolle,JMDEBUG.S.inv.nudeln]),[2,2,2],'kein zweiter Korb');
 await book('herz');assert.match(await bookText(),/Dein Geburtstag · Jahr 1/);await close();row.result={jb:true};}

}catch(e){failed++;row.error=String(e&&e.stack||e).slice(0,900);console.error('FEHLER',seg,viewport.width,gfx,row.error);try{await diag('fehler');}catch(_){}}
const raf=await p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now();(function f(){n++;if(performance.now()-t<1000)requestAnimationFrame(f);else r(n);})();}));row.raf=raf;if(raf<5){failed++;row.error=(row.error||'')+' rAF '+raf;}
row.dialogBounds=dialogBounds;row.errors=errors.slice();if(errors.length){failed++;console.error('SEITENFEHLER',seg,viewport.width,gfx,errors);}
report.push(row);console.log(JSON.stringify({seg,width:viewport.width,gfx,ok:!row.error&&!errors.length,raf,result:row.result,error:row.error}));await c.close();}}
finally{await b.close();fs.writeFileSync(path.join(out,'report-'+SEGS.join('_')+'-'+(process.env.VIEWPORT||'alle')+'-'+(process.env.GFX||'alle')+'.json'),JSON.stringify(report,null,2));}
if(failed){console.error('FEHLGESCHLAGEN',failed);process.exitCode=1;}else console.log('OK etappe2-browser',SEGS.join(','));})().catch(e=>{console.error(e);process.exit(1);});
