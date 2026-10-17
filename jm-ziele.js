"use strict";
/* Etappe 5 – Ziele, Geld, Spannung. Nur Logik und Zustand (s.ziele), kein DOM.
   Anlass: Janina hat alles erledigt, 38.500 G und nichts mehr, wofür sich Sparen lohnt.

   Preisleiter (verbindlich)
     sofort  bis ~40.000 G   Stadtstufe 2 Bäckerei 12.000 G · Silberwerkzeug 8.000 G · Neues Feldstück 15.000 G
     mittel  50–150.000 G    Stadtstufe 3 Blumenladen + Park 60.000 G · Goldwerkzeug 80.000 G · Stadtstufe 4 Villa 140.000 G
     lang    ab 300.000 G    Stadtstufe 5 Hotel 320.000 G
   Einnahmen wachsen mit: Pacht der Betriebe, Ankauf in Bäckerei und Blumenladen, Parkbonus auf Mieten, Villa und Hotel,
   dazu Großaufträge mit Frist und der Erntewettbewerb. Beispielrechnung: Z.bilanz() und docs/ETAPPE-5-ABNAHME.md.

   Material bei Timo: teurer als Selbersammeln und mit Tageslimit. Kein Einkaufspreis liegt unter einem Verkaufsweg
   (Versand, Samstagsstand × 1,7, Ankauf, Großauftrag je Stück); das prüft tests/etappe5.test.cjs für jeden Laden. */
