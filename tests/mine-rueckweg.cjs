/* Regression: Auf Höhlenebene 2+ darf der Wegweiser die Spielschleife nicht stoppen.
   Vor dem Fix: routeTarget kennt nur "hoehle", nicht "hoehle2" -> TypeError im jedem Frame
   -> requestAnimationFrame endet -> Figur steht, Menüs reagieren weiter. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'block'}),p=await c.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(String(e.message)));
  await p.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok);
  // Spielerin steht auf Ebene 2; eine Aufgabe verweist auf den Hof (andere Karte).
  await p.evaluate(()=>{const d=JMDEBUG,s=d.newState('Rueckweg',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);
    s.sound=s.music=false;s.flags.letter=true;s.flags.caveSeen=true;
    s.map='hoehle2';s.px=10;s.py=14;s.min=720;s.energy=68;
    s.quest={id:'pudel',p:1,seen:[]};
    d.startGame(s,false);});
  await p.waitForTimeout(1200);
  const vor=await p.evaluate(()=>[JMDEBUG.P.x,JMDEBUG.P.y]);
  assert.deepEqual(errs,[],'Auf Ebene 2 darf kein Laufzeitfehler auftreten: '+errs.join(' / '));
  // Die Spielschleife muss weiterlaufen: Bewegung muss ankommen.
  await p.evaluate(()=>JMDEBUG.tap(10,13));await p.waitForTimeout(2500);
  const nach=await p.evaluate(()=>[JMDEBUG.P.x,JMDEBUG.P.y]);
  assert.notDeepEqual(nach,vor,'Spielfigur muss sich auf Ebene 2 bewegen können (Schleife läuft)');
  // Wegweiser-Ziel muss auflösbar sein, ohne zu werfen
  const ziel=await p.evaluate(()=>{try{return JMDEBUG.routeTarget?JMDEBUG.routeTarget(JMDEBUG.questTarget()):'nicht exportiert'}catch(e){return 'FEHLER: '+e.message}});
  assert.ok(!String(ziel).startsWith('FEHLER'),'routeTarget darf nicht werfen: '+ziel);
  // Und der Rückweg über die untere Leiter muss funktionieren
  await p.evaluate(()=>JMDEBUG.tap(10,16));await p.waitForTimeout(3000);
  const zurueck=await p.evaluate(()=>({map:JMDEBUG.M.id,depth:JMDEBUG.M.depth}));
  assert.equal(zurueck.depth,1,'Untere Leiter führt eine Ebene höher: '+JSON.stringify(zurueck));
  assert.deepEqual(errs,[],'Auch nach dem Ebenenwechsel keine Fehler');
  console.log('Höhlenebene 2+: Schleife läuft, Wegweiser ok, Rückweg ok',JSON.stringify({vor,nach,ziel,zurueck}));
  await c.close();
 }finally{/* Begrenzt: Chrome-Hilfsprozesse (GoogleUpdater, Crashpad) halten sonst Chromes stdio offen und close() endet nie. */await Promise.race([b.close(),new Promise(r=>setTimeout(r,8000))]);}
})().catch(e=>{console.error('ROT/FAIL:',e.message);process.exitCode=1});
