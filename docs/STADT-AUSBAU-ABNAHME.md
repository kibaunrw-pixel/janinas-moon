# Stadt und Wohnraum – technische Teilabnahme (Entwicklung, nicht veröffentlicht)

## Umfang dieser Übergabe
**Teilpaket, keine Gesamterledigung des Stadtauftrags.** Die während der Arbeit priorisierten Fehler/Nachträge (Transfermengen und Rücknahme, Markt, einklappbare Hinweise, Riesenpflanzen) und die echte Wohnraumverbesserung werden hier geprüft. Bahnhof, neue Stadt, Bauplätze/Mietsystem und Restaurantausbau sind **noch nicht implementiert**. Dafür wurden keine Attrappen oder unbenutzbaren Menüs angelegt. Unabhängige Abnahme bleibt bei Hermes.

Ausgang: sauberer Commit `926f78e60e25b0b915d35e4bb5d5faec5bf0427d`, neuer Branch `feat/stadt-und-wohnraum`. Remote-Ausgang für main, gh-pages und feat/hofausbau-fundament identisch. Nur Entwicklungszweig wird gepusht, kein Merge/Deploy.

## 1. Transferlisten und direkte Mengen
- Ursache reproduziert: `openPanel()` ersetzt das DOM und setzt ausdrücklich `scrollTop=0`. Dabei gingen Eingabewerte und Fokus verloren. Nicht nur ein falscher Scrollwert.
- Gezielte In-place-Aktualisierung: semantischer Aktionsanker, bei verschwundener Zeile nächster sichtbarer Nachbar, geklemmte Ersatzposition, erhaltene Eingabewerte und Fokus mit `preventScroll`. Neue/gewechselte Dialoge starten weiterhin oben und mit frischer Auswahl.
- Kühlschrank: **getrennte direkt eintippbare Einlager-/Entnahmemengen**, jeweiliger maximaler Quellbestand, numerische mobile Tastatur, Enter oder explizite Bestätigung sowie 1/Alle.
- Versand: bestehendes `S.ship` ist bereits die gespeicherte Warteschlange. Kein neuer zweiter Speicher und keine Umdeutung von `shipLog` (schon verkauft). Inhalt vollständig sichtbar, Teilmenge/Alle zurück in Rucksack, Einlegen per freier Menge; Abholung/Auszahlung erst beim Schlafen. Nach Abholung ist die geleerte Warteschlange nicht mehr entnehmbar.
- Gemeinsame strenge Mengenprüfung: nur positive sichere ganze Zahlen bis Bestand; leer, negativ, dezimal, NaN/Infinity, Exponentialschreibweise und Überbestand verändern nichts. Native Doppelklick-Folge und gehaltenes Enter erzeugen keinen zweiten Transfer; getrennte bewusste Einzelaktionen bleiben möglich.
- Mengen-/Scrollkontext auch für Küche, Werkbank, Ladenkauf und Mondbaum-Neuzeichnen erhalten. Inventarliste wird beim Versand-Refresh neu aus dem aktuellen Bestand aufgebaut, damit zurückgeholte Artikel sofort wieder auftauchen.
- Systematischer Restbefund: Anschlagtafel und Mondbaum sind **dauerhafte Auftrags-/Gabenabgaben, keine zurücknehmbaren Lager**. Deren bestehende automatische Gesamt-/Restabgabe hat in diesem Teilpaket noch keine freie Teilmengeneingabe. Tierfütterung gibt bedarfsgesteuert Futter ab; keine Lagerentnahme. Diese Unterschiede sind nicht als vollständig vereinheitlicht abgenommen.

## 2. Markt – eigener neuer Fehler
Untersuchte Hypothesen in Reihenfolge:
1. **Interaktionspriorität/NPC-Überdeckung – reproduziert.** Rosa steht samstags regulär auf `(12,12)`, der Stand auf `(12,10..11)`. `hitActor()` vor Objektinteraktion erreicht beim Stand-Klick Rosa; zuvor gab es dort nur Gespräch. Im unveränderten archivierten Ausgangscommit ebenfalls reproduziert: also **nicht durch den neuen Versandumbau verursacht**.
2. **Spielkalender/Zeit – kontrolliert.** `(day-1)%7===5`: Samstag, z. B. Spieltag 6/13/20. Öffnung 09:00 bis vor 15:00, nicht an Festtagen. Systemdatum ist irrelevant. Grenzen 08:59/09:00/14:59/15:00 und Nichtmarkttag geprüft. Aktuelle Festdaten fallen im bestehenden 56-Tage-Jahr nie auf Samstag; die bisherige Festsperre bleibt trotzdem erhalten.
3. **Gespeicherter Markt-/Eventzustand – geprüft.** Tagesbilanz gehört nur zum aktuellen Spieltag; ein älteres `market.day` wird beim tatsächlichen Marktbesuch sauber neu begonnen. Alte Besuchsdaten sperren nicht den Zugang. Keine belegte Originalsave-Ursache.

