/* Tipp-Vorrang „Gegenstand vor Figur“ (Renés Entscheidung, Etappe 1b).
   Trifft ein echter Bildschirmklick ein interaktives Objekt (Briefkasten, Versandkiste, Beet, Möbel),
   läuft immer die Objektaktion – auch wenn René oder ein Hund direkt daneben oder davor steht.
   Ein Gespräch gibt es nur, wenn die Figur selbst getroffen wird. René beginnt kein Kuscheln,
   solange die Spielerin unterwegs ist oder gerade getippt hat.
   Jeder Fall wird einzeln bewertet und gemeldet, damit der Rot-Nachweis alle Fälle zeigt.
   Aufruf: node tests/tipp-vorrang.cjs   (BASE_URL, VIEWS=390-2d,1440-3d … optional) */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-tippvorrang';fs.mkdirSync(out,{recursive:true});
const BASE=process.env.BASE_URL||'http://127.0.0.1:8765/';
const VIEWS=(process.env.VIEWS||'390-2d,390-3d,1440-2d,1440-3d').split(',');
const results=[];
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
for(const v of VIEWS){const [w,gfx]=v.split('-'),viewport=w==='390'?{width:390,height:844}:{width:1440,height:900};
 const c=await b.newContext({viewport,deviceScaleFactor:w==='390'?2:1}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(BASE);await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok);
 await p.evaluate(gfx=>{const d=JMDEBUG,s=d.newState('Tippvorrang',[{name:'A',fell:'weiss'},{name:'B',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.flags.letter=true;s.flags.caveSeen=s.flags.villageSeen=s.flags.forestSeen=true;
  s.rene.met=true;s.rene.bf=3;s.rene.cudToday=2;s.qDone=JM.QUESTS.map(q=>q.id);s.daily={day:3,goals:[]};s.day=3;s.min=1000;s.weather='sun';s.follow=false;s.hold='auto';s.maxE=200;s.energy=200;
  s.map='farm';s.px=5;s.py=8;d.startGame(s,false);},gfx);
 for(let i=0;i<2;i++)await p.locator('#zOut').click();await p.waitForTimeout(900);
 const freeze=()=>p.evaluate(()=>{const d=JMDEBUG,z=d.zoomy();z.t=0;z.cool=1e9;for(const g of d.DOGS){g.timer=1e9;g.tx=g.x;g.ty=g.y;}d.RA.timer=1e9;d.RA.path=[];d.RA.cuddle=false;});
 async function place(o){await p.evaluate(o=>{const d=JMDEBUG;if(o.rene){d.RA.x=o.rene[0];d.RA.y=o.rene[1];}if(o.dog){const g=d.DOGS[0];g.x=g.tx=o.dog[0];g.y=g.ty=o.dog[1];}if(o.dog2){const g=d.DOGS[1];g.x=g.tx=o.dog2[0];g.y=g.ty=o.dog2[1];}d.RA.path=[];d.RA.timer=1e9;for(const g of d.DOGS)g.timer=1e9;},o);await p.waitForTimeout(350);await freeze();}
 async function screen(wx,wy,h){return p.evaluate(({wx,wy,h,gfx})=>gfx==='3d'?JM.R3.proj(wx,wy,h).map(n=>n/devicePixelRatio):[(wx*16-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(wy*16-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{wx,wy,h,gfx});}
 /* 3D: wie eine Spielerin auf den sichtbaren Teil des Gegenstands tippen. Gesucht wird ein Punkt über dem Gegenstand,
    an dem der Strahl keine Figur trifft (alter und neuer Stand liefern dann dieselbe Kachel). Steht die Figur sichtbar
    davor, gilt sie als getroffen (Gegenprobe Markt in desktop-rest). */
 async function objectPoint(tx,ty,hs,fx=tx,fy=ty,fw=1,fh=1){if(gfx!=='3d')return null;return p.evaluate(({tx,ty,hs,fx,fy,fw,fh})=>{for(const h of hs)for(const dx of [0,-.25,.25])for(const dz of [0,-.25,.2]){const r=JM.R3.proj(tx+.5+dx,ty+.5+dz,h).map(n=>n/devicePixelRatio),k=JM.R3.pick(r[0],r[1]);
  if(k&&!k.actor&&!k.collectible&&Math.floor(k.wx)>=fx&&Math.floor(k.wx)<fx+fw&&Math.floor(k.wy)>=fy&&Math.floor(k.wy)<fy+fh)return r;}return null;},{tx,ty,hs,fx,fy,fw,fh});}
 async function clickObj(tx,ty,wx,wy,hs,fp){if(gfx!=='3d')return clickAt(wx,wy,0);const px=await objectPoint(tx,ty,hs,...(fp||[]));if(!px)throw Error('Gegenstand '+tx+','+ty+' nirgends sichtbar');
  const el=await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,px);if(el!=='CANVAS')throw Error('verdeckt '+el);await p.mouse.click(...px);return px;}
 async function clickAt(wx,wy,h){const px=await screen(wx,wy,h);const el=await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,px);
  if(!(px[0]>0&&px[0]<viewport.width&&px[1]>0&&px[1]<viewport.height)||el!=='CANVAS')throw Error('Ziel nicht klickbar '+JSON.stringify({px,el}));await p.mouse.click(...px);return px;}
 async function ui(){return p.evaluate(()=>({dialog:JMDEBUG.busy.ui.dialog,panel:JMDEBUG.busy.ui.panel,h2:JMDEBUG.busy.ui.panel?document.querySelector('#panel h2')?.innerText:'',dlg:JMDEBUG.busy.ui.dialog?document.querySelector('#dlg').innerText.slice(0,90):''}));}
 async function waitUi(pred,ms){const t0=Date.now();let u=await ui();while(Date.now()-t0<ms){u=await ui();if(pred(u))return u;await p.waitForTimeout(150);}return u;}
 async function reset(){for(let i=0;i<12;i++){const u=await ui();if(u.dialog){const ch=p.locator('#dlg button',{hasText:'Streicheln'});if(await ch.count())await ch.first().click();else await p.locator('#dlg').click();await p.waitForTimeout(250);continue;}
   if(u.panel){await p.locator('#panel [data-a="close"], #panel [data-a="no"]').first().click();await p.waitForTimeout(250);continue;}break;}
  await p.waitForFunction(()=>JMDEBUG.idle,null,{timeout:15000});}
 async function walkTo(x,y){await p.evaluate(([x,y])=>{const d=JMDEBUG;d.setMap(d.M.id,x,y);},[x,y]);await p.waitForTimeout(300);}
 async function shot(n){const f=path.join(out,v+'-'+n+'.png');await p.screenshot({path:f});return f;}
 async function run(name,fn){let ok=false,detail='';try{detail=await fn();ok=true;}catch(e){detail=String(e.message||e).slice(0,300);}
  results.push({view:v,name,ok,detail});console.log((ok?'GRÜN':'ROT ')+' '+v+' '+name+' '+detail);await reset().catch(()=>{});}
 // Fall 1: René steht direkt vor dem Briefkasten (7,7), Spielerin tippt auf den Briefkasten.
 await run('briefkasten-rene-davor',async()=>{await walkTo(5,8);await place({rene:[7,8],dog:[3,7],dog2:[2,7]});
  await clickObj(7,7,7.5,7.45,[.6,.8,.95,.4]);const u=await waitUi(u=>u.dialog||u.panel,12000);await shot('briefkasten');if(u.dialog)throw Error('Gespräch statt Briefkasten: '+u.dlg);if(u.h2!=='Briefkasten')throw Error('kein Briefkasten: '+JSON.stringify(u));return 'Briefkasten offen';});
 // Fall 2: Hund steht an der Versandkiste (9,7).
 await run('versandkiste-hund-daneben',async()=>{await walkTo(5,8);await place({rene:[12,9],dog:[9.2,7.8],dog2:[2,7]});
  await clickObj(9,7,9.5,7.45,[.5,.7,.9,.3]);const u=await waitUi(u=>u.dialog||u.panel,12000);if(u.dialog)throw Error('Gespräch statt Versandkiste: '+u.dlg);if(u.h2!=='Versandkiste')throw Error('keine Versandkiste: '+JSON.stringify(u));return 'Versandkiste offen';});
 // Fall 3: René steht am Beet (5,10); Tipp auf das Beet gräbt um.
 await run('beet-rene-daneben',async()=>{await walkTo(5,8);await place({rene:[5.3,9.6],dog:[3,7],dog2:[2,7]});
  const before=await p.evaluate(()=>!!(JMDEBUG.S.field['5,10']||{}).t);if(before)throw Error('Beet schon umgegraben');
  await clickAt(5.5,10.5,.05);const t0=Date.now();let u;while(Date.now()-t0<12000){u=await ui();if(u.dialog)break;if(await p.evaluate(()=>!!(JMDEBUG.S.field['5,10']||{}).t))break;await p.waitForTimeout(150);}
  u=await ui();if(u.dialog)throw Error('Gespräch statt Beet: '+u.dlg);if(!await p.evaluate(()=>!!(JMDEBUG.S.field['5,10']||{}).t))throw Error('Beet nicht umgegraben');return 'Beet umgegraben';});
 // Fall 4: Möbel im Haus (Fernseher 8,3) mit René davor.
 // Fall 4: Möbel im Haus. Um 22:10 steht René werktags am Bett (renePlan „bed“, Ziel 10,4); Tipp auf das Bett (11–12,3–4).
 await run('moebel-rene-daneben',async()=>{await p.evaluate(()=>{JMDEBUG.S.min=1330;JMDEBUG.setMap('haus',8,6);});await p.waitForTimeout(700);await place({rene:[10,4]});
  if(!await p.evaluate(()=>JMDEBUG.RA.vis&&JMDEBUG.M.id==='haus'))throw Error('René nicht im Haus sichtbar');
  await clickObj(12,4,11.2,4.5,[.4,.6,.8],[11,3,2,2]);const u=await waitUi(u=>u.dialog||u.panel,12000);await shot('moebel');
  if(u.dialog)throw Error('Gespräch statt Bett: '+u.dlg);if(u.h2!=='Schlafen gehen?')throw Error('kein Bett '+JSON.stringify(u));return 'Möbel: '+u.h2;});
 // Gegenproben: Figur selbst getroffen → Gespräch.
 await run('rene-selbst-getroffen',async()=>{await p.evaluate(()=>{JMDEBUG.S.min=1000;JMDEBUG.setMap('farm',5,8);});await p.waitForTimeout(600);await place({rene:[7,9],dog:[3,7],dog2:[2,7]});
  if(!await p.evaluate(()=>JMDEBUG.RA.vis&&JMDEBUG.M.id==='farm'))throw Error('René nicht sichtbar');
  await clickAt(7.5,gfx==='3d'?9.5:9.3,.8);const u=await waitUi(u=>u.dialog||u.panel,12000);if(!u.dialog)throw Error('kein Gespräch mit René: '+JSON.stringify(u));if(/großen Augen/.test(u.dlg))throw Error('Hund statt René');return 'René: '+u.dlg.slice(0,40);});
 await run('hund-selbst-getroffen',async()=>{await walkTo(5,8);await place({rene:[12,9],dog:[3,9],dog2:[2,7]});
  await clickAt(3.5,gfx==='3d'?9.5:9.6,.3);const u=await waitUi(u=>u.dialog||u.panel,12000);await p.waitForTimeout(500);if(!u.dialog||!await p.locator('#dlg button',{hasText:'Streicheln'}).count())throw Error('kein Hundedialog: '+JSON.stringify(u));return 'Hund: '+u.dlg.slice(0,40);});
 // René-Selbstansprechen: Spielerin läuft los → kein Kuscheldialog unterwegs.
 await run('rene-unterbricht-laufweg-nicht',async()=>{await walkTo(5,8);await place({rene:[12,9],dog:[3,7],dog2:[2,7]});
  await clickAt(9.5,8.5,.05);await p.evaluate(()=>{const d=JMDEBUG;d.S.rene.cudToday=0;d.RA.x=Math.round(d.P.x);d.RA.y=Math.round(d.P.y)+1;d.RA.path=[];d.RA.cuddle=true;});
  const t0=Date.now();let u;while(Date.now()-t0<9000){u=await ui();if(u.dialog)break;if(await p.evaluate(()=>JMDEBUG.idle&&Math.round(JMDEBUG.P.x)===9))break;await p.waitForTimeout(100);}
  u=await ui();if(u.dialog)throw Error('René unterbricht den Laufweg: '+u.dlg);if(!await p.evaluate(()=>Math.round(JMDEBUG.P.x)===9&&Math.round(JMDEBUG.P.y)===8))throw Error('Ziel nicht erreicht');
  await p.evaluate(()=>{JMDEBUG.S.rene.cudToday=2;JMDEBUG.RA.cuddle=false;});return 'Laufweg ohne Unterbrechung';});
 // Gegenprobe: steht die Spielerin still, darf René weiterhin kuscheln kommen.
 await run('rene-kuschelt-wenn-ruhig',async()=>{await walkTo(9,8);await p.waitForTimeout(2600);await place({rene:[9,9]});await p.evaluate(()=>{const d=JMDEBUG;d.S.rene.cudToday=0;d.RA.cuddle=true;});
  const u=await waitUi(u=>u.dialog,8000);await p.evaluate(()=>{JMDEBUG.S.rene.cudToday=2;});if(!u.dialog)throw Error('René kuschelt nicht, obwohl Spielerin ruhig steht');return 'Kuscheln: '+u.dlg.slice(0,40);});
 const raf=await p.evaluate(()=>new Promise(r=>{let n=0;const f=()=>{if(++n>=10)r(n);else requestAnimationFrame(f);};requestAnimationFrame(f);}));
 results.push({view:v,name:'keine-fehler+spielschleife',ok:errors.length===0&&raf>=10,detail:JSON.stringify(errors).slice(0,300)});console.log((errors.length?'ROT ':'GRÜN')+' '+v+' keine-fehler '+JSON.stringify(errors).slice(0,200));
 await c.close();}
}finally{await Promise.race([b.close(),new Promise(r=>setTimeout(r,8000))]);}
fs.writeFileSync(path.join(out,'ergebnis.json'),JSON.stringify(results,null,1));
const bad=results.filter(r=>!r.ok);console.log(bad.length?'ROT: '+bad.length+' von '+results.length+' Fällen':'OK: alle '+results.length+' Fälle grün');if(bad.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>process.exit());
