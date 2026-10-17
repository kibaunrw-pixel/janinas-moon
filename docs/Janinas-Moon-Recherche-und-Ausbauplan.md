# Janinas Moon – Recherche und Ausbauplan

Stand: 15.10.2026. Arbeitsgrundlage: Renés Beanstandungen, sieben übermittelte Bilder und GitHub-Stand `be89e040bb14a74790dd85ccb8eaf844f43366b8` vom 14.10.2026, „Pudel-Flitzen“.

## Ergebnis und Grenzen

Ziel ist ein umfangreiches, zusammenhängendes Hofspiel: Landwirtschaft, Dorfleben, Beziehungen, Erkundung und langfristiger Aufbau müssen sich gegenseitig tragen. Nicht nur mehr Objekte oder zusätzliche Dialogknöpfe.

Dies ist eine Recherche mit Code-Abgleich und Umsetzungsvorgaben, **keine umgesetzte Erweiterung**. Keine Änderungen am Spiel, kein Veröffentlichen. Übergabe: an René und anschließend den ausführenden Entwickler/Claude. Jede Bauetappe braucht Tests und eine gesonderte Freigabe vor dem Livegang.

Referenz ist zunächst **Harvest Moon: Friends of Mineral Town**; dessen Neuauflage **Story of Seasons: Friends of Mineral Town** wird ausdrücklich getrennt behandelt. Sie ist laut Spielguide eine überarbeitete Neuauflage der GBA-Spiele.[3] „Harvest Moon“ bezeichnet keine einzige einheitliche Funktionsliste. Back to Nature wurde nicht im Detail untersucht; dafür wird hier keine Vollständigkeit behauptet. Für die Kühlschrank-Mechanik wird zusätzlich A New Beginning herangezogen und entsprechend gekennzeichnet.[6]

Die externen Quellen sind gelesene, nicht offizielle Spielguides: überwiegend Ushi no Tane/Fogu und ergänzend das Harvest Moon Wiki. Die Recherche belegt die genannten Mechaniken, aber keine vollständige Gleichwertigkeit mit einem ganzen kommerziellen Spiel. Teilweise gelieferte Seitentexte enden vor dem Seitenende; hier werden nur Aussagen aus tatsächlich gelieferten Abschnitten verwendet. Die Bilder enthalten Ideen aus einem Chat, keinen Nachweis von Original-Spielmechaniken. Teilweise abgeschnittene Bildtexte werden nicht ergänzt oder als vollständig ausgegeben.

## 1. Was bereits vorhanden ist

`jm-data.js` wurde mit Node geladen und `JM.buildMaps()` tatsächlich ausgeführt. Ergebnis:

- 5 definierte Dorfbewohner zusätzlich zur persönlichen René-Figur.
- 9 Nutzpflanzen, 8 Kochrezepte, 6 Fischarten, 4 saisonale Feste.
- Hof, Dorf, Wald, eine Höhlenkarte, Wohnhaus und fünf Laden-Innenräume.

Im gelesenen Code vorhanden: saisonale Pflanzen mit Wachstum und Wiederernte, Bewässerung/Regen, Futter und Tierprodukte, Pudel-Zuneigung und Fundgeschenke, Freundschaftspunkte, Geschenkvorlieben, Geburtstage, Tagespläne, Herz-Ereignisse, Rezepte über Freundschaft und Fernsehen, Anschlagtafel, Tagesziele, Versandkiste, Samstags-Marktstand, Mondbaum-Gaben, Gewächshaus-Freischaltung, Werkbank, Erfolge, Sternschnuppen und Fotomodus.

**Diese Bestandsaufnahme ist eine Codeprüfung, kein vollständiger Spieltest.** Vorhandene Funktionen sind damit nicht automatisch fehlerfrei oder spielerisch ausreichend tief.

Wichtige Folgen:

1. Das Dorf nicht mit stummen Figuren auffüllen, sondern das vorhandene Bewohner-System erweitern.
2. Marktstand, Geburtstage, Hundegeschenke und Gewächshaus nicht doppelt implementieren.
3. Neue Daten müssen mit alten lokalen Spielständen kompatibel bleiben (`migrate`, bestehender Speicherschlüssel `janinas-moon-v2`). Keine Spielstände zurücksetzen.

## 2. Beanstandungen: Befund und genaue Anforderungen

