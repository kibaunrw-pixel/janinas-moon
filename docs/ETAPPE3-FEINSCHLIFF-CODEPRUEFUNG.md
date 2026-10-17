# Etappe 3 – unabhängige technische Codeprüfung

Geprüft vor dem ersten Fix-Commit gegen `33b6fb5`: `jm-game.js`, `jm-3d.js`, `tests/etappe3-rahmung.cjs` und die Belegrahmung in `tests/etappe3-browser.cjs`.

Prüfer: separater Codex-Prozess, nur lesend, ohne eigene Tests oder Änderungen. Zwei Prüfdurchgänge, der letzte einschließlich seitlicher Außenkamera und transparenter Vitrine mit offenem Holzrahmen.

## Ergebnis des Prüfers

Keine blockierenden Befunde. Keine konkreten neuen Fehler oder Änderungen an Spiellogik, Wegen oder Sitzplätzen festgestellt.

Die erste Prüfung wies ausdrücklich darauf hin, dass die Projektion von Raumecken allein keine sichtbare Lichterkette oder vollständige Tafel beweist. Deshalb wurden die neuen Screenshots zusätzlich selbst angesehen. Die Kette liegt nun vor statt in der Rückwand, das Vitrinendach besteht aus Rahmen und transparentem Glas statt einer verdeckenden Holzplatte. Ware, Kette und Tafel sind sichtbar.

## Umfang des Fixes

- 2D-Zoomobergrenze und feste Gastraumzentrierung ausschließlich im Café; außerhalb normale Darstellung.
- 3D-Kamera passt den vollständigen Raum mit Sicherheitsrand zwischen HUD und untere Leiste. Vor dem fertigen Café seitlicher Blick, ohne Häuser zu verschieben.
- Tafel ohne abgeschnittene Warennamen; Schrift wird bei Bedarf eingepasst.
- Gerahmte Mondbilder, Tassen, Tischdeckenstreifen und sichtbare vorhandene Vitrinenware sind ausschließlich Rendergeometrie, keine Weltobjekte oder Kachelsperren.
- Neue Browserprobe mit normalem, maximal nahem und weitem Zoom in vier Ansichten; dritter Tisch und Mondkuchen ausdrücklich als Start-Fixture. Eintritt durch echten Bildschirmklick. Kartenraster, Objektliste, Dekoration und Sitzplatzdefinitionen vor/nach Zoom identisch.

Kein Merge, kein Deploy, keine Geräte- oder visuelle Endabnahme durch Designer behauptet.
