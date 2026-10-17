# Etappe 4 – Restinhalte: Entwicklungsabnahme

Ausgang `de0367c4de61d70ab48cc069e0e4a1dc1493d29d` (von René bereits veröffentlicht). Neue Arbeit ausschließlich `feat/stadt-und-wohnraum`, **nicht veröffentlicht**. Persönliche Browserprofile und Spielstände wurden nicht geöffnet.

## Gesicherter Produktstand

Nach jedem grünen Modul committed und nach `origin/feat/stadt-und-wohnraum` gepusht: `70cc5cd` (A), `b31cfab` (B), `69bc831` (C), **`522beb0df1d334aa728bbe466159aa44bb21e897` (A–D vollständig, letzter Produktcommit)**. Dieser 40-stellige Produkt-Remotehash wurde mit `git ls-remote` zurückgelesen. `main` und `gh-pages` wurden ebenfalls zurückgelesen und bleiben beide auf **`de0367c4de61d70ab48cc069e0e4a1dc1493d29d`**. Ein nachfolgender Abschluss-Dokumentationscommit verändert keinen Spielcode.

Kurze Reproduktion im Repo: `/Users/reneklomfas/.hermes/node/bin/node --test tests/*.test.cjs`; Syntax mit `node --check` je `jm-*.js` und `sw.js`. Browserprogramme `tests/chronik-browser.cjs`, `tests/entdecken-browser.cjs`, `tests/gemeinschaft-browser.cjs`, `tests/zuhause-browser.cjs` mit isoliertem Loopback-Server, `PLAYWRIGHT_PATH`, Chrome-Channel und `caffeinate -ims` seriell betreiben. `BASE_URL` ist einstellbar; neue Standardvorschau 8793. `SEG` wählt bei Entdecken/Gemeinschaft/Zuhause nur benötigte Abschnitte. Kein `run-all` notwendig.

## A – Brunnenchronik und Waldhilfe

`jm-chronik.js` verbindet W08, W11, W12 und W32 mit vorhandenen Systemen: Henks Gewölbe → Steintafel → Ruinenplatte auf Ebene 9 → Hedwig am reparierten alten Brunnen → Steinring im Vollmondwald → Jonas → Lumi. Fortschritt und Inschriften stehen im Herz-Tagebuch. Die Einladung kommt auch bei alten fortgeschrittenen Spielständen bei der nächsten Nacht. Am Gewölbe kann die Geschichte zusätzlich direkt begonnen werden.

**Korrigierter Ausgangsbefund:** Im tatsächlichen Repository `de0367c` gibt es entgegen der Auftragsannahme noch kein Helfersystem (Suche in sämtlichen Spielmodulen, bisheriger Etappe-4-Bericht bestätigt die Lücke). Statt eine angeblich bestehende API zu erfinden, wird eine einzige gemeinsame Arbeitsliste `JM.Helfer` / `s.helpers` eingeführt. Lumi nutzt dieselben echten Beete, Riesenartikel, Wiederernte-Alter und Futtertröge. Keine Phantomernte, kein Futter ohne Bestand, kein nachträgliches Wiederholen desselben Tages. Sichtbare Figur auf dem Hof; im Gewölbe wächst eine kleine Stube mit Lampe, Tisch, Pflanze und Teppich. Ein oder drei Tage, Tagesbericht, dann neuer Auftrag.

W12 ist ausdrücklich ein **neuer kleiner Entwurf**, nicht die Ergänzung des abgeschnittenen Bildtexts: Lichtlaterne (Lumi bis 20 Uhr sichtbar) oder Wasserschale (16 statt 12 Gießbeete). Beide schalten dieselbe Hilfe frei; am Steinring kostenlos wechselbar. Zwei Mondtau einmal zum Abschluss; kein Ausschluss einer Geschichte/eines Ortes.

### Prüfbelege A

