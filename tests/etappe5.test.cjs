/* Etappe 5 – Ziele, Geld, Spannung: Material, Stadtstufen, Hofausbau, Langzeitziele, Großaufträge, Wettbewerb. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);
for(const f of ['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js','jm-ereignisse.js','jm-dorf.js','jm-romantik.js','jm-tiere.js','jm-cafe.js','jm-magie.js','jm-ziele.js']){
 const p=path.join(__dirname,'..',f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),c);
}
const J=c.window.JM,Z=J.Ziele,St=J.Stadt,clone=o=>JSON.parse(JSON.stringify(o));
function base(extra={}){const s={day:40,min:600,money:5000,inv:{},fridge:{},stats:{earned:0,shipped:0},mail:[],mailQ:[],npc:{},name:'Janina',energy:100,maxE:120,can:{w:20,max:40},rene:{met:true},dogs:[],dogH:[],field:{},forage:{},hens:[],cows:[],recipes:[],flags:{},weather:'sun',tomorrow:'sun',ship:{},shipLog:{},fishLog:{},cookLog:{},house:{level:2,job:null},qDone:[],...extra};for(const id in J.NPCS)s.npc[id]={p:0,met:true};J.Ausbau.migrate(s);return s;}
/* Janinas echter Stand laut Auftrag: 38.500 G, Haus ausgebaut, drei Stadtmieter, alte Missionen erledigt. */
function janina(){const s=base({day:73,money:38500,inv:{holz:45,stein:60,eisen:4,ei:6,weizen:12},hens:[{n:'Erna',h:8},{n:'Berta',h:6},{n:'Lotti',h:5}],cows:[{n:'Mimi',h:6}],rod:2});
 s.city.plots=s.city.plots.map((p,i)=>({start:10+i,due:13+i,ready:true,tenant:['ida','noah','mara'][i],since:14+i,lastRent:72,rating:5}));
 for(const id of Object.keys(s.post.m))s.post.m[id].st='fertig';s.qDone=J.QUESTS.map(q=>q.id);return s;}
const reload=s=>{const r=clone(s);J.Ausbau.migrate(r);return r;};
function maps(s){const m=J.buildMaps();St.apply(m,s);return m;}
function reached(m,spawn=m.spawn){const q=[spawn],seen=new Set([spawn.join(',')]);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&J.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}return seen;}
const nextTo=(seen,o)=>{for(let y=o.y-1;y<=o.y+(o.h||1);y++)for(let x=o.x-1;x<=o.x+(o.w||1);x++)if(seen.has(x+','+y))return true;return false;};
function night(s){s.day++;St.advance(s);return Z.advance(s);}

test('Migration: Janinas fortgeschrittener Stand bleibt erhalten und sieht die neuen Ziele sofort',()=>{
 assert.ok(Z,'jm-ziele.js geladen');const s=janina(),before=clone({money:s.money,inv:s.inv,plots:s.city.plots,house:s.house,hens:s.hens,post:s.post});
 Z.migrate(s);assert.equal(s.money,38500);assert.deepEqual(clone(s.inv),before.inv);assert.deepEqual(clone(s.city.plots),before.plots);assert.deepEqual(clone(s.house),before.house);assert.deepEqual(clone(s.post),before.post);
 assert.equal(Z.stufe(s),1);const brief=s.mail.find(m=>m.ziele==='start');assert.ok(brief,'Brief liegt sofort im Briefkasten');assert.equal(brief.read,false);assert.match(brief.b,/Bäckerei/);assert.match(brief.b,/Timo/);
 assert.ok(s.ziele.auftrag&&s.ziele.auftrag.st==='offen','Großauftrag läuft sofort');
 const g=Z.goal(s);assert.ok(g&&/Lindenstadt|Bäckerei|Auftrag/.test(g.t+g.sub),'Hinweisbox zeigt ein neues Ziel');
 const r=reload(s);assert.equal(r.mail.filter(m=>m.ziele==='start').length,1,'kein zweiter Brief nach Reload');assert.deepEqual(clone(r.ziele),clone(s.ziele));
 const fresh=base({day:1,money:500});assert.equal(fresh.mail.filter(m=>m.ziele==='start').length,0,'neuer Hof bekommt den Brief erst später');
});

test('Preisleiter: sofort bis 40.000 G, mittel 50.000–150.000 G, lang ab 300.000 G',()=>{
 const st=Z.STUFEN;assert.equal(st.length,5);assert.equal(st[1].money,12000);
 const sofort=[st[1].money,Z.HOF.silber.money,Z.HOF.felder.money];for(const p of sofort)assert.ok(p<=40000);assert.ok(sofort.reduce((a,b)=>a+b,0)<=40000,'alle Sofortziele zusammen mit 38.500 G fast erreichbar');
 for(const p of [st[2].money,st[3].money,Z.HOF.gold.money])assert.ok(p>=50000&&p<=150000,'Mittel '+p);
 assert.ok(st[4].money>=300000,'Hotel ist ein Langzeitziel');
 for(let i=2;i<5;i++)assert.ok(st[i].money>st[i-1].money);
});

