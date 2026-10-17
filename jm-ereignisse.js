"use strict";
/* Briefkasten-Ereignisse W61–W65 (Etappe 1b). Baut auf jm-post.js auf: dieselben Briefe, derselbe
   Missionszustand s.post.m, derselbe Wegweiser. Jede Geschichte: Brief → Weg/Aufgabe → sichtbarer
   Abschluss; Belohnungen tragen einen gespeicherten Abholvermerk und werden genau einmal ausgezahlt.
   Keine Echtzeit: alle Zeiten sind Spieluhr und Spieltage.

   W61 vermisst  Ein Stadtmieter ist verschwunden. Zettel an seiner Haustür → Dorfbahnhof → Wiedersehen.
                 Der Mietvertrag (plots[i].tenant) bleibt die ganze Zeit bestehen; die Miete läuft weiter
                 (der Mieter hat vorausbezahlt), sie fällt also nicht still aus.
   W62 verkauf   Auf einem freien Bauplatz steht ein verlassenes Haus zum Verkauf. Kauf macht genau diesen
                 Bauplatz bezugsfertig (derselbe Hauszähler wie W39/W44, kein zweites Haus-Register).
   W63 villa     Ein reicher Fremder will „die Villa“ mieten – gemeint ist Haus Nr. 7 (Elva, W55).
                 Entscheidung am Stadtbrunnen: Elva bleibt (Freundschaft + Dankesbrief) oder Vermittlung (Geld).
   W64 tuer      Geheime Tür im Mondwald → kleiner Gewölberaum mit Truhe und Steintafel (Vorankündigung
                 Vollmondwald). Eigener Abschluss: Truhe einmal, Tür bleibt offen, Rückweg über den Ausgang.
   W65 bewohner  Jonas zieht ein und hat einen Tagesplan (Bahnhof, Dorf, Stadt). An allen drei Orten mit ihm
                 reden löst das Geheimnis: Er ist Hedwigs Enkel (W60). Danach bleibt er als Bewohner. */
