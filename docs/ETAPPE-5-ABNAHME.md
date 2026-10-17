# Etappe 5 – Ziele, Geld, Spannung – Prüfbericht

Branch `feat/stadt-und-wohnraum`. Logik aus `8982774` (88/88 grün). Diese Abnahme: Browserwege, Rahmung, Bildprüfung, Feinschliff der Darstellung.
`main` und `gh-pages` bleiben auf `c74f253` (live). Kein Merge, kein Deploy. Technische Übergabe, keine Freigabe durch René.

## Commits dieser Abnahme

| Commit | Inhalt |
|---|---|
| `f13fc5a` | Feinschliff: Park mit Brunnen, gezeichnete Brezel, Villenzaun mit Tor, Hotel mit drei Fensterreihen, lesbarem Schriftzug und Fahnen am Eingang, Desktop-3D-Kamera, Karten für Trophäenwand und Hofausbau, erweiterter Rahmungstest |
| `d102da2` | Browsertest 32/32 und Rahmung 68/68 grün, Belege, Offlinetest prüft `jm-ziele.js`/`jm-art5.js` |
| `27a3d07` | Wegfix `stadt-browser.cjs`, Logs offline/tipp-vorrang/picking/stadt-browser |
| (Abschluss) | Bericht, Manifest, Plan, Logs etappe4-Segment und Logik |

## Ursache des roten Browsertests

`ReferenceError: fx is not defined` (Zeile 25) kam aus dem Testaufbau: `fx` wurde im `page.evaluate` benutzt, aber nicht übergeben. Der Vorgänger hatte das bereits behoben (`{gfx,fx,seg}`), nur 390×2D war danach grün gelaufen. Danach lief der Test in allen Ansichten ohne Produktänderung grün. Die `fehler-*-390-2d.png` stammen aus diesem roten Vorlauf.

## Gefundene und behobene Darstellungsmängel

Ursache jeweils am Bild und mit Messwert belegt, bevor Produktcode geändert wurde.

1. **Desktop-3D schneidet hohe Gebäude ab.** Messung (1440×900, kleinster Zoom 0,45): Bäckerei-First bei y = −35 px, Villa −228 px, Hotel −28 px. Die Außenkamera zeigte im Querformat nur etwa 9 Reihen Tiefe. Fix in `jm-3d.js` `cameraUpdate`: Im Querformat (Seitenverhältnis > 1,2, außen, ohne Szenenkamera) zeigt die Kamera mindestens 4/5 der Grundbreite als Tiefe. Danach liegt der Bäckerei-First bei y = 85 px, die Villa bei 51 px. Hochformat und Innenräume sind unverändert.
2. **Hotel in 3D:** Der Schriftzug stand unter dem Dachüberstand und war unlesbar. Die Fahnen ragten oben aus dem Bild, und die Standardfenster überlagerten die Etagenfenster. Fix: Schild mit Pixel-„HOTEL“ vor der Traufe auf Messingstützen, drei saubere Fensterreihen mit Blumenkästen, Fahnenmasten vor dem Eingang. Das Hotel ist etwas niedriger (`tall` 1,6 → 1,35).
3. **Park wirkte leer.** Zwei Obstbäume verdeckten Bank und Beet, und es gab keinen Brunnen. Neu angeordnet (`jm-ziele.js` `parkObjs`): Pavillon und Brunnen im Norden, Blumenkübel dazwischen, Beet, Laterne und Bank im Süden. Die Obstbäume stehen seitlich am Rand, und der Weg ist an die Straße angebunden.
4. **Bäckerei:** Das Brezelschild war ein Oval. Jetzt ist es in 2D eine gezeichnete Brezel mit Zuckerkörnern und in 3D eine Herzkurve mit gekreuzten Armen. Der tote `text(...'BAECKEREI'.slice(0,0))` ist entfernt.
5. **Villa „groß und edel“:** neuer schmiedeeiserner Zaun mit Torbogen, Steinpfosten, Goldknäufen und Hecken (`villazaun`, 2D und 3D).
6. **Trophäenwand und Hofausbau:** Bisher war das reiner Fließtext. Jetzt sind es Karten mit Symbol, Titel, Text und Status: fertig grün, in Arbeit blau, freie Regalplätze gestrichelt. Die Inhalte sind weiter maskierter Text (`esc`), es gibt keine neue Regel.
7. `sw.js`: Cache auf `janinas-moon-etappe5-2` hochgezählt.