| ID | Beanstandung | Belegter Stand / Unsicherheit | Abnahmeziel |
|---|---|---|---|
| B01 | Höhle erweitern | Genau eine Höhlenkarte in `jm-data.js:471–478`. | Zehn unterscheidbare, erreichbare Ebenen; Anzeige der aktuellen Tiefe und sicherer Rückweg. |
| B02 | Mehr Menschen, größeres Dorf | Fünf Bewohner in `JM.NPC_ORDER`; ein Dorfgebiet mit fünf Geschäften. | Größeres Dorf mit sinnvollen Wegen, Wohnräumen, Begegnungsorten und zusätzlichen Bewohnern mit Funktion. Konkrete Zielgröße unten ist ein Vorschlag. |
| B03 | Elfenhaus, Elfen arbeiten auf dem Hof | In den gelesenen zentralen Daten und Aktionsroutinen kein entsprechendes System gefunden. | Besuchbares Haus, Helfer-Freundschaft, Aufträge zum Gießen, Ernten und Versorgen der Tiere, sichtbare Arbeit und Abschlussmeldung. |
| B04 | „Sachen die rumliegen liegen nicht da“ | Bedeutung nicht eindeutig: unsichtbar, an anderer Position dargestellt oder Aufgabe verweist auf fehlenden Gegenstand. `S.mess` und Sammelobjekte werden grundsätzlich gezeichnet. Kein bestimmter Fehler nachgestellt. | Alle tatsächlich vorhandenen Sammelobjekte sind sichtbar und an ihrer dargestellten Stelle anwählbar. Aufgaben verweisen auf aktuelle Objekte; fehlende Objekte werden ehrlich angezeigt. |
| B05 | Socke hinter Hundehütte nicht aufhebbar | Konkreter Spielstand fehlt. 3D-Sammelobjekte besitzen keine eigene explizite Auswahlbox wie Erzsteine; Gebäudetreffer und Bodenprojektion können die Auswahl beeinflussen (`jm-3d.js:519–523, 709–713`). Das ist ein Verdacht, kein bewiesener Einzelfall. | Socke an der gemeldeten Stelle normal antippen, hinlaufen, genau einmal wegräumen. Gebäude darf den Treffer nicht abfangen. Bestehende problematische Gegenstände ebenfalls berücksichtigen. |
| B06 | Kühlschrank befüllen, Rucksack entlasten | `jm-game.js:548`: nur zufälliger Beschreibungstext. `S.inv` ist das einzige normale Gegenstandslager. Aktuell kein festes Rucksacklimit gefunden. | Eigenes Kühlschranklager mit Einlagern/Entnehmen 1, Menge und alle; Anzeige beider Bestände, Speicherung und Kochen aus beiden Lagern. Nicht ohne Absprache nachträglich ein enges Rucksacklimit einführen. |
| B07 | Neues Höhlenmaterial nach dem Rausgehen | `spawnRocks()` beim Tageswechsel (`jm-game.js:610`); `setMap()` und `travel()` füllen nicht bei jedem Wiedereintritt auf. | Nach Verlassen des gesamten Höhlensystems beginnt beim nächsten Eintritt ein neuer Abbaudurchlauf – noch am selben Spieltag. Ein Wechsel zwischen Ebenen allein erzeugt keine endlosen Duplikate. |
| B08 | Zehn Ebenen mit unterschiedlichen Steinen | Vier bestehende Mineraltypen; ein gemeinsamer `S.rocks`-Bestand. | Erzverteilung nach Ebene, getrennte Ebenenzustände und erkennbare Wert-/Werkzeugprogression. Nicht zehn Kopien derselben Kammer. |
| B09 | Magischer Teich ganz unten mit besonderen Fischen | Keine passende zehnte Ebene; `JM.waterKind` unterscheidet die vorhandenen Außen-Gewässer. | Ebene 10 enthält einen zugänglichen Teich, eigene Fangtabelle, Angelinteraktion, Tagebucheinträge und sicheren Heimweg. |
| B10 | Kochzutaten im Laden | Hähnchenbrust ganzjährig, Zwiebel/Pak Choi/Weizen nur als Winterware (`jm-data.js:188–197`). Eier/Milch/Fische und andere Zutaten kommen aus dem Hof/der Welt. | Benötigte Basiszutaten ganzjährig kaufbar; bei jedem freigeschalteten Rezept ist die Herkunft fehlender Zutaten sichtbar. Saisonale und magische Spezialzutaten dürfen besondere Beschaffungswege behalten. |

### Technische Kontrollprobe zur Socke

Eine Node-Prüfung hat auf Hof und im Haus alle nach der aktuellen `spawnMess()`-Regel zulässigen Kacheln gegen die vom Start erreichbaren Kacheln geprüft. Ergebnis: **keine unerreichbaren zulässigen Kacheln** in diesen unveränderten Karten. Die pauschale Diagnose „liegt auf einer unbetretbaren Kachel“ ist daher nicht belegt. Die Prüfung erfasst ausdrücklich nicht Verdeckung, 3D-Trefferauswahl oder den konkreten alten Spielstand. Diese bleiben offen und müssen am echten Nutzerweg geprüft werden.

## 3. Was das Harvest-Moon-Spielgefühl trägt

| System | Recherchierte Referenz | Übertragung auf Janinas Moon – Vorschlag |
|---|---|---|
| Landwirtschaft | In der Mineral-Town-Neuauflage: Hof freiräumen, saisonale Samen, Boden vorbereiten und bewässern; Saisonwechsel begrenzt Anbau.[10] | Mehr saisonale Entscheidungen, Blumen, Obst und Weiterverarbeitung. Kalender zeigt Aussaat-Frist und Erntezeit. Vorhandene 14-Tage-Jahreszeiten berücksichtigen, nicht 30-Tage-Werte blind übernehmen. |
| Werkzeuge | Erfahrung, Erz und Geld ermöglichen Verbesserungen; Reichweite und Effizienz steigen, Angelstufen erschließen andere Fänge.[9] | Kupfer → Eisen/Silber → Gold → Mondwerkzeug. Erz hat einen echten Zweck, nicht nur einen Verkaufspreis. Schmiede und Ausbauzeiten verbinden Mine und Dorf. |
| Mine | Die Neuauflage besitzt zwei Minen mit jeweils 255 Ebenen, Felsen und verborgenen Abstiegsleitern; die Wintermine setzt einen anderen Ressourcen-Schwerpunkt.[2] | Eure zehn Ebenen sind eine bewusste kompakte Eigenfassung. Feste sichere Abstiege, stärkere Steine, Funde und ein besonders lohnender Abschluss statt bloßer Tiefe. |
| Erntewichtel | Im ursprünglichen FoMT: sieben Helfer im Haus hinter der Kirche, ab drei Freundschaftsherzen Aufgaben; Gießen, Ernten, Tierpflege; Einsätze für 1, 3 oder 7 Tage; Trainings-Minispiele.[1] | Eigenes Elfenhaus, individuelle Helfer mit Zuneigung und Arbeitsfähigkeiten. Zu Beginn einen kleinen Auftrag freischalten, später verlässlich größere Flächen. |
| Lager und Küche | A New Beginning lagert Kochzutaten im ausbaubaren Kühlschrank und bietet Rezepte über verschiedene Erwerbswege.[6] | Sichtbare Vorräte und direkte Küchenanbindung. Rohstoffe lagern, fehlende Zutaten gezielt einkaufen, Gerichte für Energie, Geschenke und Verkauf nutzen. |
| Ladenwirtschaft | Die Mineral-Town-Neuauflage verkauft unter anderem Öl, Mehl, Brot, Reisbällchen und Gewürze ganzjährig; Saatgut saisonal und manche Produkte nach Fortschritt.[5] | Meis Markt bekommt Grundzutaten und nachvollziehbare Freischaltungen. Eigenanbau bleibt wirtschaftlich sinnvoll, Einkaufen verhindert Koch-Sackgassen. |
| Dorfleben | Sasha hat Verwandtschaft, Freundschaften, Vorgeschichte und nach Wochentag/Wetter verschiedene Aufenthaltsorte.[7] | Neue Bewohner brauchen Alltag, Beziehungen untereinander, Konflikte und sichtbare Veränderungen nach Hilfe. Nicht ausschließlich Dialoge über die Spielerin. |
| Beziehungen | In der Neuauflage: Freundschaft/Liebe, Herz-Ereignisse, Hausausbau, Bett und Heiratsantrag. Partner helfen dort nicht automatisch bei der Hofarbeit.[8] | Freundschaft und Romanzen getrennt modellieren. Vorhandene persönliche Janina/René-Beziehung bewahren; alternative Romanzen nicht stillschweigend an deren Stelle setzen. |
| Kalender | Saisonkalender kombiniert Geburtstage, Wettbewerbe und Gemeinschaftsfeste.[13] | Zu den vorhandenen Festen Mitmachmechaniken ergänzen: Kochbeitrag, Tierbewertung, kleine Preise, andere Begegnungen. Kalender vor verpassbaren Terminen warnen lassen. |
| Angeln und Entdecken | Die Neuauflage hat mehrere Fanggebiete, Werkzeug-Abhängigkeiten und besondere Funde wie eine Flaschenpost mit Rezept.[12] | Gewässer, Tageszeit, Wetter und Fortschritt verändern die Fangliste. Hinweise statt reiner Zufallslotterie; Sammelalbum und Teich geben langfristige Ziele. |

