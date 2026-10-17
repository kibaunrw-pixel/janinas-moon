# Etappe 3 – Café und Tiere mit Persönlichkeit – Prüfbericht

Branch `feat/stadt-und-wohnraum`. Ursprünglicher Etappe-3-Ausgangsstand `9658784`, Ausgangsstand dieser Darstellungsnacharbeit `33b6fb5a070b26335b464d260f489e91671c7ad7` (Arbeitsbaum sauber). `main` und `gh-pages` (`2690fda`) bleiben unangetastet. Weder Merge noch Deploy.
Dieser Bericht dokumentiert lokale Chrome-Prüfungen und selbst angesehene Bildbelege, **keine iPhone-Geräteabnahme oder visuelle Endabnahme**.

## Commits
| Commit | Inhalt |
|---|---|
| `742a9a5` | Module `jm-cafe.js`, `jm-tiere.js`, `jm-art3.js`; Anbindung in `jm-game.js` und `jm-3d.js`; `R.storyPending`; Cache `etappe3-1`; Logiktest rot→grün, Rot-Log |
| `571e417` | `tests/etappe3-browser.cjs` (7 Wege), `offline.cjs` erweitert, Picknickweg toleriert Kuscheln, `run-all.cjs` |
| `2a1887f` | 3D-Wege robust, Plan mit Status W13–W23 |
| `a20254c` | Pfotenspur in 3D deutlicher, Wegweiser „im Café“, Bildausschnitte, Rot-Log Teichboden (widerlegt) |
| `33b6fb5` | Etappe-3-Ausgangsstand für die visuelle Nacharbeit |
| `7cafc2d` | Café-Kameras und 2D-Rahmung, sichtbare Kette/Vitrinenware, vollständige Tafel, Deko, zusätzliche Rahmungsprobe; unabhängig geprüft, Café in vier Ansichten grün |
| `9deabd0` | Tierbelege näher heranholen; Katze in vier Ansichten grün |
| `6ee39b2`, `0981092`, `be398c4`, `4d43878` | dokumentierte grüne Zwischenprüfungen von Hund, Ziege und Teich |
| `26a1bba`, `5e90f6e`, `9998190` | grüne Schlussbelege für Hund vor dem Baum, Ziege seitlich und Enten am freien Nordufer |
| `4b2ceff` | korrigierte Belegwege, Warten auf Adoptionsdialog und begrenzter Pip-Zoom; Rettung in allen vier Ansichten grün, Rot-Logs erhalten |
| `0aa3e6d` | René-Vorrang in vier Ansichten grün |
| `d7487a0`, `74bea3a`, `691c40a` | 72 Logiktests, 36 Tipp-Vorrangfälle und Picking in beiden Breiten grün |

Jeder grüne Teilschritt wurde committet und mit `git push origin feat/stadt-und-wohnraum` gepusht; der jeweilige Remotehash wurde per `git ls-remote` gelesen. Der Abschlusscommit ergänzt die vollständig ausgefüllte Dokumentation, die neue Belegmatrix und alle 64 Bildoriginale mit Manifest. `main` und `gh-pages` wurden am Schluss erneut gelesen: beide weiterhin `2690fda8dafc8997087d1476e556f3c3d5be8beb`.

