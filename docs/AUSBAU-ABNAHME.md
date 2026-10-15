# Ausbau-Fundament – Entwicklernachweis

## Ergebnis und Freigabegrenze

Das erste Ausbaupaket ist integriert und lokal spielbar. Entwicklerprüfungen sind ausgeführt; **unabhängige Hermes-Abnahme und Freigabe zum Livegang stehen noch aus**. Nur `feat/hofausbau-fundament` wird gepusht. Kein PR, Merge, Workflow oder Deploy wurde angelegt. `main` und `gh-pages` bleiben unverändert.

Die vollständige Recherche liegt unverändert in `Janinas-Moon-Recherche-und-Ausbauplan.md`; `cmp` mit der gelieferten Quelle war erfolgreich. Die dortigen W01–W48 sind ausdrücklich keine Fertigmeldung dieses Pakets.

## Was tatsächlich integriert ist

### Kühlschrank, Küche, Zutaten
- Eigenes persistentes `S.fridge`, gleicher Hauptspeicherschlüssel `janinas-moon-v2`; kein Rucksacklimit und keine künstliche Lagergrenze.
- Einlagern und Entnehmen: 1, eingegebene positive ganze Menge, alle. Beide Bestände werden angezeigt. Ungültige/zu große Mengen verändern nichts.
- Die echte Herdinteraktion öffnet die Küche auch dann, wenn René am Herd steht. Rezepte reservieren konkrete Zutaten zuerst, anschließend Fisch-Sammelkategorien; erst bei vollständigem Bedarf werden beide Lager atomar verändert.
- Fehlende Zutaten zeigen Beschaffungswege. Alle konkreten Zutaten der acht bestehenden Rezepte sind ganzjährig bei Mei kaufbar; Fisch wird mit Henks Angel gefangen. Saisonales Saatgut bleibt saisonal.
- Kaufpreise der Küchenalternativen liegen bewusst über dem Eigenanbau. Auch Einkauf → Kochen → maximaler Samstagsbonus ist für vollständig gekaufte Rezepte bilanziert und nicht gewinnbringend. Eigene Ernte/Tierprodukte bleiben wirtschaftlich sinnvoll.

### Mine und Teich
- Zehn Karten mit eigener Tiefe, Kammername, Bodenfarbe, Felsanordnung und abgestuften Erzlisten. Eisen und Silber ergänzen Stein/Kupfer/Amethyst/Mondquarz.
- Obere Leiter führt tiefer; untere zurück, Ebene 1 hinaus in den Wald. Ebene 10 hat den Teich im Osten statt einer weiteren Abstiegsleiter. Mittelkorridor bleibt frei.
- `S.mine.floors` speichert Abbau und HP pro Ebene. Wechsel/Reload würfeln nicht neu. Vollständiges Verlassen (auch Kutsche/Heimkehr) schließt den Durchlauf; der nächste Eintritt erzeugt neue Vorkommen am selben Tag.
- Alte Saves in `hoehle`, auch mit leerem `rocks`, werden in den laufenden ersten Ebenenzustand übernommen.
- Sternenschuppe und Kristallforelle sind eigene tatsächlich fangbare Teichfische, keine bloßen Platzhalter. Sie nutzen das vorhandene Angel-Minispiel, Inventar, Fanglog, Sammlung und Versand/Verkauf.
- Eisen wird für den zweiten Hausausbau verwendet; Eisen und Silber ermöglichen an der Werkbank ein alternatives Dreier-Sprinkler-Rezept. Separate Rezept-IDs verhindern Verwechslung mit dem alten Sprinkler-Rezept.

