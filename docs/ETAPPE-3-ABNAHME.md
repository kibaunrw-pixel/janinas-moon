# Etappe 3 – Café und Tiere mit Persönlichkeit – Prüfbericht

Branch `feat/stadt-und-wohnraum`, Ausgangsstand `9658784`. `main` und `gh-pages` (`2690fda`) habe ich nicht angefasst. Es gab weder Merge noch Deploy.
Dieser Bericht ist **kein Abnahmeurteil**. Er geht zur unabhängigen Prüfung an Hermes.

## Commits
| Commit | Inhalt |
|---|---|
| `742a9a5` | Module `jm-cafe.js`, `jm-tiere.js`, `jm-art3.js`; Anbindung in `jm-game.js` und `jm-3d.js`; `R.storyPending`; Cache `etappe3-1`; Logiktest rot→grün, Rot-Log |
| `571e417` | `tests/etappe3-browser.cjs` (7 Wege), `offline.cjs` erweitert, Picknickweg toleriert Kuscheln, `run-all.cjs` |
| `2a1887f` | 3D-Wege robust, Plan mit Status W13–W23 |
| `a20254c` | Pfotenspur in 3D deutlicher, Wegweiser „im Café“, Bildausschnitte, Rot-Log Teichboden (widerlegt) |
| dieser Commit | Tierbilder ohne Überzoom, Bericht, Belegbilder mit SHA-256, Logs |

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

## Testtabelle (Befehl → Exit)
ERGEBNISTABELLE

## Angesehene Bilder
BILDER

## Offene Punkte
- **W14:** Bäckerei, Blumenladen und Tierpension sind nicht gebaut und erscheinen nirgends als Auswahl.
- **W22:** Zucht nur bei Enten. Katze, Ziege und Pudel haben keine Vererbung; die manuell gewählte Pudelfarbe bleibt, wie sie war.
- Kein vollständiger `run-all`-Gesamtlauf (laut Auftrag); gelaufen sind die betroffenen Bestandstests einzeln.
- Die Katze ist in 3D auf Mobil klein (Maßstab wie die Hühner). Gut erkennbar, aber kein Blickfang.
- Café: Gäste kommen nur in den gewählten Stunden. Sie nehmen ihr Lieblingsgericht, sonst ein gemochtes, sonst irgendetwas aus der Vitrine. Bei leerer Vitrine warten sie am Tisch („Ich warte noch ein bisschen“); Ärger oder Abzug gibt es nicht.
- Unabhängige Prüfung durch Hermes steht aus.
