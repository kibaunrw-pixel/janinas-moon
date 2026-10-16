# Etappe 1b – Tipp-Vorrang, Briefkasten-Ereignisse W61–W65, Dorfbahnhof – Prüfbericht

Branch `feat/stadt-und-wohnraum`, Ausgangsstand `a3e04bd`. `main` und `gh-pages` (`4c4ff4a`) wurden nicht verändert, es gab weder Merge noch Deploy.
Dieser Bericht ist **kein Abnahmeurteil**. Er geht zur unabhängigen Prüfung an Hermes.

## Commits
| Commit | Inhalt |
|---|---|
| `ffe1b34` | (A) Tipp-Vorrang „Gegenstand vor Figur“, René spricht nur eine ruhig stehende Spielerin an |
| `f51b00a` | (B) Ereignisse W61–W65 (`jm-ereignisse.js`), Logik- und Browsertests |
| `5be02f4` | (C) Dorfbahnhof und Bahnhof Lindenstadt mit Gleisen, Bahnsteig, Zug und Gebäude in 2D und 3D |
| dieser Commit | Prüfaufbau-Nachbesserung `ereignisse-browser`, Briefformulierung, Ortsschild-Schrift, Plan, Manifest, Bericht, Logs |

## (A) Gegenstand vor Figur
**Ursache:**
1. 3D: `R3.pick` gab jede Figur zurück, die irgendwo auf dem Strahl lag, auch wenn sie hinter dem Objekt stand. Traf der Strahl einen Gegenstand, prüfte `tapAt` danach zusätzlich `hitActor` per Nähe. Lag der Mittelpunkt des Gegenstands im Nahbereich einer Figur, gewann deshalb die Figur.
2. 2D: Die Trefferfläche von `hitActor` war deutlich größer als das Sprite (±0,75 Kacheln, bis 1,2 Kacheln unter die Füße). Außerdem lief die Figurenprüfung vor der Gegenstandsprüfung, nur Herd und Kühlschrank waren als Sonderfall vorgezogen. Beim Beet verhinderte `!hitActor` im Zeigerereignis den Feldmodus.
3. René startete das Kuscheln auch dann, wenn die Spielerin unterwegs war oder gerade eine Aktion vorgemerkt hatte. Geprüft wurde nur `P.queue`, nicht der Laufweg.

**Änderung** (`jm-game.js`, `jm-3d.js`):
- 3D: Es entscheidet, was der Strahl zuerst trifft. Eine Figur gewinnt nur, wenn ihr Modell vor dem Gegenstand getroffen wird. Die Spielfigur selbst ist nie ein Ziel. Die Nähe-Prüfung entfällt. Liegt unter einer getroffenen Figur ein Beet oder ein Fund, gewinnt der Boden. Bei breiten Objekten zählt die getroffene Kachel.
- 2D: Reihenfolge Funde → Gegenstand oder Fels unter dem Finger → Beet → Figur. Die Trefferfläche einer Figur entspricht jetzt dem gezeichneten Sprite.
- Ladentheke: Ist die Ladenfigur noch unbekannt, stellt sie sich zuerst vor, so wie bei einem Tipp auf die Figur.
- René beginnt ein Kuscheln nur, wenn es keinen Laufweg, keine vorgemerkte Aktion und keine Feldreihe gibt, kein Finger gehalten wird und seit mindestens 2 s nicht getippt wurde. Läuft die Spielerin los, bricht er den Anlauf ab.

**Rot/Grün:** `tests/tipp-vorrang.cjs` deckt acht Fälle in vier Ansichten ab, dazu Fehlerfreiheit und rAF-Zähler.
- Gegen archiviertes `a3e04bd` (Port 8766, unveränderte Testdatei) **Exit 1**, 18 von 36 Fällen rot. Briefkasten, Versandkiste und Beet waren in allen vier Ansichten rot, Möbel in 2D, „René unterbricht Laufweg“ in allen vier. Log: `docs/ROT-TIPPVORRANG-a3e04bd.log`.
- Danach **Exit 0** mit 36 von 36 Fällen: `docs/logs/a-tipp-vorrang-gruen.log`, im Abschlusslauf `docs/logs/abschluss-tipp-vorrang.log`.
- Gegenproben bleiben grün: Tipp auf René selbst führt zum Gespräch, Tipp auf den Hund selbst öffnet den Hundedialog. Steht die Spielerin ruhig, kuschelt René weiterhin. Funde vor Tieren behalten Vorrang (`picking.cjs`).
- Ein Zwischenstand, in dem kleine Gegenstände immer gewannen, ließ `desktop-rest` (Rosa vor dem Marktstand) rot werden (`docs/logs/a-desktop-rest-rot-vorregel.log`). Deshalb gilt jetzt die Strahlreihenfolge.
- Die Harness-Umwege für dieses Problem in `briefe-browser`, `desktop-rest` und `riesenpflanzen-browser` habe ich **nicht** entfernt. Sie schaden nicht und sind weiter grün. Vereinfachen kann man sie später.

