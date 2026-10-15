/* Reproduzierbarer lokaler Abnahmelauf, keine persönlichen Browserprofile. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),results=[];
const logic=['ausbau','wohnraum','versand','markt','riesenpflanzen'].map(f=>'tests/'+f+'.test.cjs');
const browsers=['browser','picking','regression','offline','shops','mine-rueckweg','transfer-scroll','panel-focus','desktop-rest','versand-browser','markt-browser','hinweise-browser','wohnraum-browser','riesenpflanzen-browser'];
const syntax=['jm-data.js','jm-ausbau.js','jm-art.js','jm-game.js','jm-3d.js','sw.js',...logic,...browsers.map(f=>'tests/'+f+'.cjs'),'tests/run-all.cjs'];
const commands=[...Array.from(new Set(syntax)).map(f=>['--check',f]),['--test',...logic],...browsers.map(f=>['tests/'+f+'.cjs'])];
for(const args of commands){const r=spawnSync(process.execPath,args,{cwd:root,env:process.env,encoding:'utf8',timeout:300000});const result={command:'node '+args.join(' '),exitCode:r.status,stdout:r.stdout||'',stderr:r.stderr||'',error:r.error?String(r.error):null};results.push(result);console.log(result.command,'→',r.status);process.stdout.write(result.stdout);process.stderr.write(result.stderr);if(r.status!==0)break;}
const report={node:process.version,chrome:'installierter Chrome, frische isolierte Playwright-Kontexte',commands:results,passed:results.length===commands.length&&results.every(r=>r.exitCode===0)};
fs.writeFileSync(path.join(root,'docs/GRUEN-TESTS.json'),JSON.stringify(report,null,2)+'\n');if(!report.passed)process.exitCode=1;
