/* Etappe 2 – Lebendiges Dorf und Romantik: Logik mit den echten Produktionsmodulen im VM-Kontext.
   W01 Geheimnisse, W02 Beziehungen, W04 Tratsch, W06 Verkuppeln, W25 Picknick, W26 Missverständnis, W28 Briefe,
   W30 Ausflug, W31 Jahrestag, W38 Geburtstage. Je Strang: Weg, Abschluss, Belohnung genau einmal, Reload-fest, Ziele erreichbar. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);
for(const f of ['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js','jm-ereignisse.js','jm-dorf.js','jm-romantik.js']){const p=path.join(__dirname,'..',f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),c);}
const J=c.window.JM,X=J.Post,St=J.Stadt,D=J.Dorf,R=J.Rom;
const clone=o=>JSON.parse(JSON.stringify(o));
const day=(y,se,d)=>(y-1)*J.DPS*4+se*J.DPS+d;
function base(extra){const s={day:10,min:600,money:1000,inv:{},stats:{earned:0},mail:[],mailQ:[],npc:{},name:'Janina',energy:50,maxE:100,rene:{met:true,cuddles:0},...extra};
 for(const id in J.NPCS)s.npc[id]=s.npc[id]||{p:0,met:true,talk:0,gift:0,r3:false};J.Ausbau.migrate(s);return s;}
function night(s,rng){s.day++;s.min=360;const rent=St.advance(s);const made=X.night(s,{rent},rng||(()=>0.5));s.mail.push(...s.mailQ);s.mailQ=[];return made;}
const reload=s=>{const r=clone(s);J.Ausbau.migrate(r);return r;};
const hearts=(s,id,h)=>{s.npc[id].p=h*100;};
const texts=r=>(r&&r.lines||[]).map(l=>l.text).join(' | ');
const choose=(r,i)=>{const l=r.lines[r.lines.length-1];assert.ok(l.choices&&l.choices[i],'Auswahl '+i+' vorhanden: '+texts(r));return l.choices[i].fn();};
function reached(m){const q=[m.spawn],seen=new Set(q.map(p=>p.join(',')));for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&J.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}return seen;}
function maps(s){const m=J.buildMaps();St.apply(m,s);return m;}
function reachTarget(s,label){const t=X.target(s);assert.ok(t,label+': Wegweiserziel');const m=maps(s);assert.ok(m[t.map],label+': Karte '+t.map);
 const spawn=m[t.map].spawn||[m[t.map].exits[0].x,m[t.map].exits[0].y];assert.ok(reached({...m[t.map],spawn}).has(t.x+','+t.y),label+': Ziel erreichbar '+JSON.stringify(t));return t;}
const adj=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1;

test('Picknick beginnt nur im vereinbarten Fenster; verpasst heißt freundlich neu verabreden',()=>{
 const s=base();assert.ok(R.propose(s,R.options(s,'picknick')[0].k).ok);
 for(const min of [690,719,900,1080]){s.min=min;assert.equal(R.dateScene(s),null,'keine Szene um Minute '+min);assert.equal(R.finish(s,'uns'),null);assert.match(R.act(s,'decke').note,/12.*15|verpasst|verabred/i);}
 for(const min of [720,899]){s.min=min;assert.ok(R.dateScene(s),'Szene im Fenster '+min);}
 s.min=1080;night(s);assert.match(s.mail.map(m=>m.b).join(' '),/neuen Tag/);assert.ok(R.options(s,'picknick').length);assert.equal(s.rom.pick.n,0);
});

test('Migration: Altspielstand ohne neue Felder behält Besitz, bekommt leere Geschichten und Standarddaten',()=>{
 const s={day:30,money:4321,inv:{ei:3,holz:12},house:{level:1,job:null},mail:[{from:'rosa',t:'x',b:'y',read:true}],mailQ:[],npc:{mei:{p:350,met:true}},rene:{met:true},
  city:{plots:[{start:3,due:6,ready:true,tenant:'ida',since:7,lastRent:29},{start:null,ready:false,tenant:null,lastRent:0},{start:null,ready:false,tenant:null,lastRent:0}]},
  post:{v:1,seq:4,m:{schatz:{st:'fertig'},haus7:{st:'fertig'},brunnen:{st:'dokument',doc:12}},req:{},orders:{},lastMyst:12,lastGift:20,lastDay:29}};
 const before=clone(s);J.Ausbau.migrate(s);
 for(const k of ['money','inv','house','mail','city'])assert.deepEqual(clone(s[k]),before[k],k);
 assert.deepEqual(clone(s.post.m.brunnen),before.post.m.brunnen);
 for(const id of ['mei','henk','paula','rosa'])assert.equal(s.dorf.sec[id].st,0);
 assert.equal(s.dorf.paar.st,'');assert.equal(s.dorf.streit.st,'');assert.equal(s.rom.date,null);
 assert.deepEqual(clone(s.rom.jb),{s:2,d:6});assert.deepEqual(clone(s.rom.jt),{s:1,d:12});
 const again=reload(s);assert.deepEqual(clone(again.dorf),clone(s.dorf));assert.deepEqual(clone(again.rom),clone(s.rom));
 const broken=base();broken.rom={date:{place:'mond'},jb:{s:9,d:0},mem:'x'};broken.dorf={sec:{mei:'kaputt'}};J.Ausbau.migrate(broken);
 assert.equal(broken.rom.date,null);assert.deepEqual(clone(broken.rom.jb),{s:2,d:6});assert.deepEqual(clone(broken.rom.mem),[]);assert.equal(broken.dorf.sec.mei.st,0);
});

test('W01: vier Bewohner, je drei Teile nach Herzen, ein Teil pro Tag, Lohn genau einmal, Reload mitten in der Geschichte',()=>{
 for(const id of ['mei','henk','paula','rosa']){const s=base();const g=D.SEC[id];assert.equal(g.steps.length,3,id);
  hearts(s,id,1);assert.equal(D.secretTalk(s,id),null,id+': unter 2 Herzen nichts');
  hearts(s,id,2);let r=D.secretTalk(s,id);assert.ok(r&&r.lines.length>=3,id+': Teil 1');assert.equal(s.dorf.sec[id].st,1);
  assert.equal(D.secretTalk(s,id),null,id+': am selben Tag kein zweiter Teil');
  s.day++;assert.equal(D.secretTalk(s,id),null,id+': Teil 2 erst ab 4 Herzen');hearts(s,id,4);
  const mid=reload(s);assert.equal(mid.dorf.sec[id].st,1,'Reload behält Teil 1');
  r=D.secretTalk(mid,id);assert.ok(r,id+': Teil 2 nach Reload');assert.equal(mid.dorf.sec[id].st,2);
  mid.day++;hearts(mid,id,6);const inv0=clone(mid.inv);r=D.secretTalk(mid,id);assert.equal(mid.dorf.sec[id].st,3);assert.ok(r.banner);
  for(const [k,n] of Object.entries(g.reward.items))assert.equal(mid.inv[k],(inv0[k]||0)+n,id+': Lohn '+k);
  const after=clone(mid.inv);mid.day++;assert.equal(D.secretTalk(mid,id),null);const re=reload(mid);re.day+=5;assert.equal(D.secretTalk(re,id),null);
  assert.deepEqual(clone(mid.inv),after,'kein zweiter Lohn');
  const html=D.diary(mid,x=>String(x));assert.match(html,new RegExp(g.t));assert.match(html,/3 von 3/);}
});

test('W02: Streit Lin–Paula mit Szene und Versöhnung; Folgegespräche und Orte ändern sich; Freundschaft Rosa–Henk',()=>{
 const s=base();hearts(s,'lin',2);
 assert.equal(D.streitTalk(s,'paula'),null,'Paula zuerst: noch nichts');
 let r=D.talk(s,'lin');assert.match(texts(r),/ungenießbar/);assert.equal(s.dorf.streit.st,'lin');
 assert.ok(D.extraLines(s,'lin').some(t=>/Paula/.test(t)));assert.ok(D.relations(s).find(x=>x.a==='lin').k==='streit');
 r=D.talk(s,'paula');assert.match(texts(r),/unglaublich scharf/);assert.equal(s.dorf.streit.st,'zettel');
 const z=reload(s);r=D.talk(z,'lin');const later=choose(r,1);assert.equal(z.dorf.streit.st,'zeit');assert.match(texts(later),/Nacht/);
 assert.equal(D.talk(z,'lin'),null,'am selben Tag nichts Neues');z.day++;r=D.talk(z,'lin');assert.equal(z.dorf.streit.st,'versoehnt');assert.match(texts(r),/geschlafen/);
 r=D.talk(s,'lin');const p0=s.npc.paula.p;const done=choose(r,0);assert.equal(s.dorf.streit.st,'versoehnt');assert.equal(s.npc.paula.p,p0+30);assert.ok(done.banner);
 assert.equal(D.streitEnd(s,'jetzt'),null,'nicht doppelt');
 assert.ok(D.extraLines(s,'lin').some(t=>/mittwochs/.test(t)));assert.ok(D.extraLines(s,'paula').some(t=>/ohne Chili/.test(t)));
 assert.equal(D.relations(s).find(x=>x.a==='lin').label,'Wieder Freunde');
 s.day=3;s.min=1000;assert.equal(D.cal.wd(s),2);assert.deepEqual(clone(St.location(s,'lin',false)),{map:'village',x:20,y:12});s.min=1100;assert.equal(St.location(s,'lin',false),null);
 // Freundschaft Rosa–Henk
 const f=base();assert.equal(D.freundTalk(f,'rosa'),null);f.dorf.sec.henk={st:3,day:5};f.day=6;r=D.talk(f,'rosa');assert.match(texts(r),/Schulbank/);assert.equal(f.dorf.freund.st,'erzaehlt');
 assert.ok(D.extraLines(f,'rosa').some(t=>/Tee am Fluss/.test(t)));assert.equal(D.freundTalk(f,'rosa'),null);
});

test('W04: Tratsch nur über echte Ereignisse, nie von Beteiligten, jede Meldung einmal',()=>{
 const s=base();for(let i=0;i<20;i++)for(const id of J.NPC_ORDER)assert.equal(D.gossip(s,id),null,'frischer Hof: kein Tratsch');
 const facts={jonas:t=>{t.post.m.bewohner.st='fertig';},elva:t=>{t.post.m.haus7.st='fertig';},brunnen:t=>{t.post.m.brunnen.st='fertig';},
  zurueck:t=>{t.post.m.vermisst={st:'fertig',who:'ida'};},falk:t=>{t.post.m.villa={st:'fertig',wahl:'elva'};},hauskauf:t=>{t.post.m.verkauf={st:'fertig',out:'gekauft'};},
  tuer:t=>{t.post.m.tuer.st='fertig';},mieter:t=>{t.city.plots[0].tenant='noah';},streit:t=>{t.dorf.streit.st='lin';},versoehnt:t=>{t.dorf.streit.st='versoehnt';},
  paar:t=>{t.dorf.paar.st='paar';},picknick:t=>{t.rom.pick.n=1;},ausflug:t=>{t.rom.aus.n=1;},bank:t=>{t.rom.mv.st='fertig';}};
 for(const [id,set] of Object.entries(facts)){const t=base();assert.ok(!D.facts(t).some(f=>f.id===id),id+': ohne Ereignis keine Meldung');set(t);
  assert.ok(D.facts(t).some(f=>f.id===id),id+': Ereignis → Meldung');const F=D.FACTS.find(f=>f.id===id),inv=typeof F.inv==='function'?F.inv(t):F.inv;
  for(const who of inv)assert.equal(D.gossip(t,who),null,id+': '+who+' tratscht nicht über sich');
  const teller=['mei','rosa','paula','henk','lin'].find(x=>!inv.includes(x));const g=D.gossip(t,teller);assert.ok(g,id+': '+teller+' erzählt');
  assert.ok(!Object.keys(facts).filter(x=>x!==id).some(x=>D.FACTS.find(f=>f.id===x).ok(t)),id+': keine anderen Fakten wahr');
  for(const x of J.NPC_ORDER)assert.equal(D.gossip(t,x),null,id+': nur einmal erzählt');}
 const v=base();v.dorf.streit.st='versoehnt';assert.ok(!D.facts(v).some(f=>f.id==='streit'),'widerlegter Streit wird nicht mehr erzählt');
 const b=base();b.day=day(1,0,5);const g=D.gossip(b,'rosa');assert.match(g,/Mei Geburtstag/);assert.equal(D.gossip(b,'mei'),null,'Mei erzählt nicht von sich');
 b.npc.elva.met=false;b.day=day(1,3,12);assert.equal(D.gossip(b,'rosa'),null,'unbekannte Elva: kein Geburtstagstratsch');
});

test('W06: Mei und Timo – Hinweis, Brief, Treffen mit Ortswahl, Entscheidung, Paar; verpasstes Treffen neu ausmachen',()=>{
 const s=base();hearts(s,'mei',3);s.dorf.sec.mei.st=3;s.min=600;
 let r=D.talk(s,'mei');assert.match(texts(r),/Holz/);assert.equal(s.dorf.paar.st,'hinweis');
 r=D.talk(s,'timo');r=choose(r,0);assert.equal(s.dorf.paar.st,'brief');assert.match(D.relations(s).find(x=>x.a==='mei').txt,/Holzvogel/);
 const m=reload(s);r=D.talk(m,'mei');assert.match(texts(r),/Vogel/);r=choose(r,0);assert.equal(m.dorf.paar.st,'treffen');assert.equal(m.dorf.paar.meet,m.day,'vor 17 Uhr: heute');
 assert.equal(m.dorf.paar.place,'brunnen');m.min=900;const t=reachTarget(m,'Treffen');assert.equal(t.map,'village');
 assert.equal(St.location(m,'mei',false),null,'vor 18 Uhr noch nicht dort');assert.match(texts(D.talk(m,'mei')),/nervös/);
 m.min=1090;const lm=St.location(m,'mei',false),lt=St.location(m,'timo',false);assert.deepEqual([lm.x,lm.y],clone(D.MEET.brunnen.mei));assert.ok(adj([lm.x,lm.y],[lt.x,lt.y]),'stehen nebeneinander');
 assert.ok(adj(D.MEET.brunnen.spot,D.MEET.brunnen.mei),'Spielerin steht dabei');
 const mp=maps(m).village;for(const k of ['mei','timo','spot'])assert.ok(J.WALK.has(mp.t[D.MEET.brunnen[k][1]][D.MEET.brunnen[k][0]]),k+' begehbar');
 assert.deepEqual(clone(D.glow(m,'village')),['mei','timo']);
 r=D.talk(m,'timo');const fin=choose(r,0);assert.equal(m.dorf.paar.st,'paar');assert.ok(fin.banner);assert.equal(D.together(m,'mei'),null,'nur einmal');
 assert.ok(St.location(m,'mei',false),'nach der Szene bleiben sie bis 20 Uhr');
 m.day++;m.min=1100;while(St.guests(m,false).some(g=>g==='mei'||g==='timo'))m.day++;assert.deepEqual([St.location(m,'mei',false).x,St.location(m,'timo',false).x],[14,15],'abends zusammen');m.min=1180;assert.equal(St.location(m,'mei',false),null);
 assert.ok(D.extraLines(m,'mei').some(x=>/Timo/.test(x)));assert.ok(D.extraLines(m,'timo').some(x=>/Mei/.test(x)));
 // verpasst → neu ausmachen, Ort Ufer, nach 17 Uhr: morgen
 const v=base();hearts(v,'mei',3);v.dorf.sec.mei.st=3;D.talk(v,'mei');choose(D.talk(v,'timo'),1);assert.equal(v.dorf.paar.st,'fragen');v.min=1100;
 choose(D.talk(v,'mei'),1);assert.equal(v.dorf.paar.meet,v.day+1);assert.equal(v.dorf.paar.place,'ufer');v.day+=2;v.min=600;
 r=D.talk(v,'mei');assert.match(texts(r),/nicht getraut/);choose(r,0);assert.equal(v.dorf.paar.meet,v.day);v.min=1100;
 assert.ok(St.location(v,'timo',false));choose(D.talk(v,'mei'),1);assert.equal(v.dorf.paar.st,'paar');
 const u=maps(v).village;for(const k of ['mei','timo','spot'])assert.ok(J.WALK.has(u.t[D.MEET.ufer[k][1]][D.MEET.ufer[k][0]]),'Ufer '+k+' begehbar');
});

test('W25/W28: Picknick per Brief verabreden, Decke auf der Karte, Szene mit Auswahl, Erinnerung, Brief danach – alles einmal',()=>{
 const s=base({day:5});s.post.lastMyst=s.day;// keine Geheimnisbriefe dazwischen
 let made=night(s);const i=s.mail.findIndex(m=>m.rom&&m.rom.ask==='picknick');assert.ok(i>=0,'Einladung von René: '+made.map(m=>m.t).join('|'));assert.equal(s.mail[i].from,'von');
 s.min=600;const ops=R.letterChoices(s,s.mail[i]);assert.equal(ops.length,4);assert.ok(ops.every(o=>/heute/.test(o.t)),'am Vormittag: heute');
 const key=ops.find(o=>o.k.includes('|see|mittag|')).k;const a=R.letterAnswer(s,i,key);assert.ok(a.ok);assert.equal(R.letterAnswer(s,i,key).ok,false,'nur einmal');
 assert.equal(s.rom.date.place,'see');assert.equal(s.rom.date.day,s.day);assert.deepEqual(clone(R.calMarks(s,D.cal.se(s),D.cal.d(s))),['Picknick']);
 assert.match(texts(R.reneTalk(s)),/Nicht vergessen/);
 const mp=maps(s);const deck=mp.forest.obj.find(o=>o.k==='picknick');assert.ok(deck,'Decke liegt am Waldsee');assert.equal(deck.act,'post:ev:rom:decke');
 const P=R.PLACES.see;assert.ok(J.WALK.has(mp.forest.t[P.rene[1]][P.rene[0]])&&J.WALK.has(mp.forest.t[P.spot[1]][P.spot[0]]));
 assert.ok(adj(P.rene,[deck.x+deck.w-1,deck.y])&&adj(P.spot,[deck.x,deck.y]),'beide stehen an der Decke');
 s.min=690;assert.deepEqual(clone(R.plan(s)),{map:'forest',pos:clone(P.rene),mode:'date'});const t=reachTarget(s,'Picknick');assert.deepEqual([t.x,t.y],clone(P.spot));
 s.min=725;let r=R.reneTalk(s);assert.match(texts(r),/Decke/);
 const mid=reload(s);assert.ok(R.dateScene(mid),'Reload vor der Auswahl: Szene noch offen');
 const e0=s.energy;r=choose(r,2);assert.equal(s.rom.pick.n,1);assert.equal(s.energy,e0+30);assert.equal(s.rom.mem.length,1);assert.match(s.rom.mem[0].txt,/Wolken/);
 assert.equal(R.finish(s,'uns'),null);assert.equal(R.dateScene(s),null);assert.equal(R.act(s,'decke').note.length>0,true);
 const re=reload(s);assert.equal(re.rom.pick.n,1);assert.equal(R.finish(re,'uns'),null);assert.ok(R.hearts(s),'Herzen nach der Szene');
 made=night(s);const l=s.mail.find(m=>m.t==='Nach unserem Picknick');assert.ok(l,'Brief nach dem Picknick');assert.match(l.b,/Waldsee/);assert.match(l.b,/Wolkenpudel/);
 assert.equal(s.rom.date,null);for(let n=0;n<5;n++)night(s);assert.equal(s.mail.filter(m=>m.t==='Nach unserem Picknick').length,1,'Brief nur einmal');
 assert.equal(s.mail.filter(m=>m.t==='Eine Einladung').length,1,'Einladung nur einmal');
});

test('W25: Verabredung im Tagebuch (Wiese am Hof, morgen 17 Uhr); verpasst → freundlicher Brief und neue Wahl',()=>{
 const s=base();s.min=1000;const ops=R.options(s,'picknick');const k=ops.find(o=>o.k.startsWith('picknick|wiese|abend'));assert.match(k.t,/morgen/);
 assert.equal(R.options(s,'ausflug').length,0,'Ausflug erst nach dem ersten Picknick');
 assert.ok(R.propose(s,k.k).ok);assert.equal(R.options(s,'picknick').length,0,'nur eine Verabredung gleichzeitig');
 assert.ok(!maps(s).farm.obj.some(o=>o.k==='picknick'),'heute noch keine Decke');
 night(s);const f=maps(s).farm;const deck=f.obj.find(o=>o.k==='picknick');assert.ok(deck);
 const plain=J.buildMaps().farm;for(const [x,y] of [[deck.x,deck.y],[deck.x+1,deck.y],R.PLACES.wiese.spot,R.PLACES.wiese.rene])assert.ok(J.WALK.has(plain.t[y][x])&&plain.t[y][x]!==J.T.FELD&&plain.t[y][x]!==J.T.GLAS,'kein Beet und kein Gewächshaus unter der Decke '+x+','+y);
 s.min=1050;reachTarget(s,'Wiese');night(s);assert.equal(s.rom.date,null);assert.equal(s.rom.missed,1);
 const l=s.mail.find(m=>m.t==='Schade um gestern');assert.ok(l&&l.rom.ask==='picknick');assert.ok(!/schuld/i.test(l.b));
 assert.ok(!maps(s).farm.obj.some(o=>o.k==='picknick'),'Decke wieder weg');assert.ok(R.letterChoices(s,l).length>0);
});

test('W26: Missverständnis nach dem Picknick – Ausweichen, Timos Hinweis, Auflösung mit Herzbank, neue Gespräche',()=>{
 const s=base();s.rom.pick={n:1,last:s.day,first:s.day};s.rom.mem.push({k:'picknick',day:s.day,place:'see',choice:'uns',t:'x',txt:'y',l:1});
 night(s);assert.equal(s.rom.mv.st,'heimlich');
 let r=R.reneTalk(s);assert.match(texts(r),/Holz/);assert.equal(s.rom.mv.st,'ausweichen');assert.match(texts(R.reneTalk(s)),/gleich fertig/);
 r=R.npcTalk(s,'timo');assert.match(texts(r),/Holz gekauft/);assert.equal(s.rom.mv.st,'hinweis');
 const m=reload(s);r=R.reneTalk(m);r=choose(r,1);assert.equal(m.rom.mv.st,'fertig');assert.match(texts(r),/Niemals/);assert.ok(r.refresh);
 const f=maps(m).farm;const bank=f.obj.find(o=>o.k==='herzbank');assert.ok(bank);assert.equal(f.t[bank.y][bank.x],J.T.BLOCK);
 const plain=J.buildMaps().farm;for(let x=bank.x;x<bank.x+bank.w;x++)assert.ok([J.T.GRAS,J.T.TUFF,J.T.BLUME].includes(plain.t[bank.y][x]),'Bank steht auf Wiese, nicht im Gewächshaus');
 assert.ok(R.extraLines(m).some(t=>/Bank/.test(t)));assert.equal(R.mvEnd(m,'ehrlich'),null);
 const e=m.energy;assert.match(R.act(m,'bank').note,/Energie \+10/);assert.equal(m.energy,e+10);R.act(m,'bank');assert.equal(m.energy,e+10,'einmal am Tag');
 night(m);assert.ok(m.mail.some(x=>x.t==='Zur Herzbank'));
 const o=base();o.rom.pick={n:1,last:o.day,first:o.day};night(o);R.reneTalk(o);o.day++;r=R.reneTalk(o);assert.ok(r.lines.at(-1).choices,'auch ohne Timo löst es sich am nächsten Tag');
});

test('W30: Ausflug nach Lindenstadt – nach dem ersten Picknick, Tisch am Stadtbrunnen, Auswahl, Erinnerung und Brief',()=>{
 const s=base();s.rom.pick={n:1,last:s.day-3,first:s.day-3};s.rom.mv.st='fertig';s.post.lastMyst=s.day;
 night(s);const i=s.mail.findIndex(m=>m.rom&&m.rom.ask==='ausflug');assert.ok(i>=0,'Ausflugsbrief');s.min=700;
 const ops=R.letterChoices(s,s.mail[i]);assert.equal(ops.length,1);assert.ok(R.letterAnswer(s,i,ops[0].k).ok);
 const st=maps(s).stadt,tb=st.obj.find(o=>o.k==='bistro');assert.ok(tb);const P=R.PLACES.stadt;assert.ok(adj(P.rene,[tb.x+1,tb.y])&&adj(P.spot,[tb.x,tb.y]));
 s.min=1030;reachTarget(s,'Ausflug');assert.equal(R.plan(s).map,'stadt');
 let r=R.reneTalk(s);assert.equal(r.lines.at(-1).choices.length,2,'ohne Mara zwei Möglichkeiten');
 s.city.plots[2].tenant='mara';r=R.reneTalk(s);assert.equal(r.lines.at(-1).choices.length,3);r=choose(r,2);assert.equal(s.rom.aus.n,1);assert.match(s.rom.mem.at(-1).txt,/Geige/);
 night(s);assert.ok(s.mail.some(m=>m.t==='Lindenstadt mit dir'&&/Walzer/.test(m.b)));
});

test('W31: Jahrestag – gespeichertes Datum, jedes Jahr eine Szene mit Kerzen, nie doppelt (Reload, Datumswechsel)',()=>{
 const s=base();s.day=day(1,1,12);s.min=1000;assert.ok(R.jtToday(s));assert.equal(R.jtScene(s),null,'erst ab 18 Uhr');
 const h=maps(s).haus;assert.ok(h.obj.some(o=>o.k==='tisch_jt'&&o.act==='post:ev:rom:tisch'),'Kerzen auf dem Tisch');
 s.min=1100;assert.deepEqual(clone(R.plan(s)),{map:'haus',pos:clone(R.HOME.rene),mode:'jt'});reachTarget(s,'Jahrestag');
 let r=R.reneTalk(s);assert.match(texts(r),/Jahrestag/);const mid=reload(s);assert.ok(R.jtScene(mid),'Reload vor der Wahl');
 r=choose(r,0);assert.equal(s.energy,s.maxE);assert.ok(s.rom.jtDone[1]);assert.equal(R.jtScene(s),null);assert.equal(R.reneTalk(s),null);
 assert.ok(R.setDate(s,'jt',1,13).ok);s.day++;assert.ok(R.jtToday(s));assert.equal(R.jtScene(s),null,'Datum verschoben: im selben Jahr nicht noch einmal');
 assert.equal(R.setDate(s,'jt',4,1).ok,false);assert.equal(R.setDate(s,'jt',1,15).ok,false);
 const y2=base();y2.rom.jtDone={1:{day:26}};y2.day=day(2,1,12);y2.min=1100;assert.ok(R.jtScene(y2),'nächstes Jahr wieder');
 const back=maps(base()).haus;assert.ok(back.obj.some(o=>o.k==='table')&&!back.obj.some(o=>o.k==='tisch_jt'),'sonst normaler Tisch');
 const two=J.buildMaps();St.apply(two,s);s.day=day(1,1,12);St.apply(two,s);St.apply(two,base());assert.equal(two.haus.obj.filter(o=>o.k==='table').length,1,'Tisch zurückgesetzt');
});

test('W38: Geburtstage – Bewohner freuen sich über passende Geschenke und danken; Janina bekommt Post, Kuchen und Besuch, einmal pro Jahr',()=>{
 const s=base({day:day(1,0,5)});assert.ok(D.isBday(s,'mei'));
 assert.match(D.bdayGift(s,'mei','erdbeere','love'),/am liebsten/);assert.equal(D.bdayGift(s,'mei','tee','like'),null,'zweites Geschenk ohne Sonderantwort');
 assert.equal(D.bdayGift(s,'lin','tee','like'),null,'Lin hat heute keinen Geburtstag');
 night(s);const d=s.mail.find(m=>m.from==='mei'&&m.t==='Danke für mein Geburtstagsgeschenk');assert.ok(d&&d.att,'Dankesbrief mit Beilage');
 for(let n=0;n<4;n++)night(s);assert.equal(s.mail.filter(m=>m.t==='Danke für mein Geburtstagsgeschenk').length,1);
 const j=base();j.day=day(1,2,5);j.post.lastMyst=j.day+10;night(j);assert.ok(R.jbToday(j));
 const card=j.mail.find(m=>m.kind==='geburtstag');assert.ok(card&&card.att,'Geburtstagspost');assert.match(card.b,/Mei:/);
 const inv0=clone(j.inv);X.claim(j,j.mail.indexOf(card));X.claim(j,j.mail.indexOf(card));assert.equal(j.inv.erdbeere,(inv0.erdbeere||0)+3,'Beilage einmal');
 j.min=400;let r=R.reneTalk(j);assert.match(texts(r),/Geburtstag/);assert.equal(j.inv.nudeln,2);assert.equal(R.reneTalk(j),null);assert.equal(reload(j).inv.nudeln,2);
 const re=reload(j);assert.equal(R.bdayRene(re),null,'Reload: kein zweiter Kuchen');
 j.min=590;assert.equal(St.location(j,'rosa',false),null);j.min=700;const lr=St.location(j,'rosa',false),lm=St.location(j,'mei',false);assert.equal(lr.map,'farm');assert.equal(lm.map,'farm');
 const f=maps(j).farm,tb=f.obj.find(o=>o.k==='geburtstagstisch');assert.ok(tb);assert.ok(adj([lr.x,lr.y],[tb.x,tb.y])&&adj([lm.x,lm.y],[tb.x+1,tb.y])&&adj(R.BDAY.spot,[tb.x+1,tb.y]));
 for(const [x,y] of [[lr.x,lr.y],[lm.x,lm.y],R.BDAY.spot,[tb.x,tb.y],[tb.x+1,tb.y]]){const t0=J.buildMaps().farm.t[y][x];assert.ok(J.WALK.has(t0)&&t0!==J.T.FELD&&t0!==J.T.GLAS,'frei '+x+','+y);}
 reachTarget(j,'Besuch');r=R.npcTalk(j,'mei');assert.match(texts(r),/Überraschung/);assert.equal(j.inv.tee,2);assert.equal(R.npcTalk(j,'rosa'),null);assert.equal(R.party(reload(j)),null);
 j.min=1000;assert.equal(St.location(j,'rosa',false),null,'Besuch geht wieder');
 night(j);assert.ok(!maps(j).farm.obj.some(o=>o.k==='geburtstagstisch'));assert.ok(j.mail.some(m=>m.t==='Noch ein Geburtstagsbrief'));
 const k=base();assert.ok(R.setDate(k,'jb',0,3).ok);assert.deepEqual([k.rom.jb.s,k.rom.jb.d],[0,3]);k.day=day(2,0,3);assert.ok(R.jbToday(k));k.min=400;assert.ok(R.reneTalk(k),'nächstes Jahr wieder');
});

test('Post: mit allen neuen Briefen bleiben es 1–3 Briefe pro Nacht über 60 Nächte; alle Wegweiserziele erreichbar',()=>{
 let seed=7;const rng=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const s=base({day:3});s.rene.cuddles=6;for(const id of ['mei','lin','rosa','paula','henk'])hearts(s,id,6);
 for(let n=0;n<60;n++){const made=night(s,rng);assert.ok(made.length>=1&&made.length<=3,'Tag '+s.day+': '+made.length);
  if(s.rom.date===null&&n%7===2){const o=R.options(s,n%2?'picknick':'ausflug')[0]||R.options(s,'picknick')[0];if(o)R.propose(s,o.k);}
  const d=s.rom.date;if(d&&d.day===s.day&&n%3){s.min=d.from;reachTarget(s,'Tag '+s.day);const r=R.reneTalk(s);if(r&&r.lines.at(-1).choices)choose(r,0);}
  if(R.jtToday(s)){s.min=1100;reachTarget(s,'Jahrestag');}s.min=600;}
 assert.ok(s.rom.pick.n>=1);assert.ok(s.mail.some(m=>m.t==='Ein Zettel am Kühlschrank'));
 const ids=new Set(s.mail.map(m=>m.id));assert.equal(ids.size,s.mail.length,'eindeutige Brief-IDs');
});

test('René: Verabredung beeinflusst Tagesplan nur im Zeitfenster; ohne Verabredung kein Eingriff',()=>{
 const s=base();assert.equal(R.plan(s),null);s.min=600;R.propose(s,R.options(s,'picknick').find(o=>o.k.includes('|see|mittag|')).k);
 s.min=600;assert.equal(R.plan(s),null,'vor 11:30 normaler Tagesplan');s.min=700;assert.equal(R.plan(s).mode,'date');s.min=900;assert.equal(R.plan(s),null,'nach 15 Uhr wieder normal');
 assert.equal(X.evAct(s,'rom:unbekannt'),null);assert.ok(X.evAct(s,'tafel64'),'bestehende Ereignis-Aktionen bleiben');
});
