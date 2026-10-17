"use strict";
/* Etappe 5 – Pixelgrafik für Lindenstadts neue Gebäude, den Park, die Tafeln, den Wettbewerbsstand, Trophäen und Gartenblumen.
   „Mehr Liebe fürs Detail“: Bäckerei mit Markise, Brezelschild, Brotkorb und rauchendem Ofenkamin; Blumenladen mit Eimern voller
   Blumen und Blumenkästen; Villa mit Säulen, Balkon und Fernrohr auf dem Dach; Hotel mit drei Etagen, Schriftzug und Fahnen;
   Park-Pavillon, Beete, Bauschild, Auftragstafel mit Zetteln, Bautafel mit Stadtplan, Trophäenregal. */
(function(){
const A=window.JM.ART,G=A.G,cnv=A.cnv,shade=A.shade,OUT="#2b1e2a";
const FL=['#f28fb0','#f6d55c','#ffffff','#c49bf2','#e8483a','#f28f5c'];
// Kleine Pixelschrift für Schilder (3×5)
const FONT={H:['101','101','111','101','101'],O:['111','101','101','101','111'],T:['111','010','010','010','010'],E:['111','100','110','100','111'],L:['100','100','100','100','111'],B:['110','101','110','101','110'],R:['110','101','110','101','101'],A:['010','101','111','101','101'],C:['111','100','100','100','111'],K:['101','110','100','110','101'],U:['101','101','101','101','111'],M:['101','111','111','101','101'],N:['101','111','111','111','101'],I:['111','010','010','010','111'],V:['101','101','101','101','010'],P:['110','101','110','100','100'],S:['111','100','111','001','111'],D:['110','101','101','101','110'],F:['111','100','110','100','100'],G:['111','100','101','101','111']};
function text(g,x,y,t,col){for(const ch of t){const f=FONT[ch];if(f)f.forEach((row,j)=>{for(let i=0;i<3;i++)if(row[i]==='1')g.r(x+i,y+j,1,1,col);});x+=4;}}
function roof(g,y0,h,wTop,wBot,c1,c2,cx=41){for(let y=0;y<h;y++){const w=Math.round(wTop+(wBot-wTop)*y/(h-1));g.r(cx-w/2,y0+y,w,1,y%4===3?c2:c1);}}
function windowF(g,x,y,w,h,night,frame='#f4f1ea'){g.r(x-1,y-1,w+2,h+2,frame);g.r(x,y,w,h,night?'#f6d88a':'#a8d8f4');g.r(x,y,w,2,night?'#fbe6a8':'#d6eefa');g.r(x+(w>>1),y,1,h,frame);g.r(x,y+(h>>1),w,1,frame);}
function walls(g,x,y,w,h,col,line){g.r(x,y,w,h,col);g.r(x,y,w,2,shade(col,.15));for(let yy=y+6;yy<y+h;yy+=6)g.r(x,yy,w,1,line||shade(col,-.08));}
function base(g,y){g.r(3,y,76,6,'#9a948a');g.r(3,y,76,1,'#b8b0a2');for(let x=6;x<76;x+=9)g.r(x,y+2,1,3,'#857f75');}
function door(g,x,y,col){g.r(x-1,y-1,14,26,'#f4f1ea');g.r(x,y,12,25,col);g.r(x+2,y+2,8,9,shade(col,.12));g.r(x+2,y+13,8,10,shade(col,.12));g.p(x+9,y+13,'#f3c34a');g.r(x-3,y+25,18,3,'#a8a296');}
function flowers(g,x,y,w,se){g.r(x,y,w,4,'#8a5a33');g.r(x,y,w,1,'#a8743f');if(se<3)for(let i=0;i<w-1;i+=2){g.r(x+i,y-2,2,2,FL[(i>>1)%FL.length]);g.p(x+i,y-3,'#5f9a4a');}}

function sprite(kind,se,night){let c,g;const snow=se===3;
 switch(kind){
 case 'baeckerei':{c=cnv(82,100);g=G(c);base(g,90);walls(g,5,50,72,40,'#f1e2c4');
  // Ofenkamin mit Rauchwölkchen
  g.r(60,10,10,26,'#9a5a4a');g.r(59,8,12,3,'#7a4a3a');g.ell(66,4,4,3,'rgba(240,240,240,.8)');g.ell(71,1,3,2,'rgba(240,240,240,.6)');
  roof(g,18,32,46,82,snow?'#f4f8fb':'#b5523b',snow?'#dfe9f0':'#8a3a2c');
  // Markise rot-weiß über dem Schaufenster
  for(let i=0;i<10;i++)g.r(8+i*4,58,4,6,i%2?'#f4f1ea':'#d9473a');g.r(8,64,40,1,'#8a2f28');
  windowF(g,10,67,16,13,night);windowF(g,30,67,14,13,night);
  for(const [x,y] of [[12,77],[17,76],[22,77],[32,77],[38,76]]){g.ell(x,y,2.5,1.6,'#c98a4a');g.p(x-1,y-1,'#e8b86a');}
  door(g,54,64,'#8a5a33');
  // Brezelschild am Ausleger
  g.r(48,52,2,10,'#3a2a20');g.r(48,52,10,1,'#3a2a20');g.ell(55,58,4,3.5,'#c98a4a');g.ell(55,58,2,1.6,'#f1e2c4');g.p(55,55,'#c98a4a');
  // Brotkorb und Bank vor dem Laden
  g.ell(70,86,6,3,'#b07a3e');for(let i=0;i<4;i++)g.ell(66+i*3,84,1.6,1.2,'#e8b86a');
  g.r(8,84,16,2,'#a8743f');g.r(9,86,2,4,'#7a4e2a');g.r(21,86,2,4,'#7a4e2a');
  text(g,25,52,'BAECKEREI'.slice(0,0),'#3a2a20');break;}
 case 'blumenladen':{c=cnv(82,100);g=G(c);base(g,90);walls(g,5,50,72,40,'#f3d3dc');
  roof(g,20,30,50,82,snow?'#f4f8fb':'#6f8f5a',snow?'#dfe9f0':'#557446');
  g.r(30,8,22,14,snow?'#f4f8fb':'#557446');g.r(33,11,16,9,'#cfe6ff');g.r(40,11,1,9,'#f4f1ea');g.r(33,15,16,1,'#f4f1ea');
  windowF(g,10,60,16,16,night);windowF(g,56,60,16,16,night);flowers(g,9,78,19,se);flowers(g,55,78,19,se);
  door(g,35,64,'#6f8f5a');
  // Schild mit Blume
  g.r(30,52,22,8,'#f4f1ea');g.r(31,53,20,6,'#557446');g.disc(41,56,2,'#f6d55c');for(let i=0;i<5;i++){const a=i*1.26;g.p(41+Math.round(Math.cos(a)*3),56+Math.round(Math.sin(a)*2.5),'#f28fb0');}
  // Eimer mit Schnittblumen vor dem Laden
  if(!snow)for(const [x,k] of [[4,0],[12,2],[64,4],[73,1]]){g.r(x,83,7,7,'#7a8a9a');g.r(x,83,7,1,'#a8b8c8');for(let i=0;i<4;i++){g.r(x+1+i*2,79,1,4,'#4f8a3a');g.r(x+i*2,77,2,2,FL[(k+i)%FL.length]);}}
  break;}
 case 'villa':{c=cnv(82,112);g=G(c);base(g,102);walls(g,5,44,72,58,'#f4f1ea','#e2ddd2');
  roof(g,12,32,44,84,snow?'#f8fbfd':'#4a5a6e',snow?'#e6eef4':'#38475a');
  // Fernrohr-Erker auf dem Dach (Falk und die Sterne)
  g.r(34,2,14,12,'#e2ddd2');g.r(33,0,16,3,'#38475a');g.line(44,6,54,0,'#c9a46a',2);g.r(52,0,4,3,'#8a6a46');
  for(const x of [10,24,50,64]){windowF(g,x,50,10,12,night);g.r(x-2,63,14,2,'#c8c0b0');}
  // Balkon mit Geländer über der Tür
  g.r(28,66,26,3,'#c8c0b0');for(let x=29;x<54;x+=3)g.r(x,60,1,6,'#8a8070');g.r(28,60,26,1,'#8a8070');
  // Säulen und Treppe
  for(const x of [28,51])g.r(x,69,3,33,'#e8e2d4');g.r(27,68,28,2,'#d0c8b8');door(g,35,75,'#3f4f6f');
  for(const x of [10,64])windowF(g,x,74,10,14,night);
  // Hecke und Laternen
  if(!snow){g.ell(12,98,9,4,'#4f8a3a');g.ell(70,98,9,4,'#4f8a3a');g.ell(12,96,6,2,'#6faa52');g.ell(70,96,6,2,'#6faa52');}
  for(const x of [24,57]){g.r(x,84,1,14,'#3a3a44');g.r(x-1,82,3,3,night?'#ffe08a':'#e8e2d4');}
  break;}
 case 'hotel':{c=cnv(82,128);g=G(c);base(g,118);g.r(5,104,72,14,'#b8705a');for(let y=106;y<118;y+=3)for(let x=5+((y/3)%2)*3;x<77;x+=6)g.r(x,y,5,1,'#a05e4a');
  walls(g,5,40,72,64,'#e8d9b8');roof(g,14,28,52,84,snow?'#f4f8fb':'#3f5a8a',snow?'#dfe9f0':'#2f456a');
  // Fahnen auf dem Dach
  for(const x of [16,66]){g.r(x,2,1,16,'#3a3a44');g.r(x+1,2,7,4,x<40?'#d9473a':'#f6d55c');}
  // Schriftzug HOTEL
  g.r(24,22,34,9,'#2f456a');text(g,31,24,'HOTEL','#f6d55c');
  // Drei Etagen Fenster mit Blumenkästen
  for(let row=0;row<3;row++)for(const x of [9,24,50,65]){const y=46+row*19;windowF(g,x,y,9,11,night&&(row+x)%3!==0);if(row<2&&se<3){g.r(x-1,y+12,11,2,'#8a5a33');g.r(x,y+11,2,1,FL[(x+row)%6]);g.r(x+4,y+11,2,1,FL[(x+row+2)%6]);g.r(x+7,y+11,2,1,FL[(x+row+4)%6]);}}
  // Eingang mit Vordach und rotem Teppich
  g.r(30,88,22,3,'#2f456a');g.r(30,91,1,13,'#c9a46a');g.r(51,91,1,13,'#c9a46a');door(g,35,92,'#6b4423');g.r(37,117,8,10,'#b8302a');
  for(const x of [18,62]){g.ell(x,114,4,3,'#4f8a3a');g.r(x-3,114,7,4,'#8a5a33');}
  break;}
 case 'parkpavillon':{c=cnv(34,46);g=G(c);g.ell(17,40,15,5,'#c5bba6');g.ell(17,39,13,4,'#d8cfbc');
  for(const x of [5,13,21,29])g.r(x,18,2,22,'#f4f1ea');g.r(3,36,28,2,'#e8e2d4');for(let x=4;x<30;x+=3)g.r(x,32,1,4,'#e8e2d4');
  roof(g,4,15,4,34,snow?'#f4f8fb':'#557446',snow?'#dfe9f0':'#3f6a3a',17);g.r(16,0,2,5,'#c9a46a');g.disc(17,0,1.5,'#f6d55c');
  for(let i=0;i<6;i++)g.p(5+i*5,19,FL[i%6]);break;}
 case 'blumenbeet':{c=cnv(34,14);g=G(c);g.r(1,4,32,9,'#8a5a33');g.r(2,5,30,7,'#5a3a24');g.r(1,4,32,1,'#a8743f');
  if(se<3)for(let i=0;i<14;i++){const x=3+i*2,y=6+(i*5)%4;g.r(x,y+1,1,3,'#4f8a3a');g.r(x-1,y-1,3,2,FL[i%FL.length]);g.p(x,y-1,'#fff4c8');}
  else for(let i=0;i<6;i++)g.r(4+i*5,6,3,2,'#f4f8fb');break;}
 case 'stadtplan':{c=cnv(20,30);g=G(c);for(const x of [3,15])g.r(x,12,2,18,'#7a4e2a');g.r(1,2,18,14,'#7a4e2a');g.r(2,3,16,12,'#e8f0f8');
  g.r(3,8,14,1,'#c8b89a');g.r(9,4,1,10,'#c8b89a');g.r(4,4,4,3,'#d9473a');g.r(11,4,5,3,'#6f8f5a');g.r(4,10,4,3,'#3f5a8a');g.r(11,10,5,3,'#f6d55c');g.r(1,1,18,2,'#5a3a24');break;}
 case 'auftragstafel':{c=cnv(22,30);g=G(c);for(const x of [3,17])g.r(x,12,2,18,'#7a4e2a');g.r(1,1,20,15,'#8a5a33');g.r(2,2,18,13,'#c89a6a');
  for(const [x,y,col] of [[3,3,'#f4ead8'],[11,4,'#fff4c8'],[5,9,'#e8f0f8']]){g.r(x,y,7,6,col);g.r(x+1,y+2,5,1,'#8a7a6a');g.r(x+1,y+4,4,1,'#8a7a6a');g.p(x+3,y,'#d9473a');}
  g.r(0,0,22,2,'#5a3a24');break;}
 case 'bauschild':{c=cnv(18,26);g=G(c);g.r(8,10,2,16,'#7a4e2a');g.r(1,2,16,10,'#f6d55c');for(let i=0;i<4;i++)g.line(1+i*4,11,5+i*4,2,'#2b1e2a',1);g.r(3,4,12,6,'#f4f1ea');g.r(5,6,8,1,'#2b1e2a');g.r(5,8,6,1,'#2b1e2a');break;}
 case 'wettbewerbstand':{c=cnv(34,32);g=G(c);for(const x of [2,30])g.r(x,2,2,28,'#7a4e2a');g.r(2,2,30,3,'#d9473a');for(let i=0;i<7;i++)g.r(4+i*4,5,3,3,i%2?'#f6d55c':'#f4f1ea');
  g.r(1,18,32,4,'#f4f1ea');g.r(1,22,32,8,'#e8dcc0');for(let i=0;i<8;i++)g.r(1+i*4,22,2,8,'#d9473a');
  g.ell(9,16,6,3,'#b07a3e');g.disc(7,14,2.5,'#e8842a');g.disc(11,14,2,'#e8483a');g.ell(25,16,6,3,'#b07a3e');g.disc(23,14,2,'#f3c34a');g.disc(27,14,2.5,'#a8e07a');
  g.disc(17,11,3,'#f6d55c');g.r(16,14,3,3,'#c9a46a');g.r(15,17,5,1,'#8a6a46');break;}
 case 'trophaeen':{c=cnv(18,30);g=G(c);g.r(1,2,16,27,'#7a4e2a');g.r(2,3,14,25,'#a8743f');for(const y of [10,18,26])g.r(2,y,14,2,'#6b4423');
  for(const [x,y] of [[5,6],[12,6],[8,14],[5,22],[12,22]]){g.r(x-2,y-2,5,3,'#f6d55c');g.r(x-1,y+1,3,1,'#e8b84a');g.r(x,y+2,1,1,'#c9a46a');g.p(x-3,y-1,'#f6d55c');g.p(x+3,y-1,'#f6d55c');g.p(x-1,y-2,'#fff4c8');}
  break;}
 default:return null;}
 A.outline(c,OUT);return c;}
const prop0=A.prop;A.prop=function(kind,se,extra){return sprite(kind,se,extra)||prop0(kind,se,extra);};
const crop0=A.crop;A.crop=function(k,stage){if(k!=='blume')return crop0(k,stage);const c=cnv(18,26),g=G(c),B=24;
 if(stage===0){g.r(5,B-4,7,2,'#5a3a24');g.p(7,B-5,'#e8d29a');g.p(10,B-5,'#e8d29a');}
 else if(stage<3){g.r(8,B-4-stage*3,1,4+stage*3,'#4f8a3a');g.ell(6,B-3-stage*2,2,1,'#6faa52');g.ell(11,B-4-stage*2,2,1,'#6faa52');}
 else{for(const [x,h,col] of [[4,9,FL[0]],[8,13,FL[1]],[12,10,FL[3]],[15,7,FL[5]]]){g.r(x,B-h,1,h,'#4f8a3a');if(stage===4){g.disc(x,B-h-1,2,col);g.p(x,B-h-1,'#fff4c8');}else g.disc(x,B-h,1,'#8fbf6a');}g.ell(9,B-2,6,1.5,'#4f8a3a');}
 A.outline(c,'#2b3a24');return c;};
const icon0=A.icon;A.icon=function(k){if(k!=='blume'&&k!=='blume_s'&&k!=='riesig_blume')return icon0(k);const c=cnv(16,16),g=G(c);
 if(k==='blume_s'){g.r(3,3,10,11,'#f4ead8');g.r(3,3,10,3,'#c97a9a');g.disc(8,10,2.5,'#f6d55c');for(let i=0;i<5;i++){const a=i*1.26;g.p(8+Math.round(Math.cos(a)*3),10+Math.round(Math.sin(a)*3),'#f28fb0');}}
 else{for(const [x,h,col] of [[4,9,FL[0]],[8,11,FL[1]],[12,8,FL[3]]]){g.r(x,15-h,1,h,'#4f8a3a');g.disc(x,14-h,2.2,col);g.p(x,14-h,'#fff4c8');}g.r(3,12,10,3,'#c97a9a');}
 A.outline(c,'#3a2a2a');return c;};
})();
