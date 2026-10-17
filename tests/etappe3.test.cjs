/* Etappe 3 – Café und Tiere mit Persönlichkeit: Logik mit den echten Produktionsmodulen im VM-Kontext.
   W13–W17 Café, W18 Ziege, W19 Katze, W20 Hund-Schatz, W21 Teich, W22 Zucht, W23 Rettung, Nebenaufgabe René-Vorrang.
   Je Strang: Weg, Abschluss, Belohnung genau einmal, Reload-fest, Ziele erreichbar, Wege frei. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);
for(const f of ['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js','jm-ereignisse.js','jm-dorf.js','jm-romantik.js','jm-tiere.js','jm-cafe.js']){const p=path.join(__dirname,'..',f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),c);}
const J=c.window.JM,X=J.Post,St=J.Stadt,D=J.Dorf,R=J.Rom,Ti=J.Tiere,C=J.Cafe;
const clone=o=>JSON.parse(JSON.stringify(o));
function base(extra){const s={day:10,min:600,money:5000,inv:{},stats:{earned:0},mail:[],mailQ:[],npc:{},name:'Janina',energy:50,maxE:100,rene:{met:true,cuddles:0},
  dogs:[{name:'Lilly',fell:'weiss'},{name:'Coco',fell:'apricot'}],dogH:[0,0],field:{},forage:{},hens:[{n:'Henni',c:0,h:0}],cows:[],recipes:['pakchoi_g','suppe'],flags:{},weather:'sun',...extra};
 for(const id in J.NPCS)s.npc[id]=s.npc[id]||{p:0,met:true,talk:0,gift:0,r3:false};J.Ausbau.migrate(s);return s;}
/* Nacht wie endDay: Tag weiter, Sammelsachen neu, dann Post (mit D.NIGHT und D.LETTERS) */
function night(s,rng){s.day++;s.min=360;s.forage={};const rent=St.advance(s);X.night(s,{rent},rng||(()=>0.5));s.mail.push(...s.mailQ);s.mailQ=[];}
/* Briefe hängen am Zustand und kommen spätestens in einer der nächsten Nächte (höchstens drei Briefe pro Nacht). */
function until(s,fn,max){for(let i=0;i<(max||8);i++){if(fn())return i;night(s);}assert.ok(fn(),'Zustand erreicht');return max;}
const reload=s=>{const r=clone(s);J.Ausbau.migrate(r);return r;};
const mails=(s,re)=>s.mail.filter(m=>re.test(m.t));
const choose=(r,i)=>{const l=r.lines[r.lines.length-1];assert.ok(l.choices&&l.choices[i],'Auswahl '+i+' vorhanden');return l.choices[i].fn();};
function reached(m,spawn){const q=[spawn],seen=new Set([spawn.join(',')]);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&J.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}return seen;}
function maps(s){const m=J.buildMaps();St.apply(m,s);return m;}
function reachTarget(s,label,fn){const t=(fn||X.target)(s);assert.ok(t,label+': Wegweiserziel');const m=maps(s)[t.map];assert.ok(m,label+': Karte '+t.map);
 const sp=m.spawn||[m.exits[0].x,m.exits[0].y];assert.ok(reached(m,sp).has(t.x+','+t.y),label+': Ziel erreichbar '+JSON.stringify(t));return t;}
const day0=s=>{s.min=420;};

test('Migration: Altspielstand ohne Tiere und Café behält Besitz; kaputte Felder werden ersetzt; Reload ändert nichts',()=>{
 const s={day:30,money:4321,inv:{ei:3,holz:12},house:{level:1,job:null},mail:[{from:'rosa',t:'x',b:'y',read:true}],mailQ:[],npc:{mei:{p:350,met:true}},rene:{met:true},dogH:[5,2],hens:[{n:'H'}],cows:[]};
 const before=clone(s);J.Ausbau.migrate(s);
 for(const k of ['money','inv','house','mail','dogH','hens'])assert.deepEqual(clone(s[k]),before[k],k);
 assert.equal(s.tiere.katze.st,'');assert.equal(s.tiere.teich.st,'');assert.deepEqual(clone(s.tiere.enten),[]);assert.equal(s.cafe.st,'');assert.deepEqual(clone(s.cafe.vit),{});
 const again=reload(s);assert.deepEqual(clone(again.tiere),clone(s.tiere));assert.deepEqual(clone(again.cafe),clone(s.cafe));
 const broken=base();broken.tiere={katze:'x',enten:[{n:'a'}],hund:{found:'x'}};broken.cafe={st:'quatsch',vit:{erdbeere:-2,gibtsnicht:3,ei:2},today:{hours:'nie'}};J.Ausbau.migrate(broken);
 assert.equal(broken.tiere.katze.st,'');assert.deepEqual(clone(broken.tiere.enten),[]);assert.deepEqual(clone(broken.tiere.hund.found),[]);
 assert.equal(broken.cafe.st,'');assert.deepEqual(clone(broken.cafe.vit),{ei:2});assert.equal(broken.cafe.today,null);
});

