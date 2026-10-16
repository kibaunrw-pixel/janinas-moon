# Briefkasten-Etappe und offene Stadt-Abnahme – Prüfbericht

Zweig `feat/stadt-und-wohnraum`, Ausgang `403c9a9`. Live (`main` = `gh-pages` = `a0a47f5`) unberührt; kein Merge, kein Deploy.
Dies ist **kein Abnahmeurteil**. Übergabe an Hermes zur unabhängigen Prüfung (siehe unten).

## Umgebung
- macOS, Node aus `/opt/homebrew/bin/node`, installierter Chrome (`channel:'chrome'`, headless), Playwright aus `~/.npm/_npx/fd3bca3c548369c0/node_modules/playwright`.
- Prüfserver `python3 -m http.server 8765 --bind 127.0.0.1` im Repo; frische isolierte Playwright-Kontexte, keine persönlichen Profile.
- Einzellogs unter `docs/logs/`, Gesamtlauf in `docs/GRUEN-TESTS.json` (vollständige Ausgaben) und `docs/GESAMTLAUF-ZWISCHENSTAND.json`.

## Produktänderung (einzige)
- `jm-game.js` `setMap`: unbekannte Karten-ID → sicherer Start auf dem Hof (5,8) statt `TypeError` in `enterMine`.
  - Rot vorher: `docs/ROT-KARTEN-FALLBACK-403c9a9.log` (Exit 1, `Cannot read properties of undefined (reading 'cave')`), grün danach: `tests/karten-fallback.cjs` Exit 0.
  - Im normalen Spiel nicht erreichbar (`haus_oben` existiert ab Ausbaustufe 1, Stufen sinken nie); betrifft beschädigte oder von Hand bearbeitete Spielstände, bei denen sonst der Start abbricht.

## Befund stadt-zusatz (früher ROT, `docs/ROT-STADT-ZUSATZ-FIXTURE.log`)
- Mit **identischer Testdatei** weder gegen archiviertes `589240e` (eigener Port 8766, Exit 0) noch gegen den aktuellen Stand reproduzierbar. Alle von der Fixture benutzten IDs (`haus_oben`, `bahnhof`, `stadt`, `i_nudelhaus`) existieren nach `startGame` mit Ausbaustufe 2.
- Ursache des damaligen Rot damit **nicht belegt**; Vermutung (nicht bewiesen): älterer, nicht gesicherter Testaufbau oder veralteter Cache. Der Fehlerpfad selbst (unbekannte ID hält `setMap` an) ist echt und jetzt abgesichert (oben).
- Aktuell: `node tests/stadt-zusatz.cjs` alle vier Ansichten Exit 0 (`docs/logs/z-stadt-zusatz-alle.log`).

## Prüfaufbau-Befunde (keine Produktfehler behauptet)
1. **Hängende Läufe nach „OK“** (auch das frühere „420 s ohne Ende“): per Node-Report und `lsof` belegt – `chrome_crashpad_handler` und `GoogleUpdater` (von Chrome gestartet) erben Chromes stdout/stderr; Playwright wartet in `browser.close()` auf das Schließen dieser Pipes. Alle Browsertests begrenzen das Schließen auf 8 s und beenden sich mit `process.exit()` (Exitcode bleibt). Von Hand beendete Läufe tragen in `docs/logs` `EXIT 143` (schatz 390/2D, schatz 1440/3D, brunnen 1440/3D, brunnen 390/2D, stadt 390/2D, 1440/2D, 1440/3D), obwohl der Weg vorher „OK“ meldete. Maßgeblich ist der Gesamtlauf.
2. **Pudel vor dem Briefkasten** fing den Klick ab (Diagnose: Dialog „B schaut dich mit großen Augen an.“, haus7 390/3D). `briefe-browser.cjs` wartet jetzt, bis weder 3D-Strahl noch Nähe eine Figur am Ziel ergeben.
3. **Hund auf Zielboden** (stadt-browser 1440/2D: „sichtbarer freier Boden nahe 7,8“). Wartet bis 10 s.
4. **René beginnt von sich aus ein Gespräch**, wenn die Spielerin an der Versandkiste steht (desktop-rest, René bei 6.7/9, Spielerin 7/8). Zweimal im Gesamtlauf rot (`docs/ROT-GESAMT-BRIEFE-LAUF1.json`, `...LAUF2.json`). Harness beendet das Gespräch per Tippen auf das Dialogfeld und tippt erneut.
5. **riesenpflanzen-browser** einmal 1440/2D 30-s-Timeout beim Erntetipp (Vorablauf parallel zum Gesamtlauf); dieselbe Absicherung mit Diagnose, Einzellauf Exit 0.

## Ergebnisse Briefkasten (`tests/briefe-browser.cjs`, echte Pointer, keine Teleports)
Ablauf je Weg: Fixture vor der Nacht → echte Nacht im Bett → 1–3 neue Briefe → Weg zum Briefkasten → Zähler/Neu-Abschnitt/ältere Briefe eingeklappt/kein waagrechter Überlauf → Brief lesen → Mission über Bildschirmklicks → Abschluss → Reload → Belohnung nicht erneut. Nach jedem Kartenwechsel wird geprüft, dass die Spielschleife läuft (Animationszeit steigt) und keine Fehler auftreten – bei aktivem Missionsziel (Wegweiser) auf jeder Karte.

