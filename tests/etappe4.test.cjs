/* Etappe 4 – W07 Vollmondwald, W09 magische Pflanzen, W10 Regenhändler. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);
for(const f of ['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js','jm-ereignisse.js','jm-dorf.js','jm-romantik.js','jm-tiere.js','jm-cafe.js','jm-magie.js']){
 const p=path.join(__dirname,'..',f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),c);
}
const J=c.window.JM,X=J.Post,St=J.Stadt,G=J.Magie,clone=o=>JSON.parse(JSON.stringify(o));
function base(extra={}){const s={day:12,min:600,money:5000,inv:{},stats:{earned:0},mail:[],mailQ:[],npc:{},name:'Janina',energy:70,maxE:100,rene:{met:true},dogs:[],dogH:[],field:{},forage:{},hens:[],cows:[],recipes:[],flags:{},weather:'sun',tomorrow:'sun',ship:{},shipLog:{},fishLog:{},cookLog:{},...extra};for(const id in J.NPCS)s.npc[id]={p:0,met:true};J.Ausbau.migrate(s);s.post.m.tuer.st='fertig';return s;}
const reload=s=>{const r=clone(s);J.Ausbau.migrate(r);return r;};
function maps(s){const m=J.buildMaps();St.apply(m,s);return m;}
function reached(m,spawn=m.spawn){const q=[spawn],seen=new Set([spawn.join(',')]);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&J.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}return seen;}

test('Ausgangssystem Etappe 4 ist vorhanden und Migration bewahrt Besitz',()=>{
 assert.ok(G,'jm-magie.js geladen');const old={day:28,money:4321,inv:{mondsamen:3,ei:2},field:{'5,12':{t:true,w:true,c:{k:'mondblume',a:2,nacht:27}}},post:{m:{tuer:{st:'fertig'}}}};J.Ausbau.migrate(old);
 assert.equal(old.money,4321);assert.deepEqual(clone(old.inv),{mondsamen:3,ei:2});assert.equal(old.field['5,12'].c.k,'mondblume');assert.ok(old.magie);
 assert.deepEqual(clone(reload(old).magie),clone(old.magie));
});

test('W07: 14-Tage-Mondkalender, Vortaghinweis, Zugang nur bei Vollmond und sichere Rückwege',()=>{
 assert.deepEqual([G.moon(13).phase,G.moon(13).tomorrow,G.moon(14).full],['fast voll',true,true]);assert.equal(G.moon(28).full,true);assert.equal(G.moon(1).full,false);
 const s=base({day:13});assert.match(G.diary(s,x=>x),/morgen|Vollmond/i);assert.ok(G.calMarks(s,0,13).some(x=>/Vollmond/.test(x)));
 let m=maps(s);const room=m.waldtuer,gate=room.obj.find(o=>o.act==='magie:tor');assert.ok(gate);assert.equal(gate.k,'mondtor_zu');assert.match(G.act(s,'tor').note,/Vollmond/);
 s.day=14;m=maps(s);assert.equal(m.waldtuer.obj.find(o=>o.act==='magie:tor').k,'mondtor_offen');assert.equal(G.act(s,'tor').travel.to,G.ROOM);
 const w=m[G.ROOM];assert.ok(w&&!w.inside);assert.equal(w.exits[0].to,'waldtuer');assert.ok(reached(w).has(w.exits[0].x+','+w.exits[0].y));assert.ok(reached(room).has(room.exits[0].x+','+room.exits[0].y));
 const t=G.target(s);assert.equal(t.map,G.ROOM);assert.ok(reached(w).has(t.x+','+t.y));
 assert.deepEqual(clone(G.safeMorning({...s,map:G.ROOM,px:8,py:8})),{map:'haus',px:10,py:5});
});

test('W09: Samenquelle, nur nächtliches Handgießen, Regen/Sprinkler zählen nicht, Erntewert',()=>{
 const s=base({day:14,min:1200});let m=maps(s),w=m[G.ROOM];const seed=w.obj.find(o=>o.act==='magie:samen');assert.ok(seed&&reached(w).has(seed.x+','+(seed.y+1)));
 assert.ok(G.act(s,'samen').lines);assert.equal(s.inv.mondsamen,3);assert.match(G.act(s,'samen').note,/leer|gesammelt/);assert.equal(s.inv.mondsamen,3,'nur einmal');
 const f={t:true,w:false,c:{k:'mondblume',a:0}};assert.equal(G.markWater(s,f,true),true);assert.equal(f.c.nacht,14);assert.equal(G.growsTonight(s,f),true);
 const day={...s,min:700},rain={t:true,w:true,c:{k:'mondblume',a:0}},spr={t:true,w:true,c:{k:'mondblume',a:0}};assert.equal(G.markWater(day,rain,true),false);assert.equal(G.growsTonight(day,rain),false);assert.equal(G.markWater(s,spr,false),false);assert.equal(G.growsTonight(s,spr),false);
 G.afterGrowth(s,f);assert.equal(f.c.nacht,undefined);assert.match(G.cropHint(day,rain),/nachts.*von Hand/i);
 assert.ok(J.ITEMS.mondblume.sell>=500);assert.ok(J.SHIPPABLE('mondblume'));assert.equal(J.CROPS.mondblume.se.length,4);
});

test('W10: Händler nur bei Regen mit Wegplan, Angebot und Wetterhinweis',()=>{
 const s=base({weather:'rain',tomorrow:'rain',min:480});let loc=G.merchantLocation(s);assert.deepEqual(clone(loc),{map:'forest',x:12,y:10});s.min=750;assert.deepEqual(clone(G.merchantLocation(s)),{map:'village',x:18,y:12});s.min=1080;assert.deepEqual(clone(G.merchantLocation(s)),{map:'forest',x:20,y:19});
 s.weather='sun';assert.equal(G.merchantLocation(s),null);assert.match(G.weatherText('rain'),/Regenhändler|Nerio/);assert.doesNotMatch(G.weatherText('sun'),/Nerio/);
 const wet=base({weather:'rain',min:750});m=maps(wet);assert.ok(m.village.obj.some(o=>o.act==='magie:haendler'));const dry=base({weather:'sun',min:750});assert.ok(!maps(dry).village.obj.some(o=>o.act==='magie:haendler'));
 const p=G.shop(wet).panel;assert.ok(p.buttons.some(b=>b.k==='mondsamen'));assert.ok(p.buttons.some(b=>b.k==='mondtau'));const m0=wet.money;assert.equal(G.buy(wet,'mondsamen'),true);assert.equal(wet.money,m0-G.STOCK.find(x=>x.k==='mondsamen').p);assert.equal(wet.inv.mondsamen,G.STOCK.find(x=>x.k==='mondsamen').n);assert.equal(reload(wet).inv.mondsamen,wet.inv.mondsamen);
});

test('W10: kein Sofortgewinn über Versand, Café oder Bestellungen',()=>{
 for(const r of G.STOCK){const it=J.ITEMS[r.k];assert.ok(it,'Artikel '+r.k);assert.ok((it.sell||0)*r.n<r.p,'Versandverlust '+r.k);if(J.Cafe.ok(r.k)){assert.ok(J.Cafe.maxPrice(r.k)*r.n<r.p,'Caféverlust '+r.k);assert.ok(Math.ceil(it.sell*1.5)*r.n<r.p,'Bestellverlust '+r.k);}}
});

test('Alle neuen Ziele und Ausgänge liegen auf vorhandenen Karten und begehbaren Kacheln',()=>{
 for(const day of [13,14,15])for(const weather of ['sun','rain'])for(const min of [480,750,1080]){const s=base({day,weather,min}),all=maps(s);for(const id of ['waldtuer',G.ROOM]){assert.ok(all[id]);const r=reached(all[id]);for(const e of all[id].exits)assert.ok(r.has(e.x+','+e.y),id+' Ausgang');}const t=G.target(s);if(t){assert.ok(all[t.map]);assert.ok(reached(all[t.map]).has(t.x+','+t.y));}}
});
