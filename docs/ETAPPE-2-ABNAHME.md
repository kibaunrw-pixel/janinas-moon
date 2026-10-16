# Etappe 2 – Lebendiges Dorf und Romantik – Prüfbericht

Branch `feat/stadt-und-wohnraum`, Ausgangsstand `2690fda`. `main` und `gh-pages` (`4c4ff4a`) habe ich nicht angefasst. Es gab weder Merge noch Deploy.
Dieser Bericht ist **kein Abnahmeurteil**. Er geht zur unabhängigen Prüfung an Hermes.

## Commits
| Commit | Inhalt |
|---|---|
| `9d9535c` | Module `jm-dorf.js` und `jm-romantik.js`, Anbindung in `jm-game.js`, Szenenobjekte 2D/3D, Cache `etappe2-1`, Logiktest rot→grün |
| `39d6b2c` | Browserweg je Pflichtpunkt; Picknickplatz und Herzbank aus dem Gewächshaus verlegt; Vorrangregeln für laufende Geschichten |
| `2e1be04` | Szenenaufstellung, Prüfaufbau für 3D und Desktop, `offline.cjs` erweitert, Wegdiagnose in `stadt-browser.cjs` |
| dieser Commit | Dialogknöpfe umbrechen, Plan mit Status je W-Nummer, Bericht, Belegbilder, Logs |

## Aufbau
- **`jm-dorf.js`** (Logik, ohne DOM): Geheimnisse (W01), Beziehungen (W02), Tratsch (W04), Mei und Timo (W06), Bewohnergeburtstage (W38). Zustand `s.dorf`.
- **`jm-romantik.js`** (Logik, ohne DOM): Picknick (W25), Missverständnis (W26), Briefe (W28), Ausflug (W30), Jahrestag (W31), Janinas Geburtstag (W38). Zustand `s.rom`.
- Beide hängen sich wie `jm-ereignisse.js` an bestehende Stellen: Migration, `Post.night` (Briefe), `Post.apply` (Kartenobjekte), `Stadt.location` (Aufenthaltsorte), `Post.target` (Wegweiser), `Post.evAct` (Weltobjekte).
- **`jm-game.js`** zeigt nur an: Gesprächsvorrang in `talk()` und `reneTalk()`, Tratsch und neue Zeilen, Geburtstagsantwort beim Schenken, René-Tagesplan während einer Verabredung (dann kein Kuscheln), Tagebuch-Reiter „Herz“, Kalendermarken, Antwortknöpfe im Brief, Auswahl in Szenen, Herzchen und Funkeln (2D und 3D über dieselbe Partikelliste), Szenenaufstellung.
- **`jm-art.js` / `jm-3d.js`**: Picknickdecke mit Korb, Thermoskanne und Erdbeerteller; Bistrotisch mit Stühlen und Kerze; Geburtstagstisch mit Kuchen und Päckchen; Herzbank; Küchentisch mit Kerzen und Rose. In 3D brennt am Kerzentisch drinnen ein warmes Punktlicht.
- Neue Karten-IDs gibt es **nicht**. Alle Ziele liegen auf `farm`, `forest`, `village`, `stadt` und `haus`, die `routeTarget` schon kennt. Der Logiktest prüft jedes neue Ziel auf Erreichbarkeit.

