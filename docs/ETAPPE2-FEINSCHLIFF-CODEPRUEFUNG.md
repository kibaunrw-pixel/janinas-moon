# Unabhängige Codeprüfung vor dem Commit

Prüfer: separater Codex-Prozess, read-only, ohne Tests oder Änderungen. Bericht vom Arbeitsstand vor den folgenden Korrekturen:

- P2: Die Dorfpaar-Kamera nahm die Spielerposition bereits vor der Näheprüfung in die Punktliste auf. Dadurch war der Abstand immer null und die Kamera wurde auch weit vom Paar aktiv.
- P2: Das Sitzsprite von René war in 2D um sieben Pixel versetzt, seine Trefferfläche folgte dem Versatz nicht.
- Keine weiteren belegbaren Fehler bei Picknickzeit und Erreichbarkeit im zuletzt gelesenen Stand.

## Zweite Prüfung nach der Bildsichtung

Ein zweiter separater Codex-Prozess prüfte den Diff seit `31faf88` rein statisch. Ergebnis: keine belegbaren neuen Regressionen (keine P1–P3). Picknickpositionen `[16,20]` und `[17,20]` erreichbar; Bank `[20–21,17]` lässt Zugänge offen; Blickrichtungen überspringen bewegte Figuren; Geburtstagsfiguren erweitern erst nach der Näheprüfung die Kameragruppe. Beide Befunde des ersten Reviews bleiben behoben. Praktische Verifikation erfolgt separat durch Browserläufe und Bildsichtung.

Beide Befunde vor dem Commit korrigiert: Spielerposition erst nach Näheprüfung aufnehmen; 2D-Trefferfläche um denselben Sitzversatz wie das Sprite verschieben. Die abschließende Browsermatrix und Picking-Regression sind im Abschnitt Feinschliff des Abnahmeberichts dokumentiert.
