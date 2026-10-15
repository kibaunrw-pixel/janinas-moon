const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);for(const f of ['jm-data.js','jm-ausbau.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);const JM=c.window.JM;
function reached(m){const q=[m.spawn],seen=new Set(q.map(p=>p.join(',')));for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&JM.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}return seen;}
test('Bezahlte Hausstufen erhalten kostenlos obere Etage, sichere Treppe und eigene Einrichtung',()=>{
 for(const level of [1,2]){const s={day:20,money:781,inv:{holz:3,ei:4},fridge:{ei:6},house:{level,job:null},maxE:100+level*10};const before=JSON.stringify(s);JM.Ausbau.migrate(s);const maps=JM.buildMaps();JM.Ausbau.applyHouse(maps,s.house.level);
 assert.ok(maps.haus_oben,'obere Etage fehlt');assert.equal(JSON.stringify(s.inv),'{"holz":3,"ei":4}');assert.equal(s.money,781);assert.equal(s.maxE,100+level*10);assert.equal(JM.Ausbau.orderHouse(s,level),false);
 assert.ok(maps.haus.obj.some(o=>o.act==='house_up'),'Treppe vom Erdgeschoss');assert.ok(maps.haus_oben.obj.some(o=>o.act==='house_down'),'Rücktreppe');
 for(const id of ['haus','haus_oben']){const m=maps[id],seen=reached(m);for(const e of m.exits)assert.ok(seen.has(e.x+','+e.y),id+' Ausgang erreichbar');for(const o of m.obj)assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has((o.x+dx)+','+(o.y+dy))),id+' '+o.k+' zugänglich');}
 const shape=JSON.stringify(maps);JM.Ausbau.applyHouse(maps,level);assert.equal(JSON.stringify(maps),shape,'Anwendung wiederholbar ohne Möbelduplikate');assert.equal(maps.haus_oben.w,level===1?14:20);
 }
});