## Aufbau
- **`jm-cafe.js`** (Logik, ohne DOM, Zustand `s.cafe`): Renovierung, Vitrine, Öffnung, Gäste, Abrechnung, Freischaltungen, Bestellungen. Hängt sich wie `jm-dorf.js` an: Migration, Nacht und Briefe, `Post.apply` (Teehaus und Innenraum `i_cafe`), `Stadt.location` (Gäste sitzen im Café), `Post.target` (Wegweiser), `Post.evAct` (Tür und Theke).
- **`jm-tiere.js`** (Logik, ohne DOM, Zustand `s.tiere`): Katze, Pudel-Schatzsuche, Ziege, Teich und Enten, Zucht, Rettung. `Ti.pets(S,map)` liefert die Darsteller mit Ort und Pose (`schlaf`, `kau`, `schwimm`, `lauf`); `Ti.tick` meldet das Naschen der Ziege genau einmal.
- **`jm-game.js`** zeigt nur an: Darstellerliste `PETS` (wie Hühner, blockiert keine Kachel), Tippziel nach Gegenständen (`tapAt` prüft Tiere erst nach Objekten, Feld und Funden; 3D über `R3.pick` mit Kennung `pet:<id>`), Café-Menü an der Theke, sitzende Gäste, Tagebuchabschnitte „Café Mondlicht“, „Ententeich“ und „Tiergeschichten“.
- **`jm-art3.js` / `jm-3d.js`**: Teehaus (alt, Baustelle, Café mit Markise, Schild, Blumenkästen), Theke mit Kaffeemaschine, Kuchenvitrine mit echtem Inhalt, Tafel mit Tagesangebot, Tische mit Hängelampen, Stühle, Pflanzen, Lichterkette; Katze (schläft eingerollt in der Sonne), Ziege (kaut, trägt das genaschte Gemüse), Enten (schwimmen mit Bugwelle, Wellenring in 3D), Küken, Kätzchen im Korb, Entenhaus, Futterstelle, Leckstein, Grabstelle, Pfotenspur.
- **Neue Karten-ID:** `i_cafe`. `routeTarget` kennt sie über die Tür im Dorf. Logiktest „Wegweiser“ prüft für jedes neue Ziel die Erreichbarkeit auf seiner Karte.

### Warum das Teehaus und nicht der Marktstand
Der Samstagsstand ist ein Direktverkauf an einem Tag pro Woche. Ein Ausbau hätte ihn verdrängt oder ihm eine zweite Rolle gegeben. Das Café braucht einen Innenraum mit Tischen, Theke und Gästen, die sich setzen. Ein leerstehendes Teehaus am Dorfrand gibt der Renovierung einen sichtbaren Vorher-Nachher-Zustand (alt → Baustelle → Café) und erhält den Stand, wie Janina ihn kennt. Rosas Brief stellt die Verbindung her („wie dein Stand, nur mit Stühlen“).

