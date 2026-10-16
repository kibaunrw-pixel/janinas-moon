/* Dorfbahnhof (Etappe 1b, Zusatzauftrag C): Bild und Bedienung nach der Umgestaltung.
   390×844 (DPR 2) und 1440×900, 2D und 3D. Echte Bildschirmklicks auf Zug, Fahrplantafel und Bahnhofsgebäude öffnen
   die Zugfahrt; Gleise sind nicht begehbar; Ausgang ins Dorf und Rückweg aus Lindenstadt funktionieren; Spielschleife
   läuft; keine Fehler. Bilder: Dorfbahnhof und Bahnhof Lindenstadt je Ansicht. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-bahnhof';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const report=[];try{for(const viewport of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
if(process.env.VIEWPORT&&viewport.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
const c=await b.newContext({viewport,deviceScaleFactor:viewport.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await p.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok);const tag=viewport.width+'-'+gfx,S=(e,a)=>p.evaluate(e,a);
await p.evaluate(gfx=>{const s=JMDEBUG.newState('Bahnhof',[{name:'A',fell:'weiss'},{name:'B',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.flags.letter=true;s.flags.villageSeen=true;s.rene.met=true;s.qDone=JM.QUESTS.map(q=>q.id);s.day=3;s.min=600;s.weather='sun';s.map='bahnhof';s.px=2;s.py=9;JMDEBUG.startGame(s,false);},gfx);
for(let i=0;i<(gfx==='3d'?4:2);i++)await p.locator('#zOut').click();await p.waitForTimeout(1200);
async function alive(id){await p.bringToFront();const a=await S(()=>JM.ENG.gameT);await p.waitForTimeout(600);assert.ok(await S(()=>JM.ENG.gameT)>a,'Spielschleife läuft auf '+id);assert.deepEqual(errors,[],'keine Fehler auf '+id);}
async function map(id){await p.waitForFunction(id=>JMDEBUG.M.id===id&&!JMDEBUG.busy.ui.fade,id,{timeout:20000});await alive(id);}
async function px(x,y,h){return S(({x,y,h,gfx})=>gfx==='3d'?JM.R3.proj(x,y,h).map(n=>n/devicePixelRatio):[(x*16-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{x,y,h,gfx});}
/* Liegt das Ziel außerhalb des Bildes oder unter der Anzeige, geht die Figur wie bei einer Spielerin erst per Tipp auf
   sichtbaren freien Boden in die Nähe (keine Teleports). */
async function visible(r){return r[0]>0&&r[0]<viewport.width&&r[1]>0&&r[1]<viewport.height&&await S(([a,b])=>document.elementFromPoint(a,b)?.tagName,r)==='CANVAS';}
async function approach(x,y,h){for(let k=0;k<8;k++){if(await visible(await px(x,y,h)))return;const cand=await S(({x,y})=>{const m=JMDEBUG.M,out=[];for(let ty=0;ty<m.h;ty++)for(let tx=0;tx<m.w;tx++)if(JM.WALK.has(m.t[ty][tx])&&!m.exits.some(e=>e.x===tx&&e.y===ty)&&!m.obj.some(o=>tx>=o.x&&tx<o.x+(o.w||1)&&ty>=o.y&&ty<o.y+(o.h||1)))out.push([tx,ty]);return out.sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y));},{x,y});
 for(const [tx,ty] of cand){const r=await px(tx+.5,ty+.5,.02);if(await visible(r)&&(gfx!=='3d'||await S(({r,tx,ty})=>{const k=JM.R3.pick(r[0],r[1]);return k&&!k.obj&&!k.actor&&!k.collectible&&Math.floor(k.wx)===tx&&Math.floor(k.wy)===ty;},{r,tx,ty}))){await p.mouse.click(...r);await p.waitForTimeout(400);await p.waitForFunction(()=>JMDEBUG.idle,null,{timeout:15000});await p.waitForTimeout(1000);break;}}}}
