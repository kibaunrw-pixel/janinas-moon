"use strict";
/* Briefkasten (Etappe 1): tägliche Post und drei Geheimnis-Missionen.
   Baut auf dem bestehenden Postsystem auf (S.mail / S.mailQ). Kein zweites Postfach.
   Alle Fristen sind Spieltage, alle Belohnungen tragen einen gespeicherten Abholvermerk.

   Entscheidung Miete: Die Miete wird weiterhin ausschließlich von JM.Stadt.advance in der Nacht
   gutgeschrieben (mit lastRent-Sperre). Der Mietbrief ist nur Quittung. So gibt es genau eine
   Geldquelle; ein verlorener, doppelt gelesener oder neu geladener Brief kann nie zusätzlich auszahlen. */
(function(){
const J=window.JM,X=J.Post={},T=J.T,St=J.Stadt;
const MISSIONS=X.MISSIONS=['schatz','haus7','brunnen'];
X.cost7={money:800,holz:20,stein:10,days:2};
X.costWell={money:300,stein:15,kupfer:5};
X.treasure={money:300,items:{kupfer:3}};
X.mounds=[{id:'w',x:10,y:19,n:'westlich'},{id:'o',x:17,y:19,n:'östlich'},{id:'s',x:14,y:21,n:'südlich'}];
X.answer='o';
X.house7={x:3,y:16,w:5,h:4,door:[5,20]};
X.well={x:28,y:21};
X.midnightFrom=1380;// 23:00 – um 24:00 endet der Spieltag ohnehin

/* ---------- Bewohnerin von Haus Nr. 7 ---------- */
J.NPCS.elva={n:'Elva',role:'Sternkundige',home:'stadt',bday:[3,12],
 look:{...J.NPCS.mei.look,top:'#4b4a7a',hair:'#d8d4e6',style:'bun'},
 love:['mondstein'],like:['tee','pilz'],hate:['kabel'],sched:[[360,'off']],recipe:'suppe',
 intro:'Ich bin Elva. Ich wohne jetzt in Haus Nummer 7 und zähle nachts die Sterne.',
 lines:[['Ich bin Elva. Haus Nummer 7 ist wieder hell, dank dir.'],['Heute Nacht steht der Mond tief über dem Bahnhof. Schau mal hin.'],['Weißt du, warum ich die Briefe ohne Namen geschickt habe? Ich war zu schüchtern. Das ist vorbei.']],
 rain:'Bei Regen sieht man keine Sterne. Dafür lese ich.',dinner:'Bei Lin sitze ich am liebsten am Fenster.',
 gift:{love:'Ein Mondstein! Den stelle ich ans Fernrohr.',like:'Wie aufmerksam!',neutral:'Danke dir.',hate:'Damit kann ich wenig anfangen.'}};
J.NPC_ORDER.push('elva');

/* ---------- Zustand und Migration ---------- */
X.migrate=function(s){
 let p=s.post;if(!p||typeof p!=='object')p=s.post={};
 p.v=1;if(!Number.isInteger(p.seq))p.seq=0;
 if(!p.m||typeof p.m!=='object')p.m={};
 for(const id of MISSIONS){const m=p.m[id];p.m[id]=m&&typeof m==='object'&&typeof m.st==='string'?m:{st:''};}
 for(const k of ['req','orders'])if(!p[k]||typeof p[k]!=='object')p[k]={};
 const day=Number.isFinite(s.day)?s.day:1;
 if(!Number.isFinite(p.lastMyst))p.lastMyst=day-2;
 if(!Number.isFinite(p.lastGift))p.lastGift=day-1;
 if(!Number.isFinite(p.lastDay))p.lastDay=day;
 return s;
};
const mig=J.Ausbau.migrate;
J.Ausbau.migrate=function(s){mig(s);X.migrate(s);return s;};

/* ---------- Karten: Haus Nr. 7, alter Brunnen, Schatzhügel ---------- */
function place(m,o){m.post=m.post||{orig:{}};m.obj.push(o);for(let y=o.y;y<o.y+(o.h||1);y++)for(let x=o.x;x<o.x+(o.w||1);x++){const k=x+','+y;if(!(k in m.post.orig))m.post.orig[k]=m.t[y][x];m.t[y][x]=T.BLOCK;}}
function clear(m){if(!m.post)return;m.obj=m.obj.filter(o=>!(o.act||'').startsWith('post:'));for(const [k,t] of Object.entries(m.post.orig)){const [x,y]=k.split(',').map(Number);m.t[y][x]=t;}m.post.orig={};}
X.apply=function(maps,s){
 const st=id=>s&&s.post?s.post.m[id].st:'';
 const c=maps.stadt;if(c){clear(c);const h=X.house7,k=st('haus7')==='fertig'?'house':st('haus7')==='bau'?'bau3':'ruine';
  place(c,{k,x:h.x,y:h.y,w:h.w,h:h.h,act:'post:haus7'});c.houseLevel=String(c.houseLevel)+'|h7:'+k;}
 const v=maps.village;if(v){clear(v);const k=st('brunnen')==='fertig'?'brunnen_neu':'brunnen_alt';place(v,{k,x:X.well.x,y:X.well.y,act:'post:brunnen'});v.houseLevel='post:'+k;}
 const f=maps.forest;if(f){clear(f);const on=st('schatz')==='karte';if(on)for(const m of X.mounds)place(f,{k:'erdhuegel',x:m.x,y:m.y,act:'post:huegel:'+m.id});f.houseLevel='post:'+(on?'karte':'-');}
 return maps;
};
const sApply=St.apply;St.apply=function(maps,s){sApply(maps,s);X.apply(maps,s);};
const bm=J.buildMaps;J.buildMaps=function(){return X.apply(bm(),null);};

/* ---------- Miete und Bewertungen ---------- */
X.stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
X.rate=function(s,i){const p=s.city.plots[i],t=p.tenant,hearts=Math.floor(((s.npc&&s.npc[t]&&s.npc[t].p)||0)/100),why=[];
 let r=3;if(hearts>=2){r++;why.push('Du schaust oft vorbei und wir verstehen uns gut (+1).');}else why.push('Ich würde mich freuen, wenn du öfter vorbeischaust (ab zwei Herzen +1).');
 if(s.post.m.haus7.st==='fertig'){r++;why.push('Seit Haus Nummer 7 wieder bewohnt ist, fühlt sich die Straße lebendig an (+1).');}else why.push('Das leere Haus Nummer 7 ein Stück weiter macht mir nachts ein wenig Sorgen.');
 return {r:Math.max(1,Math.min(5,r)),why};};

/* ---------- Briefbausteine ---------- */
const NAMES=()=>J.CONFIG&&J.CONFIG.von;
function letter(s,o){s.post.seq++;return Object.assign({id:'p'+s.day+'-'+s.post.seq,day:s.day,read:false},o);}
const fill=(s,txt)=>txt.replace(/\{name\}/g,s.name||'Janina');
const placeName=i=>St.places[i].n;
const TENANTS=['ida','noah','mara'];
const GIVERS=['mei','lin','rosa','paula','henk','timo'].filter(id=>J.NPCS[id]);
const GREET=[
 ['rosa','Grüße aus dem Rathaus','Liebe {name},\n\nim Dorf reden alle von deinem Hof. Die Dorfchronik bekommt bald ein neues Kapitel, und es handelt von dir.\n\nHerzlich,\nRosa'],
 ['mei','Neues aus dem Markt','Hallo {name},\n\nich habe heute frische Ware bekommen. Komm gern vorbei, ich lege dir das Schönste zurück.\n\nMei'],
 ['henk','Ein Gruß vom See','Moin {name},\n\nder Wind dreht. Morgen beißen die Fische. Glaub mir, ich höre das am Wasser.\n\nHenk'],
 ['paula','Gackernde Neuigkeiten','Hey {name}!\n\nMeine Hühner haben heute zusammen elf Eier gelegt. Rekord! Ich musste es einfach jemandem erzählen.\n\nPaula'],
 ['lin','Aus der Küche','Liebe {name},\n\nich probiere gerade eine neue Brühe. Wenn sie gelingt, bist du die Erste, die kosten darf.\n\nLin'],
 ['timo','Späne und Pläne','Hallo {name},\n\nin der Zimmerei duftet es nach frischem Holz. Wenn du etwas bauen willst: Ich bin da.\n\nTimo']
].filter(g=>J.NPCS[g[0]]);
X.giftPool=day=>{const se=Math.floor((day-1)/J.DPS)%4;return [...J.FORAGE[se],'tee'];};

/* ---------- Geheimnisbriefe ---------- */
const START={
 schatz:s=>letter(s,{from:'Unbekannt',kind:'geheim',mis:'schatz',t:'Eine zerknitterte Karte',
  b:'Ein vergilbtes Blatt ohne Absender. Darauf eine Skizze vom Mondwald: der Mondbaum und drei kleine Erdhügel rundherum. Einer liegt im Westen, einer im Osten, einer im Süden.\n\nDarunter steht in krakeliger Schrift:\n„Wenn die Sonne am Abend im Westen versinkt, wirft der Mondbaum seinen langen Schatten. Grab dort, wo der Schatten endet. Nur einer der Hügel hält, was ich versteckt habe.“'}),
 haus7:s=>letter(s,{from:'Unbekannt',kind:'geheim',mis:'haus7',t:'Ein anonymer Brief',
  b:'Keine Unterschrift, nur eine schnelle Handschrift:\n\n„Im Haus Nummer 7 stimmt etwas nicht. Es steht seit Jahren leer, und doch brennt dort nachts manchmal Licht. Lindenstadt, unten links an der Straße zum Bahnhof. Sieh es dir an. Aber sag niemandem, dass der Brief von mir ist.“'}),
 brunnen:s=>letter(s,{from:'Unbekannt',kind:'geheim',mis:'brunnen',t:'Eine seltsame Einladung',
  b:'Ein Umschlag aus dünnem, silbrigem Papier. Nur ein paar Zeilen:\n\n„Komm heute Nacht zum alten Brunnen, wenn die Uhr auf Mitternacht zugeht, zwischen 23 und 24 Uhr. Er steht ganz im Südosten des Dorfes, hinter dem Weg am See.“\n\nDie Tinte glänzt wie Mondlicht.'})
};
X.activeMission=s=>MISSIONS.find(id=>{const st=s.post.m[id].st;return st&&st!=='fertig';})||null;

/* ---------- Eine Nacht: 1–3 Briefe ---------- */
X.night=function(s,info,rng){
 X.migrate(s);const p=s.post;if(p.lastDay>=s.day)return [];p.lastDay=s.day;
 rng=rng||Math.random;info=info||{};const must=[],opt=[];
 // Fortsetzungen laufender Missionen (immer zugestellt)
 const h=p.m.haus7,b=p.m.brunnen;
 if(h.st==='gesehen'){h.st='schluesselpost';must.push(letter(s,{from:'Unbekannt',kind:'geheim',mis:'haus7',key7:true,t:'Ein Schlüssel ohne Absender',
  b:'Im Umschlag liegt ein schwerer, alter Schlüssel mit einer eingeritzten 7. Dazu ein Zettel:\n\n„Du hast nachgesehen. Danke. Das Haus soll nicht länger leer stehen. Schließ auf und lass es von Timo herrichten.“'}));}
 if(h.st==='bau'&&s.day>=h.due){h.st='fertig';h.done=s.day;must.push(letter(s,{from:'elva',kind:'geheim',mis:'haus7',t:'Licht in Haus Nummer 7',
  b:fill(s,'Liebe {name},\n\nich war es, die nachts in Haus Nummer 7 Licht gemacht hat. Ich habe dort früher die Sterne beobachtet und konnte das Haus einfach nicht loslassen. Den Brief und den Schlüssel habe ich dir geschickt. Ich hatte nicht den Mut, selbst zu fragen.\n\nJetzt ist das Haus wieder hell, und ich bin eingezogen. Besuch mich tagsüber vor Nummer 7 in Lindenstadt.\n\nElva')}));}
 if((b.st==='dokument'||b.st==='fertig')&&b.doc&&!b.ghost&&s.day>b.doc){b.ghost=s.day;must.push(letter(s,{from:'Hedwig',kind:'geheim',mis:'brunnen',ghost:true,t:'Brief von einem Geist',
  b:fill(s,'Liebe {name},\n\nich habe früher in diesem Dorf gewohnt. Mein Name war Hedwig. Danke, dass du um Mitternacht gekommen bist.\n\nDer alte Brunnen hat uns alle versorgt. Wenn sein Wasser wieder fließt, kann ich ruhig schlafen. Was er braucht, steht im alten Dokument.\n\nHedwig')}));}
 // Neues Geheimnis: nur, wenn keine Mission läuft
 if(!X.activeMission(s)){const next=MISSIONS.find(id=>!p.m[id].st),gap=s.day-p.lastMyst;
  if(next&&gap>=3&&(gap>=5||rng()<.5)){p.m[next].st='brief';p.m[next].since=s.day;p.lastMyst=s.day;must.push(START[next](s));}}
 // Mietquittung: das Geld hat Stadt.advance bereits gutgeschrieben
 if(info.rent>0){const paid=s.city.plots.map((q,i)=>({q,i})).filter(({q})=>q.tenant&&q.lastRent===s.day);
  if(paid.length)must.push(letter(s,{from:paid.length===1?paid[0].q.tenant:'Deine Mieter',kind:'miete',t:'Mietbrief aus Lindenstadt',
   b:'Heute Morgen gezahlt:\n'+paid.map(({q,i})=>'· '+J.NPCS[q.tenant].n+' ('+placeName(i)+'): '+St.rentFor(q)+' G').join('\n')+'\n\nZusammen: '+info.rent+' G. Das Geld ist schon auf deinem Konto. Dieser Brief ist nur deine Quittung.'}));}
 // Normale Briefe, nach Wichtigkeit
 s.city.plots.forEach((q,i)=>{
  if(q.ready&&!q.tenant&&!p.req[i])opt.push({pr:1,make:()=>{p.req[i]=s.day;const t=TENANTS[i];return letter(s,{from:t,kind:'anfrage',offer:{plot:i},t:'Mietanfrage für '+placeName(i),
   b:fill(s,'Liebe {name},\n\nich habe gehört, dass das Haus '+placeName(i)+' in Lindenstadt fertig ist. Ich würde sehr gern einziehen. Die Miete von '+St.cost.rent+' G zahle ich jeden Morgen pünktlich.\n\nMagst du zusagen?\n\n'+J.NPCS[t].n)});}});
  const o=p.orders[i];if(o&&q.ready&&!o.thanked)opt.push({pr:1,make:()=>{o.thanked=s.day;return letter(s,{from:o.from,kind:'dank',att:{money:150},t:'Danke für das neue Haus',
   b:fill(s,'Liebe {name},\n\ndas Haus '+placeName(i)+' steht! Wie versprochen lege ich dir 150 G als Dank bei.\n\n'+J.NPCS[o.from].n)});}});
  if(q.tenant&&s.day-q.since>=7&&s.day-(q.ratedDay||q.since)>=7)opt.push({pr:2,make:()=>{const {r,why}=X.rate(s,i);q.rating=r;q.ratedDay=s.day;return letter(s,{from:q.tenant,kind:'bewertung',rating:r,t:'Bewertung: '+placeName(i)+' '+X.stars(r),
   b:fill(s,'Liebe {name},\n\nmeine Bewertung für das Haus '+placeName(i)+': '+X.stars(r)+' ('+r+' von 5)\n\n'+why.join('\n')+'\n\nAb vier Sternen zahle ich gern mehr: Meine Tagesmiete beträgt jetzt '+St.rentFor(q)+' G.\n\n'+J.NPCS[q.tenant].n)});}});
 });
 const openOrder=Object.entries(p.orders).some(([i,o])=>!s.city.plots[i].ready);
 const free=s.city.plots.findIndex((q,i)=>q.start===null&&!q.ready&&!p.orders[i]);
 if(!openOrder&&free>=0)opt.push({pr:3,make:()=>{const from=['paula','henk','timo'].filter(id=>J.NPCS[id])[free%3]||'rosa';p.orders[free]={from,day:s.day};return letter(s,{from,kind:'auftrag',order:{plot:free},t:'Ein Bauwunsch für Lindenstadt',
  b:fill(s,'Liebe {name},\n\nin Lindenstadt fehlen Wohnungen. Ich wünsche mir ein neues Haus auf dem Bauplatz '+placeName(free)+'. Die Bautafel steht direkt an der Straße.\n\nWenn das Haus fertig ist, bekommst du von mir 150 G als Dank.\n\n'+J.NPCS[from].n)});}});
 if(s.day-p.lastGift>=3&&rng()<.6)opt.push({pr:4,make:()=>{p.lastGift=s.day;const from=GIVERS[Math.floor(rng()*GIVERS.length)],pool=X.giftPool(s.day),k=pool[Math.floor(rng()*pool.length)];
  return letter(s,{from,kind:'geschenk',att:{items:{[k]:2}},t:'Eine kleine Überraschung',b:fill(s,'Liebe {name},\n\neinfach so, weil du so fleißig bist: zwei Mal '+J.ITEMS[k].n+' für dich. Sie liegen im Umschlag.\n\n'+J.NPCS[from].n)});}});
 // Missionsbriefe und Quittung immer; Mietanfrage/Dank (Priorität 1) bis höchstens drei Briefe;
 // alles Weitere nur bis zur zufälligen Tagesmenge 1–3. Nicht zugestellte Briefe entstehen aus dem Zustand später neu.
 const want=1+Math.floor(rng()*3),queued=(s.mailQ||[]).length,out=must.slice();
 opt.sort((a,c)=>a.pr-c.pr);for(const o of opt){const n=out.length+queued;if(n>=3||(o.pr>1&&n>=want))continue;out.push(o.make());}
 if(out.length+queued<want||out.length+queued===0){const g=GREET[(s.day+p.seq)%GREET.length];out.push(letter(s,{from:g[0],kind:'gruss',t:g[1],b:fill(s,g[2])}));}
 s.mailQ=s.mailQ||[];s.mailQ.push(...out);return out;
};

/* ---------- Lesen, Zusagen, Beilagen ---------- */
X.read=function(s,i){const m=s.mail[i];if(!m)return false;m.read=true;const P=s.post.m;
 if(m.mis==='schatz'&&P.schatz.st==='brief'){P.schatz.st='karte';return true;}
 if(m.mis==='haus7'&&!m.key7&&P.haus7.st==='brief'){P.haus7.st='suche';return true;}
 if(m.key7&&P.haus7.st==='schluesselpost'){P.haus7.st='schluessel';return true;}
 if(m.mis==='brunnen'&&!m.ghost&&!m.doc&&P.brunnen.st==='brief'){P.brunnen.st='einladung';return true;}
 return false;};
X.accept=function(s,i){const m=s.mail[i];if(!m||!m.offer||m.offer.done)return false;const ok=St.rent(s,m.offer.plot);m.offer.done=ok?'zugesagt':'vergeben';return ok;};
X.claim=function(s,i){const m=s.mail[i];if(!m||!m.att||m.att.taken)return null;const a=m.att;
 if(a.money){s.money+=a.money;if(s.stats)s.stats.earned=(s.stats.earned||0)+a.money;}
 for(const [k,n] of Object.entries(a.items||{}))s.inv[k]=(s.inv[k]||0)+n;a.taken=s.day;return a;};

/* ---------- Mission Schatzkarte ---------- */
X.dig=function(s,id){const m=s.post.m.schatz;if(m.st!=='karte')return {ok:false,msg:'Hier ist nichts mehr.'};
 const hill=X.mounds.find(h=>h.id===id);if(!hill)return {ok:false,msg:'Hier ist nichts.'};
 if(id!==X.answer){m.tried=Array.from(new Set([...(m.tried||[]),id]));return {ok:false,msg:'Nur Erde und ein verdutzter Regenwurm. Der Schatten fällt woanders hin.'};}
 m.st='fertig';m.found=s.day;s.money+=X.treasure.money;if(s.stats)s.stats.earned=(s.stats.earned||0)+X.treasure.money;
 for(const [k,n] of Object.entries(X.treasure.items))s.inv[k]=(s.inv[k]||0)+n;
 return {ok:true,msg:'Eine kleine Holzkiste! Darin: '+X.treasure.money+' G und 3 Kupfererz.'};};

/* ---------- Mission Haus Nr. 7 ---------- */
X.look7=function(s){const m=s.post.m.haus7;if(m.st!=='suche')return false;m.st='gesehen';return true;};
X.can7=s=>{const c=X.cost7;return s.money>=c.money&&(s.inv.holz||0)>=c.holz&&(s.inv.stein||0)>=c.stein;};
X.renovate=function(s){const m=s.post.m.haus7,c=X.cost7;if(m.st!=='schluessel'||!X.can7(s))return false;
 s.money-=c.money;for(const k of ['holz','stein']){s.inv[k]-=c[k];if(!s.inv[k])delete s.inv[k];}m.st='bau';m.start=s.day;m.due=s.day+c.days;return true;};
const loc=St.location;
St.location=function(s,id,festival){if(id!=='elva')return loc(s,id,festival);
 if(!s.post||s.post.m.haus7.st!=='fertig'||s.min<420||s.min>=1260)return null;return {map:'stadt',x:X.house7.door[0]+(Math.floor(s.min/60)%2),y:X.house7.door[1]};};

/* ---------- Mission Mitternacht am alten Brunnen ---------- */
X.midnight=function(s){const m=s.post.m.brunnen;if(m.st!=='einladung'||s.min<X.midnightFrom||s.min>=1440)return false;
 m.st='dokument';m.doc=s.day;s.post.seq++;
 s.mail.push({id:'p'+s.day+'-'+s.post.seq,day:s.day,read:false,from:'Altes Dokument',kind:'geheim',mis:'brunnen',doc:true,t:'Altes Dokument',
  b:'Eine Urkunde aus dem Gründungsjahr des Dorfes:\n\n„Der Mondhof und das Dorf teilen sich den alten Brunnen. Solange sein Wasser fließt, füllt jeder, der vorbeikommt, an ihm seine Kanne. So bleibt keiner allein mit seiner Ernte.“\n\nDarunter, mit neuerer Tinte: „Der Brunnen braucht 15 Steine, 5 Kupfererz und 300 G für den Handwerker. Bitte. H.“'});
 return true;};
X.canWell=s=>{const c=X.costWell;return s.money>=c.money&&(s.inv.stein||0)>=c.stein&&(s.inv.kupfer||0)>=c.kupfer;};
X.repairWell=function(s){const m=s.post.m.brunnen,c=X.costWell;if(m.st!=='dokument'||!X.canWell(s))return false;
 s.money-=c.money;for(const k of ['stein','kupfer']){s.inv[k]-=c[k];if(!s.inv[k])delete s.inv[k];}m.st='fertig';m.fixed=s.day;return true;};

/* ---------- Wegweiser: Missionsziel ---------- */
X.target=function(s){const P=s.post&&s.post.m;if(!P)return null;
 const sc=P.schatz.st,h=P.haus7.st,b=P.brunnen.st;
 if(sc==='brief'||h==='brief'||b==='brief')return {map:'farm',x:6,y:7,t:'Geheimnisvoller Brief',sub:'Im Briefkasten wartet ein Brief ohne Absender'};
 if(sc==='karte')return {map:'forest',x:13,y:17,t:'Die zerknitterte Karte',sub:'Beim Mondbaum: Wohin fällt der Abendschatten?'};
 if(h==='suche')return {map:'stadt',x:X.house7.door[0],y:X.house7.door[1],t:'Haus Nummer 7',sub:'In Lindenstadt nachsehen'};
 if(h==='gesehen'||h==='schluesselpost')return {map:'farm',x:6,y:7,t:'Haus Nummer 7',sub:'Morgen kommt vielleicht Post',wait:true};
 if(h==='schluessel')return {map:'stadt',x:X.house7.door[0],y:X.house7.door[1],t:'Haus Nummer 7',sub:'Mit dem Schlüssel aufschließen · '+X.cost7.money+' G, '+X.cost7.holz+' Holz, '+X.cost7.stein+' Stein'};
 if(h==='bau')return null;
 if(b==='einladung')return {map:'village',x:X.well.x-1,y:X.well.y,t:'Die seltsame Einladung',sub:'Alter Brunnen im Südosten des Dorfes · 23 bis 24 Uhr'};
 if(b==='dokument')return {map:'village',x:X.well.x-1,y:X.well.y,t:'Der alte Brunnen',sub:'Reparatur: '+X.costWell.stein+' Stein, '+X.costWell.kupfer+' Kupfererz, '+X.costWell.money+' G'};
 return null;};
X.goal=function(s){const P=s.post&&s.post.m;if(!P)return null;
 const t=X.target(s);if(t)return {t:t.t,sub:t.sub};
 if(P.haus7.st==='bau')return {t:'Haus Nummer 7',sub:'Timo renoviert · noch '+Math.max(0,P.haus7.due-s.day)+' Nächte'};
 return null;};
})();
