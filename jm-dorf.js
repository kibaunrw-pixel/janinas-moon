"use strict";
/* Etappe 2 – Lebendiges Dorf. Baut auf jm-post.js/jm-ereignisse.js auf (dieselbe Post, derselbe Wegweiser,
   dasselbe Skriptformat {lines, banner, sfx, fx}). Alle Zeiten sind Spieluhr und Spieltage.

   W01 Geheimnisse   Mei, Henk, Paula und Rosa erzählen je eine Geschichte in drei Teilen (ab 2, 4 und 6 Herzen,
                     höchstens ein Teil pro Tag). Der Lohn im dritten Teil kommt genau einmal (Vermerk paid).
   W02 Beziehungen   Freundschaft Rosa–Henk, Streit Lin–Paula, Verliebtheit Mei–Timo. Jede Beziehung hat eine Szene,
                     danach ändern sich Gespräche (extraLines) und teils Aufenthaltsorte.
   W04 Tratsch       Nur Tatsachen aus dem Spielstand (FACTS[].ok). Jede Meldung wird einmal erzählt, nie von Beteiligten.
   W06 Verkuppeln    Mei und Timo: Hinweis → Timo → Brief oder Frage → Treffen (Ort wählen) → Entscheidung → Paar.
                     Verpasste Treffen lassen sich neu ausmachen, nichts sperrt.
   W38 Geburtstage   Geschenk am Geburtstag: eigene Antwort und am nächsten Morgen ein Dankesbrief (einmal pro Jahr). */