test('Material bei Timo: teurer als Sammeln, Tageslimit, kein Arbitrage-Gewinn',()=>{
 const s=base({money:10000});for(const k of ['holz','stein','eisen'])assert.ok(J.SHOPS.zimmerei.stock.some(r=>r.k===k&&r.p===Z.MATERIAL[k].p),k+' bei Timo');
 assert.equal(Z.buyMaterial(s,'stein',10),true);assert.equal(s.money,10000-10*Z.MATERIAL.stein.p);assert.equal(s.inv.stein,10);
 assert.equal(Z.restHeute(s,'stein'),Z.MATERIAL.stein.limit-10);assert.equal(Z.buyMaterial(s,'stein',Z.restHeute(s,'stein')+1),false,'Tageslimit');
 assert.equal(Z.buyMaterial(s,'stein',0),false);assert.equal(Z.buyMaterial(s,'stein',-1),false);assert.equal(Z.buyMaterial(s,'gold',1),false);
 const poor=base({money:20});assert.equal(Z.buyMaterial(poor,'holz',1),false);assert.equal(poor.money,20);
 let r=reload(s);assert.equal(Z.restHeute(r,'stein'),Z.MATERIAL.stein.limit-10,'Limit überlebt Reload');r.day++;assert.equal(Z.restHeute(r,'stein'),Z.MATERIAL.stein.limit,'neuer Tag, neues Limit');
 // Jede Einkaufsquelle gegen jeden Verkaufsweg: Versand, Samstagsstand (max. ×1,7), Ankauf der Läden, Großaufträge.
 const buy={};for(const sh of Object.values(J.SHOPS))for(const q of sh.stock)buy[q.k]=Math.min(buy[q.k]??Infinity,q.p);for(const q of J.Magie.STOCK)buy[q.k]=Math.min(buy[q.k]??Infinity,q.p/q.n);for(const q of Z.VERKAUF)buy[q.k]=Math.min(buy[q.k]??Infinity,q.p);
 for(const [k,p] of Object.entries(buy)){const it=J.ITEMS[k];if(!it)continue;const best=Math.max(J.SHIPPABLE(k)?Math.round(it.sell*1.7):0,Z.ankaufPreis(k),Z.auftragStueck(k));assert.ok(p>best,`kein Gewinn mit ${k}: Kauf ${p} G, bester Erlös ${best} G`);}
});

test('Stadtstufe 2: Bäckerei mit Bauphasen, Reload, Pacht genau einmal pro Tag und Ankauf',()=>{
 const s=janina();Z.migrate(s);s.inv.holz=100;s.inv.stein=100;
 const poor=clone(s);poor.money=500;J.Ausbau.migrate(poor);assert.equal(Z.orderStufe(poor),false);assert.equal(poor.money,500);
 assert.equal(Z.orderStufe(s),true);assert.equal(Z.orderStufe(s),false,'kein zweiter Auftrag');assert.equal(s.money,38500-12000);assert.equal(s.inv.holz,40);assert.equal(s.inv.stein,60);
 assert.equal(Z.bauPhase(s),1);let m=maps(s);assert.ok(m.stadt.obj.some(o=>o.k==='bau1'&&o.act==='ziele:geb:baeckerei'));
 night(s);assert.equal(Z.bauPhase(s),2);let r=reload(s);night(r);assert.equal(Z.bauPhase(r),3);m=maps(r);assert.ok(m.stadt.obj.some(o=>o.k==='bau3'));
 const res=night(r);assert.equal(Z.stufe(r),2);assert.match(res.notes.join(' '),/Bäckerei/);m=maps(r);const b=m.stadt.obj.find(o=>o.k==='baeckerei');assert.ok(b);
 const seen=reached(m.stadt);assert.ok(nextTo(seen,b),'Bäckerei erreichbar');assert.ok(m.stadt.obj.filter(o=>o.act==='train').some(o=>nextTo(seen,o)),'Bahnhof weiter erreichbar');
 for(const e of m.stadt.exits||[])assert.ok(seen.has(e.x+','+e.y));
 assert.ok(r.mail.some(m=>m.ziele==='geb:baeckerei'),'Frieda schreibt beim Einzug');
 const m0=r.money;let x=night(r);assert.equal(x.earned>=Z.GEB.baeckerei.pacht,true);assert.equal(r.money-m0>=Z.GEB.baeckerei.pacht,true);const m1=r.money;assert.equal(Z.advance(r).earned,0,'gleicher Tag zahlt nicht doppelt');assert.equal(r.money,m1);r=reload(r);assert.equal(Z.advance(r).earned,0);
 r.inv.weizen=50;const v=Z.verkaufen(r,'baeckerei',50);assert.equal(v,Z.GEB.baeckerei.ankauf.limit,'Ankauf nur bis Tageslimit');assert.equal(r.inv.weizen,10);assert.equal(Z.verkaufen(r,'baeckerei',5),0);
 assert.ok(J.NPCS.frieda&&St.location(r,'frieda',false),'Frieda steht tagsüber vor ihrer Bäckerei');
});

