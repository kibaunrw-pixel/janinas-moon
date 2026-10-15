/* Synthetische Vorräte/Geld, echte Mengenfelder/Enter/Buttons/Reload/Bett. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.EVIDENCE_DIR||'/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-stadt';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});try{for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 const c=await b.newContext({viewport}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto('http://127.0.0.1:8765/');await p.waitForFunction(()=>window.JMDEBUG);await p.evaluate(()=>{const d=JMDEBUG,s=d.newState('Synthetischer Versand',[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}]);s.sound=s.music=false;s.flags.letter=true;s.qDone=JM.QUESTS.map(q=>q.id);s.daily={day:1,goals:[]};s.inv={ei:12};s.money=500;s.map='farm';s.px=9;s.py=8;d.startGame(s,false);});
 await p.evaluate(()=>JMDEBUG.tap(9,7));await p.getByRole('heading',{name:'Versandkiste',exact:true}).waitFor();await p.locator('[data-a="sel"][data-k="ei"]').click();
 assert.equal(await p.locator('#ship-qty-ei').count(),1,'Versand braucht eintippbare Menge');
 const input=p.locator('#ship-qty-ei');assert.equal(await input.getAttribute('inputmode'),'numeric');
 for(const value of ['', '-1','1.5','NaN','0','13']){await input.fill(value);await input.press('Enter');assert.equal(await p.evaluate(()=>JMDEBUG.S.ship.ei||0),0,'ungültige Menge '+value);assert.equal(await input.inputValue(),value);}
 await input.fill('8');await input.press('Enter');assert.equal(await p.evaluate(()=>JMDEBUG.S.ship.ei),8);assert.equal(await input.inputValue(),'8');assert.equal(await input.evaluate(e=>document.activeElement===e),true,'Enter behält Eingabefokus');
 const back=p.locator('#ship-out-qty-ei');await back.fill('3');await back.press('Enter');assert.equal(await p.evaluate(()=>JMDEBUG.S.ship.ei),5);assert.equal(await p.evaluate(()=>JMDEBUG.S.inv.ei),7);assert.equal(await p.evaluate(()=>JMDEBUG.S.money),500);
 // Doppelklick darf die frisch gerenderte Bestätigung nicht zweimal ausführen.
 await input.fill('1');await p.locator('[data-a="shipn"][data-k="ei"]').dblclick();assert.equal(await p.evaluate(()=>JMDEBUG.S.ship.ei),6);
 await back.fill('1');await back.press('Enter');assert.equal(await p.evaluate(()=>JMDEBUG.S.ship.ei),5);
 assert.ok(await p.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'kein horizontaler Überlauf');await p.screenshot({path:path.join(out,`versand-editierbar-${viewport.width}.png`)});
 await p.reload();await p.getByRole('button',{name:'Weiterspielen',exact:true}).click();assert.equal(await p.evaluate(()=>JMDEBUG.S.ship.ei),5);assert.equal(await p.evaluate(()=>JMDEBUG.S.inv.ei),7);
 await p.evaluate(()=>JMDEBUG.tap(9,7));await p.getByRole('heading',{name:'Versandkiste',exact:true}).waitFor();assert.equal(await p.locator('[data-a="shipoutn"][data-k="ei"]').count(),1,'gespeicherter Inhalt entnehmbar');await p.getByRole('button',{name:'Schließen',exact:true}).click();
 // Normaler Weg zum Bett: Bildschirmwege werden zusätzlich im Wohnraumtest geprüft.
 await p.evaluate(()=>JMDEBUG.tap(5,5));await p.waitForFunction(()=>JMDEBUG.M.id==='haus');await p.waitForFunction(()=>!JMDEBUG.busy.ui.fade);await p.evaluate(()=>JMDEBUG.tap(11,3));await p.getByRole('button',{name:'Gute Nacht',exact:true}).click();await p.waitForFunction(()=>!JMDEBUG.busy.ui.fade,{timeout:10000});
 const money=await p.evaluate(()=>JMDEBUG.S.money),price=await p.evaluate(()=>JM.ITEMS.ei.sell);assert.equal(money,500+5*price);assert.equal(await p.evaluate(()=>JMDEBUG.S.shipLog.ei),5);assert.equal(await p.evaluate(()=>JMDEBUG.S.inv.ei),7);assert.equal(await p.evaluate(()=>Object.keys(JMDEBUG.S.ship).length),0);
 await p.reload();await p.getByRole('button',{name:'Weiterspielen',exact:true}).click();assert.equal(await p.evaluate(()=>JMDEBUG.S.money),money);assert.equal(await p.evaluate(()=>Object.keys(JMDEBUG.S.ship).length),0);
 await p.evaluate(()=>JMDEBUG.openBag('ship'));assert.equal(await p.locator('[data-a="shipoutn"]').count(),0,'verkaufte Ware nicht zurückholbar');assert.deepEqual(errors,[]);console.log('Versand Menge/Enter/Teilrücknahme/Doppelklick/Reload/Tagesverkauf',viewport.width,'OK');await c.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