### Zimmermann und Haus
- Timo mit eigener Zimmerei im Dorf rechts vom Brunnen, Laden-Innenraum, Intro, Freundschaft, Geburtstag, Dialogen und Tagesplan. Geöffnet Mo–Sa 8–17 Uhr, Sonntag geschlossen; Regen öffnet den Laden nicht außerhalb dieser Zeiten. Feste nutzen den bestehenden Dorffestablauf.
- Feldäste liefern je zwei Bauholz, Feldsteine einen Stein. Vier Holzfunde wachsen täglich im Wald nach; Bauholz kann zusätzlich in Timos Laden gekauft werden. Keine Rohstoff-Sackgasse.
- Stufe 1 „Vorratsstube“: 20 Holz + 10 Stein + 1000 G, zwei Nächte. Vier zusätzliche Kacheln Breite, Fenster, Teppich, zweiter Zugang zum gemeinsamen Kühlschranklager, +10 maximale Energie.
- Stufe 2 „Wohnwerkstatt“: weitere 40 Holz + 20 Stein + 6 Eisen + 2400 G, drei Nächte, setzt Stufe 1 voraus. Nochmals vier Kacheln Breite, zusätzliche Werkbank und Tisch, +10 maximale Energie.
- Kosten werden genau beim Auftrag abgezogen; gespeicherter Auftrag mit Fälligkeit. Abschluss genau einmal. Bett/Küche/alter Kühlschrank/Ausgang behalten ihre bisherigen Koordinaten.
- Sichtbar im Innenraum in 2D **und** 3D. Bei visueller Nachkontrolle wurde zusätzlich ein echter 3D-Cachefehler entdeckt: gleiche Karten-ID nach Hausausbau zeigte noch die alte Geometrie. Render-Schlüssel enthält jetzt Raumdimensionen und Hausstufe; neuer Kühlschrank wird nach Abschluss per echtem Raycaster geprüft, neue Werkbank in 3D per Bildschirmklick geöffnet.
- Kein zweites Hof-Gewächshaus verkauft. Timo ersetzt keinen der vier ursprünglich geforderten Nachbarn in der alten Kennenlern-Quest.

### Sammelobjekte und Sicherung
- Künstlicher Repro: Socke bei `(2,7)` hinter/oberhalb der Hundehütte. Tippen auf projizierte Sprite-Mitte traf vorher Kachelzeile 8 statt 7. Diese Ursache wurde real rot nachgestellt und gezielt behoben.
- Sichtbare Sammelsprites besitzen jetzt direkte Raycaster-Treffer an ihrer tatsächlichen Höhe und Vorrang vor Tier-/Gebäudetreffern. Sie werden nicht durch das Gebäude unsichtbar verdeckt. Feld-Wischmodus fängt Sammelobjekte nicht mehr ab.
- Zusätzlicher Fall mit Tierüberlappung auf dem Feld und Doppeltipp: hinlaufen, genau einmal wegräumen, keine Feldarbeit. Entfernte Mess-Objekte werden nicht erneut gezählt.
- Unerreichbare alte Sammelobjekte werden beim Kartenbetreten auf den nächsten erreichbaren freien Ort versetzt, unter Erhalt von Gegenstand und Zusatzdaten; kein pauschales Löschen.
- Hinweis bei leerem Aufräumziel benennt ehrlich, dass heute nichts herumliegt.
- Tagebuch → Optionen → **Sicherung exportieren** lädt den vollständigen aktuellen Spielstand als JSON herunter. Downloadinhalt wurde gelesen und gegen Name/Hausstufe geprüft. Ein Import-Dialog ist nicht Teil dieses Pakets.

**Wichtige Grenze:** Das ist kein Nachweis, dass die unbekannte Original-Socke aus Renés konkretem Spielstand identisch lag. Dieser Spielstand lag nicht vor. Künstlicher Repro und tatsächlicher Originalfall werden nicht gleichgesetzt.

## Bedienwege zur unabhängigen Abnahme

