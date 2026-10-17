"use strict";
/* Etappe 3 – Eigenes Café (W13–W17). Nur Logik und Zustand (s.cafe), kein DOM.
   Ort: Das alte Teehaus am Dorfrand (Dorf, links vom Dorfplatz) wird renoviert. Der Samstagsstand bleibt, wie er ist:
   dort verkauft Janina direkt, im Café bewirtet sie Gäste an Tischen. Andere Ausrichtungen (Bäckerei, Blumenladen)
   gibt es bewusst nicht als Auswahl (W14: erst das Café vollständig).

   W13 Café       Brief von Rosa → Renovierung (1500 G, 20 Holz, 10 Stein, zwei Nächte) → Café mit Innenraum.
   W15 Angebot    Waren aus dem Rucksack in die Kuchenvitrine stellen (echte Vorräte). Verkauf nimmt sie aus der Vitrine.
                  Öffnungszeit für heute wählen: 9–13 oder 14–18 Uhr. Gäste kommen nacheinander und setzen sich an Tische.
                  Bedienen: Gast antippen. Geld kommt sofort, genau einmal pro Gast. Am Morgen danach kommt die Tagesabrechnung.
   Preise         Café-Preis = Verkaufspreis × 1,3; Lieblingsgericht +30 % Trinkgeld, gemochtes +15 %. Höchstens × 1,69 und damit
                  immer unter dem Einkauf bei Lin (mindestens × 2) und Mei (Wintervorrat × 2): kein Gewinn durch Weiterverkauf.
   W16 Freischaltungen  Nach 3, 6 und 10 bewirteten Gästen: Blumen und Lichterkette, ein dritter Tisch (ein Gast mehr),
                  das Rezept Mondkuchen. Jede Stufe verändert den Raum oder das Angebot sichtbar.
   W17 Bestellungen  Bewohner wünschen sich Gerichte aus ihren Vorlieben. Nur, was du kochen oder ernten kannst
                  (Rezept bekannt, Zutaten jetzt erreichbar). Frist drei Tage. Abgabe an der Theke, Lohn genau einmal. */