- Rot: `node --test tests/chronik.test.cjs` gegen Ausgang ohne Modul: EXIT 1 (`ROT-CHRONIK-de0367c.log`). Grün: vier neue echte Logiktests; alle schnellen Logiktests **92/92**, EXIT 0 (`logs/chronik-logik.log`).
- Syntax: `node --check jm-chronik.js`, `node --check jm-game.js`: EXIT 0.
- Browser: `tests/chronik-browser.cjs`, eigener Loopback-Port 8793, isolierte Chrome-Kontexte, `caffeinate -ims`: sechs Schritte × Handy 390×844 2D/Rechner 1440×900 3D, **12/12**, EXIT 0 (`logs/chronik-browser.log`). Jeder Schritt: echter Weltklick, gegebenenfalls Auswahlknopf, Reload und Zustandsvergleich. Fixtures setzen nur den jeweiligen Startabschnitt; das ist keine Behauptung einer komplett ohne Fixture bereisten Geschichte.
- Nach visuellem Befund abgeschnittenen mobilen Auswahltext repariert (Umbruch nur für neue Knöpfe). Auswahl und Helfermenü danach **4/4**, EXIT 0 (`logs/chronik-browser-feinschliff.log`). Keine Pageerrors in diesen Wegen.
- Bilder selbst angesehen: `belege/chronik/entscheidung-390-2d.png` (vor und nach Umbruch), `entscheidung-1440-3d.png`, `helfer-390-2d.png`, `ruine-1440-3d.png`. Keine unabhängige gestalterische Endabnahme behauptet.
- Neues Modul im Precache, Cacheversion erhöht. Offline-Start in Modul B nachgewiesen (siehe unten).

## B – Wetter, Fänge, Nachtmarkt und Album

`jm-entdecken.js` ergänzt die vorhandenen Sternschnuppen statt einer zweiten Mechanik. Sternennächte und Nachtmarkt: 7./14. Tag jeder 14-Tage-Jahreszeit. Sternschnuppen bei klarem Himmel ab 19:30 häufiger/länger; vorhandene Wunschbelohnungen bleiben. Regenbogen: sonniger Morgen nach Regen, 7–10 Uhr. Nebel: sonniger zweiter Wochentag, 6–9 Uhr, fünf schwache Schleier ohne Trefferflächen. Beide Renderer verwenden dasselbe Overlay.

Regenforelle im regnerischen Waldfluss und Nebelkoi im nebligen Waldsee sind beim ersten erfolgreichen Fang am passenden Tag garantiert. Das echte Angel-Minispiel bleibt nötig. Kein blindes Warten auf eine winzige Chance. Hinweise stehen im Herz-Tagebuch und Album. Das Album ersetzt die bisherige kleine Sammlung im selben Tab, übernimmt vorhandene reale Daten und ergänzt gespeicherte Sichtungen; unbekannte Einträge haben Fundhinweise. Vorhandene Informationen zum magischen Teich und Mondbaum bleiben.

Nachtmarkt 18–22 Uhr am Dorfbrunnen: zwei bestückte Stände, Nachthändlerin Liora, Henk/Rosa als Besucher, Bank, Lampe und Blumenkübel. Mondsamen, Mondtau, Silber und Nachtminztee (+70 Energie). Pro Artikel ein Kauf je Markttag, nach Reload gesperrt, alle sofortigen Verkaufswerte einschließlich maximalem Marktbonus kleiner als Einkauf. W36/W57 ist schon ein vollständiges gespeichertes Rätsel und wurde nicht dupliziert.

### Prüfbelege B

- Rot gegen `70cc5cd`: `ROT-ENTDECKEN-70cc5cd.log`, EXIT 1. Fünf neue Logiktests grün, alle schnellen Tests **97/97**, EXIT 0 (`logs/entdecken-logik.log`).
- `tests/entdecken-browser.cjs`: Markt/Kauf/Reload, Regenbogen/Album/Reload, Nebelkoi und Regenforelle mit echtem Zeiger-gesteuertem Angel-Minispiel und Reload, Sternschnuppe antippen/Wunsch/Reload. Je Handy 2D und Rechner 3D. Vorlauf **9/10**, letzter Sternenklick 3D verfehlt. Der Prüfaufbau ermittelte die Position vor einer langsamen Bildschirmaufnahme; außerdem konnte das alte höhere Sternenband am HUD liegen. Die ursprüngliche Einzelursache wurde nicht getrennt vermessen. Beleg unverändert in `logs/entdecken-browser.log`. Nachlauf nur Markt und Sterne nach frischer Positionsmessung und tieferem HUD-freien Sternenband: **4/4**, EXIT 0 (`logs/entdecken-browser-nachlauf.log`). Kein Gesamtlauf wiederholt.
- Offline: `BASE_URL=http://127.0.0.1:8793/ node tests/offline.cjs`, EXIT 0, `logs/rest-offline.log`: neue Module aus Cache, frischer Offline-Tab, Chronik-/Helfer-/Albumfunktionen ausführbar. Kein Nachweis für Update einer schon installierten PWA.
- Syntax aller 19 Spiel-/SW-Dateien: EXIT 0. Bilder selbst angesehen: Nachtmarkt Welt in 390 2D/1440 3D (vor/nach Bestückung), Angebot 390 2D, Regenbogen 390 2D/1440 3D, Nebel 1440 3D, Album 390 2D.

