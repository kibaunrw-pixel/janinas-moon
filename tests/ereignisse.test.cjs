/* Briefkasten-Ereignisse W61–W65: Logik mit den echten Produktionsmodulen im VM-Kontext.
   Je Ereignis: Brief → Weg/Aufgabe → Abschluss, Belohnung genau einmal, Reload-fest, Ziele erreichbar. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);
for(const f of ['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js','jm-ereignisse.js']){const p=path.join(__dirname,'..',f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),c);}
const J=c.window.JM,X=J.Post,St=J.Stadt;
const clone=o=>JSON.parse(JSON.stringify(o));
function base(extra){const s={day:10,min:600,money:5000,inv:{holz:100,stein:100,kupfer:10},stats:{earned:0},mail:[],mailQ:[],npc:{},name:'Janina',...extra};for(const id in J.NPCS)s.npc[id]=s.npc[id]||{p:0,met:true,talk:0,gift:0,r3:false};J.Ausbau.migrate(s);return s;}
function night(s,rng){s.day++;const rent=St.advance(s);const made=X.night(s,{rent},rng||(()=>0.5));s.mail.push(...s.mailQ);s.mailQ=[];return {rent,made};}
const reload=s=>{const r=clone(s);J.Ausbau.migrate(r);return r;};
function done(s,...ids){for(const id of ids)s.post.m[id].st='fertig';}
function reached(m){const q=[m.spawn],seen=new Set(q.map(p=>p.join(',')));for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&J.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}return seen;}
function maps(s){const m=J.buildMaps();St.apply(m,s);return m;}
function startMission(s,id){s.post.lastMyst=-20;night(s);const i=s.mail.findIndex(m=>m.mis===id&&!m.reply);assert.ok(i>=0,id+': Startbrief');assert.equal(s.post.m[id].st,'brief');return i;}
function reachTarget(s,label){const t=X.target(s);assert.ok(t,label+': Wegweiserziel');const m=maps(s);assert.ok(m[t.map],label+': Karte '+t.map);assert.ok(reached(m[t.map]).has(t.x+','+t.y),label+': Ziel erreichbar '+JSON.stringify(t));return t;}

test('Altspielstand ohne neue Felder: Besitz unverändert, neue Missionen leer, ältere Missionen unberührt',()=>{
 const s={day:30,money:4321,inv:{ei:3,holz:12},house:{level:1,job:null},mail:[{from:'rosa',t:'x',b:'y',read:true}],mailQ:[],
  city:{plots:[{start:3,due:6,ready:true,tenant:'ida',since:7,lastRent:29},{start:null,ready:false,tenant:null,lastRent:0},{start:null,ready:false,tenant:null,lastRent:0}]},
  post:{v:1,seq:4,m:{schatz:{st:'fertig',found:5},haus7:{st:'fertig',done:9},brunnen:{st:'dokument',doc:12}},req:{},orders:{},lastMyst:12,lastGift:20,lastDay:29}};
 const before=clone(s);J.Ausbau.migrate(s);
 for(const k of ['money','inv','house','mail','city'])assert.deepEqual(clone(s[k]),before[k],k);
 assert.deepEqual(clone(s.post.m.schatz),before.post.m.schatz);assert.deepEqual(clone(s.post.m.brunnen),before.post.m.brunnen);
 for(const id of X.EVENTS)assert.equal(s.post.m[id].st,'');
 assert.equal(X.activeMission(s),'brunnen','laufende alte Mission bleibt aktiv');
});

test('Reihenfolge: neue Ereignisse erst nach den drei alten, nur wenn sinnvoll (Eignung), nie zwei gleichzeitig',()=>{
 const s=base();s.post.lastMyst=-20;night(s);assert.equal(s.post.m.schatz.st,'brief');
 const t=base();done(t,'schatz','haus7','brunnen');t.post.lastMyst=-20;night(t);
 assert.equal(t.post.m.vermisst.st,'','ohne Mieter kein Vermisst-Ereignis');assert.equal(t.post.m.verkauf.st,'brief','freier Bauplatz → Hausverkauf');
 assert.equal(X.EVENTS.filter(id=>t.post.m[id].st&&t.post.m[id].st!=='fertig').length,1);
 t.post.lastMyst=-20;night(t);assert.equal(X.EVENTS.filter(id=>t.post.m[id].st==='brief').length,1,'keine zweite Mission, solange eine läuft');
});

test('W61 Mieter verschwunden: Zettel → Bahnhof → Wiedersehen; Miete läuft weiter; Belohnung einmal; Mieter bleibt',()=>{
 const s=base();done(s,'schatz','haus7','brunnen');s.city.plots[0]=Object.assign(s.city.plots[0],{start:1,due:2,ready:true,tenant:'ida',since:3,lastRent:10});
 const i=startMission(s,'vermisst');assert.equal(s.post.m.vermisst.who,'ida');assert.match(s.mail[i].b,/Miete/);
 X.read(s,i);assert.equal(s.post.m.vermisst.st,'suche');
 s.min=600;assert.equal(St.location(s,'ida',false),null,'Ida ist unauffindbar');reachTarget(s,'suche');
 let m=maps(s);const z=m.stadt.obj.find(o=>o.act==='post:ev:zettel61');assert.ok(z,'Zettel an der Haustür');
 const m0=s.money;const {rent}=night(s);assert.equal(rent,60,'Miete fällt nicht aus');assert.equal(s.money,m0+60);
 assert.equal(s.city.plots[0].tenant,'ida','Mietvertrag bleibt bestehen');
 assert.equal(X.find61(s),false,'ohne Spur kein Fund');assert.equal(X.clue61(s),true);assert.equal(X.clue61(s),false);
 s.min=600;const loc=St.location(s,'ida',false);assert.equal(loc.map,'bahnhof');m=maps(s);assert.ok(reached(m.bahnhof).has((loc.x)+','+(loc.y+1)));
 assert.ok(m.bahnhof.obj.some(o=>o.k==='koffer'));reachTarget(s,'spur');
 const t=X.evTalk(s,'ida');assert.ok(t&&t.lines.length>=3);const m1=s.money,tee=s.inv.tee||0;
 assert.equal(s.post.m.vermisst.st,'fertig');assert.equal(s.money,m1,'Geld bereits beim Fund gebucht');
 const r=reload(s);assert.equal(X.find61(r),false);assert.equal(X.evTalk(r,'ida'),null,'Belohnung nicht erneut');
 assert.equal(r.inv.tee,tee);r.min=600;assert.equal(St.location(r,'ida',false).map,'stadt','Ida ist zurück in Lindenstadt');
 assert.equal(maps(r).bahnhof.obj.some(o=>o.k==='koffer'),false);
});

test('W61 Belohnungsbilanz: genau +150 G und +2 Tee',()=>{
 const s=base();done(s,'schatz','haus7','brunnen');s.city.plots[1]=Object.assign(s.city.plots[1],{start:1,due:2,ready:true,tenant:'noah',since:3,lastRent:10});
 const i=startMission(s,'vermisst');X.read(s,i);X.clue61(s);const m0=s.money,t0=s.inv.tee||0;X.evTalk(s,'noah');
 assert.equal(s.money,m0+150);assert.equal(s.inv.tee,t0+2);X.evTalk(s,'noah');assert.equal(s.money,m0+150);
});

test('W62 Haus zu verkaufen: Ruine auf freiem Bauplatz → Kauf 900 G → derselbe Bauplatz bezugsfertig → Mietanfrage; einmalig',()=>{
 const s=base();done(s,'schatz','haus7','brunnen');const i=startMission(s,'verkauf');const plot=s.post.m.verkauf.plot;
 X.read(s,i);assert.equal(s.post.m.verkauf.st,'angebot');reachTarget(s,'angebot');
 let m=maps(s);const ruin=m.stadt.obj.find(o=>o.act==='post:ev:haus62');assert.equal(ruin.k,'ruine');assert.equal(ruin.x,St.places[plot].x);
 assert.ok(m.stadt.obj.some(o=>o.act==='plot:'+plot&&o.k==='board'),'Bautafel bleibt');
 const poor=reload(s);poor.money=100;assert.equal(X.buy62(poor),false);assert.equal(poor.money,100);
 const m0=s.money;assert.equal(X.buy62(s),true);assert.equal(X.buy62(s),false);assert.equal(s.money,m0-900);
 assert.equal(s.city.plots[plot].ready,true);assert.equal(St.phase(s,plot),4);assert.equal(s.city.plots.filter(p=>p.ready).length,1,'kein zweiter Hauszähler');
 m=maps(s);assert.ok(!m.stadt.obj.some(o=>o.act==='post:ev:haus62'));assert.equal(m.stadt.obj.find(o=>o.act==='plot:'+plot&&o.k!=='board').k,'house');
 let a=-1;for(let n=0;n<4&&a<0;n++){night(s);a=s.mail.findIndex(x=>x.kind==='anfrage'&&x.offer.plot===plot);}assert.ok(a>=0,'Mietanfrage für das gekaufte Haus');
 const r=reload(s);assert.equal(X.buy62(r),false);assert.equal(r.money,s.money);
});

test('W62 Ablehnen schließt ab, Bauplatz bleibt frei; anderweitig bebaut → Ereignis endet ohne Kosten',()=>{
 const s=base();done(s,'schatz','haus7','brunnen');const i=startMission(s,'verkauf');X.read(s,i);const m0=s.money;
 assert.equal(X.decline62(s),true);assert.equal(s.post.m.verkauf.st,'fertig');assert.equal(s.money,m0);assert.equal(s.city.plots[s.post.m.verkauf.plot].start,null);assert.equal(X.buy62(s),false);
 const t=base();done(t,'schatz','haus7','brunnen');const j=startMission(t,'verkauf');X.read(t,j);const p=t.post.m.verkauf.plot;
 assert.equal(St.order(t,p),true);night(t);assert.equal(t.post.m.verkauf.st,'fertig');assert.equal(t.post.m.verkauf.out,'vergeben');
});

test('W63 Villa: nur mit bewohntem Haus Nr. 7; Treffen am Stadtbrunnen; Entscheidung genau einmal mit Folgen',()=>{
 const pre=base();done(pre,'schatz','brunnen');pre.post.m.haus7.st='bau';assert.equal(X.ELIG.villa(pre),false);
 for(const wahl of ['elva','geld']){
  const s=base();done(s,'schatz','haus7','brunnen');s.city.plots.forEach(p=>Object.assign(p,{start:1,due:2,ready:true,tenant:null}));
  const i=startMission(s,'villa');assert.match(s.mail[i].b,/Villa/);X.read(s,i);assert.equal(s.post.m.villa.st,'treffen');
  s.min=600;const loc=St.location(s,'falk',false);assert.deepEqual([loc.map,loc.x,loc.y],['stadt',10,13]);s.min=1250;assert.equal(St.location(s,'falk',false),null);s.min=600;
  reachTarget(s,'treffen');const m0=s.money,p0=s.npc.elva.p,panel=X.evTalk(s,'falk').panel;assert.equal(panel.buttons.length,2);
  panel.buttons.find(b=>b.a===wahl).fn();assert.equal(s.post.m.villa.wahl,wahl);assert.equal(X.decide63(s,'geld'),false);assert.equal(X.decide63(s,'elva'),false);
  if(wahl==='geld'){assert.equal(s.money,m0+250);assert.equal(s.npc.elva.p,p0);}else{assert.equal(s.money,m0);assert.equal(s.npc.elva.p,p0+150);}
  assert.equal(St.location(s,'falk',false),null,'Herr Falk reist ab');night(s);const thanks=s.mail.filter(m=>m.mis==='villa'&&m.reply);
  assert.equal(thanks.length,wahl==='elva'?1:0);if(thanks.length){const k=s.mail.indexOf(thanks[0]),st0=s.inv.mondstein||0;assert.ok(X.claim(s,k));assert.equal(s.inv.mondstein,st0+1);assert.equal(X.claim(reload(s),k),null);}
  night(s);assert.equal(s.mail.filter(m=>m.mis==='villa'&&m.reply).length,thanks.length,'Dankesbrief nur einmal');
  s.min=600;assert.equal(St.location(s,'elva',false).map,'stadt','Elva wohnt weiter in Haus Nr. 7');
 }
});

test('W64 Geheime Tür: Brief → Tür im Mondwald → Gewölbe → Truhe einmal → Tafel kündigt Vollmondwald an → Rückweg',()=>{
 const s=base();done(s,'schatz','haus7','brunnen','verkauf','villa');const i=startMission(s,'tuer');
 // Seit 20.10.2026 (Janina fand die Tür nicht): Die Tür steht schon vor dem Brief geschlossen im Hang.
 let m=maps(s);assert.equal(m.forest.obj.find(o=>o.act==='post:ev:tuer64').k,'waldtuer','vor dem Lesen geschlossene, auffindbare Tür');
 X.read(s,i);assert.equal(s.post.m.tuer.st,'suche');reachTarget(s,'suche');m=maps(s);const d=m.forest.obj.find(o=>o.act==='post:ev:tuer64');assert.equal(d.k,'waldtuer');
 const r0=X.evAct(s,'tuer64');assert.equal(r0.travel.to,'waldtuer');assert.equal(s.post.m.tuer.st,'offen');
 const room=maps(s).waldtuer;assert.ok(room.inside);assert.ok(J.WALK.has(room.t[r0.travel.ty][r0.travel.tx]),'Ankunft begehbar');
 const ex=room.exits[0];assert.equal(ex.to,'forest');assert.ok(reached(maps(s).forest).has(ex.tx+','+ex.ty),'Rückweg im Wald begehbar');
 assert.ok(reached(room).has(ex.x+','+ex.y),'Ausgang erreichbar');reachTarget(s,'offen');
 const m0=s.money,q0=s.inv.mondquarz||0;assert.ok(X.evAct(s,'truhe64').lines);assert.equal(s.money,m0+200);assert.equal(s.inv.mondquarz,q0+2);
 assert.equal(X.chest64(s),false);assert.ok(X.evAct(s,'truhe64').note);assert.equal(s.money,m0+200);
 const r=reload(s);assert.equal(X.chest64(r),false);assert.equal(r.money,m0+200);assert.equal(X.target(r),null);
 assert.match(X.evAct(r,'tafel64').lines.map(l=>l.text).join(' '),/Vollmond|Mond ist voll/);
 const after=maps(r);assert.equal(after.forest.obj.find(o=>o.act==='post:ev:tuer64').k,'waldtuer_offen');assert.equal(X.evAct(r,'tuer64').travel.to,'waldtuer','Tür bleibt begehbar');
 assert.equal(after.waldtuer.obj.find(o=>o.act==='post:truhe64').k,'truhe_offen');
});

test('W65 Mysteriöser Bewohner: Tagesplan an drei Orten, Geheimnis nach drei Treffen, Belohnung einmal, Jonas bleibt',()=>{
 const s=base();done(s,'schatz','haus7','brunnen','verkauf','villa','tuer');const i=startMission(s,'bewohner');X.read(s,i);assert.equal(s.post.m.bewohner.st,'beobachten');
 const m=maps(s);for(const [min,map] of [[480,'bahnhof'],[720,'village'],[1000,'stadt']]){s.min=min;const l=St.location(s,'jonas',false);assert.equal(l.map,map);assert.ok(reached(m[map]).has((l.x-1)+','+l.y)||reached(m[map]).has(l.x+','+(l.y+1)),map+' erreichbar');reachTarget(s,'beobachten '+map);}
 s.min=1300;assert.equal(St.location(s,'jonas',false),null,'nachts zu Hause');assert.equal(X.observe65(s),null);
 const m0=s.money;s.min=480;X.evTalk(s,'jonas');X.evTalk(s,'jonas');assert.deepEqual(Array.from(s.post.m.bewohner.seen),['bahnhof'],'derselbe Ort zählt einmal');
 s.min=720;X.evTalk(s,'jonas');assert.equal(s.post.m.bewohner.st,'beobachten');assert.equal(s.money,m0);
 const r=reload(s);r.min=1000;const fin=X.evTalk(r,'jonas');assert.match(fin.lines.map(l=>l.text).join(' '),/Hedwig/);assert.equal(r.post.m.bewohner.st,'fertig');
 assert.equal(r.money,m0+250);assert.equal(X.evTalk(r,'jonas'),null,'danach normales Gespräch');const r2=reload(r);r2.min=1000;assert.equal(X.evTalk(r2,'jonas'),null);assert.equal(r2.money,m0+250);
 assert.equal(St.location(r2,'jonas',false).map,'stadt','Jonas bleibt Bewohner mit Tagesplan');
});

test('Alle neuen Missionsziele liegen auf vorhandenen Karten und erreichbaren Kacheln',()=>{
 const stages={vermisst:['brief','suche','spur'],verkauf:['brief','angebot'],villa:['brief','treffen'],tuer:['brief','suche','offen'],bewohner:['brief','beobachten']};
 for(const [id,list] of Object.entries(stages))for(const st of list)for(const min of [480,720,1000]){const s=base();done(s,...X.MISSIONS);s.min=min;s.city.plots[0]=Object.assign(s.city.plots[0],{start:1,due:2,ready:true,tenant:'ida',since:1});
  const e=s.post.m[id];e.st=st;e.plot=id==='verkauf'?1:0;e.who='ida';e.seen=[];reachTarget(s,id+'/'+st+'/'+min);}
});
