"use strict";
/* Kleine gemeinsam von Spiel und Node-Tests verwendete Ausbau-Regeln. */
(function(){
const JM=window.JM, X=JM.Ausbau={};
X.food=k=>!!JM.ITEMS[k]&&['crop','animal','fish','forage','dish','ingredient'].includes(JM.ITEMS[k].cat);
X.transfer=function(s,k,n,into){
 if(!X.food(k)||!Number.isSafeInteger(n)||n<=0)return false;
 const a=into?s.inv:s.fridge,b=into?s.fridge:s.inv;
 if((a[k]||0)<n||!Number.isSafeInteger((b[k]||0)+n))return false;
 a[k]-=n;if(!a[k])delete a[k];b[k]=(b[k]||0)+n;return true;
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
 s.inv=validBag(s.inv);s.fridge=validBag(s.fridge);
 for(const k of Object.keys(s.fridge))if(!X.food(k)){s.inv[k]=(s.inv[k]||0)+s.fridge[k];delete s.fridge[k];}
 if(!s.house||typeof s.house!=='object')s.house={level:0,job:null};
 if(!Number.isInteger(s.house.level)||s.house.level<0||s.house.level>2)s.house.level=0;
 if(s.house.job&&(!Number.isInteger(s.house.job.level)||s.house.job.level!==s.house.level+1||!Number.isInteger(s.house.job.due)))s.house.job=null;
 if(!s.mine||typeof s.mine!=='object')s.mine={active:!!(/^hoehle(?:[2-9]|10)?$/.test(s.map)),floors:{}};
 if(!s.mine.floors||typeof s.mine.floors!=='object')s.mine.floors={};
 if(s.map==='hoehle'&&s.mine.floors.hoehle===undefined&&Array.isArray(s.rocks))s.mine.floors.hoehle=s.rocks;
 for(const id of Object.keys(s.mine.floors)){const a=s.mine.floors[id];if(!Array.isArray(a)){delete s.mine.floors[id];continue;}s.mine.floors[id]=a.filter(r=>r&&Number.isInteger(r.x)&&Number.isInteger(r.y)&&r.x>=2&&r.x<20&&r.y>=2&&r.y<17&&JM.ITEMS[r.k]?.cat==='mineral'&&Number.isInteger(r.hp)&&r.hp>0);}
 s.ausbauVersion=1;return s;
};
})();
