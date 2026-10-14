const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function load(){const c={window:{},console}; vm.createContext(c); for(const f of ['jm-data.js','jm-ausbau.js']){if(fs.existsSync(path.join(__dirname,'..',f)))vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);} return c.window.JM;}
const JM=load();
test('Kochen verbraucht beide Lager atomar, auch konkrete plus Sammelfische',()=>{
 const s={inv:{zwiebel:1,forelle:1},fridge:{forelle:1,karpfen:1},recipes:['fisch_g']};
 assert.equal(typeof JM.Ausbau.cook,'function');
 assert.equal(JM.Ausbau.cook(s,{k:'fisch_g',need:{forelle:1,fisch:2,zwiebel:1}}),true);
 assert.equal(s.inv.fisch_g,1); assert.equal(Object.keys(s.fridge).length,0);assert.equal(s.inv.forelle,undefined);
 const before=JSON.stringify(s);assert.equal(JM.Ausbau.cook(s,{k:'fisch_g',need:{fisch:1}}),false);assert.equal(JSON.stringify(s),before);
 assert.equal(JM.Ausbau.cook(s,{k:'nudeln',need:{}}),false);
});
test('Alle konkreten Rezeptzutaten sind ganzjährig ohne Wiederverkaufsgewinn kaufbar',()=>{
 for(const r of JM.RECIPES)for(const k of Object.keys(r.need)){
 if(k==='fisch')continue;const stock=JM.SHOPS.markt.stock.find(s=>s.k===k);
 assert.ok(stock,k+' fehlt');assert.equal(!!stock.winter,false,k+' ist saisonal');assert.ok(stock.p>JM.ITEMS[k].sell*1.7,k+' Markt-Arbitrage');
 }
});
test('Zehn Höhlenebenen: sichere Wege, persistente Abbaubilanz, Reload, neuer Besuch',()=>{
 const maps=JM.buildMaps(),ids=Object.keys(maps).filter(k=>maps[k].cave);assert.equal(ids.length,10);
 const shapes=new Set();for(const id of ids){const m=maps[id];shapes.add(JSON.stringify(m.t));const seen=new Set([m.spawn.join(',')]),q=[m.spawn];while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&JM.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}for(const o of m.obj)assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has((o.x+dx)+','+(o.y+dy))),id+' Leiter unerreichbar');}
 assert.equal(shapes.size,10);
 const s={mine:{active:false,floors:{}}};JM.Ausbau.enterMine(s,'hoehle',maps,()=>.2);const count=s.rocks.length;assert.ok(count>0);s.rocks.pop();
 JM.Ausbau.enterMine(s,'hoehle2',maps,()=>.7);JM.Ausbau.enterMine(s,'hoehle',maps,()=>.7);assert.equal(s.rocks.length,count-1);
 const reload=JSON.parse(JSON.stringify(s));JM.Ausbau.enterMine(reload,'hoehle',maps,()=>.9);assert.equal(reload.rocks.length,count-1);
 JM.Ausbau.enterMine(s,'forest',maps,()=>.7);JM.Ausbau.enterMine(s,'hoehle',maps,()=>.7);assert.equal(s.rocks.length,count);
 assert.ok(maps.hoehle10.t.some(row=>row.includes(JM.T.WASSER)));assert.equal(JM.waterKind('hoehle10',14,7),'magie');
});
test('Neue Erze sind nutzbar; jeder magische Fisch ist wirklich auswählbar und verkäuflich',()=>{
 for(const k of ['eisen','silber']){assert.ok(JM.ITEMS[k],k);assert.ok(JM.CRAFT.some(r=>r.need[k])||JM.HOUSE_UPGRADES?.some(r=>r.need[k]));}
 const fish=new Set();for(let i=0;i<20;i++)fish.add(JM.Ausbau.pickFish('magie',720,false,()=>i/20));
 assert.ok(fish.has('sternenschuppe'));assert.ok(fish.has('kristallforelle'));for(const k of fish){assert.ok(JM.FISHKEYS.includes(k));assert.ok(JM.SHIPPABLE(k));assert.ok(JM.FISH[k].dif<1);}
});
test('Alte Saves migrieren ohne Progressionsverlust; leere alte Höhle bleibt leer',()=>{
 const s={map:'hoehle',day:17,money:933,inv:{ei:4},rocks:[],flags:{glas:true},qDone:['brief']};
 assert.equal(typeof JM.Ausbau.migrate,'function');JM.Ausbau.migrate(s);
 assert.equal(s.money,933);assert.equal(s.flags.glas,true);assert.equal(s.qDone[0],'brief');assert.equal(s.inv.ei,4);assert.equal(Object.keys(s.fridge).length,0);
 const maps=JM.buildMaps();JM.Ausbau.enterMine(s,'hoehle',maps,()=>.9);assert.equal(s.rocks.length,0);
 const r=JSON.parse(JSON.stringify(s));r.fridge={ei:-4,milch:2.5,zwiebel:3};JM.Ausbau.migrate(r);assert.equal(r.fridge.ei,undefined);assert.equal(r.fridge.zwiebel,3);assert.equal(r.house.level,0);
});
test('Lebensmitteltransfer erhält Bilanz und lehnt ungültige Mengen ab',()=>{
 assert.ok(JM.Ausbau,'Ausbau-Produktionslogik fehlt');
 const s={inv:{ei:7,kupfer:4},fridge:{ei:2}};
 assert.equal(JM.Ausbau.transfer(s,'ei',3,true),true);
 assert.equal(s.inv.ei,4);assert.equal(s.fridge.ei,5);
 for(const n of [-1,0,1.5,Infinity,NaN,99]) assert.equal(JM.Ausbau.transfer(s,'ei',n,true),false);
 assert.equal(JM.Ausbau.transfer(s,'kupfer',1,true),false);
 assert.equal(JM.Ausbau.transfer(s,'ei',5,false),true);
 assert.equal(s.inv.ei,9);assert.equal(s.fridge.ei,undefined);
});