## Pflichtpunkte
| Punkt | Umsetzung | Logik | Browser (390/1440 × 2D/3D) |
|---|---|---|---|
| W01 Geheimnisse | Mei (Fernweh), Henk (kann nicht schwimmen, Hedwig), Paula (Lied), Rosa (Chronik). Je 3 Teile ab 2/4/6 Herzen, ein Teil pro Tag, Lohn einmal. Tagebuch zeigt Teile und nächste Bedingung | grün | `geheimnis`: Henk, Reload nach Teil 1, Tagebuch, Teile 2 und 3, kein zweiter Lohn nach Reload |
| W02 Beziehungen | Freundschaft Rosa–Henk (Szene nach Henks Geheimnis), Streit Lin–Paula (Zettel überbringen, Entscheidung „jetzt“ oder „Zeit lassen“), Verliebtheit Mei–Timo. Danach andere Gespräche, mittwochs stehen Lin und Paula zusammen auf dem Dorfplatz | grün | `streit`: Lin → Paula → Reload → Lin mit Auswahl → versöhnt, Tagebuch |
| W04 Tratsch | 15 Meldungen, jede an eine Prüfung des Spielstands gebunden. Nie von Beteiligten, jede einmal, ein beigelegter Streit wird nicht mehr erzählt | grün (jede Meldung einzeln: ohne Ereignis keine Meldung) | `streit`: Rosa erzählt „Lin und Paula vertragen sich wieder“ |
| W06 Verkuppeln | Hinweis bei Mei → Timo (Brief und Holzvogel oder „trau dich“) → Mei wählt Ort (Brunnen/Ufer), heute oder morgen um 18 Uhr → Treffen, Entscheidung → Paar. Verpasst: neu verabreden. Danach abends zusammen am Treffpunkt, neue Gespräche. Das Treffen hat Vorrang vor dem Abendessen bei Lin | grün | `paar`: alle Schritte, Kalender, Treffen 18 Uhr, Entscheidung, Orte, Reload |
| W25 Picknick | Einladung per Brief (ab Tag 4) oder im Tagebuch. Ort Waldsee oder Wiese am Teich, 12 oder 17 Uhr. Decke mit Korb liegt den ganzen Tag dort, René wartet ab 30 Minuten vorher. Szene mit Auswahl, Erinnerung, Kalender, Wegweiser | grün | `picknick`: Brief → Antwortknopf → Wald → Szene → Reload vor der Wahl → Wahl → kein zweites Picknick |
| W26 Missverständnis | Am Morgen nach dem ersten Picknick weicht René aus, Timo verplappert sich (oder am nächsten Tag direkt). Auflösung mit Auswahl, Herzbank am Teich, neue Zeilen, Brief | grün | `picknick`: Ausweichen, Auflösung, Bank auf dem Hof, Tipp auf die Bank (+10 Energie einmal am Tag) |
| W28 Briefe | Brief nach jedem Picknick, Ausflug, Jahrestag, Geburtstag und nach der Herzbank, jeweils mit Ort und Wahl; freundlicher Brief nach verpasster Verabredung; Kuschelzettel. Je Erlebnis einmal, höchstens drei Briefe pro Nacht | grün (60 Nächte: immer 1–3 Briefe, eindeutige IDs) | `picknick`: „Nach unserem Picknick“ mit „Wolkenpudel“ |
| W30 Ausflug | Nach dem ersten Picknick: Lindenstadt 17–21 Uhr, Bistrotisch am Stadtbrunnen, Auswahl (Münze, Tisch, Maras Geige nur mit Mara als Mieterin), Erinnerung, Brief | grün | `ausflug`: Tagebuch → Kalender → Zug → Szene → Wahl Geige → Reload |
| W31 Jahrestag | Datum gespeichert (Vorschlag 12. Sommer, im Tagebuch änderbar). Am Tag ab 18 Uhr Kerzen am Küchentisch, René am Tisch. Einmal pro Jahr, auch nach Datumswechsel. Lohn: volle Energie, Erinnerung | grün (auch Jahr 2) | `jahrestag`: Kalender, Kerzen, Brief, Reload ohne zweite Feier, Datum ändern und neu laden |
| W38 Geburtstage | Bewohner: eigene Antwort auf passende Geschenke, Dankesbrief mit Beilage am nächsten Morgen (einmal pro Jahr), Tratsch nennt das Lieblingsgeschenk. Janina: Geburtstagspost mit Beilage, Kuchen und Nudeln von René statt Frühstück, Besuch von Rosa und Mei 10–16 Uhr mit Geschenkkorb | grün | `geburtstag`: Nacht → Post, Kuchen, Beilage, Besuch, Korb, Reload ohne zweiten Korb. `streit`: Paulas Geburtstag mit Milch |

