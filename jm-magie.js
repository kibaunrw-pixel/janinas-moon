"use strict";
/* Etappe 4: Vollmondwald (W07), Mondblume (W09), Regenhändler Nerio (W10).
   Der Mond folgt bewusst dem kurzen Spieljahr: Vollmond an Tag 14, 28, 42 …; am Vortag wird gewarnt. */
(function(){
const J=window.JM,X=J.Post,St=J.Stadt,D=J.Dorf,T=J.T,G=J.Magie={};
G.ROOM='vollmondwald';G.PERIOD=14;G.GATE={x:2,y:3};G.SEED={x:13,y:6};
J.ITEMS.mondsamen={n:'Mondsamen',cat:'seed',crop:'mondblume'};
J.ITEMS.mondblume={n:'Mondblüte',cat:'crop',sell:640,eat:35};
J.ITEMS.mondtau={n:'Mondtau',cat:'forage',sell:140,eat:18};
J.CROPS.mondblume={days:3,seed:0,se:[0,1,2,3],magic:true};
G.STOCK=[{k:'mondsamen',n:1,p:240,d:'Wächst nur nach nächtlichem Gießen von Hand.'},{k:'mondtau',n:1,p:520,d:'Seltener Tau aus dem Vollmondwald.'},{k:'mondquarz',n:1,p:480,d:'Ein leiser Schimmer für Werkbank und Geschenke.'}];
G.moon=day=>{const d=((Math.max(1,day)-1)%G.PERIOD)+1,full=d===G.PERIOD,tomorrow=d===G.PERIOD-1;return {day:d,full,tomorrow,phase:full?'voll':tomorrow?'fast voll':d<7?'zunehmend':'abnehmend',until:full?0:G.PERIOD-d};};
G.migrate=function(s){let m=s.magie;if(!m||typeof m!=='object'||Array.isArray(m))m=s.magie={};m.v=1;if(!m.found||typeof m.found!=='object')m.found={};if(!m.bought||typeof m.bought!=='object')m.bought={};return s;};
const mig=J.Ausbau.migrate;J.Ausbau.migrate=function(s){mig(s);G.migrate(s);return s;};

function moonMap(){const w=20,h=17,m={id:G.ROOM,w,h,t:[],obj:[],trees:[],lights:[],exits:[],title:'Der Vollmondwald',moonForest:true};
 for(let y=0;y<h;y++){m.t[y]=[];for(let x=0;x<w;x++){const rim=x===0||y===0||x===w-1||y===h-1;m.t[y][x]=rim?T.BAUM:((x>7&&x<12&&y>7&&y<12)?T.WASSER:T.WALD);}}
 for(const [x,y] of [[9,7],[10,7],[11,7],[8,8],[12,8],[8,9],[12,9],[8,10],[12,10],[9,11],[10,11],[11,11]])m.t[y][x]=T.WALD;
 m.t[15][10]=m.t[16][10]=T.WALD;m.spawn=[10,14];m.exits=[{x:10,y:16,to:'waldtuer',tx:5,ty:5}];
 m.obj=[{k:'mondpilze',x:4,y:6,act:'magie:pilze'},{k:'mondsamen_fund',x:G.SEED.x,y:G.SEED.y,act:'magie:samen'},{k:'mondsteinring',x:15,y:11,act:'magie:ring'}];
 for(const o of m.obj)m.t[o.y][o.x]=T.BLOCK;
 for(const [x,y,v] of [[2,3,1],[5,3,2],[16,3,3],[3,11,4],[17,8,5],[6,14,6],[15,14,7]])m.trees.push({x,y,kind:'pine',v});
 m.lights=[[4.5,.4,6.5],[13.5,.5,6.5],[15.5,.35,11.5]];m.houseLevel='vollmondwald';return m;}
const bm=J.buildMaps;J.buildMaps=function(){const all=bm();all[G.ROOM]=moonMap();return G.apply(all,null);};
function clear(m){if(!m)return;m.obj=m.obj.filter(o=>!(o.act||'').startsWith('magie:'));if(m.magieTiles){for(const [k,t] of Object.entries(m.magieTiles)){const [x,y]=k.split(',').map(Number);m.t[y][x]=t;}delete m.magieTiles;}}
function put(m,o){m.magieTiles=m.magieTiles||{};m.obj.push(o);for(let y=o.y;y<o.y+(o.h||1);y++)for(let x=o.x;x<o.x+(o.w||1);x++){const k=x+','+y;if(!(k in m.magieTiles))m.magieTiles[k]=m.t[y][x];m.t[y][x]=T.BLOCK;}}
G.merchantLocation=s=>{if(!s||s.weather!=='rain'||s.min<420||s.min>=1200)return null;if(s.min<660)return {map:'forest',x:12,y:10};if(s.min<960)return {map:'village',x:18,y:12};return {map:'forest',x:20,y:19};};
G.apply=function(maps,s){for(const id of ['waldtuer','forest','village'])clear(maps[id]);const r=maps.waldtuer;if(r){const full=s&&G.moon(s.day).full;put(r,{k:full?'mondtor_offen':'mondtor_zu',x:G.GATE.x,y:G.GATE.y,act:'magie:tor'});r.houseLevel+='|mond:'+(full?'offen':'zu');}
 const l=G.merchantLocation(s);if(l&&maps[l.map])put(maps[l.map],{k:'regenhaendler',x:l.x,y:l.y,act:'magie:haendler'});return maps;};
const apply0=X.apply;X.apply=function(maps,s){apply0(maps,s);return G.apply(maps,s);};

G.act=function(s,a){G.migrate(s);
 if(a==='tor'){if(!G.moon(s.day).full)return {note:'Noch kein Vollmond. Im Tagebuch steht, wann das Tor erwacht.'};return {travel:{to:G.ROOM,tx:10,ty:14}};}
 if(a==='samen'){if(s.magie.found.samen)return {note:'Die Mondsamen sind gesammelt. Zwischen den silbrigen Blättern ist heute nichts mehr.'};s.magie.found.samen=s.day;s.inv.mondsamen=(s.inv.mondsamen||0)+3;return {hud:true,sfx:'gift',lines:[D.say(null,'Unter den leuchtenden Blättern liegen drei dunkle Samen.'),D.say('player','Mondsamen. Sie fühlen sich kühl an. Ich gieße sie nachts von Hand.')]};}
 if(a==='pilze')return {note:'Die Pilze leuchten ruhig. Ihr Licht bleibt dicht am Boden.'};
 if(a==='ring')return {note:'Im Steinring steht: „Drei Nächte Wasser aus deiner Hand. Kein Regen. Kein Rad.“'};
 if(a==='haendler')return G.shop(s);return null;};
G.shop=s=>({panel:{t:'Nerios Regenwagen',p:['„Wenn der Regen fällt, finde ich meinen Weg.“','Heute: 7 bis 20 Uhr. Morgens am Waldweg, mittags am Dorfbrunnen, abends am Waldsee.'],buttons:G.STOCK.map(q=>({a:'magiekauf-'+q.k,k:q.k,t:q.n+'× '+J.ITEMS[q.k].n+' · '+q.p+' G',off:s.money<q.p,fn:()=>G.buy(s,q.k)?{hud:true,sfx:'buy',note:J.ITEMS[q.k].n+' liegt in deinem Rucksack.'}:{note:'Dafür reicht dein Geld nicht.'}}))}});
G.buy=function(s,k){G.migrate(s);const q=G.STOCK.find(x=>x.k===k);if(!q||s.weather!=='rain'||!G.merchantLocation(s)||s.money<q.p)return false;s.money-=q.p;s.inv[k]=(s.inv[k]||0)+q.n;s.magie.bought[k]=(s.magie.bought[k]||0)+q.n;return true;};
const ev0=X.evAct;X.evAct=function(s,a){if(String(a).startsWith('magie:'))return G.act(s,String(a).slice(6));return ev0?ev0(s,a):null;};
G.isNight=s=>s.min>=1170||s.min<390;
G.markWater=function(s,f,manual){if(!f||!f.c||f.c.k!=='mondblume'||!manual||!G.isNight(s))return false;f.w=true;f.c.nacht=s.day;return true;};
G.growsTonight=(s,f)=>!!(f&&f.c&&f.c.k==='mondblume'&&f.w&&f.c.nacht===s.day);
G.afterGrowth=(s,f)=>{if(f&&f.c&&f.c.k==='mondblume')delete f.c.nacht;};
G.cropHint=(s,f)=>f&&f.c&&f.c.k==='mondblume'&&!G.growsTonight(s,f)?'Mondblüten wachsen nur, wenn du sie nachts von Hand gießt. Regen und Sprinkler zählen nicht.':null;
G.safeMorning=s=>s&&s.map===G.ROOM?{map:'haus',px:10,py:5}:null;
G.weatherText=w=>w==='rain'?' Regen. Nerio kommt mit seinem Regenwagen: 7–11 Uhr Waldweg, 11–16 Uhr Dorfbrunnen, 16–20 Uhr Waldsee.':'';
G.target=function(s){if(!s||!s.post||!s.post.m||!['offen','fertig'].includes(s.post.m.tuer.st))return null;const mo=G.moon(s.day);if(mo.full&&!s.magie.found.samen)return {map:G.ROOM,x:G.SEED.x,y:G.SEED.y+1,t:'Der Vollmondwald',sub:'Durch das Gewölbe · Mondsamen suchen'};return null;};
const target0=X.target;X.target=function(s){return target0(s)||G.target(s);};
G.calMarks=function(s,se,d){const abs=D.cal.abs(D.cal.y(s),se,d),m=G.moon(abs);return m.full?['Vollmond · Das Tor im Gewölbe ist offen']:m.tomorrow?['Morgen ist Vollmond']:[];};
G.diary=function(s,esc){G.migrate(s);const m=G.moon(s.day),e=esc||String;return '<h3>Mond und Magie</h3><div class="row"><div class="tx"><b>Mond: '+e(m.phase)+'</b><small>'+(m.full?'Heute öffnet sich das Tor im Gewölbe.':m.tomorrow?'Morgen ist Vollmond. Das Tor öffnet sich nur einen Tag.':'Noch '+m.until+' Tage bis Vollmond.')+'</small><small>Mondblüte: nachts von Hand gießen. Regen und Sprinkler zählen nicht.</small></div></div>';};
})();
