"use strict";
/* W01 abschließen: alle dauerhaften NPC_ORDER-Bewohner, keine Sonder-Gesprächsuhr.
   Reisende/Hofhüter sind keine neuen Pflichtbewohner für Freundschaftserfolge. */
(function(){const J=window.JM,D=J.Dorf;
const stories={
 lin:{t:'Die leere Rezeptseite',gift:'weizen',n:3,parts:[
 ['Lin bewahrt eine leere Seite im Kochbuch seines Großvaters.','Zwischen den Rezepten liegt eine ganz leere Seite. Die hat mein Großvater absichtlich freigelassen.','Ich dachte immer, dort fehlt sein bestes Gericht. Ich habe jahrelang danach gesucht.'],
 ['Die leere Seite war für Lins eigene Küche gedacht.','Auf der Rückseite steht ganz klein: „Für das, was du anders machen wirst.“','Ich glaube, ich habe seine Küche so genau nachgekocht, dass meine eigene kaum Platz hatte.'],
 ['Lin schreibt sein erstes eigenes Rezept ins Familienbuch.','Heute habe ich etwas auf die leere Seite geschrieben. Kein großes Geheimrezept. Eine Suppe, wie ich sie mag.','Es fühlt sich nicht mehr an, als würde ich etwas falsch machen. Nimm etwas Weizen mit. Vielleicht erfindest du auch etwas.']]},
 timo:{t:'Vögel aus Restholz',gift:'holz',n:6,parts:[
 ['Timo schnitzt heimlich kleine Vögel aus Restholz.','Die kleinen Holzreste unter meiner Werkbank werfe ich nicht weg. Daraus werden Vögel.','Ich stelle sie nur nie ins Schaufenster. Häuser bauen ist mein Beruf. Die Vögel sind etwas anderes.'],
 ['Der erste Holzvogel erinnert Timo an seinen Vater.','Mein Vater hat mir den ersten geschnitzt. Einen sehr schiefen Spatz.','Ich versuche immer noch, einen so zu machen wie er. Wahrscheinlich muss ich damit aufhören.'],
 ['Timo behält seinen eigenen Stil.','Mein neuer Spatz hat einen viel zu großen Schnabel. Ich mag ihn genau so.','Den stelle ich jetzt auf die Werkbank. Und dieses Holz ist für deine nächsten eigenen Ideen.']]},
 ida:{t:'Die geretteten Ränder',gift:'tee',n:2,parts:[
 ['Ida sammelt handschriftliche Randnotizen aus alten Büchern.','Das Wertvollste in einem Buch steht für mich manchmal am Rand. Eine Einkaufsliste, ein Ausrufezeichen, ein Name.','Beim Neubinden rette ich diese kleinen Notizen immer mit.'],
 ['Eine unbekannte Randnotiz half Ida durch einen schweren Umzug.','In meinem ersten eigenen Buch stand: „Du darfst noch einmal anfangen.“ Ich weiß nicht, wer das geschrieben hat.','Als ich nach Lindenstadt zog, habe ich die Stelle jeden Abend gelesen.'],
 ['Ida schreibt selbst einen ermutigenden Satz in ihr Werkstattbuch.','Heute habe ich einen Satz auf die erste Seite meines Werkstattbuchs geschrieben. Für mich, nicht für den Verkauf.','Manchmal reicht ein kleiner Satz. Hier, zwei Tee für einen ruhigen Leseabend.']]},
 noah:{t:'Das Glas mit den Samen',gift:'zwiebel_s',n:4,parts:[
 ['Noah trägt ein altes Samenglas bei jedem Umzug mit.','Das Glas in meiner Tasche? Nicht Marmelade. Samen aus dem ersten Garten, den ich je gepflegt habe.','Manche sind längst zu alt zum Keimen. Trotzdem trage ich sie überall mit hin.'],
 ['Noah hatte Angst, an einem neuen Ort keine Wurzeln zu schlagen.','Ich habe immer gedacht: Solange ich die alten Samen habe, kann ich notfalls zurück.','Aber einen Garten bekommt man nicht, indem man das Glas zulässt.'],
 ['Noah legt mit neuen Samen wieder los.','Das alte Glas steht jetzt am Fenster. Als Erinnerung, nicht mehr als Fluchtplan.','Diese frischen Samen sind für dich. Die wollen wirklich in die Erde.']]},
 mara:{t:'Das Lied vom Heimkommen',gift:'amethyst',n:1,parts:[
 ['Mara spielt ein eigenes Lied nie vor Publikum.','Es gibt ein Lied, das ich nur spiele, wenn niemand zuhört. Ich habe es selbst geschrieben.','Die großen Stücke kann ich vor Leuten spielen. Das kleine macht mir Angst.'],
 ['Maras Lied handelt vom Heimkommen statt von der großen Bühne.','Es ist nur eine Melodie über eine Zugfahrt nach Hause. Nichts Besonderes, dachte ich.','Aber jedes Mal muss ich dabei lächeln. Vielleicht ist genau das das Besondere.'],
 ['Mara nimmt ihr eigenes Lied in ihr Repertoire auf.','Beim nächsten kleinen Auftritt spiele ich mein Zuglied. Wenn mir die Hände zittern, spiele ich eben langsam.','Dieser Amethyst sieht aus wie Abendlicht am Bahnsteig. Ich möchte, dass du ihn hast.']]},
 elva:{t:'Sterne am hellen Tag',gift:'mondquarz',n:1,parts:[
 ['Elva zeichnet Sterne auch bei bewölktem Himmel weiter.','Wenn es regnet, zeichne ich trotzdem Sternkarten. Aus dem Gedächtnis.','Die anderen denken, ich könne die Sterne durch die Wolken sehen. So magisch bin ich leider nicht.'],
 ['Elva braucht die Sternkarten, um ihre eigenen Gedanken zu ordnen.','Früher habe ich die Karten immer neu angefangen, sobald ein Strich schief war.','Seit ich hier wohne, lasse ich die Fehler stehen. Dann erkenne ich die Karte als meine.'],
 ['Elvas Sternbuch ist kein Wettbewerb mehr.','Die neueste Karte hat einen Tintenklecks. Ich habe einen Mond darum gezeichnet.','Sie gefällt mir besser als die makellosen. Ein Mondquarz für dein eigenes kleines Licht.']]},
 jonas:{t:'Die Uhr ohne Eile',gift:'silber',n:2,parts:[
 ['Jonas besitzt eine Uhr, die er absichtlich nicht verkauft.','Ich repariere fast jede Uhr. Nur die kleine auf meinem Nachttisch gebe ich nie aus der Hand.','Nicht weil sie wertvoll wäre. Sie geht sogar ein bisschen nach.'],
 ['Die langsame Uhr erinnert Jonas daran, nicht alles nachzuholen.','Hedwig sagte immer: „Du musst nicht jede versäumte Minute zurückholen.“','Ich dachte lange, sie meint nur die Uhr. Inzwischen glaube ich, sie meinte mich.'],
 ['Jonas behält die Uhr und ihren kleinen Fehler.','Ich habe sie gereinigt, aber nicht schneller gestellt. Manche Erinnerungen brauchen keine Reparatur.','Du hast mir oft zugehört. Diese zwei Silberstücke brauche ich heute nicht mehr.']]},
 frieda:{t:'Der erste krumme Laib',gift:'weizen',n:5,parts:[
 ['Frieda hat ihren ersten völlig misslungenen Brotlaib gezeichnet.','Unter der Kasse liegt eine Zeichnung. Mein allererstes Brot: außen schwarz und innen fast flüssig.','Nein, den echten Laib habe ich nicht aufgehoben. So mutig bin ich nicht.'],
 ['Frieda wollte wegen eines misslungenen Brots beinahe aufhören.','Ich hatte allen erzählt, dass ich Bäckerin werde. Dann kam dieser Laib. Ich wollte den Ofen nie wieder anfassen.','Meine Lehrerin sagte nur: „Gut. Jetzt weißt du, was zu heiß ist.“'],
 ['Frieda lässt auch andere ihre misslungenen Versuche sehen.','Die Zeichnung liegt nicht mehr unter der Kasse. Ich zeige sie jetzt Lehrlingen und neugierigen Kindern.','Fünf Weizen für deinen nächsten Versuch. Er muss nicht sofort perfekt werden.']]},
 lotte:{t:'Blumen ohne Anlass',gift:'blume',n:3,parts:[
 ['Lotte stellt jeden Morgen einen kleinen Strauß für sich selbst zusammen.','Der kleine Strauß neben der Tür ist unverkäuflich. Den mache ich jeden Morgen für mich.','Ich habe früher gedacht, für Blumen braucht man einen Geburtstag oder jemanden, der sie schenkt.'],
 ['Lotte lernte, dass schöne Dinge keinen besonderen Anlass brauchen.','Als der Laden noch leer war, habe ich mir die erste Blume selbst in ein Wasserglas gestellt.','Am nächsten Morgen wollte ich wiederkommen. Wegen einer einzigen Blume.'],
 ['Lotte teilt die Idee vom kleinen alltäglichen Strauß.','Heute habe ich drei Blumen mehr geschnitten. Für dich, ohne Geburtstag, ohne Auftrag.','Du darfst sie einfach schön finden. Das reicht als Anlass.']]},
 konrad:{t:'Das unbeschriebene Gästebuch',gift:'tee',n:3,parts:[
 ['Konrad bewahrt ein leeres Gästebuch aus seinem ersten Hotel auf.','Mein erstes Gästebuch hat keine einzige Bewertung. Ich habe die Gäste damals nie darum bitten wollen.','Ich dachte, ein guter Gastgeber muss ganz unauffällig sein.'],
 ['Konrad möchte lieber Erinnerungen als perfekte Sterne sammeln.','Später bekam ich viele Bewertungen. Aber an die Leute aus dem leeren Buch erinnere ich mich am besten.','Sie erzählten mir morgens beim Tee von ihrem Weg. Das steht in keiner Sternezahl.'],
 ['Konrad beginnt ein eigenes Erinnerungsbuch.','Ich schreibe jetzt kleine Erinnerungen auf. Keine privaten Geheimnisse, nur Dinge wie „hat über den ersten Schnee gelacht“.','Für die nächste ruhige Pause: drei Tee. Nicht jede Pause muss im Kalender stehen.']]},
 greta:{t:'Greta und der zweite Platz',gift:'duenger',n:3,parts:[
 ['Greta trägt ein altes Wettbewerbsband in der Tasche.','Das Band hier ist nicht für den ersten Platz. Zweiter. Ich trage es seit Jahren bei mir.','Den Pokal daneben habe ich längst weggepackt.'],
 ['Ein zweiter Platz brachte Greta ihre wichtigste Freundschaft.','Bei dem Wettbewerb habe ich eine Frau kennengelernt, die mir danach ihre Saat gezeigt hat. Einfach so, obwohl wir gegeneinander angetreten waren.','Seitdem glaube ich, dass eine gute Ernte auch etwas zum Teilen ist.'],
 ['Greta möchte Konkurrentin und gute Nachbarin sein.','Ich will den nächsten Wettbewerb natürlich gewinnen. Aber ich will auch, dass du eine gute Ernte hast. Beides geht.','Hier ist Dünger. Für eine starke Konkurrenz und eine noch bessere Nachbarschaft.']]}
};
for(const [id,q]of Object.entries(stories)){if(!J.NPC_ORDER.includes(id))throw Error('Kein dauerhafter Bewohner: '+id);D.SEC[id]={t:q.t,need:[2,4,6],reward:{items:{[q.gift]:q.n}},rewardTxt:q.n+'× '+J.ITEMS[q.gift].n,steps:q.parts.map(p=>({sum:p[0],lines:p.slice(1)}))};if(!D.SECIDS.includes(id))D.SECIDS.push(id);}
// Paar-Nachgespräche gehören hinter persönliche Geschichten, sonst würde die neue Liebe sie blockieren.
const extra=D.extraLines;D.extraLines=function(s,id){const lines=extra(s,id);if(s.zuhause?.paar.st==='paar'&&['lin','paula'].includes(id))return lines.concat(id==='lin'?'Paula kommt nachher mit mir in den Garten. Ich habe zwei Tassen eingepackt.':'Lin und ich sind jetzt zusammen. Nicht wegen seiner Suppe. Na gut, ein bisschen auch deswegen.');return lines;};
})();
