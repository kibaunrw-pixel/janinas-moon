"use strict";
/* Dorfgewächshaus: verwittert → Gerüst → Glasrahmen → bepflanzt. Gleiche Motive in 3D. */
(function(){const A=window.JM.ART,old=A.prop;
A.prop=function(k,se,extra){if(!k.startsWith('dorfglas')&&!k.startsWith('dorfbeet_'))return old(k,se,extra);const bed=k.startsWith('dorfbeet_'),c=A.cnv(bed?24:100,bed?32:100),g=A.G(c);
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
