/* Etappe 3 – Café und Tiere mit Persönlichkeit. Echte Bildschirmklicks in 390×844 (DPR 2) und 1440×900, 2D und 3D.
   Aufruf: node tests/etappe3-browser.cjs <cafe|katze|hund|ziege|teich|rettung|rene>  (ohne Argument: alle).
   Fixtures (ausgewiesen): Startort, Tag, Uhrzeit, Vorräte und Vorgeschichte werden VOR dem Start gesetzt. Zeit-Fixtures
   setzen nur Uhrzeit (statt warten). Nächte laufen über das echte Bett oder, wo die Figur nicht im Haus ist, über
   JMDEBUG.endDay (dieselbe Funktion wie „Gute Nacht“). Bau, Vitrine, Öffnen, Bedienen, Füttern, Graben, Pflege laufen über Klicks.
   Helfer (Klick, Weg, Reisen, Dialoge) unverändert aus etappe2-browser.cjs, ergänzt um Haustiere als mögliche Verdecker. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-etappe3';fs.mkdirSync(out,{recursive:true});
const ALL=['cafe','katze','hund','ziege','teich','rettung','rene'];
const SEGS=process.argv[2]?process.argv[2].split(','):ALL;
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const report=[];let failed=0;try{for(const seg of SEGS)for(const viewport of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
if(process.env.VIEWPORT&&viewport.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
const c=await b.newContext({viewport,deviceScaleFactor:viewport.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await p.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Rom&&JM.Dorf&&JM.Tiere&&JM.Cafe);
const tag=`${seg}-${viewport.width}-${gfx}`;
const dialogBounds=[];
async function checkChoices(){const rows=await p.evaluate(()=>[...document.querySelectorAll('#dlgC button')].filter(b=>b.getBoundingClientRect().height).map(b=>{const r=b.getBoundingClientRect();return {text:b.textContent,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,scroll:b.scrollWidth,client:b.clientWidth,viewport:[innerWidth,innerHeight]};}));
 for(const r of rows){assert.ok(r.x>=0&&r.right<=viewport.width&&r.y>=0&&r.bottom<=viewport.height&&r.scroll<=r.client+1,'Antwort vollständig im Viewport: '+JSON.stringify(r));if(!dialogBounds.some(b=>b.text===r.text))dialogBounds.push(r);}}
async function shot(name){await checkChoices();const f=path.join(out,`${name}-${viewport.width}-${gfx}.png`);await p.waitForTimeout(500);await p.screenshot({path:f});return f;}
async function click(x,y,h=.05,actorOk=false){await p.waitForTimeout(450);
 /* Hunde/Figuren können vor einem Objekt stehen und den Klick abfangen (beobachtet: Pudel vor dem Briefkasten → Hundedialog).
    Dann wie eine Spielerin kurz warten, bis das Ziel frei ist; keine Teleports, keine verdeckten HUDs. */
 if(!actorOk)for(let i=0;i<60;i++){const blocker=await p.evaluate(({x,y,h,gfx})=>{const d=JMDEBUG,actors=[...Object.values(JM.ENG.NPCA).filter(a=>a.vis),...(d.RA.vis?[d.RA]:[]),...d.DOGS,...d.PETS];
  if(gfx==='3d'){const r=JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio),hit=JM.R3.pick(...r);return hit&&hit.actor&&hit.actor!=='P'?String(hit.actor):null;}
  const a=actors.find(a=>Math.abs(x-a.x)<1.2&&y+.5>a.y-1.3&&y+.5<a.y+1.4);return a?(a.id||a.name||'figur'):null;},{x,y,h,gfx});if(!blocker)break;if(i===59)throw Error('Ziel dauerhaft verdeckt von '+blocker+' '+JSON.stringify({x,y}));await p.waitForTimeout(500);}const pixel=await p.evaluate(({x,y,h,gfx})=>gfx==='3d'?JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio):[(x*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{x,y,h,gfx});
 assert.ok(pixel[0]>0&&pixel[0]<viewport.width&&pixel[1]>0&&pixel[1]<viewport.height,'sichtbares Ziel '+JSON.stringify({x,y,pixel,gfx}));assert.equal(await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,pixel),'CANVAS','freies Weltziel '+JSON.stringify({x,y,pixel}));await p.mouse.click(...pixel);}
/* Ergänzung gegenüber briefe-browser: Liegt das Ziel außerhalb des Bildes (3D am Rechner nah gezoomt), geht die Figur
   wie eine Spielerin erst auf den sichtbaren freien Boden, der dem Ziel am nächsten ist (keine Teleports). */