| Weg | 390×844 DPR 2 | 1440×900 | Bilanz |
|---|---|---|---|
| Schatzkarte | 2D und 3D Exit 0 | 2D und 3D Exit 0 | 5000 → 5300 G, +3 Kupfererz; falscher Hügel ohne Lohn; zweiter Klick ohne Lohn; nach Reload gleich |
| Haus Nr. 7 | 2D und 3D Exit 0 | 2D und 3D Exit 0 | 5000 − 800 Renovierung + Summe aller Mietquittungen = 4620 G; Doppelklick auf Zusage/Renovierung ohne Doppelwirkung; Elva zieht ein, Gespräch; Reload |
| Mitternacht am Brunnen | 2D und 3D Exit 0 | 2D und 3D Exit 0 | tagsüber nichts; 23:05 Dokument + Geisterbrief; Reparatur −300 G, −15 Stein, −5 Kupfererz; Brunnen füllt Gießkanne; Reload ohne erneute Kosten |
| Grundpost | in allen vier Ansichten (jeder Weg beginnt mit einer echten Nacht und dem Briefkasten) | | |

**Korrektur zu Commit `a214d5b`:** Dort stand „alle zwölf Briefwege einzeln Exit 0“. Das stimmte zu dem Zeitpunkt nicht: vier erste Logs (brunnen 1440/3D, brunnen 390/2D, schatz 390/2D, schatz 1440/3D) meldeten zwar „OK“, endeten aber mit `EXIT 143`, weil ich die nach „OK“ hängenden Prozesse von Hand beendet habe (bei schatz 1440/3D vorher Node-Report zur Diagnose, daher die Zeilen „Node.js report completed“). Diese vier Wege sind mit begrenztem Browser-Schließen einzeln neu gelaufen: alle „OK“ und `EXIT 0` (`docs/logs/b-*-nachlauf.log`, `docs/logs/briefe-nachlauf-summary.log`). Die übrigen acht Einzelwege haben eigene Logs mit `EXIT 0`.

Einzige Zeit-Fixture: Brunnen setzt nach dem Lesen die Uhr auf 23:05. Dabei zeigt die HUD-Uhr im Bild noch 06:30 (Anzeige wird nicht sofort nachgezogen) – Folge der Fixture, kein Spielweg.

## Ergebnisse Stadt
- `tests/stadt-browser.cjs` (Dorf → Bahnhof → Zug → Stadt → Bau → drei echte Nächte → Einzug → Miete → Reload → Heimweg): **390/2D, 390/3D, 1440/2D, 1440/3D** je „OK“, Geld 5000 → 3500 → 3560, Miete zuletzt Spieltag 13 (`docs/logs/s-stadt-*.log`).
- `tests/stadt-zusatz.cjs`: aktive auswärtige Aufgabe (Pudel) auf `haus_oben`, `bahnhof`, `stadt`, `i_nudelhaus`, Animation läuft; drei Häuser/Phasen/Mieter/NPC-Zeiten/Mietbilanz 680 G; alle vier Ansichten Exit 0. Ortswechsel hier per Debug-Fixture (kein Pointerweg).
- `tests/rohstoffweg.cjs`: acht Spieltage echte Holz-/Steinbeschaffung mit Rückwegen, 32 Holz / 20 Stein, Exit 0 (`docs/logs/rohstoffweg-1440-2d.log`).
- `tests/offline.cjs`: frischer isolierter Offline-Tab lädt `jm-ausbau.js`, `jm-stadt.js`, **`jm-post.js`** aus dem Cache, `JM.Post` nutzbar (drei offene Missionen, kein Ziel), Exit 0.

## Gesamtlauf
**Kein grüner Gesamtlauf vorhanden.** `docs/GRUEN-TESTS.json` enthält den roten Lauf 4 (`passed:false`).
- Gesamtlauf 4 (`docs/logs/gesamtlauf4.log`): 58 Befehle Exit 0 (alle Syntaxprüfungen, alle Logiktests einschließlich `briefe.test.cjs`, alle Browserprogramme bis einschließlich `stadt-browser`, `stadt-zusatz`, `karten-fallback`), dann `rohstoffweg.cjs` Exit 1 („kein Weg“, Prüfaufbaufehler, behoben).
- Frühere rote Gesamtläufe gesichert: `docs/ROT-GESAMT-BRIEFE-LAUF1.json` bis `...LAUF4.json` (Ursachen siehe Prüfaufbau-Befunde).
- Nach Hermes-Anweisung kein weiterer kompletter Lauf; nur Nachläufe: `rohstoffweg.cjs` Exit 0 (`docs/logs/rohstoffweg3.log`). `briefe-browser.cjs` (voller Aufruf wie in run-all) erster Versuch Exit 1 (Hund vor dem Briefkasten, `docs/logs/briefe-browser-voll-1-rot.log`), nach Harnessänderung zweiter Versuch siehe „Pause“.
- Produktcode seit `f3ccd41` unverändert (nur `tests/`, `docs/`).