test('W13: Rosas Brief, Renovierung mit genauen Kosten, zwei Nächte, Timos Brief einmal, Innenraum mit Theke, Vitrine, Tafel, Tischen und Stühlen',()=>{
 const s=base({inv:{holz:25,stein:12}});night(s);until(s,()=>mails(s,/Teehaus/).length);assert.equal(mails(s,/Teehaus/).length,1);
 const t=reachTarget(s,'Teehaus',C.target);assert.ok(X.target(s),'Wegweiser liefert ein Ziel');assert.equal(t.map,'village');
 const r=C.act(s,'tuer');assert.ok(r.panel);assert.equal(C.canBuild(s),true);
 const m0=s.money;r.panel.buttons[0].fn();assert.equal(s.cafe.st,'bau');assert.equal(s.money,m0-1500);assert.equal(s.inv.holz,5);assert.equal(s.inv.stein,2);
 assert.equal(C.build(s),false,'nicht doppelt');assert.equal(s.money,m0-1500);
 night(s);assert.equal(s.cafe.st,'bau');night(s);assert.equal(s.cafe.st,'fertig');assert.equal(mails(s,/Café ist fertig/).length,1);
 night(s);assert.equal(mails(s,/Café ist fertig/).length,1,'Brief nur einmal');
 const m=maps(s),v=m.village,room=m[C.ROOM];const door=v.obj.find(o=>o.act==='post:ev:cafe:tuer');assert.equal(door.k,'cafe');assert.equal(door.room,C.ROOM);
 assert.deepEqual(clone(C.act(s,'tuer').travel),{to:C.ROOM,tx:7,ty:8});
 for(const k of ['cafe_theke','vitrine','tafel','cafetisch','cafepflanze'])assert.ok(room.obj.some(o=>o.k===k),'Möbel '+k);
 assert.equal(room.decor.filter(d=>d.k==='stuhl').length,4);assert.equal(room.exits[0].to,'village');
 // Dorf bleibt begehbar: Tür, Läden, Ausgänge und alle Tagespläne der Bewohner erreichbar
 const reach=reached(v,v.spawn);assert.ok(reach.has(C.SITE.door.join(',')));
 for(const id of J.NPC_ORDER){const N=J.NPCS[id];for(const sc of [N.sched,N.freeSched||[]])for(const [,pl] of sc)if(Array.isArray(pl))assert.ok(reach.has(pl.join(',')),id+' '+pl);}
 const rr=reached(room,room.spawn);for(const q of C.SEATS.slice(0,4))assert.ok(rr.has(q[0]+','+q[1]),'Stuhl erreichbar '+q);assert.ok(rr.has('3,4'),'vor der Theke');
});

