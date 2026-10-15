"use strict";
/* Kleine gemeinsam von Spiel und Node-Tests verwendete Ausbau-Regeln. */
(function(){
const JM=window.JM, X=JM.Ausbau={};
// Previously a giant crop silently yielded five ordinary items. Preserve that five-item
// baseline as one distinct giant, with a moderate +20% size premium on its total value.
for(const k of Object.keys(JM.CROPS)){const it=JM.ITEMS[k];JM.ITEMS['riesig_'+k]={...it,n:'Riesen-'+it.n,base:k,giant:true,sell:it.sell*6,...(it.eat?{eat:it.eat*5}:{})};}
X.harvestItem=(k,giant)=>giant?'riesig_'+k:k;
X.food=k=>!!JM.ITEMS[k]&&['crop','animal','fish','forage','dish','ingredient'].includes(JM.ITEMS[k].cat);
X.transfer=function(s,k,n,into){
 if(!X.food(k)||!Number.isSafeInteger(n)||n<=0)return false;
 const a=into?s.inv:s.fridge,b=into?s.fridge:s.inv;
 if((a[k]||0)<n||!Number.isSafeInteger((b[k]||0)+n))return false;
 a[k]-=n;if(!a[k])delete a[k];b[k]=(b[k]||0)+n;return true;
};
X.quantity=function(value,max){if(!/^\d+$/.test(String(value)))return null;const n=Number(value);return Number.isSafeInteger(n)&&n>0&&n<=max?n:null;};
X.donateBoard=function(s,n){
 const b=s.board,got=b?.delivered||0;
 if(!b||b.done||!Number.isSafeInteger(n)||n<=0||n>b.n-got||(s.inv[b.k]||0)<n)return false;
 s.inv[b.k]-=n;if(!s.inv[b.k])delete s.inv[b.k];b.delivered=got+n;
 if(b.delivered<b.n)return 'partial';b.done=true;s.money+=b.rew;return 'complete';
};
X.donateBundle=function(s,bid,k,n){
 const b=JM.BUNDLES.find(b=>b.id===bid),got=s.bundles[bid]||{};
 if(!b||s.bundleDone[bid]||!b.need[k]||!Number.isSafeInteger(n)||n<=0||n>b.need[k]-(got[k]||0)||(s.inv[k]||0)<n)return false;
 s.inv[k]-=n;if(!s.inv[k])delete s.inv[k];got[k]=(got[k]||0)+n;s.bundles[bid]=got;
 if(!Object.entries(b.need).every(([i,need])=>(got[i]||0)>=need))return 'partial';
 s.bundleDone[bid]=true;return 'complete';
};
X.shipTransfer=function(s,k,n,into){
 if(!JM.ITEMS[k]||!JM.SHIPPABLE(k)||!Number.isSafeInteger(n)||n<=0)return false;
 const a=into?s.inv:s.ship,b=into?s.ship:s.inv;
 if((a[k]||0)<n||!Number.isSafeInteger((b[k]||0)+n))return false;
 a[k]-=n;if(!a[k])delete a[k];b[k]=(b[k]||0)+n;return true;
};
// S.ship has always been the saved pending queue; shipLog is already sold, never a source.
X.settleShipment=function(s){let earned=0;for(const [k,n] of Object.entries(s.ship)){earned+=(JM.ITEMS[k]?.sell||0)*n;s.shipLog[k]=(s.shipLog[k]||0)+n;s.stats.shipped+=n;}s.ship={};s.money+=earned;s.stats.earned+=earned;return earned;};
X.marketOpen=function(day,min){return (day-1)%7===5&&min>=540&&min<900&&!JM.FESTS.some(f=>f.s===Math.floor((day-1)/JM.DPS)%4&&f.d===(day-1)%JM.DPS+1);};
X.sellMarket=function(s,k,n){
 if(!X.marketOpen(s.day,s.min)||!JM.ITEMS[k]||!JM.SHIPPABLE(k)||!Number.isSafeInteger(n)||n<=0||(s.inv[k]||0)<n)return false;
 const mk=s.market?.day===s.day?s.market:{day:s.day,buzz:0,sold:0,earned:0};
 const g=Math.round(JM.ITEMS[k].sell*(1.2+Math.min(.5,mk.buzz*.05)))*n;
 if(!Number.isSafeInteger(s.money+g))return false;
 s.market=mk;s.inv[k]-=n;if(!s.inv[k])delete s.inv[k];s.money+=g;s.stats.earned+=g;s.shipLog[k]=(s.shipLog[k]||0)+n;
 mk.buzz+=Math.floor((mk.sold+n)/2)-Math.floor(mk.sold/2);mk.sold+=n;mk.earned+=g;return g;
};
X.count=(s,k)=>k==='fisch'?JM.FISHKEYS.reduce((n,f)=>n+X.count(s,f),0):(s.inv[k]||0)+((s.fridge||{})[k]||0);
X.plan=function(s,need){
 const bags=[Object.assign({},s.inv),Object.assign({},s.fridge||{})];
 // Konkrete Arten zuerst reservieren, Sammelkategorie darf sie nicht doppelt zählen.
 const entries=Object.entries(need).sort(([a],[b])=>(a==='fisch')-(b==='fisch'));
 for(const [k,n] of entries){
  if(!Number.isSafeInteger(n)||n<=0)return null;
  let left=n;for(const id of k==='fisch'?JM.FISHKEYS:[k])for(const bag of bags){const take=Math.min(left,bag[id]||0);if(take){bag[id]-=take;if(!bag[id])delete bag[id];left-=take;}}
  if(left)return null;
 }return bags;
};
X.cook=function(s,r){
 if(!r||!s.recipes.includes(r.k))return false;
 const bags=X.plan(s,r.need);if(!bags)return false;
 s.inv=bags[0];s.fridge=bags[1];s.inv[r.k]=(s.inv[r.k]||0)+1;return true;
};
// Grundzutaten sind eine teurere Alternative zur eigenen Ernte, nie Saison-Saatgut ersetzen.
for(const k of new Set(JM.RECIPES.flatMap(r=>Object.keys(r.need)).filter(k=>k!=='fisch'))){
 const stock=JM.SHOPS.markt.stock.find(s=>s.k===k);
 if(stock){delete stock.winter;stock.d='Ganzjähriger Küchenvorrat';}
 else JM.SHOPS.markt.stock.push({k,p:Math.ceil(JM.ITEMS[k].sell*2.2),d:'Ganzjähriger Küchenvorrat · Eigenanbau/Tierhaltung lohnt sich'});
}
// Reiner Einkauf → Kochen → Samstagsstand darf nicht ohne Zeit/Rohstoffbeschaffung Geld drucken.
const pantryPrices={weizen:160,zwiebel:90,pakchoi:150,huhn:340,ei:140,milch:200};
for(const s of JM.SHOPS.markt.stock)if(pantryPrices[s.k])s.p=pantryPrices[s.k];
const caveId=d=>d===1?'hoehle':'hoehle'+d;
JM.MINE_THEMES=[
 ['Eingangskammer','#9a886f',['stein','stein','kupfer']],
 ['Kupferadern','#a67755',['stein','kupfer','kupfer']],
 ['Eisengänge','#77858b',['stein','kupfer','eisen']],
 ['Amethystsaal','#8a6e9c',['kupfer','eisen','amethyst']],
 ['Silberrast','#8e9caa',['eisen','stein','silber']],
 ['Tiefe Adern','#827059',['eisen','kupfer','silber']],
 ['Edelsteingrotte','#9b7696',['amethyst','silber','amethyst']],
 ['Mondquarzhalle','#6f94a0',['silber','amethyst','mondquarz']],
 ['Alte Ruinen','#797694',['eisen','mondquarz','silber']],
 ['Magischer Teich','#658e9a',['mondquarz','amethyst','silber']]
];
const baseMaps=JM.buildMaps;
JM.buildMaps=function(){
 const maps=baseMaps(),T=JM.T;
 for(let depth=1;depth<=10;depth++){
  const [title,tint]=JM.MINE_THEMES[depth-1],id=caveId(depth),m={id,w:22,h:18,t:[],obj:[],exits:[],trees:[],lights:[],spawn:[10,14],cave:true,depth,title,tint};
  for(let y=0;y<m.h;y++){m.t[y]=[];for(let x=0;x<m.w;x++)m.t[y][x]=x>=2&&x<=19&&y>=2&&y<=16?T.HBODEN:T.FELS;}
  // Unterschiedliche Seitengänge; Mittelkorridor und beide Leitern bleiben frei.
  for(let i=0;i<depth+2;i++){const x=3+(i*5+depth)%15,y=3+(i*3+depth)%10;if(x!==10&&x!==11)m.t[y][x]=T.FELS;}
  const add=(x,y,act)=>{m.obj.push({k:'leiter',x,y,act});m.t[y][x]=T.BLOCK;};
  add(10,16,depth===1?'cave_out':'mine_up');
  if(depth<10)add(10,2,'mine_down');
  if(depth===10)for(let y=5;y<=9;y++)for(let x=13;x<=17;x++)m.t[y][x]=T.WASSER;
  maps[id]=m;
 }
 return maps;
};
const baseWater=JM.waterKind;JM.waterKind=(id,x,y)=>id==='hoehle10'?'magie':baseWater(id,x,y);
X.enterMine=function(s,id,maps,rng=Math.random){
 const m=maps[id];s.mine=s.mine||{active:false,floors:{}};
 if(!m.cave){s.mine.active=false;s.rocks=[];return;}
 if(!s.mine.active){s.mine.floors={};s.mine.active=true;s.mine.runs=(s.mine.runs||0)+1;}
 if(!s.mine.floors[id]){
  const cand=[];for(let y=3;y<14;y++)for(let x=3;x<19;x++)if(m.t[y][x]===JM.T.HBODEN&&x!==10&&x!==11)cand.push([x,y]);
  const rocks=[],ores=JM.MINE_THEMES[m.depth-1][2];
  for(let i=0;i<18+m.depth&&cand.length;i++){const [x,y]=cand.splice(Math.min(cand.length-1,Math.floor(rng()*cand.length)),1)[0],k=ores[Math.min(ores.length-1,Math.floor(rng()*ores.length))];rocks.push({x,y,k,hp:k==='stein'?1:m.depth<6?2:3});}
  s.mine.floors[id]=rocks;
 }
 s.mine.depth=m.depth;s.rocks=s.mine.floors[id];
};
Object.assign(JM.ITEMS,{
 eisen:{n:'Eisenerz',cat:'mineral',sell:12},silber:{n:'Silbererz',cat:'mineral',sell:30},
 sternenschuppe:{n:'Sternenschuppe',cat:'fish',sell:180},kristallforelle:{n:'Kristallforelle',cat:'fish',sell:210}
});
JM.CRAFT.push({k:'sprinkler',n:3,need:{eisen:4,silber:2,stein:8},d:'Tiefenbau: drei Sprinkler aus Eisen und Silber.'});
// Eigene Rezept-ID, damit mehrere Werkbank-Angebote mit gleichem Ergebnis eindeutig bleiben.
JM.CRAFT.forEach((r,i)=>r.id='craft'+i);
JM.FISH.sternenschuppe={dif:.38,at:['magie']};JM.FISH.kristallforelle={dif:.48,at:['magie']};
JM.FISHKEYS.push('sternenschuppe','kristallforelle');
X.pickFish=function(kind,min,moon,rng=Math.random){
 const night=min>=1140||min<360;
 let opts=Object.keys(JM.FISH).filter(k=>JM.FISH[k].at.includes(kind)&&(!JM.FISH[k].night||night));
 for(const k of opts){const r=JM.FISH[k].rare;if(r&&rng()<r*(k==='koi'&&moon?3:1))return k;}
 opts=opts.filter(k=>!JM.FISH[k].rare);return opts[Math.min(opts.length-1,Math.floor(rng()*opts.length))]||'karpfen';
};
X.migrate=function(s){
 const validBag=b=>b&&typeof b==='object'&&!Array.isArray(b)?Object.fromEntries(Object.entries(b).filter(([,n])=>Number.isSafeInteger(n)&&n>0)):{};
 s.inv=validBag(s.inv);s.fridge=validBag(s.fridge);s.ship=validBag(s.ship);
 for(const k of Object.keys(s.fridge))if(!X.food(k)){s.inv[k]=(s.inv[k]||0)+s.fridge[k];delete s.fridge[k];}
 if(!s.house||typeof s.house!=='object')s.house={level:0,job:null};
 if(!Number.isInteger(s.house.level)||s.house.level<0||s.house.level>2)s.house.level=0;
 if(s.house.job&&(!Number.isInteger(s.house.job.level)||s.house.job.level!==s.house.level+1||!Number.isInteger(s.house.job.due)))s.house.job=null;
 if(!s.mine||typeof s.mine!=='object')s.mine={active:!!(/^hoehle(?:[2-9]|10)?$/.test(s.map)),floors:{}};
 if(!s.mine.floors||typeof s.mine.floors!=='object')s.mine.floors={};
 if(s.map==='hoehle'&&s.mine.floors.hoehle===undefined&&Array.isArray(s.rocks))s.mine.floors.hoehle=s.rocks;
 for(const id of Object.keys(s.mine.floors)){const a=s.mine.floors[id];if(!Array.isArray(a)){delete s.mine.floors[id];continue;}s.mine.floors[id]=a.filter(r=>r&&Number.isInteger(r.x)&&Number.isInteger(r.y)&&r.x>=2&&r.x<20&&r.y>=2&&r.y<17&&JM.ITEMS[r.k]?.cat==='mineral'&&Number.isInteger(r.hp)&&r.hp>0);}
 if(typeof s.hintsCollapsed!=='boolean')s.hintsCollapsed=false;
 s.ausbauVersion=1;return s;
};
// Timo wohnt/arbeitet in einer eigenen, über den Dorfweg erreichbaren Zimmerei.
JM.ITEMS.holz={n:'Bauholz',cat:'material',sell:4};
JM.SHOPS.zimmerei={npc:'timo',n:'Timos Zimmerei',stock:[{k:'holz',p:35,d:'Bauholz · auch aus Ästen auf dem Hof und täglich im Wald'}]};
JM.NPCS.timo={n:'Timo',role:'Zimmermann',home:'zimmerei',bday:[2,4],
 look:{skin:'#e3b48e',hair:'#6b4423',style:'short',beard:true,top:'#64885a',bot:'#4a5678',overall:true,shoes:'#5a3a24'},
 love:['holz','pilzpfanne'],like:['suppe','amethyst','silber'],hate:['kabel'],
 sched:[[360,[24,14]],[480,'in'],[1020,[17,13]],[1200,'off']],free:[6],freeSched:[[480,[17,13]],[1140,'off']],recipe:'suppe',
 intro:'Ich bin Timo, der Zimmermann. Meine Werkstatt liegt rechts vom Brunnen. Bring Holz und etwas Geld mit: Ich baue euch mehr Platz, ohne Küche oder Bett zu versetzen. Ein Auftrag dauert mehrere Nächte.',
 lines:[['Äste auf deinem Feld ergeben Bauholz. Im Wald findest du täglich neues. Oder du kaufst welches bei mir.','Ich arbeite von 8 bis 17 Uhr. Sonntags ruht die Säge.'],['Eisenerz ab Ebene 3 macht starke Verbindungen. Für den zweiten Anbau brauche ich davon ein wenig.'],['Ein gutes Haus wächst mit den Menschen darin. Eures wird langsam richtig gemütlich.']],
 rain:'Bei Regen arbeite ich lieber drinnen. Das Holz muss trocken bleiben.',gift:{love:'Das kann ich gut gebrauchen. Danke!',like:'Wie aufmerksam, danke.',neutral:'Danke dir.',hate:'Das passt eher in die Kabelkiste.'}};
JM.NPC_ORDER.push('timo');
JM.HOUSE_UPGRADES=[
 {level:1,n:'Vorratsstube',money:1000,need:{holz:20,stein:10},days:2,d:'Heller Anbau und echte obere Lesegalerie mit Treppe, Büchern und Sitzecke. +10 maximale Energie.'},
 {level:2,n:'Wohnwerkstatt',money:2400,need:{holz:40,stein:20,eisen:6},days:3,d:'Große Wohnetage mit eigenem Schlafzimmer, Kleiderschrank und Lesegalerie; Werkstatt im Erdgeschoss. +10 maximale Energie.'}
];
const mineMaps=JM.buildMaps;
JM.buildMaps=function(){const maps=mineMaps(),v=maps.village;
 v.rect(23,13,25,14,JM.T.WEG);v.add({k:'huette',x:23,y:10,w:5,h:3,door:[25,13],act:'shop:zimmerei'});
 const r=maps.i_zimmerei=Object.assign({},maps.i_huette,{id:'i_zimmerei',owner:'timo',shop:'zimmerei',exits:[{x:6,y:8,to:'village',tx:25,ty:14}]});r.obj=maps.i_huette.obj.map(o=>Object.assign({},o));return maps;};
X.orderHouse=function(s,level){const r=JM.HOUSE_UPGRADES.find(r=>r.level===level);
 if(!r||s.house.job||level!==s.house.level+1||s.money<r.money||!Object.entries(r.need).every(([k,n])=>(s.inv[k]||0)>=n))return false;
 s.money-=r.money;for(const [k,n] of Object.entries(r.need)){s.inv[k]-=n;if(!s.inv[k])delete s.inv[k];}s.house.job={level,due:s.day+r.days};return true;
};
X.finishHouse=function(s){const j=s.house.job;if(!j||s.day<j.due)return false;
 s.house.level=j.level;s.house.job=null;s.maxE+=10;return true;
};
X.applyHouse=function(maps,level){if(!level||maps.haus.houseLevel===level)return;
 const m=maps.haus,old=m.w;m.w=14+level*4;m.houseLevel=level;
 for(let y=0;y<m.h;y++){for(let x=old;x<m.w;x++)m.t[y][x]=JM.T.WAND;if(y>=3&&y<=9)for(let x=13;x<m.w-1;x++)m.t[y][x]=JM.T.BODEN;}
 m.obj.push({k:'fridge',x:14,y:3,act:'fridge'});m.t[3][14]=JM.T.BLOCK;
 if(level>=2){m.obj.push({k:'workbench',x:19,y:3,w:2,act:'craft'},{k:'table',x:18,y:7,w:2,act:'deco'});for(const o of m.obj.filter(o=>o.x>=18))for(let x=o.x;x<o.x+(o.w||1);x++)m.t[o.y][x]=JM.T.BLOCK;}
 for(let y=5;y<=8;y++)for(let x=15;x<m.w-2;x++)if(m.t[y][x]!==JM.T.BLOCK)m.t[y][x]=JM.T.TEPPICH;
 m.windows.push([16,1]);if(level>=2)m.windows.push([20,1]);
 m.obj.push({k:'stairs',x:16,y:3,h:2,act:'house_up'},{k:'plant',x:14,y:8,act:'plant'});
 m.t[3][16]=m.t[4][16]=m.t[8][14]=JM.T.BLOCK;
 m.pal={...m.pal,wall:'#f1dfc1',wall2:'#d6b88d',rug:'#6e8d82',rug2:'#dfc483'};
 const w=level===1?14:20,h=12,T=JM.T;
 const upper={id:'haus_oben',title:level===1?'Zuhause · Lesegalerie':'Zuhause · Wohnetage',w,h,inside:true,houseLevel:level,pal:{...m.pal,wall:'#e7e3d5',wall2:'#d1c9b5',floor:'#bd986c',floor2:'#a48058',rug:'#638d9b',rug2:'#d7c79b'},t:[],obj:[],trees:[],lights:[],windows:[[5,1],[10,1],...(level===2?[[16,1]]:[])],spawn:[3,8],exits:[{x:2,y:9,to:'haus',tx:16,ty:5}]};
 for(let y=0;y<h;y++){upper.t[y]=[];for(let x=0;x<w;x++)upper.t[y][x]=x>0&&x<w-1&&y>=3&&y<h-1?T.BODEN:T.WAND;}
 const add=o=>{upper.obj.push(o);for(let y=o.y;y<o.y+(o.h||1);y++)for(let x=o.x;x<o.x+(o.w||1);x++)upper.t[y][x]=T.BLOCK;};
 for(let y=5;y<=8;y++)for(let x=4;x<=10;x++)upper.t[y][x]=T.TEPPICH;
 add({k:'stairs',x:2,y:7,h:2,act:'house_down'});add({k:'shelf',x:2,y:3,act:'shelf'});add({k:'shelf',x:3,y:3,act:'shelf'});add({k:'table',x:6,y:6,w:2,act:'deco'});add({k:'plant',x:10,y:3,act:'plant'});add({k:'tv',x:7,y:3,act:'tv'});
 if(level===2){for(let y=3;y<=9;y++)if(y!==7)upper.t[y][13]=T.WAND;add({k:'bed',x:16,y:3,w:2,h:2,act:'bed'});add({k:'wardrobe',x:16,y:8,act:'wardrobe'});add({k:'plant',x:18,y:6,act:'plant'});}
 maps.haus_oben=upper;
};
X.repairCollectibles=function(s,m){
 const dirs=[[1,0],[-1,0],[0,1],[0,-1]],q=[m.spawn],seen=new Set([m.spawn.join(',')]);
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&JM.WALK.has(m.t[ny]?.[nx])){seen.add(k);q.push([nx,ny]);}}}
 const objects=[...(s.mess||[]).filter(o=>o.map===m.id),...((s.forage||{})[m.id]||[])],occupied=new Set(objects.map(o=>o.x+','+o.y));let changed=0;
 for(const o of objects){if(seen.has(o.x+','+o.y)||dirs.some(([dx,dy])=>seen.has((o.x+dx)+','+(o.y+dy))))continue;
 const choices=q.filter(([x,y])=>!occupied.has(x+','+y)&&!m.exits.some(e=>e.x===x&&e.y===y)).sort((a,b)=>(Math.abs(a[0]-o.x)+Math.abs(a[1]-o.y))-(Math.abs(b[0]-o.x)+Math.abs(b[1]-o.y)));
 if(choices.length){[o.x,o.y]=choices[0];occupied.add(o.x+','+o.y);changed++;}
 }return changed;
};
})();
