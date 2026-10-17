/* Etappe 5 – Rahmung und Bildbelege: Lindenstadt Stufe 1 bis 5, Baustelle, neue Gebäude, Park, Feldstück, Wettbewerbsstand,
   Trophäenwand, Sterne-Anzeige mit „Nächstes Ziel“, Timos Materialverkauf, Werkzeuge, Großauftrag und Wettbewerb.
   Weltmotive: alle Ecken (links/rechts unten, Dachspitze) liegen zwischen HUD-Leisten und sind nicht verdeckt (elementFromPoint = CANVAS).
   Fenster: Panel vollständig im Bild, kein Text ragt seitlich heraus, Schrift mindestens 11 px.
   Fixtures setzen nur Ort, Tag, Stadtstufe, Hofstand, Vorräte und bereits erreichte Erfolge (kein Erfolgsbanner über dem Motiv);
   Fenster werden über echte Bildschirmklicks geöffnet. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||path.join(__dirname,'..','docs','belege','etappe5');fs.mkdirSync(out,{recursive:true});
// objs: Motive, die vollständig sichtbar sein müssen ('k' oder 'k@act'); H = 3D-Höhe der Dachspitze
const H={baeckerei:3.1,blumenladen:3.1,villa:3.9,hotel:4.6,parkpavillon:2.8,fountain:1.3,bank:.7,blumenbeet:.5,stadtplan:1.6,auftragstafel:1.6,bauschild:1.2,bau1:1,bau2:1.6,bau3:2.6,wettbewerbstand:1.9,trophaeen:1.8,blumenkuebel:.8,villazaun:1};
const SCENES={
 stufe1:{map:'stadt',px:21,py:10,stufe:1,objs:['stadtplan','auftragstafel','bauschild@ziele:plan']},
 baustelle:{map:'stadt',px:30,py:7,stufe:1,bau:2,phase:1,objs:['bau2']},
 stufe2_baeckerei:{map:'stadt',px:30,py:7,stufe:2,objs:['baeckerei']},
 stufe3_blumenladen:{map:'stadt',px:37,py:7,stufe:3,objs:['blumenladen']},
 stufe3_park:{map:'stadt',px:30,py:19,stufe:3,objs:['parkpavillon','fountain@ziele:park','bank@ziele:park','blumenbeet']},
 stufe4_villa:{map:'stadt',px:44,py:8,stufe:4,objs:['villa','villazaun']},
 stufe5_hotel:{map:'stadt',px:40,py:21,stufe:5,objs:['hotel']},
 stufe5_gesamt:{map:'stadt',px:36,py:12,stufe:5,objs:['baeckerei','blumenladen','villa','hotel','parkpavillon'],nur:'1440-2d'},
 feldstueck:{map:'farm',px:7,py:19,stufe:1,felder:true,tiles:[[3,20],[11,20],[3,22],[11,22]]},
 wettbewerb:{map:'stadt',px:15,py:18,stufe:2,day:25,objs:['wettbewerbstand']},
 trophaeen:{map:'haus',px:5,py:4,stufe:2,objs:['trophaeen']},
 // Fenster über echte Klicks
 trophaeenwand:{map:'haus',px:5,py:4,stufe:2,ui:'trophaeen',heading:'Trophäenwand',text:/Erster Großauftrag/},
 sterne:{map:'stadt',px:16,py:10,stufe:2,ui:'tagebuch',text:/Stadt-Sterne[\s\S]*Hof-Sterne[\s\S]*Nächstes Ziel/},
 material:{map:'i_zimmerei',px:6,py:6,stufe:2,ui:'counter',heading:'Timos Zimmerei',text:/Bauholz[\s\S]*Bruchstein[\s\S]*Eisenerz/},
 werkzeuge:{map:'i_zimmerei',px:6,py:6,stufe:2,silber:true,ui:'hofausbau',heading:'Hof ausbauen bei Timo',text:/Goldwerkzeug/},
 grossauftrag:{map:'stadt',px:16,py:14,stufe:2,ui:'auftragstafel',heading:/Großauftrag/,text:/G/},
 wettbewerb_fenster:{map:'stadt',px:15,py:18,stufe:2,day:25,inv:{kuerbis:2,koi:1},ui:'wettbewerbstand',heading:'Erntewettbewerb mit Greta',text:/Greta/}
};
const ONLY=process.argv[2]?process.argv[2].split(','):null;
(async()=>{const base=process.env.BASE_URL||'http://127.0.0.1:8765/',b=await chromium.launch({channel:'chrome',headless:true}),rows=[];let failed=0;
try{for(const width of [390,1440])for(const gfx of ['2d','3d'])for(const [scene,fx] of Object.entries(SCENES)){
 if(process.env.VIEWPORT&&width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX||ONLY&&!ONLY.includes(scene))continue;
 const vp={width,height:width===390?844:900},c=await b.newContext({viewport:vp,deviceScaleFactor:width===390?2:1}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const row={scene,width,gfx};
 try{await p.goto(base);await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Ziele);
 await p.evaluate(({gfx,fx})=>{const s=JMDEBUG.newState('Janina',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.day=fx.day||73;s.min=600;s.weather='sun';s.money=38500;s.qDone=JM.QUESTS.map(q=>q.id);s.house={level:2,job:null};
  s.flags.letter=s.flags.forestSeen=s.flags.villageSeen=s.flags.caveSeen=true;for(const id in s.npc)s.npc[id].met=true;s.inv=Object.assign({},fx.inv||{});
  JM.Ausbau.migrate(s);s.city.plots=s.city.plots.map((p,i)=>({start:1,due:2,ready:true,tenant:['ida','noah','mara'][i],since:3,lastRent:72,rating:5}));for(const id of Object.keys(s.post.m))s.post.m[id].st='fertig';
  const z=s.ziele;z.stufe=fx.stufe;for(const id of Object.keys(JM.Ziele.GEB))if(JM.Ziele.GEB[id].stufe<=fx.stufe)z.betrieb[id]={since:70,last:72};if(fx.bau)z.bau={stufe:fx.bau,start:s.day-fx.phase,due:s.day+3-fx.phase};z.hof.felder=!!fx.felder;z.hof.silber=!!fx.silber;z.siege=1;
  z.troph=[{id:'stadt2',t:'Stadtstufe 2 · Marktflecken',day:60},{id:'auftrag1',t:'Erster Großauftrag erfüllt',day:66},{id:'wett-1-0',t:'Erntewettbewerb Frühling · Jahr 1',day:11}];
  s.ach=(JM.ACH||[]).map(a=>a.id);s.mail.forEach(m=>m.read=true);s.daily={day:s.day,goals:[]};
  s.map=fx.map;s.px=fx.px;s.py=fx.py;JMDEBUG.startGame(s,false);},{gfx,fx});
 for(let i=0;i<8;i++){const z0=await p.evaluate(()=>JMDEBUG.S.zoom);await p.locator('#zOut').click();await p.waitForTimeout(120);if(await p.evaluate(()=>JMDEBUG.S.zoom)===z0)break;}await p.waitForTimeout(1600);row.zoom=await p.evaluate(()=>JMDEBUG.S.zoom);
 const pos=await p.evaluate(()=>({map:JMDEBUG.M.id,x:Math.round(JMDEBUG.P.x),y:Math.round(JMDEBUG.P.y)}));
 assert.deepEqual(pos,{map:fx.map,x:fx.px,y:fx.py},'Startort '+scene);
 // Verdeckende Bedienelemente: HUD links oben, Ziel-Kasten, Zoom-/Fotoknöpfe, Werkzeugleiste mit Hinweiszeile
 const covers=()=>p.evaluate(()=>['#clock','#quest','#qToggle','#zoomb','#holdlbl','#barrow'].map(s=>document.querySelector(s)).filter(e=>e&&!e.hidden&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return [e.id,r.left,r.top,r.right,r.bottom];}));
 const free={covers:await covers()};
 Object.assign(row,free);
 // Bildschirmpunkte eines Objekts: unten links/rechts und Dachspitze
 const pts=spec=>p.evaluate(({spec,gfx,H})=>{const [k,act]=spec.split('@'),o=JMDEBUG.M.obj.find(o=>(o.k===k||o.act===k)&&(!act||o.act===act));if(!o)return null;const w=o.w||1,h=o.h||1;
  if(gfx==='3d'){const P=(x,z,y)=>JM.R3.proj(x,z,y).slice(0,2).map(n=>n/devicePixelRatio);return [P(o.x+.05,o.y+h,0),P(o.x+w-.05,o.y+h,0),P(o.x+w/2,o.y+h/2,H[o.k]||1)];}
  const se=JM.season?JM.season(JMDEBUG.S.day):0,sp=JM.ART.prop(o.k,se,false)||{width:w*16,height:h*16},sc=JMDEBUG.scale,cx=Math.round(JMDEBUG.cam.x),cy=Math.round(JMDEBUG.cam.y);
  const mx=o.x*16+w*8,by=(o.y+h)*16,l=mx-sp.width/2+2,r=mx+sp.width/2-2,t=by-sp.height+3;return [[(l-cx)*sc,(by-2-cy)*sc],[(r-cx)*sc,(by-2-cy)*sc],[(mx-cx)*sc,(t-cy)*sc]];},{spec,gfx,H});
 const tilePt=([x,y])=>p.evaluate(({x,y,gfx})=>gfx==='3d'?JM.R3.proj(x+.5,y+.5,0).slice(0,2).map(n=>n/devicePixelRatio):[(x*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{x,y,gfx});
 async function frei(r,what){assert.ok(r[0]>=4&&r[0]<=width-4&&r[1]>=4&&r[1]<=vp.height-4,'Motiv im Bild: '+what+' '+JSON.stringify(r));
  const hit=free.covers.find(([id,l,t,rr,b])=>r[0]>=l-2&&r[0]<=rr+2&&r[1]>=t-2&&r[1]<=b+2);assert.ok(!hit,'Motiv nicht unter '+(hit&&hit[0])+': '+what+' '+JSON.stringify(r));
  const el=await p.evaluate(r=>{const e=document.elementFromPoint(...r);return e?e.tagName+'#'+e.id:'none';},r);
  assert.ok(el.startsWith('CANVAS'),'nicht vom HUD verdeckt: '+what+' '+el);}
 async function clickPt(r){await p.mouse.click(...r);await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog||JMDEBUG.busy.ui.panel,null,{timeout:20000});await p.waitForTimeout(500);}
 async function clickObj(k){const P=await pts(k);assert.ok(P,'Objekt '+k);const m=[(P[0][0]+P[1][0])/2,(P[0][1]*2+P[2][1])/3];await frei(m,k+' Klickpunkt');await clickPt(m);}
 const checked=[];
 if(!fx.ui){
  if(!fx.nur||fx.nur===width+'-'+gfx){for(const k of fx.objs||[]){const P=await pts(k);assert.ok(P,'Motiv vorhanden '+k);for(const [i,r] of P.entries())await frei(r,k+'#'+i);checked.push(k);}
   for(const t of fx.tiles||[])await frei(await tilePt(t),'Kachel '+t);}
 }else{
  if(fx.ui==='trophaeen')await clickObj('trophaeen');
  if(fx.ui==='counter'||fx.ui==='hofausbau'){await clickObj('counter');await p.getByRole('heading',{name:'Timos Zimmerei'}).waitFor();if(fx.ui==='hofausbau'){await p.locator('[data-a="hofausbau"]').click();await p.waitForTimeout(500);}}
  if(fx.ui==='auftragstafel')await clickObj('auftragstafel');
  if(fx.ui==='wettbewerbstand')await clickObj('wettbewerbstand');
  if(fx.ui==='tagebuch'){const q=await p.evaluate(()=>document.querySelector('#quest').innerText);assert.match(q,/Nächstes Ziel|Lindenstadt|Stadtstufe/,'Ziel-Hinweis im HUD');row.hud=q;await p.screenshot({path:path.join(out,`rahmung-sterne-hud-${width}-${gfx}.png`)});
   await p.locator('#bMenu').click();await p.waitForTimeout(500);await p.locator('[data-a="tab"][data-k="ziele"]').first().click();await p.waitForTimeout(600);}
  if(fx.heading)await p.getByRole('heading',{name:fx.heading}).first().waitFor();
  const pan=await p.evaluate(()=>{const P=document.querySelector('#panel'),r=P.getBoundingClientRect(),bad=[],small=[];
   for(const e of P.querySelectorAll('*')){const b=e.getBoundingClientRect();if(!b.width||!b.height)continue;const scroller=(()=>{for(let a=e.parentElement;a&&a!==P;a=a.parentElement){const ox=getComputedStyle(a).overflowX;if(ox==='auto'||ox==='scroll')return true;}return false;})();if(!scroller&&(b.left<r.left-1||b.right>r.right+1))bad.push((e.className||e.tagName)+':'+Math.round(b.left)+'-'+Math.round(b.right));
    if(e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<11)small.push(e.textContent.trim().slice(0,20)+':'+fs);}}
   return {r:[r.left,r.top,r.right,r.bottom],bad:bad.slice(0,5),small:small.slice(0,5),text:P.innerText};});
  assert.ok(pan.r[0]>=-1&&pan.r[1]>=-1&&pan.r[2]<=width+1&&pan.r[3]<=vp.height+1,'Fenster im Bild '+JSON.stringify(pan.r));assert.deepEqual(pan.bad,[],'nichts ragt seitlich heraus');assert.deepEqual(pan.small,[],'Schrift lesbar');
  assert.match(pan.text,fx.text);row.panel=pan.r;checked.push('panel');
 }
 const f=path.join(out,`rahmung-${scene}-${width}-${gfx}.png`);await p.screenshot({path:f});
 const raf=await p.evaluate(()=>new Promise(done=>{let n=0;const t=performance.now();(function q(){n++;if(performance.now()-t<1500)requestAnimationFrame(q);else done(n);})();}));assert.ok(raf>=10,'rAF '+raf);assert.deepEqual(errors,[]);
 Object.assign(row,{checked,raf,file:path.relative(path.join(__dirname,'..'),f)});rows.push(row);console.log('OK Rahmung',scene,width,gfx,checked.join(','));
 }catch(e){failed++;row.error=String(e&&e.message||e).slice(0,700);rows.push(row);console.error('FEHLER Rahmung',scene,width,gfx,row.error);try{await p.screenshot({path:path.join(out,`fehler-rahmung-${scene}-${width}-${gfx}.png`)});}catch(_){}}
 await c.close();
}}finally{await Promise.race([b.close(),new Promise(r=>setTimeout(r,8000))]);fs.writeFileSync(path.join(out,`report-rahmung-${process.env.VIEWPORT||'alle'}-${process.env.GFX||'alle'}${ONLY?'-'+ONLY.join('+'):''}.json`),JSON.stringify(rows,null,2));}
console.log(failed?'ROT etappe5-rahmung: '+failed:'OK etappe5-rahmung');process.exit(failed?1:0);})().catch(e=>{console.error(e);process.exit(1);});