Die Mineral-Town-Neuauflage trennt Werkzeug-Erze der Frühlingsmine von verkäuflichen Edelsteinen der Wintermine.[2] Daraus folgt jedoch nicht, dass euer magischer Teich auf Ebene 10 oder die Vollmondwald-Idee Originalfunktionen sind. Diese werden als **eigene gewünschte Erweiterungen** geführt.

**Die zentrale Spielschleife als Entwurf:** Mine → Erz → bessere Werkzeuge → mehr und bessere Ernte → Küche/Verkauf → Geld/Geschenke → Freundschaft/Helfer/Ausbau → neue Orte und Entdeckungen. Jedes neue System muss mindestens an eine dieser Verbindungen anschließen.

## 4. Vollständige Übernahme der lesbaren Bildwünsche

Status: **Wunschliste, keine Behauptung vorhandener oder originaler Harvest-Moon-Funktionen.** Jede Zeile muss bei der Umsetzung einem überprüfbaren Zustand entsprechen. Alternativen wie Bäckerei/Café sind noch keine vier gleichzeitig beauftragten Vollsysteme.

### Bild: Lebendige Dorfbewohner

| ID | Wunsch | Umsetzungskriterium |
|---|---|---|
| W01 | Jeder Bewohner besitzt ein durch Freundschaft entdeckbares Geheimnis | Mehrstufige persönliche Geschichte mit Voraussetzungen und gespeichertem Fortschritt. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut für vier Bewohner (Mei, Henk, Paula, Rosa), je drei Teile ab 2/4/6 Herzen, ein Teil pro Tag, Tagebuch „Herz“, Lohn einmal (`jm-dorf.js`). Übrige Bewohner (Lin, Timo, Elva, Jonas, Mieter) haben noch kein Geheimnis. |
| W02 | Bewohner verlieben sich, streiten und schließen Freundschaften | Beziehungen zwischen Bewohnern unabhängig von Spielerherzen; Szenen verändern Folgegespräche. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Freundschaft Rosa–Henk, Streit und Versöhnung Lin–Paula (Zettel überbringen, Entscheidung), Verliebtheit Mei–Timo (W06); danach andere Gespräche und Aufenthaltsorte, Übersicht im Tagebuch. |
| W03 | Hilfe verändert Haus oder Geschäft | Vorher-/Nachher-Zustand sichtbar und nach Neuladen erhalten. **Status Etappe 2:** offen (optional, nicht gebaut). |
| W04 | Klatsch und Tratsch | Aussagen beziehen sich auf echte Ereignisse, keine unmöglichen oder schon widerlegten Meldungen. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: 15 Tratschmeldungen, jede an eine Prüfung des Spielstands gebunden (z. B. Jonas ist Hedwigs Enkel, Elva zog ein, Brunnen repariert, Mieter zurück, Paar, Versöhnung, Picknick, Geburtstag), nie von Beteiligten, jede einmal, widerlegter Streit wird nicht mehr erzählt. |
| W05 | Neue Bewohner durch Aufgaben | Renovierung/Quest schaltet tatsächlichen Einzug mit Haus, Wegplan und Dialogen frei. **Status Etappe 2:** keine neue Arbeit in Etappe 2 (Elva/Jonas aus Etappe 1/1b bestehen). |
| W06 | Zwei heimlich Verliebten helfen zusammenzukommen | Eigene kleine Vermittlungsgeschichte mit Entscheidungen und Abschluss, nicht nur Geschenkzähler. **Entscheidung René 16.10.2026:** wird gebaut, zusammen mit W24 (Dorfbewohner untereinander verkuppeln). Status Etappe 2: gebaut (Mei und Timo: Hinweis → Timo → Brief und Holzvogel oder Frage → Treffen mit Ortswahl → Entscheidung → Paar; verpasstes Treffen neu ausmachen; abends gemeinsam am Treffpunkt). Ein zweites Paar ist nicht gebaut. |

### Bild: Geheimnisvoller Wald und Magie

| ID | Wunsch | Umsetzungskriterium |
|---|---|---|
| W07 | Versteckter Wald öffnet nur bei Vollmond | Nachvollziehbarer Mondkalender, Hinweis vor Öffnung; wer beim Schließen darin ist, bleibt nicht gefangen. **Status Etappe 4 (lokaler Arbeitsbaum, Browserprüfung durch Sandbox blockiert, unabhängige Prüfung offen):** gebaut als eigene Karte `vollmondwald`, erreichbar ausschließlich über das bestehende W64-Gewölbe. 14-Tage-Rhythmus, Kalender-/Tagebuchhinweis, Ausgang zurück ins Gewölbe und sicherer Tageswechsel nach Hause. |
| W08 | Kleine Waldgeister helfen bei der Ernte | An das Helfersystem anbinden, kein widersprüchliches zweites Automatisierungssystem. |
| W09 | Seltene magische Pflanzen züchten | Samenquelle, Wachstumsbedingungen, sichtbare Pflanze und Verwendung definieren. **Status Etappe 4 (lokaler Arbeitsbaum, Browserprüfung offen):** gebaut: Mondsamen im Vollmondwald und beim Regenhändler; Mondblüte im bestehenden Feldsystem, wächst nur nach nächtlichem Handgießen (nicht durch Regen/Sprinkler), eigene 2D-/3D-Darstellung, Versandwert 640 G. |
| W10 | Mysteriöser Händler nur bei Regen | Regenabhängiger Wegplan und besonderes Sortiment; Wetterbericht liefert Planungshilfe. **Status Etappe 4 (lokaler Arbeitsbaum, Browserprüfung offen):** gebaut: Nerio nur bei Regen, 7–11 Uhr Waldweg, 11–16 Uhr Dorfbrunnen, 16–20 Uhr Waldsee; Wetterbericht kündigt ihn an; Sortiment mit Mondsamen, Mondtau und Mondquarz, ohne sofortige Versand-/Café-/Bestellarbitrage. |
| W11 | Alte Ruinen erzählen Dorfgeschichte | Auffindbare Hinweise und zusammenhängende Entdeckungsreihe mit Tagebuch. |
| W12 | Entscheidungen verändern die Magie | Bildsatz nach „ob die Magie …“ abgeschnitten. Nur der lesbare Kern ist übernommen; konkrete Auswirkungen offen. Keine erfundene Endentscheidung festschreiben. |