**Janinas Geburtstag:** Im Spiel gab es kein Datum. Eine Abfrage beim Start hätte bestehende Spielstände unterbrochen. Deshalb gilt ein Vorschlag (6. Herbst), der im Tagebuch unter „Herz“ als „Vorschlag, bitte anpassen“ markiert ist. René sollte dort das echte Datum eintragen. Dasselbe gilt für den Jahrestag.

## Technische Pflichten
- **Speichern und Migration:** Alte Spielstände ohne `dorf`/`rom` behalten Geld, Inventar, Haus, Post und Stadt. Kaputte Felder werden ersetzt (Test „Migration“).
- **Keine doppelte Belohnung:** Jede Belohnung trägt einen Vermerk (`paid`, `done`, `jtDone[Jahr]`, `jbDone[Jahr]`, Beilage `taken`). Logik- und Browsertests prüfen Reload, zweiten Tipp und Tageswechsel.
- **Nichts sperrt:** Verabredungen haben ein Zeitfenster. Verpasste Termine verfallen in der Nacht mit einem freundlichen Brief. Missionen aus dem Briefkasten haben beim Wegweiser Vorrang. Szenen laufen als normale Dialoge.
- **René und Tipp-Vorrang:** Während einer Verabredung oder am Jahrestag kuschelt René nicht. Sonst bleibt alles wie in Etappe 1b. `tests/tipp-vorrang.cjs` ist grün.
- **Serviceworker:** `jm-dorf.js` und `jm-romantik.js` im Precache, Cache `janinas-moon-etappe2-1`. `tests/offline.cjs` prüft beide Module und die Migration offline.
- **run-all.cjs:** neu eingetragen sind `etappe2` (Logik), `etappe2-browser` (3600 s) und die Syntaxprüfung beider Module.

## Testtabelle (Befehl → Exit)
Abschlusslauf nacheinander auf Commit `2e1be04` (Port 8765). Die Logs liegen unter `docs/logs/etappe2-*.log`, die Übersicht in `docs/logs/etappe2-abschluss-uebersicht.log`.

| Befehl | Exit |
|---|---|
| `node --test tests/etappe2.test.cjs` gegen `2690fda` | **1** (rot, erwartet: 13 von 13 Tests rot, `docs/ROT-ETAPPE2-2690fda.log`) |
| `node --test` alle zehn Logikdateien (56 Tests) | 0 |
| `node --test tests/ereignisse.test.cjs` | 0 |
| `VIEWPORT=390 GFX=2d node tests/etappe2-browser.cjs` (7 Wege) | 0 (344 s) |
| `VIEWPORT=390 GFX=3d node tests/etappe2-browser.cjs` | 0 (341 s) |
| `VIEWPORT=1440 GFX=2d node tests/etappe2-browser.cjs` | 0 (354 s) |
| `VIEWPORT=1440 GFX=3d node tests/etappe2-browser.cjs` | 0 (368 s) |
| `node tests/tipp-vorrang.cjs` | 0 |
| `node tests/picking.cjs` | 0 |
| `node tests/offline.cjs` | 0 |
| `node tests/briefe-browser.cjs` | 0 (1594 s, alle vier Teile schatz/haus7/brunnen in vier Ansichten) |
| `node tests/stadt-browser.cjs` | 0 (684 s, keine Wegdiagnose ausgelöst) |

Jeder Browserweg prüft am Ende, dass keine Seitenfehler auftraten und die Spielschleife läuft (rAF-Zähler 61–62 pro Sekunde).

**Fixtures (ausgewiesen):** Startort, Tag, Uhrzeit, Herzen und Vorgeschichte werden vor dem Start gesetzt. Zeit-Fixtures setzen nur Uhrzeit oder Tag statt zu warten. Henks Herzereignis bei 5 Herzen gilt als schon gesehen, Timo wird am Nachmittag auf dem Dorfplatz angesprochen. Briefe kommen über echte Nächte. Gespräche, Auswahl, Wege, Zugfahrt, Tagebuch und Briefknöpfe laufen über echte Klicks.