Fix: Rosas Marktinteraktion bietet ausdrücklich **„Marktstand öffnen“ und „Mit Rosa reden“**, statt Handel hinter ihrem Gespräch zu verlieren. Normaler Dialog und Vorstellung bleiben separat. Handel nur bei tatsächlich offener Marktregel, auch in der Verkaufsfunktion nochmals geprüft. Freie Teilmenge mit sichtbarem Maximum, Preisvorschau und sofortiger Geld-/Bestandsbilanz. Der angezeigte Stückpreis gilt für die gesamte bestätigte Teilmenge; anschließend aktualisiert sich der Andrang. Direktverkauf ist sichtbar als endgültig beschriftet, nicht mit der zurücknehmbaren Versandwarteschlange verwechselt.

**Grenze:** Renés Originalspielstand für den neuen Marktfall fehlt. Der allgemeine Überdeckungsfehler ist nachgewiesen und behoben; ob sein konkreter Tag/Zeit/Festzustand zusätzlich abwich, bleibt ohne Spieltag, Uhrzeit und Export offen.

## 3. Mondfest-/Tageszielhinweise
Tatsächlich ein gemeinsamer HUD-Knopf `#quest` mit Titel und Fortschritts-/Tageszielzeile, kein separates Mondfest-Modal. Sichtbarer 44-Pixel-Knopf klappt ihn ein; kompakter **„Ziele +“**-Knopf öffnet jederzeit wieder. `hintsCollapsed` wird gespeichert, Altstände ohne Einstellung beginnen aufgeklappt. Tages-/Festwechsel und Reload respektieren die Einstellung. Versteckter Inhalt hat keine Klickfläche; ein echter Pointer bewegt die Figur an einer vorher verdeckten Weltstelle. Nach Aufklappen sind Mondfest-Countdown und neue Tagesziele aktuell. Aufgaben/Fortschritt wurden nicht entfernt.

## 4. Echte Wohnraumverbesserung
- Bezahlte Stufe 1 bekommt **kostenlos** eine erreichbare obere Lesegalerie mit sichtbarer Treppe, Bücherregalen, Tisch, Fernseher, Pflanzen und eigenem Farb-/Teppichbild.
- Stufe 2 erweitert die obere Etage auf 20 Kacheln Breite und ergänzt abgetrenntes Schlafzimmer, Bett und Kleiderschrank. Eine sichtbare 3D-Innenwand entspricht der tatsächlichen Wegsperre; kein unsichtbarer Blocker.
- Erdgeschoss-Anbau bleibt kompatibel, inklusive bestehendem Kühlschrankzugang und Werkbank; zusätzliche Etage ist ausdrücklich nicht durch einen weiteren Kühlschrank ersetzt.
- Keine erneute Zahlung, kein erneuter Energiebonus für bereits bezahlte Stufen. Bauaufträge aus dem ersten Paket werden unverändert abgeschlossen; bestehender Runner prüft beide regulären Baukäufe und Nächte.
- Neue Karte `haus_oben` mit Rücktreppe/Ausgang und Wegweiserbehandlung. Browserweg Hof → Haustür → Treppe → Galerie/Schlafzimmer → Treppe → Hof ohne Teleport oder `JMDEBUG.tap` für diesen Weg. Beide Stufen, 390×844/1440×900, jeweils 2D/3D; mobil zusätzlich Pixeldichte 2. Logik prüft Erreichbarkeit aller Möbel und Ausgänge.

## 5. Riesenpflanzen
Vorher bedeutete Feldmerkmal `c.g` **Größe**, nicht goldene Qualität: eine große Ernte wurde sofort in fünf normale Früchte aufgelöst. Keine separate Pflanzenqualität vorhanden. Bereits so gespeicherte historische Normalstapel lassen sich nicht zuverlässig rückwirkend rekonstruieren und werden nicht umgedeutet.

Jetzt eigener Schlüssel `riesig_<sorte>`, Name „Riesen-…“, R-Kennzeichnung am Inventarbild, eigene Stapel und persistenter Größenstatus. Jede große Ernte liefert **eine** echte Riesenpflanze. Wert: bisheriger Fünferertrag plus **20 % Größenbonus**, also sechs normale Verkaufseinheiten; nicht willkürlich sechsfache Belohnung gegenüber dem alten Fünferertrag. Essbare Varianten entsprechen beim Energieinhalt dem alten Fünferertrag. Versand und Markt verwenden denselben Artikelbasiswert, Markt zusätzlich seinen bestehenden sichtbaren Aufschlag. Beispiel Kürbis: normal 260 G, Riesen-Kürbis 1560 G. Diese Werte werden aus den Produktionsdaten geprüft, nicht als synthetische Marktpreise erfunden.

Getrennte Normal-/Riesenernte, Name/Vorschau, Kühlschrank- und Versandteilmenge/Rücknahme/Reload im Browser; Mengen-/Geldbilanz und normal/ riesig für alle Sorten in Produktionslogiktests. Riesenpflanzen werden derzeit nicht automatisch in normale Kochzutaten zerlegt; für konkrete Rezepte bleibt die normale Sorte erforderlich.

