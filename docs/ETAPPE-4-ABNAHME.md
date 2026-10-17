# Etappe 4 – Vollmondwald, magische Pflanzen und Regenhändler – Prüfbericht

Branch `feat/stadt-und-wohnraum`, Ausgangsstand `c74f253`, geprüfter Stand **`f18b552`**. `main` und `gh-pages` bleiben auf `c74f253` (live). Kein Merge, kein Deploy. Dieser Bericht ist eine technische Übergabe und keine Freigabe durch René.

## Codebefund vor der Änderung

Der Ausgangsstand enthält W64 bereits vollständig als eigene Geschichte in `jm-ereignisse.js`: Brief von Henk, Steintür im Nordwesten des Mondwalds, Karte `waldtuer`, Truhe, Steintafel, Rückweg und Wegweiser. Die Tafel kündigt einen Vollmondwald nur an. Eine zweite Waldkarte, ein Mondrhythmus und ein Zugang aus dem Gewölbe fehlen. Die Waldtür darf deshalb nicht ersetzt werden; sie ist der verbindliche Zugangspfad.

Das bestehende Feldsystem in `jm-game.js` speichert je Beet Boden, Wasser und Pflanze in `s.field`. Der Tageswechsel erhöht Pflanzenalter bei `f.w` und setzt danach gewöhnlichen Regen sowie Sprinkler als Bewässerung. Es gibt im Ausgangsstand keine magische Kultur und keine gespeicherte Unterscheidung, ob Wasser nachts von Hand, durch Regen oder durch einen Sprinkler kam. W09 ist daher kein Bedienfehler, sondern benötigt eine kleine Erweiterung des vorhandenen Pflanz-/Gieß-/Erntesystems.

Die bestehenden Händler sind feste Innenräume mit Wochenplan. Der Wetterbericht nennt nur Wetter und gegebenenfalls ein Fest. Es gibt keinen regenabhängigen Händler, keinen eigenen Wegplan und kein entsprechendes Sortiment. Verkaufspreise kommen zentral aus `JM.ITEMS[*].sell`; Cafépreise und Bestellungen leiten sich ebenfalls aus Warenwerten und verfügbaren Rezepten ab. W10 muss deshalb den Einkaufsweg, die Ankündigung und eine nachweislich verlustbehaftete Sofortverkaufsbilanz gemeinsam ergänzen.

## Verbindliche Abnahmekriterien

### W07 Vollmondwald

- Ein dokumentierter 14-Tage-Rhythmus: Vollmond an jedem 14. Spieltag; am 13. Tag steht im Kalender und im Tagebuch ein Hinweis, am Vollmondtag der aktuelle Mondstand.
- Der einzige reguläre Zugang führt vom bestehenden Gewölbe `waldtuer` in eine neue Karte. Außerhalb des Vollmonds bleibt das Tor geschlossen.
- Befindet sich Janina beim Tageswechsel im Vollmondwald, wacht sie sicher zu Hause auf. Ein bereits begonnener Aufenthalt lässt sich außerdem jederzeit über denselben Ausgang zum Gewölbe verlassen.
- Tageswechsel und Reload bewahren Zustand und Karten-ID korrekt. `routeTarget`/Wegweiser kennen Gewölbe und Vollmondwald. Kartenwechsel und Spielschleife erzeugen keine Pageerrors oder Fehler pro Frame.
- 2D und 3D zeigen Mondlicht, zurückhaltenden Nebel, Glühwürmchen und leuchtende Pilze. Effekte bleiben begrenzt und verdecken weder Wege noch HUD oder Spielfigur.

### W09 Magische Pflanzen

- Mondsamen sind im Vollmondwald regulär auffindbar und außerdem beim Regenhändler erhältlich.
- Mondsamen nutzen das bestehende Beet-, Saat-, Gieß- und Erntesystem. Besitz, Beet und Wachstum überleben Migration und Reload.
- Besondere Bedingung: Wachstum zählt nur nach manuellem Gießen in der Nacht (ab 19:30 oder vor 6:30 Uhr). Regen und Sprinkler erfüllen diese Bedingung ausdrücklich nicht.
- Spielhinweise erklären Saatquelle, Nachtbedingung und ausbleibendes Wachstum. Die reife Mondblüte ist in 2D und 3D sichtbar und besitzt einen echten hohen Versandwert.
- Ernte und Verkauf zahlen genau einmal; Saisonwechsel vernichtet die magische Kultur nicht unbeabsichtigt.

### W10 Regenhändler

