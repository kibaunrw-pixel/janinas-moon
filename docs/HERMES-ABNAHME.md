# Hermes-Abnahme – erster Ausbau

## Urteil: erstes Ausbaupaket technisch abgenommen, nicht veröffentlicht

Geprüfte Produktionsbasis: `5d1cf9dbc548b350fa9b83f529f1f54a443a62f0`, anschließend enger Sammelfund-Fix `f97ce3f1ee0ec0bf99e6adb610a49f41c79d95ec` auf `feat/hofausbau-fundament`. `main` und `gh-pages` beim Remote-Abgleich weiterhin unverändert auf `be89e040bb14a74790dd85ccb8eaf844f43366b8`. Das Urteil gilt für das definierte erste Paket im geprüften Chrome-/Vorschauumfang, nicht für die gesamte Wunschliste oder ungeprüfte iOS-Hardware.

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

Die unabhängige Prüfung (`deleg_72d0208c`) fand einen P2: normale `S.forage`-Funde wurden trotz korrektem 3D-Treffer vom überlappenden Hund abgefangen. Der bisherige Sockentest deckte nur `S.mess` ab. Parent erweiterte zuerst `tests/picking.cjs` um Pilz und Bauholz unter Hunden; vor dem Fix Exit 1 mit `pilz: Fund darf keinen Hundedialog öffnen`, `true !== false`. Anschließend wurde ausschließlich der bestehende Sammelfund-Block in `tapAt()` vor die Figurenprüfung verschoben. Derselbe Test wurde in beiden Viewports grün, danach nochmals der gesamte 19-Befehle-Lauf einschließlich aller Browserprüfungen. Die unabhängige Gegenprobe des engen Fixes (`deleg_c5c4ac61`) wurde unverändert mobil und am Rechner ausgeführt: korrekter Sammel-Raycaster-Treffer, genau ein Pilz im Inventar, Fund entfernt, kein Hundedialog; nach weiteren 1,5 Sekunden weiterhin korrekt. Beide Prozesse Exit 0. Der P2 ist damit behoben. Bauholz ist im erweiterten Elternlauf geprüft; die unabhängige Gegenprobe betraf ausdrücklich den separaten Pilzfall. Als wiederverwendbare Prüflehre wurde im Skill `canvas-game-regression` festgehalten, jeden getrennten Sammeldatenpfad bis zur tatsächlichen Aktion zu prüfen.

Original-Sockenspielstand, echtes iPhone/Safari, Aktualisierung einer bestehenden iOS-PWA und Langzeitbalancing bleiben ungeprüft. Weitere Wunschpakete sind im Rechercheplan offen, nicht durch dieses Fundament erledigt.

Kein Merge, kein Deploy, keine öffentliche Vorschau erzeugt. Lokaler Prüfserver: `http://127.0.0.1:8765/`.

## Offener Befund 15.10.2026 – Höhlen-Softlock nicht erklärt

René meldete am Abend: „stecke in der hoelle feste kann nichts mehr machen“. Nachfrage: **Menüs (Tagebuch/Rucksack) reagierten weiter.** Der zuvor als sicher benannte Umweg Tagebuch → Karte → Dein Hof half in **seinem** Spielstand **nicht**; im isolierten Prüfstand reiste derselbe Weg dagegen korrekt (Map `hoehle5` → `farm`, Inventar und Geld unverändert, keine Konsolenfehler). Es handelte sich also nicht um den getesteten Standardfall.

Danach meldete René ohne weitere Änderung: „klappt wieder“. **Die Ursache ist damit nicht gefunden, nur der Zustand ist verschwunden.** Kein Produktionsfehler behauptet, **keine Produktionsdatei geändert** – eine Änderung ohne belegte Ursache wäre ein Symptom-Patch.

Nicht beantwortet und für die Aufklärung nötig: Ebene, Version/Stand (alte öffentliche Fassung oder `feat/hofausbau-fundament`), Gerät (Mac oder Handy), Zustand der Kutsche kurz vor dem Feststecken, ein Screenshot und ein Spielstand-Export. Nur wo der Fehler tatsächlich sichtbar war, lässt sich der Ablauf einordnen.

**Kleiner eigener Befund (niedrig, reproduziert):** Direkt nach einer Kutschenreise blieb kurzzeitig die Höhlen-Anzeige im HUD stehen („Ebene 5/10 · Silberrast“), bis der nächste HUD-Takt griff. Das ist eine Anzeige-Verzögerung, **keine** belegte Ursache des Feststeckens.

**Abgebrochener Aufklärungsauftrag:** die unabhängige Höhlen-Untersuchung (`deleg_31302a6f`) brach nach 11 Schritten mit HTTP 429 ab – Codex-Kontingent erschöpft, Reset laut Meldung 06:23. Teilstand: keine Befunde, keine Repoänderung. Die echten Bildschirm-Leiterwege wurden dadurch **weiterhin nicht** unabhängig geprüft; die älteren Browserprüfungen nutzten teils `JMDEBUG.tap` statt echter Bildschirmklicks.