1. Vorschau öffnen, „Auf den Hof“ bzw. „Weiterspielen“. Haus betreten, Kühlschrank links neben dem Herd antippen. Vorräte einlagern; Herd antippen und aus Rucksack + Kühlschrank kochen.
2. Vom Hof nach Osten ins Dorf. Meis Markt oben links, 9–17 Uhr (regulärer Sonntag frei; bestehendes Regenverhalten anderer Alt-Läden wurde nicht allgemein umgebaut). Zutaten mit 1×/5× kaufen. Zurück zum Haus und Rezeptbedarf prüfen.
3. Vom Hof nach Süden in den Wald; Höhleneingang nordöstlich. Felsen mehrfach antippen, obere Leiter bis Ebene 10 benutzen. Teich im Osten: Angel wählen, Wasser antippen, auf `!` tippen, im Minispiel halten/loslassen. Untere Leitern führen wieder hinaus; Kutsche im Tagebuch bleibt verfügbar.
4. Dorf, rechts vom Brunnen, oberhalb Paulas Tierhof: Timos Zimmerei. Zuerst kennenlernen, danach Tresen/Person erneut antippen. Bauholz kaufen oder Äste/Waldfunde sammeln. Ausbau verbindlich beauftragen, am Bett normale Nächte verstreichen lassen. Neuer Raum ist nach Abschluss begehbar; zweiter Kühlschrank greift auf denselben Vorrat zu.
5. Tagebuch → Optionen → Sicherung exportieren. JSON-Datei sicher aufbewahren. Grafik kann dort zwischen 3D und Pixel umgeschaltet werden; für Raumübersicht regulär herauszoomen.

## Reproduzierbare Befehle

Arbeitsverzeichnis: `/Users/reneklomfas/KIBAU_Produktion/janinas-moon`.

```sh
# Lokale Vorschau, nur Loopback – kein Deploy
/opt/homebrew/bin/python3 -m http.server 8765 --bind 127.0.0.1

# Produktionslogik, keine externen Testpakete nötig
node --test tests/ausbau.test.cjs

# Hier tatsächlich verwendetes Playwright: 1.55.0, installierter Chrome
export PLAYWRIGHT_PATH=/Users/reneklomfas/.npm/_npx/fd3bca3c548369c0/node_modules/playwright
node tests/run-all.cjs

# Einzelne Browserprüfungen
node tests/browser.cjs
node tests/picking.cjs
node tests/regression.cjs
node tests/offline.cjs
node tests/shops.cjs

/opt/homebrew/bin/git diff --check
```

`PLAYWRIGHT_PATH` ist eine lokale Testvoraussetzung, keine Produktionsabhängigkeit. Alternativ wird ein regulär auflösbares `playwright` verwendet. Kein neues Framework, kein globales Paket und kein bezahlter Dienst wurden dem Spiel hinzugefügt. Ein anfänglich fehlendes Playwright-Chromium wurde durch `channel: 'chrome'` gelöst; nicht durch einen vorgetäuschten Browserlauf.

### Tatsächliche Prüfungen und Grenzen ihrer Aussage

- `ausbau.test.cjs`: neun echte Logiktests, Produktion aus `jm-data.js` und `jm-ausbau.js` im Node-VM geladen. Mengenbilanz/Atomizität/Fischkategorie, Zutatenbeschaffung/Ökonomie, zehn Ebenen/Wege/Reload/Durchlauf, neue Erze/Teichfangtabelle, Migration, Baukosten/Bauzeit/Abschluss, Erreichbarkeitsreparatur.
- `browser.cjs`: 390×844 und 1440×900, 3D. Produktions-Kacheleingaben durchlaufen echte Wegsuche/Aktionsroutinen, Panelaktionen werden geklickt. Küche mit tatsächlich ausschließlich im Kühlschrank liegendem Ei; alle zehn Ebenen über Leitern; Teich über **echten Bildschirmklick**, kompletter Fang über Pointer-Halten/Loslassen ohne Fangzustand vorzutäuschen; Journal und Versand, Auftrag, Bauabschluss, neuer 3D-Kühlschrank, Holz und JSON-Download. Page- und Console-Errors müssen leer sein.
- `picking.cjs`: beide Größen, echter projizierter Bildschirm-Pointer am Sammelsprite, Gebäude-/Tierüberlappung, Feldarbeit-Ausschluss und Doppeltipp. Eine anfängliche zusätzliche Test-Feldposition lag am Desktop außerhalb des Viewports; mittels `elementFromPoint` erkannt und Fixture-Figur näher gestellt – kein Produktionsfehler dafür behauptet.
- `regression.cjs`: beide Größen, 2D. 1/Menge/alle, kein horizontales Panel-Überlaufen, Reload der Vorräte, echter Abbau mit HP, Ebenenwechsel/Reload/Verlassen/Wiedereintritt, beide Aufträge und Reload während Bau, Abschluss über regulären Bett-Dialog, neuer Kühlschrank bleibt benutzbar. Danach Wechsel zu 3D und neue Werkbank per echtem Bildschirmklick öffnen.
- `shops.cjs`: regulärer Ladenweg/5×-Kaufbilanz, Timos Öffnungsgrenzen bei Sonne/Regen und Sonntag, ehrlicher leerer Sammelhinweis, unveränderte ursprüngliche Nachbarn-Quest.
- `offline.cjs`: frischer Serviceworker-Precache enthält das neue Modul; Browser offline schalten, neu laden und normalen Spielstart klicken. Serviceworker versioniert und kein erzwungenes `skipWaiting` für laufende Höfe.
- Alle Browserkontexte sind isoliert. Fixtures setzen gezielt Startort, Tageszeit, Geld, Materialien oder bekannte Rezepte; sie ersetzen keine persönlichen Spielstände. Längere Produktionswege werden zum Teil über die bereits vorhandene `JMDEBUG.tap`-Kacheleingabe ausgelöst, nicht ausschließlich als schwarze Bildschirm-Box. Genau deshalb gibt es separate echte Bildschirm-Picking-, Teich- und Werkbankprüfungen.