## C – Gemeinschaftsgarten, Dorfplatz und Dorfgewächshaus

`jm-gemeinschaft.js` bündelt drei Projekte mit echten Materialien, Bauzeit, Zwischenständen und Nutzen. Neuer erreichbarer Garten hinter dem Wegweiser östlich der Anschlagtafel: Gestrüpp entfernen (8 Energie), dann Gemeinschaftsbeete (1.200 G/20 Holz/10 Stein, zwei Nächte). Mei und Timo pflegen den Ort; alle drei Tage zwei saisonale Früchte für deine Küche. Dorfplatz: 2.500 G/25 Holz/30 Stein, zwei Nächte; Baustellenschild/Material, dann Bänke/Blumen, Rosa und Henk treffen sich 16–18 Uhr; ab Folgetag einmal 30 G Standbeitrag.

Eigenes altes Dorfgewächshaus: 3.500 G/35 Holz/20 Stein/4 Eisen, drei Nächte; verwitterte Fassade, Gerüst, Rahmen, repariertes Glas, Pflanzkästen. Begehbarer eigener Innenraum, drei ganzjährige echte Beete, vorhandene Saat-/Wachstumsdaten, Wasserverbrauch aus der Kanne, Regenfass, Ernte/Wiederernte. Kein zweites Bezahlen oder Entfernen des bestehenden Hofgewächshauses. Neue 2D-Grafiken in `jm-art6.js`, entsprechende 3D-Geometrie, beide neuen Karten im Wegweiser berücksichtigt.

### Prüfbelege C

- Rot `ROT-GEMEINSCHAFT-b31cfab.log`, EXIT 1; drei neue Logiktests grün, alle schnellen Logiktests **100/100**, EXIT 0 (`logs/gemeinschaft-logik.log`). Alle 21 Spiel-/SW-Dateien syntaxgrün.
- Browser Bau: **8/8** (`logs/gemeinschaft-browser-bau.log`). Nutzen-Vorlauf **9/10** (`logs/gemeinschaft-browser-nutzen.log`): ein mobiler Rückwegklick kam zu früh nach dem Eintritt (dunkle Aufnahme; Eintrittsblende als Prüfaufbau-Ursache naheliegend, am Klick selbst nicht getrennt protokolliert), kein Pageerror. Der Test wartet jetzt vor Klicks auf das Ende der echten Blende. Kein produktiver Rückweg umgangen.
- Nachlauf nur betroffene Glaswege/Beete/Bauphase: **8/8**, EXIT 0 (`logs/gemeinschaft-browser-nachlauf.log`). Zusätzliche Ansichten **390 3D und 1440 2D**, jeweils Eintritt/Rückweg und Pflanzen/Gießen/Reload: **4/4**, EXIT 0 (`logs/gemeinschaft-browser-extra-ansichten.log`). Dach-Eckpunkte gegen Viewport und einzelne HUD-Elemente geprüft.
- Echte Nacht über Bettklick und „Gute Nacht“: **2/2**, EXIT 0 (`logs/gemeinschaft-browser-nacht.log`): letzte Bauphase wird fertig, 30 G kommen genau einmal, Reload verdoppelt nichts. Startfixture ist ausdrücklich die letzte bezahlte Baunacht, nicht ein behaupteter kompletter Ressourcen-Beschaffungsweg.
- Aus den JSON-Berichten per Python zusammengeführt und nach (Schritt/Breite/Grafik) dedupliziert: **24 eigenständige Kombinationen, 24 grün** nach gezielten Nachläufen. Die roten Vorläufe bleiben erhalten; kein alter Gesamtlauf wiederholt.
- Offline inkl. `jm-gemeinschaft.js` und `jm-art6.js`: EXIT 0 (`logs/gemeinschaft-offline.log`), eigene Karten/Projektmenü/neue Grafik im frischen Offline-Tab nutzbar.
- Bilder selbst angesehen: fertiger Garten 390 2D, Gewächshaus außen 1440 3D vor/nach Kamerafix (vorher Dach abgeschnitten; jetzt vollständig), innen 390 2D/1440 3D, reifes Glasbeet 1440 3D, Dorfplatz 1440 3D, Zusatzansichten Gewächshaus 390 3D und Innenraum 1440 2D. Fixture-Banner „Ein Jahr“/Ortsname sind auf einigen Aufnahmen sichtbar; sie gehören nicht zur neuen Einrichtung.

