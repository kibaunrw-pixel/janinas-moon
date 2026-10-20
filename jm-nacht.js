"use strict";
/* Nächtliche Überraschungen (Oktober 2026, Vorbild: die Nachtereignisse in Stardew Valley).
   Ab und zu passiert nachts etwas auf dem Hof, und am Morgen steht es im Tagesrückblick:
   · Meteorit: schlägt auf einer freien Wiese ein. Dreimal kräftig draufschlagen (je 5 Energie) →
     Meteoritenstück (wertvoll, Elva liebt es), Mondquarz und Silber. Nach vier Tagen zerfällt er zu Sternenstaub.
   · Mondfee: tanzt über dem Feld; ein Fleck aus bis zu neun Pflanzen ist am Morgen reif.
   · Steineule: Eine Eulenfigur steht plötzlich auf dem Hof und bleibt. Jeden Tag liegt ein kleiner Fund daneben.
   Kein Ereignis nimmt etwas weg. Der erste Meteorit kommt in den ersten Nächten sicher, danach etwa alle ein bis
   zwei Wochen ein Ereignis. Alle Zeiten sind Spieltage. */
(function(){
const J=window.JM,X=J.Post,T=J.T,N=J.Nacht={};
N.METEOR_HP=3;N.METEOR_DAYS=4;N.HIT=5;
J.ITEMS.meteorit={n:'Meteoritenstück',cat:'material',sell:1200};
if(J.NPCS.elva&&!J.NPCS.elva.love.includes('meteorit'))J.NPCS.elva.love.push('meteorit');
N.migrate=function(s){let n=s.nacht;if(!n||typeof n!=='object'||Array.isArray(n))n=s.nacht={};n.v=1;
 if(!Number.isInteger(n.since))n.since=s.day||1;if(!Number.isInteger(n.last))n.last=0;if(!n.log||typeof n.log!=='object')n.log={};
 for(const k of ['meteor','fee','eule'])if(!Number.isInteger(n.log[k]))n.log[k]=0;if(!Array.isArray(n.notes))n.notes=[];
 const ok=o=>o&&typeof o==='object'&&(o.x===undefined||Number.isInteger(o.x));
 if(n.ev&&!(ok(n.ev)&&n.ev.k==='meteor'&&Number.isInteger(n.ev.day)&&Number.isInteger(n.ev.hp)&&n.ev.hp>0))n.ev=null;
 if(n.eule&&!(ok(n.eule)&&Number.isInteger(n.eule.day)))n.eule=null;return s;};
const mig=J.Ausbau.migrate;J.Ausbau.migrate=s=>{mig(s);return N.migrate(s);};

/* ---------- Nacht: Ereignis auswürfeln ---------- */
const unripe=s=>Object.entries(s.field||{}).filter(([,f])=>f&&f.c&&J.CROPS[f.c.k]&&!J.CROPS[f.c.k].magic&&f.c.a<J.CROPS[f.c.k].days-1);
N.fee=function(s,rng){const list=unripe(s);if(!list.length)return 0;const [k0]=list[Math.min(list.length-1,Math.floor(rng()*list.length))],[cx,cy]=k0.split(',').map(Number);let n=0;
 for(const [k,f] of list){const [x,y]=k.split(',').map(Number);if(Math.abs(x-cx)<=1&&Math.abs(y-cy)<=1){f.c.a=J.CROPS[f.c.k].days-1;f.w=true;n++;}}return n;};
N.roll=function(s,rng){N.migrate(s);const n=s.nacht;if(n.night===s.day)return null;n.night=s.day;const notes=[];
 if(n.ev&&s.day>n.ev.day+N.METEOR_DAYS-1){n.ev=null;notes.push('Der Meteorit auf dem Hof ist über Nacht zu glitzerndem Sternenstaub zerfallen.');}
 const gap=s.day-(n.last||n.since);let k=null;
 if(!n.last&&!n.ev&&s.day-n.since>=2)k='meteor';
 else if(gap>=4&&rng()<.2){const opt=[];if(!n.ev)opt.push('meteor','meteor');if(unripe(s).length)opt.push('fee','fee');if(!n.eule)opt.push('eule');if(opt.length)k=opt[Math.min(opt.length-1,Math.floor(rng()*opt.length))];}
 if(k==='meteor'){n.ev={k:'meteor',day:s.day,hp:N.METEOR_HP};notes.push('Heute Nacht hat es auf dem Hof laut gekracht! Auf der Wiese liegt ein glühender Meteorit. Mit drei kräftigen Schlägen löst du ihn, bevor er in '+N.METEOR_DAYS+' Tagen zerfällt.');}
 if(k==='fee'){const c=N.fee(s,rng);if(c)notes.push('In der Nacht hat eine Mondfee über deinem Feld getanzt. '+(c===1?'Eine Pflanze ist':c+' Pflanzen sind')+' heute Morgen reif!');else k=null;}
 if(k==='eule'){n.eule={day:s.day,gift:0};notes.push('Auf dem Hof steht seit heute Nacht eine kleine Eule aus Stein. Niemand weiß, wer sie gebracht hat.');}
 if(k){n.last=s.day;n.log[k]++;}
 n.notes.push(...notes);return k;};
const night=X.night;X.night=function(s,info,rng,...rest){const out=night(s,info,rng,...rest);try{N.roll(s,rng||Math.random);}catch(e){console.warn('Nachtereignis',e);}return out;};
N.takeNotes=s=>{N.migrate(s);const a=s.nacht.notes.slice();s.nacht.notes=[];return a;};

/* ---------- Karte: freien Platz finden, Objekte setzen ---------- */
function open(m,s,x,y){const t=m.t[y]&&m.t[y][x];if(![T.GRAS,T.TUFF,T.BLUME].includes(t))return false;
 const f=s.field&&s.field[x+','+y];if(f&&(f.t||f.c||f.o))return false;if(m.obj.some(o=>x>=o.x-1&&x<o.x+(o.w||1)+1&&y>=o.y-1&&y<o.y+(o.h||1)+1))return false;
 if(m.exits.some(e=>Math.abs(e.x-x)<=2&&Math.abs(e.y-y)<=2))return false;if((m.trees||[]).some(q=>Math.abs(q.x-x)<=1&&Math.abs(q.y-y)<=1))return false;
 for(const g of [...((s.forage&&s.forage.farm)||[]),...(s.eggs||[]),...((s.mess||[]).filter(q=>q.map==='farm'))])if(g.x===x&&g.y===y)return false;
 // Freie Wiese: rundherum nur Gras, Wege oder Blumen – nie am Gewächshaus (GLAS), am Feld, an Zäunen oder am Wasser.
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const q=m.t[y+dy]&&m.t[y+dy][x+dx];if(q===T.GLAS||q===T.FELD)return false;if(Math.abs(dx)<=1&&Math.abs(dy)<=1&&![T.GRAS,T.TUFF,T.BLUME,T.WEG].includes(q))return false;}return true;}
function reach(m){const seen=new Set(),sp=m.spawn||[5,8],q=[sp];seen.add(sp+'');while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k)||!m.t[ny]||!J.WALK.has(m.t[ny][nx]))continue;seen.add(k);q.push([nx,ny]);}}return seen;}
N.spot=function(m,s,seed,avoid){const r=reach(m),c=[];for(let y=2;y<m.h-2;y++)for(let x=2;x<m.w-2;x++)if(r.has(x+','+y)&&open(m,s,x,y)&&!(avoid&&Math.abs(avoid.x-x)<=2&&Math.abs(avoid.y-y)<=2))c.push([x,y]);
 if(!c.length)return null;const [x,y]=c[Math.abs(seed*7919)%c.length];return {x,y};};