## (B) Briefkasten-Ereignisse W61–W65 (`jm-ereignisse.js`)
Alle fünf Ereignisse laufen über das bestehende Postsystem (`s.post.m`, `X.START`, `X.target`). Sie beginnen erst, wenn die drei alten Missionen abgeschlossen sind, und nur, wenn ihre Eignung erfüllt ist (Mieter vorhanden, freier Bauplatz, Elva wohnt). Es läuft immer nur eine Mission gleichzeitig. Jede Belohnung trägt einen gespeicherten Vermerk.

| Ereignis | Weg | Abschluss und Lohn (genau einmal) |
|---|---|---|
| W61 Mieter verschwunden | Brief von Rosa → Zettel an der Haustür in Lindenstadt → Dorfbahnhof (Koffer, Mieter 6–22 Uhr) → Gespräch | Mieter kehrt zurück, 150 G + 2 Tee. Der **Mietvertrag bleibt bestehen, die Miete läuft weiter** |
| W62 Haus zu verkaufen | Brief → Ruine auf dem freien Bauplatz | Kauf 900 G: derselbe Bauplatz wird bezugsfertig (kein zweiter Hauszähler), danach normale Mietanfrage. Ablehnen ist möglich. Wird der Platz anderweitig bebaut, endet das Ereignis ohne Kosten |
| W63 Fremder will die Villa | Brief von Herrn Falk → Stadtbrunnen 9–20 Uhr | Entscheidung: Elva bleibt (+150 Freundschaft, Dankesbrief mit Mondstein) oder Zimmer bei Lin (250 G). Haus Nr. 7 bleibt in jedem Fall Elvas Zuhause |
| W64 Geheime Tür | Brief von Henk → Steintür im Nordwesten des Mondwalds → neue Karte `waldtuer` | Truhe: 200 G + 2 Mondquarz. Die Steintafel kündigt den Vollmondwald an. Die Tür bleibt offen, Rückweg über den Ausgang |
| W65 Mysteriöser Bewohner | Brief → Jonas mit Tagesplan (Bahnhof 7–11, Dorfbrunnen 11–16, Stadtplatz 16–21 Uhr) | Nach Treffen an allen drei Orten: Er ist Hedwigs Enkel (Bezug zu W60). 250 G + Mondstein; danach bleibt er Bewohner |

- Neue Karte `waldtuer`: `routeTarget` führt sie über die Waldtür, das Wegweiserziel liegt innerhalb der Karte. Der Logiktest prüft alle Ziele aller Stufen auf Erreichbarkeit. Der Browserweg prüft nach jedem Kartenwechsel die Animation und das Fehlen von Fehlern.
- Altspielstände: Ohne neue Felder bleiben Geld, Inventar, Haus, Post und Stadt unverändert. Neue Missionen starten leer, laufende alte Missionen bleiben aktiv (Test „Altspielstand …“).
- Serviceworker: `jm-ereignisse.js` ist im Precache, Cache `janinas-moon-ereignisse-1`. `tests/offline.cjs` prüft das Modul, die acht Missionen und die Gewölbekarte offline (Exit 0).
- **Rot/Grün Logik:** `tests/ereignisse.test.cjs` gegen `a3e04bd`: **Exit 1**, 0 von 10 Tests bestanden (`docs/ROT-EREIGNISSE-a3e04bd.log`). Danach sind alle 43 Logiktests grün (`node --test tests/*.test.cjs` Exit 0).
- **Browser:** `tests/ereignisse-browser.cjs` läuft je Ereignis durch echte Nacht, Briefkasten, Lesen, Weg, Aufgabe, Abschluss und Reload, in 390/1440 × 2D/3D. Es gibt Zeit-Fixtures (ausgewiesen): Villa 10:00, Bewohner 7:30/11:40/16:40.

## (C) Dorfbahnhof (Zusatzauftrag von René)
- Gleise mit Schwellen und Schienen auf Schotter laufen links und rechts weit über den Kartenrand hinaus. Sie sind nicht begehbar, Zeilen 1–2 waren schon vorher gesperrt.
- Erhöhter Bahnsteig mit heller Sicherheitslinie. Der Zug aus Lok und Wagen hat Räder und Fenster und steht auf den Schienen.
- Bahnhofsgebäude mit Ziegeldach, Uhrtürmchen und Schild „Dorfbahnhof“; in Lindenstadt dasselbe Gebäude mit „Lindenstadt“. Fahrplantafel statt Anschlagtafel, dazu Ortsschild, Bank, zwei Laternen, Blumenkübel und Gepäckwagen.
- Spiellogik: Zug, Fahrplantafel (11,8), Gebäude und Ausgang (0,9) funktionieren wie bisher. `stadt.test.cjs` und `stadt-browser.cjs` sind grün. Rendercache: Die 3D-Welt wird bei jedem Kartenwechsel neu gebaut, der 2D-Bodencache ist an die Karten-ID gebunden, Objekt-Sprites liegen pro Art im Cache. Einen neuen Schlüssel brauchte es nicht.
- `tests/bahnhof-browser.cjs` mit echten Klicks in vier Ansichten: Exit 0.