## Pflichtpunkte
| Punkt | Umsetzung | Logik (`tests/etappe3.test.cjs`) | Browser (`tests/etappe3-browser.cjs`, 390/1440 × 2D/3D) |
|---|---|---|---|
| W13 Café | Rosas Brief → Teehaus antippen → Bau (1500 G, 20 Holz, 10 Stein) → zwei Nächte → Timos Brief → Café mit Innenraum | grün: Kosten genau, kein Doppelbau, Brief einmal, Dorfwege und Bewohnerpläne weiter erreichbar | `cafe`: Klick auf Teehaus, Bau, Reload ohne zweites Bezahlen, zwei Nächte, Außenansicht, Tür |
| W14 Ausrichtung | Nur Café. Keine Auswahl für Bäckerei oder Blumenladen | – (bewusst nichts gebaut) | – |
| W15 Angebot | Waren aus dem Rucksack in die Vitrine (nur Essbares, nicht mehr als vorhanden), zurücknehmen möglich. Öffnung 9–13 oder 14–18 Uhr, einmal am Tag. Gäste kaufen aus der Vitrine; Geld genau einmal; Tagesabrechnung am Morgen | grün: Vorräte wandern, Geld = Summe der Verkäufe, Reload zahlt nicht doppelt, Abrechnung stimmt und kommt einmal | `cafe`: Vitrine füllen, öffnen, zwei Gäste bedienen, Reload, zweiter Tipp ohne Geld, Bilanz im Menü, Abrechnungsbrief mit Summe |
| W15 Arbitrage | Café-Preis höchstens × 1,69 des Verkaufswerts | grün: für jede kaufbare Ware unter dem billigsten Ladenpreis (Lin, Mei, Tierhof …), Rezepte unter Zutatenkosten, Bestellungen unter Einkauf | – |
| W16 Freischaltungen | ab 3 Gästen Lichterkette und dritte Pflanze, ab 6 dritter Tisch und Gast, ab 10 Rezept Mondkuchen | grün: jede Stufe einmal, Raum ändert sich, alle Sitze erreichbar | `cafe`: nach drei Gästen Lichterkette und Pflanze im Raum |
| W17 Bestellungen | Brief eines Bewohners, Ware aus Vorlieben und machbar (Rezept bekannt, Zutaten erreichbar, ohne Kuh keine Milchgerichte), Frist drei Tage, Abgabe an der Theke, Lohn einmal, verpasst ohne Strafe | grün | `cafe`: Rosas Bestellung abgeben, Geld genau einmal, Knopf danach weg |
| W18 Ziege | Flocke (Tierhof, einmal kaufbar) nascht höchstens jeden zweiten Tag zwischen 9 und 11 Uhr eine reife Pflanze am Feldrand, die nachwächst. Vorher steht sie sichtbar kauend daneben. Gegenmaßnahmen: Heu am Morgen, Wegschicken, Leckstein (dauerhaft). Paulas Tipp-Brief einmal | grün: nur eine Pflanze, nachwachsen, Heu, Wegschicken, Leckstein sechs Tage Ruhe, Regen/kein Rand ohne Diebstahl | `ziege`: Heu per Dialog, Reload, Tomate bleibt; ohne Gegenmaßnahme genau eine Tomate weg und nachwachsend; Wegschicken; Tagebuch „Genascht 1 · verhindert 1“ |
| W19 Katze | Minka per Brief von Paula. Streicheln und Fisch je einmal am Tag. Ab 3 Herzen nach Streicheln am Vortag höchstens jeden zweiten Morgen ein Fundstück der Jahreszeit vor der Haustür, ab 6 Herzen jedes dritte Mal Karpfen. Schläft mittags in der Sonne | grün | `katze`: Streicheln per Klick, Reload, kein zweites Herz, Sonnenschlaf, Nacht, Geschenk vor der Tür einsammeln, Reload ohne zweites Geschenk |
| W20 Hund | Ab 4 Herzen wittert ein Pudel alle drei Tage eine Spur (Ausrufezeichen). „Der Spur folgen“ legt Pfotenabdrücke zur Grabstelle. Vier feste Verstecke, jedes genau einmal | grün: Verstecke auf Wiese und erreichbar, Belohnung einmal auch nach Reload, nächstes Versteck anders | `hund`: Pudel antippen, Spur folgen, Reload, Spur sichtbar, graben, Geld und Amethyst einmal |
| W21 Teich | Bau am Schild (600 G, 12 Stein, eine Nacht) → 4×3 Wasser, Entenhaus, Futterstelle, zwei Enten. Futter täglich; gefüttert legen sie Eier, hungrig nicht | grün: Kacheln Wasser, alle bisher erreichbaren Kacheln und Ausgänge bleiben erreichbar, Enten im Wasser | `teich`: Bau, Reload ohne zweites Bezahlen, Nacht, Wasser am Bildschirm, zwei schwimmende Enten, Füttern, Ente streicheln |
| W22 Zucht | Enten tragen zwei Farbanlagen (Wildfarben vor Weiß vor Sonnengelb). Ab 3 Herzen bei Ente und Erpel und Futter höchstens alle vier Tage ein Küken (bis acht Enten). Eltern, Anlagen, Schlupftag gespeichert, Brief je Küken, Tagebuch | grün: jede Anlage stammt von Mutter bzw. Vater, Phänotyp passt, gleiche Lage ergibt gleiches Ergebnis | `teich`: Küken schlüpft, Eltern Emma × Ede, Anlagen gültig, Tagebuch, Reload unverändert |
| W23 Rettung | Henks Brief „Korb am Fluss“ → Kätzchen im Wald → drei Pflegetage am Korb am Haus (Milch, Ei oder Fisch, einmal am Tag) → Adoption (Pip bleibt) oder Vermittlung zu Mei (Dankesbrief mit Beilage, einmal) | grün: beide Abschlüsse, Ziele erreichbar, Beilage einmal | `rettung`: Korb im Wald, Pflege mit Reload, kein zweites Füttern am selben Tag, drei Tage, Adoption, Pip auf dem Hof, Reload |
| Nebenaufgabe René | `R.storyPending`: Steht eine Szene an (Klärung des Missverständnisses, Verabredung, Jahrestag, Janinas Geburtstag), kuschelt René nicht von sich aus | grün (rot gegen `9658784`) | `rene`: zehn Spielminuten mit 12-facher Zeit ohne Kuscheln, dann Tipp → Klärung |

