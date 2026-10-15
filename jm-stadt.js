"use strict";
/* Erste kleine Stadt. Keine Echtzeit-Uhr: alle Fristen sind gespeicherte Spieltage. */
(function(){
const J=window.JM,X=J.Stadt={},T=J.T;
X.places=[{n:'Lindenhof',x:3,y:3},{n:'Sonnenwinkel',x:11,y:3},{n:'Abendgarten',x:19,y:3}];
const migrate=J.Ausbau.migrate;
J.Ausbau.migrate=function(s){migrate(s);if(!s.city||typeof s.city!=='object')s.city={};
 const old=Array.isArray(s.city.plots)?s.city.plots:[];
 s.city.plots=X.places.map((_,i)=>{const p=old[i];return p&&typeof p==='object'?p:{start:null,ready:false,tenant:null,lastRent:0};});
 return s;};
function outdoor(id,w,h,spawn){const m={id,w,h,spawn,t:[],obj:[],trees:[],lights:[],exits:[]};for(let y=0;y<h;y++)m.t[y]=Array.from({length:w},(_,x)=>x===0||y===0||x===w-1||y===h-1?T.BLOCK:T.GRAS);return m;}
function rect(m,x0,y0,x1,y1,t){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)m.t[y][x]=t;}
function add(m,o){m.obj.push(o);rect(m,o.x,o.y,o.x+(o.w||1)-1,o.y+(o.h||1)-1,T.BLOCK);}
function city(s){const m=outdoor('stadt',28,23,[13,18]);m.title='Lindenstadt';rect(m,2,9,25,10,T.WEG);rect(m,12,8,14,20,T.PLATZ);rect(m,4,14,22,15,T.WEG);
 X.places.forEach((p,i)=>{const phase=s?X.phase(s,i):0;rect(m,p.x,p.y,p.x+4,p.y+3,T.SAND);if(phase===4)add(m,{k:'house',x:p.x,y:p.y,w:5,h:4,act:'plot:'+i});else if(phase)add(m,{k:'bau'+phase,x:p.x,y:p.y,w:5,h:4,act:'plot:'+i});add(m,{k:'board',x:p.x+2,y:8,act:'plot:'+i});});
 add(m,{k:'huette',x:18,y:17,w:4,h:3,act:'train'});add(m,{k:'board',x:14,y:19,act:'train'});add(m,{k:'fountain',x:8,y:13,w:2,h:2,act:'fountain'});[4,24].forEach(x=>add(m,{k:'lamp',x,y:12,act:'lamp'}));
 m.houseLevel=s?JSON.stringify(s.city.plots.map((p,i)=>[X.phase(s,i),p.tenant])):'leer';return m;}
X.phase=(s,i)=>{const p=s.city.plots[i];return p.ready?4:p.start===null?0:Math.min(3,1+Math.max(0,s.day-p.start));};
const maps=J.buildMaps;
J.buildMaps=function(){const all=maps(),v=all.village;v.trees=v.trees.filter(t=>!(t.x>=28&&t.y===14));rect(v,26,14,31,14,T.WEG);v.exits.push({x:31,y:14,to:'bahnhof',tx:2,ty:9});
 add(v,{k:'board',x:29,y:13,act:'station_hint'});
 const m=outdoor('bahnhof',18,15,[2,9]);m.title='Dorfbahnhof';rect(m,0,9,15,10,T.WEG);rect(m,4,6,15,8,T.PLATZ);rect(m,2,3,15,4,T.HBODEN);add(m,{k:'huette',x:4,y:4,w:4,h:3,act:'train'});add(m,{k:'board',x:11,y:8,act:'train'});add(m,{k:'zug',x:10,y:3,w:4,h:2,act:'train'});m.exits=[{x:0,y:9,to:'village',tx:29,ty:14}];all.bahnhof=m;all.stadt=city(null);return all;};
X.cost={money:1500,holz:30,stein:20,days:3,rent:60};
const valid=i=>Number.isInteger(i)&&i>=0&&i<X.places.length;
X.order=(s,i)=>{if(!valid(i))return false;const p=s.city.plots[i],c=X.cost;
 if(p.ready||p.start!==null||s.money<c.money||(s.inv.holz||0)<c.holz||(s.inv.stein||0)<c.stein)return false;
 s.money-=c.money;for(const k of ['holz','stein']){s.inv[k]-=c[k];if(!s.inv[k])delete s.inv[k];}p.start=s.day;p.due=s.day+c.days;return true;};
X.rent=(s,i)=>{if(!valid(i))return false;const p=s.city.plots[i];if(!p.ready||p.tenant)return false;p.tenant=['ida','noah','mara'][i];p.since=s.day;p.lastRent=s.day;return true;};
X.advance=s=>{let earned=0;for(const p of s.city.plots){if(p.start!==null&&!p.ready&&s.day>=p.due)p.ready=true;
 if(p.tenant&&s.day>p.since&&s.day>(p.lastRent||0)){earned+=X.cost.rent;p.lastRent=s.day;}}
 s.money+=earned;if(s.stats)s.stats.earned+=earned;return earned;};
const residents=[
 ['ida','Ida','Buchbinderin','#748eb8','Im Lindenhof binde ich Bücher. Endlich ein eigenes kleines Atelier.','Lin hebt mir immer einen Fensterplatz auf. Ich sammle dort Geschichten für mein nächstes Buch.'],
 ['noah','Noah','Gärtner','#6f985a','Im Sonnenwinkel ziehe ich Kräuter. Der Stadtboden hat mehr Leben, als man denkt.','Nach der Gartenarbeit schmeckt Lins Suppe besonders gut. Morgen bringe ich ihm Schnittlauch.'],
 ['mara','Mara','Musikerin','#b8798e','Im Abendgarten übe ich Geige. Keine Sorge: nachts bleibt der Bogen im Kasten.','Hier am Tisch höre ich die besten Melodien: klappernde Schalen und lachende Menschen.']
];
residents.forEach(([id,n,role,top,line,dinner],i)=>{J.NPCS[id]={n,role,home:'stadt',cityPlot:i,bday:[i,8],look:{...J.NPCS.mei.look,top,hair:['#69483a','#32353c','#a76538'][i],style:i===1?'short':'bun'},love:['suppe'],like:['tee','rolle'],hate:['kabel'],sched:[[360,'off']],recipe:'suppe',intro:'Ich bin '+n+'. '+line,lines:[[line],['Ich bin gern hier. '+line],['Schön, dass du wieder vorbeischaust. '+line]],rain:'Der Regen tut den Stadtgärten gut.',dinner,gift:{love:'Genau mein Geschmack. Danke!',like:'Wie aufmerksam!',neutral:'Danke dir.',hate:'Damit kann ich wenig anfangen.'}};J.NPC_ORDER.push(id);});
for(const r of J.SHOPS.nudelhaus.stock)r.p=Math.max(r.p,Math.ceil(J.ITEMS[r.k].sell*2));
for(const k of ['suppe','pakchoi_g','pilzpfanne','kuerbissuppe','tomatenei','nudeln']){const it=J.ITEMS[k];J.SHOPS.nudelhaus.stock.push({k,p:Math.max(100,Math.ceil(it.sell*2)),d:(it.eat>=999?'Volle Energie':'+'+it.eat+' Energie')+' · frisch aus Lins Küche'});}
X.guests=(s,festival)=>{if(festival||(s.day-1)%7===2||s.min<1080||s.min>=1260)return [];
 const pool=['mei','rosa','paula','henk','timo',...(s.city?.plots||[]).filter(p=>p.tenant).map(p=>p.tenant)],i=(s.day-1)%pool.length;return [pool[i],pool[(i+2)%pool.length]];};
X.location=(s,id,festival)=>{const guests=X.guests(s,festival),index=guests.indexOf(id);if(index>=0)return {map:'i_nudelhaus',x:index?9:2,y:7};
 const n=J.NPCS[id];if(n.cityPlot!==undefined&&s.city?.plots[n.cityPlot]?.tenant===id&&s.min>=420&&s.min<1260){const p=X.places[n.cityPlot];return {map:'stadt',x:p.x+2+(Math.floor(s.min/60)%2),y:10};}return null;};
X.apply=(maps,s)=>{maps.stadt=city(s);};
})();