## Testmatrix

Seriell, Server 127.0.0.1:8765, Chrome headless (`channel:'chrome'`), frische Kontexte. Logs unter `docs/logs/etappe5-*.log`.

| Befehl | Ansichten | Exit |
|---|---|---|
| `node tests/etappe5-browser.cjs` (migration, material, stadt, stadt5, hof, ziele, auftrag, wettbewerb; je Reload mittendrin, echte Klicks) | 390/1440 × 2D/3D = 32 | 0 (`etappe5-browser-alle.log`) |
| `node tests/etappe5-rahmung.cjs` (17 Szenen) | 390/1440 × 2D/3D = 68 | 0 (`etappe5-rahmung-alle.log`) |
| `node tests/offline.cjs` (jetzt inkl. `jm-ziele.js`, `jm-art5.js`, Stadtstufen, Gebäude-Sprites, Material, Trophäen) | – | 0 |
| `node tests/tipp-vorrang.cjs` | 36 Fälle | 0 |
| `node tests/picking.cjs` | 390/1440 | 0 |
| `node tests/stadt-browser.cjs` (nach Wegfix im Test) | 390/1440 × 2D/3D | 0 (erster Lauf 1, siehe unten) |
| `node tests/etappe4-browser.cjs haendler` | 390/1440 × 2D/3D | 0 (Bilder nach `docs/belege/etappe5/nachlauf-etappe4-haendler/` verschoben, Etappe-4-Belege unverändert; Regenwagen 1440×3D nach Kamerafix angesehen: vollständig sichtbar) |
| `node --test tests/*.test.cjs` | – | 0 (88/88) |

Kein vollständiger `run-all`. Pageerrors und Konsolenfehler: keine (Assertion je Strang). rAF je Strang 121–122 Bilder in 2 s.

### `stadt-browser.cjs`: Testweg statt Produktfehler

Der erste Lauf brach in 390×3D auf dem Rückweg im Dorf ab („kein sichtbarer freier Boden nahe 6,9“). Zur Ursache:
- Gegenlauf auf archivierten Ständen: `6b78af8` (Etappe 4 abgeschlossen) und `87133ac` (vor dieser Abnahme), beide mit demselben Abbruch an derselben Stelle (`etappe5-stadt-browser-390-3d-gegenlauf-*.log`). Also keine Regression aus Etappe 5.
- Raycaster-Karte rund um 6,9 bei 390×3D: Das alte Teehaus (4,11, 5×3, seit Etappe 3) verdeckt mit seinem Dach die Wegkacheln x4–8, y8–10. Reihe 7 ist frei.
- Der Test führt den Dorfweg West jetzt über Reihe 7 (`(8,7)`, `(4,7)`). Am Spiel ändert sich nichts. Für Spielerinnen bleibt ein kleiner Bedienbefund offen: Bei 390×3D und kleinem Zoom trifft ein Tipp auf den Weg direkt nördlich des Teehauses das Dach.

## Angesehene Bilder

Selbst angesehen als Kontaktbögen 2D und 3D nebeneinander, Schilder mit Ausschnitt-Zoom. Liste mit SHA-256 in `docs/belege/etappe5/MANIFEST-angesehen.json` (Befund je angesehenem Bild; die übrigen Bilder aus grünen Läufen sind als „nicht einzeln angesehen“ markiert, `fehler-*` als Diagnosebilder).