## Technische Pflichten
- **Speichern und Migration:** Alte Spielstände ohne `tiere`/`cafe` behalten Geld, Inventar, Haus, Post, Hunde und Hühner. Kaputte Felder werden ersetzt, unbekannte Vitrinenwaren verworfen (Test „Migration“).
- **Keine doppelte Belohnung:** Jede Belohnung hat einen Vermerk (`sales` je Gast, `orders[].st`, `hund.found`, Katzengeschenk als einmaliger Fund, `rettung.st`, `unlock`, `sent`). Logik- und Browsertests prüfen Reload, zweiten Tipp und Tageswechsel.
- **Wege:** Tiere sind Darsteller und blockieren keine Kachel. Der Teich verändert nur Kacheln, die vorher nicht auf einem Weg lagen (Test: alle zuvor erreichbaren Kacheln außerhalb des Teichs bleiben erreichbar).
- **Tipp-Vorrang:** Tiere stehen in `tapAt` hinter Gegenständen, Feld und Funden; in 3D zählt der Strahl. `tests/tipp-vorrang.cjs` ist grün (36 Fälle), `tests/picking.cjs` ebenfalls.
- **Serviceworker:** `jm-tiere.js`, `jm-cafe.js`, `jm-art3.js` im Precache, Cache `janinas-moon-etappe3-1`. `tests/offline.cjs` prüft die drei Module, die Migration und den Café-Raum offline.
- **run-all.cjs:** neu sind `etappe3` (Logik), `etappe3-browser` (3600 s) und die Syntaxprüfung der drei Module. Ein kompletter Gesamtlauf wurde **nicht** gemacht (Auftrag).

## Nebenaufgabe Picknickweg
Ursache: Renés Zufallskuscheln oder das Frühstück („Energie +20“) kann vor dem erwarteten Gespräch kommen. `tests/etappe2-browser.cjs` hat jetzt `tapReneFor(text)`: Es klickt einen vorgezogenen Dialog wie eine Spielerin zu Ende und tippt René höchstens viermal erneut an. Im Schlusslauf trat der Fall dreimal auf („René-Tipp ohne erwarteten Text, erneut … Energie +20“) und wurde aufgefangen; alle vier Ansichten grün.
Produktseitig: Ein Tipp auf René zeigt nach dem Frühstück (das bewusst zuerst kommt) die anstehende Klärung bereits vorrangig (`reneTalk` → `JM.Rom.reneTalk`). Das Problem war das **automatische** Kuscheln, das René startet, wenn er zu Janina kommt. Das unterbindet jetzt `R.storyPending` (enger Logiktest rot gegen `9658784`, Browserweg `rene`).

## Nacharbeit ab 33b6fb5: Ursache, Änderung und Abnahmekriterien

Der Ausgangsfehler wurde zusätzlich zum Ansehen der Hermes-Bilder über den echten Café-Browserweg in 1440/3D nachgestellt: Exit 0, aber Theke/Tafel und zweiter Tisch im Szenenzoom abgeschnitten. Ein grüner Funktionstest war hier kein Darstellungsnachweis.

