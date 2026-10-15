# Hermes-Abnahme – erster Ausbau

## Zwischenstand: technische Nachprüfung grün, unabhängiges Urteil ausstehend

Geprüfte Produktionsbasis: `5d1cf9dbc548b350fa9b83f529f1f54a443a62f0` auf `feat/hofausbau-fundament`. `main` und `gh-pages` beim Remote-Abgleich weiterhin unverändert auf `be89e040bb14a74790dd85ccb8eaf844f43366b8`.

## Selbst nachgeprüft

- Lokale Vorschau neu gestartet, HTTP 200.
- `PLAYWRIGHT_PATH=/Users/reneklomfas/.npm/_npx/fd3bca3c548369c0/node_modules/playwright node tests/run-all.cjs`: im abschließenden Wiederholungslauf alle 19 Befehle mit Exit 0; neun Logiktests, fünf Browser-Prüfprogramme und Syntaxprüfungen. Ausgabe in `GRUEN-TESTS.json` aus dem Elternlauf neu erzeugt.
- `git diff --check`: erfolgreich.
- 390×844 und 1440×900, 2D/3D, Lagerbilanz, Küche, alle Höhlenebenen, regulärer Teichfang, beide Hausausbauten, neue Werkbank, Ladenzeiten, Export und frischer Offline-Start durch die bestehenden Prüfprogramme ausgeführt.
- Zusätzlicher unabhängiger frischer Browser: normalen Startdialog durchgeklickt, Haustür per Bildschirmklick betreten, ohne Teleport oder Testinventar zum Kühlschrank gelaufen und leeren Kühlschrank sowie Herd per Bildschirmklick geöffnet. Fehlende Zutaten und Bezugswege sind sichtbar.
- Tatsächliche Screenshots angesehen: mobiles Mengenpanel, mobiler Teich/Angelplatz und vergrößerter 3D-Hausinnenraum am Rechner.

## Ein beobachteter Testabbruch bleibt dokumentiert

Der erste Gesamtlauf hing nach den Erfolgsmeldungen beider Viewports des Regressionstests offenbar beim Browserabschluss und überschritt dessen 300-Sekunden-Grenze. Exit war `null`, der Runner meldete korrekt Fehlschlag. Danach wurden Regression, Offline und Shops einzeln mit Exit 0 wiederholt; anschließend endete der komplette identische Runner mit allen 19 Befehlen sauber. Keine Produktionsänderung vorgenommen, um den Test grün erscheinen zu lassen. Ursache des einmaligen Abschluss-Hängers ist nicht nachgewiesen.

## Noch offen

Ein frischer Prüfer liest den Diff und führt eigene Gegenproben aus (Auftrag `deleg_72d0208c`). Endabnahme deshalb noch nicht erteilt. Original-Sockenspielstand, echtes iPhone/Safari, Aktualisierung einer bestehenden iOS-PWA und Langzeitbalancing bleiben ungeprüft. Weitere Wunschpakete sind im Rechercheplan offen, nicht durch dieses Fundament erledigt.

Kein Merge, kein Deploy, keine öffentliche Vorschau erzeugt. Lokaler Prüfserver: `http://127.0.0.1:8765/`.