## Angesehene Bilder (Belege, SHA-256 in `docs/STADT-BELEG-MANIFEST.json` → `briefkastenEtappe`)
Alle 17 Bilder wurden vor der Übernahme angesehen; Inhalt je Bild steht im Manifest (`briefkastenEtappe.screenshots[].inhalt`).
- `docs/belege/briefe/`: Briefkasten mobil (Zähler, Neu-Abschnitt, kein Überlauf), Brief „Eine zerknitterte Karte“, drei Erdhügel im Mondwald, Schatzfund 2D/3D (5.300 G), alter Brunnen nachts, reparierter Brunnen 2D/3D (4.700 G), Haus Nr. 7 verfallen/Renovierung/mit Elva in 2D und 3D (4.620 G).
- `docs/belege/stadt-abnahme/`: Fundament, Holzrahmen (3D mobil), drei fertige Häuser mit Mietern, vermietetes Haus mit Mieterin, Zuhause nach Mietnacht (3.560 G).
- Auffällig, kein Fehler belegt: nach Abschluss von Haus Nr. 7 erscheint sofort der nächste „Geheimnisvolle Brief“ als Aufgabe (nächste Mission); Brunnenbild zeigt wegen der Zeit-Fixture noch 06:30.

## Offene Punkte
- **Bedienbefund (offen, nicht behoben):** Das Spiel wählt Figuren per Nähe (`hitActor`) am getroffenen Weltpunkt. Hunde oder René neben einem Objekt (Briefkasten, Versandkiste, Beet) können einen Tipp auf das Objekt abfangen, auch wenn der 3D-Strahl das Objekt trifft. René beginnt zudem von sich aus Gespräche an der Versandkiste. Für Spielerinnen heißt das: Gespräch wegtippen, erneut tippen. Ob das so gewollt ist, entscheidet René.
- 3D am Rechner (1440) zeigt nach dreimal Herauszoomen in manchen Bildern noch sehr nah (z. B. Dachphase), mobil 3D Innenräume sehr klein. Kein Fehler belegt, nur Sichtbeobachtung.
- Ursache des alten stadt-zusatz-Rot nicht belegt (siehe oben).
- Ereignisse W61–W65 (Mieter verschwunden, Haus zu verkaufen, reicher Fremder/Villa, geheime Tür, mysteriöser Bewohner) **nicht gebaut**; Romantik W06/W24 entschieden, **nicht gebaut**.
- Physisches iPhone/Safari, Bildschirmtastatur, Update einer bestehenden installierten PWA, Original-Marktspielstand und Langzeitbalancing (Mieten, Briefgeschenke, Renovierungskosten) ungeprüft.

## Übergabe an Hermes (unabhängige Prüfung)
1. `git fetch && git checkout feat/stadt-und-wohnraum`, Hash mit `git ls-remote origin feat/stadt-und-wohnraum` vergleichen.
2. Server starten (siehe Umgebung), `node tests/run-all.cjs` (Dauer etwa 60–90 Minuten; `docs/GESAMTLAUF-ZWISCHENSTAND.json` zeigt den Fortschritt).
3. Einzelwege gezielt: `VIEWPORT=390 GFX=3d node tests/briefe-browser.cjs haus7` usw.; Bilder unter `~/.hermes/cache/scratch/janinas-moon-briefe/` selbst ansehen.
4. `git diff --check 589240e..HEAD` und `node tests/karten-fallback.cjs` gegen `403c9a9` (rot) und HEAD (grün).

## Pause (16.10.2026, auf Anweisung wegen Verbindungsverlust)
- **Letzter Befehl:** `node tests/briefe-browser.cjs` (alle zwölf Wege in einem Aufruf), nach 7 von 12 Wegen **von mir abgebrochen** (keine Exit-Angabe gültig). Bis dahin OK: schatz 390/2D, 390/3D, 1440/2D, 1440/3D; haus7 390/2D, 390/3D, 1440/2D. Kein Abfangfall im Log. Log: `docs/logs/briefe-browser-voll-2-abgebrochen.log`.
- **Offen:** voller `briefe-browser`-Aufruf bis Exit 0 (fehlend: haus7 1440/3D, brunnen alle vier); danach `docs/GRUEN-TESTS.json` mit `passed:true` nur durch den unabhängigen Abschlusslauf (`node tests/run-all.cjs`).
- **Nächste Schritte:** 1. Server starten, `node tests/briefe-browser.cjs` einmal voll laufen lassen (ca. 45 Min., im Hintergrund mit Log). 2. Bei Grün: unabhängiger Gesamtlauf durch Hermes. 3. Bedienbefund (Figuren fangen Tipps per Nähe ab) René zur Entscheidung vorlegen.