| Befund | Ursache | Änderung / Nachweis |
|---|---|---|
| 1. 3D-Gastraum leer bzw. Möbel abgeschnitten | Die allgemeine Kamera folgt Janina und berücksichtigt beim Näherzoomen nicht die Raumgrenzen. Die Lichterkette lag bei z=2,95 innerhalb der Rückwand; zusätzlich verdeckte eine massive Holzplatte den Inhalt der Vitrine. | **Behoben:** HUD-bewusste feste Gastraumrahmung, auch mit drittem Tisch; Kette vor der Rückwand mit sichtbaren Birnchen, Vitrinenglas transparent und Holz nur als Rahmen. Tafel mit vollständigen statt auf 18 Zeichen gekürzten Warennamen und eingepasster Schrift. Gerahmte Mondbilder, Tischdeckenstreifen und Tassen, tatsächlicher Mondkuchen mit Füllung/Glasur. Grüner echter Café-Weg plus `etappe3-rahmung.cjs`; Bilder `cafe-gaeste-*`, `cafe-bedient-blumen-*`, `cafe-drei-tische-*`. |
| 2. 2D-Randpflanzen mobil abgeschnitten | Zoom skaliert unabhängig von der Raumbreite und dem freien HUD-Bereich. | **Behoben:** Nur im Café wird der Zoom auf volle Raumbreite/-höhe begrenzt und der Gastraum zentriert. Beide Randpflanzen vollständig in `cafe-bedient-blumen-390-2d.png`, alle drei Tische in `cafe-drei-tische-390-2d.png`. |
| 3. Nachbardach dominiert die 3D-Außenansicht | Normaler Blick von Süden liegt hinter dem Nachbarhaus. | **Behoben:** Direkt beim fertigen Café seitlicher Kamerablick von Südost und Rahmung der Fassade. Café und Eingang sichtbar in `cafe-aussen-390-3d.png` und `cafe-aussen-1440-3d.png`; zusätzlicher echter Türeintritt in `cafe-eingang-*`. Kein Haus verschoben. |
| 4. Übrige Tiere / Belege | 2D-Tierbelege waren unnötig weit entfernt; an der Grabstelle verdeckte ein Baum Janina, nach dem Naschen stand sie vor der Ziege. Die automatische Tierannäherung konnte sie beim Küken unter einen Uferbaum stellen. | **Behoben:** Näherer Belegzoom in 2D und mobil in 3D. An Grabstelle und Gemüse steht Janina nach regulärem Gehen seitlich; Enten werden vom freien Nordufer fotografiert, nicht aus den Büschen. Vor Entenbildern kurz auf getrennte Schwimmpositionen warten. Keine Tierposition gesetzt, kein HUD versteckt. Die neuen Bilder aller vier Ansichten wurden kritisch angesehen. Keine zusätzliche Änderung an Tierlogik oder Tiermaßstab nötig. |

Abnahmekriterien: vollständiger Café-Gastraum einschließlich Randpflanzen, Theke, Vitrine, Tagesangebot, sämtlichen freigeschalteten Tischen und Kette zwischen den HUD-Leisten bei 390 und 1440; erkennbare Tiere ohne Anschnitt oder HUD-Überdeckung am jeweiligen Belegziel. Die zusätzliche Rahmungsprobe prüft normalen, nahen und weiten Zoom sowie unveränderte Kartenraster, Weltobjekte, Dekoration und Sitzplatzdefinitionen. Die regulären Logiktests prüfen Wege zu allen Sitzen und Aktionszielen. Neue Details existieren nur im Renderer, ohne Kachelsperren oder zusätzliche Trefferobjekte.

Die Ausgangsbilder aus `/Users/reneklomfas/.hermes/cache/scratch/e3-hermes/` wurden zum Vergleich angesehen, aber nicht als neue Belege ausgegeben. Offline, Regression und Etappe-2-Picknick waren laut übergebenem Hermes-Schlusslauf bereits bei `33b6fb5` grün; diese historischen Ergebnisse werden nicht als neue Läufe dieser Nacharbeit gezählt.

### Ehrlich dokumentierte rote Zwischenläufe

- `rettung` 1440/3D: Die Auswahlsuche begann, während Janina noch zum Korb lief (`idle:false`, noch kein Dialog). Das kurz danach erzeugte Diagnosebild zeigte bereits den regulär geöffneten Adoptionsdialog. Der Test wartet jetzt nach dem echten Tipp ausdrücklich auf den sichtbaren Dialog; keine Änderung der Pflege- oder Adoptionslogik. Rot-Log: `docs/logs/etappe3-feinschliff-rettung-rot-wartezeit.log`.
- `rettung` 390/3D: Zwei Zoomschritte ließen den nach dem Start noch laufenden Pip bis x=383 wandern; die bestehende Sichtbarkeitsprüfung schlug korrekt an. Für Pip bleibt der mobile 3D-Beleg deshalb bei einem Zoomschritt. Die Prüfung wurde nicht abgeschwächt. Rot-Log: `docs/logs/etappe3-feinschliff-rettung-nachlauf.log`.