**Nächster Schritt:** denselben Prüfauftrag nach dem Kontingent-Reset neu starten und René nach Screenshot, Ebene, Version und Gerät fragen. Erst danach entscheiden, ob etwas zu beheben ist.

## Livegang 15.10.2026 (Renés Freigabe)

René hat am 15.10.2026 freigegeben: „jetzt kann es live gehen“. Ausgeliefert ist `8aff1d886b3365216a34c7e0f06f5b38e57ce2f7` auf `main` und `gh-pages` (Fast-Forward, kein Force-Push, nichts gelöscht). Vorheriger Live-Stand `be89e04` ist als Tag `live-vor-ausbau` gesichert; Rücknahme wäre ein neuer Commit zurück auf diesen Stand, kein Force-Push.

Live-Verifikation, nicht nur Push-Erfolg:
- `jm-ausbau.js`, `index.html`, `sw.js` live per HTTP 200; `index.html` lädt `jm-ausbau.js`, `sw.js` führt es im Precache.
- Alle fünf Kern-Dateien live **byte-identisch** zu `8aff1d8` (SHA-256-Vergleich) – kein Cache- oder Deploy-Mischstand.
- Echter Nutzerweg auf der Live-Adresse: Spielstart → Reise in den Mondwald → Höhle per Bildschirmklick betreten → HUD „Ebene 1/10 · Eingangskammer“ → obere Leiter per Bildschirmklick → „Ebene 2/10 · Kupferadern“. Sechsmaliger Ebenenwechsel wiederholt, ohne Fehler. Kühlschrank und Küche am Rechner/Handy-Layout geöffnet.
- Testweise 3D-Darstellung: `R3.proj` selbst aufgerufen, solange das 3D-Modul noch nicht bereit war, wirft in **meinem Prüfcode** einen Fehler (`matrixWorldInverse`). Das ist ein Fehler meiner Messung, kein Spielverhalten; `use3D()` fängt einen fehlgeschlagenen 3D-Aufbau intern ab und fällt auf 2D zurück.

## Ursache gefunden und behoben (15.10.2026, nach Renés Spielstand-Export)

René schickte seinen Spielstand (`map: hoehle2`, `px/py: 10,14`, Energie 68). Damit ließ sich der Fehler **sofort und reproduzierbar** nachstellen; ein synthetischer Regressionstest (`tests/mine-rueckweg.cjs`) war vor dem Fix ebenfalls rot.

Ursache: `routeTarget` in `jm-game.js` kannte in seiner Wege-Tabelle nur `farm`, `village`, `forest` und `hoehle`. Für die neuen Ebenen `hoehle2` … `hoehle10` war der Tabelleneintrag `undefined`; sobald ein Ziel auf einer anderen Karte lag, warf `via[0]` den Fehler `Cannot read properties of undefined (reading 'farm')`. Der Aufruf kam aus `drawArrow3` → `render3` → `render`, also **in jedem Frame**. Weil `requestAnimationFrame(loop)` hinter dem werfenden Aufruf stand, endete die Spielschleife: Welt und Spielfigur standen still, während Menüs (DOM-Ereignisse) weiter reagierten. Das ist exakt Renés Symptom „stecke fest, kann aber nichts mehr machen“.

Zwei Änderungen, beide root cause statt Symptom:
1. `routeTarget` behandelt jede Höhlenebene über die Höhlenlogik (`M.cave`): Ziel in der Mine → obere Leiter, jedes andere Ziel → untere Leiter hinaus; fehlt ein Eintrag, kommt `null` statt eines Absturzes.
2. `loop()` kapselt Update und Anzeige in `try/catch`, und `requestAnimationFrame(loop)` liegt **außerhalb**. Ein Anzeigefehler darf die Spielschleife nie wieder beenden.

Belege: Regressionstest vorher rot (`Auf Ebene 2 darf kein Laufzeitfehler auftreten: Cannot read properties of undefined (reading 'farm')`), nachher grün. Mit Renés echtem Spielstand: keine Fehler mehr, Figur bewegt sich wieder (10,14 → 10,15), untere Leiter führt von Ebene 2 zurück auf Ebene 1. Vollständiger Lauf: 21 Befehle, alle Exit 0.

**Lehre:** Die früheren Prüfungen liefen mit Spielständen ohne aktives Kartenziel auf einer Mine-Ebene – der Fehler blieb dadurch unsichtbar, obwohl er bei jedem normalen Spielab „Programm auf dem Hof, dann in die Höhle“ auftreten muss. Ein Wegweiser-/Anzeigefehl gehört mit einer laufenden Aufgabe und wechselnder Karte getestet, nicht nur mit einem nackten Kartenwechsel.

## Neu abgelegte Prüfskripte

`tests/cave-floor-change.cjs` und `tests/erschoepfung-in-hoehle.cjs` halten die hier tatsächlich ausgeführten Prüfungen fest (Ebenenwechsel per Bildschirmklick, Erschöpfung in der Höhle, Bewegung danach). **Kein Produktionscode wurde für diese Untersuchung geändert.**