## D – Die noch offenen kleinen Dorfwünsche

`jm-zuhause.js` ergänzt W03/W27/W29 und das zweite Dorfpaar, ohne vorhandene Einzüge neu zu zählen. Nach Meis schon bestehender Geschichte verändern Blumen vor ihrem Markt und ein Meerespostkartenregal im echten Laden sichtbar den Ort; Dankesbrief einmal. Freunde ab drei Herzen kommen frühestens alle sieben Tage 8–11 Uhr auf den Hof; keine erzwungene Szene und ein Tee je Besuch. Nach dem ersten Janina/René-Picknick sind zwei kostenlose gemeinsame Hausgestaltungen (Wände, Teppich, Erinnerungsrahmen) an der Zimmerpflanze oder im Herz-Tagebuch wählbar; Küche, Bett, Inventar und Ausbauten bleiben.

Lin und Paula: erst bestehende Versöhnung und Gemeinschaftsgarten, dann Brief/Bitte → Einladung überbringen → Lin antwortet → Termin am nächsten Abend → sichtbares Treffen mit Teetisch, zueinander gewandten Figuren und zwei Antworten → Paar. Verpasstes Treffen lässt sich ohne Verlust neu vereinbaren. Danach gemeinsame Abendtreffen, andere Folgegespräche und einmal zwei Tee. Neue Paar-Nachsätze werden nicht vor die persönlichen Geheimnisse geschoben.

`jm-geheimnisse.js` füllt W01 für alle **15 dauerhaften Bewohner**: elf individuelle neue Drei-Teile-Geschichten plus vier bestehende. Dasselbe vorhandene `JM.Dorf`-System, 2/4/6 Herzen, ein Teil je Tag, Belohnung einmal, Speicherung im Herz-Tagebuch. Kein zweites Freundschaftssystem. Vorbeireisende und Lumi werden nicht zu zusätzlichen Pflichtbewohnern eines schon erreichten Erfolgs.

### Befunde und Prüfbelege D

- Ausgang rot: `ROT-ZUHAUSE-69bc831.log`; W01-Erweiterung separat rot: `ROT-GEHEIMNISSE-69bc831.log`. Anschließend fünf neue optionale Logiktests; alle 15 Geheimnisse mit drei realen Produktionsschritten, Tagesgrenze, Reload und Doppelbelohnungssperre getestet.
- Der erste gemischte Browserlauf wurde nach 220 s vom Werkzeug beendet (EXIT 124), **kein grüner Lauf**: `logs/zuhause-browser.log`. Seine Teilfehler wurden nicht als Flackern abgetan: (1) Gartenbesuche von Mei/Timo hatten deren Geschäfte vormittags geschlossen – jetzt 17–18 Uhr nach Geschäftsschluss, extra Logikregression. (2) Rosa öffnete am Hof ihr Samstags-Marktmenü – auf Dorfkarte begrenzt. (3) „Reden“ im Laden ging nicht durch den neuen Ereignisdialog – neue Geschichten haben auch dort Vorrang. (4) Lin-Fixture war vor Ladenöffnung – auf 12 Uhr korrigiert.
- Danach nur kurze Abschnitte: Markt/Besuch **4/4**, Einladung/Antwort **4/4**, Haus/Paar **4/4**, Geheimnis/Paar nach Inszenierung **4/4**, zusätzliche Haus-/Paaransichten 390 3D und 1440 2D **4/4**, jeweils EXIT 0. Logs `zuhause-browser-*.log`. Jeder Nutzerweg enthält echte Klicks und Reload. Aus den Berichten per Python dedupliziert: **18 eigenständige Kombinationen, 18 grün**. Antwortknöpfe gegen Viewport gemessen. Alle vier Bilder der neuen Paarszene selbst angesehen; außerdem Haus 390 2D/1440 3D und Meeresregal 390 2D.
- Abschluss: **108/108 schnelle Logiktests**, EXIT 0 (`logs/rest-abschluss-logik.log`). Zusätzlicher Bestandstest bestätigt, dass Riesen-Mondblüten bereits korrekt definiert sind – keine unnötige zweite Reparatur (`logs/riesenmondbluete-gruen.log`). 23 Spiel-/SW-Dateien syntaxgrün. Frischer Offline-Tab inkl. aller Restmodule und 15 Geschichten: EXIT 0 (`logs/rest-abschluss-offline.log`).
- `git diff --check` über Produktionscode, Tests und Markdown: keine Fehler. Die rohen roten Node-TAP-Logs enthalten Leerzeilen mit Einrückung; sie bleiben unverändert als Originalbeleg und sind vom Whitespace-Gate ausdrücklich ausgenommen.