test('Stadtstufen 3–5: Blumenladen, Park, Villa für Herrn Falk, Hotel; Stadt wird sichtbar größer',()=>{
 const s=janina();Z.migrate(s);const w0=maps(s).stadt;let objs0=w0.obj.length;
 for(let n=2;n<=5;n++){const st=Z.STUFEN[n-1];s.money+=st.money;for(const [k,q] of Object.entries(st.need))s.inv[k]=(s.inv[k]||0)+q;assert.equal(Z.orderStufe(s),true,'Stufe '+n);for(let d=0;d<st.days;d++)night(s);assert.equal(Z.stufe(s),n);}
 const m=maps(s),seen=reached(m.stadt);for(const id of ['baeckerei','blumenladen','villa','hotel']){const o=m.stadt.obj.find(o=>o.k===id);assert.ok(o,id);assert.ok(nextTo(seen,o),id+' erreichbar');}
 assert.ok(m.stadt.obj.some(o=>o.k==='parkpavillon'));assert.ok(m.stadt.obj.length>objs0+8,'deutlich mehr Stadtleben');assert.ok(m.stadt.w>=w0.w);
 for(const id of ['lotte','konrad','falk'])assert.ok(St.location(s,id,false),id+' hat einen Platz in der Stadt');
 const a=s.money;night(s);const passiv=Z.GEB.baeckerei.pacht+Z.GEB.blumenladen.pacht+Z.GEB.villa.miete+Z.GEB.hotel.pacht;assert.ok(s.money-a>=passiv,'Pacht aller Betriebe');
 s.inv.blume=40;assert.equal(Z.verkaufen(s,'blumenladen',40),Z.GEB.blumenladen.ankauf.limit);assert.ok(Z.kaufen(s,'blumenladen','blume_s',5));assert.equal(Z.orderStufe(s),false,'Stufe 5 ist das Ende');
});

test('Einnahmen wachsen mit: Beispielrechnung für typische Spieltage',()=>{
 const b=Z.bilanz();assert.equal(b.length,5);for(let i=1;i<5;i++)assert.ok(b[i].proTag>b[i-1].proTag,'Einnahmen steigen mit der Stadtstufe');
 // Tage bis zum nächsten Ziel aus Geld und typischem Spiel (siehe Bericht): mittel ≤ drei Jahreszeiten, lang ≤ zwei Jahre.
 for(let i=1;i<5;i++){const t=b[i].tageBisZiel;assert.ok(Number.isFinite(t)&&t>0);if(i<4)assert.ok(t<=3*J.DPS,'Stufe '+(i+1)+' in '+t+' Tagen');else assert.ok(t>=J.DPS&&t<=8*J.DPS,'Hotel ist lang, aber erreichbar: '+t);}
});

test('Hof ausbauen: Silber- und Goldwerkzeug, neues Feldstück',()=>{
 const s=janina();Z.migrate(s);s.inv.eisen=10;assert.equal(Z.orderHof(s,'gold'),false,'Gold erst nach Silber');assert.equal(Z.orderHof(s,'silber'),true);assert.equal(Z.orderHof(s,'felder'),false,'eine Hofarbeit gleichzeitig');
 assert.equal(Z.toolCost(s,'water',1),1,'Wirkung erst nach der Nacht');night(s);assert.equal(s.ziele.hof.silber,true);assert.equal(Z.toolCost(s,'water',1),0);assert.equal(Z.toolCost(s,'till',2),1);assert.equal(s.can.max,60);
 s.inv.holz=40;s.inv.stein=30;const f0=maps(s).farm;const feld=m=>m.t.flat().filter(t=>t===J.T.FELD).length,n0=feld(f0);assert.equal(Z.orderHof(s,'felder'),true);night(s);night(s);let f=maps(s).farm;assert.equal(feld(f)-n0,27);assert.equal(feld(maps(reload(s)).farm)-n0,27,'nach Reload gleich');
 const seen=reached(f);let all=true;for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(f.t[y][x]===J.T.FELD&&!seen.has(x+','+y))all=false;assert.ok(all,'jedes Beet erreichbar');
 assert.deepEqual(clone(Z.extraTiles(s,6,12)),[],'ohne Gold nur ein Beet');s.money+=80000;s.inv.silber=10;s.inv.mondquarz=3;assert.equal(Z.orderHof(s,'gold'),true);night(s);night(s);assert.deepEqual(clone(Z.extraTiles(s,6,12)),[[5,12],[7,12]]);
});

