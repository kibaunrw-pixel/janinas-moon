"use strict";
/* Die Brunnenchronik: W08/W11/W12/W32. Ergänzt bestehende Ruinen, Post, Figuren und Felder.
   Bestandsprüfung de0367c: Es gab noch KEIN Helfermodul. Dieses gemeinsame System ist die
   einzige Arbeitswarteschlange für Waldgeister; keine zweite parallele Ernteautomatik. */
(function(){
const J=window.JM,R=J.Chronik={},H=J.Helfer={},X=J.Post,D=J.Dorf,T=J.T;
const say=D.say,btn=(a,t,fn,off=false)=>({a,t,fn,off});
R.HINTS=[
 'Die Chronik schläft noch. Öffne zuerst Henks Waldtür.',
 'Lies die Steintafel im Gewölbe hinter der Waldtür.',
 'Suche auf Ebene 9 der Mine die beschriftete Ruinenplatte links vom Aufstieg.',
 'Am reparierten alten Dorfbrunnen erinnert sich Hedwig an das Versprechen. Die Brunnen-Briefe führen zur Reparatur.',
 'Der Steinring im Vollmondwald trägt die letzte Zeile. Zugang am 14. Tag jeder Jahreszeit über das Gewölbe.',
 'Zeige Jonas die vollständige Inschrift (7–11 Bahnhof, 11–16 Dorf, 16–21 Lindenstadt).',
 'Die Chronik ist vollständig. Lumi hilft dir auf dem Hof; Aufträge am Steinring oder im Gewölbe.'
];
R.migrate=function(s){if(!s.chronik||typeof s.chronik!=='object')s.chronik={stage:0};if(!Number.isInteger(s.chronik.stage)||s.chronik.stage<0||s.chronik.stage>6)s.chronik.stage=0;
 if(!s.helpers||typeof s.helpers!=='object')s.helpers={};if(!s.helpers.report)s.helpers.report={day:0,count:0,text:'Noch kein Auftrag.'};return s;};
const mig=J.Ausbau.migrate;J.Ausbau.migrate=s=>{mig(s);return R.migrate(s);};
function letter(s,o){return Object.assign({id:'chronik-'+s.day+'-'+(++s.post.seq),day:s.day,read:false,kind:'geheim'},o);}
R.advance=function(s){R.migrate(s);const m=s.chronik;
 if(!m.stage&&['offen','fertig'].includes(s.post.m.tuer.st)){m.stage=1;s.mailQ.push(letter(s,{from:'unbekannt',t:'Vier Zeilen im Stein',b:'Im Gewölbe beginnt eine Geschichte, die niemand allein bewahren kann. Lies die Steintafel. Auf der neunten Ebene der Mine steht ihre zweite Zeile. Am alten Brunnen und im Vollmondwald findest du den Rest. Bitte bring alles zu Jonas.\n\nEine Freundin des Dorfes'}));return true;}return false;};
// Auch fortgeschrittene Höfe erhalten die Einladung bei der nächsten regulären Nacht.
const night=X.night;X.night=function(s,...args){R.advance(s);return night(s,...args);};
R.clue=function(s,id){R.migrate(s);const m=s.chronik,n={tafel:1,ruine:2,hedwig:3,ring:4}[id];if(n!==m.stage)return false;
 if(id==='hedwig'&&s.post.m.brunnen.st!=='fertig')return false;m.stage++;return true;};
const TEXT={tafel:'„Als die Quelle versiegte, trugen die Menschen Wasser in den Wald.“ Die zweite Zeile liegt bei den alten Ruinen auf Ebene 9 der Mine.',ruine:'„Die kleinen Hüter brachten dafür die Ernte heim. Niemand musste allein arbeiten.“ Ein eingeritzter Krug weist zum alten Brunnen im Dorf.',hedwig:'Hedwigs Stimme klingt aus dem Wasser: „Ich schrieb den Brief. Nicht um die Vergangenheit zurückzuholen, sondern damit Jonas das Versprechen weitergeben kann. Im Steinring des Vollmondwalds steht die letzte Zeile.“',ring:'„Licht zeigt den Heimweg. Wasser nährt die Wurzeln. Beides gehört allen.“ Jonas kann die vier Zeilen nun zusammenfügen.'};
R.readClue=function(s,id){R.advance(s);const got=R.clue(s,id);return {refresh:true,lines:[say(null,got?TEXT[id]:R.HINTS[s.chronik.stage]) ]};};
R.resolve=function(s,choice){R.migrate(s);const m=s.chronik;if(m.stage!==5||!['licht','wasser'].includes(choice))return false;m.stage=6;m.choice=choice;m.done=s.day;s.inv.mondtau=(s.inv.mondtau||0)+2;
 s.mailQ.push(letter(s,{from:'jonas',t:'Hedwigs Versprechen',b:'Die vier Zeilen stehen jetzt in unserer Dorfchronik. Großmutter war die unbekannte Briefschreiberin. Danke, dass du ihre Erinnerung nicht für dich behalten hast.\n\n'+(choice==='licht'?'Du hast die Lichtlaterne gewählt: Lumi bleibt bis 20 Uhr auf dem Hof sichtbar.':'Du hast die Wasserschale gewählt: Lumi gießt bis zu 16 statt 12 Beete pro Tag.')+'\n\nDu kannst die Ausrichtung später kostenlos am Steinring wechseln. Kein Ort und keine Geschichte geht dadurch verloren. Lumi wartet auch im Gewölbe.\n\nJonas'}));return true;};
R.choicePanel=s=>({panel:{t:'Hedwigs Versprechen',p:['Jonas legt die vier Abschriften nebeneinander: Früher half das Dorf den Waldgeistern, und die Geister halfen bei der Ernte. Hedwig wollte dieses Versprechen erneuern. Sie hat dir den geheimen Brief geschickt.','Welche kleine Magie soll hier wohnen: Licht oder Wasser? Beide schalten dieselbe Hilfe frei. Keine Sperren, kein Verlust; später kostenlos wechselbar.'],buttons:[btn('chronik-licht','Lichtlaterne · Lumi bleibt bis 20 Uhr sichtbar',()=>R.finish(s,'licht')),btn('chronik-wasser','Wasserschale · 16 statt 12 Beete gießen',()=>R.finish(s,'wasser'))]}});
R.finish=function(s,k){return R.resolve(s,k)?{refresh:true,sfx:'fanfare',lines:[say('jonas','Jetzt fehlt diese Seite nicht mehr. Ich schreibe auch deinen Namen dazu.'),say('lumi','Ich bin Lumi. Im Gewölbe kannst du mich für ein oder drei Tage zum Gießen, Ernten oder Füttern einteilen. Ohne Bezahlung – wir helfen einander.'),say(null,'Zwei Mondtau liegen im Rucksack. Dein Tagebuch bewahrt alle vier Zeilen und die gewählte Wirkung.')] }:null;};
const gAct=J.Magie.act;J.Magie.act=function(s,a){if(a==='ring'){R.advance(s);if(s.chronik.stage<6)return R.readClue(s,'ring');return H.panel(s,true);}return gAct(s,a);};
const evAct=X.evAct;X.evAct=function(s,a){if(String(a).startsWith('chronik:')){const id=a.slice(8);return id==='helfer'?H.panel(s):R.readClue(s,id);}if(a==='tafel64'){/* Die Chronik überdeckte bisher den Mondtor-Hinweis der Tafel ganz; er steht jetzt immer darunter. */const r=R.readClue(s,'tafel'),mo=J.Magie&&J.Magie.moon(s.day);r.lines.push(say(null,'Darunter, kleiner eingemeißelt: „Bei Vollmond erwacht rechts an dieser Wand das Mondtor. Dahinter liegt der Wald, wie er nachts wirklich ist.“'+(mo?(mo.full?' Heute ist Vollmond.':' Noch '+mo.until+' Tage bis Vollmond.'):'')));return r;}if(a==='brunnen'&&s.chronik?.stage===3&&s.post.m.brunnen.st==='fertig')return R.readClue(s,'hedwig');return evAct?.(s,a);};
const talk=X.evTalk;X.evTalk=function(s,id){if(id==='lumi')return H.panel(s);if(id==='jonas'&&s.chronik?.stage===5)return R.choicePanel(s);return talk?.(s,id);};
H.JOBS={ernte:'Ernten',wasser:'Gießen',tiere:'Hühner und Kühe füttern'};
H.assign=function(s,job,days){R.migrate(s);const h=s.helpers;if(s.chronik.stage!==6||!H.JOBS[job]||![1,3].includes(days)||(h.job&&h.until>=s.day))return false;h.job=job;h.start=s.day;h.until=s.day+days-1;return true;};
H.tick=function(s){R.migrate(s);const h=s.helpers;if(s.chronik.stage!==6||!h.job||s.day>h.until||s.min<600||h.last===s.day)return null;
 h.last=s.day;let count=0;const limit=h.job==='wasser'&&s.chronik.choice==='wasser'?16:12;let spot=[8,11];
 if(h.job==='tiere'){for(const [k,list]of [['h',s.hens],['c',s.cows]]){const need=Math.max(0,(list||[]).length-(s.trough[k]||0)),n=Math.min(need,s.inv.futter||0);s.inv.futter=(s.inv.futter||0)-n;s.trough[k]=(s.trough[k]||0)+n;count+=n;}spot=[18,8];}
 else for(const [key,f] of Object.entries(s.field||{})){if(count>=limit)break;
  if(h.job==='wasser'&&f.t&&!f.w&&!f.o){f.w=true;count++;spot=key.split(',').map(Number);}
  if(h.job==='ernte'&&f.c&&J.CROPS[f.c.k]&&f.c.a>=J.CROPS[f.c.k].days){const cr=J.CROPS[f.c.k],giant=!!f.c.g,k=J.Ausbau.harvestItem(f.c.k,giant);s.inv[k]=(s.inv[k]||0)+1;s.stats.harvest=(s.stats.harvest||0)+(giant?5:1);if(giant)s.stats.giant=(s.stats.giant||0)+1;if(cr.re){f.c.a=cr.days-cr.re;delete f.c.g;}else{f.c=null;f.d=false;}count++;spot=key.split(',').map(Number);}
 }
 h.spot=spot;h.report={day:s.day,count,text:H.JOBS[h.job]+': '+count+(h.job==='tiere'?' Futter aus deinem Rucksack.':' Beete. Ernte liegt im Rucksack.')};return {note:'Lumis Tagesbericht · '+h.report.text,refresh:true};};
H.panel=function(s,ring=false){R.migrate(s);if(s.chronik.stage!==6)return {note:R.HINTS[s.chronik.stage]};const h=s.helpers,active=h.job&&h.until>=s.day;
 const buttons=[];if(!active)for(const job in H.JOBS)for(const days of [1,3])buttons.push(btn('helfer-'+job+'-'+days,H.JOBS[job]+' · '+days+' Tag'+(days>1?'e':''),()=>H.assign(s,job,days)?{refresh:true,note:'Lumi kommt ab 10 Uhr. Auftrag bis einschließlich Spieltag '+s.helpers.until+'.'}:null));
 if(ring)buttons.push(btn('chronik-wechsel','Ausrichtung kostenlos wechseln',()=>{s.chronik.choice=s.chronik.choice==='licht'?'wasser':'licht';return Object.assign(H.panel(s,true),{refresh:true});}));
 return {panel:{t:'Lumis Helferhaus im Gewölbe',p:['Eine gemeinsame Arbeitsliste für die kleinen Waldhüter. Keine zweite Erntequelle: Lumi nimmt nur reife Pflanzen von deinen echten Beeten. Höchstens 12 Beete täglich; Wasserschale: 16 beim Gießen.','Arbeit ab 10 Uhr, einmal je Tag. Füttern nutzt ausschließlich Tierfutter aus deinem Rucksack und füllt nur fehlende Portionen bei Hühnern und Kühen. Mondblüten brauchen weiterhin nächtliches Handgießen.',active?'Auftrag: '+H.JOBS[h.job]+' · bis Tag '+h.until+'. Danach kannst du neu einteilen.':'Kein laufender Auftrag.',h.report.text,'Ausrichtung: '+(s.chronik.choice==='licht'?'Lichtlaterne · Lumi sichtbar bis 20 Uhr.':'Wasserschale · 16 statt 12 Beete beim Gießen.')],buttons}};};
// Eigene Figur, aber kein neuer Pflichtbewohner für bereits erreichte Freundschaftserfolge.
J.NPCS.lumi={...J.NPCS.jonas,n:'Lumi',role:'Waldhüterin',home:'waldtuer',look:{...J.NPCS.mei.look,hair:'#cfe9cf',top:'#8bd5c7'},intro:'Ich hüte die kleinen Dinge.',bday:[9,99],sched:[[360,'off']]};
const loc=J.Stadt.location;J.Stadt.location=function(s,id,fest){if(id==='lumi'){if(s.chronik?.stage!==6)return null;const h=s.helpers||{};if(h.job&&s.day<=h.until&&s.min>=540&&s.min<(s.chronik.choice==='licht'?1200:1080)){const p=h.spot||[8,11];return {map:'farm',x:p[0],y:p[1]-1};}return {map:'waldtuer',x:6,y:5};}return loc(s,id,fest);};
function put(m,o){if(m.obj.some(q=>q.x===o.x&&q.y===o.y))return;m.obj.push(o);m.t[o.y][o.x]=T.BLOCK;}
R.apply=function(maps,s){put(maps.hoehle9,{k:'steintafel',x:7,y:15,act:'chronik:ruine'});put(maps.waldtuer,{k:'mondpilze',x:3,y:5,act:'chronik:helfer'});
 if(s?.chronik?.stage===6){for(const o of [{k:'table',x:7,y:5},{k:'plant',x:9,y:5},{k:'lamp',x:2,y:5}])put(maps.waldtuer,{...o,act:'chronik:helfer'});for(let x=6;x<=8;x++)if(J.WALK.has(maps.waldtuer.t[4][x]))maps.waldtuer.t[4][x]=T.TEPPICH;}
 for(const id of ['waldtuer','hoehle9'])maps[id].houseLevel=String(maps[id].houseLevel||'').replace(/\|chronik:\d+$/,'')+'|chronik:'+(s?.chronik?.stage||0);return maps;};
const bm=J.buildMaps;J.buildMaps=()=>R.apply(bm(),null);const ap=J.Stadt.apply;J.Stadt.apply=function(maps,s){ap(maps,s);return R.apply(maps,s);};
R.diary=function(s,esc=String){R.migrate(s);const m=s.chronik;return '<h3>Die Brunnenchronik · '+m.stage+'/6</h3><p>'+esc(R.HINTS[m.stage])+'</p>'+Object.keys(TEXT).slice(0,Math.max(0,Math.min(4,m.stage-1))).map(k=>'<p>'+esc(TEXT[k])+'</p>').join('')+(m.stage===6?'<p>Abgeschlossen: Hedwig schrieb den Brief; Jonas bewahrt die Chronik. Ausrichtung: '+esc(m.choice==='licht'?'Lichtlaterne: Lumi bis 20 Uhr sichtbar.':'Wasserschale: 16 Gießbeete.')+' Kostenlos am Steinring änderbar.</p><p>'+esc(s.helpers.report.text)+'</p>':'');};
})();