async function stepToward(x,y){const t=await p.evaluate(({x,y,gfx})=>{const d=JMDEBUG,m=d.M,out=[];for(let ty=0;ty<m.h;ty++)for(let tx=0;tx<m.w;tx++){if(!JM.WALK.has(m.t[ty][tx])||m.exits.some(e=>e.x===tx&&e.y===ty))continue;
  /* Etappe 3: bestellte Beete nicht als Wegpunkt wählen, der Tipp würde dort pflanzen statt gehen */if(m.id==='farm'&&d.S.field[tx+','+ty]?.t)continue;
  const r=gfx==='3d'?JM.R3.proj(tx+.5,ty+.5,.01).map(n=>n/devicePixelRatio):[(tx*16+8-Math.round(d.cam.x))*d.scale,(ty*16+8-Math.round(d.cam.y))*d.scale];if(r[0]<20||r[0]>=innerWidth-20||r[1]<130||r[1]>=innerHeight-130||document.elementFromPoint(r[0],r[1])?.tagName!=='CANVAS')continue;
  if(gfx==='3d'){const h=JM.R3.pick(...r);if(!h||h.obj||h.actor||h.collectible||Math.floor(h.wx)!==tx||Math.floor(h.wy)!==ty)continue;}out.push({tx,ty,r,dist:Math.hypot(tx-x,ty-y)});}out.sort((a,b)=>a.dist-b.dist);return out[0]||null;},{x,y,gfx});
 if(!t)return false;await p.mouse.click(...t.r);await p.waitForTimeout(300);await p.waitForFunction(()=>JMDEBUG.idle,null,{timeout:15000});await p.waitForTimeout(800);return true;}
async function walk(x,y,n=0){await p.waitForTimeout(500);
 for(let attempt=0;attempt<12;attempt++){const target=await p.evaluate(({x,y,gfx})=>{const d=JMDEBUG,m=d.M,actors=[...Object.values(JM.ENG.NPCA).filter(a=>a.vis),...(d.RA.vis?[d.RA]:[]),...d.DOGS,...d.PETS];
  for(const [dx,dy] of [[0,0],[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]]){const tx=x+dx,ty=y+dy;if(!JM.WALK.has(m.t[ty]?.[tx])||m.exits.some(e=>e.x===tx&&e.y===ty)||(m.id==='farm'&&JM.ENG.isField(tx,ty))||(d.S.forage[m.id]||[]).some(f=>f.x===tx&&f.y===ty)||actors.some(a=>Math.abs(tx-a.x)<1&&ty+.5>a.y-1.1&&ty+.5<a.y+1.2))continue;
   const r=gfx==='3d'?JM.R3.proj(tx+.5,ty+.5,.01).map(n=>n/devicePixelRatio):[(tx*16+8-Math.round(d.cam.x))*d.scale,(ty*16+8-Math.round(d.cam.y))*d.scale];if(r[0]<1||r[0]>=innerWidth-1||r[1]<1||r[1]>=innerHeight-1||document.elementFromPoint(r[0],r[1])?.tagName!=='CANVAS')continue;
   if(gfx==='3d'){const hit=JM.R3.pick(...r);if(!hit||hit.collectible||(hit.actor&&hit.actor!=='P')||Math.floor(hit.wx)!==tx||Math.floor(hit.wy)!==ty)continue;}return {x:tx,y:ty,r};}return null;},{x,y,gfx});
  if(!target){await p.waitForTimeout(400);continue;}await p.mouse.click(...target.r);
  try{await p.waitForFunction(({x,y})=>Math.abs(JMDEBUG.P.x-x)<.1&&Math.abs(JMDEBUG.P.y-y)<.1&&JMDEBUG.idle,target,{timeout:10000});return;}catch(e){if(attempt<4&&await S(()=>JMDEBUG.idle&&!JMDEBUG.busy.ui.panel&&!JMDEBUG.busy.ui.dialog)){console.error('Wegversuch wiederholt',tag,target);continue;}
   /* Ergänzung Etappe 3: Ein Pudel ist zwischen Zielwahl und Klick unter den Finger gelaufen (Hundedialog). Wie eine Spielerin:
      Dialog über die Oberfläche beenden (Streicheln) und den Weg erneut tippen, höchstens viermal. */
   if(attempt<4&&await S(()=>JMDEBUG.busy.ui.dialog&&/schaut dich mit großen Augen an|schnüffelt aufgeregt/.test(document.querySelector('#dlg')?.innerText||''))){console.error('Hundedialog statt Weg, erneut',tag,target);const b=p.locator('#dlgC button',{hasText:'Streicheln'});if(await b.count())await b.first().click();await dialogs();await p.waitForFunction(()=>JMDEBUG.idle,null,{timeout:10000});continue;}console.error('WEG',tag,target,await p.evaluate(()=>({map:JMDEBUG.M.id,p:[JMDEBUG.P.x,JMDEBUG.P.y],busy:JSON.stringify(JMDEBUG.busy),dlg:document.querySelector('#dlg')?.innerText})));await shot('wegproblem-'+seg);throw e;}}
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


/* ---------- Ergänzungen Etappe 3 ---------- */
const T3=()=>S(()=>JSON.parse(JSON.stringify(JMDEBUG.S.tiere)));const CF=()=>S(()=>JSON.parse(JSON.stringify(JMDEBUG.S.cafe)));
async function petPixel(id){return p.evaluate(({id,gfx})=>{const d=JMDEBUG,a=d.PETS.find(q=>q.id===id);if(!a)return null;
 return gfx==='3d'?JM.R3.proj(a.x+.5,a.y+.6,a.anim==='schwimm'?.08:.22).map(n=>n/devicePixelRatio):[(a.x*16+8-Math.round(d.cam.x))*d.scale,(a.y*16+10-Math.round(d.cam.y))*d.scale];},{id,gfx});}
/* Haustier antippen: warten, bis es ruhig ist; liegt es außerhalb des Bildes, geht die Spielerin erst hin. */
async function tapPet(id,retry=0){await p.waitForFunction(id=>{const a=JMDEBUG.PETS.find(q=>q.id===id);return a&&(!a.moving||a.anim==='schwimm');},id,{timeout:30000});
 for(let n=0;n<5;n++){const r=await petPixel(id);if(r&&r[0]>12&&r[0]<viewport.width-12&&r[1]>140&&r[1]<viewport.height-140)break;const a=await p.evaluate(id=>{const a=JMDEBUG.PETS.find(q=>q.id===id);return [Math.round(a.x),Math.round(a.y)];},id);if(!await stepToward(a[0],a[1]))break;}
 await p.waitForTimeout(300);const r=await petPixel(id);assert.ok(r,'Haustier '+id+' da');assert.equal(await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,r),'CANVAS','Haustier frei sichtbar '+id);
 if(gfx==='3d'){const hit=await p.evaluate(r=>JM.R3.pick(...r),r);assert.equal(hit&&hit.actor,'pet:'+id,'Strahl trifft '+id+' '+JSON.stringify(hit));}
 await p.mouse.click(...r);await p.waitForFunction(()=>!JMDEBUG.P.path.length&&!JMDEBUG.P.act,null,{timeout:20000});await p.waitForTimeout(500);
 /* Ein Pudel ist genau unter den Finger gelaufen (Hund vor Tier im Treffertest): Hundedialog wie eine Spielerin schließen, erneut tippen. */
 if(retry<3&&await S(()=>JMDEBUG.busy.ui.dialog)&&/schaut dich mit großen Augen an|schnüffelt aufgeregt/.test(await dlgText())){console.error('Pudel statt',id,'– erneut');const b=p.locator('#dlgC button',{hasText:'Streicheln'});if(await b.count())await b.first().click();await dialogs();await p.waitForTimeout(1500);return tapPet(id,retry+1);}}