- Lindenstadt Stufe 1 (Tafeln, Bauschild), Baustelle Phase 2 und 3, Stufe 2 Bäckerei, Stufe 3 Blumenladen und Park, Stufe 4 Villa mit Zaun, Stufe 5 Hotel und Gesamtansicht 1440×2D.
- Trophäenwand (Karten), Tagebuch mit Stadt-/Hof-Sternen und „Nächstes Ziel“, HUD-Hinweis, Timos Material, Hofausbau/Werkzeuge, Großauftrag, Wettbewerbsfenster, Banner „Erntewettbewerb gewonnen!“ und „Großauftrag erfüllt!“, Goldwerkzeug mit drei Beeten.
- Im Endstand ist nichts abgeschnitten und nichts vom HUD verdeckt; das prüft der Rahmungstest: Ecken und Dachspitze jedes Motivs außerhalb von Uhr, Hinweisbox, Zoomknöpfen und Werkzeugleiste, `elementFromPoint` = Canvas. Es schwebt nichts, und Panels haben mindestens 11 px Schrift, ohne seitliches Herausragen.
- Restbeobachtungen (kosmetisch, offen): In 1440×3D berührt die vordere Waldreihe den Hotelsockel knapp. Die 3D-Gesamtansicht zeigt bauartbedingt nur einen Ausschnitt (die Gesamtansicht ist in 2D belegt).

## Preis- und Zeitrechnung (Janina, Start 38.500 G)

Quelle: `node tests/etappe5-zeitrechnung.cjs`. Spielkonstanten: 14 Tage je Jahreszeit (`JM.DPS`), 56 Tage je Jahr.
Annahmen wie `Z.bilanz`: typischer Hof 2.200 G/Tag (Versand, Tiere, Tagesziele), Großaufträge etwa 230 G/Tag, dazu Mieten und Pachten der jeweils erreichten Stufe. Material wird zum Timo-Preis voll zugekauft (obere Grenze; Sammeln in Wald und Höhle ist kostenlos). Hofausbau-Ausgaben sind nicht eingerechnet.

| Stufe | Geld | Material (Timo) | Summe | Einnahmen/Tag davor → danach | Spartage | Bau beauftragt | fertig |
|---|---|---|---|---|---|---|---|
| 2 Marktflecken (Bäckerei) | 12.000 | 3.300 | 15.300 | 2.670 → 3.450 | 0 | Tag 0 (sofort) | Tag 3 |
| 3 Gartenstadt (Blumenladen, Park) | 60.000 | 6.600 | 66.600 | 3.450 → 4.240 | 11 | Tag 14 | Tag 18 |
| 4 Villenviertel (Villa) | 140.000 | 13.300 | 153.300 | 4.240 → 5.365 | 33 | Tag 51 | Tag 56 |
| 5 Kleinstadt (Hotel) | 320.000 | 21.600 | 341.600 | 5.365 → 7.365 | 60 | Tag 116 | Tag 122 |

**Kurz:** Stufe 2 geht sofort und ist nach 3 Nächten fertig (es bleiben ~23.000 G für Silberwerkzeug und Feldstück). Stufe 3 steht nach etwa 18 Spieltagen (gut eine Jahreszeit). Stufe 5 ist nach etwa 122 Spieltagen erreicht, das sind knapp 9 Jahreszeiten oder gut 2 Spieljahre. Das Tageslimit bei Timo (60 Holz, 60 Stein, 10 Eisen) bremst nicht, weil die Spartage länger sind. Der Winter mit weniger Ernte ist in der Pauschale von 2.200 G nicht gesondert abgezogen; die echten Zeiten sind daher eher länger.

## Offen

- Kein Test auf echter Mobilhardware. Das Update einer bereits installierten PWA ist nicht geprüft.
- Bedienbefund Dorf 390×3D: Das Teehausdach verdeckt beim Tippen die Wegkacheln nördlich davon (bestand schon vor Etappe 5).
- Kosmetisch: In 1440×3D berührt die vordere Waldreihe den Hotelsockel.
- Die Zeitrechnung ist ein Modell mit Pauschalen und nicht aus echten Spielsitzungen gemessen.
