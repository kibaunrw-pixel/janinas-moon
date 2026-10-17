# Etappe 4 – Restinhalte: Entwicklungsabnahme

Ausgang `de0367c4de61d70ab48cc069e0e4a1dc1493d29d` (von René bereits veröffentlicht). Neue Arbeit ausschließlich `feat/stadt-und-wohnraum`, **nicht veröffentlicht**. Persönliche Browserprofile und Spielstände wurden nicht geöffnet.

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
- `tests/entdecken-browser.cjs`: Markt/Kauf/Reload, Regenbogen/Album/Reload, Nebelkoi und Regenforelle mit echtem Zeiger-gesteuertem Angel-Minispiel und Reload, Sternschnuppe antippen/Wunsch/Reload. Je Handy 2D und Rechner 3D. Vorlauf **9/10**, letzter Sternenklick 3D zu spät (Position vor langsamer Bildschirmaufnahme ermittelt; ein bewegliches Ziel wird so verfehlt). Beleg unverändert in `logs/entdecken-browser.log`. Nachlauf nur Markt und Sterne nach frischer Positionsmessung und tieferem HUD-freien Sternenband: **4/4**, EXIT 0 (`logs/entdecken-browser-nachlauf.log`). Kein Gesamtlauf wiederholt.
- Offline: `BASE_URL=http://127.0.0.1:8793/ node tests/offline.cjs`, EXIT 0, `logs/rest-offline.log`: neue Module aus Cache, frischer Offline-Tab, Chronik-/Helfer-/Albumfunktionen ausführbar. Kein Nachweis für Update einer schon installierten PWA.
- Syntax aller 19 Spiel-/SW-Dateien: EXIT 0. Bilder selbst angesehen: Nachtmarkt Welt in 390 2D/1440 3D (vor/nach Bestückung), Angebot 390 2D, Regenbogen 390 2D/1440 3D, Nebel 1440 3D, Album 390 2D.

## W-ID-Statusmatrix

| IDs | Status nach Modulen A/B |
|---|---|
| W07/W09/W10 | Schon live; vorhandene Lösung unverändert übernommen |
| W08/W11/W12/W32 | Neu gebaut, Logik und gezielte Browserwege grün; nur Entwicklungszweig |
| W33 | Vorhandene Sternschnuppen sinnvoll ergänzt; grün im gezielten Nachlauf |
| W34/W35 | Regenbogen und lesbarer Morgennebel gebaut, Browser/Album/Reload grün |
| W36/W57 | Bestehendes Schatzkartenrätsel vollständig, kein Duplikat gebaut |
| W37/W40/W41 | Album, Wetterfische, Nachtmarkt gebaut, echte Klick-/Fang-/Kaufwege grün |
| W38/W39/W43/W44/W48 | Bestehende Geburtstage, Stadt-/Haus-/Brunnen-/Café-/Tierprogression anerkannt, nicht doppelt gebaut |
| W42 | Kein Herunterstufen alter Spielstände; vorhandene echte Ruinen bleiben Ausgangszustand |
| W45/W46/W47 | Gemeinschaftsgarten/Dorfplatz/Dorfgewächshaus noch offen; Hofgewächshaus bleibt erhalten |
| W03/W05/W27/W29 | W05 durch Elva-/Jonas-Einzug vorhanden; W03/W27/W29 noch gesondert zu ergänzen |
| W06/W24 | Erstes Dorfpaar besteht; zweites Paar noch offen |
| W01/W14/W22 | Teilumfang bleibt ehrlich: vier persönliche Geheimnisse; Café sowie Stadtbäckerei/Blumenladen; Entenzucht. Keine weiteren vollen Geschäftsarten oder Tierzuchten vorgetäuscht |

## Offene Abnahmegrenzen

Keine neue `run-all`-Schleife. Echte iPhone-/Rechnerhardware, PWA-Update einer Bestandsinstallation und unbekannter persönlicher Save nicht geprüft. Kein Livegang. Weitere Module ergänzen diese Datei mit ihren eigenen Belegen; offene IDs sind oben ausdrücklich benannt.