test('Großauftrag mit Frist: Teillieferung, Abschluss zahlt einmal, Scheitern ohne harte Strafe',()=>{
 const s=janina();Z.migrate(s);const a=s.ziele.auftrag;assert.ok(a.n>=10&&a.due-a.start===5);assert.ok(a.rew>=a.n*Z.einzelwert(a.k));
 s.inv[a.k==='fisch'?'forelle':a.k]=a.n;const m0=s.money;const r1=Z.deliver(s,3);assert.equal(r1.taken,3);assert.equal(s.ziele.auftrag.got,3);assert.equal(s.money,m0);
 let r=reload(s);const r2=Z.deliver(r);assert.equal(r2.done,true);assert.equal(r.money,m0+a.rew);assert.equal(Z.deliver(r).taken,0,'kein zweiter Lohn');assert.equal(r.ziele.auftraege.ok,1);
 for(let d=0;d<3;d++)night(r);assert.ok(r.ziele.auftrag.st==='offen'&&r.ziele.auftrag.id!==a.id,'neuer Auftrag folgt');
 const b=r.ziele.auftrag,k=b.k==='fisch'?'forelle':b.k;r.inv[k]=2;Z.deliver(r,2);const before=r.money;while(r.day<=b.due)night(r);const out=night(r);
 assert.equal(r.ziele.auftraege.fail,1);assert.ok(r.money-before>=2*Z.einzelwert(b.k),'Gelieferte Ware wird bezahlt');assert.ok(r.money>=before,'kein Geldverlust');assert.ok(r.mail.some(m=>m.ziele==='auftrag-verpasst'));
});

test('Erntewettbewerb mit Greta: nur am Wettbewerbstag, drei Stücke, Preis und Trophäe genau einmal',()=>{
 const s=janina();Z.migrate(s);s.day=J.DPS+Z.WETT.tag;s.min=600;s.inv={kuerbis:2,koi:1,ei:3,holz:4};assert.ok(Z.wettHeute(s));
 assert.equal(Z.einreichen(s,'holz'),false,'Holz ist keine Ernte');assert.ok(Z.einreichen(s,'koi'));assert.ok(Z.einreichen(s,'kuerbis'));assert.ok(Z.einreichen(s,'kuerbis'));assert.equal(Z.einreichen(s,'ei'),false,'höchstens drei');
 let r=reload(s);const m0=r.money,res=Z.bewerten(r);assert.equal(res.punkte,600+260+260);assert.equal(res.greta,Z.gretaScore(r));assert.equal(res.sieg,res.punkte>res.greta);assert.equal(r.money,m0+(res.sieg?Z.WETT.preis:Z.WETT.trost));
 assert.equal(Z.bewerten(r),null,'keine zweite Bewertung');if(res.sieg)assert.ok(Z.trophaeen(r).some(t=>/Wettbewerb|Ernte/.test(t.t)));
 const off=janina();Z.migrate(off);off.day=J.DPS+Z.WETT.tag+1;off.inv={koi:1};assert.equal(Z.einreichen(off,'koi'),false);
 assert.ok(!J.FESTS.some(f=>f.d===Z.WETT.tag),'kein Festtag');
});

test('Langzeitziele: Hof- und Stadtsterne, nächstes Ziel mit Fortschritt, Trophäen',()=>{
 const s=janina();Z.migrate(s);const st=Z.sterne(s);assert.equal(st.stadt.n,1);assert.equal(st.stadt.max,5);assert.ok(st.hof.n>=1&&st.hof.max===5);
 const n=Z.naechste(s);assert.ok(n.length>=3);const b=n.find(x=>/Bäckerei|Marktflecken/.test(x.t));assert.ok(b);assert.ok(b.teile.some(t=>t.k==='money'&&t.hat===38500&&t.soll===12000));
 s.inv.holz=100;s.inv.stein=100;Z.orderStufe(s);for(let d=0;d<3;d++)night(s);assert.equal(Z.sterne(s).stadt.n,2);assert.ok(Z.trophaeen(s).some(t=>/Marktflecken|Bäckerei/.test(t.t)));
});