async function tap(x,y,h){await approach(x,y,h);const r=await px(x,y,h);if(!await visible(r)){console.error('VERDECKT',JSON.stringify({x,y,h,r,el:await S(([a,b])=>document.elementFromPoint(a,b)?.outerHTML.slice(0,120),r),p:await S(()=>[JMDEBUG.P.x,JMDEBUG.P.y,JMDEBUG.M.id])}));await shot('verdeckt');}assert.ok(r[0]>0&&r[0]<viewport.width&&r[1]>0&&r[1]<viewport.height,'sichtbar '+JSON.stringify({x,y,r}));assert.equal(await S(([a,b])=>document.elementFromPoint(a,b)?.tagName,r),'CANVAS');await p.mouse.click(...r);}
async function trainPanel(){await p.locator('[data-a="ride"]').waitFor({timeout:15000});const t=await p.locator('#panel h2').innerText();await p.locator('#panel [data-a="close"]').click();await p.waitForFunction(()=>!JMDEBUG.busy.ui.panel);await p.waitForFunction(()=>JMDEBUG.idle,null,{timeout:10000});return t;}
async function shot(n){const f=path.join(out,n+'-'+tag+'.png');await p.waitForTimeout(500);await p.screenshot({path:f});return f;}
const row={tag,shots:[]};await alive('bahnhof');
// Begehbarkeit: Gleise blockieren, Bahnsteig/Weg/Ausgang erreichbar
const walk=await S(()=>{const m=JMDEBUG.M,W=JM.WALK;return {gleis:[3,8,15].every(x=>!W.has(m.t[1][x])&&!W.has(m.t[2][x])),kante:[2,8,15].every(x=>W.has(m.t[3][x])),weg:W.has(m.t[9][0])&&W.has(m.t[9][12])};});assert.deepEqual(walk,{gleis:true,kante:true,weg:true});
row.shots.push(await shot('dorfbahnhof'));
// wie eine Spielerin zur Bahnsteigmitte gehen, damit Zug und Gebäude im Bild sind
await tap(6.5,8.5,gfx==='3d'?.05:0);await p.waitForFunction(()=>JMDEBUG.idle&&Math.round(JMDEBUG.P.x)===6,null,{timeout:15000});await tap(9.5,7.5,gfx==='3d'?.05:0);await p.waitForFunction(()=>JMDEBUG.idle&&Math.round(JMDEBUG.P.x)===9,null,{timeout:15000});await p.waitForTimeout(800);row.shots.push(await shot('dorfbahnhof-bahnsteig'));
// Zug (Wagenmitte), Fahrplantafel und Bahnhofsgebäude: jeweils echte Zugfahrt-Auswahl
row.zug=(await tap(10.5,2.6,gfx==='3d'?1:0),await trainPanel());
await tap(11.5,8.3,gfx==='3d'?1.1:0);row.fahrplan=await trainPanel();
await tap(13.5,8.5,gfx==='3d'?.9:0);row.gebaeude=await trainPanel();
// Tipp auf die Schienen links: Spielerin bleibt auf dem Bahnsteig, steht nie auf dem Gleis
await approach(3.5,1.6,gfx==='3d'?.2:0);if(gfx==='3d')console.error('GLEISPICK',JSON.stringify(await S(()=>{const r=JM.R3.proj(3.5,1.6,.2).map(n=>n/devicePixelRatio);return {r,k:JM.R3.pick(r[0],r[1]),p:[JMDEBUG.P.x,JMDEBUG.P.y],panel:JMDEBUG.busy.ui.panel};})));await tap(3.5,1.6,gfx==='3d'?.2:0);await p.waitForTimeout(2500);await p.waitForFunction(()=>JMDEBUG.idle,null,{timeout:15000});const pp=await S(()=>[Math.round(JMDEBUG.P.x),Math.round(JMDEBUG.P.y)]);assert.ok(pp[1]>=3,'nicht auf dem Gleis: '+pp);
// Zugfahrt nach Lindenstadt und zurück, Bild vom Bahnhof Lindenstadt
await tap(9.5,7.5,gfx==='3d'?.02:0);await p.waitForFunction(()=>JMDEBUG.idle&&Math.round(JMDEBUG.P.x)===9,null,{timeout:15000});await p.waitForTimeout(900);await tap(11.5,8.3,gfx==='3d'?1.1:0);await p.locator('[data-a="ride"]').click();await map('stadt');await p.waitForTimeout(800);row.shots.push(await shot('bahnhof-lindenstadt'));
await tap(14.5,19.3,gfx==='3d'?1.1:0);await p.locator('[data-a="ride"]').click();await map('bahnhof');
await tap(4.5,9.5,gfx==='3d'?.05:0);await p.waitForFunction(()=>JMDEBUG.idle&&Math.round(JMDEBUG.P.x)===4,null,{timeout:15000});await p.waitForTimeout(600);await tap(.5,9.5,gfx==='3d'?.05:0);await map('village');
assert.deepEqual(errors,[]);report.push(row);console.log('Bahnhof',tag,'OK',JSON.stringify({zug:row.zug,fahrplan:row.fahrplan,gebaeude:row.gebaeude}));await c.close();}
fs.writeFileSync(path.join(out,'bahnhof-browser.json'),JSON.stringify(report,null,2));}finally{await Promise.race([b.close(),new Promise(r=>setTimeout(r,8000))]);}})().catch(e=>{console.error(e);process.exitCode=1;})
/* Chrome-Hilfsprozesse halten sonst die Ausgabe offen (siehe briefe-browser.cjs). */
.finally(()=>process.exit());