(function(){
const J=window.JM,X=J.Post,St=J.Stadt,D=J.Dorf={};
const DPS=J.DPS;
const cal=D.cal={se:s=>Math.floor((s.day-1)/DPS)%4,d:s=>(s.day-1)%DPS+1,y:s=>Math.floor((s.day-1)/(DPS*4))+1,wd:s=>(s.day-1)%7,
 abs:(y,se,d)=>(y-1)*DPS*4+se*DPS+d};
const H=D.hearts=(s,id)=>Math.min(10,Math.floor(((s.npc&&s.npc[id]&&s.npc[id].p)||0)/100));
const nm=D.nm=id=>J.NPCS[id]?J.NPCS[id].n:id;
const met=(s,id)=>!!(s.npc&&s.npc[id]&&s.npc[id].met);
const fill=D.fill=(s,t)=>String(t).replace(/\{name\}/g,s.name||'Janina').replace(/\{von\}/g,(J.CONFIG&&J.CONFIG.von)||'René');
const say=D.say=(who,text,choices)=>choices?{who,text,choices}:{who,text};
const PM=s=>(s.post&&s.post.m)||{};
const pst=(s,id)=>(PM(s)[id]||{}).st||'';
function give(s,r){if(r.money){s.money=(s.money||0)+r.money;if(s.stats)s.stats.earned=(s.stats.earned||0)+r.money;}s.inv=s.inv||{};for(const [k,n] of Object.entries(r.items||{}))s.inv[k]=(s.inv[k]||0)+n;}
D.give=give;
const addP=D.addP=(s,id,n)=>{const q=s.npc&&s.npc[id];if(q)q.p=Math.max(0,Math.min(1000,(q.p||0)+n));};
function letter(s,o){s.post.seq=(s.post.seq||0)+1;return Object.assign({id:'p'+s.day+'-'+s.post.seq,day:s.day,read:false},o);}
D.letter=letter;

/* ---------- Zustand und Migration ---------- */
const SECIDS=['mei','henk','paula','rosa'];
D.migrate=function(s){let d=s.dorf;if(!d||typeof d!=='object')d=s.dorf={};d.v=1;
 if(!d.sec||typeof d.sec!=='object')d.sec={};
 for(const id of SECIDS){const m=d.sec[id];d.sec[id]=m&&typeof m==='object'&&Number.isInteger(m.st)?m:{st:0,day:0};}
 for(const k of ['streit','paar','freund'])if(!d[k]||typeof d[k]!=='object'||typeof d[k].st!=='string')d[k]={st:''};
 for(const k of ['said','bd'])if(!d[k]||typeof d[k]!=='object')d[k]={};
 return s;};
const mig=J.Ausbau.migrate;J.Ausbau.migrate=function(s){mig(s);D.migrate(s);return s;};

/* ---------- W01 Geheimnisse ---------- */
D.SEC={
 mei:{t:'Meis Fernweh',need:[2,4,6],reward:{items:{erdbeere_s:5}},rewardTxt:'5× Erdbeersamen',steps:[
  {sum:'Mei sammelt Postkarten vom Meer. Sie war noch nie dort.',lines:['Darf ich dir etwas zeigen? Aber nicht lachen.','Postkarten. Alle vom Meer. Ich sammle sie, seit ich klein bin.','Ich war noch nie dort. Kein einziges Mal. Die Marktfrau, die nie wegkommt.']},
  {sum:'Ihre Oma hat den Markt vierzig Jahre ohne freien Tag geführt. Mei hat Angst, ihn allein zu lassen.',lines:['Weißt du, warum ich nie fahre? Oma hat den Markt vierzig Jahre geführt. Ohne einen freien Tag.','Ich habe Angst, dass alles zusammenbricht, wenn ich einmal weg bin.','Dabei ist es nur ein Laden. Komisch, oder?']},
  {sum:'Mei hat eine Fahrkarte ans Meer gekauft. Rosa passt auf den Laden auf.',lines:s=>['Ich hab es getan. Ich habe eine Fahrkarte gekauft. Ans Meer, im Herbst.',
    (s.dorf.paar.st==='paar'?'Rosa passt einen Tag auf den Laden auf. Und Timo kommt mit. Er will Muscheln für ein Regal sammeln.':'Rosa passt einen Tag auf den Laden auf. Sie hat vor Freude gelacht.'),
    'Ohne dich hätte ich mich das nie getraut. Hier, die besten Samen aus dem Lager. Für dich.']}]},
 henk:{t:'Henks Geheimnis am Fluss',need:[2,4,6],reward:{items:{forelle:3}},rewardTxt:'3× Forelle',steps:[
  {sum:'Henk ist seit fünfzig Jahren Fischer und kann nicht schwimmen.',lines:['Ich sag dir was, das keiner weiß.','Fünfzig Jahre Fischer. Und ich kann nicht schwimmen.','Lach ruhig. Ich hab auch mal darüber gelacht. Lange her.']},
  {sum:'Als Junge fiel er in den eiskalten Fluss. Eine Frau aus dem Dorf hat ihn herausgezogen.',lines:['Als Junge bin ich im Frühling in den Fluss gefallen. Das Wasser war eiskalt.','Eine Frau aus dem Dorf hat mich rausgezogen. Mit bloßen Händen.','Seitdem sitze ich am Ufer. Ich glaube, ich warte darauf, ihr danken zu können.']},
  {sum:'Die Frau hieß Hedwig.',lines:s=>['Sie hieß Hedwig. Sie hat beim alten Brunnen gewohnt.',
    (pst(s,'bewohner')==='fertig'?'Ihr Enkel Jonas lebt jetzt hier. Gestern habe ich ihm alles erzählt. Er hat geweint. Ich auch, ein bisschen.':'Sie ist lange fort. Aber jetzt weiß es jemand. Das fühlt sich gut an.'),
    'Hier. Drei Forellen aus meinem Eimer. Für dich.']}]},
 paula:{t:'Paulas Lied',need:[2,4,6],reward:{items:{milch:3}},rewardTxt:'3× Milch',steps:[
  {sum:'Paula singt abends im Stall für ihre Kühe.',lines:['Psst. Hast du gestern Abend jemanden singen hören? Im Stall?','Das war ich. Für die Kühe. Dann geben sie mehr Milch. Ehrlich!','Na gut. Eigentlich singe ich, weil ich es liebe.']},
  {sum:'Mit achtzehn hatte sie einen Platz an der Musikschule in Lindenstadt. Sie blieb für den Hof.',lines:['Mit achtzehn hatte ich einen Platz an der Musikschule in Lindenstadt.','Dann wurde Papa krank, und jemand musste den Hof führen.','Ich bereue nichts. Na gut. Manchmal, abends.']},
  {sum:'Paula singt beim nächsten Fest auf dem Dorfplatz.',lines:['Ich hab mich getraut. Ich habe Rosa gefragt, ob ich beim nächsten Fest singen darf.','Sie hat Ja gesagt! Du kommst doch, oder? Versprochen?','Hier, frische Milch. Als Dank fürs Zuhören.']}]},
 rosa:{t:'Rosas Chronik',need:[2,4,6],reward:{items:{mondquarz:1}},rewardTxt:'einen Mondquarz',steps:[
  {sum:'Rosa schreibt seit vierzig Jahren heimlich die Dorfchronik.',lines:['Weißt du, dass ich die Dorfchronik schreibe? Seit vierzig Jahren.','Jeden Abend eine Seite. Wer geboren wurde, wer gegangen ist, wer geblieben ist.','Gelesen hat sie noch niemand. Nicht einmal Henk.']},
  {sum:'Als junge Frau wollte sie fort. Die Frau vom Mondhof hat sie am Bahnhof umgestimmt.',lines:['Als junge Frau wollte ich weg. Der Koffer stand schon gepackt am Bahnhof.','Die Frau vom Mondhof hat mich dort aufgehalten. Sie sagte: Ein Dorf braucht jemanden, der sich erinnert.','Also bin ich geblieben. Und habe angefangen zu schreiben.']},
  {sum:'Das neueste Kapitel der Chronik trägt deinen Namen.',lines:['Lies die letzte Seite. Ich habe sie gestern geschrieben.','„Der Mondhof hat wieder eine Bewohnerin. Seitdem ist das Dorf lauter, wärmer und lebendiger.“','Das Kapitel heißt {name}. Den Mondquarz hier lege ich dir als Lesezeichen dazu.']}]}
};
D.secretTalk=function(s,id){const g=D.SEC[id];if(!g)return null;const m=s.dorf.sec[id];if(m.st>=3)return null;
 if(H(s,id)<g.need[m.st])return null;if(m.st>0&&m.day>=s.day)return null;
 const step=g.steps[m.st];m.st++;m.day=s.day;
 const lines=(typeof step.lines==='function'?step.lines(s):step.lines).map(t=>say(id,fill(s,t)));
 let banner=null;if(m.st===3&&!m.paid){m.paid=s.day;give(s,g.reward);addP(s,id,50);banner='Ein Geheimnis gelüftet';lines.push(say(null,'Du bekommst '+g.rewardTxt+'.'));}
 lines.push(say(null,'Im Tagebuch steht jetzt „'+g.t+'“, Teil '+m.st+' von 3.'));
 return {hud:m.st===3,banner,sfx:m.st===3?'fanfare':'gift',lines,fx:[id]};};

/* ---------- W02 Beziehungen ---------- */
D.REL=[{a:'rosa',b:'henk',k:'freund'},{a:'lin',b:'paula',k:'streit'},{a:'mei',b:'timo',k:'liebe'}];
D.relations=function(s){const d=s.dorf,out=[];
 out.push({a:'rosa',b:'henk',k:'freund',label:'Alte Freunde',txt:d.freund.st==='erzaehlt'?'Seit der Schulbank befreundet. Sonntags trinken sie Tee am Fluss.':'Rosa und Henk kennen sich seit der Schulzeit.'});
 const sv=d.streit.st;out.push({a:'lin',b:'paula',k:sv==='versoehnt'?'freund':sv?'streit':'?',label:sv==='versoehnt'?'Wieder Freunde':sv?'Streit':'Noch unbekannt',
  txt:sv==='versoehnt'?'Ein Missverständnis um Lins Chilisuppe ist ausgeräumt. Mittwochs kochen sie zusammen.':sv==='zeit'?'Lin schläft eine Nacht über Paulas Zettel.':sv==='zettel'?'Paula hat dir einen Zettel für Lin mitgegeben.':sv==='lin'?'Lin ist gekränkt. Paula soll seine Chilisuppe ungenießbar genannt haben.':'Zwischen Lin und Paula ist es seltsam still.'});
 const pv=d.paar.st;out.push({a:'mei',b:'timo',k:pv==='paar'?'paar':pv?'liebe':'?',label:pv==='paar'?'Ein Paar':pv?'Heimlich verliebt':'Noch unbekannt',
  txt:pv==='paar'?'Abends stehen sie zusammen '+((D.MEET[d.paar.place]||D.MEET.brunnen).n)+'.':pv==='treffen'?'Treffen '+((D.MEET[d.paar.place]||{}).n||'')+', Spieltag '+d.paar.meet+' um 18 Uhr.':pv==='brief'?'Du trägst Timos Brief und einen geschnitzten Holzvogel für Mei.':pv==='fragen'?'Timo möchte wissen, ob Mei ihn treffen will.':pv==='hinweis'?'Mei wird rot, sobald Timos Name fällt.':'Mei und Timo sehen sich nur, wenn Holz geliefert wird.'});
 return out;};

/* Streit Lin–Paula */
D.streitTalk=function(s,id){const m=s.dorf.streit;
 if(id==='lin'&&!m.st&&met(s,'paula')&&H(s,'lin')>=2){m.st='lin';m.day=s.day;
  return {lines:[say('lin','Paula? Frag mich lieber nicht nach Paula.'),say('lin','Beim letzten Dorfessen hat sie meine Chilisuppe probiert und laut gerufen, sie sei ungenießbar. Vor allen.'),say('lin','Seitdem kocht sie für ihre Hühner. Und ich für alle anderen.'),say('player','Ob Paula das wirklich so gemeint hat? Ich frage sie mal.')],fx:null};}
 if(id==='paula'&&m.st==='lin'){m.st='zettel';m.day=s.day;
  return {lines:[say('paula','Lin hat dir davon erzählt? Oh nein.'),say('paula','Ich habe nicht ungenießbar gesagt. Ich habe gesagt: unglaublich scharf! Mir sind die Tränen gekommen.'),say('paula','Ich vertrage einfach kein Chili. Aber ich habe mich nie getraut, es richtigzustellen. Lin ist so stolz auf seine Küche.'),say('paula','Bringst du ihm diesen Zettel? Bitte.'),say(null,'Du trägst jetzt Paulas Zettel für Lin bei dir.')]};}
 if(id==='lin'&&m.st==='zettel')return {lines:[say('lin','Ein Zettel? Von Paula?'),say(null,'„Lieber Lin, ich habe nicht ungenießbar gesagt, sondern unglaublich scharf. Ich vertrage kein Chili. Darf ich trotzdem wieder zu dir zum Essen kommen? Paula“'),
  say('lin','Unglaublich scharf. Das ist ja fast ein Kompliment.',[{t:'„Sie meint es ehrlich. Gib ihr eine Chance.“',fn:()=>D.streitEnd(s,'jetzt')},{t:'„Lass dir ruhig Zeit damit.“',fn:()=>D.streitEnd(s,'zeit')}])]};
 if(id==='lin'&&m.st==='zeit'&&m.day<s.day)return D.streitEnd(s,'spaeter');
 return null;};
D.streitEnd=function(s,how){const m=s.dorf.streit;
 if(how==='zeit'){if(m.st!=='zettel')return null;m.st='zeit';m.day=s.day;return {lines:[say('lin','Danke. Ich schlafe eine Nacht darüber.'),say(null,'Morgen sieht Lin die Sache vielleicht schon anders.')]};}
 if(!['zettel','zeit'].includes(m.st))return null;m.st='versoehnt';m.day=s.day;m.how=how;addP(s,'lin',30);addP(s,'paula',30);
 return {banner:'Lin und Paula vertragen sich',sfx:'fanfare',fx:['lin','paula'],lines:[
  say('lin',how==='spaeter'?'Ich habe darüber geschlafen. Du hattest recht. Ich war gekränkt, nicht im Recht.':'Du hast recht. Ich war gekränkt, nicht im Recht.'),
  say('lin','Sag Paula, sie soll am Mittwoch kommen. Ich koche eine milde Brühe. Nur für sie.'),
  say(null,'Lin und Paula reden wieder miteinander. Mittwochs am Nachmittag triffst du sie zusammen auf dem Dorfplatz.')]};};

/* Freundschaft Rosa–Henk: Szene, nachdem Henk dir sein Geheimnis ganz erzählt hat */
D.freundTalk=function(s,id){const m=s.dorf.freund;if(id!=='rosa'||m.st||s.dorf.sec.henk.st<3||s.dorf.sec.henk.day>=s.day)return null;m.st='erzaehlt';m.day=s.day;
 return {fx:['rosa'],lines:[say('rosa','Henk hat dir von Hedwig erzählt? Das hat er fünfzig Jahre lang nur mir anvertraut.'),say('rosa','Wir sind seit der Schulbank befreundet. Für die Chronik diktiert er mir jeden Abend den Fang des Tages.'),say('rosa','Wenn er dir so etwas erzählt, gehörst du wirklich zu uns.')]};};

/* ---------- W06 Mei und Timo ---------- */
D.MEET={brunnen:{n:'am Dorfbrunnen',mei:[14,12],timo:[15,12],spot:[14,13]},ufer:{n:'am Seeufer beim Steg',mei:[8,22],timo:[10,22],spot:[9,22]}};
D.meetFrom=1080;D.meetTo=1200;
const meetNow=(s,m)=>s.day===m.meet&&s.min>=D.meetFrom&&s.min<D.meetTo;
const placeChoices=s=>Object.entries(D.MEET).map(([k,p])=>({t:'„'+p.n[0].toUpperCase()+p.n.slice(1)+', '+(s.min<1020?'heute':'morgen')+' um 18 Uhr.“',fn:()=>D.arrange(s,k)}));
D.arrange=function(s,place){const m=s.dorf.paar;if(!D.MEET[place]||!['brief','fragen','treffen'].includes(m.st))return null;if(m.st==='treffen'&&meetNow(s,m))return null;
 m.st='treffen';m.place=place;m.meet=s.min<1020?s.day:s.day+1;m.set=s.day;
 return {lines:[say('mei','Dann ist es abgemacht. '+D.MEET[place].n[0].toUpperCase()+D.MEET[place].n.slice(1)+', '+(m.meet===s.day?'heute':'morgen')+' um 18 Uhr.'),say('mei','Mein Herz klopft jetzt schon.'),say(null,'Sei um 18 Uhr '+D.MEET[place].n+'. Das Treffen dauert bis 20 Uhr.')]};};
D.together=function(s,how){const m=s.dorf.paar;if(m.st!=='treffen'||!meetNow(s,m))return null;m.st='paar';m.day=s.day;m.how=how;addP(s,'mei',50);addP(s,'timo',50);
 const first=how==='timo'?[say('timo','Mei … ich bringe dir jede Woche Holz. Du brauchst gar keins. Ich wollte dich nur sehen.'),say('mei','Ich weiß. Ich habe jedes Brett aufgehoben.')]
  :[say('mei',m.brief?'Der Vogel steht neben meiner Kasse. Ich schaue ihn jeden Morgen an.':'Timo, willst du am Sonntag mit mir spazieren gehen?'),say('timo','Ja. Ja! Am Sonntag. Und an jedem anderen Tag auch.')];
 return {banner:'Mei und Timo sind ein Paar',sfx:'fanfare',fx:['mei','timo'],lines:[...first,say(null,'Mei nimmt Timos Hand. Beide lachen, ein bisschen verlegen.'),say('timo','Danke, {name}. Ohne dich stünden wir noch immer am Brunnen und redeten übers Wetter.'),say(null,'Ab jetzt triffst du die beiden abends von 18 bis 19:30 Uhr zusammen '+D.MEET[m.place].n+'.')]};};
D.paarTalk=function(s,id){const m=s.dorf.paar;
 if(!m.st&&id==='mei'&&H(s,'mei')>=3&&met(s,'timo')){m.st='hinweis';m.day=s.day;
  return {lines:[say('mei','Darf ich dich etwas fragen? Rein theoretisch.'),say('mei','Wenn jemand jeden Dienstag Holz an den Markt liefert, obwohl der Markt gar kein Holz braucht … was hat das zu bedeuten?'),say('mei','Vergiss es! Das war nur so ein Gedanke.'),say(null,'Mei ist ganz rot geworden. Holz liefert im Dorf nur einer: Timo.')]};}
 if(m.st==='hinweis'&&id==='timo')return {lines:[say('timo','Mei? Hat sie etwas über mich gesagt?'),say('timo','Ich bringe ihr jede Woche Holz. Sie braucht keins. Ich weiß.'),
  say('timo','Ich habe ihr einen kleinen Vogel geschnitzt und einen Brief geschrieben. Aber ich traue mich nicht.',[{t:'„Ich bringe ihr beides.“',fn:()=>D.paarStep(s,'brief')},{t:'„Trau dich! Ich frage sie, ob sie dich treffen will.“',fn:()=>D.paarStep(s,'fragen')}])]};
 if((m.st==='brief'||m.st==='fragen')&&id==='mei')return {lines:[
  ...(m.st==='brief'?[say(null,'Du gibst Mei den Holzvogel und Timos Brief.'),say('mei','Er hat … einen Vogel geschnitzt? Für mich?'),say(null,'Mei liest. Dann liest sie noch einmal.')]:[say('player','Timo würde dich gern treffen. Nur ihr zwei.'),say('mei','Wirklich? Timo? Mich?')]),
  say('mei','Wo sollen wir uns treffen? Hilf mir!',placeChoices(s))]};
 if(m.st==='treffen'&&(id==='mei'||id==='timo')){
  if(meetNow(s,m))return {fx:['mei','timo'],lines:[say(null,'Mei und Timo stehen '+D.MEET[m.place].n+'. Keiner sagt ein Wort.'),say('timo','Also … schönes Wetter heute.'),
   say('mei','Ja. Sehr … Wetter.',[{t:'„Timo, du wolltest Mei doch etwas sagen.“',fn:()=>D.together(s,'timo')},{t:'„Mei, du wolltest Timo doch etwas fragen.“',fn:()=>D.together(s,'mei')}])]};
  if(s.day<m.meet||(s.day===m.meet&&s.min<D.meetFrom))return {lines:[say(id,id==='mei'?'Um 18 Uhr '+D.MEET[m.place].n+'. Ich bin so nervös.':'Heute Abend … oder morgen? Nein, ich weiß es genau. Ich bin pünktlich.')]};
  if(id==='mei')return {lines:[say('mei','Wir haben beide gewartet. Und uns dann doch nicht getraut, den Anfang zu machen.'),say('mei','Versuchen wir es noch einmal? Mit dir in der Nähe trau ich mich eher.',placeChoices(s))]};
  return {lines:[say('timo','Wir haben nur übers Wetter geredet. Frag Mei, ob wir es noch einmal versuchen.')]};}
 return null;};
D.paarStep=function(s,how){const m=s.dorf.paar;if(m.st!=='hinweis'||!['brief','fragen'].includes(how))return null;m.st=how;m.day=s.day;m.brief=how==='brief';
 return how==='brief'?{lines:[say('timo','Wirklich? Danke! Hier, der Vogel und der Brief. Pass gut darauf auf.'),say(null,'Du trägst jetzt Timos Brief und den Holzvogel für Mei.')]}
  :{lines:[say('timo','Du hast recht. Frag sie bitte, ob sie mich treffen will. Den Rest schaffe ich.'),say(null,'Frag Mei, ob sie Timo treffen möchte.')]};};

/* ---------- Gespräche: Vorrang und neue Zeilen ---------- */
/* Laufende Geschichten (Streit, Verkuppeln) gehen vor, damit ein neues Geheimnis sie nicht unterbricht; danach Geheimnisse, dann neue Geschichten. */
D.talk=function(s,id){D.migrate(s);const d=s.dorf;
 const run=(d.streit.st&&d.streit.st!=='versoehnt'?D.streitTalk(s,id):null)||(d.paar.st&&d.paar.st!=='paar'?D.paarTalk(s,id):null);
 return run||D.secretTalk(s,id)||D.streitTalk(s,id)||D.paarTalk(s,id)||D.freundTalk(s,id);};
D.extraLines=function(s,id){D.migrate(s);const d=s.dorf,o=[];
 if(id==='mei'){if(d.paar.st==='paar')o.push('Timo hat mir einen Holzvogel geschnitzt. Er steht jetzt neben der Kasse.','Abends mit Timo ist mein Lieblingsmoment. Du weißt schon, warum.');if(d.sec.mei.st>=3)o.push('Im Herbst fahre ich ans Meer. Ich zähle schon die Tage.');}
 if(id==='timo'&&d.paar.st==='paar')o.push('Mei und ich gehen sonntags spazieren. Danke noch mal, {name}.','Ich schnitze gerade ein Regal für Meis Postkarten.');
 if(id==='lin'){if(d.streit.st==='versoehnt')o.push('Paula kommt jetzt mittwochs zum Kochen. Für sie mache ich eine milde Brühe.');else if(d.streit.st)o.push('Paula? Frag mich lieber nicht.');}
 if(id==='paula'){if(d.streit.st==='versoehnt')o.push('Lin hat mir eine Suppe ohne Chili gekocht. Nur für mich!');if(d.sec.paula.st>=3)o.push('Beim nächsten Fest singe ich. Du kommst doch?');}
 if(id==='henk'){if(d.sec.henk.st>=2)o.push('Ich sitze am Ufer, nicht im Boot. Jetzt weißt du, warum.');if(d.freund.st==='erzaehlt')o.push('Rosa weiß jetzt, dass du es weißt. Sie hat gelächelt.');}
 if(id==='rosa'){if(d.freund.st==='erzaehlt')o.push('Henk und ich trinken sonntags Tee am Fluss. Seit fünfzig Jahren.');if(d.sec.rosa.st>=3)o.push('Dein Kapitel in der Chronik wird jeden Tag länger.');}
 return o.map(t=>fill(s,t));};

/* ---------- W04 Tratsch: nur echte Spielereignisse ---------- */
const tenants=s=>((s.city&&s.city.plots)||[]).map(p=>p.tenant).filter(Boolean);
const isBday=D.isBday=(s,id)=>{const b=J.NPCS[id]&&J.NPCS[id].bday;return !!b&&b[0]===cal.se(s)&&b[1]===cal.d(s);};
const bdayToday=s=>J.NPC_ORDER.find(id=>met(s,id)&&isBday(s,id))||null;
D.FACTS=[
 {id:'jonas',inv:['jonas'],ok:s=>pst(s,'bewohner')==='fertig',t:()=>'Hast du schon gehört? Jonas, der stille Uhrmacher, ist Hedwigs Enkel. Das ganze Dorf ist gerührt.'},
 {id:'elva',inv:['elva'],ok:s=>pst(s,'haus7')==='fertig',t:()=>'In Haus Nummer 7 in Lindenstadt brennt wieder Licht. Elva wohnt dort und zählt nachts die Sterne.'},
 {id:'brunnen',inv:[],ok:s=>pst(s,'brunnen')==='fertig',t:()=>'Seit der alte Brunnen wieder läuft, treffen sich morgens alle dort. Fast wie früher.'},
 {id:'zurueck',inv:s=>[PM(s).vermisst.who],ok:s=>pst(s,'vermisst')==='fertig'&&!!PM(s).vermisst.who,t:s=>nm(PM(s).vermisst.who)+' ist wieder da. Die Schwester war krank, sagt man. Gut, dass du gesucht hast.'},
 {id:'falk',inv:['elva','falk'],ok:s=>pst(s,'villa')==='fertig'&&PM(s).villa.wahl==='elva',t:()=>'Du hast diesem Herrn Falk abgesagt, damit Elva in ihrem Haus bleiben kann? Das rechnet dir hier jeder hoch an.'},
 {id:'hauskauf',inv:[],ok:s=>pst(s,'verkauf')==='fertig'&&PM(s).verkauf.out==='gekauft',t:()=>'Du hast das alte Haus in Lindenstadt gekauft? Mutig! Bald wohnt dort bestimmt jemand.'},
 {id:'tuer',inv:['henk'],ok:s=>['offen','fertig'].includes(pst(s,'tuer')),t:()=>'Henk erzählt jedem von einer Steintür im Mondwald. Und dass du dich hineingetraut hast.'},
 {id:'mieter',inv:tenants,ok:s=>tenants(s).length>0,t:s=>'In Lindenstadt wohnen jetzt Leute in deinen Häusern. '+nm(tenants(s)[0])+' soll ganz begeistert sein.'},
 {id:'streit',inv:['lin','paula'],ok:s=>['lin','zettel','zeit'].includes(s.dorf.streit.st),t:()=>'Lin und Paula reden seit dem letzten Dorfessen kein Wort miteinander. Schade.'},
 {id:'versoehnt',inv:['lin','paula'],ok:s=>s.dorf.streit.st==='versoehnt',t:()=>'Lin und Paula vertragen sich wieder. Lin kocht jetzt eine milde Suppe, extra für Paula.'},
 {id:'paar',inv:['mei','timo'],ok:s=>s.dorf.paar.st==='paar',t:()=>'Mei und Timo! Abends stehen sie zusammen und halten Händchen. Endlich!'},
 {id:'picknick',inv:[],ok:s=>!!(s.rom&&s.rom.pick&&s.rom.pick.n>0),t:()=>'Man erzählt sich, du warst mit {von} beim Picknick. Ihr zwei seid wirklich ein schönes Paar.'},
 {id:'ausflug',inv:[],ok:s=>!!(s.rom&&s.rom.aus&&s.rom.aus.n>0),t:()=>'Du warst mit {von} in Lindenstadt? Wie romantisch!'},
 {id:'bank',inv:['timo'],ok:s=>!!(s.rom&&s.rom.mv&&s.rom.mv.st==='fertig'),t:()=>'{von} hat dir eine Bank gebaut? Timo sagt, er hat drei Abende daran geschliffen.'},
 {id:'geburtstag',key:s=>'geburtstag:'+cal.y(s)+':'+bdayToday(s),inv:s=>[bdayToday(s)],ok:s=>!!bdayToday(s),t:s=>{const id=bdayToday(s),k=J.NPCS[id].love.find(x=>J.ITEMS[x]);return 'Heute hat '+nm(id)+' Geburtstag!'+(k?' Psst: '+J.ITEMS[k].n+' mag '+nm(id)+' am liebsten.':'');}}
];
D.facts=s=>D.FACTS.filter(f=>{try{return !!f.ok(s);}catch(e){return false;}});
D.gossip=function(s,id){D.migrate(s);if(!met(s,id))return null;
 for(const f of D.facts(s)){const key=f.key?f.key(s):f.id;if(s.dorf.said[key])continue;const inv=typeof f.inv==='function'?f.inv(s):f.inv;if(inv.includes(id))continue;
  const t=fill(s,f.t(s));s.dorf.said[key]={day:s.day,who:id,t};return t;}
 return null;};

/* ---------- W38 Geburtstage der Bewohner ---------- */
D.bdayGift=function(s,id,k,lv){D.migrate(s);if(!isBday(s,id))return null;const key=id+':'+cal.y(s);if(s.dorf.bd[key])return null;s.dorf.bd[key]={k,lv,day:s.day};
 return {love:'Du hast dir gemerkt, was ich am liebsten mag! Das ist mein schönstes Geschenk heute.',like:'Wie lieb, dass du an meinen Geburtstag gedacht hast!',neutral:'Ein Geschenk zu meinem Geburtstag? Das freut mich wirklich.',hate:'Oh. Na ja. Danke, dass du an meinen Geburtstag gedacht hast.'}[lv]||null;};

/* ---------- Nacht: Briefe aus Dorf und Romantik (höchstens drei Briefe pro Nacht insgesamt) ---------- */
D.NIGHT=[];D.LETTERS=[];
D.LETTERS.push(s=>Object.entries(s.dorf.bd).filter(([k,r])=>!r.thanked&&r.day<s.day).map(([k,r])=>({pr:1,make:()=>{const id=k.split(':')[0];r.thanked=s.day;
 const back=(r.lv==='love'||r.lv==='like')?(J.NPCS[id].like||[]).find(x=>J.ITEMS[x]&&J.ITEMS[x].cat!=='seed')||'tee':null;
 return letter(s,{from:id,kind:'dank',att:back?{items:{[back]:1}}:undefined,t:'Danke für mein Geburtstagsgeschenk',
  b:fill(s,'Liebe {name},\n\n'+(r.lv==='love'?'du hast mir genau das geschenkt, was ich am liebsten mag. Ich habe den ganzen Abend gelächelt.':r.lv==='hate'?'danke, dass du an meinen Geburtstag gedacht hast. Das allein hat mich schon gefreut.':'danke für dein Geschenk! Du hast an meinen Geburtstag gedacht, das bedeutet mir viel.')+(back?'\n\nIch lege dir eine Kleinigkeit bei.':'')+'\n\n'+nm(id))});}})));
const night0=X.night;
X.night=function(s,info,rng){X.migrate(s);D.migrate(s);const fresh=s.post.lastDay<s.day;const out=night0(s,info,rng);if(!fresh)return out;
 for(const f of D.NIGHT)f(s);
 const c=[];for(const f of D.LETTERS)c.push(...(f(s)||[]));c.sort((a,b)=>a.pr-b.pr);
 s.mailQ=s.mailQ||[];
 for(const o of c){if(s.mailQ.length>=3){if(!o.must)continue;const gi=s.mailQ.findIndex(m=>m.kind==='gruss');if(gi<0)continue;const g=s.mailQ.splice(gi,1)[0],oi=out.indexOf(g);if(oi>=0)out.splice(oi,1);}
  const m=o.make();if(m){out.push(m);s.mailQ.push(m);}}
 return out;};

/* ---------- Wo stehen die Figuren? ---------- */
/* Als Paar stehen Mei und Timo abends von 18 bis 19:30 Uhr am Treffpunkt; am Tag des Treffens bis 20 Uhr. */
const paarEvening=(s,p)=>p.st==='paar'&&s.min>=1080&&s.min<(p.day===s.day?D.meetTo:1170);
const loc0=St.location;
St.location=function(s,id,festival){
 // Das verabredete Treffen hat Vorrang vor dem Abendessen bei Lin (sonst säßen beide im Nudelhaus); Feste gehen vor.
 if(!festival&&s&&s.dorf&&(id==='mei'||id==='timo')){const p=s.dorf.paar;if((p.st==='treffen'&&meetNow(s,p))||(p.st==='paar'&&p.day===s.day&&paarEvening(s,p))){const q=D.MEET[p.place];return {map:'village',x:q[id][0],y:q[id][1]};}}
 const r=loc0(s,id,festival);if(r||festival||!s||!s.dorf)return r;
 const p=s.dorf.paar;
 if((id==='mei'||id==='timo')&&paarEvening(s,p)){const q=D.MEET[p.place]||D.MEET.brunnen;return {map:'village',x:q[id][0],y:q[id][1]};}
 if((id==='lin'||id==='paula')&&s.dorf.streit.st==='versoehnt'&&cal.wd(s)===2&&s.min>=960&&s.min<1080)return {map:'village',x:id==='lin'?20:21,y:12};
 return null;};
D.glow=function(s,mapId){const p=s.dorf&&s.dorf.paar;if(mapId!=='village'||!p)return [];
 if((p.st==='treffen'&&meetNow(s,p))||paarEvening(s,p))return ['mei','timo'];return [];};

/* ---------- Wegweiser ---------- */
D.target=function(s){const p=s.dorf&&s.dorf.paar;if(!p)return null;
 if(p.st==='treffen'&&s.day===p.meet&&s.min<D.meetTo){const q=D.MEET[p.place];return {map:'village',x:q.spot[0],y:q.spot[1],t:'Mei und Timo',sub:'Treffen '+q.n+' · 18 bis 20 Uhr'};}
 return null;};

/* ---------- Tagebuch ---------- */
D.diary=function(s,esc){D.migrate(s);const d=s.dorf;let h='<h3>Geheimnisse im Dorf</h3>';
 for(const id of SECIDS){const g=D.SEC[id],m=d.sec[id];if(!met(s,id)){h+='<div class="row dim"><div class="tx"><b>???</b><small>Noch nicht kennengelernt</small></div></div>';continue;}
  const parts=g.steps.slice(0,m.st).map((x,i)=>'<small>'+(i+1)+'. '+esc(fill(s,x.sum))+'</small>').join('');
  const next=m.st<3?'<small>Nächster Teil ab '+g.need[m.st]+' Herzen'+(m.st>0?', frühestens am nächsten Tag':'')+' · im Gespräch</small>':'<small>✓ Ganz erzählt · '+esc(g.rewardTxt)+' erhalten</small>';
  h+='<div class="row" data-secret="'+id+'"><div class="tx"><b>'+esc(g.t)+' · '+m.st+' von 3</b>'+parts+next+'</div></div>';}
 h+='<h3>Beziehungen im Dorf</h3>'+D.relations(s).map(r=>'<div class="row" data-rel="'+r.a+'-'+r.b+'"><div class="tx"><b>'+esc(nm(r.a))+' & '+esc(nm(r.b))+' · '+esc(r.label)+'</b><small>'+esc(r.txt)+'</small></div></div>').join('');
 const said=Object.values(d.said).sort((a,b)=>b.day-a.day).slice(0,6);
 h+='<h3>Tratsch</h3>'+(said.length?said.map(x=>'<div class="row"><div class="tx"><small>Tag '+x.day+' · '+esc(nm(x.who))+': „'+esc(x.t)+'“</small></div></div>').join(''):'<p class="sub">Noch nichts gehört. Rede mit den Leuten im Dorf.</p>');
 const bd=Object.entries(d.bd);if(bd.length)h+='<h3>Geburtstagsgeschenke</h3>'+bd.map(([k,r])=>'<div class="row"><div class="tx"><small>'+esc(nm(k.split(':')[0]))+' · Jahr '+k.split(':')[1]+' · '+esc((J.ITEMS[r.k]||{n:r.k}).n)+(r.lv==='love'?' · Lieblingsgeschenk':'')+'</small></div></div>').join('');
 return h;};
})();
