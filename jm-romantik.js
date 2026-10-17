"use strict";
/* Etappe 2 – Romantik: Janina und René als festes Paar (keine anderen Spielpartnerschaften).
   W25 Picknick    Verabredung per Brief von René oder im Tagebuch: Ort (Waldsee/Wiese am Teich) und Uhrzeit (12 oder 17 Uhr).
                   Am Tag liegt dort eine Picknickdecke mit Korb, René wartet. Szene mit Auswahl, Erinnerung im Tagebuch.
   W26 Missverständnis  Nach dem ersten Picknick weicht René aus. Timo verplappert sich. Auflösung: René hat heimlich
                   eine Herzbank am Teich gebaut. Danach andere Gespräche.
   W28 Briefe      René schreibt nach jedem gemeinsamen Erlebnis einen Brief, der sich genau darauf bezieht (einmal je Erlebnis).
   W30 Ausflug     Nach dem ersten Picknick: Abend in Lindenstadt (Zug), Tisch am Stadtbrunnen, Auswahl, Erinnerung.
   W31 Jahrestag   Gespeichertes Datum (änderbar), jedes Jahr ein Abend mit Kerzen am Küchentisch, einmal pro Jahr.
   W38 Janinas Geburtstag  Gespeichertes Datum (Standard 6. Herbst, im Tagebuch änderbar). Geburtstagspost aus dem Dorf,
                   Kuchen von René, Besuch von Rosa und Mei vor dem Haus mit Geschenkkorb. Alles einmal pro Jahr. */