### Bild: Eigenes Café oder Geschäft

| ID | Wunsch | Umsetzungskriterium |
|---|---|---|
| W13 | Eigenes kleines Geschäft aufbauen | Vorhandenen Samstagsstand als Vorstufe nutzen; ausbaubares Geschäft mit Öffnen, Angebot, Besuchern und Abrechnung. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut als „Café Mondlicht“ im renovierten alten Teehaus im Dorf (Rosas Brief, 1500 G, 20 Holz, 10 Stein, zwei Nächte, Timos Brief). Der Samstagsstand bleibt eigenständig (Direktverkauf); Begründung in `docs/ETAPPE-3-ABNAHME.md`. |
| W14 | Bäckerei, Blumenladen, Café oder Tierpension | Als wählbare Ausrichtungen vorsehen. Empfehlung: erst ein Café vollständig spielbar; übrige Ausrichtungen später, nicht als leere Auswahlknöpfe. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** nur das Café gebaut; Bäckerei, Blumenladen und Tierpension sind bewusst **offen** und erscheinen nirgends als Auswahl. |
| W15 | Selbst anbauen, verarbeiten, verkaufen | Verkauf verbraucht echte Vorräte; Geld und Tagesbilanz stimmen. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Waren wandern aus dem Rucksack in die Vitrine, Gäste kaufen daraus; Öffnungszeit 9–13 oder 14–18 Uhr; Geld genau einmal je Gast; Tagesabrechnung per Brief stimmt mit der Summe überein; Café-Höchstpreis liegt unter jedem Laden- und Rezepteinkauf (Test). |
| W16 | Möbel, Rezepte und Dekoration freischalten | Fortschrittsbedingungen sichtbar; Freischaltungen verändern tatsächlich Raum oder Angebot. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: ab 3 Gästen Lichterkette und Pflanzen, ab 6 dritter Tisch und dritter Gast, ab 10 Rezept Mondkuchen; Fortschritt im Thekenmenü. |
| W17 | Lieblingsgerichte und besondere Bestellungen | Bewohner bestellen passend zu ihren Vorlieben, mit verfügbarem Rezept und erfüllbarer Frist. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Gäste wählen ihr Lieblings- oder gemochtes Gericht aus der Vitrine (Trinkgeld); Bestellungen per Brief nur für machbare Waren, Frist drei Tage, Lohn einmal, verpasste Frist ohne Strafe. |

### Bild: Tiere mit Persönlichkeit

| ID | Wunsch | Umsetzungskriterium |
|---|---|---|
| W18 | Freche Ziege klaut Gemüse | Tierverhalten sichtbar; begrenzter Verlust, verständliche Gegenmaßnahme, keine willkürliche Frustspirale. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Ziege Flocke (bei Paula) nascht höchstens jeden zweiten Tag eine reife Pflanze am Feldrand, die nachwächst; vorher sichtbar daneben kauend. Gegenmaßnahmen: Heu am Morgen, Wegschicken, Leckstein (dauerhaft). Paulas Tipp-Brief einmal. |
| W19 | Katze bringt kleine Geschenke | Eigenes Tier mit Beziehung und nachvollziehbarer Fundlogik. Pudel können bereits Fundgeschenke bringen. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Katze Minka (Paulas Brief), Herzen durch Streicheln und Fisch; ab 3 Herzen nach Streicheln am Vortag höchstens jeden zweiten Morgen ein Fundstück der Jahreszeit vor der Haustür, ab 6 Herzen jedes dritte Mal ein Karpfen; schläft mittags in der Sonne. |
| W20 | Hund findet verborgene Schätze | Vorhandene Hundebeziehung erweitern: Hinweis/Spur, auffindbarer Schatz, Belohnung genau einmal. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: ab 4 Herzen wittert ein Pudel alle drei Tage eine Spur; „Der Spur folgen“ legt Pfotenabdrücke zur Grabstelle; vier feste Verstecke, jedes genau einmal. |
| W21 | Enten schwimmen im selbstgebauten Teich | Teichbau verändert Hof; Enten nutzen Wasser tatsächlich und haben Pflegebedarf. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Teich (600 G, 12 Stein, eine Nacht) macht 4×3 Kacheln zu Wasser, Entenhaus und Futterstelle; zwei Enten schwimmen im Wasser, brauchen täglich Futter, gefüttert legen sie Eier. |
| W22 | Seltene Tierfarben durch Zucht | Eltern, Nachwuchs und Farbvererbung gespeichert; manuell gewählte Pudel-Fellfarbe ist kein Zuchtsystem. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut für Enten (nicht für Pudel): je zwei Farbanlagen (wild, weiß, gold), Küken erbt eine Anlage von Mutter und Vater, Eltern und Anlagen im Tagebuch; höchstens alle vier Tage, bis acht Enten. Zucht bei Katze, Ziege und Pudeln offen. |
| W23 | Verlassene Tiere retten und aufpäppeln | Fundereignis → Versorgung über mehrere Tage → Adoption oder Vermittlung mit Abschluss. **Status Etappe 3 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Brief „Korb am Fluss“, Kätzchen Pip im Wald, drei Pflegetage mit Milch im Korb am Haus, dann Adoption (bleibt auf dem Hof) oder Vermittlung an Mei (Dankesbrief mit Beilage, einmal). |

### Bild: Romantik, Freundschaften und kleine Dramen