- Der Händler erscheint ausschließlich an Regentagen nach einem festen, sichtbaren Wegplan und ist außerhalb dieses Fensters nicht kaufbar.
- Der Wetterbericht kündigt ihn für den Folgetag bei Regen namentlich und mit Ort/Zeit an.
- Sein Sortiment enthält Mondsamen und seltene, tatsächlich nutzbare Dinge. Kauf zieht Geld genau einmal ab, legt Ware genau einmal in den Rucksack und bleibt nach Reload erhalten.
- Kein Artikel lässt sich sofort mit Gewinn versenden. Café und Bestellungen dürfen Händlerware nicht in eine Einkaufs-/Verkaufsschleife mit Gewinn verwandeln.
- Händler, Angebot und Figur sind in 2D und 3D erreichbar, anklickbar und auf 390×844 nicht durch das HUD verdeckt.

## Prüfplan

1. `tests/etappe4.test.cjs` wird zuerst gegen `c74f253` rot ausgeführt; unverändertes Log: `docs/ROT-ETAPPE4-c74f253.log`.
2. Danach Logiktest, Syntaxprüfungen und neue Offline-Prüfung einzeln.
3. `tests/etappe4-browser.cjs` läuft seriell in 390×844 und 1440×900, jeweils 2D und 3D. Alle Pflichtwege erfolgen über sichtbare Klicks; Fixtures setzen nur ausgewiesene Startgeschichte, Zeit, Wetter und Vorräte vor Spielstart. Jeder Strang enthält einen Reload mitten im Ablauf.
4. Ein Rahmungstest prüft neue Waldkarte sowie wichtige Pflanzen-/Händlerbilder. Die Browserprüfung misst reale `requestAnimationFrame`-Zählungen und behauptet keine pauschalen 60 FPS.
5. Danach betroffene Bestandstests einzeln; kein vollständiges `tests/run-all.cjs`.

## Status W07–W12

| ID | Status dieser Etappe | Befund |
|---|---|---|
| W07 | Umsetzungskandidat | Vollständig umzusetzen und nachzuweisen. W64-Gewölbe bleibt erhalten und wird zum Zugang. |
| W08 | offen | Waldgeister würden ein noch nicht vorhandenes Helfersystem voraussetzen. Wegen der Priorisierung vollständiger erster Stränge nicht begonnen. |
| W09 | Umsetzungskandidat | Vollständig im bestehenden Feldsystem umzusetzen und nachzuweisen. |
| W10 | Umsetzungskandidat | Vollständig mit Wetterbericht, Wegplan und Bilanzschutz umzusetzen und nachzuweisen. |
| W11 | offen | Die W64-Steintafel ist vorhandene Vorankündigung, aber noch keine zusammenhängende Ruinen-Entdeckungsreihe. Wegen Priorisierung nicht erweitert. |
| W12 | offen | Der ursprüngliche Wunsch bleibt inhaltlich unbestimmt. Keine erfundene Magieentscheidung. |

## Status W32–W48

Diese Etappe beginnt hier keine weiteren Systeme. Vorhandene Teilsysteme bleiben ausdrücklich anerkannt.

| ID | Status/Befund |
|---|---|
| W32 | Teilweise vorhanden: anonyme/geheime Brieffolgen W55–W60 und weitere Postereignisse. Keine neue Arbeit in Etappe 4. |
| W33 | Sternschnuppensystem vorhanden; keine Erweiterung in Etappe 4. |
| W34 | Offen; kein Regenbogen ergänzt. |
| W35 | Teilweise als zurückhaltender Effekt nur auf der neuen Waldkarte vorgesehen; kein allgemeines Wetterereignis-System. |
| W36 | Vorhanden: W57-Schatzkarte mit drei Hügeln, gespeichertem Fund und einmaliger Belohnung. Keine neue Arbeit. |
| W37 | Teilweise vorhanden: Fang-, Koch-, Versand- und weitere Tagebuchdaten; kein zusammengeführtes vollständiges Album. |
| W38 | Vorhanden aus Etappe 2: Bewohner- und Janina-Geburtstage mit Geschenken. Keine neue Arbeit. |
| W39 | Teilweise vorhanden: Stadtbauplätze, Renovierung von Haus Nummer 7 und verlassenes Haus W62 mit Einzugssystem. Kein zusätzliches Renovierungssystem. |
| W40 | Teilweise vorhanden: Fangbedingungen nach Ort/Angelfortschritt; wettergebundene seltene Fische bleiben offen. |
| W41 | Offen; der bestehende Samstagsstand ist kein Nachtmarkt. |
| W42 | Teilweise durch vorhandene Ruinen/Baustufen sichtbar; kein neuer pauschaler Anfangszustand für alte Spielstände. |
| W43 | Vorhanden: alter Brunnen über W58–W60 mit Ressourcenauftrag, sichtbarer Reparatur, Einweihungsdialog und Wasserfunktion. |
| W44 | Vorhanden/verbunden: Haus Nummer 7 sowie Stadtbauplätze/W62 verwenden den bestehenden Einzugs- und Hauszähler. |
| W45 | Offen; kein Gemeinschaftsgarten begonnen. |
| W46 | Offen; keine Dorfplatzrenovierung begonnen. |
| W47 | Vorhanden: Hofgewächshaus-Freischaltung. Ein separates Dorfgewächshaus bleibt undefiniert und wird nicht dupliziert. |
| W48 | Teilweise durch dauerhafte Haus-, Brunnen-, Stadt-, Café- und Tierausbauten vorhanden; keine belastbare Spielstundenbehauptung und kein neuer Gesamtabschluss. |

