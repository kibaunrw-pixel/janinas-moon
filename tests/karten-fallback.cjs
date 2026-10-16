/* Robustheit: Ein Spielstand mit unbekannter oder (noch) nicht gebauter Karten-ID darf den Start nicht anhalten.
   Im normalen Spiel nicht erreichbar (haus_oben gibt es ab Ausbaustufe 1, Stufen sinken nie), aber denkbar bei
   beschädigten oder von Hand bearbeiteten Spielständen. Erwartung: Start auf dem Hof, Spielschleife läuft. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
await p.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG&&JM.R3?.ok);
for(const [map,level] of [['gibtsnicht',0],['haus_oben',0]]){
 const r=await p.evaluate(({map,level})=>{const s=JMDEBUG.newState('Fallback',[{name:'A',fell:'weiss'},{name:'B',fell:'apricot'}]);s.sound=s.music=false;s.map=map;s.px=3;s.py=8;s.house={level,job:null};try{JMDEBUG.startGame(s,false);}catch(e){return {err:String(e)};}return {map:JMDEBUG.M.id,x:JMDEBUG.P.x,y:JMDEBUG.P.y};},{map,level});
 assert.deepEqual(r,{map:'farm',x:5,y:8},'Start trotz Karte '+map);
 const t0=await p.evaluate(()=>JM.ENG.gameT);await p.waitForTimeout(700);assert.ok(await p.evaluate(()=>JM.ENG.gameT)>t0,'Spielschleife läuft');
 // Auch ein Laufzeitwechsel auf eine unbekannte ID darf nicht werfen.
 assert.equal(await p.evaluate(()=>{try{JMDEBUG.setMap('gibtsnicht',2,2);return JMDEBUG.M.id;}catch(e){return String(e);}}),'farm');
}
assert.deepEqual(errors,[]);console.log('Unbekannte Karten-ID → sicherer Start auf dem Hof OK');}finally{/* Begrenzt: Chrome-Hilfsprozesse (GoogleUpdater, Crashpad) halten sonst Chromes stdio offen und close() endet nie. */await Promise.race([b.close(),new Promise(r=>setTimeout(r,8000))]);}})().catch(e=>{console.error(e);process.exitCode=1;})
/* Ausdrücklich beenden: von Chrome gestartete Hilfsprozesse (Crashpad, GoogleUpdater) können die geerbte stderr-Pipe offen halten. */
.finally(()=>process.exit());