function cafeReady(extra){const s=base(extra);s.cafe.st='fertig';s.cafe.done=s.day-1;s.cafe.sent.fertig=1;return s;}
test('W15: Vitrine verbraucht echte Vorräte; Öffnungszeit; Gäste bestellen Lieblingsgerichte; Geld genau einmal; Tagesabrechnung stimmt',()=>{
 const s=cafeReady({inv:{erdbeere:3,suppe:2,tee:1}});s.min=500;
 assert.equal(C.stock(s,'erdbeere',4),false,'nicht mehr als vorhanden');assert.equal(C.stock(s,'holz',1),false,'nur Essbares');
 assert.ok(C.stock(s,'erdbeere',3));assert.ok(C.stock(s,'suppe',2));assert.equal(s.inv.erdbeere,undefined);assert.deepEqual(clone(s.cafe.vit),{erdbeere:3,suppe:2});
 assert.ok(C.unstock(s,'suppe',1));assert.equal(s.inv.suppe,1);assert.ok(C.stock(s,'suppe',1));
 assert.equal(C.canOpen(s,'frueh'),true);assert.ok(C.open(s,'frueh'));assert.equal(C.open(s,'spaet'),false,'nur eine Öffnung pro Tag');
 const g=s.cafe.today.guests;assert.equal(g.length,2);
 s.min=530;assert.equal(C.present(s,g[0].id),null,'vor 9 Uhr niemand');assert.equal(St.location(s,g[0].id,false),null);
 s.min=560;assert.ok(C.present(s,g[0].id));assert.deepEqual(clone(St.location(s,g[0].id,false)),{map:C.ROOM,x:2,y:6});
 s.min=600;const m0=s.money,before=clone(s.cafe.vit);const ids=g.map(x=>x.id);let earned=0;
 for(const id of ids){const r=C.guestTalk(s,id);assert.ok(r.lines[0].choices,'Bestellung '+id);const w=C.wish(s,id);const res=choose(r,0);assert.ok(res);const sale=s.cafe.today.sales.at(-1);
  assert.equal(sale.k,w.k);assert.ok(sale.p===C.price(w.k));earned+=sale.p+sale.tip;
  assert.equal(C.serve(s,id),null,'kein zweites Mal');}
 assert.equal(s.money,m0+earned);const n=Object.values(before).reduce((a,b)=>a+b,0)-C.vitCount(s);assert.equal(n,2,'zwei Waren weniger in der Vitrine');
 const re=reload(s);for(const id of ids)assert.equal(C.serve(re,id),null,'nach Reload kein zweites Geld');
 const b=C.bilanz(s.cafe.today);assert.equal(b.total,earned);assert.equal(b.served,2);
 // Lieblingsgericht: Mei liebt Erdbeeren
 const s2=cafeReady({inv:{erdbeere:1,suppe:1}});s2.min=500;C.stock(s2,'erdbeere',1);C.stock(s2,'suppe',1);assert.deepEqual(clone(C.wish(s2,'mei')),{k:'erdbeere',lv:'love'});assert.deepEqual(clone(C.wish(s2,'henk')),{k:'suppe',lv:'like'});
 night(s);const d=s.cafe.days.at(-1);assert.equal(d.total,earned);until(s,()=>mails(s,/Tagesabrechnung/).length,3);assert.equal(mails(s,/Tagesabrechnung/).length,1);
 assert.match(mails(s,/Tagesabrechnung/)[0].b,new RegExp('Zusammen: '+earned+' G'));night(s);assert.equal(mails(s,/Tagesabrechnung/).length,1,'Abrechnung einmal');
 s.min=900;assert.equal(C.canOpen(s,'frueh'),false,'nach Beginn nicht mehr');assert.equal(C.canOpen(s,'spaet'),false);s.min=800;assert.equal(C.canOpen(s,'spaet'),true);
});

test('W15: kein Gewinn durch Einkauf und Weiterverkauf im Café (Läden, Lins Küche, Rezepte, Bestellungen)',()=>{
 const buy={};for(const S0 of Object.values(J.SHOPS))for(const r of S0.stock)if(J.ITEMS[r.k])buy[r.k]=Math.min(buy[r.k]||1e9,r.p);
 let checked=0;for(const k of Object.keys(J.ITEMS))if(C.ok(k)&&buy[k]){checked++;assert.ok(C.maxPrice(k)<buy[k],k+': '+C.maxPrice(k)+' < '+buy[k]);assert.ok(Math.ceil(J.ITEMS[k].sell*1.5)<buy[k],k+' Bestellung');}
 assert.ok(checked>=6,'Lins Gerichte und Meis Wintervorrat geprüft ('+checked+')');
 for(const r of J.RECIPES){const ing=Object.entries(r.need);if(!ing.every(([k])=>buy[k]))continue;const cost=ing.reduce((a,[k,n])=>a+buy[k]*n,0);assert.ok(C.maxPrice(r.k)<cost,r.k+' Rezept');}
});