**Nach dem Abschlusslauf geändert:** nur CSS in `index.html` (Antwortknöpfe in Dialogen brechen um, weil im Bild `picknick-szene-390-2d` die längste Antwort am Rand abgeschnitten war). Dazu kommen Plan, Bericht, Belege und Manifest. Für das CSS gibt es kein neues Bild. `briefe-browser` und `stadt-browser` liefen in dieser Zeit und haben die Seite eventuell schon mit dem neuen CSS geladen.

## Nebenaufgabe `stadt-browser.cjs`
Der Produktcode ist unverändert. In `walk()` gibt es jetzt nach einem Zeitlimit eine ausführliche Diagnose (`WEG-DIAGNOSE`): Zielkachel und Begehbarkeit, Objekte um das Ziel, Position, Pfad, Aktion, Warteschlange, Hunde, René, Bewohner, Zeiger und Element unter dem Zeiger, offener Dialog. Steht die Figur ruhig und ist nichts offen, gibt es höchstens zwei neue Versuche, wie bei einer Spielerin, ohne Teleport. Die Ursache des früheren Ausreißers ist **nicht belegt**. Ich vermute, dass ein Hund zwischen Zielwahl und Klick auf das Ziel läuft.

## Angesehene Bilder
19 Bilder mit SHA-256 in `docs/STADT-BELEG-MANIFEST.json` → `etappe2`, Dateien in `docs/belege/etappe2/`: Brief mit Antwortknöpfen, Picknickszene, Decke 2D/3D, Herzbank 2D/3D, Ausflugstisch 2D/3D, Jahrestag 2D/3D mobil und 3D am Rechner, Geburtstagsbesuch 2D und 3D, Mei und Timo 2D und 3D, Henks Geheimnis, Tagebuch mobil und am Rechner. Zwischenstände sind im Manifest markiert.

Befunde aus den Bildern, die ich behoben habe:
- Picknickdecke und Herzbank lagen zuerst im Gewächshausbereich (GLAS 16–21, 24–26). Sie liegen jetzt nördlich des Teichs. Ein Logiktest prüft, dass darunter weder Beet noch Gewächshaus liegt.
- Janina stand im Bild vor René. Szenen stellen sie jetzt an ihren Platz.
- Verabredungsknöpfe waren zu lang. Sie sind jetzt kurz, die Datumsauswahl ist lesbar.
- Lange Dialogantworten werden jetzt umgebrochen (ohne neues Bild, siehe oben).

Offen in den Bildern: Im 3D-Geburtstagsbild ist Rosa am Rand angeschnitten (Kamera folgt der Spielerin). Herzchen sind in den Standbildern nur teilweise zu sehen, weil sie nach etwa einer Sekunde verblassen.

## Offene Punkte
- Unabhängiger Gesamtlauf (`node tests/run-all.cjs`) durch Hermes.
- Optional nicht gebaut: W27 (Überraschungsbesuche, nur der Geburtstagsbesuch existiert), W29 (gemeinsames Haus), W03, W05, ein zweites Dorfpaar.
- Geheimnisse gibt es nur für vier Bewohner. Lin, Timo, Elva, Jonas und die Mieter haben keins.
- Die Bewohnergeburtstage habe ich im Browser nur an Paulas Geburtstag geprüft (Geschenk und Antwort). Den Dankesbrief am nächsten Morgen prüft nur der Logiktest.
- Echte Daten für Janinas Geburtstag und den Jahrestag trägt René im Tagebuch ein.
- Balancing (Belohnungen, Herzgrenzen 2/4/6, Energie +30) ist nicht geprüft.
- Physisches iPhone und das Update einer installierten PWA (neuer Cache) sind nicht geprüft.
