/* Gezielte Suche: Erschöpfung/Hausbau ersetzt MAPS – bricht danach die Welt? */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'block'}),p=await c.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push({msg:e.message,stack:(e.stack||'').split('\n').slice(0,4).join(' | ')}));
  await p.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok);
  const out={};
  // A) In der Hoehle vor Erschoepfung einschlafen
  await p.evaluate(()=>{const d=JMDEBUG,s=d.newState('Erschoepfung',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.sound=s.music=false;s.flags.letter=true;s.map='hoehle';s.px=10;s.py=14;s.min=1200;s.energy=2;s.maxE=100;d.startGame(s,false);});
  await p.waitForTimeout(800);
  out.vorher=await p.evaluate(()=>({map:JMDEBUG.M.id,energy:JMDEBUG.S.energy}));
  // Steine abbauen, bis die Energie alle ist
  for(let i=0;i<4;i++){
    const r=await p.evaluate(()=>{const s=JMDEBUG.S.rocks&&JMDEBUG.S.rocks[0];if(!s)return null;JMDEBUG.tap(s.x,s.y);return s;});
    if(!r)break;
    await p.waitForTimeout(900);
  }
  await p.waitForTimeout(4500);
  out.nachErschoepfung=await p.evaluate(()=>({map:JMDEBUG.M.id,energy:JMDEBUG.S.energy,day:JMDEBUG.S.day,min:JMDEBUG.S.min,mapsOk:!!(window.JMDEBUG&&JMDEBUG.M),hausW:JMDEBUG.M&&JMDEBUG.M.w}));
  out.fehlerA=errs.slice();
  // B) Bewegung nach dem Ereignis?
  await p.evaluate(()=>JMDEBUG.setMap('hoehle',10,14));
  await p.waitForTimeout(500);
  const vor=await p.evaluate(()=>({x:JMDEBUG.P.x,y:JMDEBUG.P.y}));
  await p.evaluate(()=>JMDEBUG.tap(10,6));await p.waitForTimeout(3000);
  out.bewegungNachher={vor,nach:await p.evaluate(()=>({x:JMDEBUG.P.x,y:JMDEBUG.P.y,idle:JMDEBUG.idle}))};
  out.fehlerGesamt=errs;
  console.log(JSON.stringify(out,null,2));
  await c.close();
 }finally{await b.close();}
})().catch(e=>{console.error('HARNESS',e);process.exitCode=1});
