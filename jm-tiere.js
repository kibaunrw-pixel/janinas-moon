"use strict";
/* Etappe 3 – Tiere mit Persönlichkeit. Nur Logik und Zustand (s.tiere), kein DOM.
   Hängt sich wie jm-dorf.js/jm-romantik.js an: Migration, Nacht (D.NIGHT), Briefe (D.LETTERS),
   Kartenobjekte (X.apply), Weltobjekte (X.evAct 'tier:'), Wegweiser (X.target).
   Figuren (Katze, Ziege, Enten, Kätzchen) sind Darsteller wie Hühner: sie blockieren keine Kachel.

   W19 Katze      Minka kommt per Brief von Paula. Streicheln (einmal am Tag) und ein Fisch (einmal am Tag) geben Herzen.
                  Fundlogik: Ab 3 Herzen bringt sie am Morgen etwas vor die Haustür, wenn du sie am Vortag gestreichelt hast,
                  höchstens jeden zweiten Morgen. Was sie bringt, wächst gerade im Gras (Fundstück der Jahreszeit);
                  ab 6 Herzen ist jedes dritte Geschenk ein Karpfen aus dem Teich. Abholen geht genau einmal.
   W20 Hund       Ab 4 Herzen wittert ein Pudel alle drei Tage einen Schatz. Antippen → „Der Spur folgen“ → Pfotenspur zur
                  Grabstelle → Graben. Vier feste Verstecke, jedes belohnt genau einmal.
   W18 Ziege      Flocke (bei Paula) nascht jeden zweiten Tag zwischen 9 und 11 Uhr eine reife Pflanze am Ostrand des Feldes.
                  Höchstens eine Pflanze, nur reife, nie im Gewächshaus. Gegenmaßnahmen: morgens Heu (Tierfutter) geben,
                  sie beim Naschen wegschicken, oder dauerhaft ein Leckstein auf der Weide.
   W21 Teich      Ententeich bauen (600 G, 12 Stein, eine Nacht). Der Hof bekommt echtes Wasser, Entenhaus und Futterstelle.
                  Enten schwimmen darin, brauchen täglich Futter, legen dann Enteneier.
   W22 Zucht      Jede Ente trägt zwei Farbanlagen (A Wildfarben, w Weiß, g Sonnengelb). Küken erben je eine Anlage von
                  Mutter und Vater. A vor w vor g; Sonnengelb nur bei gg. Eltern, Küken und Anlagen werden gespeichert.
   W23 Rettung    Henk schreibt von einem Korb am Fluss. Kätzchen finden → drei Tage pflegen (Milch, Ei oder Fisch, einmal
                  am Tag) → Adoption auf den Hof oder Vermittlung zu Mei. Abschluss genau einmal. */
