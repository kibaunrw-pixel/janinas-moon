/* Briefkasten-Logik (Etappe 1): tägliche Post, normale Brieftypen, drei Geheimnis-Missionen.
   Lädt die echten Produktionsmodule in einem VM-Kontext; kein Nachbau der Regeln im Test. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);
for(const f of ['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js']){const p=path.join(__dirname,'..',f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),c);}
const J=c.window.JM,X=J.Post,St=J.Stadt;
const clone=o=>JSON.parse(JSON.stringify(o));
function seeded(seed){let a=seed>>>0;return ()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};}
function base(extra){const s={day:10,min:360,money:5000,inv:{holz:100,stein:100,kupfer:10},stats:{earned:0},mail:[],mailQ:[],npc:{},name:'Janina',...extra};for(const id in J.NPCS)s.npc[id]=s.npc[id]||{p:0,met:true,talk:0,gift:0,r3:false};J.Ausbau.migrate(s);return s;}
// Eine Spielnacht so, wie endDay sie ausführt: Tag weiter, Stadt rechnet ab, Post entsteht, Post wird zugestellt.
function night(s,rng){s.day++;const rent=St.advance(s);const made=X.night(s,{rent},rng);s.mail.push(...s.mailQ);s.mailQ=[];return {rent,made};}
const idx=(s,pred)=>s.mail.findIndex(pred);

test('Modul vorhanden und Altspielstand ohne Postfelder bleibt vollständig erhalten',()=>{
 assert.equal(typeof X,'object','JM.Post fehlt');
 for(const level of [0,1,2]){
  const s={day:30,money:4321,inv:{ei:3,holz:12},house:{level,job:null},mail:[{from:'rosa',t:'Willkommen!',b:'x',read:true},{from:'paula',t:'Tipp',b:'y',read:false}],mailQ:[{from:'rosa',t:'Fest',b:'z'}],
   city:{plots:[{start:3,due:6,ready:true,tenant:'ida',since:7,lastRent:29},{start:null,ready:false,tenant:null,lastRent:0},{start:28,due:31,ready:false,tenant:null,lastRent:0}]}};
  const before=clone(s);J.Ausbau.migrate(s);J.Ausbau.migrate(s);const reload=clone(s);J.Ausbau.migrate(reload);
  for(const k of Object.keys(before))assert.deepEqual(clone(reload[k]),before[k],k+' unverändert, Stufe '+level);
  assert.ok(reload.post&&reload.post.m,'Postzustand ergänzt');for(const id of X.MISSIONS)assert.equal(reload.post.m[id].st,'');
 }
});

test('Jede Nacht 1–3 neue Briefe, Geheimnis kommt spätestens nach fünf Tagen, keine Doppelzustellung',()=>{
 const s=base({day:1});const rng=seeded(7);let mystery=0;const counts=[];
 for(let n=0;n<40;n++){const {made}=night(s,rng);counts.push(made.length);assert.ok(made.length>=1&&made.length<=3,'Tag '+s.day+': '+made.length);
  assert.deepEqual(Array.from(X.night(s,{rent:0},rng)),[],'zweiter Aufruf derselben Nacht liefert nichts');
  mystery+=made.filter(m=>m.kind==='geheim').length;
  // Missionen werden im Test zügig abgeschlossen, damit die nächste beginnen kann.
  for(const id of X.MISSIONS)if(s.post.m[id].st&&s.post.m[id].st!=='fertig'&&n%6===5)s.post.m[id].st='fertig';}
 assert.ok(mystery>=3,'mehrere Geheimnisbriefe über 40 Nächte: '+mystery);
 assert.ok(new Set(counts).size>1,'Anzahl schwankt: '+counts.join(','));
 const ids=s.mail.filter(m=>m.id).map(m=>m.id);assert.equal(new Set(ids).size,ids.length,'eindeutige Brief-IDs');
 const fresh=base({day:1});fresh.post.lastMyst=-20;night(fresh,()=>0.99);assert.equal(fresh.post.m.schatz.st,'brief','erste Geheimmission ist die Schatzkarte');
});

test('Miete kommt genau einmal (Stadtabrechnung), Brief ist nur Quittung; Bewertung beeinflusst Miete nachvollziehbar',()=>{
 const s=base();s.city.plots[0]=Object.assign(s.city.plots[0],{start:1,due:4,ready:true,tenant:'ida',since:10,lastRent:10});
 const m0=s.money;const {rent}=night(s,seeded(1));assert.equal(rent,60);assert.equal(s.money,m0+60,'nur Stadtabrechnung zahlt');
 const r=s.mail.find(m=>m.kind==='miete');assert.ok(r,'Mietquittung');assert.match(r.b,/60 G/);assert.ok(!r.att,'keine zweite Auszahlung per Brief');
 assert.equal(X.night(s,{rent},seeded(1)).length,0);assert.equal(s.money,m0+60);
 // Nach sieben Tagen bewertet Ida; mit zwei Herzen und belebtem Haus Nr. 7 steigt die Bewertung.
 s.npc.ida.p=250;s.post.m.haus7.st='fertig';let rating=null;
 for(let i=0;i<8&&!rating;i++){night(s,seeded(10+i));rating=s.mail.find(m=>m.kind==='bewertung');}
 assert.ok(rating,'Bewertungsbrief nach einer Woche');assert.equal(s.city.plots[0].rating,5);assert.match(rating.b,/★★★★★/);
 assert.equal(St.rentFor(s.city.plots[0]),80,'5 Sterne: 60 + 20 G');
 const before=s.money;s.day++;assert.equal(St.advance(s),80);assert.equal(s.money,before+80);
});

test('Mietanfrage verknüpft fertigen Bauplatz; Zusage genau einmal, auch nach Reload',()=>{
 const s=base();s.city.plots[1]=Object.assign(s.city.plots[1],{start:1,due:4,ready:true,tenant:null});
 let i=-1;for(let n=0;n<4&&i<0;n++){night(s,seeded(n));i=idx(s,m=>m.kind==='anfrage');}
 assert.ok(i>=0,'Mietanfrage kommt');assert.equal(s.mail[i].offer.plot,1);
 const reload=clone(s);J.Ausbau.migrate(reload);
 assert.equal(X.accept(reload,i),true);assert.equal(reload.city.plots[1].tenant,'noah');assert.equal(X.accept(reload,i),false);
 const again=clone(reload);J.Ausbau.migrate(again);assert.equal(X.accept(again,i),false);assert.equal(again.city.plots[1].tenant,'noah');
 for(let n=0;n<10;n++)night(again,seeded(40+n));assert.equal(again.mail.filter(m=>m.kind==='anfrage'&&m.offer.plot===1).length,1,'keine zweite Anfrage für vermietetes Haus');
});

test('Bauauftrag: Wunsch → echter Bau → Dankbrief mit 150 G, Beilage genau einmal',()=>{
 const s=base();let i=-1;for(let n=0;n<8&&i<0;n++){night(s,seeded(100+n));i=idx(s,m=>m.kind==='auftrag');}
 assert.ok(i>=0,'Bauauftrag kommt');const plot=s.mail[i].order.plot;assert.equal(s.city.plots[plot].start,null);
 assert.equal(St.order(s,plot),true);let d=-1;for(let n=0;n<6&&d<0;n++){night(s,seeded(200+n));d=idx(s,m=>m.kind==='dank');}
 assert.ok(d>=0,'Dankbrief nach Fertigstellung');const m0=s.money;assert.ok(X.claim(s,d));assert.equal(s.money,m0+150);assert.equal(X.claim(s,d),null);
 const reload=clone(s);J.Ausbau.migrate(reload);assert.equal(X.claim(reload,d),null);assert.equal(reload.money,m0+150);
 for(let n=0;n<10;n++)night(reload,seeded(300+n));assert.equal(reload.mail.filter(m=>m.kind==='dank').length,1);
});

test('Geschenkbrief: echter Gegenstand genau einmal',()=>{
 const s=base();let i=-1;for(let n=0;n<12&&i<0;n++){night(s,seeded(500+n));i=idx(s,m=>m.kind==='geschenk');}
 assert.ok(i>=0,'Geschenk kommt');const [[k,n]]=Object.entries(s.mail[i].att.items);assert.ok(J.ITEMS[k]);const had=s.inv[k]||0;
 assert.ok(X.claim(s,i));assert.equal(s.inv[k],had+n);assert.equal(X.claim(s,i),null);assert.equal(s.inv[k],had+n);
});

test('Mission Schatzkarte: Brief → Rätsel → erreichbarer Hügel → Schatz genau einmal',()=>{
 const s=base();s.post.lastMyst=-20;night(s,()=>0.5);const i=idx(s,m=>m.mis==='schatz');assert.ok(i>=0);assert.equal(s.post.m.schatz.st,'brief');
 let maps=J.buildMaps();St.apply(maps,s);assert.equal(maps.forest.obj.filter(o=>o.k==='erdhuegel').length,0,'vor dem Lesen keine Hügel');
 X.read(s,i);assert.equal(s.post.m.schatz.st,'karte');maps=J.buildMaps();St.apply(maps,s);const hills=maps.forest.obj.filter(o=>o.k==='erdhuegel');assert.equal(hills.length,3);
 const reach=reached(maps.forest);for(const h of hills)assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>reach.has((h.x+dx)+','+(h.y+dy))),'Hügel erreichbar '+h.act);
 assert.equal(X.target(s).map,'forest');const m0=s.money,k0=s.inv.kupfer;
 const wrong=X.mounds.find(m=>m.id!==X.answer);assert.equal(X.dig(s,wrong.id).ok,false);assert.equal(s.money,m0);
 assert.equal(X.dig(s,X.answer).ok,true);assert.equal(s.money,m0+300);assert.equal(s.inv.kupfer,k0+3);assert.equal(s.post.m.schatz.st,'fertig');
 assert.equal(X.dig(s,X.answer).ok,false);assert.equal(s.money,m0+300);const reload=clone(s);J.Ausbau.migrate(reload);assert.equal(X.dig(reload,X.answer).ok,false);
 maps=J.buildMaps();St.apply(maps,reload);assert.equal(maps.forest.obj.filter(o=>o.k==='erdhuegel').length,0);for(const h of X.mounds)assert.ok(J.WALK.has(maps.forest.t[h.y][h.x]),'Boden wieder frei');
});

test('Mission Haus Nr. 7: Brief → Besuch → Schlüssel → Renovierung (Geld, Material, zwei Nächte) → Elva zieht ein',()=>{
 const s=base();s.post.m.schatz.st='fertig';s.post.lastMyst=-20;night(s,()=>0.5);let i=idx(s,m=>m.mis==='haus7');assert.ok(i>=0);
 let maps=J.buildMaps();St.apply(maps,s);const ruin=maps.stadt.obj.find(o=>o.act==='post:haus7');assert.equal(ruin.k,'ruine');
 assert.ok([[0,4]].length&&reached(maps.stadt).has((ruin.x+2)+','+(ruin.y+ruin.h)),'Haustür von der Straße erreichbar');
 assert.equal(X.look7(s),false,'ungelesen: noch nichts zu sehen');X.read(s,i);assert.equal(s.post.m.haus7.st,'suche');assert.equal(X.target(s).map,'stadt');
 assert.equal(X.look7(s),true);assert.equal(s.post.m.haus7.st,'gesehen');assert.equal(X.renovate(s),false,'ohne Schlüssel kein Umbau');
 night(s,()=>0.5);const k=idx(s,m=>m.key7);assert.ok(k>=0,'Schlüsselbrief');X.read(s,k);assert.equal(s.post.m.haus7.st,'schluessel');
 const poor=clone(s);poor.money=10;J.Ausbau.migrate(poor);const untouched=JSON.stringify(poor);assert.equal(X.renovate(poor),false);assert.equal(JSON.stringify(poor),untouched);
 const m0=s.money,h0=s.inv.holz,st0=s.inv.stein;assert.equal(X.renovate(s),true);assert.equal(X.renovate(s),false);
 assert.deepEqual([s.money,s.inv.holz,s.inv.stein],[m0-800,h0-20,st0-10]);maps=J.buildMaps();St.apply(maps,s);assert.equal(maps.stadt.obj.find(o=>o.act==='post:haus7').k,'bau3');
 night(s,()=>0.5);assert.equal(s.post.m.haus7.st,'bau');const reload=clone(s);J.Ausbau.migrate(reload);night(reload,()=>0.5);assert.equal(reload.post.m.haus7.st,'fertig');
 assert.ok(reload.mail.some(m=>m.from==='elva'));maps=J.buildMaps();St.apply(maps,reload);assert.equal(maps.stadt.obj.find(o=>o.act==='post:haus7').k,'house');
 reload.min=600;const loc=St.location(reload,'elva',false);assert.equal(loc.map,'stadt');assert.ok(reached(maps.stadt).has(loc.x+','+loc.y));reload.min=300;assert.equal(St.location(reload,'elva',false),null);
 assert.equal(reload.money,m0-800,'keine weitere Zahlung');
});

test('Mission Mitternacht am alten Brunnen: nur 23–24 Uhr, Dokument, Geisterbrief, Reparatur einmalig',()=>{
 const s=base();s.post.m.schatz.st=s.post.m.haus7.st='fertig';s.post.lastMyst=-20;night(s,()=>0.5);const i=idx(s,m=>m.mis==='brunnen');assert.ok(i>=0);
 let maps=J.buildMaps();St.apply(maps,s);const well=maps.village.obj.find(o=>o.act==='post:brunnen');assert.equal(well.k,'brunnen_alt');
 assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>reached(maps.village).has((well.x+dx)+','+(well.y+dy))),'Brunnen erreichbar');
 X.read(s,i);assert.equal(s.post.m.brunnen.st,'einladung');assert.equal(X.target(s).map,'village');
 s.min=1379;assert.equal(X.midnight(s),false);s.min=1380;const n0=s.mail.length;assert.equal(X.midnight(s),true);assert.equal(X.midnight(s),false);
 assert.equal(s.post.m.brunnen.st,'dokument');assert.equal(s.mail.length,n0+1);assert.equal(s.mail[n0].kind,'geheim');assert.match(s.mail[n0].t,/Altes Dokument/);
 night(s,()=>0.5);assert.equal(s.mail.filter(m=>m.ghost).length,1,'Brief vom Geist');night(s,()=>0.5);assert.equal(s.mail.filter(m=>m.ghost).length,1);
 const m0=s.money,st0=s.inv.stein,k0=s.inv.kupfer;assert.equal(X.repairWell(s),true);assert.equal(X.repairWell(s),false);
 assert.deepEqual([s.money,s.inv.stein,s.inv.kupfer],[m0-300,st0-15,k0-5]);maps=J.buildMaps();St.apply(maps,s);assert.equal(maps.village.obj.find(o=>o.act==='post:brunnen').k,'brunnen_neu');
 assert.equal(X.target(s),null,'alle Missionen beendet');
});

test('Alle Missionsziele liegen auf vorhandenen Karten und erreichbaren Kacheln',()=>{
 const stages={schatz:['brief','karte'],haus7:['suche','gesehen','schluessel','bau'],brunnen:['einladung','dokument']};
 for(const [id,list] of Object.entries(stages))for(const st of list){const s=base();for(const o of X.MISSIONS)s.post.m[o].st='fertig';s.post.m[id].st=st;s.post.m[id].due=s.day+1;const t=X.target(s);if(!t)continue;
  const maps=J.buildMaps();St.apply(maps,s);assert.ok(maps[t.map],id+'/'+st+' Karte '+t.map);assert.ok(reached(maps[t.map]).has(t.x+','+t.y),id+'/'+st+' Ziel erreichbar '+JSON.stringify(t));}
});
function reached(m){const q=[m.spawn],seen=new Set(q.map(p=>p.join(',')));for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&J.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}return seen;}