## 6. Ausgeführte Prüfungen und Nachweise
Rotläufe vor dem jeweiligen Fix: `docs/ROT-TRANSFER.json`, `ROT-VERSAND.json`, `ROT-MARKT.json`, `ROT-HINWEISE.json`, `ROT-RIESENPFLANZEN.json` und erster roter `node --test tests/wohnraum.test.cjs` („obere Etage fehlt“).

Zusätzlich alle fünf Browserregressionen gegen **unverändertes `git archive 926f78e…`**, ohne Branchwechsel, auf separatem Loopback-Port 8786 erneut rot ausgeführt: `docs/ROT-BASELINE-926f78e.json`. Exakt beobachtet: Kühlschrank-Anker y399.59 → y2481.59; Markt-Klick nur Rosa; fehlende Versandeingabe; fehlender Einklappknopf; normale Kürbisse 11 statt getrennter Ernte 1+2. Diese Rotläufe sind echte Exit-1-Ergebnisse, keine erfundenen Testausgaben.

Befehle:
```sh
PLAYWRIGHT_PATH=/Users/reneklomfas/.npm/_npx/fd3bca3c548369c0/node_modules/playwright node tests/run-all.cjs
node --test tests/wohnraum.test.cjs tests/versand.test.cjs tests/markt.test.cjs tests/riesenpflanzen.test.cjs
/opt/homebrew/bin/git diff --check
```

**Abschließender Gesamtlauf: Exit 0, alle 37 Befehle erfolgreich** (24 Syntaxprüfungen, 16 Logiktests in einem Node-Testlauf, 12 Browserprogramme). Vollständige echte Ausgaben in `docs/GRUEN-TESTS.json`. `git diff --check` ebenfalls Exit 0. Geprüfter Codecommit: `66725d0ce4e86dae50b9e77b0cee704ad5b0c4e1`, auf origin/feat/stadt-und-wohnraum per Remote-Lesen bestätigt; main/gh-pages weiterhin `926f78e60e25b0b915d35e4bb5d5faec5bf0427d`.

Ein früher isolierter Wohnraumlauf überschritt die zu knapp gesetzte äußere 180-Sekunden-Grenze nach sieben erfolgreichen Kombinationen; kein Produktfehler daraus abgeleitet. Letzte Kombination separat grün, anschließend alle acht Kombinationen im kompletten Runner innerhalb seiner 300-Sekunden-Programmgrenze erfolgreich. Bei der Sichtprüfung fiel zunächst eine horizontale Überbreite des neuen Marktformulars auf; Layout danach korrigiert und im endgültigen Browserprogramm per `scrollWidth<=clientWidth+1` geprüft.

Acht ausgewählte Screenshots **tatsächlich angesehen und dauerhaft ins Repo übernommen**, nicht nur erzeugt: `docs/belege/stadt-ausbau/`. Dateipfade, SHA-256 und Größen stehen in `docs/STADT-BELEG-MANIFEST.json`. Weitere Laufbilder bleiben im Scratch unter `/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-stadt/` beziehungsweise die bestehenden Runnerbilder unter `janinas-moon-abnahme/`. Galerie 2D, Wohnetage 3D mit sichtbarer Innenwand, Markt mobil, Transfer mobil, Versandrücknahme, kompakte/offene Hinweise und getrennte Riesenernte wurden visuell kontrolliert. Alle Browserkontexte isoliert, sämtliche Anfangsbestände/reifen Felder/Baulevels/Testfortschritte ausdrücklich synthetisch, keine persönlichen Browser-Spielstände verändert. Normale Bedienhandlungen wurden nicht als Originalsave-Nachweis ausgegeben.

## 7. Bewusst offen / Fortsetzung
1. Bahnhof aus dem Dorf, tatsächliche Hin-/Rückreise, erste neue Stadt mit mehreren begehbaren Plätzen.
2. Gespeicherter mehrtägiger Hausbau mit Material-/Geldkosten und sichtbaren Phasen; eigenständige Mieter, einmalige taggenaue moderate Miete ohne Reise-/Reload-Exploit. Erst hierfür neue Savefelder anlegen und rot/grün prüfen.
3. Bestehendes Lins Nudelhaus in Restaurantausbau überführen: größere kaufbare Karte und abendliche tatsächliche, tagabhängig rotierende Besucher ohne Duplikate. Noch keine dieser neuen Restaurantregeln geändert.
4. Freie Mengen auch für irreversible Mondbaum-/Auftragsabgaben gesondert entwerfen und testen; Rücknahmen dürfen bereits ausgelöste Storybelohnungen nicht duplizieren.
5. Original-Marktspielstand, physisches iPhone/Safari, Bildschirmtastatur auf echter Hardware, Aktualisierung einer bestehenden installierten PWA und Langzeitbalancing sind nicht geprüft. Frischer isolierter Offline-Start gehört zum Runner; Bestands-PWA-Update nicht damit gleichsetzen.

Kein Merge, kein Deploy, keine öffentliche Vorschau. Testserver ausschließlich Loopback.