/* Gäste sitzen: in 3D ist das Modell zum Tisch versetzt (wie am Jahrestag). */
async function tapGuest(id){await p.waitForFunction(id=>JM.ENG.NPCA[id]?.vis&&JM.ENG.seated(JM.ENG.NPCA[id]),id,{timeout:30000});await p.waitForTimeout(400);
 const r=await p.evaluate(({id,gfx})=>{const d=JMDEBUG,a=JM.ENG.NPCA[id],sd=JM.ENG.seatSide(a);return gfx==='3d'?JM.R3.proj(a.x+.5+(sd==='r'?.35:-.35),a.y+.62,.75).map(n=>n/devicePixelRatio):[(a.x*16+8-Math.round(d.cam.x))*d.scale,(a.y*16+6-Math.round(d.cam.y))*d.scale];},{id,gfx});
 assert.equal(await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,r),'CANVAS','Gast sichtbar '+id);await p.mouse.click(...r);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog,null,{timeout:20000});}
/* Längere Wege auf dem Hof: wie eine Spielerin in sichtbaren Etappen gehen (stepToward), zuletzt genau aufs Ziel. */
async function goTo(x,y){for(let n=0;n<8;n++){const d=await S(()=>[JMDEBUG.P.x,JMDEBUG.P.y]);if(Math.abs(d[0]-x)+Math.abs(d[1]-y)<4)break;if(!await stepToward(x,y))break;}await walk(x,y);}
/* Tierbilder: in 2D drei Zoomschritte, mobil in 3D zwei; am Rechner in 3D kein Überzoom.
   Janina tritt neben das Tier. Belege zeigen damit das Tier statt fast den ganzen Hof. */
async function petShot(name,id){const a=await p.evaluate(id=>{const q=JMDEBUG.PETS.find(q=>q.id===id);return q?[Math.round(q.x),Math.round(q.y)]:null;},id);
 if(a&&!id.startsWith('ente')){const d=await S(()=>[JMDEBUG.P.x,JMDEBUG.P.y]);if(Math.abs(d[0]-a[0])+Math.abs(d[1]-a[1])>3){const t=await p.evaluate(([x,y])=>{const m=JMDEBUG.M;for(const [dx,dy] of [[0,-2],[-2,0],[2,0],[0,2],[-1,-2],[1,-2]]){const tx=x+dx,ty=y+dy;if(m.t[ty]&&JM.WALK.has(m.t[ty][tx])&&!m.obj.some(o=>tx>=o.x&&tx<o.x+(o.w||1)&&ty>=o.y&&ty<o.y+(o.h||1))&&!JMDEBUG.S.field[tx+','+ty]?.t)return [tx,ty];}return null;},a);if(t)await goTo(t[0],t[1]);}}
 if(id.startsWith('ente'))await p.waitForFunction(()=>{const a=JMDEBUG.PETS.filter(q=>q.id.startsWith('ente'));return a.every((q,i)=>a.slice(i+1).every(r=>Math.hypot(q.x-r.x,q.y-r.y)>.45));},null,{timeout:15000});
 // Pip läuft nach dem Start noch über den Hof: mobil nur einen Schritt näher, damit sein ganzer Körper im Bild bleibt.
 const n=gfx==='2d'?3:viewport.width>=1000?0:id==='pip'?1:2;for(let i=0;i<n;i++)await p.locator('#zIn').click();await p.waitForTimeout(1000);
 const r=await petPixel(id);if(r)assert.ok(r[0]>20&&r[0]<viewport.width-20&&r[1]>130&&r[1]<viewport.height-110,'Tier '+id+' im Bild '+r);
 const f=await shot(name);for(let i=0;i<n;i++)await p.locator('#zOut').click();await p.waitForTimeout(400);return f;}
