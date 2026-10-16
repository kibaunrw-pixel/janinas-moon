# F1: archivierter Rotnachweis und aktuelles Grün

Gleicher Test `tests/panel-focus.cjs`, frische isolierte Kontexte, installierter Chrome.

```sh
BASE_URL=http://127.0.0.1:8787/ PLAYWRIGHT_PATH=/Users/reneklomfas/.npm/_npx/fd3bca3c548369c0/node_modules/playwright node tests/panel-focus.cjs
```

Server 8787 bedient ausschließlich unverändertes `git archive 195a3d7` im Scratch. Tatsächlich Exit 1, erster Mobiltest:
```
AssertionError [ERR_ASSERTION]: Fokus nach letzter Versandzeile bleibt im Panel
false !== true
```

Aktuell über 8765 gleicher Befehl ohne BASE_URL: Exit 0:
```
F1 Versand/Markt letzte Zeile, Tab und ohne vorherigen Panelfokus 390 OK
F1 Versand/Markt letzte Zeile, Tab und ohne vorherigen Panelfokus 1440 OK
```

Rotlauf stoppt bewusst am ersten belegten Fokusverlust; kein behaupteter Markt-Rotnachweis aus diesem Lauf. Aktueller Test prüft beide Zeilenentfernungen samt Tab sowie DOM-Neuaufbau ohne vorherigen Panelfokus. Bestandsbilanzen werden assertiert. Kein Produktionscode für diese Fortsetzung geändert.
