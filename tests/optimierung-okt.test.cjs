/* Optimierung Oktober 2026 (Janinas Rückmeldung): Waldtür/Gewölbe/Mondtor auffindbar, Tagebuch-Karte mit allen Orten
   und erreichten Mine-Ebenen, breiter Ostweg zum Bahnhof, Nächtliche Überraschungen. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);
for(const f of ['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js','jm-ereignisse.js','jm-dorf.js','jm-romantik.js','jm-tiere.js','jm-cafe.js','jm-magie.js','jm-ziele.js','jm-chronik.js','jm-entdecken.js','jm-gemeinschaft.js','jm-zuhause.js','jm-geheimnisse.js','jm-nacht.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
const J=c.window.JM,X=J.Post,St=J.Stadt,G=J.Magie,N=J.Nacht,clone=o=>JSON.parse(JSON.stringify(o));
function base(extra={}){const s={day:12,min:600,money:38500,inv:{},stats:{earned:0},mail:[],mailQ:[],npc:{},name:'Janina',energy:70,maxE:100,rene:{met:true},dogs:[],dogH:[],field:{},forage:{},hens:[],cows:[],eggs:[],mess:[],recipes:[],flags:{},weather:'sun',tomorrow:'sun',ship:{},shipLog:{},fishLog:{},cookLog:{},...extra};for(const id in J.NPCS)s.npc[id]={p:0,met:true};J.Ausbau.migrate(s);return s;}
const maps=s=>{const m=J.buildMaps();St.apply(m,s);return m;};
function reached(m,spawn=m.spawn){const q=[spawn],seen=new Set([spawn.join(',')]);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&J.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}return seen;}
const seq=(...v)=>{let i=0;return ()=>v[Math.min(i++,v.length-1)];};

test('Waldtür ohne Henks Brief: sichtbar, begehbar davor, öffnet ins Gewölbe; der Brief kommt danach nicht mehr',()=>{
 const s=base();assert.equal(s.post.m.tuer.st,'');let m=maps(s);const d=m.forest.obj.find(o=>o.act==='post:ev:tuer64');
 assert.equal(d.k,'waldtuer');assert.ok(reached(m.forest,[13,15]).has(d.x+','+(d.y+1)),'Platz vor der Tür vom Wald aus erreichbar');
 const r=X.evAct(s,'tuer64');assert.equal(r.travel.to,'waldtuer');assert.equal(s.post.m.tuer.st,'offen');assert.equal(s.post.m.tuer.self,12);
 assert.match(r.lines[0].text,/Steintür|Tür aus Stein/);m=maps(s);assert.equal(m.forest.obj.find(o=>o.act==='post:ev:tuer64').k,'waldtuer_offen');
 assert.equal(X.chest64(s),true);assert.equal(s.post.m.tuer.st,'fertig');
 // Eine Mission im Status „brief“ (ungelesen) lässt sich ebenfalls direkt an der Tür lösen.
 const b=base();b.post.m.tuer.st='brief';assert.equal(X.open64(b),true);assert.equal(b.post.m.tuer.st,'offen');});

test('Vollmond vor dem ersten Öffnen: Wegweiser, Kalender und Tagebuch zeigen die Steintür, nicht ein unbekanntes Gewölbe',()=>{
 const s=base({day:13});let t=X.target(s);assert.equal(t.map,'forest');assert.equal(t.x,X.door64.x);assert.match(t.t,/Morgen ist Vollmond/);
 s.day=14;t=X.target(s);assert.match(t.t,/Heute ist Vollmond/);assert.match(t.sub,/Nordwesten/);
 assert.match(G.calMarks(s,0,14)[0],/Steintür im Nordwesten/);assert.match(G.diary(s),/Nordwesten/);assert.match(G.diary(s),/rechts an dessen Wand/);
 s.day=10;assert.equal(X.target(s),null,'kein Dauerpfeil außerhalb des Vollmonds');
 const o=base({day:14});o.post.m.tuer.st='fertig';assert.match(G.calMarks(o,0,14)[0],/Mondtor im Gewölbe offen/);
 assert.equal(X.target(o).map,G.ROOM);assert.match(X.evAct(o,'tafel64').lines.map(l=>l.text).join(' '),/rechts an dieser Wand/);
 o.day=10;assert.match(G.act(o,'tor').note,/4 Tage bis Vollmond/);});

test('Tiefste Mine-Ebene: wird beim Betreten gespeichert und aus belegten Spuren alter Stände abgeleitet',()=>{
 const s=base();assert.equal(s.mine.max,0);const m=J.buildMaps();J.Ausbau.enterMine(s,'hoehle',m,()=>.5);assert.equal(s.mine.max,1);
 J.Ausbau.enterMine(s,'hoehle6',m,()=>.5);J.Ausbau.enterMine(s,'hoehle3',m,()=>.5);assert.equal(s.mine.max,6,'Aufstieg senkt die Tiefe nicht');
 const r=clone(s);J.Ausbau.migrate(r);assert.equal(r.mine.max,6,'bleibt nach Neuladen');
 const alt=base();delete alt.mine.max;alt.fishLog={kristallforelle:1};J.Ausbau.migrate(alt);assert.equal(alt.mine.max,10);
 const alt2=base();delete alt2.mine.max;alt2.chronik={stage:3};J.Ausbau.migrate(alt2);assert.equal(alt2.mine.max,9);
 const alt3=base();delete alt3.mine.max;alt3.flags.caveSeen=true;J.Ausbau.migrate(alt3);assert.equal(alt3.mine.max,1,'ohne Spur keine erfundene Tiefe');
 const bad=base();bad.mine.max=99;J.Ausbau.migrate(bad);assert.equal(bad.mine.max,0);});

test('Ostweg Dorf ↔ Bahnhof: zwei begehbare Spuren, beide mit Ausgang, Rückweg auf beiden Spuren',()=>{
 const m=maps(base()),v=m.village,b=m.bahnhof,seen=reached(v,[14,13]);
 for(const y of [14,15]){assert.ok(J.WALK.has(v.t[y][30])&&J.WALK.has(v.t[y][31]),'Zeile '+y+' frei');assert.ok(seen.has('31,'+y));const e=v.exits.find(e=>e.x===31&&e.y===y);assert.equal(e.to,'bahnhof');assert.ok(J.WALK.has(b.t[e.ty][e.tx]));}
 assert.ok(!v.trees.some(t=>t.x>=28&&(t.y===14||t.y===15)),'keine Baumkrone auf dem Weg');
 for(const y of [9,10]){const e=b.exits.find(e=>e.x===0&&e.y===y);assert.equal(e.to,'village');assert.ok(J.WALK.has(v.t[e.ty][e.tx]));}});

test('Nacht: erster Meteorit nach zwei Nächten, frei und erreichbar auf dem Hof, drei Schläge, Belohnung genau einmal',()=>{
 const s=base({day:20});const n=s.nacht;assert.equal(n.since,20);
 s.day=21;assert.equal(N.roll(s,()=>.99),null);s.day=22;assert.equal(N.roll(s,()=>.99),'meteor');assert.equal(N.roll(s,()=>0),null,'pro Nacht nur einmal');
 assert.match(N.takeNotes(s).join(' '),/Meteorit/);assert.equal(N.takeNotes(s).length,0);
 const m=maps(s),o=m.farm.obj.find(o=>o.act==='nacht:meteor');assert.equal(o.k,'meteorit3');assert.equal(m.farm.t[o.y][o.x],J.T.BLOCK);
 const r=reached(m.farm);assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>r.has((o.x+dx)+','+(o.y+dy))),'vom Haus aus erreichbar');
 for(const [k,f] of Object.entries(s.field))if(f.t)assert.notEqual(k,o.x+','+o.y);
 const pos={x:o.x,y:o.y};assert.deepEqual(clone(N.apply(maps(s),s).farm.obj.find(q=>q.nacht)).x,pos.x,'Position stabil');
 const e0=s.energy;assert.ok(N.act(s,'meteor').note);assert.equal(s.energy,e0-N.HIT);assert.equal(maps(s).farm.obj.find(q=>q.nacht).k,'meteorit2');
 N.act(s,'meteor');const fin=N.act(s,'meteor');assert.equal(fin.banner,'Ein Stück vom Himmel!');
 assert.deepEqual([s.inv.meteorit,s.inv.mondquarz,s.inv.silber],[1,2,2]);assert.equal(s.nacht.ev,null);
 assert.ok(!maps(s).farm.obj.some(q=>q.act==='nacht:meteor'));assert.equal(maps(s).farm.t[pos.y][pos.x]===J.T.BLOCK,false,'Kachel wieder frei');
 assert.ok(N.act(s,'meteor').note);assert.equal(s.inv.meteorit,1,'kein zweites Mal');
 assert.ok(J.NPCS.elva.love.includes('meteorit'));});

test('Nacht: Meteorit zerfällt nach vier Tagen; müde Spielerin wird nicht ins Minus gezogen',()=>{
 const s=base({day:30});s.nacht.since=10;s.day=31;N.roll(s,()=>.99);assert.equal(s.nacht.ev.day,31);
 s.energy=3;assert.match(N.act(s,'meteor').note,/erschöpft/);assert.equal(s.energy,3);assert.equal(s.nacht.ev.hp,3);
 for(const d of [32,33,34]){s.day=d;N.roll(s,()=>.99);assert.ok(s.nacht.ev,'Tag '+d+' noch da');}
 s.day=35;N.roll(s,()=>.99);assert.equal(s.nacht.ev,null);assert.match(N.takeNotes(s).join(' '),/Sternenstaub/);});

test('Nacht: Mondfee reift einen Fleck, Steineule bleibt und schenkt einmal am Tag',()=>{
 const s=base({day:40});s.nacht.last=30;s.nacht.ev={k:'meteor',day:39,hp:3};
 for(let x=6;x<=9;x++)s.field[x+',12']={t:true,w:false,c:{k:'tomate',a:0},o:null};s.field['20,20']={t:true,w:false,c:{k:'tomate',a:0},o:null};
 assert.equal(N.roll(s,seq(0,0,0)),'fee');const ripe=Object.values(s.field).filter(f=>f.c.a>=J.CROPS.tomate.days-1).length;assert.ok(ripe>=1&&ripe<=3,'ein Fleck, nicht das ganze Feld: '+ripe);
 assert.match(N.takeNotes(s).join(' '),/Mondfee/);
 const e=base({day:50});e.nacht.last=40;e.nacht.ev={k:'meteor',day:49,hp:3};assert.equal(N.roll(e,seq(0,.99)),'eule');
 const o=maps(e).farm.obj.find(q=>q.act==='nacht:eule');assert.ok(o);const r=N.act(e,'eule');assert.match(r.note,/Steineule/);
 const inv=JSON.stringify(e.inv);assert.match(N.act(e,'eule').note,/Morgen/);assert.equal(JSON.stringify(e.inv),inv,'heute nur einmal');
 const back=clone(e);J.Ausbau.migrate(back);assert.ok(maps(back).farm.obj.some(q=>q.act==='nacht:eule'),'bleibt nach Neuladen');
 assert.match(N.diary(e),/Steineule/);});

test('Nacht: beschädigte Zustände werden sicher bereinigt, Kartenanwendung bleibt idempotent',()=>{
 const s=base();s.nacht={ev:{k:'x'},eule:'kaputt',log:5};N.migrate(s);assert.equal(s.nacht.ev,null);assert.equal(s.nacht.eule,null);assert.equal(s.nacht.log.meteor,0);
 s.nacht.ev={k:'meteor',day:12,hp:2};const m=J.buildMaps();for(let i=0;i<3;i++)St.apply(m,s);assert.equal(m.farm.obj.filter(o=>o.nacht).length,1);});