(function(){
const J=window.JM,X=J.Post,St=J.Stadt,D=J.Dorf,T=J.T,C=J.Cafe={};
const cal=D.cal,say=D.say,fill=D.fill,letter=D.letter;
const met=(s,id)=>!!(s.npc&&s.npc[id]&&s.npc[id].met);
const has=(s,k,n)=>((s.inv&&s.inv[k])||0)>=(n||1);
const nm=id=>J.NPCS[id]?J.NPCS[id].n:id;
const hh=m=>Math.floor(m/60)+':'+String(m%60).padStart(2,'0');

J.ITEMS.mondkuchen={n:'Mondkuchen',cat:'dish',eat:50,sell:230};
J.RECIPES.push({k:'mondkuchen',need:{weizen:2,ei:1,milch:1},from:'Café'});

C.ROOM='i_cafe';
C.SITE={x:4,y:11,w:5,h:3,door:[6,14]};
C.COST={money:1500,holz:20,stein:10,days:2};
C.HOURS={frueh:{n:'9 bis 13 Uhr',from:540,to:780},spaet:{n:'14 bis 18 Uhr',from:840,to:1080}};
C.UNLOCKS=[{id:'blumen',need:3,n:'Blumen und Lichterkette',d:'Pflanzen in allen Ecken und eine warme Lichterkette über dem Raum.'},
 {id:'tisch3',need:6,n:'Ein dritter Tisch',d:'Ein Tisch mit zwei Stühlen mehr. Ab jetzt kommt ein Gast mehr pro Öffnung.'},
 {id:'kuchen',need:10,n:'Rezept: Mondkuchen',d:'2 Weizen, 1 Ei, 1 Milch. Kochst du am Herd und bekommt einen Ehrenplatz in der Vitrine.'}];
C.SEATS=[[2,6,'r'],[4,6,'l'],[9,6,'r'],[11,6,'l'],[6,7,'r'],[8,7,'l']];
C.POOL=['rosa','henk','paula','timo','mei','lin','elva','ida','noah','mara'];
C.TIP={love:.3,like:.15};
C.FACTOR=1.3;
C.ok=k=>{const it=J.ITEMS[k];if(!it||!it.sell)return false;return it.cat==='dish'||(!!it.eat&&['crop','animal','forage'].includes(it.cat));};
C.price=k=>Math.ceil(J.ITEMS[k].sell*C.FACTOR);
C.maxPrice=k=>{const p=C.price(k);return p+Math.ceil(p*C.TIP.love);};

/* ---------- Zustand und Migration ---------- */
C.migrate=function(s){let c=s.cafe;if(!c||typeof c!=='object'||Array.isArray(c))c=s.cafe={};c.v=1;
 if(!['','bau','fertig'].includes(c.st))c.st='';
 if(!c.vit||typeof c.vit!=='object'||Array.isArray(c.vit))c.vit={};
 for(const [k,n] of Object.entries(c.vit))if(!J.ITEMS[k]||!Number.isInteger(n)||n<=0)delete c.vit[k];
 if(!c.unlock||typeof c.unlock!=='object')c.unlock={};
 if(!Array.isArray(c.days))c.days=[];if(!Array.isArray(c.orders))c.orders=[];
 if(c.today&&(typeof c.today!=='object'||!C.HOURS[c.today.hours]||!Array.isArray(c.today.guests)))c.today=null;if(c.today===undefined)c.today=null;
 for(const k of ['served','earned','seq'])if(!Number.isFinite(c[k]))c[k]=0;
 if(!c.sent||typeof c.sent!=='object')c.sent={};
 return s;};
const mig=J.Ausbau.migrate;J.Ausbau.migrate=function(s){mig(s);C.migrate(s);return s;};

/* ---------- Renovierung (W13) ---------- */
C.canBuild=s=>{const c=C.COST;return s.cafe.st===''&&s.money>=c.money&&has(s,'holz',c.holz)&&has(s,'stein',c.stein);};
C.build=function(s){C.migrate(s);if(!C.canBuild(s))return false;const c=C.COST;s.money-=c.money;
 for(const k of ['holz','stein']){s.inv[k]-=c[k];if(!s.inv[k])delete s.inv[k];}s.cafe.st='bau';s.cafe.start=s.day;s.cafe.due=s.day+c.days;return true;};

/* ---------- Vitrine (W15) ---------- */
C.stock=function(s,k,n){C.migrate(s);if(s.cafe.st!=='fertig'||!C.ok(k)||!Number.isInteger(n)||n<1||!has(s,k,n))return false;
 s.inv[k]-=n;if(!s.inv[k])delete s.inv[k];s.cafe.vit[k]=(s.cafe.vit[k]||0)+n;return true;};
C.unstock=function(s,k,n){const v=s.cafe.vit;if(!Number.isInteger(n)||n<1||(v[k]||0)<n)return false;v[k]-=n;if(!v[k])delete v[k];s.inv[k]=(s.inv[k]||0)+n;return true;};
C.vitCount=s=>Object.values(s.cafe.vit).reduce((a,b)=>a+b,0);

/* ---------- Öffnen und Gäste ---------- */
C.todayOf=s=>{const t=s.cafe&&s.cafe.today;return t&&t.day===s.day?t:null;};
C.guestCount=s=>2+(s.cafe.unlock.tisch3?1:0);
C.pickGuests=function(s,h){const pool=C.POOL.filter(id=>J.NPCS[id]&&met(s,id));if(!pool.length)return [];const H=C.HOURS[h],n=Math.min(C.guestCount(s),pool.length),st=(s.day*3)%pool.length,out=[];
 for(let i=0;i<n;i++){const from=H.from+i*40;out.push({id:pool[(st+i)%pool.length],from,to:Math.min(H.to,from+150),seat:i,st:''});}return out;};
C.canOpen=(s,h)=>s.cafe.st==='fertig'&&!!C.HOURS[h]&&!C.todayOf(s)&&s.min<C.HOURS[h].from;
C.open=function(s,h){C.migrate(s);if(!C.canOpen(s,h))return false;s.cafe.today={day:s.day,hours:h,guests:C.pickGuests(s,h),sales:[]};return true;};
C.isOpen=s=>{const t=C.todayOf(s);if(!t)return false;const H=C.HOURS[t.hours];return s.min>=H.from&&s.min<H.to;};
C.guest=(s,id)=>{const t=C.todayOf(s);return t?t.guests.find(g=>g.id===id)||null:null;};
C.present=(s,id)=>{const g=C.guest(s,id);return g&&s.min>=g.from&&s.min<g.to?g:null;};
C.seatOf=(s,id)=>{const g=C.present(s,id);if(!g)return null;const q=C.SEATS[g.seat];return {x:q[0],y:q[1],face:q[2]};};
C.level=(s,id,k)=>{const N=J.NPCS[id];return N.love.includes(k)?'love':N.like.includes(k)?'like':'';};
C.wish=function(s,id){const N=J.NPCS[id],v=s.cafe.vit,av=k=>(v[k]||0)>0;
 const fav=N.love.concat(N.like).find(k=>C.ok(k)&&av(k));if(fav)return {k:fav,lv:C.level(s,id,fav)};
 const any=Object.keys(v).filter(av).sort((a,b)=>C.price(b)-C.price(a))[0];return any?{k:any,lv:''}:null;};
C.favText=id=>{const N=J.NPCS[id];const f=N.love.concat(N.like).filter(C.ok).slice(0,3).map(k=>J.ITEMS[k].n);return f.length?f.join(', '):'alles Frische';};
C.guestTalk=function(s,id){C.migrate(s);const g=C.present(s,id);if(!g)return null;
 if(g.st==='bedient')return {lines:[say(id,{love:'Genau mein Lieblingsessen. Dein Café ist ein Glück für das Dorf!',like:'Sehr lecker. Ich komme wieder.','':'Danke dir! Hier sitzt man richtig gemütlich.'}[g.lv||''])]};
 const w=C.wish(s,id);
 if(!w)return {lines:[say(id,'Die Vitrine ist ja leer! Am liebsten mag ich '+C.favText(id)+'. Ich warte noch ein bisschen.')]};
 const p=C.price(w.k),tip=Math.ceil(p*(C.TIP[w.lv]||0)),it=J.ITEMS[w.k].n;
 const ask=w.lv==='love'?'Oh! '+it+'! Das ist mein Lieblingsessen. Eins bitte!':w.lv==='like'?it+' klingt gut. Das nehme ich.':'Mein Lieblingsessen ist leider nicht da. Dann nehme ich '+it+'.';
 return {lines:[say(id,ask,[{t:'Servieren: '+it+' · '+p+' G'+(tip?' + Trinkgeld':''),fn:()=>C.serve(s,id)},{t:'Gleich',fn:()=>({note:nm(id)+' wartet am Tisch.'})}])]};};
C.serve=function(s,id){const g=C.present(s,id);if(!g||g.st==='bedient')return null;const w=C.wish(s,id);if(!w)return {note:'Die Vitrine ist leer.'};
 const v=s.cafe.vit;v[w.k]--;if(!v[w.k])delete v[w.k];const p=C.price(w.k),tip=Math.ceil(p*(C.TIP[w.lv]||0));
 s.money+=p+tip;if(s.stats)s.stats.earned=(s.stats.earned||0)+p+tip;Object.assign(g,{st:'bedient',k:w.k,p,tip,lv:w.lv});
 C.todayOf(s).sales.push({id,k:w.k,p,tip});s.cafe.served++;s.cafe.earned+=p+tip;D.addP(s,id,w.lv==='love'?30:15);
 const fresh=C.checkUnlocks(s);
 return {hud:true,refresh:fresh.length>0,sfx:'buy',banner:fresh.length?'Neu im Café: '+fresh.map(u=>u.n).join(', '):null,hearts:'npc:'+id,
  lines:[say(null,'Du servierst '+J.ITEMS[w.k].n+'. '+nm(id)+' zahlt '+p+' G'+(tip?' und gibt '+tip+' G Trinkgeld':'')+'.'),
   ...fresh.map(u=>say(null,'Freigeschaltet: '+u.n+'. '+u.d))]};};
C.checkUnlocks=function(s){const c=s.cafe,out=[];for(const u of C.UNLOCKS)if(c.served>=u.need&&!c.unlock[u.id]){c.unlock[u.id]=s.day;out.push(u);
  if(u.id==='kuchen'&&Array.isArray(s.recipes)&&!s.recipes.includes('mondkuchen'))s.recipes.push('mondkuchen');}return out;};
C.bilanz=function(t){const sales=t.sales||[];return {guests:t.guests.length,served:sales.length,umsatz:sales.reduce((a,x)=>a+x.p,0),tips:sales.reduce((a,x)=>a+x.tip,0),
 total:sales.reduce((a,x)=>a+x.p+x.tip,0),items:sales.reduce((o,x)=>(o[x.k]=(o[x.k]||0)+1,o),{}),missed:t.guests.filter(g=>g.st!=='bedient').map(g=>g.id)};};

/* ---------- Besondere Bestellungen (W17) ---------- */
C.reachable=function(s,k){const se=cal.se(s),glas=!!(s.flags&&s.flags.glas),it=J.ITEMS[k];if(!it)return false;
 if(k==='fisch'||(J.FISHKEYS||[]).includes(k))return true;
 if(it.cat==='crop')return glas||J.CROPS[k].se.includes(se)||Object.values(J.SHOPS).some(S0=>S0.stock.some(r=>r.k===k&&(!r.winter||se===3)));
 if(k==='ei')return (s.hens||[]).length>0;if(k==='milch')return (s.cows||[]).length>0;
 if(it.cat==='forage')return J.FORAGE[se].includes(k);
 return Object.values(J.SHOPS).some(S0=>S0.stock.some(r=>r.k===k));};
C.feasible=function(s,k){const it=J.ITEMS[k];if(!C.ok(k))return false;
 if(it.cat==='dish'){const r=J.RECIPES.find(x=>x.k===k);return !!r&&(s.recipes||[]).includes(k)&&Object.keys(r.need).every(i=>C.reachable(s,i));}
 return C.reachable(s,k);};
C.openOrder=s=>s.cafe.orders.find(o=>o.st==='offen')||null;
C.orderNight=function(s){const c=s.cafe;
 for(const o of c.orders)if(o.st==='offen'&&s.day>o.due){o.st='verpasst';}
 if(c.st!=='fertig'||C.openOrder(s)||s.day-(c.lastOrder||c.done||0)<2)return null;
 const pool=C.POOL.filter(id=>J.NPCS[id]&&met(s,id));if(!pool.length)return null;
 for(let i=0;i<pool.length;i++){const id=pool[(s.day+i)%pool.length],N=J.NPCS[id];
  const k=N.love.concat(N.like).find(x=>J.ITEMS[x]&&J.ITEMS[x].cat==='dish'&&C.feasible(s,x))||N.love.concat(N.like).find(x=>C.feasible(s,x));
  if(!k)continue;c.seq++;const o={id:c.seq,who:id,k,day:s.day,due:s.day+3,st:'offen',rew:Math.ceil(J.ITEMS[k].sell*1.5)};c.orders.push(o);c.lastOrder=s.day;
  if(c.orders.length>12)c.orders.shift();return o;}
 return null;};
C.deliver=function(s){const o=C.openOrder(s);if(!o||s.day>o.due||!has(s,o.k))return null;s.inv[o.k]--;if(!s.inv[o.k])delete s.inv[o.k];
 o.st='geliefert';o.got=s.day;s.money+=o.rew;if(s.stats)s.stats.earned=(s.stats.earned||0)+o.rew;D.addP(s,o.who,40);
 return {hud:true,sfx:'fanfare',banner:'Bestellung geliefert',lines:[say(o.who,'Du hast an meine Bestellung gedacht! '+J.ITEMS[o.k].n+', genau richtig.'),say(null,nm(o.who)+' bezahlt '+o.rew+' G und freut sich sehr.')]};};

/* ---------- Weltobjekte ---------- */
C.act=function(s,a){C.migrate(s);const c=s.cafe;
 if(a==='tuer'){if(c.st==='fertig')return {travel:{to:C.ROOM,tx:7,ty:8}};
  if(c.st==='bau')return {note:'Timo und seine Leute renovieren das Teehaus. Noch '+Math.max(0,c.due-s.day)+' Nächte.'};
  const k=C.COST;return {panel:{t:'Das alte Teehaus',p:['Die Fenster sind blind, die Tür klemmt. Drinnen stehen noch eine Theke und eine alte Kuchenvitrine.','Timo kann daraus ein kleines Café machen: '+k.money+' G, '+k.holz+' Bauholz und '+k.stein+' Stein. Bauzeit: '+k.days+' Nächte.','Du hast '+s.money+' G, '+((s.inv&&s.inv.holz)||0)+' Holz und '+((s.inv&&s.inv.stein)||0)+' Stein.'],
   buttons:[{a:'cafebau',t:'Café einrichten lassen',off:!C.canBuild(s),fn:()=>C.build(s)?{refresh:true,sfx:'buy',note:'Timo beginnt mit der Renovierung. In '+k.days+' Nächten ist dein Café fertig.'}:{note:'Nicht genug Geld oder Material.'}}]}};}
 if(a==='tafel'){const t=C.todayOf(s),v=Object.keys(c.vit);return {note:'Tafel: '+(t?'Heute geöffnet '+C.HOURS[t.hours].n+'. ':'Heute noch geschlossen. ')+(v.length?'Angebot: '+v.map(k=>J.ITEMS[k].n).join(', ')+'.':'Die Vitrine ist leer.')};}
 if(a==='pflanze')return {note:'Die Pflanze ist frisch gegossen. Das hat Mei heimlich gemacht.'};
 if(a==='tisch')return {note:'Ein runder Tisch mit Blümchen und Zuckerdose.'};
 return null;};
const evAct0=X.evAct;X.evAct=function(s,a){if(String(a).startsWith('cafe:'))return C.act(s,a.slice(5));return evAct0?evAct0(s,a):null;};
const talk0=X.evTalk;X.evTalk=function(s,id){return C.guestTalk(s,id)||(talk0?talk0(s,id):null);};

/* ---------- Wo sitzen die Gäste? ---------- */
const loc0=St.location;
St.location=function(s,id,festival){const r=loc0(s,id,festival);if(r||festival||!s||!s.cafe)return r;const q=C.seatOf(s,id);return q?{map:C.ROOM,x:q.x,y:q.y}:null;};

/* ---------- Nacht: Bau fertig, Abrechnung, Bestellungen ---------- */
D.NIGHT.push(function(s){C.migrate(s);const c=s.cafe;
 if(c.st==='bau'&&s.day>=c.due){c.st='fertig';c.done=s.day;}
 const t=c.today;if(t&&t.day<s.day&&!t.closed){t.closed=true;c.days.push({day:t.day,hours:t.hours,...C.bilanz(t)});if(c.days.length>14)c.days.shift();}
 C.orderNight(s);});
D.LETTERS.push(function(s){C.migrate(s);const c=s.cafe,out=[];
 if(c.st===''&&!c.sent.idee&&s.day>=2&&met(s,'rosa'))out.push({pr:2,make:()=>{c.sent.idee=s.day;return letter(s,{from:'rosa',kind:'cafe',t:'Das alte Teehaus',
  b:fill(s,'Liebe {name},\n\nam Dorfrand, links vom Dorfplatz, steht seit Jahren das alte Teehaus leer. Früher gab es dort den besten Kuchen weit und breit.\n\nDu baust so viel Gutes an und kochst so gern. Wie wäre es mit einem eigenen kleinen Café? Timo würde es herrichten. Schau es dir an, tipp einfach auf die Tür.\n\nHerzlich,\nRosa')});}});
 if(c.st==='fertig'&&c.done===s.day&&!c.sent.fertig)out.push({pr:0,must:true,make:()=>{c.sent.fertig=s.day;return letter(s,{from:'timo',kind:'cafe',t:'Dein Café ist fertig!',
  b:fill(s,'Hallo {name},\n\ndas Teehaus ist fertig. Neue Dielen, eine Theke, eine Kuchenvitrine und eine Tafel für das Tagesangebot.\n\nSo geht es los: An der Theke stellst du Waren in die Vitrine und wählst, wann du heute öffnest. Die Gäste setzen sich an die Tische. Tipp sie an, dann bedienst du sie.\n\nTimo')});}});
 const d=c.days[c.days.length-1];if(d&&d.day>=s.day-3&&!d.letter)out.push({pr:1,make:()=>{d.letter=s.day;
  const items=Object.entries(d.items).map(([k,n])=>'· '+n+'× '+J.ITEMS[k].n).join('\n');
  return letter(s,{from:'Café Mondlicht',kind:'cafe',t:'Tagesabrechnung vom Spieltag '+d.day,
   b:'Geöffnet: '+C.HOURS[d.hours].n+'\nGäste: '+d.guests+' · bedient: '+d.served+'\n\n'+(items||'Nichts verkauft.')+'\n\nUmsatz: '+d.umsatz+' G\nTrinkgeld: '+d.tips+' G\nZusammen: '+d.total+' G\n\nDas Geld ist schon beim Bedienen auf dein Konto gegangen. Dieser Brief ist nur deine Abrechnung.'+(d.missed.length?'\n\nOhne Bestellung gegangen: '+d.missed.map(nm).join(', ')+'.':'')});}});
 const o=c.orders.find(x=>x.st==='offen'&&!x.letter);if(o)out.push({pr:1,make:()=>{o.letter=s.day;return letter(s,{from:o.who,kind:'cafe',t:'Eine Bestellung für dein Café',
  b:fill(s,'Liebe {name},\n\nich hätte so gern '+J.ITEMS[o.k].n+' aus deinem Café. Kannst du es mir bis zum Spieltag '+o.due+' an der Theke zurücklegen?\n\nIch zahle '+o.rew+' G dafür.\n\n'+nm(o.who))});}});
 return out;});

/* ---------- Karten: Teehaus im Dorf, Innenraum ---------- */
function room(){const w=14,h=10,m={id:C.ROOM,w,h,t:[],obj:[],trees:[],lights:[],exits:[],decor:[],title:'Café Mondlicht'};
 for(let y=0;y<h;y++)m.t.push(new Array(w).fill(T.WAND));for(let y=3;y<=h-2;y++)for(let x=1;x<=w-2;x++)m.t[y][x]=T.BODEN;m.t[h-1][7]=T.BODEN;
 for(let y=6;y<=8;y++)for(let x=5;x<=8;x++)m.t[y][x]=T.TEPPICH;
 m.exits=[{x:7,y:h-1,to:'village',tx:C.SITE.door[0],ty:C.SITE.door[1]}];m.spawn=[7,h-2];m.inside=true;m.windows=[[3,1],[10,1]];
 m.pal={wall:'#f3e2c8',wall2:'#e4c9a2',trim:'#7a4a2e',floor:'#c99a64',floor2:'#b5844e',rug:'#5f8f6a',rug2:'#f4ead8'};return m;}
function place(m,o){m.obj.push(o);for(let y=o.y;y<o.y+(o.h||1);y++)for(let x=o.x;x<o.x+(o.w||1);x++){const k=x+','+y;if(!(k in m.cafeO))m.cafeO[k]=m.t[y][x];m.t[y][x]=T.BLOCK;}}
function clearC(m){if(!m)return;if(m.cafeO){m.obj=m.obj.filter(o=>!String(o.act||'').startsWith('post:ev:cafe:')&&o.act!=='cafe');for(const [k,v] of Object.entries(m.cafeO)){const [x,y]=k.split(',').map(Number);m.t[y][x]=v;}}m.cafeO={};m.decor=(m.decor||[]).filter(d=>!d.cafe);}
C.furnish=function(m,s){const c=s?s.cafe:{unlock:{},vit:{}},u=c.unlock||{};clearC(m);
 place(m,{k:'cafe_theke',x:2,y:3,w:3,h:1,act:'cafe'});place(m,{k:'vitrine',x:5,y:3,w:2,h:1,act:'cafe'});place(m,{k:'tafel',x:9,y:3,w:2,h:1,act:'post:ev:cafe:tafel'});
 place(m,{k:'cafepflanze',x:12,y:3,act:'post:ev:cafe:pflanze'});
 const tables=[[3,6],[10,6]].concat(u.tisch3?[[7,7]]:[]);
 for(const [x,y] of tables)place(m,{k:'cafetisch',x,y,act:'post:ev:cafe:tisch'});
 C.SEATS.slice(0,tables.length*2).forEach(([x,y,f])=>m.decor.push({k:'stuhl',x,y,face:f,cafe:true}));
 if(u.blumen){place(m,{k:'cafepflanze',x:1,y:8,act:'post:ev:cafe:pflanze'});place(m,{k:'cafepflanze',x:12,y:8,act:'post:ev:cafe:pflanze'});m.decor.push({k:'lichterkette',x:1,y:2,w:12,cafe:true});}
 m.vitSig=Object.keys(c.vit||{}).sort().join(',')+(u.kuchen?'|K':'');
 m.romSig='cafe:'+Object.keys(u).sort().join(',')+'|'+m.vitSig;
 return m;};
const apply0=X.apply;
X.apply=function(maps,s){apply0(maps,s);const v=maps.village;if(v){clearC(v);const st=s&&s.cafe?s.cafe.st:'',S0=C.SITE;
  place(v,{k:st==='fertig'?'cafe':st==='bau'?'teehaus_bau':'teehaus_alt',x:S0.x,y:S0.y,w:S0.w,h:S0.h,door:S0.door,room:C.ROOM,act:'post:ev:cafe:tuer'});
  if(st==='fertig'){v.decor.push({k:'kundenstopper',x:9,y:14,cafe:true},{k:'blumenkuebel',x:3,y:14,cafe:true});}
  v.romSig=(v.romSig||'')+'|C'+st;}
 if(maps[C.ROOM])C.furnish(maps[C.ROOM],s);return maps;};
const bm=J.buildMaps;J.buildMaps=function(){const all=bm();all[C.ROOM]=room();return X.apply(all,null);};

/* ---------- Wegweiser ---------- */
C.target=function(s){if(!s.cafe)return null;const c=s.cafe,door=C.SITE.door;
 if(c.st===''&&c.sent.idee&&c.sent.idee>=s.day-7)return {map:'village',x:door[0],y:door[1],t:'Das alte Teehaus',sub:'Ein Café? · '+C.COST.money+' G, '+C.COST.holz+' Holz, '+C.COST.stein+' Stein'};
 if(c.st!=='fertig')return null;
 const t=C.todayOf(s);if(t&&C.isOpen(s)&&t.guests.some(g=>g.st!=='bedient'&&s.min>=g.from&&s.min<g.to))return {map:C.ROOM,x:7,y:5,t:'Gäste im Café',sub:'Gäste antippen und bedienen · bis '+hh(C.HOURS[t.hours].to)+' Uhr'};
 const o=C.openOrder(s);if(o&&has(s,o.k))return {map:C.ROOM,x:3,y:4,t:'Bestellung von '+nm(o.who),sub:J.ITEMS[o.k].n+' an der Theke abgeben · bis Spieltag '+o.due};
 return null;};
const target0=X.target;X.target=function(s){return target0(s)||(s&&s.cafe?C.target(s):null);};
})();