| ID | Wunsch | Umsetzungskriterium |
|---|---|---|
| W24 | Mehrere Charaktere kennenlernen, ausgehen, verlieben | Freundschaft und Partnerschaft getrennt; Umgang mit der bestehenden René-Partnerschaft vor Umsetzung ausdrücklich entscheiden. **Entscheidung René 16.10.2026: beide Stränge.** (1) Janina und René als festes Paar: Picknick, romantische Briefe, Ausflüge, Jahrestage, gemeinsames Haus. (2) Dorfbewohner untereinander verkuppeln (siehe W06). Keine alternativen Spielpartnerschaften. Status Etappe 2: beide Stränge gebaut (siehe W25, W26, W28, W30, W31, W06); gemeinsames Haus (W29) offen. |
| W25 | Gemeinsame Picknicks | Verabredung, Ort, Zeit und eigene Szene; Termin im Kalender. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Verabredung per Brief von René oder im Tagebuch, Ort (Waldsee/Wiese am Teich) und Uhrzeit (12/17 Uhr), Decke mit Korb in 2D/3D, Szene mit Auswahl, Kalender, Erinnerung. |
| W26 | Missverständnisse | Kleine Geschichte mit Auflösung und veränderten Gesprächen. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Nach dem ersten Picknick weicht René aus, Timo verplappert sich, Auflösung mit Auswahl, Herzbank am Teich, neue Gespräche und Brief. |
| W27 | Überraschungsbesuche | Nur bei plausibler Tageszeit/Anwesenheit, nicht während blockierender Szenen. **Status Etappe 2:** offen (optional). Teilweise: Geburtstagsbesuch von Rosa und Mei (W38). |
| W28 | Romantische Briefe | Briefinhalt an Beziehungsstand und gemeinsame Ereignisse koppeln. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Einladungen, Brief nach jedem Picknick/Ausflug/Jahrestag/Geburtstag mit Bezug auf Ort und Wahl, Brief nach verpasster Verabredung, Kuschelzettel; je Erlebnis einmal, höchstens drei Briefe pro Nacht. |
| W29 | Nach Hochzeit gemeinsames Haus gestalten | Echte gespeicherte Einrichtung und gemeinsame Freischaltungen. **Status Etappe 2:** offen (optional, nicht gebaut). |
| W30 | Gemeinsame Ausflüge | Spielbare kurze Ereignisse mit Auswahl und Erinnerung im Tagebuch. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Abend in Lindenstadt (Zug), Tisch mit Kerze am Stadtbrunnen, Auswahl (Münze, Tisch, Maras Geige nur mit Mara als Mieterin), Erinnerung und Brief. |
| W31 | Jahrestage feiern | Gespeichertes Datum, jährliche Szene, keine mehrfach abholbare Tagesbelohnung. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Datum gespeichert (Vorschlag 12. Sommer, im Tagebuch änderbar), jedes Jahr ab 18 Uhr Kerzen am Küchentisch, Szene mit Brief, einmal pro Jahr auch nach Datumswechsel. |

### Bild: Kleine Überraschungen

| ID | Wunsch | Umsetzungskriterium |
|---|---|---|
| W32 | Geheime Briefe unbekannter Absender | Hinweisfolge mit späterer Auflösung; vorhandenes Postsystem verwenden. **Vorhandener Teilstand:** W55–W60 und weitere Postereignisse enthalten anonyme/geheime Briefketten. Etappe 4 ergänzt nichts. |
| W33 | Sternschnuppennächte | Vorhandenes System zuerst spielerisch prüfen, dann um Hinweise/Belohnungen erweitern. **Vorhandener Teilstand:** Sternschnuppen existieren. Etappe 4 erweitert sie wegen der Priorisierung nicht. |
| W34 | Regenbögen | An Wetterwechsel gebundenes sichtbares Ereignis, auf Mobilgeräten prüfbar. |
| W35 | Nebel | Lesbare Wege und anklickbare Gegenstände trotz Effekt; optional seltene Begegnungen. **Teilstand Etappe 4:** zurückhaltender Nebel nur als Darstellung im Vollmondwald; kein allgemeines Nebel-Wetterereignis. |
| W36 | Schatzkarten mit kleinen Rätseln | Karte führt zu konkretem erreichbarem Fund; Rätsel und Fundzustand bleiben gespeichert. **Vorhanden:** W57 mit drei Hügeln, gespeichertem Fund und einmaliger Belohnung. |
| W37 | Sammelalbum für Tiere, Pflanzen, Entdeckungen | Vorhandene Fang-, Koch- und Versandprotokolle zusammenführen; unbekannte Einträge und Fundbedingungen anzeigen. |
| W38 | Geburtstage: überraschen und Geschenke bekommen | Bestehende Bewohnergeburtstage erweitern, auch persönlicher Geburtstag mit glaubwürdigen Besuchen/Geschenken. Bildzeile rechts teilweise abgeschnitten; keine weitere Bedingung daraus abgeleitet. **Status Etappe 2 (Branch `feat/stadt-und-wohnraum`, nicht veröffentlicht, unabhängige Prüfung offen):** gebaut: Geschenk am Bewohnergeburtstag mit eigener Antwort und Dankesbrief, Tratsch nennt das Lieblingsgeschenk; Janinas Geburtstag (Vorschlag 6. Herbst, im Tagebuch änderbar): Geburtstagspost mit Beilage, Kuchen und Nudeln von René, Besuch von Rosa und Mei mit Geschenkkorb, einmal pro Jahr. Etappe 4 ergänzt nichts. |
| W39 | Verlassene Häuser renovieren, Bewohner ziehen ein | Materialien und Geld einsetzen, echte Bauphase, anschließend bewohnbarer Ort und neuer Alltag. **Vorhandener Teilstand:** Stadtbauplätze, Haus Nummer 7 und W62 sind an Einzug/Miete angebunden. Etappe 4 beginnt kein weiteres Haus. |
| W40 | Seltene Fische nur bei bestimmtem Wetter | Fangbedingungen dokumentieren und im Spiel andeuten; nicht nur extrem niedrige Zufallschance. |
| W41 | Nachtmarkt mit seltenen Gegenständen | Feste Termine, echte Besucher und besonderes Angebot; vom bereits existierenden Samstagsstand unterscheiden. |

### Bild: Dorf verändert sich durch die Spielerin