## Testtabelle (Befehl → Exit)
Für die Browserbefehle gesetzt: `PLAYWRIGHT_PATH=/Users/reneklomfas/.npm/_npx/fd3bca3c548369c0/node_modules/playwright`, `EVIDENCE_DIR=/Users/reneklomfas/.hermes/profiles/coder/cache/scratch/e3-neu`; Node ist `/Users/reneklomfas/.hermes/node/bin/node`. Lokaler Server: `/opt/homebrew/bin/python3 -m http.server 8765 --bind 127.0.0.1`. Lange Läufe mit `caffeinate -i`. Alle aufgeführten Testbefehle liefen nacheinander, nie gleichzeitig; kein `run-all`.

| Befehl | Exit | Ergebnis / dauerhaftes Protokoll |
|---|---:|---|
| `VIEWPORT=1440 GFX=3d node tests/etappe3-browser.cjs cafe` vor dem Fix | 0 | Fehler trotz funktionalem Grün visuell reproduziert; Ausgangsbeleg angesehen |
| `node tests/etappe3-rahmung.cjs` | 0 | 390/1440 × 2D/3D, je normal/nah/weit; drei Tische, Tür per Bildschirmklick, Raster/Objekte/Deko/Sitze unverändert; `logs/etappe3-feinschliff-rahmung.log` |
| `node tests/etappe3-browser.cjs cafe` | 0 | vier Ansichten; `logs/etappe3-feinschliff-cafe.log` |
| `GFX=3d node tests/etappe3-browser.cjs cafe` | 0 | beide 3D-Ansichten nach transparenter Vitrine und seitlicher Außenkamera; `logs/etappe3-feinschliff-cafe-3d-nachlauf.log` |
| `node tests/etappe3-browser.cjs katze` | 0 | vier Ansichten; `logs/etappe3-feinschliff-katze.log` |
| `node tests/etappe3-browser.cjs hund` | 0 | vier Ansichten, letzter Belegstand vor dem Baum; `logs/etappe3-feinschliff-hund-schlusslauf.log` |
| `node tests/etappe3-browser.cjs ziege` | 0 | vier Ansichten, seitliche Belegposition; `logs/etappe3-feinschliff-ziege-nachlauf.log` |
| `node tests/etappe3-browser.cjs teich` | 0 | vier Ansichten, freies Nordufer; `logs/etappe3-feinschliff-teich-nachlauf.log` |
| `node tests/etappe3-browser.cjs rettung` | 0 | vier Ansichten nach den zwei dokumentierten roten Vorläufen; `logs/etappe3-feinschliff-rettung-schlusslauf.log` |
| `node tests/etappe3-browser.cjs rene` | 0 | vier Ansichten; `logs/etappe3-feinschliff-rene-schlusslauf.log` |
| `node --test tests/*.test.cjs` | 0 | 72 Tests bestanden, 0 Fehler/übersprungen; `logs/etappe3-feinschliff-logik.log` |
| `node tests/tipp-vorrang.cjs` | 0 | alle 36 Fälle grün; `logs/etappe3-feinschliff-tipp-vorrang.log` |
| `node tests/picking.cjs` | 0 | 390 und 1440, Socke/Sammelfunde/Bauholz, Tierüberlappung, Feld und Doppeltipp grün; `logs/etappe3-feinschliff-picking.log` |
| je Datei `node --check <Datei>` | 0 | 55 JS-/CJS-Dateien (Spielmodule, Serviceworker, sämtliche Testdateien), keine Syntaxfehler; `logs/etappe3-feinschliff-qualitaet.json` |
| `git diff --check` und Beleg-/Manifestprüfung | 0 | keine Whitespacefehler; alle 64 SHA-256 stimmen, keine doppelten/fehlenden Belege; 28 eindeutige grüne Browserfälle; `logs/etappe3-feinschliff-qualitaet.json` |

Die zusammengeführte Schlussmatrix ist `logs/etappe3-feinschliff-matrix.json`: 7 Segmente × 4 Ansichten, alle ohne Seitenfehler. Keine separate Typprüfung, kein Lint- oder Buildskript im Vanilla-JS-Projekt vorhanden; Syntaxprüfung, Logik und echte lokale Browserwege sind die ausgeführten Qualitätsnachweise. Eigene Test- und Prüfprozesse sind beendet; der eigene HTTP-Server wurde gestoppt und Port 8765 anschließend als geschlossen geprüft.