test('W16: Freischaltungen nach 3, 6, 10 Gästen verändern Raum und Angebot sichtbar, genau einmal',()=>{
 const s=cafeReady({inv:{suppe:30}});let total=0;
 const serveDay=()=>{s.min=500;C.stock(s,'suppe',Math.min(5,s.inv.suppe));C.open(s,'frueh');s.min=650;for(const g of s.cafe.today.guests){C.serve(s,g.id);total++;}night(s);};
 serveDay();assert.equal(s.cafe.served,2);assert.ok(!s.cafe.unlock.blumen);serveDay();assert.ok(s.cafe.unlock.blumen);
 let room=maps(s)[C.ROOM];assert.ok(room.decor.some(d=>d.k==='lichterkette'));assert.equal(room.obj.filter(o=>o.k==='cafepflanze').length,3);
 serveDay();assert.ok(s.cafe.unlock.tisch3);room=maps(s)[C.ROOM];assert.equal(room.obj.filter(o=>o.k==='cafetisch').length,3);assert.equal(C.guestCount(s),3);
 s.min=500;C.open(s,'frueh');assert.equal(s.cafe.today.guests.length,3);s.min=650;for(const g of s.cafe.today.guests)C.serve(s,g.id);night(s);
 serveDay();assert.ok(s.cafe.served>=10);assert.ok(s.cafe.unlock.kuchen);assert.equal(s.recipes.filter(r=>r==='mondkuchen').length,1);
 C.checkUnlocks(s);assert.equal(s.recipes.filter(r=>r==='mondkuchen').length,1);
 const rr=reached(room,room.spawn);for(const q of C.SEATS)assert.ok(rr.has(q[0]+','+q[1]),'Sitz erreichbar '+q);
});

test('W17: Bestellungen passen zu Vorlieben, sind kochbar oder erntbar, haben drei Tage Frist, Lohn genau einmal',()=>{
 const s=cafeReady({inv:{}});s.recipes=['pakchoi_g','suppe','kuerbissuppe','shake'];s.cows=[{n:'Lotte'}];
 for(let i=0;i<20;i++){night(s);const o=C.openOrder(s);if(!o)continue;const N=J.NPCS[o.who];
  assert.ok(N.love.includes(o.k)||N.like.includes(o.k),o.who+' mag '+o.k);assert.ok(C.feasible(s,o.k),o.k+' machbar');assert.equal(o.due,o.day+3);
  const it=J.ITEMS[o.k];if(it.cat==='dish')assert.ok(s.recipes.includes(o.k),'Rezept bekannt');}
 const o=C.openOrder(s)||(night(s),night(s),C.openOrder(s));assert.ok(o,'Bestellung entsteht');assert.equal(mails(s,/Bestellung für dein Café/).filter(m=>m.from===o.who).length>=1,true);
 assert.equal(C.deliver(s),null,'ohne Ware nichts');s.inv[o.k]=1;const m0=s.money;const r=C.deliver(s);assert.ok(r);assert.equal(s.money,m0+o.rew);assert.equal(s.inv[o.k],undefined);
 s.inv[o.k]=1;assert.equal(C.deliver(s),null,'nicht zweimal');assert.equal(reload(s).cafe.orders.find(x=>x.id===o.id).st,'geliefert');
 // Frist verpasst: freundlich, ohne Strafe
 const s2=cafeReady();night(s2);night(s2);const o2=C.openOrder(s2);assert.ok(o2);const money=s2.money;for(let i=0;i<4;i++)night(s2);assert.equal(s2.cafe.orders.find(x=>x.id===o2.id).st,'verpasst');assert.ok(s2.money>=money);
 // Nichts Unmögliches: ohne Kühe keine Milchgerichte
 const s3=cafeReady();s3.recipes=['shake','kuerbissuppe'];s3.cows=[];assert.equal(C.feasible(s3,'shake'),false);assert.equal(C.feasible(s3,'kuerbissuppe'),false);
});

