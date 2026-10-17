"""Erzeugt docs/belege/etappe5/MANIFEST-angesehen.json: alle Etappe-5-Bilder mit SHA-256.
Befunde stehen nur bei Bildern, die Hermes im Endstand tatsächlich angesehen hat; Fehlerbilder sind als Diagnose gekennzeichnet."""
import hashlib, json, os, sys, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'docs', 'belege', 'etappe5')
COMMIT = sys.argv[1] if len(sys.argv) > 1 else ''
BEFUND = {
 'rahmung-stufe1-390-2d.png': 'Stufe 1: drei Mietshäuser, Stadtplan- und Auftragstafel, Bauschild an der Oststraße frei; nichts vom HUD verdeckt',
 'rahmung-stufe1-390-3d.png': 'Stufe 1 in 3D: Tafeln und Bauschild sichtbar, Rathaus unten frei',
 'rahmung-baustelle-1440-2d.png': 'Baustelle Phase 2: Fachwerkgerüst auf Sandfläche, Bauschilder auf den Nachbarplätzen',
 'rahmung-baustelle-1440-3d.png': 'Baustelle Phase 2 in 3D: Gerüst steht auf dem Boden, nicht angeschnitten (vor Kamerafix ragte es oben heraus)',
 'rahmung-stufe2_baeckerei-1440-2d.png': 'Bäckerei mit Markise, Brezelschild, Brotkorb, Bank, Rauch; Dach vollständig unter dem HUD',
 'rahmung-stufe2_baeckerei-1440-3d.png': 'Bäckerei in 3D: Dach vollständig im Bild (Desktop-Kamerafix), Markise, Bank, Brotkorb, Brezel am Ausleger',
 'rahmung-stufe3_blumenladen-390-2d.png': 'Blumenladen rosa mit Blumenkästen, Eimern voller Schnittblumen und Schild; Park darunter',
 'rahmung-stufe3_blumenladen-390-3d.png': 'Blumenladen in 3D: Blumeneimer und Kästen, Lotte davor; Park mit Brunnen unten links',
 'rahmung-stufe3_park-1440-2d.png': 'Park: Pavillon, Brunnen, Blumenkübel, Beet, Laterne, Bank; Obstbäume seitlich, Weg an die Straße angebunden',
 'rahmung-stufe3_park-1440-3d.png': 'Park in 3D: Pavillon mit Blütenkranz, Brunnen, Beet, Bank, Laterne; nichts von Bäumen verdeckt',
 'rahmung-stufe4_villa-390-2d.png': 'Villa mit Säulen, Balkon, Fernrohr; neuer Eisenzaun mit Tor und Hecken; Falk davor',
 'rahmung-stufe4_villa-390-3d.png': 'Villa in 3D mit Zaun, Torbogen und Hecken; steht auf dem Boden, nicht angeschnitten',
 'rahmung-stufe4_villa-1440-2d.png': 'Villa 1440 2D: Zaun und Villa vollständig unter dem HUD',
 'rahmung-stufe4_villa-1440-3d.png': 'Villa 1440 3D: Fernrohr, Balkon, Säulen, Zaun im Bild',
 'rahmung-stufe5_hotel-1440-2d.png': 'Hotel drei Etagen, HOTEL-Schriftzug, zwei Fahnen, Vordach, roter Teppich',
 'rahmung-stufe5_hotel-1440-3d.png': 'Hotel 3D: Schriftzug „HOTEL“ lesbar, drei Fensterreihen mit Blumenkästen, Fahnenmasten vor dem Eingang; vordere Waldreihe berührt den Sockel knapp',
 'rahmung-stufe5_gesamt-1440-2d.png': 'Ganze Lindenstadt Stufe 5: Bäckerei, Blumenladen, Villa, Park, Hotel, Mietshäuser, Rathaus; alles frei',
 'rahmung-stufe5_gesamt-1440-3d.png': 'Stufe 5 in 3D: Oststraße mit Läden, Villa, Park und Hotelanschnitt (Gesamtbild nur in 2D gefordert)',
 'rahmung-feldstueck-1440-2d.png': 'Neues Feldstück unter dem alten Feld, vollständig im Bild',
 'rahmung-feldstueck-1440-3d.png': 'Feldstück 3D: ganze Fläche frei',
 'rahmung-wettbewerb-390-2d.png': 'Wettbewerbsstand mit Markise und Körben neben dem Rathaus, Greta daneben',
 'rahmung-wettbewerb-390-3d.png': 'Stand 3D mit Kürbissen und Wimpeln, Greta daneben',
 'rahmung-trophaeenwand-390-2d.png': 'Trophäenwand neu als Karten: drei goldene Trophäen, zwei freie Plätze gestrichelt; Sterne-Zeile lesbar',
 'rahmung-werkzeuge-390-3d.png': 'Hofausbau als Karten: Silber fertig (grün), Feldstück und Gold mit Fehlliste; Knöpfe im Bild',
 'rahmung-material-390-2d.png': 'Timos Material: Bauholz 35 G, Stein 30 G, Eisenerz 90 G mit Tageslimit; Knöpfe 1×/5×/10× im Bild',
 'rahmung-grossauftrag-390-2d.png': 'Großauftrag für Lin: Menge, Lohn, Frist, Rucksackstand lesbar; Knopf deaktiviert ohne Ware',
 'rahmung-wettbewerb_fenster-1440-2d.png': 'Wettbewerbsfenster: Gretas Zielpunkte, Zeigen-Knöpfe, Bewerten, Schließen',
 'rahmung-sterne-hud-390-2d.png': 'Hinweisbox „Lindenstadt wächst: Lottes Blumenladen und Stadtpark · 38.500 / 60.000 G“ lesbar',
 'rahmung-sterne-390-2d.png': 'Tagebuch Ziele: Stadt-Sterne, Hof-Sterne, Nächstes Ziel mit Fortschritt; lesbar',
 'wettbewerb-greta-390-3d.png': 'Banner „Erntewettbewerb gewonnen!“, Gretas Dialog 520 zu 1120 Punkte',
 'auftrag-erfuellt-390-2d.png': 'Banner „Großauftrag erfüllt! +968 G“, Hinweis lesbar',
 'stadt-bau3-390-3d.png': 'Baustelle Phase 3 morgens um 6 Uhr (dämmrig), Rohbau mit Dach',
 'hof-gold-390-3d.png': 'Goldwerkzeug: drei nebeneinander umgegrabene Beete',
}
rows = []
for f in sorted(glob.glob(os.path.join(D, '*.png'))):
    n = os.path.basename(f)
    h = hashlib.sha256(open(f, 'rb').read()).hexdigest()
    r = {'datei': os.path.relpath(f, ROOT), 'sha256': h}
    if n.startswith('fehler-'):
        r['art'] = 'Fehler-Diagnosebild (Zwischenstand vor Korrektur, kein Abnahmebeleg)'
    elif n in BEFUND:
        r['art'] = 'Abnahmebeleg, angesehen'; r['befund'] = BEFUND[n]
    else:
        r['art'] = 'Abnahmebeleg aus grünem Lauf, nicht einzeln angesehen'
    rows.append(r)
out = {'commit_geprueft': COMMIT, 'angesehen_von': 'Hermes (Kontaktbögen 2D/3D nebeneinander, Ausschnitt-Zoom bei Schildern)', 'anzahl': len(rows),
       'angesehen': sum(1 for r in rows if 'befund' in r), 'fehlerbilder': sum(1 for r in rows if r['art'].startswith('Fehler')), 'bilder': rows}
json.dump(out, open(os.path.join(D, 'MANIFEST-angesehen.json'), 'w'), ensure_ascii=False, indent=1)
print(out['anzahl'], out['angesehen'], out['fehlerbilder'])
