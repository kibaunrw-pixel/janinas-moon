# Stadt und Wohnraum – Ergebnisvertrag

## Ausgangspunkt
Lokaler sauberer Stand `926f78e60e25b0b915d35e4bb5d5faec5bf0427d`, zuvor `feat/hofausbau-fundament`. Neuer Zweig `feat/stadt-und-wohnraum`. Remote-Abfrage vor Beginn: origin/feat/hofausbau-fundament, main und gh-pages jeweils ebenfalls `926f78e60e25b0b915d35e4bb5d5faec5bf0427d`. Kein Merge, kein Deploy; nur Entwicklungszweig pushen.

## Ergebnisziele
- Riesenpflanzen: tatsächliche große Ernte als eigener gespeicherter Größenstapel mit sichtbarem Namen und höherem Wert; normal/ riesig nicht mischen. Höherer Preis in Vorschau, Versand und Markt; Transfer-/Teilrücknahme-/Reload-Bilanzen und unveränderte historische normale Stapel prüfen. Vorhandenes `c.g` bedeutet Größe, nicht Qualität.
- Priorisierter HUD-Nachtrag: gemeinsames Mondfest-/Tageszielfenster einklappbar, kompakter Wiederöffnen-Knopf, gespeicherte Einstellung mit sinnvoller Altstandmigration. Kein unsichtbarer Klickfänger, Inhalte nach Tages-/Festwechsel aktuell ohne ungefragtes Aufklappen. Echte Bildschirmklicks in 2D/3D mobil/Desktop prüfen.
- Priorisierter Marktfehler: Hypothesen getrennt prüfen (NPC verdeckt Marktaktion; regelbasierter Spieltag/Zeit/Fest; gespeicherter Eventzustand). Synthetischer regelkonformer Markt, Bildschirmweg und frei eintippbarer Teilverkauf mit Bilanz; Gespräch separat, Nichtmarkttag und Grenzen geschlossen. Originalspielstand fehlt, daher keinen erfundenen Einzelfallnachweis behaupten.
- Priorisierter Nachtrag: direkt eintippbare, mobile Mengenfelder (mit sichtbarem Maximum und Validierung) für Einlegen und Entnehmen. Versandkiste vor Morgenabholung editierbar, Teilrücknahme in den Rucksack, nach Verkauf keine Rücknahme/Duplikate. Einlegen → Teilrücknahme → Reload → Tagesverkauf und Doppelklick-Bilanzen real testen. Scroll, Fokus und Menge behalten. Vorhandene vergleichbare Transfermenüs systematisch erfassen.
- Transferlisten behalten nach Aktionen Kontext und Menge, inklusive letzter Zeile und Dialogwechsel; Browserregression vor Fix rot.
- Bezahlte Hausstufen bekommen ohne erneute Kosten sichtbaren, begehbaren Mehrwert in 2D und 3D.
- Dorf/Bahnhof/Stadt/Rückweg; mehrere Bauplätze, gespeicherte materialbasierte mehrtägige Bauphase, eigenständige Mieter und taggenaue einmalige moderate Miete.
- Restaurant mit größerem kaufbarem Sortiment und tatsächlicher abendlicher tagabhängiger Besucherrotation.
- Altstände und Inventarbilanzen schützen. Neue Karten inklusive Wegweiser prüfen. Bestehenden Runner erweitern und ausführen, Desktop/Mobil 2D/3D mit angesehenen Screenshots; Befehle und Grenzen in STADT-AUSBAU-ABNAHME.md.

## Aktueller Pausenstatus
Auf Nutzerwunsch sofort gesicherter, **unvollständig abgenommener Entwicklungszwischenstand**. Bahnhof/Stadt/Bau/Miete, Restaurantrotation und freie irreversible Teilgaben sind inzwischen implementiert; bisherige offene Liste unten ist historisch. Maßgeblicher Arbeits-/Prüfstatus und offene Kriterien: `STADT-FORTSETZUNG-PAUSE.md`. Kein neuer Gesamtlauf, kein Livegang.

## Verifizierter Teilstand dieser Übergabe (historisch)
Transfer-/Marktfehler und die nachgereichten Prioritäten (Rücknahme, freie Mengen in Lager/Versand/Markt, minimierbare Hinweise, Riesenpflanzen) sowie begehbare Wohnetagen sind implementiert. Vollständiger Runner: 37 Befehle, Exit 0; Nachweise in STADT-AUSBAU-ABNAHME.md und GRUEN-TESTS.json. Bahnhof/Stadt/Bau/Vermietung/Restaurant und freie Mengen für irreversible Gaben/Aufträge bleiben ausdrücklich offen; keine Gesamtabnahme behauptet.

## Übergaberegel
Nur nachweisbar geprüften Umfang als erledigt melden. Falls Gesamtumfang nicht seriös in einem Lauf abschließbar ist: verifizierten Teilumfang committen/pushen, alle offenen Kriterien und Fortsetzung ausdrücklich dokumentieren. Keine Veränderung echter Browser-Spielstände; Testfixtures sind synthetisch. Unabhängige Abnahme und Veröffentlichung bleiben Hermes/René vorbehalten.