async function night(){await p.evaluate(()=>JMDEBUG.endDay(false));await p.waitForFunction(()=>!JMDEBUG.busy.ui.fade,null,{timeout:20000});await map('haus');await S(()=>{JMDEBUG.S.daily.goals=[];JMDEBUG.S.rene.cudToday=2;});}
async function panelBtn(sel){const b=p.locator(sel).first();await b.scrollIntoViewIfNeeded();await b.click();await p.waitForTimeout(350);}
async function farmFromHouse(){await walk(7,9);await click(7,10);await map('farm');}
async function tapDog(i){await p.waitForFunction(i=>{const d=JMDEBUG.DOGS.find(q=>q.i===i);return d&&!d.moving;},i,{timeout:30000});await p.waitForTimeout(300);
 const r=await p.evaluate(({i,gfx})=>{const d=JMDEBUG,a=d.DOGS.find(q=>q.i===i);if(gfx!=='3d')return [(a.x*16+8-Math.round(d.cam.x))*d.scale,(a.y*16+9-Math.round(d.cam.y))*d.scale];
  /* 3D: die Höhe suchen, in der der Strahl wirklich den Pudel trifft (Tipp-Vorrang: kein Gegenstand davor) */
  for(const z of [.3,.22,.4,.15,.5])for(const dx of [.5,.4,.6]){const r=JM.R3.proj(a.x+dx,a.y+.5,z).map(n=>n/devicePixelRatio),h=JM.R3.pick(...r);if(h&&h.actor==='dog'+i)return r;}
  return JM.R3.proj(a.x+.5,a.y+.5,.3).map(n=>n/devicePixelRatio);},{i,gfx});
 await p.mouse.click(...r);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog,null,{timeout:20000});}
const FIX={
 cafe:{map:'village',px:9,py:14,day:12,min:440,inv:{holz:20,stein:10,erdbeere:3,suppe:3},cafe:{sent:{idee:11},served:1,orders:[{id:1,who:'rosa',k:'suppe',day:11,due:14,st:'offen',rew:270,letter:11}]}},
 katze:{map:'farm',px:9,py:9,day:12,min:640,tiere:{katze:{st:'da',since:5,h:2}}},
 hund:{map:'farm',px:9,py:9,day:12,min:480,dogH:[4,0],tiere:{hund:{st:'spur',dog:0,spot:'weide',day:12,n:0,last:0,found:[]}}},
 ziege:{map:'farm',px:12,py:15,day:12,min:560,inv:{futter:1},field:{'11,12':'tomate','11,14':'zwiebel'},tiere:{ziege:{st:'da',since:5,steal:{day:12,x:11,y:12,k:'tomate',st:'plan'}}}},
 teich:{map:'farm',px:12,py:24,day:12,min:600,inv:{stein:12,futter:6}},
 rettung:{map:'forest',px:11,py:15,day:12,min:600,inv:{milch:3},tiere:{katze:{st:'da',since:5},rettung:{st:'suchen',care:[],since:12}}},
 rene:{map:'farm',px:9,py:9,day:13,min:850,rom:{pick:{n:1,last:8,first:8},mv:{st:'hinweis',day:11}}}}[seg];