function clear(m){if(!m.nachtTiles)return;m.obj=m.obj.filter(o=>!o.nacht);for(const [k,t] of Object.entries(m.nachtTiles)){const [x,y]=k.split(',').map(Number);m.t[y][x]=t;}m.nachtTiles={};}
function put(m,o){m.nachtTiles=m.nachtTiles||{};m.obj.push({...o,nacht:true});const k=o.x+','+o.y;if(!(k in m.nachtTiles))m.nachtTiles[k]=m.t[o.y][o.x];m.t[o.y][o.x]=T.BLOCK;}
const fits=(m,s,o)=>o&&Number.isInteger(o.x)&&open(m,s,o.x,o.y);
N.apply=function(maps,s){const m=maps.farm;if(!m)return maps;clear(m);let sig='';
 if(s){N.migrate(s);const n=s.nacht;
  if(n.eule){if(!fits(m,s,n.eule)){const p=N.spot(m,s,n.eule.day+3);if(p)Object.assign(n.eule,p);}if(Number.isInteger(n.eule.x)&&open(m,s,n.eule.x,n.eule.y)){put(m,{k:'steineule',x:n.eule.x,y:n.eule.y,act:'nacht:eule'});sig+='e'+n.eule.x+','+n.eule.y;}}
  if(n.ev){if(!fits(m,s,n.ev)){const p=N.spot(m,s,n.ev.day,n.eule);if(p)Object.assign(n.ev,p);}if(Number.isInteger(n.ev.x)&&open(m,s,n.ev.x,n.ev.y)){put(m,{k:'meteorit'+n.ev.hp,x:n.ev.x,y:n.ev.y,act:'nacht:meteor',hp:n.ev.hp});sig+='m'+n.ev.x+','+n.ev.y+':'+n.ev.hp;}}}
 m.houseLevel=String(m.houseLevel||'').replace(/\|nacht:[^|]*$/,'')+'|nacht:'+sig;return maps;};