(function(){
const J=window.JM,T=J.T,St=J.Stadt,Z=J.Ziele={};
const DPS=J.DPS||14;
const season=d=>Math.floor((d-1)/DPS)%4,dayIn=d=>(d-1)%DPS+1,year=d=>Math.floor((d-1)/(DPS*4))+1;
const fmt=n=>Math.round(n).toLocaleString('de-DE');
const take=(s,k,n)=>{s.inv[k]-=n;if(!s.inv[k])delete s.inv[k];};

/* ---------- Neue Waren: Gartenblumen für Lottes Blumenladen ---------- */
J.ITEMS.blume_s={n:'Blumensamen',cat:'seed',crop:'blume'};
J.ITEMS.blume={n:'Gartenblumen',cat:'crop',sell:45,eat:4};
J.CROPS.blume={days:4,seed:25,se:[0,1,2]};
// Riesenvarianten entstehen in jm-ausbau.js nur für Kulturen, die beim Laden schon bekannt waren.
for(const k of Object.keys(J.CROPS))if(!J.ITEMS['riesig_'+k]){const it=J.ITEMS[k];J.ITEMS['riesig_'+k]={...it,n:'Riesen-'+it.n,base:k,giant:true,sell:it.sell*6,...(it.eat?{eat:it.eat*5}:{})};}

/* ---------- Material bei Timo ---------- */
Z.MATERIAL={holz:{p:35,limit:60},stein:{p:30,limit:60},eisen:{p:90,limit:10}};
{const st=J.SHOPS.zimmerei.stock;const desc={holz:'Bauholz · bis 60 am Tag · Äste und Wald sind kostenlos',stein:'Bruchstein · bis 60 am Tag · in der Mondhöhle kostenlos',eisen:'Eisenerz · bis 10 am Tag · ab Höhlenebene 3 kostenlos'};
 for(const [k,m] of Object.entries(Z.MATERIAL)){let r=st.find(x=>x.k===k);if(!r)st.push(r={k});r.p=m.p;r.d=desc[k];}}

Z.migrate=function(s){
 let z=s.ziele;if(!z||typeof z!=='object'||Array.isArray(z))z=s.ziele={};
 z.v=1;if(!Number.isInteger(z.stufe)||z.stufe<1||z.stufe>5)z.stufe=1;
 if(z.bau&&!(Number.isInteger(z.bau.stufe)&&z.bau.stufe===z.stufe+1&&Number.isInteger(z.bau.start)&&Number.isInteger(z.bau.due)))z.bau=null;
 if(!z.kauf||typeof z.kauf!=='object')z.kauf={day:0};
 if(!z.ankauf||typeof z.ankauf!=='object')z.ankauf={day:0};
 if(!z.hof||typeof z.hof!=='object')z.hof={};for(const k of ['silber','gold','felder'])z.hof[k]=!!z.hof[k];
 if(z.hof.job&&!(Z.HOF[z.hof.job.k]&&Number.isInteger(z.hof.job.due)))z.hof.job=null;if(!z.hof.job)z.hof.job=null;
 if(!z.betrieb||typeof z.betrieb!=='object')z.betrieb={};
 if(!z.auftraege||typeof z.auftraege!=='object')z.auftraege={ok:0,fail:0,seq:0};for(const k of ['ok','fail','seq'])if(!Number.isInteger(z.auftraege[k]))z.auftraege[k]=0;
 if(z.auftrag&&!(J.ITEMS[z.auftrag.k]||z.auftrag.k==='fisch'))z.auftrag=null;if(z.auftrag===undefined)z.auftrag=null;
 if(!Number.isInteger(z.pause))z.pause=0;
 if(!z.wett||typeof z.wett!=='object')z.wett={key:'',items:[],st:null};if(!Array.isArray(z.wett.items))z.wett.items=[];
 if(!Array.isArray(z.troph))z.troph=[];
 if(!Number.isInteger(z.lastNight))z.lastNight=0;
 if(!Array.isArray(s.mail))s.mail=[];
 // Fortgeschrittene Höfe (Janina) sehen die neuen Ziele sofort: Brief direkt im Briefkasten, Großauftrag läuft.
 if(!z.brief&&Z.bereit(s))Z.start(s);
 return s;};
const mig=J.Ausbau.migrate;J.Ausbau.migrate=function(s){mig(s);Z.migrate(s);return s;};
Z.bereit=s=>!!(s.city&&Array.isArray(s.city.plots)&&s.city.plots.length&&s.city.plots.every(p=>p&&p.ready))||(s.money||0)>=10000;
Z.letter=(s,o)=>Object.assign({id:'z'+s.day+'-'+(s.mail.length+1),day:s.day||1,read:false,kind:'ziel'},o);
Z.start=function(s){const z=s.ziele;z.brief=s.day||1;
 s.mail.push(Z.letter(s,{from:'rosa',ziele:'start',t:'Lindenstadt will wachsen',b:'Liebe '+(s.name||'Janina')+',\n\nim Rathaus liegen neue Pläne auf dem Tisch. Dank deiner drei Häuser kommen jeden Tag mehr Leute mit dem Zug nach Lindenstadt. Die Stadt kann wachsen: vom Dorf am Bahnhof bis zur Kleinstadt mit Hotel.\n\nAls Erstes wünscht sich Frieda eine Bäckerei an der neuen Oststraße (12.000 G, 60 Holz, 40 Stein). Sie zahlt dir Pacht und kauft deinen Weizen besser als die Versandkiste.\n\nTimo verkauft jetzt Holz, Stein und Eisen, falls dir Material fehlt. Er schärft auch deine Werkzeuge in Silber und Gold und legt dir ein neues Feldstück an.\n\nAn der Tafel neben dem Brunnen hängen ab heute Großaufträge mit Frist, und am 11. jeder Jahreszeit (außer im Winter) lädt Greta vom Nachbarhof zum Erntewettbewerb.\n\nIm Tagebuch unter „Ziele“ siehst du deine Hof- und Stadtsterne, das nächste Ziel und deine Trophäen.\n\nRosa, Rathaus Lindenstadt'}));
 if(!z.auftrag)Z.neuerAuftrag(s);};

Z.kaufHeute=(s,k)=>s.ziele.kauf.day===s.day?(s.ziele.kauf[k]||0):0;
Z.restHeute=(s,k)=>Z.MATERIAL[k]?Math.max(0,Z.MATERIAL[k].limit-Z.kaufHeute(s,k)):0;
Z.buyMaterial=function(s,k,n){Z.migrate(s);const m=Z.MATERIAL[k];if(!m||!Number.isSafeInteger(n)||n<=0||n>Z.restHeute(s,k))return false;const c=m.p*n;if(s.money<c)return false;
 if(s.ziele.kauf.day!==s.day)s.ziele.kauf={day:s.day};s.money-=c;s.inv[k]=(s.inv[k]||0)+n;s.ziele.kauf[k]=(s.ziele.kauf[k]||0)+n;return true;};

/* ---------- Stadtstufen und Gebäude ---------- */
Z.STUFEN=[
 {n:1,t:'Dorf am Bahnhof',d:'Drei kleine Mietshäuser mit Ida, Noah und Mara.'},
 {n:2,t:'Marktflecken',geb:['baeckerei'],money:12000,need:{holz:60,stein:40},days:3,d:'Friedas Bäckerei an der neuen Oststraße. Die Stadt wächst nach Osten.'},
 {n:3,t:'Gartenstadt',geb:['blumenladen','park'],money:60000,need:{holz:120,stein:80},days:4,d:'Lottes Blumenladen und ein Stadtpark mit Pavillon, Brunnen, Bank und Beeten.'},
 {n:4,t:'Villenviertel',geb:['villa'],money:140000,need:{holz:200,stein:150,eisen:20},days:5,d:'Eine eigene Villa für Herrn Falk, der Haus Nummer 7 mieten wollte.'},
 {n:5,t:'Kleinstadt Lindenstadt',geb:['hotel'],money:320000,need:{holz:300,stein:250,eisen:40},days:6,d:'Das Hotel Lindenhof bringt Gäste aus der ganzen Gegend.'}
];
Z.EAST=27;Z.W=48;
Z.GEB={
 baeckerei:{n:'Friedas Bäckerei',stufe:2,x:28,y:3,w:5,h:4,npc:'frieda',spot:[33,7],pacht:180,ankauf:{k:'weizen',p:50,limit:40}},
 blumenladen:{n:'Lottes Blumenladen',stufe:3,x:35,y:3,w:5,h:4,npc:'lotte',spot:[40,7],pacht:220,ankauf:{k:'blume',p:62,limit:30},verkauf:[{k:'blume_s',p:25}]},
 park:{n:'Stadtpark',stufe:3,x:27,y:17,w:5,h:4,bonus:.25},
 villa:{n:'Villa am Lindenhang',stufe:4,x:42,y:3,w:5,h:4,npc:'falk',spot:[46,8],miete:900},
 hotel:{n:'Hotel Lindenhof',stufe:5,x:38,y:17,w:5,h:4,npc:'konrad',spot:[43,21],pacht:2000}
};
Z.VERKAUF=Object.values(Z.GEB).flatMap(g=>g.verkauf||[]);
Z.ankaufPreis=k=>Math.max(0,...Object.values(Z.GEB).filter(g=>g.ankauf&&g.ankauf.k===k).map(g=>g.ankauf.p));
Z.stufe=s=>(Z.migrate(s),s.ziele.stufe);
Z.offen=(s,id)=>Z.stufe(s)>=Z.GEB[id].stufe;
Z.inBau=(s,id)=>!!(s.ziele.bau&&Z.STUFEN[s.ziele.bau.stufe-1].geb.includes(id));
Z.bauPhase=s=>{const b=s.ziele&&s.ziele.bau;return b?Math.min(3,1+Math.max(0,s.day-b.start)):0;};
Z.fehlt=function(s,c){const out=[];if(s.money<c.money)out.push(fmt(c.money-s.money)+' G');for(const [k,n] of Object.entries(c.need||{}))if((s.inv[k]||0)<n)out.push((n-(s.inv[k]||0))+'× '+J.ITEMS[k].n);return out;};
Z.vorbedingung=s=>s.ziele.stufe>1||(s.city&&s.city.plots.every(p=>p.ready))?null:'Erst alle drei Mietshäuser bauen.';
Z.orderStufe=function(s){Z.migrate(s);const z=s.ziele,n=z.stufe+1,c=Z.STUFEN[n-1];if(!c||z.bau||Z.vorbedingung(s)||Z.fehlt(s,c).length)return false;
 s.money-=c.money;for(const [k,q] of Object.entries(c.need))take(s,k,q);z.bau={stufe:n,start:s.day,due:s.day+c.days};return true;};

/* ---------- Hof ausbauen ---------- */
Z.HOF={
 silber:{n:'Silberwerkzeug',money:8000,need:{eisen:10},days:1,d:'Gießen kostet keine Energie mehr, Umgraben nur noch 1 statt 2. Die Kanne fasst 20 Füllungen mehr.'},
 felder:{n:'Neues Feldstück',money:15000,need:{holz:40,stein:30},days:2,d:'27 neue Beete direkt unter deinem Feld. Timo rodet, pflügt und zäunt ein.'},
 gold:{n:'Goldwerkzeug',money:80000,need:{silber:10,mondquarz:3},days:2,req:'silber',d:'Jeder Schlag bearbeitet drei Beete nebeneinander: umgraben und gießen. Die Kanne fasst nochmals 20 mehr.'}
};
Z.orderHof=function(s,k){Z.migrate(s);const h=s.ziele.hof,c=Z.HOF[k];if(!c||h[k]||h.job||(c.req&&!h[c.req])||Z.fehlt(s,c).length)return false;
 s.money-=c.money;for(const [i,q] of Object.entries(c.need))take(s,i,q);h.job={k,due:s.day+c.days};return true;};
Z.toolCost=function(s,kind,c){const h=s.ziele&&s.ziele.hof;if(!h||!(h.silber||h.gold))return c;if(kind==='water')return 0;if(kind==='till')return Math.min(c,1);return c;};
Z.extraTiles=(s,x,y)=>s.ziele&&s.ziele.hof.gold?[[x-1,y],[x+1,y]]:[];
Z.FELD2={x0:3,x1:11,y0:20,y1:22};
Z.applyFarm=function(f,s){if(!f||!s||!s.ziele||!s.ziele.hof.felder)return;const F=Z.FELD2;
 for(let y=F.y0;y<=F.y1;y++)for(let x=F.x0;x<=F.x1;x++)f.t[y][x]=T.FELD;
 f.trees=f.trees.filter(t=>!(t.x>=F.x0&&t.x<=F.x1&&t.y>=F.y0&&t.y<=F.y1));f.obj=f.obj.filter(o=>!(o.x>=F.x0&&o.x<=F.x1&&o.y>=F.y0&&o.y<=F.y1));
 if(!String(f.houseLevel||'').includes('|feld2'))f.houseLevel=String(f.houseLevel||'')+'|feld2';};

/* ---------- Großaufträge mit Frist ---------- */
Z.AUFTRAG={tage:5,faktor:1.6,bonus:200,minN:8,pause:2};
Z.einzelwert=k=>k==='fisch'?60:(J.ITEMS[k]?.sell||0);
Z.auftragStueck=k=>{const pool=['ei','milch','weizen','fisch','blume','winterwurzel',...Object.keys(J.CROPS)];return pool.includes(k)?Math.ceil(Z.einzelwert(k)*Z.AUFTRAG.faktor+Z.AUFTRAG.bonus/Z.AUFTRAG.minN):0;};
const clampN=(n,a,b)=>Math.max(a,Math.min(b,Math.round(n)));
Z.pool=function(s){const se=season(s.day),st=s.ziele.stufe,o=[];
 if((s.hens||[]).length)o.push({k:'ei',who:st>=5?'konrad':'lin',n:st>=5?clampN(s.hens.length*6,20,40):clampN(s.hens.length*4,10,24),txt:st>=5?'Das Hotel braucht Eier fürs Frühstück.':'Lin braucht Eier für Nudelsuppe.'});
 if((s.cows||[]).length)o.push({k:'milch',who:'lin',n:clampN(s.cows.length*4,8,12),txt:'Lin plant eine Woche Milchreis.'});
 if(se<3)o.push({k:'weizen',who:st>=2?'frieda':'lin',n:30,txt:st>=2?'Frieda backt Erntebrot für ganz Lindenstadt.':'Lin will eigene Nudeln machen.'});
 if(s.rod)o.push({k:'fisch',who:'henk',n:8,txt:'Henk richtet ein Fischessen am Fluss aus.'});
 if(se<3){const best=Object.keys(J.CROPS).filter(k=>!J.CROPS[k].magic&&k!=='blume'&&J.CROPS[k].se.includes(se)).sort((a,b)=>J.ITEMS[b].sell-J.ITEMS[a].sell)[0];if(best)o.push({k:best,who:'rosa',n:20,txt:'Rosa füllt die Vorratskammer im Rathaus.'});}
 else o.push({k:'winterwurzel',who:'rosa',n:10,txt:'Rosa kocht Wintereintopf für alle.'});
 if(st>=3&&se<3)o.push({k:'blume',who:'lotte',n:25,txt:'Lotte schmückt den Bahnhof für eine Hochzeit.'});
 return o;};
Z.neuerAuftrag=function(s){const z=s.ziele,p=Z.pool(s);if(!p.length)return null;const a=p[z.auftraege.seq%p.length];z.auftraege.seq++;
 const n=Math.max(Z.AUFTRAG.minN,a.n);z.auftrag={id:'a'+s.day+'-'+z.auftraege.seq,k:a.k,n,got:0,who:a.who,txt:a.txt,start:s.day,due:s.day+Z.AUFTRAG.tage,rew:Math.round(Z.einzelwert(a.k)*n*Z.AUFTRAG.faktor+Z.AUFTRAG.bonus),st:'offen'};return z.auftrag;};
Z.lieferbar=(s,k)=>k==='fisch'?J.FISHKEYS.reduce((n,f)=>n+(s.inv[f]||0),0):(s.inv[k]||0);
Z.deliver=function(s,max){Z.migrate(s);const a=s.ziele.auftrag;if(!a||a.st!=='offen'||s.day>a.due)return {taken:0,done:false};
 let want=Math.min(a.n-a.got,max===undefined?Infinity:max),taken=0;if(!(want>0))return {taken:0,done:false};
 for(const k of a.k==='fisch'?J.FISHKEYS.slice().sort((x,y)=>(J.ITEMS[x].sell)-(J.ITEMS[y].sell)):[a.k]){const t=Math.min(want,s.inv[k]||0);if(t){take(s,k,t);want-=t;taken+=t;}}
 a.got+=taken;let done=false;if(a.got>=a.n){a.st='fertig';a.fertig=s.day;s.money+=a.rew;if(s.stats)s.stats.earned=(s.stats.earned||0)+a.rew;s.ziele.auftraege.ok++;s.ziele.pause=s.day+Z.AUFTRAG.pause;done=true;
  const n=s.ziele.auftraege.ok;if(n===1)Z.trophy(s,'auftrag1','Erster Großauftrag erfüllt');if(n===5)Z.trophy(s,'auftrag5','Fünf Großaufträge: verlässliche Lieferantin');if(n===15)Z.trophy(s,'auftrag15','Fünfzehn Großaufträge: Lindenstadts Hoflieferantin');}
 return {taken,done};};

/* ---------- Erntewettbewerb mit Greta ---------- */
Z.WETT={tag:11,from:540,to:1080,preis:3000,trost:400,stand:{x:15,y:16},greta:[17,17]};
Z.wettKey=s=>year(s.day)+'-'+season(s.day);
Z.wettTag=s=>season(s.day)<3&&dayIn(s.day)===Z.WETT.tag;
Z.wettHeute=s=>Z.wettTag(s)&&s.min>=Z.WETT.from&&s.min<Z.WETT.to;
Z.gretaScore=s=>450+150*(year(s.day)-1)+70*season(s.day);
Z.wett=s=>{Z.migrate(s);const w=s.ziele.wett,k=Z.wettKey(s);if(w.key!==k){w.key=k;w.items=[];w.st=null;w.punkte=0;w.greta=0;}return w;};
Z.zeigbar=k=>{const it=J.ITEMS[k];return !!it&&!!it.sell&&['crop','animal','fish','forage'].includes(it.cat);};
Z.einreichen=function(s,k){if(!Z.wettHeute(s)||!Z.zeigbar(k)||!(s.inv[k]>0))return false;const w=Z.wett(s);if(w.st||w.items.length>=3)return false;take(s,k,1);w.items.push(k);return true;};
Z.bewerten=function(s){if(!Z.wettHeute(s))return null;const w=Z.wett(s);if(w.st||!w.items.length)return null;
 w.punkte=w.items.reduce((a,k)=>a+J.ITEMS[k].sell,0);w.greta=Z.gretaScore(s);const sieg=w.punkte>w.greta;w.st=sieg?'gewonnen':'verloren';const g=sieg?Z.WETT.preis:Z.WETT.trost;
 s.money+=g;if(s.stats)s.stats.earned=(s.stats.earned||0)+g;s.ziele.siege=(s.ziele.siege||0)+(sieg?1:0);
 if(sieg)Z.trophy(s,'wett-'+w.key,'Erntewettbewerb '+J.SEASONS[season(s.day)]+' · Jahr '+year(s.day));
 return {punkte:w.punkte,greta:w.greta,sieg,geld:g};};

/* ---------- Trophäen, Sterne, nächste Ziele ---------- */
Z.trophy=(s,id,t)=>{if(!s.ziele.troph.some(x=>x.id===id))s.ziele.troph.push({id,t,day:s.day});};
Z.trophaeen=s=>(Z.migrate(s),s.ziele.troph.slice());
Z.sterne=function(s){Z.migrate(s);const z=s.ziele,h=z.hof;
 const hof=[['Haus ganz ausgebaut',(s.house&&s.house.level>=2)],['Silberwerkzeug',h.silber],['Neues Feldstück',h.felder],['Goldwerkzeug',h.gold],['Erntewettbewerb gewonnen',(z.siege||0)>0]];
 return {stadt:{n:z.stufe,max:5,list:Z.STUFEN.map(x=>[x.t,z.stufe>=x.n])},hof:{n:hof.filter(x=>x[1]).length,max:5,list:hof.map(([t,ok])=>[t,!!ok])}};};
const teile=(s,c)=>[{k:'money',hat:s.money,soll:c.money},...Object.entries(c.need||{}).map(([k,n])=>({k,hat:s.inv[k]||0,soll:n}))];
Z.naechste=function(s){Z.migrate(s);const z=s.ziele,out=[];
 if(z.bau){const c=Z.STUFEN[z.bau.stufe-1];out.push({t:'Baustelle: '+c.t,d:'Noch '+Math.max(0,z.bau.due-s.day)+' Nächte. '+c.d,teile:[],bau:true});}
 else if(z.stufe<5){const c=Z.STUFEN[z.stufe];out.push({t:'Stadtstufe '+c.n+': '+c.t,kurz:'Lindenstadt wächst: '+c.geb.map(id=>Z.GEB[id].n).join(' und '),d:c.d,teile:teile(s,c),ok:!Z.vorbedingung(s)&&!Z.fehlt(s,c).length,hinweis:Z.vorbedingung(s)});}
 if(z.hof.job){const c=Z.HOF[z.hof.job.k];out.push({t:'Timo arbeitet: '+c.n,d:'Fertig in '+Math.max(0,z.hof.job.due-s.day)+' Nächten.',teile:[],bau:true});}
 for(const k of Object.keys(Z.HOF).filter(k=>!z.hof[k]&&(!z.hof.job||z.hof.job.k!==k)&&(!Z.HOF[k].req||z.hof[Z.HOF[k].req])).sort((a,b)=>Z.HOF[a].money-Z.HOF[b].money)){const c=Z.HOF[k];out.push({t:'Hof: '+c.n,d:c.d,teile:teile(s,c),ok:!Z.fehlt(s,c).length&&!z.hof.job});}
 const a=z.auftrag;if(a&&a.st==='offen')out.push({t:'Großauftrag: '+a.n+'× '+Z.name(a.k),d:a.txt+' Frist: noch '+Math.max(0,a.due-s.day)+' Tage · '+fmt(a.rew)+' G',teile:[{k:a.k,hat:a.got,soll:a.n}]});
 out.push({t:'Erntewettbewerb mit Greta',d:Z.wettText(s),teile:[]});
 return out;};
Z.name=k=>k==='fisch'?'Fisch':J.ITEMS[k].n;
Z.naechsterWett=s=>{for(let d=s.day;d<s.day+DPS*4+1;d++)if(season(d)<3&&dayIn(d)===Z.WETT.tag&&(d>s.day||s.min<Z.WETT.to))return d;return null;};
Z.wettText=s=>{const d=Z.naechsterWett(s);if(!d)return '';const w=s.ziele.wett,heute=d===s.day;return (heute?'Heute 9–18 Uhr am Stand neben dem Brunnen in Lindenstadt.':'Am '+Z.WETT.tag+'. '+J.SEASONS[season(d)]+' (in '+(d-s.day)+' Tagen), 9–18 Uhr in Lindenstadt.')+' Zeig bis zu drei Ernten; Greta peilt '+Z.gretaScore({day:d})+' Punkte an. Preis '+fmt(Z.WETT.preis)+' G und Trophäe.'+(heute&&w.key===Z.wettKey(s)&&w.st?' Heute schon bewertet.':'');};

/* ---------- Beispielrechnung: typischer Spieltag ---------- */
/* Annahme fortgeschrittener Hof ohne Stadteinnahmen (Herleitung im Bericht): 2.200 G am Tag aus Versand, Tieren und Tageszielen.
   Großaufträge bringen im Schnitt etwa 230 G am Tag (≈1.650 G alle 7 Tage). Material wird zum Timo-Preis eingerechnet (obere Grenze). */
Z.TYPISCH={hof:2200,auftrag:230,miete:3*(60+20)};
Z.passiv=function(n){let p=Z.TYPISCH.miete;const G=Z.GEB;
 if(n>=2)p+=G.baeckerei.pacht+G.baeckerei.ankauf.limit*(G.baeckerei.ankauf.p-J.ITEMS.weizen.sell);
 if(n>=3)p+=G.blumenladen.pacht+G.blumenladen.ankauf.limit*(G.blumenladen.ankauf.p-J.ITEMS.blume.sell)+Z.TYPISCH.miete*G.park.bonus;
 if(n>=4)p+=G.villa.miete*(1+G.park.bonus);if(n>=5)p+=G.hotel.pacht;return Math.round(p);};
Z.bilanz=function(){return Z.STUFEN.map((st,i)=>{const proTag=Z.TYPISCH.hof+Z.TYPISCH.auftrag+Z.passiv(st.n),next=Z.STUFEN[i+1];
 const ziel=next?next.money+Object.entries(next.need).reduce((a,[k,n])=>a+n*Z.MATERIAL[k].p,0):0;
 const prev=i>0?Z.TYPISCH.hof+Z.TYPISCH.auftrag+Z.passiv(i):0,kosten=st.money?st.money+Object.entries(st.need).reduce((a,[k,n])=>a+n*Z.MATERIAL[k].p,0):0;
 return {stufe:st.n,t:st.t,proTag,kosten,tageBisZiel:i>0?Math.ceil(kosten/prev):0,naechsteKosten:ziel};});};

/* ---------- Nacht: Bau, Pacht, Aufträge, Briefe ---------- */
Z.advance=function(s){Z.migrate(s);const z=s.ziele,notes=[];let earned=0;if(z.lastNight>=s.day)return {earned:0,notes};z.lastNight=s.day;
 if(z.bau&&s.day>=z.bau.due){const n=z.bau.stufe,c=Z.STUFEN[n-1];z.stufe=n;z.bau=null;notes.push('Lindenstadt ist jetzt '+c.t+'! '+c.geb.map(id=>Z.GEB[id].n).join(' und ')+' ist fertig.');
  Z.trophy(s,'stadt'+n,'Stadtstufe '+n+' · '+c.t);for(const id of c.geb){z.betrieb[id]={since:s.day,last:s.day};const L=Z.EINZUG[id];if(L)s.mail.push(Z.letter(s,{from:L[0],ziele:'geb:'+id,t:L[1],b:L[2].replace(/\{name\}/g,s.name||'Janina')}));}}
 const j=z.hof.job;if(j&&s.day>=j.due){z.hof[j.k]=true;z.hof.job=null;if(j.k!=='felder'&&s.can)s.can.max=(s.can.max||20)+20;notes.push('Timo hat geliefert: '+Z.HOF[j.k].n+'.');Z.trophy(s,'hof-'+j.k,Z.HOF[j.k].n);}
 let pacht=0;for(const [id,b] of Object.entries(z.betrieb)){const g=Z.GEB[id];if(!g||!Z.offen(s,id)||s.day<=b.since||s.day<=(b.last||0))continue;pacht+=(g.pacht||0)+(g.miete?Math.round(g.miete*(Z.offen(s,'park')?1+Z.GEB.park.bonus:1)):0);b.last=s.day;}
 if(Z.offen(s,'park')&&s.city)for(const p of s.city.plots)if(p.tenant&&p.lastRent===s.day)pacht+=Math.round(St.rentFor(p)*Z.GEB.park.bonus);
 if(pacht){earned+=pacht;notes.push('Pacht und Parkbonus aus Lindenstadt: '+fmt(pacht)+' G');}
 const a=z.auftrag;if(a&&a.st==='offen'&&s.day>a.due){a.st='verpasst';z.auftraege.fail++;const wert=a.got*Z.einzelwert(a.k);earned+=wert;z.pause=s.day+1;
  s.mail.push(Z.letter(s,{from:a.who==='konrad'&&J.NPCS.konrad?'konrad':a.who,ziele:'auftrag-verpasst',t:'Nicht schlimm',b:'Liebe '+(s.name||'Janina')+',\n\ndie Frist für '+a.n+'× '+Z.name(a.k)+' ist vorbei. '+(a.got?'Die '+a.got+' Stück, die du gebracht hast, bezahle ich dir gern zum vollen Wert: '+fmt(wert)+' G.':'Wir haben uns anders beholfen.')+' An der Tafel hängt bald ein neuer Auftrag.\n\nDanke dir!'}));}
 if((!z.auftrag||z.auftrag.st!=='offen')&&z.brief&&s.day>=z.pause){const b=Z.neuerAuftrag(s);if(b)notes.push('Neuer Großauftrag an der Tafel in Lindenstadt: '+b.n+'× '+Z.name(b.k)+'.');}
 if(!z.brief&&Z.bereit(s))Z.start(s);
 if(season(s.day)<3&&dayIn(s.day)===Z.WETT.tag-2)s.mail.push(Z.letter(s,{from:'greta',ziele:'wett-ankuendigung',kind:'ziel',t:'Erntewettbewerb übermorgen',b:'Hallo Nachbarin!\n\nÜbermorgen, am '+Z.WETT.tag+'. '+J.SEASONS[season(s.day)]+', ist wieder Erntewettbewerb in Lindenstadt, 9 bis 18 Uhr neben dem Brunnen. Jede von uns zeigt bis zu drei Stücke, gezählt wird ihr Wert. Ich peile '+Z.gretaScore(s)+' Punkte an. Riesenpflanzen und seltene Fische zählen viel!\n\nIch freu mich auf dich.\nGreta'}));
 if(earned){s.money+=earned;if(s.stats)s.stats.earned=(s.stats.earned||0)+earned;}
 return {earned,notes};};
Z.EINZUG={
 baeckerei:['frieda','Die Bäckerei duftet!','Liebe {name},\n\nder Ofen ist warm, die ersten Brötchen sind raus. Ich zahle dir jeden Morgen 180 G Pacht und kaufe dir bis zu 40 Weizen am Tag für 50 G das Stück ab.\n\nKomm vorbei, ich stehe vor der Tür an der Oststraße.\n\nFrieda'],
 blumenladen:['lotte','Blumen für Lindenstadt','Liebe {name},\n\nmein Laden ist eröffnet. Bei mir gibt es Blumensamen, und deine Gartenblumen kaufe ich dir für 62 G ab, bis zu 30 am Tag. Der neue Park gleich unten ist mein Lieblingsplatz.\n\nLotte'],
 park:null,
 villa:['falk','Ich komme gern zurück','Sehr geehrte {name},\n\nnach Haus Nummer 7 dachte ich, für mich gäbe es keine Villa in Lindenstadt. Und nun haben Sie eine gebaut. Ich ziehe ein und zahle 900 G Miete am Tag, im Park sogar etwas mehr.\n\nHochachtungsvoll\nFalk'],
 hotel:['konrad','Hotel Lindenhof eröffnet','Liebe {name},\n\ndie ersten Gäste sind angereist. Das Hotel zahlt Ihnen 2.000 G Pacht am Tag. Für das Frühstück brauchen wir bald viele Eier. Schauen Sie an der Auftragstafel!\n\nKonrad'],
};

/* ---------- Läden der neuen Gebäude ---------- */
Z.ankaufHeute=(s,id)=>s.ziele.ankauf.day===s.day?(s.ziele.ankauf[id]||0):0;
Z.verkaufen=function(s,id,n){Z.migrate(s);const g=Z.GEB[id];if(!g||!g.ankauf||!Z.offen(s,id))return 0;const k=g.ankauf.k,m=Math.min(n,s.inv[k]||0,g.ankauf.limit-Z.ankaufHeute(s,id));if(!(m>0))return 0;
 if(s.ziele.ankauf.day!==s.day)s.ziele.ankauf={day:s.day};take(s,k,m);s.ziele.ankauf[id]=(s.ziele.ankauf[id]||0)+m;const g2=m*g.ankauf.p;s.money+=g2;if(s.stats)s.stats.earned=(s.stats.earned||0)+g2;if(s.shipLog)s.shipLog[k]=(s.shipLog[k]||0)+m;return m;};
Z.kaufen=function(s,id,k,n){Z.migrate(s);const g=Z.GEB[id],q=g&&(g.verkauf||[]).find(x=>x.k===k);if(!q||!Z.offen(s,id)||!Number.isSafeInteger(n)||n<=0||s.money<q.p*n)return false;s.money-=q.p*n;s.inv[k]=(s.inv[k]||0)+n;return true;};

/* ---------- Karten: Lindenstadt wächst nach Osten, Hof bekommt Feldstück ---------- */
function rect(m,x0,y0,x1,y1,t){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(m.t[y]&&x>=0&&x<m.w)m.t[y][x]=t;}
function add(m,o){m.obj.push(o);rect(m,o.x,o.y,o.x+(o.w||1)-1,o.y+(o.h||1)-1,T.BLOCK);}
Z.widen=function(m){if(m.w>=Z.W)return;const old=m.w;for(let y=0;y<m.h;y++){const edge=y===0||y===m.h-1;m.t[y][old-1]=edge?T.BLOCK:T.GRAS;for(let x=old;x<Z.W;x++)m.t[y][x]=edge||x===Z.W-1?T.BLOCK:T.GRAS;}m.w=Z.W;};
Z.applyCity=function(m,s){if(!m)return;Z.widen(m);const z=s&&s.ziele,st=z?z.stufe:1,bau=z&&z.bau?z.bau.stufe:0,ost=st>=2||bau>=2;
 m.obj=m.obj.filter(o=>!String(o.act||'').startsWith('ziele:')&&!o.ziele);
 // Bautafel und Auftragstafel neben dem Brunnenplatz, Wettbewerbsstand am Wettbewerbstag
 add(m,{k:'stadtplan',x:16,y:11,act:'ziele:plan'});add(m,{k:'auftragstafel',x:16,y:13,act:'ziele:auftrag'});
 if(s&&Z.wettTag(s))add(m,{k:'wettbewerbstand',x:Z.WETT.stand.x,y:Z.WETT.stand.y,w:2,h:1,act:'ziele:wett'});
 if(!ost){for(let y=1;y<m.h-1;y++)for(let x=Z.EAST;x<Z.W-1;x++){m.t[y][x]=T.BAUM;if((x*7+y*5)%3===0||y===1||x===Z.W-2)m.trees.push({x,y,kind:(x+y)%4?'oak':'pine',v:(x*7+y*13)%5});}
  rect(m,24,9,26,10,T.WEG);add(m,{k:'bauschild',x:26,y:8,act:'ziele:plan',ziele:1});m.houseLevel=String(m.houseLevel)+'|z:'+st+':'+bau;return;}
 // Oststraße und untere Straße bis zum Rand, Bäume säumen den Nordrand
 rect(m,24,9,Z.W-2,10,T.WEG);rect(m,22,14,Z.W-2,15,T.WEG);
 for(let x=Z.EAST;x<Z.W-1;x+=3){m.t[1][x]=T.BAUM;m.trees.push({x,y:1,kind:x%2?'oak':'pine',v:x%5});}
 for(const x of [34,41])add(m,{k:'lamp',x,y:12,act:'lamp',ziele:1});
 for(const [x,y] of [[27,8],[33,8],[40,8]])add(m,{k:'blumenkuebel',x,y,act:'ziele:deko',ziele:1});
 for(const [id,g] of Object.entries(Z.GEB)){
  if(st>=g.stufe){if(id==='park')parkObjs(m);else add(m,{k:id,x:g.x,y:g.y,w:g.w,h:g.h,act:'ziele:geb:'+id});}
  else if(bau&&Z.STUFEN[bau-1].geb.includes(id)){rect(m,g.x,g.y,g.x+g.w-1,g.y+g.h-1,T.SAND);add(m,{k:'bau'+Z.bauPhase(s),x:g.x,y:g.y,w:g.w,h:g.h,act:'ziele:geb:'+id});}
  else{rect(m,g.x,g.y,g.x+g.w-1,g.y+g.h-1,T.SAND);add(m,{k:'bauschild',x:g.x+2,y:g.y+g.h-1,act:'ziele:bauland:'+id});}
 }
 if(st>=4){add(m,{k:'bank',x:45,y:12,w:2,h:1,act:'ziele:deko',ziele:1});const V=Z.GEB.villa;add(m,{k:'villazaun',x:V.x,y:V.y+V.h,w:V.w,h:1,act:'ziele:geb:villa',ziele:1});}
 if(st>=5){add(m,{k:'blumenkuebel',x:37,y:16,act:'ziele:deko',ziele:1});add(m,{k:'blumenkuebel',x:43,y:16,act:'ziele:deko',ziele:1});}
 m.houseLevel=String(m.houseLevel)+'|z:'+st+':'+bau+':'+(bau?Z.bauPhase(s):0)+(s&&Z.wettTag(s)?':w':'');};
function parkObjs(m){const P=Z.GEB.park;rect(m,P.x,P.y,P.x+5,P.y+4,T.GRAS);
 // Wege: vom Fußweg der unteren Straße in den Park hinein und quer hindurch (kein Weg endet im Wald)
 for(let x=P.x;x<=P.x+5;x++)m.t[P.y+2][x]=T.WEG;for(let y=P.y-1;y<=P.y+3;y++)m.t[y][P.x+3]=T.WEG;
 // Nordhälfte: Pavillon und Parkbrunnen, dazwischen ein Blumenkübel am Weg
 add(m,{k:'parkpavillon',x:P.x,y:P.y,w:2,h:2,act:'ziele:park',ziele:1});add(m,{k:'fountain',x:P.x+4,y:P.y,w:2,h:2,act:'ziele:park',ziele:1});add(m,{k:'blumenkuebel',x:P.x+2,y:P.y,act:'ziele:deko',ziele:1});
 // Südhälfte: Lottes Beet, Laterne und Bank. Die Obstbäume stehen seitlich am Parkrand, damit sie Bank und Beet nicht verdecken.
 add(m,{k:'blumenbeet',x:P.x,y:P.y+3,w:2,h:1,act:'ziele:park',ziele:1});add(m,{k:'lamp',x:P.x+2,y:P.y+3,act:'lamp',ziele:1});add(m,{k:'bank',x:P.x+4,y:P.y+3,w:2,h:1,act:'ziele:park',ziele:1});
 for(const [x,y] of [[P.x-1,P.y+1],[P.x+6,P.y+1]]){m.t[y][x]=T.BAUM;m.trees.push({x,y,kind:'fruit',v:(x+y)%5});}}
const sa=St.apply;St.apply=function(maps,s){sa(maps,s);if(s)Z.migrate(s);Z.applyCity(maps.stadt,s);Z.applyFarm(maps.farm,s);};
const bmaps=J.buildMaps;J.buildMaps=function(){const all=bmaps();Z.applyCity(all.stadt,null);
 const h=all.haus;if(h&&!h.obj.some(o=>o.k==='trophaeen')){h.obj.push({k:'trophaeen',x:4,y:3,act:'ziele:trophaeen'});h.t[3][4]=T.BLOCK;}return all;};

/* ---------- Neue Bewohnerinnen und Bewohner ---------- */
const base=J.NPCS.mei.look;
const P=(id,n,role,look,bday,love,like,intro,lines,rain)=>{J.NPCS[id]={n,role,home:'stadt',bday,look:{...base,...look},love,like,hate:['kabel'],sched:[[360,'off']],recipe:'suppe',intro,lines,rain,dinner:'Bei Lin schmeckt es nach Feierabend.',gift:{love:'Oh, genau das mag ich! Danke!',like:'Wie lieb von dir.',neutral:'Danke dir.',hate:'Hm, eher nicht.'}};if(!J.NPC_ORDER.includes(id))J.NPC_ORDER.push(id);};
P('frieda','Frieda','Bäckerin',{top:'#e8d9b8',hair:'#c98a4a',style:'bun'},[1,6],['weizen','erdbeere'],['milch','ei'],'Ich bin Frieda. Bei mir gibt es das erste Brot des Tages. Bring mir deinen Weizen!',[['Um vier Uhr knete ich, um sechs duftet die ganze Oststraße.','Dein Weizen hat eine schöne Farbe. Ich zahle dir mehr als die Versandkiste.'],['Am Sonntag backe ich Zimtschnecken. Die halbe Stadt steht dann Schlange.'],['Weißt du, was das Schönste am Backen ist? Dass am Ende alle zusammen am Tisch sitzen.']],'Bei Regen gehen die Brötchen besonders gut.');
P('lotte','Lotte','Floristin',{top:'#c97a9a',hair:'#6b4a8a',style:'short'},[0,3],['blume','mondblume'],['beeren','tee'],'Hallo, ich bin Lotte. Blumen sind meine Sprache. Gartenblumen von deinem Hof kaufe ich gern.',[['Gartenblumen wachsen in vier Tagen. Nur der Winter ist ihnen zu kalt.','Im Park blühen meine Lieblinge, gleich neben dem Pavillon.'],['Eine Mondblüte im Schaufenster? Davon träume ich.'],['Danke, dass du Lindenstadt bunt machst.']],'Regen ist das beste Blumenwasser.');
P('konrad','Konrad','Hotelier',{top:'#3f4f6f',hair:'#5a4a3a',style:'short'},[2,9],['nudeln','kuerbissuppe'],['ei','milch','tee'],'Konrad, Hotel Lindenhof. Ohne Ihre Stadt gäbe es mein Hotel nicht.',[['Unsere Gäste fragen nach frischen Eiern vom Mondhof.','Die Zimmer zum Park sind immer zuerst ausgebucht.'],['Ein Hotel lebt von seinen Nachbarn. Und von gutem Frühstück.'],['Sie haben aus einem Dorf eine Stadt gemacht. Das schreibe ich ins Gästebuch.']],'Bei Regen sitzen die Gäste im Wintergarten.');
P('greta','Greta','Bäuerin vom Nachbarhof',{top:'#7a9a4a',hair:'#d8b060',style:'bun'},[1,12],['kuerbis','mais'],['pilz','erdbeere'],'Ich bin Greta vom Sonnenhof hinter den Hügeln. Bereit für den Erntewettbewerb?',[['Ich verrate dir nichts über meinen Korb. Na gut: Er ist schwer!','Riesenpflanzen zählen beim Wettbewerb wie fünf und mehr.'],['Verlieren macht mir nichts. Gewinnen macht aber mehr Spaß.'],['Du bist die beste Nachbarin, die ich je hatte.']],'Regen? Gut für meine Kürbisse.');
const loc0=St.location;St.location=function(s,id,festival){
 if(s&&s.ziele&&!festival){const z=s.ziele,day=s.min>=420&&s.min<1200,h=Math.floor(s.min/60)%2;
  if(id==='greta'&&Z.wettHeute(s))return {map:'stadt',x:Z.WETT.greta[0],y:Z.WETT.greta[1]};
  if(id==='greta'&&z.stufe>=3&&s.min>=780&&s.min<1080&&s.day%3===0)return {map:'stadt',x:30,y:21};
  for(const [gid,g] of Object.entries(Z.GEB))if(g.npc===id&&z.stufe>=g.stufe&&day)return {map:'stadt',x:g.spot[0]+(id==='falk'?0:h),y:g.spot[1]};}
 return loc0(s,id,festival);};

/* ---------- Spielaktionen (Ergebnisobjekte für runPost in jm-game.js) ---------- */
const btn=(a,t,fn,off)=>({a,t,fn,off:!!off});
Z.act=function(s,a){Z.migrate(s);
 if(a==='plan'||a.startsWith('bauland'))return Z.planPanel(s);
 if(a==='auftrag')return Z.auftragPanel(s);
 if(a==='wett')return Z.wettPanel(s);
 if(a==='trophaeen')return Z.trophPanel(s);
 if(a==='park')return {note:'Der Stadtpark: Pavillon, Brunnen, eine Bank und Lottes Beet. Seit es ihn gibt, zahlen alle Mieter gern ein Viertel mehr.'};
 if(a==='deko')return {note:'Lindenstadt wird jeden Tag bunter.'};
 if(a.startsWith('geb:'))return Z.gebPanel(s,a.slice(4));
 return null;};
const zeile=t=>t.k==='money'?fmt(t.hat)+' / '+fmt(t.soll)+' G':Math.min(t.hat,t.soll)+' / '+t.soll+' '+Z.name(t.k);
Z.planPanel=function(s){const z=s.ziele,n=z.stufe,next=Z.STUFEN[n],p=['Lindenstadt ist '+Z.STUFEN[n-1].t+' (Stadtstufe '+n+' von 5).'];
 if(z.bau){const c=Z.STUFEN[z.bau.stufe-1];p.push('Im Bau: '+c.t+'. '+c.d,'Noch '+Math.max(0,z.bau.due-s.day)+' Nächte. Alles ist bezahlt.');return {panel:{t:'Stadtentwicklung',p,buttons:[]}};}
 if(!next){p.push('Alle fünf Stufen sind gebaut. Lindenstadt ist eine richtige Kleinstadt. Danke!');return {panel:{t:'Stadtentwicklung',p,buttons:[]}};}
 p.push('Nächste Stufe: '+next.t+'. '+next.d,'Kosten: '+fmt(next.money)+' G, '+Object.entries(next.need).map(([k,q])=>q+' '+J.ITEMS[k].n).join(', ')+'. Bauzeit '+next.days+' Nächte.','Dein Stand: '+teile(s,next).map(zeile).join(' · '));
 const v=Z.vorbedingung(s),f=Z.fehlt(s,next);if(v)p.push(v);else if(f.length)p.push('Es fehlen noch: '+f.join(', ')+'. Material verkauft Timo im Dorf.');
 return {panel:{t:'Stadtentwicklung',p,buttons:[btn('stufe-bauen','Stufe '+next.n+' verbindlich bauen',()=>Z.orderStufe(s)?{hud:true,rebuild:true,sfx:'buy',banner:next.t+' im Bau',note:'Die Bauleute rücken an. In '+next.days+' Nächten ist es fertig.'}:{note:'Dafür fehlt noch etwas.'},v||f.length)]}};};
Z.auftragPanel=function(s){const a=s.ziele.auftrag;
 if(!a||a.st!=='offen')return {panel:{t:'Auftragstafel',p:[a&&a.st==='fertig'?'Der letzte Auftrag ist erfüllt. Danke! Ein neuer kommt in den nächsten Tagen.':'Gerade hängt kein Auftrag aus. Morgen wieder schauen.','Erfüllt: '+s.ziele.auftraege.ok+' · verpasst: '+s.ziele.auftraege.fail],buttons:[]}};
 const left=Math.max(0,a.due-s.day),have=Z.lieferbar(s,a.k),n=Math.min(have,a.n-a.got);
 return {panel:{t:'Großauftrag für '+(J.NPCS[a.who]?J.NPCS[a.who].n:a.who),p:[a.txt,'Gesucht: '+a.n+'× '+Z.name(a.k)+' · geliefert '+a.got+' · Lohn '+fmt(a.rew)+' G','Frist: '+(left?'noch '+left+(left===1?' Tag':' Tage'):'heute letzter Tag')+'. Teillieferungen zählen. Wird es knapp, bezahlt '+(J.NPCS[a.who]?J.NPCS[a.who].n:'man')+' das Gelieferte trotzdem.','Im Rucksack: '+have+'.'],
  buttons:[btn('auftrag-liefern',n?n+'× liefern':'Nichts zum Liefern dabei',()=>{const r=Z.deliver(s);return r.done?{hud:true,sfx:'fanfare',banner:'Großauftrag erfüllt! +'+fmt(a.rew)+' G',note:'Danke! '+fmt(a.rew)+' G für dich.'}:{hud:true,sfx:'buy',note:r.taken+'× geliefert. Noch '+(a.n-a.got)+' offen.'};},!n)]}};};
Z.wettPanel=function(s){const w=Z.wett(s);
 if(!Z.wettHeute(s))return {note:'Der Wettbewerb läuft von 9 bis 18 Uhr.'};
 if(w.st)return {panel:{t:'Erntewettbewerb',p:['Ergebnis: du '+w.punkte+' Punkte, Greta '+w.greta+' Punkte. '+(w.st==='gewonnen'?'Du hast gewonnen!':'Greta hat diesmal gewonnen.'),'Der nächste Wettbewerb ist in der nächsten Jahreszeit.'],buttons:[]}};
 const opts=Object.keys(s.inv).filter(Z.zeigbar).sort((a,b)=>J.ITEMS[b].sell-J.ITEMS[a].sell).slice(0,6);
 const p=['Zeig bis zu drei Stücke. Gezählt wird ihr Wert. Greta peilt '+Z.gretaScore(s)+' Punkte an.','Eingereicht: '+(w.items.length?w.items.map(k=>J.ITEMS[k].n+' ('+J.ITEMS[k].sell+')').join(', ')+' = '+w.items.reduce((a,k)=>a+J.ITEMS[k].sell,0)+' Punkte':'noch nichts')+'.'];
 const b=w.items.length<3?opts.map(k=>btn('wett-'+k,'Zeigen: '+J.ITEMS[k].n+' · '+J.ITEMS[k].sell+' Punkte',()=>{Z.einreichen(s,k);return Object.assign(Z.wettPanel(s),{hud:true});})):[];
 b.push(btn('wett-bewerten','Bewerten lassen',()=>{const r=Z.bewerten(s);if(!r)return {note:'Erst mindestens ein Stück zeigen.'};return {hud:true,sfx:r.sieg?'fanfare':'blip',banner:r.sieg?'Erntewettbewerb gewonnen!':'Knapp vorbei',lines:[{who:'greta',text:'Mein Korb: '+r.greta+' Punkte. Deiner: '+r.punkte+' Punkte.'},{who:'greta',text:r.sieg?'Du hast gewonnen! Hier sind '+fmt(r.geld)+' G und die Trophäe. Glückwunsch!':'Diesmal hab ich die Nase vorn. Für dich gibt es '+fmt(r.geld)+' G fürs Mitmachen. Nächstes Mal wieder?'}]};},!w.items.length));
 return {panel:{t:'Erntewettbewerb mit Greta',p,buttons:b}};};
Z.gebPanel=function(s,id){const g=Z.GEB[id];if(!g)return null;
 if(!Z.offen(s,id)){if(Z.inBau(s,id))return {note:g.n+': Baustelle, Phase '+Z.bauPhase(s)+' von 3. Noch '+Math.max(0,s.ziele.bau.due-s.day)+' Nächte.'};return Z.planPanel(s);}
 const N=g.npc&&J.NPCS[g.npc],p=[],b=[];
 if(g.pacht)p.push(N.n+' zahlt dir jeden Morgen '+fmt(g.pacht)+' G Pacht.');if(g.miete)p.push(N.n+' zahlt '+fmt(g.miete)+' G Miete am Tag'+(Z.offen(s,'park')?', mit Parkblick '+fmt(g.miete*(1+Z.GEB.park.bonus))+' G':'')+'.');
 if(g.ankauf){const it=J.ITEMS[g.ankauf.k],rest=g.ankauf.limit-Z.ankaufHeute(s,id),have=s.inv[g.ankauf.k]||0,n=Math.min(rest,have);p.push('Ankauf: '+it.n+' für '+g.ankauf.p+' G (Versandkiste '+it.sell+' G). Heute noch '+rest+' Stück.');
  b.push(btn('ankauf-'+id,n?n+'× '+it.n+' verkaufen · '+fmt(n*g.ankauf.p)+' G':'Kein '+it.n+' dabei',()=>{const m=Z.verkaufen(s,id,n);return Object.assign(Z.gebPanel(s,id),{hud:true,sfx:'buy'},m?{banner:'+'+fmt(m*g.ankauf.p)+' G'}:{});},!n));}
 for(const q of g.verkauf||[])for(const n of [1,5])b.push(btn('kauf-'+q.k+'-'+n,n+'× '+J.ITEMS[q.k].n+' · '+fmt(q.p*n)+' G',()=>Object.assign(Z.kaufen(s,id,q.k,n)?{hud:true,sfx:'buy'}:{},Z.gebPanel(s,id)),s.money<q.p*n));
 if(id==='hotel')p.push('Die Hotelgäste bringen Großaufträge mit: große Eierbestellungen fürs Frühstück.');
 if(id==='villa')p.push('Herr Falk wollte einst Haus Nummer 7. Jetzt hat er eine eigene Villa mit Fernrohr auf dem Dach.');
 if(N)p.push(N.n+' steht tagsüber vor dem Haus. Antippen zum Reden.');
 return {panel:{t:g.n,p,buttons:b}};};
Z.HOF_ICON={silber:'🪣',felder:'🌱',gold:'✨'};
Z.hofPanel=function(s){const h=s.ziele.hof,p=['Timo schärft Werkzeuge beim Schmied in Lindenstadt und legt Felder an. Eine Arbeit gleichzeitig.'],b=[],cards=[];
 for(const [k,c] of Object.entries(Z.HOF)){const done=h[k],job=h.job&&h.job.k===k,f=Z.fehlt(s,c),req=c.req&&!h[c.req];
  cards.push({icon:Z.HOF_ICON[k],t:c.n,d:c.d+' Kosten: '+fmt(c.money)+' G, '+Object.entries(c.need).map(([i,q])=>q+' '+J.ITEMS[i].n+' ('+(s.inv[i]||0)+' da)').join(', ')+'.',st:done?'ok':job?'job':'',tag:done?'fertig':job?'in Arbeit, noch '+Math.max(0,h.job.due-s.day)+' Nächte':req?'erst Silberwerkzeug':f.length?'fehlt: '+f.join(', '):'bereit'});
  if(!done&&!job)b.push(btn('hof-'+k,c.n+' beauftragen',()=>Z.orderHof(s,k)?{hud:true,sfx:'buy',note:'Timo macht sich an die Arbeit: '+c.n+'.'}:{note:'Dafür fehlt noch: '+Z.fehlt(s,c).join(', ')+'.'},!!(h.job||req||f.length)));}
 return {panel:{t:'Hof ausbauen bei Timo',p,cards,buttons:b}};};
Z.trophPanel=function(s){const st=Z.sterne(s),tr=Z.trophaeen(s),star=n=>'★'.repeat(n)+'☆'.repeat(5-n),icon=t=>/wettbewerb/.test(t.id)?'🎃':/auftrag/.test(t.id)?'📜':/stadt/.test(t.id)?'🏘️':/^hof-/.test(t.id)?'🧰':'🏆';
 const cards=tr.map(t=>({icon:icon(t),t:t.t,d:'Spieltag '+t.day,st:'ok'}));
 // Freie Plätze zeigen, was noch zu holen ist (nur Anzeige, keine neue Regel)
 const frei=[];if(st.stadt.n<5)frei.push('Stadtstufe '+(st.stadt.n+1)+' · '+Z.STUFEN[st.stadt.n].t);if(!tr.some(t=>/^wett-/.test(t.id)))frei.push('Erntewettbewerb gegen Greta gewinnen');
 if(!tr.some(t=>t.id==='auftrag5'))frei.push('Fünf Großaufträge erfüllen');
 for(const f of frei.slice(0,3))cards.push({icon:'·',t:f,d:'Noch frei im Regal',st:'leer'});
 return {panel:{t:'Trophäenwand',p:['Stadt-Sterne '+star(st.stadt.n)+' · Hof-Sterne '+star(st.hof.n)],cards,p2:tr.length?[]:['Das Regal wartet noch auf die erste Trophäe.'],buttons:[]}};};

/* ---------- Hinweisbox, Wegweiser, Kalender ---------- */
Z.goal=function(s){if(!s||!s.ziele||!s.ziele.brief)return null;const z=s.ziele;
 if(Z.wettHeute(s)&&!Z.wett(s).st)return {t:'Erntewettbewerb heute',sub:'Lindenstadt, Stand am Brunnen, bis 18 Uhr'};
 const a=z.auftrag;if(a&&a.st==='offen'&&(Z.lieferbar(s,a.k)>=a.n-a.got||a.due-s.day<=1))return {t:'Großauftrag: '+a.n+'× '+Z.name(a.k),sub:'geliefert '+a.got+' · noch '+Math.max(0,a.due-s.day)+' Tage · Tafel in Lindenstadt'};
 const n=Z.naechste(s)[0];if(n&&!n.bau&&n.teile[0])return {t:n.kurz||('Nächstes Ziel: '+n.t),sub:zeile(n.teile[0])+(n.ok?' · bereit zum Bauen':'')};
 if(a&&a.st==='offen')return {t:'Großauftrag: '+a.n+'× '+Z.name(a.k),sub:'geliefert '+a.got+' · noch '+Math.max(0,a.due-s.day)+' Tage · Tafel in Lindenstadt'};
 return n?{t:n.t,sub:n.d.slice(0,60)}:null;};
Z.target=function(s){if(!s||!s.ziele||!s.ziele.brief)return null;if(Z.wettHeute(s)&&!Z.wett(s).st)return {map:'stadt',x:Z.WETT.stand.x,y:Z.WETT.stand.y+1,t:'Erntewettbewerb heute',sub:'Bis zu drei Ernten zeigen'};
 const a=s.ziele.auftrag;if(a&&a.st==='offen'&&Z.lieferbar(s,a.k)>=a.n-a.got)return {map:'stadt',x:16,y:14,t:'Großauftrag liefern',sub:a.n+'× '+Z.name(a.k)+' · Tafel in Lindenstadt'};return null;};
if(J.Post){const g0=J.Post.goal;J.Post.goal=function(s){return g0(s)||Z.goal(s);};const t0=J.Post.target;J.Post.target=function(s){return t0(s)||Z.target(s);};}
Z.calMarks=function(s,se,d){return se<3&&d===Z.WETT.tag?['Erntewettbewerb']:[];};

/* ---------- Tagebuch: Seite „Ziele“ ---------- */
Z.page=function(s,esc){esc=esc||String;const st=Z.sterne(s),bar=(n,m)=>`<div class="pbar"><i style="width:${Math.round(n/m*100)}%"></i></div>`,star=(n,m)=>'★'.repeat(n)+'☆'.repeat(m-n);
 let h=`<div class="qcard"><small>Stadt-Sterne</small><b>${star(st.stadt.n,5)} · ${esc(Z.STUFEN[st.stadt.n-1].t)}</b>${bar(st.stadt.n,5)}<small>${st.stadt.list.map(([t,ok])=>(ok?'✓ ':'· ')+esc(t)).join(' ')}</small></div>`;
 h+=`<div class="qcard"><small>Hof-Sterne</small><b>${star(st.hof.n,5)}</b>${bar(st.hof.n,5)}<small>${st.hof.list.map(([t,ok])=>(ok?'✓ ':'· ')+esc(t)).join(' ')}</small></div>`;
 h+='<h3>Nächstes Ziel</h3>'+Z.naechste(s).map(n=>`<div class="row"><div class="tx"><b>${n.ok?'✓ bereit · ':''}${esc(n.t)}</b><small>${esc(n.d)}</small>${n.teile.map(t=>`<small>${esc(zeile(t))}</small>${bar(Math.min(t.hat,t.soll),t.soll)}`).join('')}${n.hinweis?`<small>${esc(n.hinweis)}</small>`:''}</div></div>`).join('');
 const tr=Z.trophaeen(s);h+=`<h3>Trophäenwand</h3>`+(tr.length?`<div class="trophies">${tr.map(t=>`<div class="row"><div class="tx"><b>🏆 ${esc(t.t)}</b><small>Spieltag ${t.day}</small></div></div>`).join('')}</div>`:'<p class="sub">Noch leer. Die erste Trophäe gibt es für die Bäckerei, den ersten Großauftrag oder einen Sieg gegen Greta.</p>');
 return h;};
})();