const before=await p.evaluate(({gfx,fx})=>{const s=JMDEBUG.newState('Etappe3',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.flags.letter=true;s.flags.caveSeen=s.flags.forestSeen=true;s.rene.met=true;s.rene.bf=fx.day;s.rene.cudToday=2;s.qDone=JM.QUESTS.map(q=>q.id);
 s.map=fx.map;s.px=fx.px;s.py=fx.py;s.day=fx.day;s.min=fx.min;s.weather='sun';s.tomorrow='sun';s.money=3000;s.inv=Object.assign({},fx.inv||{});s.hold='auto';s.daily={day:fx.day,goals:[]};s.mail=[];s.mailQ=[];
 for(const id of JM.NPC_ORDER){s.npc[id].met=true;s.npc[id].p=100;}const m={};for(const id of JM.Post.MISSIONS)m[id]={st:''};s.post={m,lastMyst:fx.day+30,lastGift:fx.day+30};
 if(fx.dogH)s.dogH=fx.dogH;for(const [k,c] of Object.entries(fx.field||{}))s.field[k]={t:true,w:true,c:{k:c,a:9}};
 JM.Ausbau.migrate(s);for(const [k,v] of Object.entries(fx.tiere||{}))Object.assign(s.tiere[k],v);Object.assign(s.cafe,fx.cafe||{});if(fx.rom)Object.assign(s.rom,fx.rom);
 s.tiere.sent.ziegeTipp=1;s.rom.sent.inv1=s.rom.sent.inv2=1;
 JMDEBUG.startGame(s,false);return {inv:{...s.inv},money:s.money};},{gfx,fx:FIX});
for(let i=0;i<3;i++)await p.locator('#zOut').click();await map(FIX.map);
const row={seg,width:viewport.width,gfx,shots:[]};
try{

if(seg==='cafe'){ // W13 Teehaus → Café, W15 Vitrine/Öffnen/Bedienen/Abrechnung, W16 Freischaltung, W17 Bestellung
 await walk(6,15);await click(6,13,.9);await p.getByRole('heading',{name:'Das alte Teehaus',exact:true}).waitFor();row.shots.push(await shot('cafe-teehaus'));
 await panelBtn('[data-a="cafebau"]');assert.equal((await CF()).st,'bau');assert.equal(await S(()=>JMDEBUG.S.money),before.money-1500);assert.deepEqual(await S(()=>[JMDEBUG.S.inv.holz,JMDEBUG.S.inv.stein]),[undefined,undefined]);
 await p.waitForTimeout(800);row.shots.push(await shot('cafe-baustelle'));await reload();assert.equal((await CF()).st,'bau');assert.equal(await S(()=>JMDEBUG.S.money),before.money-1500,'nach Reload kein zweites Bezahlen');
 await night();await night();assert.equal((await CF()).st,'fertig');assert.ok(await S(()=>JMDEBUG.S.mail.some(m=>/Café ist fertig/.test(m.t))),'Timos Brief');
 await farmFromHouse();await farmToVillage();await walk(6,15);await p.waitForTimeout(600);row.shots.push(await shot('cafe-aussen'));await click(6,13,.9);await map('i_cafe');
 await click(3,3,1);await p.getByRole('heading',{name:'Café Mondlicht',exact:true}).waitFor();
 await panelBtn('[data-a="in"][data-k="erdbeere"]');await p.fill('#cafe-in-suppe','2');await panelBtn('[data-a="in"][data-k="suppe"]');
 let cf=await CF();assert.deepEqual(cf.vit,{erdbeere:3,suppe:2});assert.deepEqual(await S(()=>[JMDEBUG.S.inv.erdbeere,JMDEBUG.S.inv.suppe]),[undefined,1],'Ware aus dem Rucksack');await close();
 await fixTime(500);await click(3,3,1);await p.getByRole('heading',{name:'Café Mondlicht',exact:true}).waitFor();await panelBtn('[data-a="open"][data-k="frueh"]');
 assert.equal((await CF()).today.hours,'frueh');assert.equal(await p.locator('[data-a="open"]').count(),0,'nur eine Öffnung');row.shots.push(await shot('cafe-theke'));await close();
 // W17: Rosas Bestellung an der Theke abgeben, genau einmal
 const m1=await S(()=>JMDEBUG.S.money);await click(3,3,1);await panelBtn('[data-a="deliver"]');await dialogs();assert.equal(await S(()=>JMDEBUG.S.money),m1+270);
 await click(3,3,1);await p.getByRole('heading',{name:'Café Mondlicht',exact:true}).waitFor();assert.equal(await p.locator('[data-a="deliver"]').count(),0,'Bestellung erledigt');await close();
 await fixTime(600);const g=(await CF()).today.guests.map(x=>x.id);await p.waitForFunction(g=>g.every(id=>JM.ENG.NPCA[id]?.vis),g,{timeout:30000});await p.waitForTimeout(1200);row.shots.push(await sceneShot('cafe-gaeste'));
 const m0=await S(()=>JMDEBUG.S.money);await tapGuest(g[0]);await pickChoice('Servieren');await dialogs();let t=(await CF()).today;assert.equal(t.sales.length,1);const s0=t.sales[0];assert.equal(await S(()=>JMDEBUG.S.money),m0+s0.p+s0.tip);
 await reload();await map('i_cafe');assert.equal(await S(()=>JMDEBUG.S.money),m0+s0.p+s0.tip,'nach Reload unverändert');
 await tapGuest(g[0]);await dialogs();assert.equal(await S(()=>JMDEBUG.S.money),m0+s0.p+s0.tip,'zweiter Tipp: kein zweites Geld');
 await tapGuest(g[1]);await pickChoice('Servieren');await dialogs();t=(await CF()).today;assert.equal(t.sales.length,2);const sum=t.sales.reduce((a,x)=>a+x.p+x.tip,0);assert.equal(await S(()=>JMDEBUG.S.money),m0+sum);
 cf=await CF();assert.equal(cf.served,3);assert.ok(cf.unlock.blumen,'W16 Blumen und Lichterkette');assert.equal(Object.values(cf.vit).reduce((a,b)=>a+b,0),3,'zwei Waren verkauft');
 assert.ok(await S(()=>JMDEBUG.M.decor.some(d=>d.k==='lichterkette')&&JMDEBUG.M.obj.filter(o=>o.k==='cafepflanze').length===3),'Raum verändert');
 await p.waitForTimeout(900);row.shots.push(await sceneShot('cafe-bedient-blumen'));
 await click(3,3,1);await p.getByRole('heading',{name:'Café Mondlicht',exact:true}).waitFor();assert.match(await bookText(),new RegExp('zusammen '+sum+' G'));row.shots.push(await shot('cafe-bilanz'));await close();
 await night();const mail=await S(()=>JMDEBUG.S.mail.filter(m=>/Tagesabrechnung/.test(m.t)).map(m=>m.b));if(!mail.length){await night();}
 const mails=await S(()=>JMDEBUG.S.mail.filter(m=>/Tagesabrechnung/.test(m.t)).map(m=>m.b));assert.equal(mails.length,1);assert.match(mails[0],new RegExp('Zusammen: '+sum+' G'));
 row.result={served:3,sum,order:270};}
if(seg==='katze'){ // W19
 await tapPet('katze');assert.equal((await T3()).katze.h,3);assert.equal((await T3()).katze.pet,FIX.day);
 await reload();assert.equal((await T3()).katze.h,3);await tapPet('katze');assert.equal((await T3()).katze.h,3,'einmal am Tag');
 await fixTime(700);await p.waitForFunction(()=>JMDEBUG.PETS.find(q=>q.id==='katze')?.anim==='schlaf',null,{timeout:30000});await p.waitForTimeout(800);row.shots.push(await petShot('katze-sonne','katze'));
 await backHome();await sleep();await farmFromHouse();const gift=await S(()=>(JMDEBUG.S.forage.farm||[]).find(f=>f.katze));assert.ok(gift,'Geschenk vor der Tür');assert.deepEqual([gift.x,gift.y],[6,9]);
 await p.waitForTimeout(600);row.shots.push(await petShot('katze-geschenk','katze'));const n0=await S(()=>JMDEBUG.S.inv[(JMDEBUG.S.forage.farm||[]).find(f=>f.katze).k]||0);
 await click(6,9,.3);await p.waitForFunction(()=>!(JMDEBUG.S.forage.farm||[]).some(f=>f.katze),null,{timeout:20000});
 const n1=await p.evaluate(k=>JMDEBUG.S.inv[k]||0,gift.k);assert.equal(n1,n0+1);await reload();assert.equal(await p.evaluate(k=>JMDEBUG.S.inv[k]||0,gift.k),n0+1);assert.ok(!await S(()=>(JMDEBUG.S.forage.farm||[]).some(f=>f.katze)),'Geschenk nur einmal');
 row.result={h:3,gift:gift.k};}
if(seg==='hund'){ // W20
 await p.waitForTimeout(800);await tapDog(0);await pickChoice('Der Spur folgen');await dialogs();assert.equal((await T3()).hund.st,'folgen');
 await reload();assert.equal((await T3()).hund.st,'folgen');assert.ok(await S(()=>JMDEBUG.M.decor.filter(d=>d.k==='pfote').length>5),'Pfotenspur');
 await walk(13,12);await walk(13,15);await walk(19,15);await p.waitForTimeout(600);row.shots.push(await shot('hund-spur'));await walk(24,17);await walk(24,19); // Vor den Baum treten: Janina und Grabstelle bleiben frei sichtbar.
 const m0=await S(()=>JMDEBUG.S.money),a0=await S(()=>JMDEBUG.S.inv.amethyst||0);row.shots.push(await shot('hund-grabstelle'));await click(25,18,.2);await seenText(/Blechdose/);await dialogs();
 assert.equal(await S(()=>JMDEBUG.S.money),m0+120);assert.equal(await S(()=>JMDEBUG.S.inv.amethyst),a0+1);assert.deepEqual((await T3()).hund.found,['weide']);
 assert.ok(!await S(()=>JMDEBUG.M.obj.some(o=>o.k==='grabstelle')),'Grabstelle weg');await reload();assert.equal(await S(()=>JMDEBUG.S.money),m0+120,'Belohnung genau einmal');
 row.result={found:'weide'};}
if(seg==='ziege'){ // W18
 await p.waitForFunction(()=>{const a=JMDEBUG.PETS.find(q=>q.id==='ziege');return a&&Math.abs(a.x-12)<.1&&Math.abs(a.y-12)<.1;},null,{timeout:30000});await p.waitForTimeout(600);row.shots.push(await petShot('ziege-nascht','ziege'));
 await tapPet('ziege');await pickChoice('Heu geben');await dialogs();assert.equal((await T3()).ziege.steal.st,'satt');assert.equal(await S(()=>JMDEBUG.S.inv.futter),undefined);
 await reload();await fixTime(670);await p.waitForTimeout(1500);assert.ok(await S(()=>JMDEBUG.S.field['11,12'].c),'Tomate gerettet');assert.equal((await T3()).ziege.stolen,0);
 // ohne Gegenmaßnahme: Fixture nächster Naschtag, Verlust genau einer Randpflanze
 await S(()=>{const s=JMDEBUG.S;s.day+=2;s.min=600;s.tiere.ziege.steal={day:s.day,x:11,y:12,k:'tomate',st:'plan'};JMDEBUG.refreshPost();});await p.waitForTimeout(1500);
 await fixTime(662);await p.waitForFunction(()=>JMDEBUG.S.tiere.ziege.stolen===1,null,{timeout:20000});await p.waitForTimeout(400);await walk(13,14); // Seitlich stehen, damit Janina die Ziege im Beleg nicht verdeckt.
 row.shots.push(await shot('ziege-gefressen'));
 assert.equal(await S(()=>JMDEBUG.S.field['11,12'].c.a),3,'Tomate wächst nach');assert.ok(await S(()=>JMDEBUG.S.field['11,14'].c),'nur eine Pflanze');
 // Wegschicken
 await S(()=>{const s=JMDEBUG.S;s.day+=2;s.min=600;s.tiere.ziege.steal={day:s.day,x:11,y:14,k:'zwiebel',st:'plan'};JMDEBUG.refreshPost();});await p.waitForTimeout(1500);
 await p.waitForFunction(()=>{const a=JMDEBUG.PETS.find(q=>q.id==='ziege');return a&&Math.abs(a.y-14)<.1&&!a.moving;},null,{timeout:30000});await tapPet('ziege');await pickChoice('zurück auf die Weide');await dialogs();
 assert.equal((await T3()).ziege.steal.st,'verhindert');await fixTime(670);await p.waitForTimeout(1200);assert.equal((await T3()).ziege.stolen,1);assert.ok(await S(()=>JMDEBUG.S.field['11,14'].c));
 await book('friends');assert.match(await bookText(),/Genascht: 1 · verhindert: 1/);await close();row.result={stolen:1,foiled:1};}
if(seg==='teich'){ // W21 Teich, W22 Zucht
 await walk(13,27);await click(12,27,.6);await p.getByRole('heading',{name:'Ein Ententeich',exact:true}).waitFor();await panelBtn('[data-a="teich"]');
 assert.equal((await T3()).teich.st,'bau');assert.equal(await S(()=>JMDEBUG.S.money),before.money-600);assert.equal(await S(()=>JMDEBUG.S.inv.stein),undefined);
 await reload();assert.equal((await T3()).teich.st,'bau');assert.equal(await S(()=>JMDEBUG.S.money),before.money-600);
 await night();await farmFromHouse();await goTo(13,20);await walk(13,25);assert.equal((await T3()).teich.st,'fertig');assert.ok(await S(()=>JMDEBUG.M.t[26][8]===JM.T.WASSER),'Teich ist Wasser');

 await p.waitForFunction(()=>JMDEBUG.PETS.filter(q=>q.anim==='schwimm').length===2,null,{timeout:20000});/* Bildausschnitt: oberhalb des Teichs stehen */await walk(10,24);
 if(gfx==='2d'){/* Bodenbild: drei Teichkacheln sind auf dem Bildschirm blau (Teich sichtbar gebaut, nicht nur in den Daten) */
  const px=await p.evaluate(()=>{const d=JMDEBUG,c=document.getElementById('game'),g=c.getContext('2d'),k=c.width/c.getBoundingClientRect().width;return [[7,27],[10,25],[8,26]].map(([tx,ty])=>{const x=Math.round(((tx*16+3-Math.round(d.cam.x))*d.scale)*k),y=Math.round(((ty*16+12-Math.round(d.cam.y))*d.scale)*k);return [...g.getImageData(x,y,1,1).data];});});
  assert.ok(px.filter(q=>q[2]>q[1]&&q[2]>q[0]+30).length>=2,'Teichkacheln blau statt Gras '+JSON.stringify(px));}
await p.waitForTimeout(800);row.shots.push(await petShot('teich-enten','ente0'));
 await click(12,26,.4);await p.waitForFunction(()=>JMDEBUG.S.inv.futter===4&&JMDEBUG.idle,null,{timeout:20000});await p.waitForTimeout(300);assert.deepEqual(await S(()=>[JMDEBUG.S.tiere.futterE.n,JMDEBUG.S.inv.futter]),[2,4]);
 await tapPet('ente1');assert.equal((await T3()).enten[1].h,1);
 // Zucht-Fixture: beide Enten seit Tagen mit 3 Herzen, Teich seit vier Tagen fertig (statt vier echte Tage warten)
 await S(()=>{const t=JMDEBUG.S.tiere;t.enten.forEach(e=>e.h=3);t.teich.done=JMDEBUG.S.day-4;});await reload();
 await backHome();await sleep();const E=(await T3()).enten;assert.equal(E.length,3,'Küken geschlüpft');const kid=E[2];assert.equal(kid.mother,'Emma');assert.equal(kid.father,'Ede');assert.ok(['w','g'].includes(kid.g[0])&&['A','g'].includes(kid.g[1]));
 await farmFromHouse();await goTo(13,20);await walk(13,25);await walk(10,24);await p.waitForTimeout(1500);row.shots.push(await petShot('teich-kueken','ente2'));
 await book('friends');const bt=await bookText();assert.match(bt,/Eltern: Emma × Ede/);assert.match(bt,new RegExp(kid.n));/* Bild auf den Entenabschnitt richten */await p.evaluate(()=>{const el=[...document.querySelectorAll('body *')].filter(e=>/Eltern: Emma/.test(e.textContent)).sort((a,b)=>a.textContent.length-b.textContent.length)[0];el&&el.scrollIntoView({block:'center'});});await p.waitForTimeout(400);row.shots.push(await shot('teich-tagebuch'));await close();
 await reload();assert.deepEqual((await T3()).enten,E);row.result={kid:kid.n,c:kid.c,g:kid.g};}
if(seg==='rettung'){ // W23
 await click(10,14,.3);await seenText(/Kätzchen/);await dialogs();assert.equal((await T3()).rettung.st,'pflege');
 await walk(13,9);await walk(13,2);await click(13,0);await map('farm');await walk(13,20);await walk(12,21);
 const careOnce=async()=>{await click(12,20,.3);await p.waitForTimeout(600);await dialogs();};
 await careOnce();assert.equal((await T3()).rettung.care.length,1);assert.equal(await S(()=>JMDEBUG.S.inv.milch),2);
 await reload();await careOnce();assert.equal(await S(()=>JMDEBUG.S.inv.milch),2,'einmal am Tag');/* Bildausschnitt: zur Seite treten, damit Janina den Korb nicht verdeckt */await dialogs();await walk(14,22);await p.waitForTimeout(700);row.shots.push(await shot('rettung-korb'));
 for(let d=2;d<=3;d++){await night();await farmFromHouse();await goTo(13,20);await walk(12,21);await careOnce();assert.equal((await T3()).rettung.care.length,d);}
 await night();await farmFromHouse();await goTo(13,20);await walk(12,21);await click(12,20,.3);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog,null,{timeout:20000});await pickChoice('Es bleibt bei uns');await dialogs();
 assert.equal((await T3()).rettung.st,'adoptiert');await p.waitForFunction(()=>JMDEBUG.PETS.some(q=>q.id==='pip'),null,{timeout:20000});
 await reload();assert.equal((await T3()).rettung.st,'adoptiert');assert.ok(!await S(()=>JMDEBUG.M.obj.some(o=>o.k==='pflegekorb')));await p.waitForTimeout(800);row.shots.push(await petShot('rettung-pip','pip'));
 row.result={st:'adoptiert'};}
if(seg==='rene'){ // Nebenaufgabe: Klärung des Missverständnisses vor automatischem Kuscheln
 await S(()=>{JMDEBUG.S.rene.cudToday=0;});await p.waitForFunction(()=>JMDEBUG.RA.vis,null,{timeout:20000});
 await S(()=>{JMDEBUG.speed=12;});await p.waitForTimeout(9000);await S(()=>{JMDEBUG.speed=1;});
 assert.equal(await S(()=>JMDEBUG.busy.ui.dialog),false,'kein Kuscheln, solange die Klärung wartet');assert.equal(await S(()=>JMDEBUG.S.rene.cuddles||0),0);
 await tapRene();await seenText(/so ernst/);await pickChoice('Sag mir ehrlich');await dialogs();assert.equal(await S(()=>JMDEBUG.S.rom.mv.st),'fertig');
 assert.equal(await S(()=>JM.Rom.storyPending(JMDEBUG.S)),false,'danach darf René wieder kuscheln');row.result={mv:'fertig'};}

}catch(e){failed++;row.error=String(e&&e.stack||e).slice(0,900);console.error('FEHLER',seg,viewport.width,gfx,row.error);try{await diag('fehler');}catch(_){}}
const raf=await p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now();(function f(){n++;if(performance.now()-t<1000)requestAnimationFrame(f);else r(n);})();}));row.raf=raf;if(raf<5){failed++;row.error=(row.error||'')+' rAF '+raf;}
row.dialogBounds=dialogBounds;row.errors=errors.slice();if(errors.length){failed++;console.error('SEITENFEHLER',seg,viewport.width,gfx,errors);}
report.push(row);console.log(JSON.stringify({seg,width:viewport.width,gfx,ok:!row.error&&!errors.length,raf,result:row.result,error:row.error}));await c.close();}}
finally{await b.close();fs.writeFileSync(path.join(out,'report-'+SEGS.join('_')+'-'+(process.env.VIEWPORT||'alle')+'-'+(process.env.GFX||'alle')+'.json'),JSON.stringify(report,null,2));}
if(failed){console.error('FEHLGESCHLAGEN',failed);process.exitCode=1;}else console.log('OK etappe3-browser',SEGS.join(','));})().catch(e=>{console.error(e);process.exit(1);});