test('W19: Katze mit Beziehung; nachvollziehbare Geschenke vor der Haustür, genau einmal',()=>{
 const s=base({day:2});night(s);until(s,()=>s.tiere.katze.st==='da');assert.equal(mails(s,/Katze für den Mondhof/).length,1);
 const k=s.tiere.katze;assert.match(Ti.petAct(s,'katze','auto').note,/schnurrt/);assert.equal(k.h,1);Ti.petAct(s,'katze','auto');assert.equal(k.h,1,'einmal am Tag');
 s.inv.karpfen=1;const r=Ti.petAct(s,'katze','karpfen');choose(r,0);assert.equal(k.h,2);assert.equal(s.inv.karpfen,undefined);
 night(s);assert.ok(!(s.forage.farm||[]).some(f=>f.katze),'unter 3 Herzen kein Geschenk');
 k.h=3;k.pet=s.day;night(s);let g=(s.forage.farm||[]).filter(f=>f.katze);assert.equal(g.length,1);assert.deepEqual([g[0].x,g[0].y],clone(Ti.CAT.door));
 assert.ok(J.FORAGE[D.cal.se(s)].includes(g[0].k),'Fundstück der Jahreszeit');
 k.pet=s.day;night(s);assert.ok(!(s.forage.farm||[]).some(f=>f.katze),'höchstens jeden zweiten Morgen');
 night(s);assert.ok(!(s.forage.farm||[]).some(f=>f.katze),'ohne Streicheln am Vortag nichts');
 k.pet=s.day;k.h=7;k.gifts=2;night(s);g=(s.forage.farm||[]).filter(f=>f.katze);assert.equal(g[0].k,'karpfen');
 for(const id of ['katze'])for(const min of [400,700,1000,1300]){s.min=min;const p=Ti.pose(s,id,0);assert.ok(J.WALK.has(maps(s).farm.t[Math.round(p.y)][Math.round(p.x)]),'Katze auf begehbarem Boden '+min);}
 s.min=700;assert.equal(Ti.pose(s,'katze',0).anim,'schlaf');assert.ok(Ti.pose(s,'katze',0).sun,'Sonnenbad');
});

test('W20: Pudel wittert Schatz, Pfotenspur, Grabstelle, Belohnung genau einmal je Versteck, alle Verstecke erreichbar',()=>{
 const s=base({dogH:[4,1]});night(s);assert.equal(s.tiere.hund.st,'spur');assert.equal(Ti.dogHint(s,0),true);assert.equal(Ti.dogHint(s,1),false);
 assert.equal(Ti.follow(s,1),null);const r=Ti.follow(s,0);assert.ok(r.refresh);assert.equal(s.tiere.hund.st,'folgen');
 const re=reload(s);assert.equal(re.tiere.hund.st,'folgen');const t=reachTarget(re,'Grabstelle',Ti.target);const m=maps(re)[t.map];
 const spot=Ti.spot(re);assert.ok(m.obj.some(o=>o.k==='grabstelle'&&o.x===spot.x&&o.y===spot.y));assert.ok(m.decor.filter(d=>d.k==='pfote').length>=3,'Pfotenspur sichtbar');
 const m0=re.money,inv0=clone(re.inv);const d=Ti.dig(re);assert.ok(d.banner);assert.equal(re.money,m0+(spot.rew.money||0));
 for(const [k,n] of Object.entries(spot.rew.items||{}))assert.equal(re.inv[k],(inv0[k]||0)+n);
 const after=clone(re);assert.match(Ti.dig(re).note,/schon/);assert.equal(re.money,after.money);const re2=reload(re);Ti.dig(re2);assert.equal(re2.money,after.money);
 assert.equal(re2.dogH[0],5);night(re2);assert.equal(re2.tiere.hund.st,'','frühestens nach drei Tagen');night(re2);night(re2);assert.equal(re2.tiere.hund.st,'spur');assert.notEqual(re2.tiere.hund.spot,spot.id);
 for(const p of Ti.SPOTS){const M=maps(base())[p.map];assert.ok(J.WALK.has(M.t[p.y][p.x])&&M.t[p.y][p.x]!==J.T.WEG,'Versteck auf Wiese '+p.id);assert.ok(reached(M,M.spawn).has(p.x+','+p.y),'Versteck erreichbar '+p.id);}
 const s9=base({dogH:[3,3]});night(s9);assert.equal(s9.tiere.hund.st,'','unter 4 Herzen nichts');
});

