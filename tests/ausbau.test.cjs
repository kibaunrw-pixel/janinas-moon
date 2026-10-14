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