Echte Ausgaben stehen in **`GRUEN-TESTS.json`** (vom Runner erzeugt). **`ROT-PICKING.json`** enthält den wiederholten erwarteten Fehllauf gegen archivierten Vor-Fix-Commit `34c59e5`, getrennt auf Port 8766: Exit 1, `8 !== 7`. Der gleiche Test ist gegen aktuellen Code grün. Der Baseline-Server ist keine Veröffentlichung und der aktive Entwicklungszweig wurde dafür nicht gewechselt.

## Screenshot-Belege

Verzeichnis: `/Users/reneklomfas/.hermes/cache/scratch/janinas-moon-abnahme/`.

Die Skripte erzeugen beide Größen, Endungen `-390.png` und `-1440.png`:
- `kuehlschrank-2d-*`: Bestände und komplette mobile Mengenbedienung.
- `zimmermann-stufe1-2d-*`, `zimmermann-stufe2-2d-*`: Angebote/Auftrag.
- `haus-stufe1-2d-*`, `haus-stufe2-2d-*`: vergrößerter Innenraum.
- `magischer-teich-3d-*`, `teich-angelplatz-3d-*`: Tiefe und regulärer Angelplatz.
- `haus-stufe1-3d-*`, `haus-stufe2-3d-*`: sichtbare neue Geometrie/Möbel.

Ausgewählte mobile und Desktop-Bilder wurden tatsächlich betrachtet, nicht nur erzeugt. Die Übersichtsaufnahmen verwenden teils bewusst die vorhandenen Minus-Zoomknöpfe; sie beweisen keine Lesbarkeit aller Weltobjekte in maximal herausgezoomter Ansicht.

## Ausdrücklich offen

- Unabhängige Hermes-Abnahme vor jeder Freigabe; kein Livegang durch diesen Entwickler.
- Unbekannter Original-Sockenspielstand und echte persönliche Saves wurden nicht getestet oder verändert. Dafür sind separater Export/Repro und Zustimmung erforderlich.
- Kein physisches iPhone/Safari, keine bestehende installierte iOS-PWA samt Update-/Cloud-Save-Konfliktmigration getestet. Geprüft sind isolierter Desktop-Chrome mit passenden Viewports und frischer Offline-Installation.
- Kein Langzeitbalancing über viele Spielstunden und keine Leistungszusage für alte Handys.
- Dorfvergrößerung über Timos Ort hinaus, Elfen/Hofautomatisierung, Café/Geschäft, neue Tierarten/Zucht/Rettung, Magiewald, Romanzen-/Dorfgeschichten und weitere W01–W48 bleiben Folgeetappen.
- Kein Sicherungsimport, keine allgemeine Sanierung aller vorbestehenden Systeme. Insbesondere allgemeines Regenöffnungsverhalten anderer alter Läden bleibt bestehen.