function fieldWith(s,list){for(const [x,y,k,a] of list)s.field[x+','+y]={t:true,w:false,c:{k,a}};}
test('W18: Ziege nascht sichtbar höchstens eine reife Pflanze am Feldrand; Heu, Wegschicken und Leckstein helfen',()=>{
 const s=base({day:11});s.tiere.ziege.st='da';s.tiere.ziege.since=10;s.inv.futter=2;
 fieldWith(s,[[11,12,'tomate',6],[11,14,'zwiebel',3],[10,12,'mais',8],[5,15,'zwiebel',3]]);
 night(s);assert.equal(s.day,12);const st=s.tiere.ziege.steal;assert.deepEqual([st.x,st.y,st.k,st.st],[11,12,'tomate','plan']);
 s.min=600;assert.ok(Ti.goatActive(s));const p=Ti.pose(s,'ziege',0);assert.deepEqual([p.x,p.y,p.anim,p.carry],[12,12,'kau','tomate']);
 s.min=659;assert.equal(Ti.tick(s),null);s.min=661;const r=Ti.tick(s);assert.ok(r&&/Tomate/.test(r.note));assert.equal(s.field['11,12'].c.a,J.CROPS.tomate.days-J.CROPS.tomate.re,'Tomate wächst nach');
 assert.equal(Ti.tick(s),null,'nur einmal');assert.equal(s.tiere.ziege.stolen,1);
 for(const k of ['11,14','10,12','5,15'])assert.ok(s.field[k].c,'andere Pflanzen bleiben');
 night(s);assert.equal(s.tiere.ziege.steal.st,'gefressen');night(s);assert.ok(mails(s,/freche Ziege/).length<=1);
 // Heu am Morgen
 assert.equal(s.day,14);assert.equal(s.tiere.ziege.steal.st,'plan');s.min=500;const f=Ti.petAct(s,'ziege','futter');const ch=f.lines[0].choices.find(c=>/Heu/.test(c.t));ch.fn();assert.equal(s.tiere.ziege.steal.st,'satt');s.min=700;assert.equal(Ti.tick(s),null);assert.ok(s.field['11,14'].c);
 // Wegschicken beim Naschen
 night(s);night(s);s.min=600;const z=Ti.petAct(s,'ziege','auto');choose(z,z.lines[0].choices.length-1);assert.equal(s.tiere.ziege.steal.st,'verhindert');s.min=700;assert.equal(Ti.tick(s),null);
 // Leckstein: dauerhaft Ruhe
 assert.equal(Ti.hide(s,'leckstein'),false);assert.match(Ti.buy(s,'leckstein'),/Leckstein/);for(let i=0;i<6;i++){night(s);fieldWith(s,[[11,16,'zwiebel',3]]);s.min=700;assert.equal(Ti.tick(s),null);}
 assert.ok(maps(s).farm.obj.some(o=>o.k==='leckstein'));
 until(s,()=>mails(s,/freche Ziege/).length,5);assert.equal(mails(s,/freche Ziege/).length,1,'Paulas Tipp genau einmal');
 // Regen und keine Randpflanze: kein Diebstahl
 const s2=base({day:11});s2.tiere.ziege.st='da';fieldWith(s2,[[5,15,'zwiebel',3]]);night(s2);assert.equal(s2.tiere.ziege.steal,null);
});

test('W21: Ententeich verändert den Hof, Enten schwimmen im Wasser und brauchen Futter; Wege bleiben frei',()=>{
 const s=base({inv:{stein:12,futter:1}});const before=maps(s).farm,reach0=reached(before,before.spawn);
 const r=Ti.act(s,'teichschild');assert.ok(r.panel);r.panel.buttons[0].fn();assert.equal(s.tiere.teich.st,'bau');assert.equal(s.money,5000-600);assert.equal(s.inv.stein,undefined);
 assert.equal(Ti.buildPond(s),false);night(s);assert.equal(s.tiere.teich.st,'fertig');assert.equal(s.tiere.enten.length,2);assert.equal(mails(s,/Zwei Enten/).length,1);
 const F=maps(s).farm,P=Ti.POND;for(let y=P.y;y<P.y+P.h;y++)for(let x=P.x;x<P.x+P.w;x++)assert.equal(F.t[y][x],J.T.WASSER);
 assert.ok(F.obj.some(o=>o.k==='entenhaus'));assert.ok(F.obj.some(o=>o.k==='futterstelle'));
 const reach=reached(F,F.spawn);for(const k of reach0){const [x,y]=k.split(',').map(Number);const inPond=x>=P.x&&x<P.x+P.w&&y>=P.y&&y<P.y+P.h;const obj=F.obj.some(o=>o.x===x&&o.y===y);if(!inPond&&!obj)assert.ok(reach.has(k),'weiter erreichbar '+k);}
 for(const e of F.exits)assert.ok(reach.has(e.x+','+e.y));
 s.min=700;for(let i=0;i<2;i++){const p=Ti.pose(s,'ente'+i,i*3);assert.equal(p.anim,'schwimm');assert.equal(F.t[Math.round(p.y)][Math.round(p.x)],J.T.WASSER,'Ente im Wasser');}
 assert.match(Ti.duckAct(s,0).note,/hungrig/);const f=Ti.feedDucks(s);assert.match(f.note,/1\/2/);assert.match(Ti.feedDucks(s).note,/Kein Tierfutter/);s.inv.futter=3;Ti.feedDucks(s);assert.equal(s.inv.futter,2);
 assert.match(Ti.duckAct(s,0).note,/quakt/);assert.equal(s.tiere.enten[0].h,1);
 s.inv.futter=20;for(let d=0;d<5;d++){night(s);Ti.feedDucks(s);}assert.ok((s.forage.farm||[]).some(x=>x.k==='entenei'),'gefütterte Ente legt Eier');
 const s2=reload(s);s2.inv.futter=0;night(s2);night(s2);night(s2);assert.ok(s2.tiere.enten.every(e=>e.hungry>=2),'Hunger wird gezählt');assert.ok(!(s2.forage.farm||[]).some(x=>x.k==='entenei'),'hungrig keine Eier');
});