(function(){
const J=window.JM,X=J.Post,St=J.Stadt,T=J.T;
const EV=X.EVENTS=['vermisst','verkauf','villa','tuer','bewohner'];
for(const id of EV)if(!X.MISSIONS.includes(id))X.MISSIONS.push(id);
X.reward61={money:150,items:{tee:2}};
X.price62=900;
X.reward63={money:250,pts:150,item:'mondstein'};
X.reward64={money:200,items:{mondquarz:2}};
X.reward65={money:250,items:{mondstein:1}};
X.door64={x:5,y:2,w:2,h:1};
X.station61={x:8,y:7,koffer:[9,7]};
X.falk={x:10,y:13,from:540,to:1200};
// Jonas' Tagesplan: [ab Minute, Karte, x, y, Ortsname]
X.jonasPlan=[[420,'bahnhof',6,7,'bahnhof'],[660,'village',27,22,'dorf'],[960,'stadt',11,12,'stadt'],[1260,null]];
const placeName=i=>St.places[i].n,fill=(s,t)=>t.replace(/\{name\}/g,s.name||'Janina');
function letter(s,o){s.post.seq++;return Object.assign({id:'p'+s.day+'-'+s.post.seq,day:s.day,read:false,kind:'geheim'},o);}
function give(s,r){if(r.money){s.money+=r.money;if(s.stats)s.stats.earned=(s.stats.earned||0)+r.money;}for(const [k,n] of Object.entries(r.items||{}))s.inv[k]=(s.inv[k]||0)+n;}
const plots=s=>(s.city&&Array.isArray(s.city.plots))?s.city.plots:[];
const freePlot=s=>plots(s).findIndex((q,i)=>q.start===null&&!q.ready&&!q.tenant&&!(s.post.orders&&s.post.orders[i]));
const tenantPlot=s=>plots(s).findIndex(q=>q.tenant&&s.day-(q.since||0)>=2);
const M=s=>s.post.m;

/* ---------- Neue Figuren ---------- */
const base=J.NPCS.mei.look;
J.NPCS.falk={n:'Herr Falk',role:'Reisender',home:'stadt',bday:[9,99],look:{...base,top:'#2e2f45',hair:'#b9b4aa',style:'short'},
 love:['mondstein'],like:['tee'],hate:['kabel'],sched:[[360,'off']],recipe:'suppe',
 intro:'Falk mein Name. Ich bin nur auf der Durchreise.',lines:[['Ein ruhiges Städtchen. Gefällt mir.'],['Ich reise bald weiter.'],['Danke noch einmal.']],
 rain:'Bei Regen bleibe ich im Hotelzimmer.',dinner:'Lins Suppe ist besser als jedes Hotel.',gift:{love:'Wie aufmerksam!',like:'Danke sehr.',neutral:'Danke.',hate:'Hm.'}};
J.NPCS.jonas={n:'Jonas',role:'Uhrmacher',home:'stadt',bday:[2,4],look:{...base,top:'#5e7a6e',hair:'#4a3a2e',style:'short'},
 love:['mondstein'],like:['tee','pilz'],hate:['kabel'],sched:[[360,'off']],recipe:'suppe',
 intro:'Oh. Hallo. Ich bin Jonas. Ich bin neu hier.',lines:[['Ich repariere Uhren. Die am Bahnhof geht jetzt wieder genau.'],['Meine Großmutter hat mir viel von diesem Dorf erzählt.'],['Am alten Brunnen ist es abends am schönsten.']],
 rain:'Regen klingt wie tausend kleine Uhren.',dinner:'Bei Lin sitze ich gern an der Theke.',gift:{love:'Ein Mondstein! Den hätte Großmutter gemocht.',like:'Danke dir.',neutral:'Danke.',hate:'Hm, eher nicht.'}};
J.NPC_ORDER.push('jonas');// Herr Falk reist wieder ab und zählt deshalb nicht zu den Dorfbewohnern (Freundschaftsziele).

/* ---------- Eignung und Startbriefe ---------- */
X.ELIG=Object.assign(X.ELIG||{},{
 vermisst:s=>tenantPlot(s)>=0,
 verkauf:s=>freePlot(s)>=0,
 villa:s=>M(s).haus7.st==='fertig',
 tuer:()=>true,
 bewohner:()=>true});
Object.assign(X.START,{
 vermisst:s=>{const i=tenantPlot(s),t=plots(s)[i].tenant,m=M(s).vermisst;m.plot=i;m.who=t;const n=J.NPCS[t].n;
  return letter(s,{from:'rosa',mis:'vermisst',t:n+' ist verschwunden',
   b:fill(s,'Liebe {name},\n\nseit gestern hat niemand mehr '+n+' gesehen. Im Haus '+placeName(i)+' in Lindenstadt brennt kein Licht, und die Tür ist zu.\n\nDie Miete kommt trotzdem jeden Morgen pünktlich an, '+n+' hat wohl vorausbezahlt. Aber ich mache mir Sorgen. Schaust du an der Haustür nach?\n\nRosa')});},
 verkauf:s=>{const i=freePlot(s),m=M(s).verkauf;m.plot=i;
  return letter(s,{from:'rosa',mis:'verkauf',t:'Ein Haus zu verkaufen',
   b:fill(s,'Liebe {name},\n\nauf dem Bauplatz '+placeName(i)+' in Lindenstadt steht doch noch ein altes, verlassenes Haus. Die Erben wohnen weit weg und möchten es loswerden: '+X.price62+' G, so wie es ist.\n\nEin Neubau kostet 1500 G und viel Material. Sieh es dir an der Straße an und entscheide selbst.\n\nRosa')});},
 villa:s=>letter(s,{from:'falk',mis:'villa',t:'Anfrage wegen der Villa',
  b:fill(s,'Sehr geehrte {name},\n\nvom Zug aus sah ich in Lindenstadt eine prächtige Villa mit einem Fernrohr am Fenster. Man sagte mir, das Haus gehöre zu Ihrem Besitz. Ich möchte es für den Sommer mieten und zahle gut.\n\nIch erwarte Sie täglich zwischen 9 und 20 Uhr am Stadtbrunnen.\n\nHochachtungsvoll\nK. Falk')}),
 tuer:s=>letter(s,{from:'henk',mis:'tuer',t:'Eine Tür im Hang',
  b:fill(s,'Moin {name},\n\nbeim Pilzesuchen im Mondwald bin ich ganz im Nordwesten an einer Tür vorbeigekommen. Eine echte Tür, mitten im Hang, aus Stein und mit Moos bewachsen. Ich hab mich nicht reingetraut.\n\nDu bist mutiger als ich. Schau sie dir an.\n\nHenk')}),
 bewohner:s=>{M(s).bewohner.seen=[];return letter(s,{from:'rosa',mis:'bewohner',t:'Ein geheimnisvoller Neuer',
  b:fill(s,'Liebe {name},\n\nüber Lins Nudelhaus wohnt seit gestern ein junger Mann. Er heißt Jonas, spricht kaum und trägt eine alte Taschenuhr.\n\nMorgens sitzt er am Dorfbahnhof, mittags am alten Brunnen im Dorf und nachmittags am Stadtplatz in Lindenstadt. Was sucht er nur hier?\n\nRosa')});}
});

/* ---------- Lesen ---------- */
const STEP={vermisst:'suche',verkauf:'angebot',villa:'treffen',tuer:'suche',bewohner:'beobachten'};
const read0=X.read;
X.read=function(s,i){if(read0(s,i))return true;const m=s.mail[i];if(!m||!EV.includes(m.mis)||m.reply)return false;
 const e=M(s)[m.mis];if(e.st!=='brief')return false;e.st=STEP[m.mis];return true;};

/* ---------- Nächtliche Fortsetzungen ---------- */
X.CONT=X.CONT||[];
X.CONT.push(function(s,must){
 const v=M(s).verkauf;if(v.st==='angebot'&&!(plots(s)[v.plot]&&plots(s)[v.plot].start===null&&!plots(s)[v.plot].ready)){v.st='fertig';v.out='vergeben';v.done=s.day;}
 const f=M(s).villa;if(f.st==='fertig'&&f.wahl==='elva'&&!f.thanked){f.thanked=s.day;
  must.push(letter(s,{from:'elva',mis:'villa',reply:true,att:{items:{[X.reward63.item]:1}},t:'Danke, dass ich bleiben darf',
   b:fill(s,'Liebe {name},\n\nTimo hat mir erzählt, dass ein reicher Herr mein Haus mieten wollte und du Nein gesagt hast. Ich weiß gar nicht, was ich sagen soll.\n\nIch lege dir einen Mondstein bei, den ich mit dem Fernrohr gefunden habe. Na ja, eigentlich auf dem Dachboden.\n\nElva')}));}
});

/* ---------- Aktionen an Weltobjekten ---------- */
X.find61=function(s){const e=M(s).vermisst;if(e.st!=='spur')return false;e.st='fertig';e.done=s.day;give(s,X.reward61);return true;};
X.clue61=function(s){const e=M(s).vermisst;if(e.st!=='suche')return false;e.st='spur';e.clue=s.day;return true;};
X.buy62=function(s){const e=M(s).verkauf,q=plots(s)[e.plot];if(e.st!=='angebot'||!q||q.start!==null||q.ready||s.money<X.price62)return false;
 s.money-=X.price62;q.start=s.day;q.due=s.day;q.ready=true;q.bought=s.day;e.st='fertig';e.out='gekauft';e.done=s.day;return true;};
X.decline62=function(s){const e=M(s).verkauf;if(e.st!=='angebot')return false;e.st='fertig';e.out='abgelehnt';e.done=s.day;return true;};
X.decide63=function(s,wahl){const e=M(s).villa;if(e.st!=='treffen'||!['elva','geld'].includes(wahl))return false;e.st='fertig';e.wahl=wahl;e.done=s.day;
 if(wahl==='geld')give(s,{money:X.reward63.money});else if(s.npc&&s.npc.elva)s.npc.elva.p=Math.min(1000,(s.npc.elva.p||0)+X.reward63.pts);return true;};
X.open64=function(s){const e=M(s).tuer;if(e.st==='suche'){e.st='offen';e.opened=s.day;return true;}return false;};
X.chest64=function(s){const e=M(s).tuer;if(e.st!=='offen')return false;e.st='fertig';e.done=s.day;give(s,X.reward64);return true;};
X.jonasWhere=function(s){const e=M(s).bewohner;if(!['beobachten','fertig'].includes(e.st))return null;let cur=null;for(const r of X.jonasPlan)if(s.min>=r[0])cur=r;return cur&&cur[1]?cur:null;};
X.observe65=function(s){const e=M(s).bewohner,w=X.jonasWhere(s);if(e.st!=='beobachten'||!w)return null;e.seen=Array.isArray(e.seen)?e.seen:[];
 if(!e.seen.includes(w[4]))e.seen.push(w[4]);if(e.seen.length>=3){e.st='fertig';e.done=s.day;give(s,X.reward65);return 'fertig';}return w[4];};

/* ---------- Karten ---------- */
X.ROOM='waldtuer';
function room(){const w=11,h=8,m={id:X.ROOM,w,h,t:[],obj:[],trees:[],lights:[],exits:[],title:'Gewölbe hinter der Waldtür'};
 for(let y=0;y<h;y++)m.t[y]=Array.from({length:w},(_,x)=>x===0||x===w-1||y<3||y===h-1?T.WAND:T.BODEN);
 m.t[h-1][5]=T.BODEN;m.exits=[{x:5,y:h-1,to:'forest',tx:X.door64.x,ty:X.door64.y+1}];m.spawn=[5,h-2];m.inside=true;m.windows=[];m.owner=null;
 m.pal={wall:'#6f6a64',wall2:'#57534e',trim:'#3e3a36',floor:'#7d7468',floor2:'#6a6258',rug:'#3f5a8a',rug2:'#cfe6ff'};
 m.obj.push({k:'truhe',x:5,y:3,act:'post:truhe64'},{k:'steintafel',x:8,y:3,act:'post:tafel64'},{k:'barrel',x:9,y:3,act:'deco'});
 for(const o of m.obj)m.t[o.y][o.x]=T.BLOCK;m.houseLevel='raum';return m;}
const bm=J.buildMaps;J.buildMaps=function(){const all=bm();all[X.ROOM]=room();return X.apply(all,null);};
function clearB(m){if(!m||!m.ev)return;m.obj=m.obj.filter(o=>!(o.act||'').startsWith('post:ev'));for(const [k,t] of Object.entries(m.ev)){const [x,y]=k.split(',').map(Number);m.t[y][x]=t;}m.ev={};}
function put(m,o){m.ev=m.ev||{};m.obj.push(o);for(let y=o.y;y<o.y+(o.h||1);y++)for(let x=o.x;x<o.x+(o.w||1);x++){const k=x+','+y;if(!(k in m.ev))m.ev[k]=m.t[y][x];m.t[y][x]=T.BLOCK;}}
const apply0=X.apply;
X.apply=function(maps,s){apply0(maps,s);const st=id=>s&&s.post&&s.post.m[id]?s.post.m[id].st:'';
 const c=maps.stadt,b=maps.bahnhof,f=maps.forest,r=maps[X.ROOM];[b,f].forEach(clearB);
 if(c&&s){const v=M(s).vermisst,k=M(s).verkauf;
  if(st('vermisst')==='suche'){const p=St.places[v.plot];put(c,{k:'zettel',x:p.x+4,y:7,act:'post:ev:zettel61'});}
  if(st('verkauf')==='angebot'){const p=St.places[k.plot],q=plots(s)[k.plot];if(q&&q.start===null&&!q.ready){c.obj=c.obj.filter(o=>!(o.act==='plot:'+k.plot&&o.k!=='board'));put(c,{k:'ruine',x:p.x,y:p.y,w:5,h:4,act:'post:ev:haus62'});}}
  c.houseLevel=String(c.houseLevel)+'|ev:'+st('vermisst')+st('verkauf');}
 if(b){if(st('vermisst')==='spur')put(b,{k:'koffer',x:X.station61.koffer[0],y:X.station61.koffer[1],act:'post:ev:koffer61'});b.houseLevel='ev:'+st('vermisst');}
 if(f){const t=st('tuer');if(['suche','offen','fertig'].includes(t)){const d=X.door64;put(f,{k:t==='suche'?'waldtuer':'waldtuer_offen',x:d.x,y:d.y,w:d.w,h:d.h,act:'post:ev:tuer64'});}f.houseLevel=String(f.houseLevel)+'|ev:'+t;}
 if(r){const t=st('tuer');const ch=r.obj.find(o=>o.act==='post:truhe64');if(ch)ch.k=t==='fertig'?'truhe_offen':'truhe';r.houseLevel='raum:'+t;}
 return maps;};

/* ---------- Wo stehen die Figuren? ---------- */
const loc0=St.location;
St.location=function(s,id,festival){
 if(s&&s.post&&s.post.m&&s.post.m.vermisst){const v=s.post.m.vermisst;
  if(id===v.who&&v.st==='suche')return null;
  if(id===v.who&&v.st==='spur')return s.min>=360&&s.min<1320?{map:'bahnhof',x:X.station61.x,y:X.station61.y}:null;}
 if(id==='falk'){const e=s.post&&s.post.m.villa;return e&&e.st==='treffen'&&s.min>=X.falk.from&&s.min<X.falk.to?{map:'stadt',x:X.falk.x,y:X.falk.y}:null;}
 if(id==='jonas'){if(!s.post)return null;const w=X.jonasWhere(s);return w?{map:w[1],x:w[2],y:w[3]}:null;}
 return loc0(s,id,festival);};

/* ---------- Spielskripte für jm-game.js (Dialoge/Panels, keine Logik) ---------- */
X.evAct=function(s,a){
 if(a==='zettel61'){const e=M(s).vermisst,n=J.NPCS[e.who]?J.NPCS[e.who].n:'';if(X.clue61(s))return {refresh:true,lines:[{who:null,text:'An der Haustür klebt ein Zettel: „Bin für ein paar Tage weg. Bitte nicht suchen! Der Frühzug wartet nicht. – '+n+'“'},{who:'player',text:'Der Frühzug? Dann frage ich am Dorfbahnhof nach.'}]};return {note:'Ein alter Zettel an der Tür.'};}
 if(a==='koffer61'){const e=M(s).vermisst,n=J.NPCS[e.who]?J.NPCS[e.who].n:'';return {note:'Ein Koffer mit Namensschild: '+n+'. Die Besitzerin oder der Besitzer kann nicht weit sein.'};}
 if(a==='haus62'){const e=M(s).verkauf;if(e.st!=='angebot')return {note:'Ein altes Haus.'};
  return {panel:{t:'Verlassenes Haus · '+placeName(e.plot),p:['Das Dach ist dicht, die Fenster sind blind vor Staub. Drinnen steht noch ein Küchentisch.','Kaufpreis: '+X.price62+' G. Danach ist das Haus bezugsfertig, und jemand kann einziehen. Ein Neubau kostet 1500 G, 30 Bauholz und 20 Stein.','Geld: '+s.money+' G'],
   buttons:[{a:'kaufen',t:'Für '+X.price62+' G kaufen',off:s.money<X.price62,fn:()=>X.buy62(s)?{refresh:true,banner:'Haus gekauft!',sfx:'fanfare',lines:[{who:null,text:'Rosa überreicht dir den Schlüssel. Das Haus '+placeName(e.plot)+' gehört jetzt dir und ist bezugsfertig.'},{who:'rosa',text:'Bestimmt kommt bald eine Mietanfrage mit der Post.'}]}:{note:'Nicht genug Geld.'}},
    {a:'nein',t:'Nicht kaufen',fn:()=>X.decline62(s)?{refresh:true,lines:[{who:'rosa',text:'In Ordnung. Dann bleibt es ein Bauplatz, und du kannst dort später selbst bauen.'}]}:null}]}};}
 if(a==='tuer64'){const e=M(s).tuer,d=X.door64;const into={to:X.ROOM,tx:5,ty:6};
  if(X.open64(s))return {refresh:true,lines:[{who:null,text:'Die Steintür ist schwer. Du stemmst dich dagegen, und mit einem Knirschen schwingt sie auf.'},{who:null,text:'Dahinter führen drei Stufen hinunter in ein trockenes Gewölbe.'}],travel:into};
  if(e.st==='offen'||e.st==='fertig')return {travel:into};return {note:'Eine moosige Steintür im Hang.'};}
 if(a==='truhe64'){if(X.chest64(s))return {refresh:true,banner:'Ein alter Fund!',sfx:'fanfare',lines:[{who:null,text:'In der Truhe liegen ein Beutel mit '+X.reward64.money+' G und zwei Mondquarze, sorgfältig in Leinen gewickelt.'},{who:'player',text:'Wer hat das hier unten versteckt? Vielleicht verrät die Steintafel mehr.'}]};return {note:'Die Truhe ist leer. Nur der Geruch nach altem Holz ist geblieben.'};}
 if(a==='tafel64')return {lines:[{who:null,text:'Auf der Steintafel ist ein Mond eingemeißelt, darunter steht:'},{who:null,text:'„Dies ist nur die Vorkammer. Wenn der Mond voll ist, öffnet sich im Wald ein zweites Tor. Wer es findet, sieht den Wald, wie er nachts wirklich ist.“'},{who:'player',text:'Ein zweites Tor bei Vollmond … Das merke ich mir.'}]};
 return null;};
X.evTalk=function(s,id){
 const v=M(s).vermisst;
 if(id===v.who&&v.st==='spur'){const n=J.NPCS[id].n;if(!X.find61(s))return null;
  return {refresh:true,banner:n+' ist wieder da',sfx:'gift',lines:[{who:id,text:'Oh! Du hast mich gesucht? Das tut mir leid. Meine Schwester war krank, und ich bin mit dem Frühzug zu ihr gefahren, ganz ohne Bescheid zu sagen.'},{who:id,text:'Es geht ihr wieder gut. Ich fahre heute noch zurück nach Lindenstadt. Die Miete habe ich vorausbezahlt, da fehlt nichts.'},{who:id,text:'Hier, als Dank fürs Suchen: '+X.reward61.money+' G und zwei Beutel Tee von meiner Schwester.'},{who:null,text:'Du bekommst '+X.reward61.money+' G und 2× Tee.'}]};}
 if(id==='falk'&&M(s).villa.st==='treffen')return {panel:{t:'Herr Falk am Stadtbrunnen',p:['„Die Villa mit dem Fernrohr! Ich zahle '+X.reward63.money+' G Vermittlung, wenn Sie mir das Haus überlassen.“','Gemeint ist Haus Nummer 7. Dort wohnt Elva. Was antwortest du?'],
  buttons:[{a:'elva',t:'„Dort wohnt Elva. Das bleibt so.“',fn:()=>X.decide63(s,'elva')?{refresh:true,lines:[{who:'falk',text:'Hm. Ehrlich gesagt: Das gefällt mir. Wer zu seinen Nachbarn hält, dem kann man trauen.'},{who:'falk',text:'Ich nehme ein Zimmer bei Lin und reise in ein paar Tagen weiter. Leben Sie wohl.'},{who:null,text:'Elva wird davon hören. Eure Freundschaft wächst.'}]}:null},
   {a:'geld',t:'„Ich kenne ein Zimmer bei Lin.“ ('+X.reward63.money+' G)',fn:()=>X.decide63(s,'geld')?{refresh:true,lines:[{who:'falk',text:'Ein Zimmer über dem Nudelhaus? Warum nicht. Für Ihre Mühe: '+X.reward63.money+' G.'},{who:null,text:'Du bekommst '+X.reward63.money+' G. Haus Nummer 7 bleibt Elvas Zuhause.'}]}:null}]}};
 if(id==='jonas'&&M(s).bewohner.st==='beobachten'){const r=X.observe65(s);if(!r)return null;const e=M(s).bewohner;
  if(r==='fertig')return {refresh:true,banner:'Ein Geheimnis gelüftet',sfx:'fanfare',lines:[{who:'jonas',text:'Du bist mir heute überallhin gefolgt, oder? Dann sage ich es dir.'},{who:'jonas',text:'Meine Großmutter hieß Hedwig. Sie hat hier gewohnt und mir von dem Bahnhof, dem Brunnen und dem Stadtplatz erzählt. Ich gehe jeden Tag ihre Wege.'},{who:'jonas',text:'Diese Taschenuhr war ihre. Und das hier hat sie mir für den Menschen gegeben, der „das Dorf wieder zum Klingen bringt“. Ich glaube, das bist du.'},{who:null,text:'Du bekommst '+X.reward65.money+' G und einen Mondstein. Jonas bleibt im Dorf.'}]};
  const clue={bahnhof:'Ich warte nicht auf einen Zug. Ich höre nur, wie die Bahnhofsuhr tickt.',dorf:'Dieser Brunnen … Jemand hat mir einmal erzählt, dass hier früher alle ihre Kannen gefüllt haben.',stadt:'Von hier sieht man die Dächer. Man sagt, früher stand hier nur ein Feld.'}[r];
  return {refresh:true,lines:[{who:'jonas',text:clue},{who:null,text:'Jonas getroffen: '+e.seen.length+' von 3 Orten.'}]};}
 return null;};

/* ---------- Wegweiser ---------- */
const target0=X.target;
X.target=function(s){const t=target0(s);if(t)return t;const P=s.post&&s.post.m;if(!P)return null;
 for(const id of EV)if(P[id]&&P[id].st==='brief')return {map:'farm',x:6,y:7,t:'Geheimnisvoller Brief',sub:'Im Briefkasten wartet ein neuer Brief'};
 const v=P.vermisst,k=P.verkauf,f=P.villa,d=P.tuer,b=P.bewohner,n=id=>J.NPCS[id]?J.NPCS[id].n:'';
 if(v&&v.st==='suche')return {map:'stadt',x:St.places[v.plot].x+4,y:8,t:n(v.who)+' ist verschwunden',sub:'An der Haustür in Lindenstadt nachsehen'};
 if(v&&v.st==='spur')return {map:'bahnhof',x:X.station61.x,y:X.station61.y+1,t:n(v.who)+' ist verschwunden',sub:'Am Dorfbahnhof suchen · 6 bis 22 Uhr'};
 if(k&&k.st==='angebot')return {map:'stadt',x:St.places[k.plot].x+1,y:7,t:'Ein Haus zu verkaufen',sub:placeName(k.plot)+' · '+X.price62+' G'};
 if(f&&f.st==='treffen')return {map:'stadt',x:X.falk.x,y:X.falk.y+1,t:'Anfrage wegen der Villa',sub:'Herr Falk am Stadtbrunnen · 9 bis 20 Uhr'};
 if(d&&d.st==='suche')return {map:'forest',x:X.door64.x,y:X.door64.y+1,t:'Eine Tür im Hang',sub:'Ganz im Nordwesten des Mondwalds'};
 if(d&&d.st==='offen')return {map:X.ROOM,x:5,y:4,t:'Das Gewölbe',sub:'Die alte Truhe öffnen'};
 if(b&&b.st==='beobachten'){const w=X.jonasWhere(s),seen=(b.seen||[]).length;
  const next=w&&!(b.seen||[]).includes(w[4])?w:X.jonasPlan.find(r=>r[1]&&!(b.seen||[]).includes(r[4]));
  return {map:next[1],x:next[2]-1,y:next[3],t:'Ein geheimnisvoller Neuer',sub:'Jonas an seinen Orten treffen: '+seen+' von 3 · Bahnhof 7–11, Dorfbrunnen 11–16, Stadtplatz 16–21 Uhr'};}
 return null;};
const goal0=X.goal;
X.goal=function(s){const g=goal0(s);if(g)return g;const t=X.target(s);return t?{t:t.t,sub:t.sub}:null;};
})();