(function(){
const J=window.JM,X=J.Post,D=J.Dorf,T=J.T,Ti=J.Tiere={};
const cal=D.cal,say=D.say,fill=D.fill,letter=D.letter;
const num=(v,d)=>Number.isFinite(v)?v:d;
const dogName=(s,i)=>(s.dogs&&s.dogs[i]&&s.dogs[i].name)||('Pudel '+(i+1));
const has=(s,k,n)=>((s.inv&&s.inv[k])||0)>=(n||1);
function take(s,k,n){s.inv[k]=(s.inv[k]||0)-(n||1);if(s.inv[k]<=0)delete s.inv[k];}
const FISH=()=>J.FISHKEYS||['forelle','karpfen','barsch','wels','goldfisch','koi'];

/* ---------- Gegenstände und Laden ---------- */
J.ITEMS.entenei={n:'Entenei',cat:'animal',sell:60,eat:12};
J.ITEMS.leckstein={n:'Leckstein',cat:'misc'};
J.SHOPS.tierhof.stock.push({k:'tier_ziege',p:800,d:'Flocke, eine neugierige Ziege für deine Weide',once:true},{k:'leckstein',p:250,d:'Für die Weide. Danach nascht deine Ziege nicht mehr am Feld',once:true});
Ti.hide=(s,k)=>k==='leckstein'&&!(s.tiere&&s.tiere.ziege.st==='da');
Ti.buy=function(s,k){Ti.migrate(s);const t=s.tiere;
 if(k==='tier_ziege'){if(t.ziege.st)return null;t.ziege.st='da';t.ziege.since=s.day;return 'Flocke zieht auf die Weide. Sie ist neugierig und ein bisschen frech.';}
 if(k==='leckstein'){if(t.ziege.st!=='da'||t.ziege.lecks)return null;t.ziege.lecks=s.day;if(t.ziege.steal&&t.ziege.steal.st==='plan')t.ziege.steal.st='satt';return 'Der Leckstein steht jetzt auf der Weide. Flocke leckt begeistert daran und vergisst dein Feld.';}
 return null;};

/* ---------- Orte ---------- */
Ti.CAT={door:[5,9],sun:[7,9],rain:[3,9],walk:[[4,9],[8,9],[10,7],[6,9]]};
Ti.SPOTS=[{id:'weide',map:'farm',x:25,y:18,n:'hinter der Weide am Hofrand',from:[3,9],rew:{money:120,items:{amethyst:1}},txt:'eine alte Blechdose mit 120 G und einem Amethyst'},
 {id:'holunder',map:'farm',x:3,y:24,n:'unter dem Holunder im Südwesten',from:[3,9],rew:{items:{mondquarz:1,kupfer:2}},txt:'einen Mondquarz und zwei Kupfererz in einem Lederbeutel'},
 {id:'westufer',map:'forest',x:7,y:16,n:'am Westufer im Mondwald',from:[13,2],rew:{money:200},txt:'einen Topf mit 200 G in alten Münzen'},
 {id:'hirschweg',map:'forest',x:22,y:7,n:'am alten Hirschweg im Mondwald',from:[13,2],rew:{items:{mondstein:1}},txt:'einen schimmernden Mondstein'}];
Ti.GOAT={pasture:[[22,9],[23,11],[21,10],[23,9]],gate:[22,13],lick:{x:21,y:8},from:540,eat:660,back:720,col:11};
Ti.POND={x:7,y:25,w:4,h:3,sign:{x:12,y:27},house:{x:11,y:27},feed:{x:12,y:26},bank:[11,25],eggs:[[11,28],[12,28]],cost:{money:600,stein:12,days:1}};
Ti.RESCUE={korb:{map:'forest',x:10,y:14},home:{x:12,y:20},need:3,foods:['milch','ei']};
Ti.GENE={A:'Wildfarben',w:'Weiß',g:'Sonnengelb'};
Ti.pheno=g=>g.includes('A')?'wild':g.includes('w')?'weiss':'gold';
Ti.PHN={wild:'Wildfarben',weiss:'Weiß',gold:'Sonnengelb (selten)'};
const KIDS=['Kiki','Wuschel','Sunny','Mo','Lotta','Pieps','Nala','Fips'];

/* ---------- Zustand und Migration ---------- */
Ti.migrate=function(s){let t=s.tiere;if(!t||typeof t!=='object'||Array.isArray(t))t=s.tiere={};t.v=1;
 const obj=(k,d)=>{const o=t[k];if(!o||typeof o!=='object'||Array.isArray(o)){t[k]=d;return d;}for(const [a,b] of Object.entries(d))if(o[a]===undefined)o[a]=b;return o;};
 const k=obj('katze',{st:'',n:'Minka',h:0,pet:0,fed:0,gift:0,gifts:0});k.h=Math.max(0,Math.min(10,num(k.h,0)));
 const h=obj('hund',{st:'',n:0,last:0,found:[]});if(!Array.isArray(h.found))h.found=[];
 obj('ziege',{st:'',n:'Flocke',h:0,pet:0,fed:0,since:0,stolen:0,foiled:0,steal:null,lecks:0});
 obj('teich',{st:''});if(!Array.isArray(t.enten))t.enten=t.enten&&typeof t.enten==='object'?[]:[];
 t.enten=t.enten.filter(e=>e&&typeof e==='object'&&Array.isArray(e.g)&&e.g.length===2);
 obj('futterE',{day:0,n:0});obj('rettung',{st:'',care:[]});if(!Array.isArray(t.rettung.care))t.rettung.care=[];
 obj('sent',{});if(!Array.isArray(t.log))t.log=[];
 return s;};
const mig=J.Ausbau.migrate;J.Ausbau.migrate=function(s){mig(s);Ti.migrate(s);return s;};
const logT=(s,txt)=>{s.tiere.log.push({day:s.day,t:txt});if(s.tiere.log.length>30)s.tiere.log.shift();};

/* ---------- W19 Katze ---------- */
Ti.catGiftItem=function(s){const c=s.tiere.katze,se=cal.se(s);if(c.h>=6&&c.gifts%3===2)return 'karpfen';const pool=J.FORAGE[se];return pool[c.gifts%pool.length];};
Ti.catNight=function(s){const c=s.tiere.katze;if(c.st!=='da')return null;
 if(c.h<3||c.pet!==s.day-1||s.day-c.gift<2)return null;
 const k=Ti.catGiftItem(s);c.gift=s.day;c.gifts++;c.lastK=k;
 s.forage=s.forage||{};const f=(s.forage.farm||[]).filter(o=>!(o.x===Ti.CAT.door[0]&&o.y===Ti.CAT.door[1]));
 f.push({k,x:Ti.CAT.door[0],y:Ti.CAT.door[1],katze:true});s.forage.farm=f;logT(s,c.n+' hat dir '+J.ITEMS[k].n+' vor die Tür gelegt.');return k;};
Ti.catAct=function(s,hold){const c=s.tiere.katze,day=s.day,n=c.n;
 const fish=FISH().includes(hold)&&has(s,hold);
 const pet=()=>{if(c.pet===day)return {note:n+' schnurrt und reibt den Kopf an deiner Hand.'};c.pet=day;c.h=Math.min(10,c.h+1);
  return {hud:true,sfx:'gift',hearts:'pet:katze',note:n+' schnurrt laut. '+(c.h>=3?'Morgen früh liegt vielleicht ein Geschenk vor der Tür.':'Noch '+(3-c.h)+' Herzen, dann bringt sie dir Geschenke.')};};
 if(fish&&c.fed!==day)return {lines:[say(null,n+' schnuppert an deinem '+J.ITEMS[hold].n+'.',[{t:'Den Fisch geben',fn:()=>Ti.catFeed(s,hold)},{t:'Streicheln',fn:pet}])]};
 return pet();};
Ti.catFeed=function(s,k){const c=s.tiere.katze;if(c.fed===s.day||!FISH().includes(k)||!has(s,k))return {note:c.n+' hat heute schon gefressen.'};
 take(s,k,1);c.fed=s.day;c.h=Math.min(10,c.h+1);return {hud:true,sfx:'gift',hearts:'pet:katze',note:c.n+' frisst den Fisch und schnurrt. Herzen: '+c.h+' von 10.'};};

/* ---------- W20 Hund findet Schätze ---------- */
Ti.spot=s=>Ti.SPOTS.find(p=>p.id===s.tiere.hund.spot)||null;
Ti.dogNight=function(s){const h=s.tiere.hund;if(h.st)return;const dh=s.dogH||[0,0];
 const i=(dh[0]||0)>=(dh[1]||0)?0:1;if((dh[i]||0)<4||s.day-h.last<3)return;
 const next=Ti.SPOTS.find(p=>!h.found.includes(p.id));if(!next)return;h.st='spur';h.dog=i;h.spot=next.id;h.day=s.day;};
Ti.dogHint=(s,i)=>{Ti.migrate(s);const h=s.tiere.hund;return h.st==='spur'&&h.dog===i;};
Ti.follow=function(s,i){const h=s.tiere.hund;if(h.st!=='spur'||h.dog!==i)return null;const p=Ti.spot(s);h.st='folgen';h.since=s.day;
 return {refresh:true,sfx:'bark',lines:[say('dog'+i,dogName(s,i)+' schnüffelt aufgeregt, bellt einmal und läuft los.'),say(null,'Im Gras sind frische Pfotenabdrücke zu sehen. Die Spur führt '+p.n+'.'),say(null,'Folge den Pfoten. Dort, wo sie enden, kannst du graben.')]};};
Ti.dig=function(s){const h=s.tiere.hund,p=Ti.spot(s);if(h.st!=='folgen'||!p||h.found.includes(p.id))return {note:'Hier hat schon jemand gegraben.'};
 D.give(s,p.rew);h.found.push(p.id);h.n++;h.last=s.day;h.st='';const i=h.dog;if(s.dogH)s.dogH[i]=Math.min(10,(s.dogH[i]||0)+1);
 logT(s,dogName(s,i)+' hat '+p.txt+' gefunden.');
 return {refresh:true,banner:'Schatz gefunden!',sfx:'fanfare',lines:[say(null,'Du gräbst, wo die Pfotenspur endet. Die Erde ist ganz locker.'),say(null,'Du findest '+p.txt+'!'),say('dog'+i,dogName(s,i)+' wedelt stolz mit dem Schwanz.')]};};

/* ---------- W18 Freche Ziege ---------- */
const ripe=f=>f&&f.c&&J.CROPS[f.c.k]&&f.c.a>=J.CROPS[f.c.k].days;
Ti.goatTarget=function(s){const xs=Ti.GOAT.col;let best=null;for(let y=10;y<=19;y++){const f=s.field&&s.field[xs+','+y];if(ripe(f)&&!f.c.g){best={x:xs,y,k:f.c.k};break;}}return best;};
Ti.goatNight=function(s){const z=s.tiere.ziege;if(z.st!=='da')return;
 if(z.steal&&z.steal.st==='plan'&&z.steal.day<s.day)z.steal.st='verpasst';
 if(z.lecks||s.day-z.since<1||s.day%2||s.weather==='rain'||s.weather==='snow')return;
 const t=Ti.goatTarget(s);if(!t)return;z.steal={day:s.day,x:t.x,y:t.y,k:t.k,st:'plan'};};
Ti.goatActive=s=>{const z=s.tiere&&s.tiere.ziege,st=z&&z.steal;return st&&st.day===s.day&&st.st==='plan'&&s.min>=Ti.GOAT.from&&s.min<Ti.GOAT.eat?st:null;};
/* Uhr läuft: um 11 Uhr frisst Flocke die Pflanze, falls niemand sie abgehalten hat. Genau einmal (st wechselt). */
Ti.tick=function(s){Ti.migrate(s);const z=s.tiere.ziege,st=z.steal;if(!st||st.st!=='plan'||st.day!==s.day||s.min<Ti.GOAT.eat)return null;
 const f=s.field&&s.field[st.x+','+st.y];st.st='gefressen';
 if(!ripe(f)){st.st='verpasst';return null;}
 const cr=J.CROPS[f.c.k];if(cr.re)f.c.a=Math.max(0,cr.days-cr.re);else f.c=null;z.stolen++;
 logT(s,z.n+' hat eine '+J.ITEMS[st.k].n+' vom Feld genascht.');
 return {note:z.n+' hat eine '+J.ITEMS[st.k].n+' vom Feldrand stibitzt! Morgens Heu oder ein Leckstein helfen.',refresh:true};};
Ti.goatAct=function(s,hold){const z=s.tiere.ziege,n=z.n,act=Ti.goatActive(s),out=[];
 const feed={t:'Heu geben (1 Tierfutter)',fn:()=>Ti.goatFeed(s)},shoo={t:'„'+n+', zurück auf die Weide!“',fn:()=>Ti.goatShoo(s)},
  pet={t:'Streicheln',fn:()=>Ti.goatPet(s)};
 if(act){const ch=[shoo];if(has(s,'futter')&&z.fed!==s.day)ch.unshift(feed);
  return {lines:[say(null,n+' steht am Feldrand und kaut genüsslich. Im Maul hängt schon ein Blatt '+J.ITEMS[act.k].n+'.',ch)]};}
 const ch=[pet];if(has(s,'futter')&&z.fed!==s.day)ch.push(feed);
 return {lines:[say(null,n+' meckert und knabbert an deinem Ärmel.',ch)]};};
Ti.goatFeed=function(s){const z=s.tiere.ziege;if(z.fed===s.day||!has(s,'futter'))return {note:z.n+' ist schon satt.'};take(s,'futter',1);z.fed=s.day;
 if(z.steal&&z.steal.day===s.day&&z.steal.st==='plan')z.steal.st='satt';z.h=Math.min(10,z.h+(z.pet===s.day?0:1));z.pet=s.day;
 return {hud:true,sfx:'gift',hearts:'pet:ziege',note:z.n+' frisst zufrieden ihr Heu. Heute bleibt sie auf der Weide.'};};
Ti.goatShoo=function(s){const z=s.tiere.ziege,st=Ti.goatActive(s);if(!st)return {note:z.n+' ist doch auf der Weide.'};st.st='verhindert';z.foiled++;
 return {sfx:'bad',note:z.n+' meckert beleidigt und trottet zurück auf die Weide. Die Pflanze ist gerettet.'};};
Ti.goatPet=function(s){const z=s.tiere.ziege;if(z.pet===s.day)return {note:z.n+' stupst dich mit der Nase an.'};z.pet=s.day;z.h=Math.min(10,z.h+1);return {hud:true,sfx:'gift',hearts:'pet:ziege',note:z.n+' meckert fröhlich.'};};

/* ---------- W21 Ententeich, W22 Zucht ---------- */
Ti.canPond=s=>{const c=Ti.POND.cost;return s.tiere.teich.st===''&&s.money>=c.money&&has(s,'stein',c.stein);};
Ti.buildPond=function(s){Ti.migrate(s);const c=Ti.POND.cost;if(!Ti.canPond(s))return false;s.money-=c.money;take(s,'stein',c.stein);
 s.tiere.teich={st:'bau',start:s.day,due:s.day+c.days};return true;};
Ti.pondNight=function(s){const p=s.tiere.teich;if(p.st==='bau'&&s.day>=p.due){p.st='fertig';p.done=s.day;
  if(!s.tiere.enten.length)s.tiere.enten.push({n:'Ede',sex:'m',g:['A','g'],c:'wild',h:0,pet:0,hungry:0,born:0},{n:'Emma',sex:'w',g:['w','g'],c:'weiss',h:0,pet:0,hungry:0,born:0});
  logT(s,'Der Ententeich ist fertig. Ede und Emma ziehen ein.');}
 if(p.st!=='fertig')return;
 const fE=s.tiere.futterE,fedN=fE.day===s.day-1?fE.n:0;
 s.tiere.enten.forEach((e,i)=>{if(i<fedN){e.hungry=0;}else{e.hungry=(e.hungry||0)+1;if(e.hungry>=2)e.h=Math.max(0,e.h-1);}});
 // Eier: gefütterte Enten (weiblich, älter als 3 Tage) legen eins ans Ufer
 const eggs=Ti.POND.eggs.slice();s.forage=s.forage||{};const f=s.forage.farm||(s.forage.farm=[]);
 s.tiere.enten.forEach((e,i)=>{if(e.sex==='w'&&i<fedN&&s.day-(e.born||0)>3&&eggs.length){const [x,y]=eggs.shift();if(!f.some(o=>o.x===x&&o.y===y))f.push({k:'entenei',x,y,ente:e.n});}});
 Ti.breed(s,fedN);};
/* Zucht: alle vier Tage, wenn ein gefütterter Erpel und eine gefütterte Ente je mindestens 3 Herzen haben (höchstens 8 Enten). */
Ti.hash=(a,b)=>((a*2654435761)^(b*40503))>>>0;
Ti.breed=function(s,fedN){const E=s.tiere.enten,p=s.tiere.teich;if(E.length>=8||s.day-(p.hatch||p.done||0)<4)return null;
 const fed=E.filter((e,i)=>i<fedN&&e.h>=3&&s.day-(e.born||0)>3),m=fed.find(e=>e.sex==='m'),w=fed.find(e=>e.sex==='w');if(!m||!w)return null;
 const r=Ti.hash(s.day,E.length),g=[w.g[r&1],m.g[(r>>1)&1]],c=Ti.pheno(g),n=KIDS.find(x=>!E.some(e=>e.n===x))||('Küken '+(E.length+1));
 const kid={n,sex:(r>>2)&1?'w':'m',g,c,h:0,pet:0,hungry:0,born:s.day,mother:w.n,father:m.n};E.push(kid);p.hatch=s.day;
 logT(s,'Küken '+n+' ist geschlüpft: '+Ti.PHN[c]+' (Eltern '+w.n+' und '+m.n+').');s.tiere.newKid=kid.n;return kid;};
Ti.feedDucks=function(s){const p=s.tiere.teich,E=s.tiere.enten;if(p.st!=='fertig'||!E.length)return {note:'Hier gibt es noch keine Enten.'};
 const fE=s.tiere.futterE;if(fE.day!==s.day){fE.day=s.day;fE.n=0;}const need=E.length-fE.n;if(need<=0)return {note:'Die Futterstelle ist voll. Alle Enten haben heute zu fressen.'};
 const n=Math.min(need,(s.inv&&s.inv.futter)||0);if(!n)return {note:'Kein Tierfutter mehr. Paula im Dorf verkauft welches.'};take(s,'futter',n);fE.n+=n;
 return {hud:true,sfx:'plant',note:'Futterstelle aufgefüllt ('+fE.n+'/'+E.length+'). Die Enten schnattern los.'};};
Ti.duckAct=function(s,i){const e=s.tiere.enten[i];if(!e)return null;const fE=s.tiere.futterE,fed=fE.day===s.day&&i<fE.n;
 if(!fed)return {note:e.n+' schnattert hungrig. Die Futterstelle am Teich ist leer.'};
 if(e.pet===s.day)return {note:e.n+' paddelt fröhlich im Kreis.'};e.pet=s.day;e.h=Math.min(10,e.h+1);
 return {hud:true,sfx:'gift',hearts:'pet:ente'+i,note:e.n+' quakt zufrieden. '+(e.mother?'Eltern: '+e.mother+' und '+e.father+'. ':'')+'Farbe: '+Ti.PHN[e.c]+'.'};};

/* ---------- W23 Tierrettung ---------- */
Ti.rescueFind=function(s){const r=s.tiere.rettung;if(r.st!=='suchen')return {note:'Ein leerer Weidenkorb.'};r.st='pflege';r.found=s.day;r.care=[];
 logT(s,'Ein Kätzchen im Korb am Fluss gefunden.');
 return {refresh:true,banner:'Ein Kätzchen!',sfx:'gift',lines:[say(null,'Im Weidenkorb am Ufer sitzt ein winziges, nasses Kätzchen. Es zittert und piepst.'),say('player','Du armes Ding. Komm, ich nehm dich mit nach Hause.'),
  say(null,'Das Kätzchen schläft jetzt in einem warmen Korb neben deinem Feld. Gib ihm drei Tage lang einmal am Tag Milch, ein Ei oder einen Fisch.')]};};
Ti.foodFor=s=>Ti.RESCUE.foods.concat(FISH()).find(k=>has(s,k))||null;
Ti.careAct=function(s){const r=s.tiere.rettung,need=Ti.RESCUE.need;if(r.st!=='pflege')return null;
 if(r.care.length>=need&&!r.care.includes(s.day))return {lines:[say(null,'Das Kätzchen ist kräftig geworden. Es tobt im Korb und will raus. Wie soll es weitergehen?',[
  {t:'Es bleibt bei uns auf dem Hof',fn:()=>Ti.rescueEnd(s,'adopt')},{t:'Mei sucht ein Kätzchen. Ein Zuhause bei ihr',fn:()=>Ti.rescueEnd(s,'mei')}])]};
 if(r.care.includes(s.day))return {note:'Das Kätzchen schläft satt und zufrieden. Morgen braucht es wieder etwas. ('+r.care.length+' von '+need+' Tagen)'};
 const k=Ti.foodFor(s);if(!k)return {note:'Das Kätzchen piepst hungrig. Es braucht Milch, ein Ei oder einen Fisch.'};
 take(s,k,1);r.care.push(s.day);
 return {hud:true,sfx:'gift',lines:[say(null,'Du gibst dem Kätzchen '+J.ITEMS[k].n+'. Es frisst ganz gierig und schnurrt danach leise.'),say(null,'Pflegetag '+r.care.length+' von '+need+'.'+(r.care.length>=need?' Morgen ist es bereit für ein richtiges Zuhause.':''))]};};
Ti.rescueEnd=function(s,how){const r=s.tiere.rettung;if(r.st!=='pflege'||r.care.length<Ti.RESCUE.need||r.care.includes(s.day))return null;
 if(how==='adopt'){r.st='adoptiert';r.n='Pip';r.h=0;r.pet=0;r.end=s.day;logT(s,'Pip bleibt für immer auf dem Mondhof.');
  return {refresh:true,banner:'Pip bleibt!',sfx:'fanfare',lines:[say(null,'Das Kätzchen springt aus dem Korb und rollt sich neben dir zusammen.'),say('player','Dann heißt du ab heute Pip. Willkommen zu Hause.'),say(null,'Pip wohnt jetzt auf dem Hof.'+(s.tiere.katze.st==='da'?' '+s.tiere.katze.n+' beäugt den Neuen skeptisch.':''))]};}
 if(how==='mei'){r.st='vermittelt';r.to='mei';r.n='Pip';r.end=s.day;if(s.npc&&s.npc.mei)s.npc.mei.p=Math.min(1000,(s.npc.mei.p||0)+60);logT(s,'Pip hat bei Mei ein Zuhause gefunden.');
  return {refresh:true,banner:'Ein Zuhause für Pip',sfx:'fanfare',lines:[say(null,'Du bringst das Kätzchen zu Mei. Sie nimmt es behutsam in beide Hände.'),say('mei','Oh! Ist das süß. Ich nenne sie Pip. Sie darf im Laden auf der Fensterbank schlafen.'),say(null,'Pip wohnt jetzt bei Mei am Markt. Mei mag dich ein ganzes Stück mehr.')]};}
 return null;};

/* ---------- Weltobjekte ---------- */
Ti.act=function(s,a){Ti.migrate(s);
 if(a==='graben')return Ti.dig(s);
 if(a==='teichschild'){const p=s.tiere.teich,c=Ti.POND.cost;if(p.st==='bau')return {note:'Timo hebt hier den Ententeich aus. Morgen früh ist er fertig.'};
  return {panel:{t:'Ein Ententeich',p:['Hier ist Platz für einen kleinen Teich mit Entenhaus. Timo hebt ihn über Nacht aus.','Kosten: '+c.money+' G und '+c.stein+' Stein. Du hast '+s.money+' G und '+((s.inv&&s.inv.stein)||0)+' Stein.','Danach ziehen zwei Enten von Paula ein. Sie brauchen jeden Tag Futter.'],
   buttons:[{a:'teich',t:'Teich bauen lassen',off:!Ti.canPond(s),fn:()=>Ti.buildPond(s)?{refresh:true,sfx:'buy',note:'Timo beginnt mit dem Ententeich. Morgen früh ist er fertig.'}:{note:'Nicht genug Geld oder Stein.'}}]}};}
 if(a==='futterstelle')return Ti.feedDucks(s);
 if(a==='entenhaus'){const E=s.tiere.enten;return {note:'Das Entenhaus. Hier wohnen '+E.map(e=>e.n).join(', ')+'.'+(s.tiere.teich.hatch===s.day?' Im Nest piepst ein Küken!':'')};}
 if(a==='leckstein')return {note:'Der Leckstein. Seitdem bleibt '+s.tiere.ziege.n+' auf der Weide.'};
 if(a==='korb_wald')return Ti.rescueFind(s);
 if(a==='pflegekorb')return Ti.careAct(s)||{note:'Ein leerer Korb.'};
 return null;};
Ti.petAct=function(s,id,hold){Ti.migrate(s);const t=s.tiere;
 if(id==='katze'&&t.katze.st==='da')return Ti.catAct(s,hold);
 if(id==='ziege'&&t.ziege.st==='da')return Ti.goatAct(s,hold);
 if(id.startsWith('ente'))return Ti.duckAct(s,+id.slice(4));
 if(id==='pip'){const r=t.rettung;if(r.st==='vermittelt')return {note:'Pip schläft auf Meis Fensterbank und blinzelt dich an.'};if(r.pet===s.day)return {note:'Pip jagt einem Grashalm hinterher.'};r.pet=s.day;r.h=Math.min(10,(r.h||0)+1);return {hud:true,sfx:'gift',hearts:'pet:pip',note:'Pip schnurrt wie ein kleiner Motor.'};}
 return null;};
const evAct0=X.evAct;X.evAct=function(s,a){if(String(a).startsWith('tier:'))return Ti.act(s,a.slice(5));return evAct0?evAct0(s,a):null;};

/* ---------- Nacht und Briefe ---------- */
D.NIGHT.push(function(s){Ti.migrate(s);Ti.catNight(s);Ti.dogNight(s);Ti.goatNight(s);Ti.pondNight(s);});
D.LETTERS.push(function(s){Ti.migrate(s);const t=s.tiere,out=[];
 if(t.katze.st===''&&s.day>=3)out.push({pr:1,make:()=>{t.katze.st='da';t.katze.since=s.day;return letter(s,{from:'paula',kind:'tier',t:'Eine Katze für den Mondhof',
  b:fill(s,'Hey {name}!\n\nSeit ein paar Tagen schleicht eine graue Katze um meinen Hof. Bei uns heißt sie Minka. Sie mag mich, aber meine Hühner mag sie zu sehr.\n\nHeute Morgen saß sie vor deiner Haustür. Ich glaube, sie hat sich dich ausgesucht. Streichel sie jeden Tag, dann bringt sie dir bestimmt auch mal was mit.\n\nPaula')});}});
 const z=t.ziege;if(z.st==='da'&&z.stolen>0&&!t.sent.ziegeTipp)out.push({pr:1,make:()=>{t.sent.ziegeTipp=s.day;return letter(s,{from:'paula',kind:'tier',t:'Deine freche Ziege',
  b:fill(s,'Hey {name}!\n\nIch hab gehört, '+z.n+' nascht an deinem Feld. Ziegen machen das aus Langeweile und Salzhunger. Sie holt sich nur reife Pflanzen ganz am Ostrand, morgens zwischen 9 und 11 Uhr.\n\nGib ihr morgens Heu, dann bleibt sie satt auf der Weide. Oder hol dir bei mir einen Leckstein, dann ist für immer Ruhe.\n\nPaula')});}});
 if(t.teich.st==='fertig'&&t.teich.done===s.day&&!t.sent.enten)out.push({pr:0,must:true,make:()=>{t.sent.enten=s.day;return letter(s,{from:'paula',kind:'tier',t:'Zwei Enten für deinen Teich',
  b:fill(s,'Hallo {name}!\n\nTimo sagt, dein Teich ist fertig. Ich habe dir Ede und Emma gebracht. Ede ist wildfarben, Emma ist weiß.\n\nFüll jeden Tag die Futterstelle auf, eine Portion Tierfutter pro Ente. Dann legen sie Eier, und wenn sie dich richtig gern haben, gibt es vielleicht Küken. Bei Enten weiß man nie, welche Farbe rauskommt.\n\nPaula')});}});
 if(t.newKid){const n=t.newKid;out.push({pr:1,make:()=>{t.newKid=null;const e=t.enten.find(x=>x.n===n);return letter(s,{from:'Ententeich',kind:'tier',t:'Nachwuchs am Teich!',
  b:fill(s,'Heute Nacht ist im Entenhaus ein Küken geschlüpft: '+n+'.\n\nFarbe: '+Ti.PHN[e.c]+'.\nMutter: '+e.mother+' · Vater: '+e.father+'\nAnlagen: '+e.g.map(x=>Ti.GENE[x]).join(' und ')+'\n\nIm Tagebuch unter „Freunde“ steht der ganze Stammbaum.')});}});}
 if(t.rettung.st===''&&t.katze.st==='da'&&s.day>=(t.katze.since||0)+4)out.push({pr:2,make:()=>{t.rettung.st='suchen';t.rettung.since=s.day;return letter(s,{from:'henk',kind:'tier',t:'Ein Korb am Fluss',
  b:fill(s,'Moin {name}.\n\nHeute früh am Mondwald. Am Flussufer, westlich vom Steg, steht ein Weidenkorb. Darin piepst was. Ich hab Katzenhaare an den Händen und muss niesen, also schau du nach.\n\nHenk')});}});
 if(t.rettung.st==='vermittelt'&&!t.sent.pip)out.push({pr:1,make:()=>{t.sent.pip=s.day;return letter(s,{from:'mei',kind:'tier',att:{items:{erdbeere_s:3}},t:'Pip sagt Danke',
  b:fill(s,'Liebe {name},\n\nPip hat heute Nacht auf meinem Kopfkissen geschlafen. Und morgens hat sie eine Erdbeere vom Tresen geklaut.\n\nDanke, dass du sie gerettet hast. Ich lege dir ein paar Erdbeersamen bei. Komm uns besuchen, sie sitzt meistens vor dem Laden.\n\nMei')});}});
 return out;});

/* ---------- Karten ---------- */
function clearT(m){if(!m)return;if(m.tier){m.obj=m.obj.filter(o=>!String(o.act||'').startsWith('post:ev:tier:'));for(const [k,v] of Object.entries(m.tier)){const [x,y]=k.split(',').map(Number);m.t[y][x]=v;}}m.tier={};m.decor=(m.decor||[]).filter(d=>!d.tier);}
function setT(m,x,y,v){const k=x+','+y;if(!(k in m.tier))m.tier[k]=m.t[y][x];m.t[y][x]=v;}
function putT(m,o){m.obj.push(o);for(let y=o.y;y<o.y+(o.h||1);y++)for(let x=o.x;x<o.x+(o.w||1);x++)setT(m,x,y,T.BLOCK);}
function trail(m,from,to){const W=J.WALK,key=(x,y)=>x+','+y,prev=new Map([[key(...from),null]]),q=[from];
 while(q.length){const [x,y]=q.shift();if(Math.abs(x-to[0])+Math.abs(y-to[1])===1){const p=[];let c=key(x,y);while(c){p.unshift(c.split(',').map(Number));c=prev.get(c);}return p;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(prev.has(k)||!W.has(m.t[ny]?.[nx]))continue;prev.set(k,key(x,y));q.push([nx,ny]);}}return [];}
const apply0=X.apply;
X.apply=function(maps,s){apply0(maps,s);for(const id of ['farm','forest','village'])clearT(maps[id]);if(!s||!s.tiere)return maps;
 const t=s.tiere,F=maps.farm,sig={};
 if(F){const P=Ti.POND;
  if(t.teich.st==='fertig'){for(let y=P.y;y<P.y+P.h;y++)for(let x=P.x;x<P.x+P.w;x++)setT(F,x,y,T.WASSER);
   putT(F,{k:'entenhaus',x:P.house.x,y:P.house.y,act:'post:ev:tier:entenhaus'});putT(F,{k:'futterstelle',x:P.feed.x,y:P.feed.y,act:'post:ev:tier:futterstelle'});sig.farm='t'+t.enten.length;}
  else{if(t.teich.st==='bau')for(let y=P.y;y<P.y+P.h;y++)for(let x=P.x;x<P.x+P.w;x++)setT(F,x,y,T.SAND);
   putT(F,{k:t.teich.st==='bau'?'teich_bau':'teichschild',x:P.sign.x,y:P.sign.y,act:'post:ev:tier:teichschild'});sig.farm='s'+t.teich.st;}
  if(t.ziege.lecks){putT(F,{k:'leckstein',x:Ti.GOAT.lick.x,y:Ti.GOAT.lick.y,act:'post:ev:tier:leckstein'});sig.farm+='l';}
  if(t.rettung.st==='pflege'){putT(F,{k:'pflegekorb',x:Ti.RESCUE.home.x,y:Ti.RESCUE.home.y,act:'post:ev:tier:pflegekorb'});sig.farm+='p';}}
 const W=maps.forest;if(W&&t.rettung.st==='suchen'){const k=Ti.RESCUE.korb;putT(W,{k:'korb_wald',x:k.x,y:k.y,act:'post:ev:tier:korb_wald'});sig.forest='k';}
 const h=t.hund,p=h.st==='folgen'&&Ti.spot(s);
 if(p&&maps[p.map]){const m=maps[p.map];const path=trail(m,p.from,[p.x,p.y]);putT(m,{k:'grabstelle',x:p.x,y:p.y,act:'post:ev:tier:graben'});
  m.decor=(m.decor||[]).concat(path.filter((_,i)=>i%2===0).map(([x,y],i)=>({k:'pfote',x,y,tier:true,r:i})));sig[p.map]=(sig[p.map]||'')+'h'+p.id;}
 for(const id of ['farm','forest','village'])if(maps[id])maps[id].romSig=(maps[id].romSig||'')+'|T'+(sig[id]||'');
 return maps;};

/* ---------- Darsteller: wer ist wo, in welcher Pose? (rein aus Spielzeit und Zustand) ---------- */
Ti.pets=function(s,mapId){if(!s||!s.tiere)return [];const t=s.tiere,out=[];
 if(mapId==='farm'){if(t.katze.st==='da')out.push({id:'katze',kind:'katze',look:'grau'});
  if(t.ziege.st==='da')out.push({id:'ziege',kind:'ziege',look:'weiss'});
  if(t.teich.st==='fertig')t.enten.forEach((e,i)=>out.push({id:'ente'+i,kind:e.born&&s.day-e.born<=6?'kueken':'ente',look:e.c}));
  if(t.rettung.st==='adoptiert')out.push({id:'pip',kind:'kaetzchen',look:'rot'});}
 if(mapId==='village'&&t.rettung.st==='vermittelt')out.push({id:'pip',kind:'kaetzchen',look:'rot'});
 return out;};
const sunny=s=>s.weather!=='rain'&&s.weather!=='snow';
Ti.pose=function(s,id,gt){const t=s.tiere,m=s.min;gt=gt||0;
 if(id==='katze'){const C=Ti.CAT;if(m>=1260||m<420)return {x:C.door[0]+1,y:C.door[1],anim:'schlaf'};
  if(!sunny(s))return {x:C.rain[0],y:C.rain[1],anim:'schlaf'};
  if(m>=660&&m<960)return {x:C.sun[0],y:C.sun[1],anim:'schlaf',sun:true};
  const w=C.walk[Math.floor(m/40)%C.walk.length];return {x:w[0],y:w[1],anim:'sitz'};}
 if(id==='ziege'){const G=Ti.GOAT,z=t.ziege,st=z.steal&&z.steal.day===s.day?z.steal:null;
  if(st&&((st.st==='plan'&&m>=G.from&&m<G.eat)||(st.st==='gefressen'&&m<G.back)))return {x:st.x+1,y:st.y,anim:'kau',carry:st.k,face:-1};
  const w=G.pasture[Math.floor(m/50)%G.pasture.length];return {x:w[0],y:w[1],anim:'kau'};}
 if(id.startsWith('ente')){const i=+id.slice(4),P=Ti.POND,cx=P.x+P.w/2-.5,cy=P.y+P.h/2-.5;
  if(m>=1200||m<390)return {x:P.bank[0]+(i%2)*.5,y:P.bank[1]-.2+Math.floor(i/2)*.3,anim:'schlaf'};
  const a=gt*.25+i*1.3,rx=P.w/2-.6,ry=P.h/2-.55;return {x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry,anim:'schwimm',face:-Math.sin(a)>=0?1:-1,water:true};}
 if(id==='pip'){if(t.rettung.st==='vermittelt')return {x:7,y:7,anim:'schlaf'};const k=Math.floor(m/30)%3;return {x:[9,10,8][k],y:9,anim:k===2?'schlaf':'sitz'};}
 return null;};

/* ---------- Wegweiser ---------- */
Ti.target=function(s){if(!s.tiere)return null;const t=s.tiere,h=t.hund,r=t.rettung;
 if(h.st==='folgen'){const p=Ti.spot(s);return {map:p.map,x:p.x,y:p.y+1,t:'Die Pfotenspur',sub:'Dort graben, wo die Spur endet · '+p.n};}
 if(h.st==='spur')return {map:'farm',x:4,y:9,t:dogName(s,h.dog)+' hat etwas gewittert',sub:'Tippe '+dogName(s,h.dog)+' an'};
 if(r.st==='suchen')return {map:'forest',x:Ti.RESCUE.korb.x+1,y:Ti.RESCUE.korb.y,t:'Ein Korb am Fluss',sub:'Westlich vom Steg im Mondwald'};
 if(r.st==='pflege'&&!r.care.includes(s.day))return {map:'farm',x:Ti.RESCUE.home.x+1,y:Ti.RESCUE.home.y,t:'Das Kätzchen pflegen',sub:r.care.length>=Ti.RESCUE.need?'Ein Zuhause wählen':'Milch, Ei oder Fisch geben · Tag '+(r.care.length+1)+' von '+Ti.RESCUE.need};
 if(t.teich.st==='fertig'&&t.enten.length&&!(t.futterE.day===s.day&&t.futterE.n>=t.enten.length)&&has(s,'futter'))return {map:'farm',x:Ti.POND.feed.x+1,y:Ti.POND.feed.y,t:'Die Enten füttern',sub:'Futterstelle am Ententeich'};
 return null;};
const target0=X.target;X.target=function(s){return target0(s)||Ti.target(s);};

/* ---------- Tagebuch ---------- */
Ti.diary=function(s,esc){Ti.migrate(s);const t=s.tiere,h='♥',row=(b,sm)=>'<div class="row"><div class="tx"><b>'+b+'</b>'+sm.map(x=>'<small>'+x+'</small>').join('')+'</div></div>';let o='';
 const k=t.katze;if(k.st==='da')o+=row(esc(k.n)+' <small>· Katze</small> '+h.repeat(Math.ceil(k.h/2)),[(k.pet===s.day?'Heute gestreichelt':'Noch nicht gestreichelt')+(k.fed===s.day?' · Fisch bekommen':''),
  'Geschenke: ab 3 Herzen am Morgen vor der Haustür, wenn du sie am Vortag gestreichelt hast, höchstens jeden zweiten Morgen. Sie bringt, was gerade im Gras wächst; ab 6 Herzen ab und zu einen Karpfen.','Bisher '+k.gifts+' Geschenke'+(k.lastK?', zuletzt '+esc(J.ITEMS[k.lastK].n):'')]);
 const hu=t.hund;o+=row('Schatzsuche mit den Pudeln',[hu.found.length+' von '+Ti.SPOTS.length+' Verstecken gefunden','Ab 4 Herzen wittert ein Pudel alle drei Tage etwas. Dann hat er ein ! über dem Kopf.']);
 const z=t.ziege;if(z.st==='da')o+=row(esc(z.n)+' <small>· Ziege</small> '+h.repeat(Math.ceil(z.h/2)),[z.lecks?'Leckstein steht · sie bleibt auf der Weide':'Nascht jeden zweiten Tag 9–11 Uhr eine reife Pflanze am Ostrand des Feldes. Heu am Morgen oder ein Leckstein helfen.','Genascht: '+z.stolen+' · verhindert: '+z.foiled]);
 if(t.teich.st==='fertig'){o+='<h3>Ententeich</h3>'+t.enten.map(e=>row(esc(e.n)+' <small>· '+(e.sex==='m'?'Erpel':'Ente')+' · '+esc(Ti.PHN[e.c])+'</small> '+h.repeat(Math.ceil(e.h/2)),['Anlagen: '+e.g.map(x=>Ti.GENE[x]).join(' / ')+(e.mother?' · Eltern: '+esc(e.mother)+' × '+esc(e.father)+' · geschlüpft am Spieltag '+e.born:''),e.hungry?'Hat Hunger':'Satt'])).join('')+
  '<p class="sub">Küken erben je eine Anlage von Mutter und Vater. Wildfarben setzt sich gegen Weiß durch, Weiß gegen Sonnengelb. Sonnengelb gibt es nur, wenn beide Anlagen gelb sind.</p>';}
 const r=t.rettung;if(r.st&&r.st!=='')o+=row('Das Kätzchen vom Fluss',[{suchen:'Henk hat einen Korb am Fluss gesehen.',pflege:'In Pflege: '+r.care.length+' von '+Ti.RESCUE.need+' Tagen versorgt',adoptiert:'Pip wohnt auf dem Hof.',vermittelt:'Pip wohnt bei Mei am Markt.'}[r.st]||'']);
 if(t.log.length)o+='<h3>Tiergeschichten</h3>'+t.log.slice(-5).reverse().map(l=>'<div class="row"><div class="tx"><small>Tag '+l.day+' · '+esc(l.t)+'</small></div></div>').join('');
 return o;};
})();
