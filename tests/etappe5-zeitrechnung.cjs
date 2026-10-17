/* Preis-/Zeitrechnung für den Etappe-5-Bericht: Janina startet mit 38.500 G und baut Stadtstufe 2 bis 5 nacheinander.
   Annahmen wie Z.bilanz (jm-ziele.js): typischer Hof 2.200 G/Tag, Großaufträge ≈230 G/Tag, Mieten und Pachten je Stufe (Z.passiv),
   Material zum Timo-Preis gekauft (obere Grenze; Sammeln ist kostenlos). Bauzeit (Nächte) läuft parallel zum Weiterverdienen.
   Nebenbedingung Tageslimit bei Timo: höchstens 60 Holz und 60 Stein und 10 Eisen pro Tag. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},console};vm.createContext(c);
for(const f of ['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js','jm-ereignisse.js','jm-dorf.js','jm-romantik.js','jm-tiere.js','jm-cafe.js','jm-magie.js','jm-ziele.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
const J=c.window.JM,Z=J.Ziele;
const proTag=n=>Z.TYPISCH.hof+Z.TYPISCH.auftrag+Z.passiv(n);
let geld=38500,tag=0,stufe=1;const rows=[];
for(let n=2;n<=5;n++){const st=Z.STUFEN[n-1],mat=Object.entries(st.need).reduce((a,[k,q])=>a+q*Z.MATERIAL[k].p,0),kosten=st.money+mat;
 const limitTage=Math.max(...Object.entries(st.need).map(([k,q])=>Math.ceil(q/Z.MATERIAL[k].limit)));
 let spar=0;while(geld<kosten){geld+=proTag(stufe);spar++;tag++;}
 // Materialeinkauf über mehrere Tage, falls das Tageslimit greift (Verdienst läuft weiter)
 const extra=Math.max(0,limitTage-1-spar);for(let i=0;i<extra;i++){geld+=proTag(stufe);tag++;}
 geld-=kosten;const auftrag=tag;for(let i=0;i<st.days;i++){geld+=proTag(stufe);tag++;}stufe=n;
 rows.push({stufe:n,t:st.t,geld:st.money,material:mat,kosten,proTagVorher:proTag(n-1),proTagNachher:proTag(n),sparTage:spar+extra,auftragAmTag:auftrag,fertigAmTag:tag,restGeld:geld});}
console.log('DPS',J.DPS,'Jahr',J.DPS*4);console.table(rows);
console.log(JSON.stringify({DPS:J.DPS,rows,bilanz:Z.bilanz()},null,1));