## Testtabelle (Befehl → Exit)
Abschlusslauf gegen den Schnappschuss `5be02f4` (Port 8765), Logs `docs/logs/abschluss-*.log`:

| Befehl | Exit |
|---|---|
| `node tests/tipp-vorrang.cjs` (alt `a3e04bd`) | **1** (rot, erwartet) |
| `node tests/tipp-vorrang.cjs` | 0 |
| `node tests/picking.cjs` | 0 |
| `node tests/regression.cjs` | 0 |
| `node tests/browser.cjs` | 0 |
| `node tests/desktop-rest.cjs` | 0 |
| `node tests/versand-browser.cjs` | 0 |
| `node tests/riesenpflanzen-browser.cjs` | 0 |
| `node tests/offline.cjs` | 0 |
| `node tests/bahnhof-browser.cjs` | 0 |
| `node tests/stadt-browser.cjs` | 0 (686 s) |
| `node --test tests/*.test.cjs` (43 Tests) | 0 |
| `node --test tests/ereignisse.test.cjs` (alt `a3e04bd`) | **1** (rot, erwartet) |
| `node tests/ereignisse-browser.cjs villa` / `tuer` / `bewohner` | 0 / 0 / 0 |
| `node tests/ereignisse-browser.cjs verkauf` | erster Lauf 1 (Prüfaufbau: 390/3D „kein sichtbarer freier Boden nahe 4,8“), nach Harness-Ergänzung 0 |
| `node tests/ereignisse-browser.cjs vermisst` | 390/2D, 390/3D, 1440/2D OK; 1440/3D zweimal Harness-Fehler („kein sichtbarer Boden“); nach Ergänzung `stepToward` Einzellauf `VIEWPORT=1440 GFX=3d` Exit 0. **Kein zusammenhängender Vier-Ansichten-Lauf mit dem endgültigen Harness** |
| `node tests/briefe-browser.cjs schatz` | 390/2D, 390/3D, 1440/2D OK; 1440/3D **Exit 1** („kein sichtbarer freier Boden nahe 13,12“, lief parallel zu einem zweiten Browserlauf; `docs/logs/abschluss-briefe-schatz-rot-parallel.log`). Einzeln wiederholt (`VIEWPORT=1440 GFX=3d`, gleicher Produktcode, nur Diagnoseausgabe ergänzt): OK. Ursache nicht belegt, Verdacht Lastspitze durch Parallellauf |
| `node tests/briefe-browser.cjs haus7` / `brunnen` | siehe Nachtrag unten |

Ein kompletter `run-all`-Lauf wurde wie vereinbart **nicht** gemacht. Neue Einträge in `run-all.cjs`: `tipp-vorrang`, `ereignisse` (Logik), `ereignisse-browser` (4000 s), `bahnhof-browser`, `jm-ereignisse.js` (Syntax).

Nach dem Schnappschuss `5be02f4` habe ich nur noch Folgendes geändert: eine Briefformulierung in `jm-ereignisse.js` („Die Miete kommt trotzdem jeden Morgen …“, Tests prüfen nur `/Miete/`), die Schriftgröße des 2D-Ortsschilds in `jm-art.js` (7 → 6 px), dazu Harness, Plan und Doku. Diese Änderungen sind nicht erneut im Browser gelaufen, nur in den Logiktests (Exit 0).

## Angesehene Bilder
18 Bilder mit SHA-256 in `docs/STADT-BELEG-MANIFEST.json` → `etappe1b`: Tipp-Vorrang (Briefkasten 3D mobil, Bett 2D), alle fünf Ereignisse (Brief, Zettel, Wiedersehen am Bahnhof, gekauftes Haus, Falk am Brunnen und Entscheidung, Waldtür 2D/3D, Gewölbe 2D/3D, Jonas' Geheimnis) sowie Dorfbahnhof 2D/3D mobil und am Rechner und Bahnhof Lindenstadt 3D.

## Offene Punkte
- Unabhängiger Gesamtlauf (`node tests/run-all.cjs`) durch Hermes.
- `ereignisse-browser vermisst` einmal vollständig in allen vier Ansichten mit dem endgültigen Harness.
- Der Ausgang von `briefe-browser` stand bei Berichtsende noch aus.
- Ortsschild 2D: Nach der Verkleinerung der Schrift gibt es kein neues Bild.
- Romantik, Café, Tiere und der Vollmondwald selbst sind nicht gebaut; die Waldtür ist nur die Vorkammer.
- Balancing der neuen Belohnungen (150/250/200/250 G, Kaufpreis 900 G) ist ungeprüft.
- Physisches iPhone, Bildschirmtastatur und Update einer installierten PWA sind ungeprüft.