(function(){
const J=window.JM,X=J.Post,St=J.Stadt,D=J.Dorf,R=J.Rom={};
const cal=D.cal,say=D.say,fill=D.fill,letter=D.letter;
const VON=()=>(J.CONFIG&&J.CONFIG.von)||'René';
const cap=t=>t[0].toUpperCase()+t.slice(1);
const hh=m=>Math.floor(m/60)+(m%60?':'+String(m%60).padStart(2,'0'):'');
const met=(s,id)=>!!(s.npc&&s.npc[id]&&s.npc[id].met);

R.PLACES={
 see:{map:'forest',n:'am Waldsee',kurz:'Waldsee',obj:{k:'picknick',x:16,y:21,w:2,h:1},rene:[17,20],spot:[16,20]},
 wiese:{map:'farm',n:'auf der Wiese am Teich',kurz:'Wiese am Teich',obj:{k:'picknick',x:18,y:18,w:2,h:1},rene:[20,18],spot:[17,18]},// nördlich vom Teich; Beete (FELD) und Gewächshaus (GLAS 16–21,24–26) bleiben frei
 stadt:{map:'stadt',n:'am Stadtbrunnen in Lindenstadt',kurz:'Stadtbrunnen Lindenstadt',obj:{k:'bistro',x:10,y:15,w:2,h:1},rene:[12,15],spot:[9,15]}};
R.SLOTS={mittag:{n:'12 Uhr',from:720,to:900},abend:{n:'17 Uhr',from:1020,to:1200},ausflug:{n:'17 Uhr',from:1020,to:1260}};
R.KINDS={picknick:{places:['see','wiese'],slots:['mittag','abend']},ausflug:{places:['stadt'],slots:['ausflug']}};
R.HOME={rene:[7,5],spot:[4,5]};
R.BDAY={from:600,to:960,rosa:[10,9],mei:[13,9],table:{k:'geburtstagstisch',x:11,y:9,w:2,h:1},spot:[12,8],gift:{items:{tee:2,rolle:2}},card:{items:{erdbeere:3}}};
R.BANK={k:'herzbank',x:20,y:17,w:2,h:1};// am Teich, neben dem Picknickplatz
R.DEF={jb:{s:2,d:6},jt:{s:1,d:12}};
R.JT_FROM=1080;R.JT_TO=1410;

/* ---------- Zustand und Migration ---------- */
R.migrate=function(s){let r=s.rom;if(!r||typeof r!=='object')r=s.rom={};r.v=1;
 if(r.date&&(typeof r.date!=='object'||!R.PLACES[r.date.place]))r.date=null;if(r.date===undefined)r.date=null;
 if(!Array.isArray(r.mem))r.mem=[];
 for(const k of ['pick','aus'])if(!r[k]||typeof r[k]!=='object'||!Number.isInteger(r[k].n))r[k]={n:0,last:0};
 if(!r.mv||typeof r.mv!=='object'||typeof r.mv.st!=='string')r.mv={st:''};
 for(const k of ['jt','jb']){const v=r[k];if(!v||!Number.isInteger(v.s)||!Number.isInteger(v.d)||v.s<0||v.s>3||v.d<1||v.d>J.DPS)r[k]={...R.DEF[k]};}
 for(const k of ['jtDone','jbDone','sent'])if(!r[k]||typeof r[k]!=='object')r[k]={};
 return s;};
const mig=J.Ausbau.migrate;J.Ausbau.migrate=function(s){mig(s);R.migrate(s);return s;};

R.jbToday=s=>!!s.rom&&s.rom.jb.s===cal.se(s)&&s.rom.jb.d===cal.d(s);
R.jtToday=s=>!!s.rom&&s.rom.jt.s===cal.se(s)&&s.rom.jt.d===cal.d(s);
R.jbRec=s=>{const y=cal.y(s);return s.rom.jbDone[y]||(s.rom.jbDone[y]={});};
const reneMet=s=>!!(s.rene&&s.rene.met);
const pending=s=>{const d=s.rom.date;return d&&!d.done?d:null;};
const dateNow=s=>{const d=pending(s);return d&&d.day===s.day&&s.min>=d.from&&s.min<d.to?d:null;};

/* ---------- Verabredungen (W25/W30) ---------- */
R.canPropose=(s,kind)=>reneMet(s)&&!pending(s)&&!!R.KINDS[kind]&&(kind!=='ausflug'||s.rom.pick.n>=1);
R.options=function(s,kind){if(!R.canPropose(s,kind))return [];const K=R.KINDS[kind],out=[];
 for(const pl of K.places)for(const sl of K.slots){const S0=R.SLOTS[sl],day=s.min<S0.from-60?s.day:s.day+1;
  out.push({k:[kind,pl,sl,day].join('|'),t:R.PLACES[pl].kurz+' · '+(day===s.day?'heute':'morgen')+' '+S0.n});}
 return out;};
R.propose=function(s,key,via){R.migrate(s);const opt=R.options(s,String(key).split('|')[0]).find(o=>o.k===key);if(!opt)return {ok:false,msg:'Diese Verabredung ist gerade nicht möglich.'};
 const [k,place,slot,day]=key.split('|'),S0=R.SLOTS[slot];
 s.rom.date={k,place,slot,day:+day,from:S0.from,to:S0.to,set:s.day,via:via||'tagebuch'};
 return {ok:true,refresh:+day===s.day,msg:(k==='picknick'?'Picknick':'Ausflug')+' mit '+VON()+': '+opt.t+'.'};};

const TXT={
 picknick:{
  uns:{m:'Er hat gesagt, was ihm an uns am besten gefällt: dass ihr zusammen leise sein könnt.',l:[say('rene','Dass wir zusammen leise sein können. Und dass du beim Lachen immer die Nase krausziehst.'),say('player','Tu ich gar nicht!'),say('rene','Doch. Gerade eben wieder.')]},
  traum:{m:'Er hat von euch beiden in zwanzig Jahren geträumt, genau hier.',l:[say('rene','Von genau so einem Tag. Nur vielleicht mit weniger Ameisen.'),say('rene','Und davon, dass wir in zwanzig Jahren immer noch hier sitzen.')]},
  wolken:{m:'Ihr habt Formen in den Wolken gesucht. Er hat einen Pudel gefunden.',l:[say(null,'Ihr liegt nebeneinander und sucht Formen in den Wolken.'),say('rene','Da! Ein Pudel. Eindeutig ein Pudel.'),say(null,'{d0} bellt die Wolke an.')]}},
 ausflug:{
  muenze:{m:'Ihr habt zwei Münzen in den Stadtbrunnen geworfen. Die Wünsche bleiben geheim.',l:[say(null,'Ihr werft beide eine Münze in den Stadtbrunnen. Es macht zweimal leise Plopp.'),say('rene','Was hast du dir gewünscht?'),say('player','Verrate ich nicht. Sonst wird es nichts.'),say('rene','Dann sag ich meins auch nicht. Aber es hat mit dir zu tun.')]},
  tisch:{m:'Ihr habt bei Kerzenlicht am Tisch gesessen und Geschichten über Leute erfunden.',l:[say(null,'Ihr sitzt am kleinen Tisch, die Kerze flackert. Ihr erfindet Geschichten über die Leute, die vorbeigehen.'),say('rene','Der Mann mit dem Hut da ist bestimmt ein Geheimagent.'),say('player','Oder einfach ein Mann mit Hut.'),say('rene','Sag ich doch. Geheimagent.')]},
  geige:{m:'Ihr habt zu Maras Geige auf dem Stadtplatz getanzt.',l:[say(null,'Aus dem Abendgarten klingt Maras Geige. Ihr bleibt stehen und hört zu.'),say('rene','Darf ich bitten?'),say(null,'Ihr tanzt ein paar Schritte auf dem Stadtplatz. Niemand schaut hin. Alle schauen hin.')]}}};
R.choices=function(s){const d=pending(s);if(!d)return [];if(d.k==='picknick')return [['uns','„Was dir an uns am besten gefällt.“'],['traum','„Wovon träumst du?“'],['wolken','Einfach zusammen in die Wolken schauen']];
 const c=[['muenze','Eine Münze in den Stadtbrunnen werfen'],['tisch','Am Tisch sitzen und den Leuten zusehen']];
 if(((s.city&&s.city.plots)||[]).some(p=>p.tenant==='mara'))c.push(['geige','Mara beim Geigespielen zuhören']);return c;};
R.dateScene=function(s){const d=dateNow(s);if(!d)return null;const p=R.PLACES[d.place],ch=R.choices(s).map(([k,t])=>({t,fn:()=>R.finish(s,k)}));
 if(d.k==='picknick')return {pose:{map:p.map,x:p.spot[0],y:p.spot[1]},fx:['rene','player'],lines:[say('rene','Da bist du ja! Ich habe alles eingepackt: Erdbeeren, belegte Brote und Tee in der Thermoskanne.'),say(null,'Ihr setzt euch auf die karierte Decke '+p.n+'. {d0} und {d1} schnuppern sofort am Korb.'),say('rene','Worüber reden wir?',ch)]};
 return {pose:{map:p.map,x:p.spot[0],y:p.spot[1]},fx:['rene','player'],lines:[say('rene','Lindenstadt am Abend! Ich habe uns einen Tisch am Brunnen besorgt. Mit Kerze.'),say(null,'Die Laternen gehen an. Vom Bahnhof hört man den letzten Zug.'),say('rene','Was machen wir zuerst?',ch)]};};
R.finish=function(s,choice){const d=dateNow(s);if(!d)return null;const T=TXT[d.k][choice];if(!T||!R.choices(s).some(c=>c[0]===choice))return null;
 d.done=s.day;d.choice=choice;const r=s.rom;
 r.mem.push({k:d.k,day:s.day,place:d.place,choice,t:(d.k==='picknick'?'Picknick ':'Ausflug ')+R.PLACES[d.place].n,txt:T.m});
 const c=d.k==='picknick'?r.pick:r.aus;c.n++;c.last=s.day;if(!c.first)c.first=s.day;
 s.energy=Math.min(s.maxE||100,(s.energy||0)+30);
 return {hud:true,banner:d.k==='picknick'?'Picknick mit '+VON():'Ausflug mit '+VON(),sfx:'gift',fx:['rene','player'],lines:[...T.l,say(null,'Energie +30. Dieser Moment steht jetzt in deinem Tagebuch.')]};};

/* ---------- W31 Jahrestag ---------- */
R.jtScene=function(s){const y=cal.y(s);if(!R.jtToday(s)||s.min<R.JT_FROM||s.min>=R.JT_TO||s.rom.jtDone[y])return null;
 return {pose:{map:'haus',x:R.HOME.spot[0],y:R.HOME.spot[1]},fx:['rene','player'],lines:[say(null,'Auf dem Küchentisch brennen zwei Kerzen. Daneben steht eine Rose in einem Wasserglas.'),say('rene','Weißt du, was heute ist? Unser Jahrestag.'),
  say('rene',y===1?'Ein ganzes Jahr Mondhof ist es noch nicht. Aber jeder Tag hier mit dir zählt doppelt.':'Wieder ein Jahr. Das schönste bisher. Das sage ich jedes Jahr, und jedes Jahr stimmt es.'),
  say('rene','Ich habe dir etwas geschrieben.',[{t:'Den Brief sofort lesen',fn:()=>R.jtFinish(s,'lesen')},{t:'Erst anstoßen, dann lesen',fn:()=>R.jtFinish(s,'anstossen')}])]};};
R.jtFinish=function(s,how){const y=cal.y(s);if(!R.jtToday(s)||s.rom.jtDone[y]||!['lesen','anstossen'].includes(how))return null;
 s.rom.jtDone[y]={day:s.day,how};s.rom.mem.push({k:'jahrestag',day:s.day,place:'haus',choice:how,t:'Jahrestag · Jahr '+y,txt:'Kerzen, eine Rose und ein Brief von '+VON()+' am Küchentisch.'});
 s.energy=s.maxE||100;
 const brief=say('von','{name},\n\nich weiß nicht mehr genau, welcher Tag der erste war. Ich weiß nur, dass seitdem alles leichter ist.\n\nDanke, dass du meine Socken findest, über meine Witze lachst und mit mir diesen Hof gebaut hast.\n\nAuf das nächste Jahr. Und auf alle danach.\n\nDein {von}');
 return {hud:true,banner:'Unser Jahrestag',sfx:'fanfare',fx:['rene','player'],lines:how==='anstossen'?[say(null,'Ihr stoßt mit Holundersaft an. Die Gläser klingen hell.'),brief,say(null,'Energie voll. Der Abend steht in deinem Tagebuch.')]:[brief,say(null,'Ihr stoßt mit Holundersaft an. Energie voll. Der Abend steht in deinem Tagebuch.')]};};

/* ---------- W38 Janinas Geburtstag ---------- */
R.bdayRene=function(s){if(!R.jbToday(s)||!reneMet(s))return null;const rec=R.jbRec(s);if(rec.rene)return null;rec.rene=s.day;
 D.give(s,{items:{nudeln:2}});s.energy=s.maxE||100;
 s.rom.mem.push({k:'geburtstag',day:s.day,place:'haus',t:'Dein Geburtstag · Jahr '+cal.y(s),txt:VON()+' hat einen schiefen Erdbeerkuchen gebacken.'});
 return {hud:true,banner:'Alles Gute zum Geburtstag!',sfx:'fanfare',fx:['rene','player'],lines:[say('rene','Alles Gute zum Geburtstag, {name}!'),say(null,'Auf dem Tisch steht ein schiefer Kuchen mit Erdbeeren. Eine Kerze brennt.'),say('rene','Selbst gebacken. Man sieht es, ich weiß.'),say('rene','Und hier: deine Lieblingsnudeln mit Tempura-Chicken. Zwei Portionen, nur für dich.'),say(null,'Du bekommst 2× Chinesische Nudeln mit Tempura-Chicken. Energie voll.')]};};
const visitors=s=>['rosa','mei'].filter(id=>met(s,id));
const visitNow=s=>R.jbToday(s)&&s.min>=R.BDAY.from&&s.min<R.BDAY.to;
R.party=function(s){if(!visitNow(s)||!visitors(s).length)return null;const rec=R.jbRec(s);if(rec.fest)return null;rec.fest=s.day;
 D.give(s,R.BDAY.gift);for(const id of visitors(s))D.addP(s,id,20);
 const v=visitors(s),a=v[0],b=v[1]||v[0];
 return {pose:{map:'farm',x:R.BDAY.spot[0],y:R.BDAY.spot[1]},hud:true,banner:'Überraschung!',sfx:'fanfare',fx:[...v,'player'],lines:[say(a,'Überraschung! Alles Gute zum Geburtstag, {name}!'),say(b,'Wir haben einen Kuchen mitgebracht. Mit Kerzen, aus Lins Küche!'),say(null,'Auf dem Tisch vor eurem Haus stehen ein Kuchen und ein kleines Päckchen.'),say(a,'Vom ganzen Dorf: ein Korb mit Tee und Frühlingsrollen. Alle lassen dich grüßen.'),say(null,'Du bekommst 2× Tee und 2× Frühlingsrolle.')]};};

/* ---------- W26 Missverständnis ---------- */
R.mvTalk=function(s){const m=s.rom.mv;
 if(m.st==='heimlich'){m.st='ausweichen';m.day=s.day;return {lines:[say('rene','Oh! Hallo, Schatz. Ich … muss noch kurz etwas erledigen. Nichts Wichtiges!'),say(null,'Er dreht sich schnell weg und versteckt etwas hinter dem Rücken. Es riecht nach frischem Holz.'),say('player','Seit dem Picknick ist er so seltsam. Weicht er mir aus?')]};}
 if(m.st==='ausweichen'&&m.day>=s.day)return {lines:[say('rene','Gleich, gleich! Ich bin gleich fertig. Du wirst sehen.')]};
 if(m.st==='hinweis'||m.st==='ausweichen')return {lines:[say('rene','Du schaust so ernst. Ist alles in Ordnung?',[{t:'„Sag mir ehrlich, was los ist.“',fn:()=>R.mvEnd(s,'ehrlich')},{t:'„Ich dachte schon, du hast keine Lust mehr auf mich.“',fn:()=>R.mvEnd(s,'sorge')}])]};
 return null;};
R.mvEnd=function(s,how){const m=s.rom.mv;if(!['ausweichen','hinweis'].includes(m.st)||!['ehrlich','sorge'].includes(how))return null;m.st='fertig';m.day=s.day;m.how=how;
 s.rom.mem.push({k:'bank',day:s.day,place:'farm',choice:how,t:'Die Herzbank am Teich',txt:'Ein Missverständnis: '+VON()+' hat heimlich eine Bank für euch gebaut.'});
 return {refresh:true,banner:'Ein Missverständnis weniger',sfx:'fanfare',fx:['rene','player'],lines:[
  ...(how==='sorge'?[say('rene','Keine Lust auf dich? Niemals! Oh nein, das tut mir leid.'),say('rene','Ich wollte dich überraschen und war dabei wohl ziemlich komisch.')]:[say('rene','Na gut. Eigentlich wollte ich es erst morgen zeigen.')]),
  say(null,'Am Teich auf eurem Hof steht eine neue Holzbank. In die Lehne ist ein Herz geschnitzt, darin ein J und ein R.'),
  say('rene','Für uns. Damit wir einen Platz haben, an dem wir einfach zusammen sitzen.'),
  say(null,'Das Missverständnis ist ausgeräumt. Die Herzbank steht jetzt am Teich auf dem Hof.')]};};

/* ---------- Gespräche ---------- */
R.jbPending=s=>!!s.rom&&reneMet(s)&&R.jbToday(s)&&!R.jbRec(s).rene;
R.reneTalk=function(s){R.migrate(s);if(!reneMet(s))return null;
 return (R.jbToday(s)&&!R.jbRec(s).rene?R.bdayRene(s):null)||R.dateScene(s)||R.jtScene(s)||R.mvTalk(s)||R.reminder(s);};
R.reminder=function(s){const d=pending(s);if(!d)return null;const p=R.PLACES[d.place];
 if(d.day<s.day||d.day===s.day&&s.min>=d.to)return {lines:[say('rene','Schade, wir haben unser Treffen verpasst. Nicht schlimm! Morgen kannst du uns im Tagebuch unter „Herz“ neu verabreden.')]};
 if(d.day===s.day&&s.min>=d.from)return null;
 return {lines:[say('rene',(d.k==='picknick'?'Nicht vergessen: Picknick ':'Nicht vergessen: unser Ausflug, ')+p.n+', '+(d.day===s.day?'heute':'morgen')+' um '+hh(d.from)+' Uhr. Ich freu mich!')]};};
R.npcTalk=function(s,id){R.migrate(s);
 if((id==='rosa'||id==='mei')&&visitNow(s)&&visitors(s).includes(id))return R.party(s);
 if(id==='timo'&&s.rom.mv.st==='ausweichen'){s.rom.mv.st='hinweis';return {lines:[say('timo','René? Der war bei mir und hat Holz gekauft. Und mich schwören lassen, dir nichts zu sagen.'),say('timo','Ups. Das habe ich jetzt nicht gesagt, ja?'),say('player','Holz? Wofür braucht er denn Holz? Ich frage ihn.')]};}
 return null;};
R.extraLines=function(s){const r=s.rom,o=[];if(!r)return o;
 if(r.mv.st==='fertig')o.push('Unsere Bank am Teich ist mein Lieblingsplatz.','Ich hab dir nichts verheimlicht. Na gut, eine Bank. Einmal.');
 const last=r.mem.filter(m=>m.k==='picknick'||m.k==='ausflug').slice(-1)[0];
 if(last)o.push(last.k==='picknick'?'Das Picknick '+R.PLACES[last.place].n+' war schön. Nächstes Mal bringe ich mehr Erdbeeren mit.':'Lindenstadt mit dir am Abend … das machen wir wieder.');
 return o;};

/* ---------- Weltobjekte ---------- */
R.act=function(s,a){R.migrate(s);
 if(a==='decke'||a==='bistro'){const sc=R.dateScene(s);if(sc)return sc;const d=pending(s);if(d)return {note:d.day<s.day||d.day===s.day&&s.min>=d.to?'Unser Treffen ist leider verpasst. Nicht schlimm – morgen im Tagebuch neu verabreden!':'Wir sind um '+hh(d.from)+' bis '+hh(d.to)+' Uhr verabredet. Ich freu mich auf dich!'};return {note:a==='decke'?'Die karierte Picknickdecke. Im Korb sind nur noch Krümel.':'Ein kleiner Tisch mit einer Kerze.'};}
 if(a==='tisch'){const sc=R.jtScene(s);if(sc)return sc;return {note:s.rom.jtDone[cal.y(s)]?'Die Kerzen sind fast heruntergebrannt. Die Rose duftet noch.':'Zwei Kerzen und eine Rose. Ab 18 Uhr feiert ihr hier euren Jahrestag.'};}
 if(a==='kuchen'){const sc=R.party(s);if(sc)return sc;return {note:'Ein Geburtstagskuchen mit Kerzen. Ein Stück fehlt schon.'};}
 if(a==='bank'){if(s.rom.bankDay!==s.day){s.rom.bankDay=s.day;s.energy=Math.min(s.maxE||100,(s.energy||0)+10);return {hud:true,note:'Du sitzt kurz auf eurer Herzbank. Der Teich glitzert. Energie +10.'};}
  return {note:'Eure Herzbank. Ein J und ein R im Herz.'};}
 return null;};
const evAct0=X.evAct;X.evAct=function(s,a){if(String(a).startsWith('rom:'))return R.act(s,a.slice(4));return evAct0?evAct0(s,a):null;};

/* ---------- Nacht: verpasste Verabredung, Missverständnis beginnt ---------- */
D.NIGHT.push(function(s){R.migrate(s);const r=s.rom,d=r.date;
 if(d&&d.day<s.day){if(!d.done){r.missed=(r.missed||0)+1;r.lastMissed={k:d.k,place:d.place,day:d.day};}r.date=null;}
 if(!r.mv.st&&reneMet(s)&&r.pick.first&&s.day>r.pick.first){r.mv.st='heimlich';r.mv.day=s.day;}});

/* ---------- W28 Briefe von René und Geburtstagspost ---------- */
const MEMB={
 picknick:m=>({t:'Nach unserem Picknick',b:'Liebe {name},\n\nich muss die ganze Zeit an gestern denken. An die karierte Decke '+R.PLACES[m.place].n+' und an die Pudel, die fast den Korb geplündert hätten.\n\n'+({uns:'Du hast gefragt, was mir an uns am besten gefällt. Mir ist noch mehr eingefallen: dass du mir den letzten Erdbeerbissen überlässt. Immer.',traum:'Du hast gefragt, wovon ich träume. Ich habe es dir gesagt. Es stimmt immer noch, heute Morgen sogar noch mehr.',wolken:'Der Wolkenpudel war übrigens wirklich ein Pudel. Ich habe extra nachgesehen.'}[m.choice]||'')+'\n\nDein {von}'}),
 ausflug:m=>({t:'Lindenstadt mit dir',b:'Liebe {name},\n\nder Abend in Lindenstadt geht mir nicht aus dem Kopf.\n\n'+({muenze:'Ich verrate dir meinen Wunsch doch: noch viele solcher Abende. Jetzt wird er hoffentlich trotzdem wahr.',tisch:'Der Geheimagent mit dem Hut lässt übrigens grüßen. Ich habe ihn heute am Bahnhof gesehen.',geige:'Ich übe jetzt heimlich Walzer. Beim nächsten Mal trete ich dir nicht mehr auf die Füße.'}[m.choice]||'')+'\n\nDein {von}'}),
 jahrestag:m=>({t:'Am Morgen nach unserem Jahrestag',b:'Liebe {name},\n\ndie Kerzen sind heruntergebrannt, aber die Rose steht noch. Ich lasse sie stehen, bis sie von selbst umfällt.\n\nDein {von}'}),
 bank:m=>({t:'Zur Herzbank',b:'Liebe {name},\n\nes tut mir leid, dass ich so geheimnisvoll war. Ich kann einfach keine Überraschungen. Ab jetzt sage ich dir lieber vorher, dass ich etwas verheimliche.\n\nDie Bank am Teich ist für dich. Und für mich, wenn du mich lässt.\n\nDein {von}'}),
 geburtstag:m=>({t:'Noch ein Geburtstagsbrief',b:'Liebe {name},\n\nder Kuchen war schief, aber du hast trotzdem zwei Stücke gegessen. Das nenne ich Liebe.\n\nAuf dein neues Lebensjahr. Ich bin bei jedem Tag davon dabei.\n\nDein {von}'})};
D.LETTERS.push(function(s){R.migrate(s);const r=s.rom,out=[];
 if(R.jbToday(s)&&!R.jbRec(s).card)out.push({pr:0,must:true,make:()=>{R.jbRec(s).card=s.day;const g=['rosa','mei','lin','paula','henk','timo'].filter(id=>met(s,id)).map(id=>'· '+D.nm(id)+': '+({rosa:'Alles Liebe! Die Chronik bekommt heute einen Festeintrag.',mei:'Ich lege dir Erdbeeren bei. Die schönsten aus dem Lager.',lin:'Heute Abend gibt es bei mir eine Extraportion.',paula:'Die Hühner gackern dir ein Ständchen!',henk:'Alles Gute. Mehr sag ich nicht. Ist aber ernst gemeint.',timo:'Herzlichen Glückwunsch! Wenn du ein Regal brauchst, sag Bescheid.'}[id]));
  return letter(s,{from:'rosa',kind:'geburtstag',att:{items:{...R.BDAY.card.items}},t:'Alles Gute zum Geburtstag!',b:fill(s,'Liebe {name},\n\nheute ist dein Geburtstag, und das ganze Dorf denkt an dich.\n\n'+(g.length?g.join('\n'):'Alles Liebe!')+'\n\nUnd jetzt schau mal vor dein Haus, zwischen 10 und 16 Uhr. Mehr verrate ich nicht.\n\nRosa')});}});
 if(!reneMet(s))return out;
 for(const m of r.mem)if(!m.l&&m.day<s.day&&MEMB[m.k])out.push({pr:1,make:()=>{m.l=s.day;const x=MEMB[m.k](m);return letter(s,{from:'von',kind:'romantik',t:x.t,b:fill(s,x.b)});}});
 if(r.lastMissed&&!r.lastMissed.l)out.push({pr:1,make:()=>{r.lastMissed.l=s.day;const p=R.PLACES[r.lastMissed.place];return letter(s,{from:'von',kind:'romantik',rom:{ask:r.lastMissed.k},t:'Schade um gestern',b:fill(s,'Liebe {name},\n\ngestern habe ich '+p.n+' auf dich gewartet. Bestimmt war auf dem Hof viel los. Nicht schlimm!\n\nSuch dir einfach einen neuen Tag aus, hier im Brief oder im Tagebuch.\n\nDein {von}')});}});
 if(!r.sent.inv1&&r.pick.n===0&&!pending(s)&&s.day>=4)out.push({pr:1,make:()=>{r.sent.inv1=s.day;return letter(s,{from:'von',kind:'romantik',rom:{ask:'picknick'},t:'Eine Einladung',b:fill(s,'Liebe {name},\n\nich habe heute auf der Arbeit nur an dich gedacht. Lass uns ein Picknick machen! Nur wir zwei, die Pudel und ein Korb voller Erdbeeren.\n\nSuch dir Ort und Uhrzeit aus. Ich bin da.\n\nDein {von}')});}});
 if(!r.sent.inv2&&r.pick.n>=1&&r.aus.n===0&&!pending(s)&&s.day>=r.pick.last+2)out.push({pr:2,make:()=>{r.sent.inv2=s.day;return letter(s,{from:'von',kind:'romantik',rom:{ask:'ausflug'},t:'Ein Abend in Lindenstadt?',b:fill(s,'Liebe {name},\n\nwie wäre es mit einem Ausflug? Mit dem Zug nach Lindenstadt, ein Tisch am Stadtbrunnen, eine Kerze und wir zwei.\n\nSag mir, wann. Ich bin um 17 Uhr da.\n\nDein {von}')});}});
 if(!r.sent.kuschel&&((s.rene&&s.rene.cuddles)||0)>=5)out.push({pr:3,make:()=>{r.sent.kuschel=s.day;return letter(s,{from:'von',kind:'romantik',t:'Ein Zettel am Kühlschrank',b:fill(s,'{name},\n\nfünf Mal gekuschelt. Ich zähle mit. Nicht, weil ich muss. Weil ich es mag.\n\nDein {von}')});}});
 return out;});
R.letterChoices=(s,m)=>m&&m.rom&&m.rom.ask&&!m.rom.done?R.options(s,m.rom.ask):[];
R.letterAnswer=function(s,i,key){const m=s.mail[i];if(!m||!m.rom||m.rom.done)return {ok:false,msg:'Dieser Brief ist schon beantwortet.'};const r=R.propose(s,key,'brief');if(r.ok)m.rom.done=key;return r;};

/* ---------- Karten: Picknickdecke, Bistrotisch, Kuchentisch, Herzbank, Kerzentisch ---------- */
function clearR(m){if(!m)return;if(m.rom){m.obj=m.obj.filter(o=>!(String(o.act||'').startsWith('post:ev:rom:')&&!o.k0));for(const [k,t] of Object.entries(m.rom)){const [x,y]=k.split(',').map(Number);m.t[y][x]=t;}}m.rom={};
 for(const o of m.obj)if(o.k0){o.k=o.k0;o.act=o.act0;delete o.k0;delete o.act0;}}
function putR(m,o){m.obj.push(o);for(let y=o.y;y<o.y+(o.h||1);y++)for(let x=o.x;x<o.x+(o.w||1);x++){const k=x+','+y;if(!(k in m.rom))m.rom[k]=m.t[y][x];m.t[y][x]=J.T.BLOCK;}}
const apply0=X.apply;
X.apply=function(maps,s){apply0(maps,s);const ids=['farm','forest','stadt','haus'];for(const id of ids)clearR(maps[id]);
 const sig={};
 if(s&&s.rom){const d=s.rom.date;
  if(d&&d.day===s.day){const p=R.PLACES[d.place],m=maps[p.map];if(m){putR(m,Object.assign({act:'post:ev:rom:'+(d.k==='picknick'?'decke':'bistro')},p.obj));sig[p.map]=(sig[p.map]||'')+'d'+d.place+(d.done?1:0);}}
  if(s.rom.mv.st==='fertig'&&maps.farm){putR(maps.farm,Object.assign({act:'post:ev:rom:bank'},R.BANK));sig.farm=(sig.farm||'')+'b';}
  if(R.jbToday(s)&&maps.farm){putR(maps.farm,Object.assign({act:'post:ev:rom:kuchen'},R.BDAY.table));sig.farm=(sig.farm||'')+'k';}
  if(R.jtToday(s)&&maps.haus){const t=maps.haus.obj.find(o=>o.k==='table');if(t){t.k0=t.k;t.act0=t.act;t.k='tisch_jt';t.act='post:ev:rom:tisch';sig.haus='j';}}}
 for(const id of ids)if(maps[id])maps[id].romSig=sig[id]||'';
 return maps;};

/* ---------- Wo stehen die Figuren? René und Geburtstagsbesuch ---------- */
R.plan=function(s){if(!s||!s.rom)return null;const d=s.rom.date;
 if(d&&d.day===s.day&&s.min>=d.from-30&&s.min<d.to){const p=R.PLACES[d.place];return {map:p.map,pos:p.rene.slice(),mode:'date'};}
 if(R.jtToday(s)&&s.min>=R.JT_FROM&&s.min<R.JT_TO)return {map:'haus',pos:R.HOME.rene.slice(),mode:'jt'};
 return null;};
const loc0=St.location;
St.location=function(s,id,festival){if(s&&s.rom&&!festival&&(id==='rosa'||id==='mei')&&visitNow(s)&&met(s,id))return {map:'farm',x:R.BDAY[id][0],y:R.BDAY[id][1]};return loc0(s,id,festival);};
R.hearts=function(s){const d=s.rom&&s.rom.date;if(d&&d.done===s.day&&s.min<d.to)return true;const j=s.rom&&s.rom.jtDone[cal.y(s)];return !!(j&&j.day===s.day&&R.jtToday(s));};

/* ---------- Wegweiser ---------- */
R.target=function(s){if(!s.rom)return null;const d=pending(s);
 if(d&&d.day===s.day&&s.min<d.to){const p=R.PLACES[d.place];return {map:p.map,x:p.spot[0],y:p.spot[1],t:(d.k==='picknick'?'Picknick':'Ausflug')+' mit '+VON(),sub:cap(p.n)+' · '+hh(d.from)+' bis '+hh(d.to)+' Uhr'};}
 if(visitNow(s)&&visitors(s).length&&!R.jbRec(s).fest)return {map:'farm',x:R.BDAY.spot[0],y:R.BDAY.spot[1],t:'Besuch zum Geburtstag',sub:'Vor deinem Haus · 10 bis 16 Uhr'};
 if(R.jtToday(s)&&!s.rom.jtDone[cal.y(s)]&&s.min<R.JT_TO&&reneMet(s))return {map:'haus',x:R.HOME.spot[0],y:R.HOME.spot[1],t:'Euer Jahrestag',sub:'Zu Hause am Küchentisch · ab 18 Uhr'};
 return null;};
const target0=X.target;X.target=function(s){return target0(s)||(s&&s.rom?R.target(s):null)||(s&&s.dorf?D.target(s):null);};

/* ---------- Kalender und Tagebuch ---------- */
R.calMarks=function(s,se,d){if(!s.rom)return [];const out=[],abs=cal.abs(cal.y(s),se,d),p=pending(s);
 if(p&&p.day===abs)out.push(p.k==='picknick'?'Picknick':'Ausflug');
 if(s.rom.jb.s===se&&s.rom.jb.d===d)out.push('Dein Geburtstag');
 if(s.rom.jt.s===se&&s.rom.jt.d===d)out.push('Jahrestag');
 const m=s.dorf&&s.dorf.paar;if(m&&m.st==='treffen'&&m.meet===abs)out.push('Mei & Timo');
 return out;};
R.setDate=function(s,which,se,d){R.migrate(s);se=+se;d=+d;if(!['jb','jt'].includes(which)||!Number.isInteger(se)||se<0||se>3||!Number.isInteger(d)||d<1||d>J.DPS)return {ok:false,msg:'Ungültiges Datum.'};
 s.rom[which]={s:se,d,set:s.day};return {ok:true,refresh:true,msg:(which==='jb'?'Dein Geburtstag':'Euer Jahrestag')+': '+d+'. '+J.SEASONS[se]+'. Gefeiert wird einmal im Jahr.'};};
R.diary=function(s,esc){R.migrate(s);const r=s.rom,y=cal.y(s),opt=(w)=>'<select id="romS-'+w+'" aria-label="Jahreszeit">'+J.SEASONS.map((n,i)=>'<option value="'+i+'"'+(r[w].s===i?' selected':'')+'>'+n+'</option>').join('')+'</select><select id="romD-'+w+'" aria-label="Tag">'+Array.from({length:J.DPS},(_,i)=>'<option value="'+(i+1)+'"'+(r[w].d===i+1?' selected':'')+'>'+(i+1)+'.</option>').join('')+'</select>';
 let h='<h3>Wir zwei</h3>';const p=pending(s);
 if(!reneMet(s))h+='<p class="sub">Sprich zuerst mit '+esc(VON())+'.</p>';
 else if(p)h+='<div class="row" data-rom="date"><div class="tx"><b>'+(p.k==='picknick'?'Picknick':'Ausflug')+' mit '+esc(VON())+'</b><small>'+esc(cap(R.PLACES[p.place].n))+' · Spieltag '+p.day+(p.day===s.day?' (heute)':p.day===s.day+1?' (morgen)':'')+' · '+hh(p.from)+' bis '+hh(p.to)+' Uhr</small></div></div>';
 else{h+='<p class="sub">Verabrede dich mit '+esc(VON())+'. Ort und Uhrzeit wählst du selbst.</p>'+R.options(s,'picknick').map(o=>'<button class="btn alt wide" data-a="rom" data-k="'+esc(o.k)+'">Picknick: '+esc(o.t)+'</button>').join('');
  if(R.canPropose(s,'ausflug'))h+=R.options(s,'ausflug').map(o=>'<button class="btn alt wide" data-a="rom" data-k="'+esc(o.k)+'">Ausflug: '+esc(o.t)+'</button>').join('');
  else h+='<p class="sub">Nach eurem ersten Picknick könnt ihr auch einen Ausflug nach Lindenstadt machen.</p>';}
 h+='<div class="row"><div class="tx"><b>Dein Geburtstag</b><small>'+r.jb.d+'. '+esc(J.SEASONS[r.jb.s])+(r.jb.set?'':' · Vorschlag, bitte anpassen')+(r.jbDone[y]&&r.jbDone[y].rene?' · dieses Jahr gefeiert ✓':'')+'</small><span class="dates">'+opt('jb')+'<button class="btn alt" data-a="romdate" data-k="jb">Speichern</button></span></div></div>';
 h+='<div class="row"><div class="tx"><b>Euer Jahrestag</b><small>'+r.jt.d+'. '+esc(J.SEASONS[r.jt.s])+(r.jtDone[y]?' · dieses Jahr gefeiert ✓':'')+'</small><span class="dates">'+opt('jt')+'<button class="btn alt" data-a="romdate" data-k="jt">Speichern</button></span></div></div>';
 if(r.mv.st&&r.mv.st!=='fertig')h+='<div class="row"><div class="tx"><b>Seltsam …</b><small>'+esc(r.mv.st==='hinweis'?'Timo sagt, '+VON()+' hat Holz gekauft. Frag ihn danach.':'Seit dem Picknick weicht '+VON()+' dir aus. Was ist da los?')+'</small></div></div>';
 h+='<h3>Erinnerungen</h3>'+(r.mem.length?r.mem.slice().reverse().map(m=>'<div class="row" data-mem="'+esc(m.k)+'"><div class="tx"><b>♥ '+esc(m.t)+'</b><small>Spieltag '+m.day+' · '+esc(m.txt)+'</small></div></div>').join(''):'<p class="sub">Noch keine. Euer erstes Picknick wartet.</p>');
 return h;};
})();