| ID | Wunsch | Umsetzungskriterium |
|---|---|---|
| W42 | Anfangs etwas heruntergekommenes Dorf | Definierter Ausgangszustand. Bestehende Spielstände nicht unangekündigt verschlechtern. |
| W43 | Kaputten Brunnen reparieren | Ressourcenauftrag führt zu sichtbar anderem Brunnen und einer kleinen Einweihung. **Vorhanden:** W58–W60 reparieren den alten Brunnen mit Ressourcen, sichtbarer Änderung, Einweihungsdialog und Wasserfunktion. |
| W44 | Leeres Haus wiederbeleben | Mit W05/W39 verknüpfen, kein doppelter Fortschrittszähler. **Vorhanden:** Haus Nummer 7 sowie Stadtbauplätze/W62 verwenden das bestehende Einzugs- und Hausregister. |
| W45 | Verwilderten Garten erneuern | Arbeitsschritte und sichtbarer, nutzbarer Gemeinschaftsgarten. |
| W46 | Dorfplatz renovieren | Gestaltung verändert sich nach Bauabschluss; Bewohner nutzen den neuen Ort. |
| W47 | Altes Gewächshaus wiederherstellen | Hofgewächshaus existiert bereits als Freischaltung. Falls ein Dorfgewächshaus gemeint ist, als eigenen Ort definieren, nicht doppelt berechnen. **Vorhandener Teilstand:** Das Hofgewächshaus bleibt bestehen; Etappe 4 dupliziert es nicht. |
| W48 | Nach längerer Spielzeit sichtbarer Erfolg | Dauerhafte Vorher-/Nachher-Zustände und neue Nutzungsmöglichkeiten. Die im Bild genannten „20 Spielstunden“ sind ein Wunschbild, keine geprüfte Spielzeitprognose. **Vorhandener Teilstand:** dauerhafte Haus-, Brunnen-, Stadt-, Café- und Tierausbauten. Keine Spielstundenbehauptung und kein neuer Gesamtabschluss in Etappe 4. |

### Wünsche René 16.10.2026: Briefkasten

Status „umgesetzt“ heißt: im Entwicklungszweig `feat/stadt-und-wohnraum` (Modul `jm-post.js`) gebaut und per Logiktest geprüft; die Browserabnahme steht in `docs/BRIEFE-ABNAHME.md`. Nichts davon ist veröffentlicht.

| ID | Wunsch | Umsetzungskriterium | Status |
|---|---|---|---|
| W49 | Kernmechanik: jeden Spieltag 1–3 neue Briefe | Zustellung in der Nacht, gespeichert, nach Neuladen nicht doppelt. | umgesetzt |
| W50 | Mietzahlungen per Brief | Brief ist nur Quittung; Geld kommt genau einmal über die nächtliche Stadtabrechnung (`lastRent`-Sperre). | umgesetzt |
| W51 | Mietanfragen | Zusage im Brief vermietet ein freies fertiges Haus genau einmal. | umgesetzt |
| W52 | Bauaufträge | Bauwunsch eines Bewohners für einen freien Bauplatz in Lindenstadt; nach Fertigstellung Dankesbrief mit 150 G als einmal abholbarer Beilage. | umgesetzt |
| W53 | Geschenke | Geschenkbrief mit einmal abholbarem Gegenstand. | umgesetzt |
| W54 | Bewertungen | Mieterbewertung nach einer Woche, Sterne erhöhen die Tagesmiete leicht. | umgesetzt |
| W55 | Anonymer Brief: „Schau dir Haus Nr. 7 an.“ | Haus finden → Schlüsselbrief → Renovierung (800 G, 20 Holz, 10 Stein, zwei Nächte) → Elva zieht ein. | umgesetzt |
| W56 | Geheimer Schlüssel | Teil der Haus-7-Geschichte (Brief „Ein Schlüssel ohne Absender“). | umgesetzt |
| W57 | Schatzkarte | Karte im Brief, drei Erdhügel im Mondwald, nur der richtige belohnt (300 G, 3 Kupfererz), einmalig. | umgesetzt |
| W58 | Mitternachtseinladung am alten Brunnen | Nur 23–24 Uhr am alten Brunnen; tagsüber passiert nichts. | umgesetzt |
| W59 | Altes Dokument | Folgt auf die Mitternacht am Brunnen. | umgesetzt |
| W60 | Brief von einem Geist | Folgt auf die Mitternacht; führt zur Brunnenreparatur (300 G, 15 Stein, 5 Kupfererz), danach Wasserstelle. | umgesetzt |
| W61 | Ereignis: Mieter verschwunden | Brief von Rosa → Zettel an der Haustür in Lindenstadt → Mieter am Dorfbahnhof gefunden (er war bei seiner kranken Schwester). Mietvertrag bleibt bestehen, Miete läuft weiter (vorausbezahlt), 150 G + 2 Tee genau einmal. `jm-ereignisse.js` | gebaut, Prüfung durch Hermes offen |
| W62 | Ereignis: verlassenes Haus zu verkaufen | Nur mit freiem Bauplatz: Ruine auf dem Bauplatz, Kauf 900 G macht genau diesen Bauplatz bezugsfertig (dieselbe `city.plots`-Zählung wie W39/W44, danach normale Mietanfrage), Ablehnen schließt ohne Kosten ab; wird der Platz anderweitig bebaut, endet das Ereignis ohne Kosten. | gebaut, Prüfung durch Hermes offen |
| W63 | Ereignis: reicher Fremder will die Villa mieten | Geklärt: „die Villa“ ist Haus Nr. 7 (nur wenn Elva dort wohnt). Herr Falk wartet 9–20 Uhr am Stadtbrunnen; Entscheidung: Elva bleibt (+150 Freundschaft, Dankesbrief mit Mondstein) oder Vermittlung eines Zimmers bei Lin (250 G). Elva verliert in keinem Fall ihr Haus. | gebaut, Prüfung durch Hermes offen |
| W64 | Ereignis: geheime Tür im Wald | Brief von Henk → Steintür im Nordwesten des Mondwalds → neue Karte `waldtuer` (Gewölbe) mit Truhe (200 G, 2 Mondquarz, einmal) und Steintafel (Ankündigung Vollmondwald); Rückweg über den Ausgang, Tür bleibt offen, Wegweiser löst die neue Karte auf. Der Vollmondwald selbst ist nicht gebaut. | gebaut, Prüfung durch Hermes offen |
| W65 | Ereignis: mysteriöser Bewohner | Jonas mit Tagesplan (Bahnhof 7–11, Dorfbrunnen 11–16, Stadtplatz 16–21 Uhr); an allen drei Orten mit ihm reden löst das Geheimnis (Hedwigs Enkel, Verbindung zu W60), 250 G + Mondstein einmal; danach bleibt er Bewohner. | gebaut, Prüfung durch Hermes offen |