## Befunde aus der Browserprüfung und Korrekturen (Commit `f18b552`)

| Befund | Ursache (belegt) | Korrektur |
|---|---|---|
| Mondtor im Gewölbe ließ sich nicht antippen | Ein Deko-Fass (`barrel`, W64) lag auf derselben Kachel (2,3) wie das Tor und fing den Tipp ab (Objektliste im Browser ausgelesen). | Fass auf (9,3) versetzt (`jm-ereignisse.js`). |
| Wetterbericht-Fixture landete auf dem Hof | Startkachel (5,5) im Haus ist der Tisch; `startGame` setzt dann regelkonform auf den Hof zurück. | Fixture (7,6); Dialogtext wird abgewartet (Schreibeffekt). Nur Test. |
| Rahmungstest brach sofort ab | Fixture ohne `JM.Ausbau.migrate`; Waldkachel (10,10) ist Teich. | Migration ergänzt, Startkarte wird geprüft, Startkachel (13,8). Nur Test. |
| 1440×900 in 3D: Samenfund/Ausgang außerhalb des Bildes | Querformat zeigt in 3D rund acht Reihen; Ziel 8 Reihen entfernt. Kein Produktfehler. | Test geht über sichtbare Zwischenschritte (echte Klicks). |
| Vollmondwald wirkte kahl und warm beleuchtet | In 3D leuchten alle Emissive-Teile im Lampenorange `#ffb050`; in 2D nur ein Pilzfeld, Nebel nur oben unter dem HUD, Glühwürmchen 1 px. | Drei weitere Pilzgruppen, acht Mondglocken (2D+3D), blaues Leuchten und Punktlichter nur im Vollmondwald, Nebel über die ganze Bildhöhe, Mondspiegelung im See, größere Glühwürmchen. |
| Nerio ohne Wagen | Nur Figur und Kiste. | Schirm, Handwagen mit Rädern, gestreiftem Planendach, Laterne, Mondtau-Gläsern (2D+3D). |

## Testmatrix und Ergebnis

Alle Läufe seriell gegen eine eingefrorene Kopie von `f18b552` (`git worktree`, Server 127.0.0.1:8765), Logs unter `docs/logs/etappe4-abschluss/`, Übersicht `uebersicht.txt`.

| Befehl | Ansichten | Ergebnis |
|---|---|---|
| `VIEWPORT=… GFX=… node tests/etappe4-browser.cjs` (wald, pflanze, pflanze_reif, haendler, wetter; je Reload mittendrin) | 390/1440 × 2D/3D | 4× EXIT 0 |
| `VIEWPORT=… GFX=… node tests/etappe4-rahmung.cjs` (wald, pflanze, haendler) | 390/1440 × 2D/3D | 4× EXIT 0 |
| `node tests/tipp-vorrang.cjs` | – | EXIT 0 |
| `node tests/picking.cjs` | – | EXIT 0 |
| `node tests/offline.cjs` | – | EXIT 0 |
| `node tests/ereignisse-browser.cjs tuer` | 390/1440 × 2D/3D | 4× EXIT 0 |
| `node tests/etappe3-browser.cjs teich` | 390/1440 × 2D/3D | 4× EXIT 0 |
| `node --test tests/*.test.cjs` | – | 78/78 grün |

Kein vollständiger `run-all`. Pageerrors und Konsolenfehler: keine (Assertion je Strang). rAF je Strang ≥ 120 Bilder in 2 s.

## Angesehene Bilder

Selbst angesehen (Hermes), mit SHA-256 in `docs/belege/etappe4/MANIFEST-angesehen.json`: Vollmondwald 390 2D/3D und 1440 3D, Regenhändler 390 2D/3D (Ausschnitt-Zoom) und 1440 3D, reife Mondblüte 390 2D/3D und 1440 3D. Offen bleibt ein kosmetischer Punkt: Der Waldsee ist in 3D ein eckiges Becken.

`fehler-*.png` in `docs/belege/etappe4/` stammen aus den roten Vorläufen vor den Korrekturen und sind nicht Teil des Belegs.

## Offen

W08, W11, W12 und W32–W48 bleiben wie oben beschrieben offen bzw. teilweise vorhanden. Echte Mobilhardware und das Update einer installierten PWA sind nicht geprüft.