test('W22: Zucht speichert Eltern, Nachwuchs und Farbanlagen; Vererbung je eine Anlage von Mutter und Vater',()=>{
 assert.equal(Ti.pheno(['A','g']),'wild');assert.equal(Ti.pheno(['w','g']),'weiss');assert.equal(Ti.pheno(['g','g']),'gold');assert.equal(Ti.pheno(['w','A']),'wild');
 const s=base({inv:{futter:200}});s.tiere.teich={st:'fertig',done:1};s.tiere.enten=[{n:'Ede',sex:'m',g:['A','g'],c:'wild',h:3,born:0},{n:'Emma',sex:'w',g:['w','g'],c:'weiss',h:3,born:0}];
 const seen=new Set();for(let i=0;i<40&&s.tiere.enten.length<8;i++){Ti.feedDucks(s);night(s);}
 const kids=s.tiere.enten.filter(e=>e.mother);assert.ok(kids.length>=2,'Küken geschlüpft');
 for(const k of kids){const mo=s.tiere.enten.find(e=>e.n===k.mother),fa=s.tiere.enten.find(e=>e.n===k.father);assert.ok(mo&&fa);
  assert.ok(mo.g.includes(k.g[0]),'Anlage der Mutter');assert.ok(fa.g.includes(k.g[1]),'Anlage des Vaters');assert.equal(k.c,Ti.pheno(k.g));seen.add(k.c);}
 for(let i=1;i<kids.length;i++)assert.ok(kids[i].born-kids[i-1].born>=4,'höchstens alle vier Tage');
 assert.ok(mails(s,/Nachwuchs/).length===kids.length,'je Küken ein Brief');
 const re=reload(s);assert.deepEqual(clone(re.tiere.enten),clone(s.tiere.enten));
 const html=Ti.diary(re,x=>String(x));assert.match(html,/Eltern: Emma × Ede/);assert.match(html,/Anlagen/);
 // Bestimmte Rechnung: Tag und Anzahl entscheiden die Anlagen, nicht der Zufall der Sitzung
 const a=base(),b=base();for(const x of [a,b]){x.day=50;x.tiere.teich={st:'fertig',done:1};x.tiere.enten=clone(s.tiere.enten.slice(0,2));}
 Ti.breed(a,2);Ti.breed(b,2);assert.deepEqual(clone(a.tiere.enten),clone(b.tiere.enten));
 assert.equal(Ti.breed(base(),2),null,'ohne Teich keine Küken');
});

