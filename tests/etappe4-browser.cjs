/* Etappe 4 – echte Bildschirmklicks, seriell: 390×844 und 1440×900, jeweils 2D/3D.
   Fixtures werden ausschließlich vor JMDEBUG.startGame gesetzt: Ort, Tag, Uhrzeit, Wetter, Vorräte und W64-Abschluss.
   Danach erfolgen Tor, Fund, Säen, Gießen, Schlafen, Wetterbericht und Käufe über sichtbare Klicks. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||path.join(__dirname,'..','docs','belege','etappe4');fs.mkdirSync(out,{recursive:true});
const ALL=['wald','pflanze','pflanze_reif','haendler','wetter'],SEGS=process.argv[2]?process.argv[2].split(','):ALL,base=process.env.BASE_URL||'http://127.0.0.1:8765/';
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true,args:base.startsWith('file:')?['--allow-file-access-from-files']:[]});const report=[];let failed=0;
try{for(const seg of SEGS)for(const vp of [{width:390,height:844},{width:1440,height:900}])for(const gfx of ['2d','3d']){
 if(process.env.VIEWPORT&&vp.width!==+process.env.VIEWPORT||process.env.GFX&&gfx!==process.env.GFX)continue;
 const c=await b.newContext({viewport:vp,deviceScaleFactor:vp.width===390?2:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const row={seg,width:vp.width,gfx,shots:[],errors};try{
  await p.goto(base);await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok&&JM.Magie);
  const fx={wald:{map:'waldtuer',px:5,py:5,day:14,min:1200,weather:'sun'},pflanze:{map:'farm',px:5,py:11,day:14,min:1200,weather:'sun',inv:{mondsamen:1},field:{'5,12':{t:true,w:false,c:null,o:null}}},pflanze_reif:{map:'farm',px:5,py:14,day:18,min:700,weather:'sun',field:{'5,12':{t:true,w:true,c:{k:'mondblume',a:3},o:null}}},haendler:{map:'village',px:17,py:13,day:15,min:750,weather:'rain',money:1000},wetter:{map:'haus',px:7,py:6,day:15,min:700,weather:'sun',tomorrow:'rain'}}[seg];
  await p.evaluate(({gfx,fx})=>{const s=JMDEBUG.newState('Etappe4',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.gfx=gfx;s.sound=s.music=false;s.map=fx.map;s.px=fx.px;s.py=fx.py;s.day=fx.day;s.min=fx.min;s.weather=fx.weather;s.tomorrow=fx.tomorrow||'sun';s.money=fx.money||3000;s.inv=fx.inv||{};s.field=fx.field||{};s.flags.letter=s.flags.forestSeen=true;s.qDone=JM.QUESTS.map(q=>q.id);JM.Ausbau.migrate(s);s.post.m.tuer.st='fertig';s.daily={day:s.day,goals:[]};s.mail=[];s.mailQ=[];if(fx.inv?.mondsamen)s.hold='mondsamen';JMDEBUG.startGame(s,false);},{gfx,fx});
  for(let i=0;i<3;i++)await p.locator('#zOut').click();await p.waitForTimeout(800);
  const S=fn=>p.evaluate(fn),shot=async n=>{const f=path.join(out,`${n}-${vp.width}-${gfx}.png`);await p.screenshot({path:f});row.shots.push(f);return f;};
  async function pixel(x,y,h=.2){return p.evaluate(({x,y,h,gfx})=>gfx==='3d'?JM.R3.proj(x+.5,y+.5,h).map(n=>n/devicePixelRatio):[(x*16+8-Math.round(JMDEBUG.cam.x))*JMDEBUG.scale,(y*16+8-Math.round(JMDEBUG.cam.y))*JMDEBUG.scale],{x,y,h,gfx});}
  async function click(x,y,h=.2){const r=await pixel(x,y,h);assert.ok(r[0]>0&&r[0]<vp.width&&r[1]>0&&r[1]<vp.height,'Ziel sichtbar '+JSON.stringify({x,y,r}));assert.equal(await p.evaluate(r=>document.elementFromPoint(...r)?.tagName,r),'CANVAS');await p.mouse.click(...r);await p.waitForFunction(()=>JMDEBUG.idle||JMDEBUG.busy.ui.dialog||JMDEBUG.busy.ui.panel,null,{timeout:20000});await p.waitForTimeout(500);}
  async function dialogs(){for(let i=0;i<12&&await S(()=>JMDEBUG.busy.ui.dialog);i++){await p.locator('#dlg').click();await p.waitForTimeout(200);}assert.equal(await S(()=>JMDEBUG.busy.ui.dialog),false);}
  async function reload(){await p.reload();await p.getByRole('button',{name:'Weiterspielen',exact:true}).click();await p.waitForFunction(()=>JMDEBUG.S&&!JMDEBUG.busy.ui.fade);await p.waitForTimeout(700);}
  if(seg==='wald'){
   await shot('vollmondtor');await click(9,3,1);await p.waitForFunction(()=>JMDEBUG.M.id==='vollmondwald');await shot('vollmondwald');
   await click(13,10,0);await p.waitForFunction(()=>JMDEBUG.idle&&Math.round(JMDEBUG.P.y)<=11,null,{timeout:20000});await click(13,6,.4);await dialogs();assert.equal(await S(()=>JMDEBUG.S.inv.mondsamen),3);await shot('mondsamen-fund');await reload();assert.equal(await S(()=>JMDEBUG.M.id),'vollmondwald');assert.equal(await S(()=>JMDEBUG.S.inv.mondsamen),3);
   row.zoomNachReload=await S(()=>JMDEBUG.S.zoom);for(const [wx,wy] of [[12,10],[12,13],[10,14]]){/* Am 14. Tag fliegen ab 19:30 viele Sternschnuppen; trifft ein Tipp eine davon, öffnet sich der Wunschdialog. Dann über die Oberfläche schließen und den Tipp wiederholen (Beleg: fehler-wald-390-3d.png, 20.10.2026). */for(let t=0;t<3;t++){await click(wx,wy,0);await p.waitForFunction(({wx,wy})=>JMDEBUG.busy.ui.dialog||JMDEBUG.idle&&Math.abs(JMDEBUG.P.x-wx)+Math.abs(JMDEBUG.P.y-wy)<=1.5,{wx,wy},{timeout:20000});if(!await S(()=>JMDEBUG.busy.ui.dialog))break;row.wunsch=(row.wunsch||0)+1;await dialogs();}await p.waitForFunction(({wx,wy})=>JMDEBUG.idle&&Math.abs(JMDEBUG.P.x-wx)+Math.abs(JMDEBUG.P.y-wy)<=1.5,{wx,wy},{timeout:20000});}await click(10,16,.1);await p.waitForFunction(()=>JMDEBUG.M.id==='waldtuer');assert.equal(await S(()=>JMDEBUG.M.id),'waldtuer');row.result={samen:3,rueckweg:true,zoomNachReload:row.zoomNachReload};
  }
  if(seg==='pflanze'){
   await click(5,12,.1);assert.equal(await S(()=>JMDEBUG.S.field['5,12'].c.k),'mondblume');await click(5,12,.1);assert.equal(await S(()=>JMDEBUG.S.field['5,12'].c.nacht),14);await shot('mondblume-jung');await reload();assert.equal(await S(()=>JMDEBUG.S.field['5,12'].c.nacht),14);
   row.result={nacht:14,reload:true};
  }
  if(seg==='pflanze_reif'){
   await shot('mondblume-reif');await click(5,12,.1);assert.equal(await S(()=>JMDEBUG.S.inv.mondblume),1);await reload();assert.equal(await S(()=>JMDEBUG.S.inv.mondblume),1);row.result={ernte:1,reload:true};
  }
  if(seg==='haendler'){
   await shot('regenhaendler');await click(18,12,1);await p.getByRole('heading',{name:'Nerios Regenwagen',exact:true}).waitFor();await shot('regenhaendler-sortiment');const m0=await S(()=>JMDEBUG.S.money);await p.locator('[data-a="magiekauf-mondsamen"]').click();await p.waitForTimeout(500);assert.equal(await S(()=>JMDEBUG.S.money),m0-240);assert.equal(await S(()=>JMDEBUG.S.inv.mondsamen),1);await reload();assert.equal(await S(()=>JMDEBUG.S.inv.mondsamen),1);row.result={kauf:240};
  }
  if(seg==='wetter'){
   await click(8,3,.6);await p.getByRole('heading',{name:'Fernsehen',exact:true}).waitFor();await p.locator('[data-a="wx"]').click();await p.waitForFunction(()=>JMDEBUG.busy.ui.dialog);await p.waitForFunction(()=>/Nerio.*Regenwagen/.test(document.querySelector('#dlgT').textContent),null,{timeout:10000});await shot('wetterbericht-nerio');await dialogs();await reload();row.result={ankuendigung:true};
  }
  const raf=await p.evaluate(()=>new Promise(r=>{let n=0;const t=performance.now();(function f(){n++;if(performance.now()-t<2000)requestAnimationFrame(f);else r({frames:n,ms:performance.now()-t});})();}));row.raf=raf;if(raf.frames<10)throw Error('rAF nahezu angehalten: '+JSON.stringify(raf));assert.deepEqual(errors,[]);
 }catch(e){failed++;row.error=String(e&&e.stack||e).slice(0,1200);console.error('FEHLER',seg,vp.width,gfx,row.error);try{await p.screenshot({path:path.join(out,`fehler-${seg}-${vp.width}-${gfx}.png`)});}catch(_){}}
 report.push(row);console.log(JSON.stringify({seg,width:vp.width,gfx,ok:!row.error,raf:row.raf,result:row.result}));await c.close();
}}finally{await b.close();fs.writeFileSync(path.join(out,`report-browser-${process.env.VIEWPORT||'alle'}-${process.env.GFX||'alle'}.json`),JSON.stringify(report,null,2));}
if(failed)process.exitCode=1;else console.log('OK etappe4-browser');process.exit(process.exitCode||0);})().catch(e=>{console.error(e);process.exit(1);});