## W-ID-Statusmatrix

| IDs | Status nach Modulen A–D |
|---|---|
| W07/W09/W10 | Schon live; vorhandene Lösung unverändert übernommen |
| W08/W11/W12/W32 | Neu gebaut, Logik und gezielte Browserwege grün; nur Entwicklungszweig |
| W33 | Vorhandene Sternschnuppen sinnvoll ergänzt; grün im gezielten Nachlauf |
| W34/W35 | Regenbogen und lesbarer Morgennebel gebaut, Browser/Album/Reload grün |
| W36/W57 | Bestehendes Schatzkartenrätsel vollständig, kein Duplikat gebaut |
| W37/W40/W41 | Album, Wetterfische, Nachtmarkt gebaut, echte Klick-/Fang-/Kaufwege grün |
| W38/W39/W43/W44/W48 | Bestehende Geburtstage, Stadt-/Haus-/Brunnen-/Café-/Tierprogression anerkannt, nicht doppelt gebaut |
| W42 | Kein Herunterstufen alter Spielstände; vorhandene echte Ruinen bleiben Ausgangszustand |
| W45/W46/W47 | Garten, Platz, eigenes Dorfgewächshaus gebaut, nutzbar und nach Reload erhalten; Hofgewächshaus bleibt |
| W03/W05/W27/W29 | Ladenveränderung, Besuche, gemeinsame Einrichtung gebaut; vorhandene Elva-/Jonas-Einzüge erhalten |
| W06/W24 | Erstes Dorfpaar besteht; Lin/Paula als zweite vollständige Vermittlungsgeschichte ergänzt |
| W01 | Alle 15 dauerhaften Bewohner mit persönlichen Drei-Teile-Geschichten; gleicher gespeicherter Fortschritt |
| W14/W22 | Gewählter vollständiger Umfang: Café, nutzbare Stadtbäckerei/Blumenladen und Entenzucht. Keine frei wechselbaren Unternehmensrichtungen, Tierpension oder Zucht jeder Tierart behauptet |

## Bildbeleg und Grenzen

`REST-BILD-BELEG-MANIFEST.json` enthält SHA-256 und Pfade der 26 tatsächlich selbst angesehenen Bilddateien. Dies ist Selbstkontrolle des Bauenden, keine unabhängige Abnahme.

## Offene Abnahmegrenzen

Alle im Auftrag konkret priorisierten Reststränge A–D sind gebaut; keine halben sichtbaren Knöpfe und keine neue Wunschliste. W14/W22 sind die oben ausdrücklich begrenzten Alternativen, keine Behauptung zusätzlicher Vollsysteme. Keine neue `run-all`-Schleife. Offen bleiben echte iPhone-/Rechnerhardware, Langzeit-Balancing, Update einer Bestands-PWA und unbekannte persönliche Saves. Neue Kurzprüfungen erfassen Pageerrors; die Browserkonsole wurde nicht durchgängig aufgezeichnet, daher kein pauschaler Konsolenfehlerfrei-Beleg. Kein Livegang. Unabhängige Code-/Gestaltungsabnahme vor einer künftigen Veröffentlichung bleibt Aufgabe des Auftraggebers.