## 5. Konkreter Bauvorschlag: Höhle mit zehn Ebenen

Die folgende Verteilung ist ein **eigener Entwurf**, keine aus Harvest Moon kopierte Ebenenliste. Bestehende Materialien bleiben nutzbar.

| Ebene | Charakter und Material | Spielerischer Zweck |
|---|---|---|
| 1 | Helle Eingangskammer, Stein, etwas Kupfer | Einstieg, Mechanik lernen, sicherer Rückweg. |
| 2 | Kupferadern | Erste Werkzeugverbesserung und Werkbankmaterial. |
| 3 | Dunklere Felsgänge, Eisen | Neues Material für Ausbauten. |
| 4 | Kristallkammer, Amethyst | Geschenke, Dekoration und Sammlung. |
| 5 | Unterirdischer Rastplatz, Silber | Erster größerer Meilenstein, später freischaltbare Abkürzung. |
| 6 | Goldadern, stärkere Felsen | Höherwertige Werkzeuge; Energieplanung wird wichtig. |
| 7 | Edelsteinkammer | Seltene Funde und Aufgaben für Dorfbewohner. |
| 8 | Mondquarzadern | Verbindung zur Mondmagie und magischen Pflanzen. |
| 9 | Alte Ruinen, Mondsplitter | Dorfgeschichte und Vorbereitung auf den Abschluss. |
| 10 | Magischer Teich, einzelne Mondkristalle | Eigene Fischarten, Entdeckungsszene, dauerhafter Tagebucheintrag. |

Regeln:

- Ein Höhlenbesuch ist ein Durchlauf. Nach komplettem Verlassen werden Abbausteine für den nächsten Eintritt erneuert – wie von René gewünscht.
- Beim Wechsel zwischen zwei Ebenen bleiben bereits abgebaute Steine innerhalb des Durchlaufs abgebaut. Neuladen füllt nicht heimlich alles auf.
- Erzstellen, Leitern und Angelplätze dürfen Wege nicht unlösbar blockieren. Mindestens ein begehbarer Rückweg ist garantiert.
- Entdeckungsfortschritt und einmalige Schätze bleiben dauerhaft gespeichert, auch wenn Steine neu erscheinen.
- Frühe Ebenen liefern Ressourcen für das Werkzeug, das tiefere Ebenen erleichtert. Keine Freischaltung darf ihr eigenes noch unerreichbares Material verlangen.
- Magische Fische beispielsweise „Sternenschuppe“, „Kristallforelle“, „Mondschleier“: neue Eigenschöpfungen mit eigenem Fangprofil; nicht vorhandene Namen als Originalinhalt ausgeben.
- Häufiger Wiedereintritt darf wirtschaftlich nutzbar sein, aber Verkaufspreise/Energieverbrauch müssen verhindern, dass eine Eingangskammer alle anderen Tätigkeiten sinnlos macht.

## 6. Dorf und Helfer: sinnvoller Umfang statt leerer Fläche

**Vorschlag zur Zielgröße, noch keine Zusage:** zunächst zwölf voll ausgearbeitete Bewohner insgesamt statt der bisherigen fünf; später nur erweitern, wenn Dialoge, Orte und Ereignisse mithalten. Ergänzende Rollen: Schmiedin, Schreiner, Ärztin/Tierpfleger, Bibliothekarin, Florist, reisender Händler und eine zunächst zuziehende Person. Namen und Charaktere eigenständig gestalten.

Jeder Bewohner erhält: Wohnort, Beruf, Wochen-/Wetterplan, Geburtstag, Vorlieben, Kontakte zu anderen Bewohnern, ein persönliches Problem und mindestens eine mehrstufige Geschichte. Wohnviertel, Werkstätten und Gemeinschaftsorte sollen Wege sinnvoll verlängern, nicht nur Laufzeit künstlich strecken.

Helferhaus als eigener besuchbarer Ort. Empfehlung: zunächst drei vollständig funktionierende Helfer für Gießen, Ernten und Tierpflege; später mehr mit individuellen Fähigkeiten. Wer eng am FoMT-Vorbild bleiben will, kann sieben anstreben.[1] Aufgaben müssen echte Bestände verändern: keine doppelte Ernte, kein Füttern ohne Futter und kein gleichzeitiger Verbrauch durch Spielerin und Helfer. Ergebnisse pro Tag übersichtlich anzeigen.

## 7. Priorisierte Umsetzung

### Etappe A – Vertrauen herstellen

1. Sammelobjekte/Socke am echten Spielstand nachstellen, 3D-Treffer und Darstellung korrigieren.
2. Kühlschrank mit Einlagern/Entnehmen und Küchenanbindung bauen.
3. Zutatenangebot und Herkunftshinweise korrigieren.
4. Vor jeder Erweiterung: exportierbare Spielstand-Sicherung und nachvollziehbare Migration.

Abnahme: Kauf → Kühlschrank → Neuladen → Kochen funktioniert ohne Verlust oder Verdopplung. Socke an gemeldeter Stelle ist normal bedienbar. Alte Spielstände bleiben erhalten.

### Etappe B – Erkundung und Fortschritt

Zehn Höhlenebenen, Wiedereintritts-Regel, magischer Teich, neue Rohstoffe, erste Schmiede-/Werkzeugstufen und Sammelalbum. Erst die komplette Kette bis zum Teich bauen und testen, dann zusätzliche Seltenheiten.

### Etappe C – Lebendiges Dorf

Dorf sinnvoll vergrößern, Bewohnerzahl schrittweise erhöhen, Wohnräume und Tagespläne, persönliche Geschichten, Beziehungen untereinander, Renovierungen und Einzüge. Elfenhaus und echte Hofarbeit der Helfer.

### Etappe D – Eigene Wirtschaft und Tiere

Samstagsstand → eigenes Café als erste ausgearbeitete Geschäftsrichtung. Verarbeitung, Besucher, Bestellungen und Ausbau. Danach zusätzliche Tierarten, Rettung, Zucht, Ententeich und Schatzsuche.

### Etappe E – Magie und langfristige Geschichten

Vollmondwald, Regenhändler, magische Pflanzen, Ruinen, geheime Briefe, Schatzkarten, Nachtmarkt und Wetterereignisse. Beziehungs-/Jahrestagsgeschichten; Entscheidung zum optionalen Romanzen-System vorab klären.