## Angesehene Bilder
64 ausgewählte neue PNG-Belege wurden selbst kritisch angesehen und unverändert unter `docs/belege/etappe3/` abgelegt. Mobile Ansichten als nebeneinanderliegende Bildpaare, Desktopbilder einzeln; kleine Tierdetails bei Bedarf zusätzlich im Ausschnitt. SHA-256 und Bytezahl jedes Originals stehen unter `etappe3Feinschliff.screenshots` in `STADT-BELEG-MANIFEST.json`. Keine alten Hermes-Bilder als neue ausgegeben.

Die Tabelle verlinkt alle 64 Originale, nicht nur Vorschaubilder. `cafe-eingang` und `cafe-drei-tische` stammen aus der ausdrücklich ausgewiesenen Zusatz-Fixture mit bereits fertigem Café, drei Tischen und echtem Mondkuchenbestand. Die übrigen Bilder entstehen auf den regulären getesteten Spielwegen.

| Szene | 390 / 2D | 390 / 3D | 1440 / 2D | 1440 / 3D |
|---|---|---|---|---|
| cafe-aussen | [390/2d](belege/etappe3/cafe-aussen-390-2d.png) | [390/3d](belege/etappe3/cafe-aussen-390-3d.png) | [1440/2d](belege/etappe3/cafe-aussen-1440-2d.png) | [1440/3d](belege/etappe3/cafe-aussen-1440-3d.png) |
| cafe-bedient-blumen | [390/2d](belege/etappe3/cafe-bedient-blumen-390-2d.png) | [390/3d](belege/etappe3/cafe-bedient-blumen-390-3d.png) | [1440/2d](belege/etappe3/cafe-bedient-blumen-1440-2d.png) | [1440/3d](belege/etappe3/cafe-bedient-blumen-1440-3d.png) |
| cafe-drei-tische | [390/2d](belege/etappe3/cafe-drei-tische-390-2d.png) | [390/3d](belege/etappe3/cafe-drei-tische-390-3d.png) | [1440/2d](belege/etappe3/cafe-drei-tische-1440-2d.png) | [1440/3d](belege/etappe3/cafe-drei-tische-1440-3d.png) |
| cafe-eingang | [390/2d](belege/etappe3/cafe-eingang-390-2d.png) | [390/3d](belege/etappe3/cafe-eingang-390-3d.png) | [1440/2d](belege/etappe3/cafe-eingang-1440-2d.png) | [1440/3d](belege/etappe3/cafe-eingang-1440-3d.png) |
| cafe-gaeste | [390/2d](belege/etappe3/cafe-gaeste-390-2d.png) | [390/3d](belege/etappe3/cafe-gaeste-390-3d.png) | [1440/2d](belege/etappe3/cafe-gaeste-1440-2d.png) | [1440/3d](belege/etappe3/cafe-gaeste-1440-3d.png) |
| hund-grabstelle | [390/2d](belege/etappe3/hund-grabstelle-390-2d.png) | [390/3d](belege/etappe3/hund-grabstelle-390-3d.png) | [1440/2d](belege/etappe3/hund-grabstelle-1440-2d.png) | [1440/3d](belege/etappe3/hund-grabstelle-1440-3d.png) |
| hund-spur | [390/2d](belege/etappe3/hund-spur-390-2d.png) | [390/3d](belege/etappe3/hund-spur-390-3d.png) | [1440/2d](belege/etappe3/hund-spur-1440-2d.png) | [1440/3d](belege/etappe3/hund-spur-1440-3d.png) |
| katze-geschenk | [390/2d](belege/etappe3/katze-geschenk-390-2d.png) | [390/3d](belege/etappe3/katze-geschenk-390-3d.png) | [1440/2d](belege/etappe3/katze-geschenk-1440-2d.png) | [1440/3d](belege/etappe3/katze-geschenk-1440-3d.png) |
| katze-sonne | [390/2d](belege/etappe3/katze-sonne-390-2d.png) | [390/3d](belege/etappe3/katze-sonne-390-3d.png) | [1440/2d](belege/etappe3/katze-sonne-1440-2d.png) | [1440/3d](belege/etappe3/katze-sonne-1440-3d.png) |
| rettung-korb | [390/2d](belege/etappe3/rettung-korb-390-2d.png) | [390/3d](belege/etappe3/rettung-korb-390-3d.png) | [1440/2d](belege/etappe3/rettung-korb-1440-2d.png) | [1440/3d](belege/etappe3/rettung-korb-1440-3d.png) |
| rettung-pip | [390/2d](belege/etappe3/rettung-pip-390-2d.png) | [390/3d](belege/etappe3/rettung-pip-390-3d.png) | [1440/2d](belege/etappe3/rettung-pip-1440-2d.png) | [1440/3d](belege/etappe3/rettung-pip-1440-3d.png) |
| teich-enten | [390/2d](belege/etappe3/teich-enten-390-2d.png) | [390/3d](belege/etappe3/teich-enten-390-3d.png) | [1440/2d](belege/etappe3/teich-enten-1440-2d.png) | [1440/3d](belege/etappe3/teich-enten-1440-3d.png) |
| teich-kueken | [390/2d](belege/etappe3/teich-kueken-390-2d.png) | [390/3d](belege/etappe3/teich-kueken-390-3d.png) | [1440/2d](belege/etappe3/teich-kueken-1440-2d.png) | [1440/3d](belege/etappe3/teich-kueken-1440-3d.png) |
| teich-tagebuch | [390/2d](belege/etappe3/teich-tagebuch-390-2d.png) | [390/3d](belege/etappe3/teich-tagebuch-390-3d.png) | [1440/2d](belege/etappe3/teich-tagebuch-1440-2d.png) | [1440/3d](belege/etappe3/teich-tagebuch-1440-3d.png) |
| ziege-gefressen | [390/2d](belege/etappe3/ziege-gefressen-390-2d.png) | [390/3d](belege/etappe3/ziege-gefressen-390-3d.png) | [1440/2d](belege/etappe3/ziege-gefressen-1440-2d.png) | [1440/3d](belege/etappe3/ziege-gefressen-1440-3d.png) |
| ziege-nascht | [390/2d](belege/etappe3/ziege-nascht-390-2d.png) | [390/3d](belege/etappe3/ziege-nascht-390-3d.png) | [1440/2d](belege/etappe3/ziege-nascht-1440-2d.png) | [1440/3d](belege/etappe3/ziege-nascht-1440-3d.png) |