test('W23: Tierrettung per Brief, drei Pflegetage, Adoption oder Vermittlung mit Abschluss genau einmal',()=>{
 for(const how of ['adopt','mei']){const s=base({day:3});until(s,()=>s.tiere.katze.st==='da');until(s,()=>s.tiere.rettung.st==='suchen',12);assert.equal(mails(s,/Korb am Fluss/).length,1);
  const t=reachTarget(s,'Korb',Ti.target);assert.equal(t.map,'forest');assert.ok(maps(s).forest.obj.some(o=>o.k==='korb_wald'));
  const f=Ti.act(s,'korb_wald');assert.ok(f.banner);assert.equal(s.tiere.rettung.st,'pflege');assert.ok(maps(s).farm.obj.some(o=>o.k==='pflegekorb'));assert.ok(!maps(s).forest.obj.some(o=>o.k==='korb_wald'));
  reachTarget(s,'Pflegekorb',Ti.target);assert.match(Ti.act(s,'pflegekorb').note,/hungrig/);s.inv.milch=5;
  Ti.act(s,'pflegekorb');assert.deepEqual(clone(s.tiere.rettung.care),[s.day]);assert.match(Ti.act(s,'pflegekorb').note,/1 von 3/);assert.equal(s.inv.milch,4,'nur einmal am Tag');
  let re=reload(s);night(re);Ti.act(re,'pflegekorb');night(re);const last=Ti.act(re,'pflegekorb');assert.match(last.lines[1].text,/3 von 3/);
  assert.equal(Ti.careAct(re).note!==undefined,true,'am selben Tag noch keine Entscheidung');night(re);
  const d=Ti.act(re,'pflegekorb');const r=choose(d,how==='adopt'?0:1);assert.ok(r.banner);
  assert.equal(re.tiere.rettung.st,how==='adopt'?'adoptiert':'vermittelt');assert.equal(Ti.rescueEnd(re,how),null,'Abschluss nur einmal');
  if(how==='adopt')assert.ok(Ti.pets(re,'farm').some(p=>p.id==='pip'));else{assert.ok(Ti.pets(re,'village').some(p=>p.id==='pip'));night(re);const m=mails(re,/Pip sagt Danke/);assert.equal(m.length,1);
   const i=re.mail.indexOf(m[0]);assert.ok(X.claim(re,i));assert.equal(X.claim(re,i),null,'Beilage einmal');night(re);assert.equal(mails(re,/Pip sagt Danke/).length,1);}
  assert.ok(!maps(re).farm.obj.some(o=>o.k==='pflegekorb'));}
});

test('Laden: Ziege und Leckstein bei Paula, genau einmal; Leckstein erst mit Ziege',()=>{
 const s=base();assert.equal(Ti.hide(s,'leckstein'),true);assert.match(Ti.buy(s,'tier_ziege'),/Flocke/);assert.equal(Ti.buy(s,'tier_ziege'),null);
 assert.ok(Ti.pets(s,'farm').some(p=>p.id==='ziege'));assert.match(Ti.buy(s,'leckstein'),/Leckstein/);assert.equal(Ti.buy(s,'leckstein'),null);
 for(const k of ['tier_ziege','leckstein'])assert.ok(J.SHOPS.tierhof.stock.find(r=>r.k===k).once);
});

test('Nebenaufgabe: Eine anstehende René-Geschichte hat Vorrang vor dem automatischen Kuscheln',()=>{
 const s=base();assert.equal(R.storyPending(s),false,'ohne Geschichte darf René kuscheln');
 s.rom.mv={st:'hinweis',day:s.day};assert.equal(R.storyPending(s),true);
 s.rom.mv={st:'ausweichen',day:s.day};assert.equal(R.storyPending(s),false,'gleicher Tag: nur „gleich, gleich“');s.day++;assert.equal(R.storyPending(s),true,'am Folgetag wartet die Klärung');
 s.rom.mv={st:'fertig',day:1};assert.equal(R.storyPending(s),false);
 assert.ok(R.options(s,'picknick').length);R.propose(s,R.options(s,'picknick')[0].k);s.min=s.rom.date.from+5;s.day=s.rom.date.day;assert.equal(R.storyPending(s),true,'Verabredung');
});

test('Alle neuen Ziele über den Wegweiser auflösbar und auf ihrer Karte erreichbar',()=>{
 const s=cafeReady({inv:{suppe:2}});s.min=500;C.stock(s,'suppe',2);C.open(s,'frueh');s.min=600;const t=reachTarget(s,'Gäste',C.target);assert.equal(t.map,C.ROOM);
 const s2=base();s2.tiere.teich={st:'fertig',done:1};s2.tiere.enten=[{n:'E',sex:'w',g:['w','w'],c:'weiss',h:0}];s2.inv.futter=1;reachTarget(s2,'Futterstelle',Ti.target);
 const s3=base({dogH:[4,0]});night(s3);reachTarget(s3,'Pudel mit Spur',Ti.target);
});
