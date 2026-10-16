/* Reproduzierbarer lokaler Abnahmelauf, keine persönlichen Browserprofile. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),results=[];
const logic=['ausbau','wohnraum','versand','markt','riesenpflanzen','abgaben','stadt','briefe','ereignisse','etappe2'].map(f=>'tests/'+f+'.test.cjs');
const browsers=['browser','picking','tipp-vorrang','regression','offline','shops','mine-rueckweg','transfer-scroll','panel-focus','desktop-rest','versand-browser','markt-browser','hinweise-browser','wohnraum-browser','riesenpflanzen-browser','abgaben-browser','restaurant-browser','stadt-browser','stadt-zusatz','karten-fallback','rohstoffweg','briefe-browser','ereignisse-browser','bahnhof-browser'];
const syntax=['jm-data.js','jm-ausbau.js','jm-stadt.js','jm-post.js','jm-ereignisse.js','jm-dorf.js','jm-romantik.js','jm-art.js','jm-game.js','jm-3d.js','sw.js',...logic,...browsers.map(f=>'tests/'+f+'.cjs'),'tests/run-all.cjs'];
/* Lange Browserwege (Sekunden): mehrere Spieltage mit echten Pointerwegen in vier Ansichten. */
const LONG={'tests/stadt-browser.cjs':1800,'tests/rohstoffweg.cjs':1200,'tests/briefe-browser.cjs':3000,'tests/ereignisse-browser.cjs':4000,'tests/stadt-zusatz.cjs':600};
const commands=[...Array.from(new Set(syntax)).map(f=>['--check',f]),['--test',...logic],...browsers.map(f=>['tests/'+f+'.cjs'])];
for(const args of commands){const r=spawnSync(process.execPath,args,{cwd:root,env:process.env,encoding:'utf8',timeout:(LONG[args[0]]||300)*1000});const result={command:'node '+args.join(' '),exitCode:r.status,stdout:r.stdout||'',stderr:r.stderr||'',error:r.error?String(r.error):null};results.push(result);console.log(result.command,'→',r.status);process.stdout.write(result.stdout);process.stderr.write(result.stderr);fs.writeFileSync(path.join(root,'docs/GESAMTLAUF-ZWISCHENSTAND.json'),JSON.stringify(results.map(r=>({command:r.command,exitCode:r.exitCode,error:r.error})),null,2)+'\n');if(r.status!==0)break;}
const report={node:process.version,chrome:'installierter Chrome, frische isolierte Playwright-Kontexte',commands:results,passed:results.length===commands.length&&results.every(r=>r.exitCode===0)};
fs.writeFileSync(path.join(root,'docs/GRUEN-TESTS.json'),JSON.stringify(report,null,2)+'\n');if(!report.passed)process.exitCode=1;