### Etappe 5 – Ziele, Geld, Spannung (Stand 17.10.2026, Branch `feat/stadt-und-wohnraum`, nicht live)

Gebaut und im Browser abgenommen (Bericht `docs/ETAPPE-5-ABNAHME.md`): sofort sichtbare Ziele für fortgeschrittene Höfe (Brief und Hinweisbox), eine Preisleiter (sofort ≤ 40.000 G, mittel 50.000–150.000 G, lang ab 300.000 G), Material bei Timo mit Tageslimit, Lindenstadt in fünf Stufen (Bäckerei, Blumenladen und Park, Villa für Herrn Falk, Hotel) mit wachsenden Einnahmen, Silber- und Goldwerkzeug, ein neues Feldstück, Großaufträge mit Frist, ein Erntewettbewerb mit Greta, Hof- und Stadtsterne und eine Trophäenwand. Zeitrechnung für Janina (38.500 G Start): Stufe 2 sofort, nach 3 Nächten fertig; Stufe 3 etwa Tag 18; Stufe 5 etwa Tag 122 (gut zwei Spieljahre). Offen sind ein Test auf echter Hardware, das Update der installierten PWA und Renés Freigabe.

**Keine belastbare Zeit- oder Umfangsgleichheit versprechen:** Featureanzahl, Anzahl der Dialoge oder zehn Ebenen beweisen keine zwanzig Stunden gute Unterhaltung. Das muss durch echte Spielsitzungen und ausgewertete Wiederholungen geprüft werden.

## 8. Verbindliche Prüfungen pro Bauetappe

- Alte Spielstände laden, neue Felder ergänzen, Daten nach Speichern/Neuladen vergleichen. Kein stiller Neustart.
- Gegenstandsbilanz prüfen: Kauf, Lagern, Entnehmen, Kochen, Schenken, Helferernte und Verkauf dürfen weder duplizieren noch ungewollt löschen.
- Socke hinter Hundehütte auf echtem Handy bzw. passender iPhone-Ansicht und am Rechner normal antippen; 2D/3D nur soweit als unterstützte Ansichten angeboten.
- Höhle im selben Tag leeren → komplett verlassen → zurückkehren: neue Steine. Ebene wechseln → zurück: kein unerwünschtes Neuwürfeln. Auf jeder Ebene Rückweg; nach Neuladen korrekte Position/Tiefe.
- Magischen Teich tatsächlich erreichen und dort mindestens einen besonderen Fisch regulär fangen; Fangbedingungen mit kontrollierbarer Zufallsquelle testen.
- Kühlschrank: 1/Menge/alle, ungültige Mengen, leere Lager, gemischte Rezeptzutaten, voller Zielbehälter falls Kapazität existiert.
- Öffnungszeiten, Ruhetage, Regenpläne, Geburtstage, Feste und Ereignisse an den Zeitgrenzen testen.
- Helfer und Spielerin bearbeiten dasselbe Feld: genau eine Ernte; Aufgaben laufen nur innerhalb ihrer vereinbarten Dauer.
- Vollmondwald schließt während des Aufenthalts: sicher verlassen können, keine verlorenen Spielfiguren.
- Spielbare neue Inhalte nicht nur über Testbefehle erreichen: Hinweise, Freischaltungen, Wege und Bedienung regulär durchspielen.
- Syntaxprüfung und reproduzierbare Logiktests; bei Änderungen mehrerer Code-Dateien unabhängige Prüfung durch frischen Kontext.
- Mobilansicht, Berührungssteuerung und Leistung im größeren Dorf prüfen. Installation/offline und Aktualisierung auf vorhandener Installation gesondert testen.

## 9. Offene Entscheidungen – keine Blockade der Recherche

- B04: Was genau fehlt bei den herumliegenden Sachen? Für den späteren Fehlernachweis Screenshot oder betroffenen Spielstand verwenden.
- Romanzen: **entschieden am 16.10.2026** – beide Stränge (Janina und René als Paar; Dorfbewohner untereinander verkuppeln), siehe W06/W24. In Etappe 2 auf dem Entwicklungszweig gebaut, Prüfbericht `docs/ETAPPE-2-ABNAHME.md`; unabhängige Prüfung offen.
- Janinas Geburtstag und euer Jahrestag: Im Spiel gab es kein Datum. Ich habe Vorschläge gesetzt (6. Herbst, 12. Sommer), weil eine Abfrage beim Start bestehende Spielstände unterbrochen hätte. René sollte die echten Daten im Tagebuch unter „Herz“ eintragen.
- Eigenes Geschäft: Café als erste konkrete Richtung (Empfehlung); weitere Geschäftsarten bleiben geplant statt vorgetäuscht.
- Magieentscheidungen: abgeschnittener Bildsatz enthält kein vollständig lesbares gewünschtes Ergebnis.
- Referenzversion: Falls ein bestimmter Harvest-Moon-Teil gemeint war, dessen Abweichungen gezielt nachrecherchieren. Der aktuelle Plan verwendet die ausdrücklich genannten Referenzen.

Die klar benannten Reparaturen und die Höhlenanforderungen hängen nicht von diesen späteren Inhaltsentscheidungen ab.

## Sources

[1] https://fogu.com/hm4/peeps/sprites.htm
[2] https://fogu.com/sos3/activities/mining.html
[3] https://fogu.com/sos3/index.html
[5] https://fogu.com/sos3/mineral_town/general_store.html — General Store | Mineral Town Shops | Story of Seasons: Friends of Mineral Town
[6] https://fogu.com/hm11/activities/cooking-basics.php — Cooking Tutorial | Harvest Moon: A New Beginning
[7] https://fogu.com/sos3/mineral_town/villagers/sasha.html — Sasha | Town Villagers | Story of Seasons: Friends of Mineral Town
[8] https://fogu.com/sos3/marriage/index.html — How to Get Married | Story of Seasons: Friends of Mineral Town
[9] https://fogu.com/sos3/farm/tools.html — How To Upgrade Your Tools | Story of Seasons: Friends of Mineral Town
[10] https://fogu.com/sos3/farm/index.html — Introduction to Growing Crops | Story of Seasons: Friends of Mineral Town
[12] https://fogu.com/sos3/activities/fishing.html — Fishing | Story of Seasons: Friends of Mineral Town
[13] https://fogu.com/sos3/events/index.html — Yearly Calendar | Story of Seasons: Friends of Mineral Town
