"use strict";
/* Dorfgewächshaus: verwittert → Gerüst → Glasrahmen → bepflanzt. Gleiche Motive in 3D. */
(function(){const A=window.JM.ART,old=A.prop;
A.prop=function(k,se,extra){if(k==='erinnerungsrahmen'||k==='meerregal'){const c=A.cnv(24,36),g=A.G(c);if(k==='meerregal'){g.r(1,2,22,32,'#8a5a33');for(const y of [4,15,27]){g.r(2,y,20,2,'#c29a6d');for(let i=0;i<3;i++){g.r(3+i*6,y+3,5,7,'#efe5c2');g.r(4+i*6,y+5,3,3,['#75adcb','#8fb5a5','#879ac1'][i]);}}}else{g.r(1,7,22,20,'#bf9564');g.r(3,9,18,16,'#eee2b9');g.r(5,11,14,12,'#768bab');g.disc(10,15,3,'#e99caf');g.disc(14,15,3,'#e99caf');g.r(9,16,7,4,'#e99caf');g.r(11,20,3,2,'#e99caf');g.p(18,12,'#f7e4a0');}A.outline(c,'#3a3745');return c;}if(!k.startsWith('dorfglas')&&!k.startsWith('dorfbeet_'))return old(k,se,extra);const bed=k.startsWith('dorfbeet_'),c=A.cnv(bed?24:100,bed?32:100),g=A.G(c);
 if(bed){g.r(2,21,20,8,'#8e6242');g.r(1,20,22,3,'#bf9365');g.r(4,21,16,3,'#604b38');g.r(4,29,2,3,'#6a4c37');g.r(18,29,2,3,'#6a4c37');if(k!=='dorfbeet_leer'){const tall=k==='dorfbeet_jung'?5:13;for(const x of [7,12,17]){g.r(x,22-tall,1,tall,'#478052');g.ell(x-2,24-tall,3,1.5,'#78aa63');g.ell(x+2,27-tall,3,1.5,'#65a75b');if(k==='dorfbeet_reif'){g.disc(x,22-tall,2.4,'#e9b958');g.p(x,20-tall,'#fff1bd');}}}g.r(19,15,3,7,'#f1e5bf');g.p(20,17,'#65836a');}
 else{const ruined=k==='dorfglas_alt',build=k.includes('_bau'),phase=Number(k.slice(-1))||3;
 g.r(3,90,94,8,'#9c9b8a');g.r(4,90,92,2,'#c6c6b3');g.r(8,36,84,55,ruined?'#8e9d90':'#b5d9d1');
 if(!build||phase>1)for(let y=40;y<85;y+=14)for(let x=12;x<88;x+=16){g.r(x,y,13,11,ruined?'#a2aaa0':'#c7e7e4');g.r(x+2,y+1,2,8,ruined?'#b1b8ab':'#eef9f1');}
 for(const x of [8,25,42,59,76,90])g.r(x,36,2,55,ruined?'#687b65':'#4e8a78');for(const y of [36,58,78,89])g.r(8,y,84,2,'#5d8e78');
 for(let y=0;y<28;y++){const w=24+y*2.5;g.r(50-w/2,8+y,w,1,ruined?'#718b7b':build&&phase===1?'#a48661':y%7===0?'#5d8e78':'#b4d9d2');}g.r(37,6,26,3,'#557f6d');g.r(3,35,94,3,'#416955');
 g.r(43,61,17,30,'#4e8373');g.r(46,64,11,18,'#d4ebe0');g.r(51,64,1,18,'#6c978a');g.p(56,84,'#f6d47d');g.r(40,91,24,3,'#c8c3a2');
 if(ruined){for(const [x,y]of [[13,43],[62,59],[29,75]]){g.r(x,y,15,3,'#917451');g.r(x+2,y-1,1,5,'#4e4b3d');}for(let i=0;i<7;i++){g.r(7+i*14,86,3,6,'#5e8d50');g.ell(8+i*14,85,4,3,'#6a9656');}g.r(55,20,7,13,'#62725e');}
 else if(build){g.r(4,46,92,3,'#bd9563');g.r(4,70,92,3,'#bd9563');for(const x of [5,93])g.r(x,42,2,49,'#917047');g.r(23,89,15,4,'#c6aa7d');}
 else{for(const x of [16,74]){g.r(x,85,13,6,'#b37e58');for(let j=0;j<3;j++){g.r(x+2+j*4,75-j*2,1,10+j*2,'#4f8c55');g.disc(x+2+j*4,75-j*2,2,['#edb46f','#e99bb7','#fff2c4'][j]);}}g.r(31,44,38,10,'#f4e8bf');g.r(35,47,30,1,'#62907b');g.r(39,50,22,1,'#62907b');}
 if(se===3){g.r(37,5,26,2,'#f3f7f3');g.r(4,35,92,2,'#e9f3ee');}}
A.outline(c,'#304739');return c;};})();

/* Nächtliche Überraschungen: Meteorit (3 → 1 verbleibende Schläge, mehr Risse) und Steineule. */
(function(){const A=window.JM.ART,old=A.prop;
A.prop=function(k,se,extra){
 if(/^meteorit[123]$/.test(k)){const hp=Number(k.slice(-1)),c=A.cnv(26,20),g=A.G(c);
  g.ell(13,15,12,4.5,'#5b4a3b');g.ell(13,15,10,3.4,'#3f342c');for(const [x,y] of [[2,13],[24,14],[5,18],[21,18]])g.r(x,y,2,1,'#8a7660');
  g.ell(13,11,8,7,'#4a4458');g.ell(12,9,6,5,'#5f5872');g.ell(10,7,3,2,'#7a7390');g.p(9,6,'#9d97b3');
  const cr=[[[13,6],[14,8],[13,10],[15,12]],[[9,10],[11,11],[10,13]],[[17,8],[18,10],[17,12],[18,14]]].slice(0,4-hp);
  for(const line of cr)for(const [x,y] of line){g.r(x,y,1,2,'#ffb35a');g.p(x,y,'#fff0b8');}
  for(const [x,y] of [[4,4],[21,3],[23,8]].slice(0,hp))g.p(x,y,'#ffe7a3');
  A.outline(c,'#2a2433');return c;}
 if(k==='steineule'){const c=A.cnv(18,26),g=A.G(c);
  g.r(3,21,12,4,'#8d8a82');g.r(2,20,14,2,'#a9a69c');
  g.ell(9,14,6,7,'#9b968c');g.ell(9,15,4,5,'#b2ada2');g.ell(9,7,5.5,4.5,'#9b968c');
  for(const x of [5,13]){g.r(x-1,2,2,3,'#9b968c');}
  for(const x of [7,11]){g.disc(x,7,2,'#efe9d6');g.p(x,7,'#3b3632');}g.r(9,9,1,2,'#c9a24a');
  for(const y of [14,17])g.r(7,y,4,1,'#8a857b');A.outline(c,'#4a4640');return c;}
 return old(k,se,extra);};})();
