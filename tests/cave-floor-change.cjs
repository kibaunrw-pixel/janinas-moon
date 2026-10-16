/* Fehlerursache beim Ebenenwechsel: voller Stack statt Vermutung */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'block'}),p=await c.newPage();
  const seen=[];
  p.on('pageerror',e=>seen.push({message:e.message,stack:e.stack}));
  p.on('console',m=>{if(m.type()==='error')seen.push({console:m.text()})});
  await p.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok);
  await p.evaluate(()=>{const d=JMDEBUG,s=d.newState('Fehlersuche',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.sound=s.music=false;s.flags.letter=true;s.flags.caveSeen=true;s.map='hoehle';s.px=10;s.py=14;s.min=720;d.startGame(s,false);});
  await p.waitForTimeout(800);
  await p.evaluate(()=>JMDEBUG.tap(10,5));await p.waitForTimeout(3000);
  const before=await p.evaluate(()=>({map:JMDEBUG.M.id,depth:JMDEBUG.M.depth,p:{x:JMDEBUG.P.x,y:JMDEBUG.P.y}}));
  const z=await p.evaluate(()=>{const h=JM.R3.proj(10.5,2.5,.8);return [h[0],h[1]];});
  await p.mouse.click(z[0],z[1]);await p.waitForTimeout(3000);
  const after=await p.evaluate(()=>({map:JMDEBUG.M.id,depth:JMDEBUG.M.depth,p:{x:JMDEBUG.P.x,y:JMDEBUG.P.y},idle:JMDEBUG.idle}));
  // Bewegung nach dem Wechsel
  await p.evaluate(()=>JMDEBUG.tap(6,10));await p.waitForTimeout(3000);
  const move=await p.evaluate(()=>({p:{x:JMDEBUG.P.x,y:JMDEBUG.P.y},idle:JMDEBUG.idle}));
  console.log(JSON.stringify({before,after,move,seen},null,2));
  await c.close();
 }finally{/* Begrenzt: Chrome-Hilfsprozesse (GoogleUpdater, Crashpad) halten sonst Chromes stdio offen und close() endet nie. */await Promise.race([b.close(),new Promise(r=>setTimeout(r,8000))]);}
})().catch(e=>{console.error('HARNESS',e);process.exitCode=1});