Visueller Befund: Café mit zwei bzw. drei Tischen vollständig, Kette und Pflanzen sichtbar, Ware unter Glas erkennbar, Tafel nicht mehr seitlich gekappt. Außenansicht mit freier Café-Fassade. Katze, Ziege, Enten und Pip mit Bodenkontakt bzw. Schwimmringen; Grabstelle/Janina jetzt vor statt hinter dem Baum, Ziege seitlich neben Janina, Entenbelege vom freien Nordufer. Pip ist bewusst kleiner als die erwachsene Katze; der mobile Beleg verwendet keinen Überzoom. Tagebuchbilder sind auf den Entenabschnitt gescrollt, damit Eltern und Erbanlagen lesbar sind.


## Offene Punkte
- **W14:** Bäckerei, Blumenladen und Tierpension sind nicht gebaut und erscheinen nirgends als Auswahl.
- **W22:** Zucht nur bei Enten. Katze, Ziege und Pudel haben keine Vererbung; die manuell gewählte Pudelfarbe bleibt, wie sie war.
- Kein vollständiger `run-all`-Gesamtlauf (laut Auftrag); gelaufen sind die betroffenen Bestandstests einzeln.
- Die Katze behält ihren Tiermaßstab. Die neuen mobilen Nahbelege zeigen sie deutlicher; es wurde keine Tiergröße oder Spiellogik geändert.
- Café: Gäste kommen nur in den gewählten Stunden. Sie nehmen ihr Lieblingsgericht, sonst ein gemochtes, sonst irgendetwas aus der Vitrine. Bei leerer Vitrine warten sie am Tisch („Ich warte noch ein bisschen“); Ärger oder Abzug gibt es nicht.
- Unabhängige technische Codeprüfung durch separaten Codex-Prozess: keine blockierenden Befunde (siehe `ETAPPE3-FEINSCHLIFF-CODEPRUEFUNG.md`). Persönliche Geräte-/Gestaltungsabnahme durch René bleibt offen.