const ap=J.Stadt.apply;J.Stadt.apply=function(maps,s){ap(maps,s);return N.apply(maps,s);};

/* ---------- Aktionen ---------- */
const say=t=>({who:null,text:t});
N.act=function(s,a){N.migrate(s);const n=s.nacht;
 if(a==='meteor'){const e=n.ev;if(!e)return {note:'Nur noch ein bisschen Sternenstaub im Gras.'};
  if((s.energy||0)<N.HIT)return {note:'Du bist zu erschöpft für den schweren Stein. Iss etwas und versuch es dann noch einmal.'};
  s.energy-=N.HIT;e.hp--;
  if(e.hp>0)return {hud:true,refresh:true,sfx:'stone',note:e.hp===2?'Krach! Funken stieben. Der Meteorit hat einen ersten Riss.':'Noch ein Schlag, und er bricht auf!'};
  n.ev=null;s.inv.meteorit=(s.inv.meteorit||0)+1;s.inv.mondquarz=(s.inv.mondquarz||0)+2;s.inv.silber=(s.inv.silber||0)+2;n.log.geborgen=(n.log.geborgen||0)+1;
  return {refresh:true,banner:'Ein Stück vom Himmel!',sfx:'fanfare',lines:[say('Mit einem hellen Knacken bricht der Meteorit auf. Innen glitzert er wie der Nachthimmel.'),say('Du bekommst 1× Meteoritenstück, 2× Mondquarz und 2× Silber.'),{who:'player',text:'Elva würde sich über so ein Stück bestimmt riesig freuen.'}]};}
 if(a==='eule'){const e=n.eule;if(!e)return null;if(e.gift===s.day)return {note:'Die Steineule schaut dich mit runden Augen an. Morgen liegt bestimmt wieder etwas bei ihr.'};
  e.gift=s.day;const se=Math.floor(((s.day-1)%(J.DPS*4))/J.DPS),pool=(J.FORAGE&&J.FORAGE[se])||['pilz'],r=((s.day*31+7)%10),k=r===0?'amethyst':pool[s.day%pool.length];
  s.inv[k]=(s.inv[k]||0)+1;return {hud:true,sfx:'gift',note:'Neben der Steineule liegt etwas: 1× '+J.ITEMS[k].n+'.'};}
 return null;};
const ev=X.evAct;X.evAct=function(s,a){return String(a).startsWith('nacht:')?N.act(s,String(a).slice(6)):ev?ev(s,a):null;};

/* ---------- Wegweiser und Tagebuch ---------- */
N.target=function(s){const e=s&&s.nacht&&s.nacht.ev;if(!e||!Number.isInteger(e.x))return null;const left=e.day+N.METEOR_DAYS-s.day;
 return {map:'farm',x:e.x,y:e.y+1,t:'Ein Meteorit auf dem Hof',sub:'Noch '+e.hp+' Schläge · zerfällt '+(left<=1?'heute Nacht':'in '+left+' Tagen')};};
const t0=X.target;X.target=function(s){return t0(s)||N.target(s);};
N.diary=function(s,esc){N.migrate(s);const n=s.nacht,e=esc||String,L=n.log,row=(b,t)=>'<div class="row'+(b?'':' dim')+'"><div class="tx"><b>'+(b?'✓ ':'??? ')+e(t[0])+'</b><small>'+e(t[1])+'</small></div></div>';
 return '<h3>Nächtliche Überraschungen</h3><p class="sub">Manchmal passiert nachts etwas auf deinem Hof. Am Morgen steht es im Tagesrückblick.</p>'+
  (n.ev?'<div class="row"><div class="tx"><b>Jetzt: Meteorit auf dem Hof</b><small>Noch '+n.ev.hp+' Schläge · zerfällt nach '+N.METEOR_DAYS+' Tagen</small></div></div>':'')+
  row(L.meteor,['Meteorit','Schlägt nachts auf der Wiese ein. Drei Schläge lösen ihn. '+(L.geborgen||0)+' geborgen.'])+
  row(L.fee,['Mondfee','Lässt einen Fleck auf deinem Feld über Nacht reifen. Sie kommt nur, wenn dort gerade etwas wächst.'])+
  row(L.eule,['Steineule','Bleibt auf dem Hof und legt jeden Tag einen kleinen Fund neben sich.']);};
})();
