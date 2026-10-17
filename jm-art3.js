"use strict";
/* Etappe 3 – Pixelgrafik für Café und Tiere. Erweitert JM.ART (jm-art.js) um neue Gegenstände, Möbel und Tierfiguren.
   „Mehr Liebe fürs Detail“: Café mit Markise, Fensterkästen, Schild, Theke mit Kaffeemaschine, Kuchenvitrine,
   Tafel mit Tagesangebot, Tischen mit Hängelampe, Stühlen, Pflanzen und Lichterkette. Tiere mit eigenen Posen:
   Katze schläft eingerollt in der Sonne, Ziege kaut (Kiefer bewegt sich), Ente schwimmt mit Bugwelle. */
(function(){
const A=window.JM.ART, G=A.G, cnv=A.cnv, shade=A.shade, OUT="#2b1e2a";
const flip=A.flip;
function sprite(kind,se,extra){
 let c,g;const snow=se===3;
 switch(kind){
  /* ---------- Etappe 4: Mondwald und Regenhändler ---------- */
  case 'mondtor_zu':case 'mondtor_offen':{const open=kind==='mondtor_offen';c=cnv(30,38);g=G(c);g.ell(15,30,14,7,'#42533f');g.r(5,10,20,25,'#7a7480');g.r(7,12,16,23,open?'#18203a':'#544c62');g.ell(15,12,8,9,open?'#9fc8ff':'#817694');g.ell(15,12,5,6,open?'#e8f4ff':'#615872');for(let i=0;i<7;i++)g.p(3+i*4,8+(i%3),'#b7d98a');break;}
  case 'mondpilze':{c=cnv(24,20);g=G(c);for(const [x,y,r] of [[5,13,4],[13,9,5],[20,14,3]]){g.r(x-1,y,2,6,'#dbe8e0');g.ell(x,y,r,r*.55,'#9fdcff');g.p(x-1,y-r*.2,'#ffffff');}break;}
  case 'mondsamen_fund':{c=cnv(24,24);g=G(c);g.ell(12,18,10,4,'#435b4a');for(let i=0;i<6;i++){const a=i*Math.PI/3;g.ell(12+Math.cos(a)*6,11+Math.sin(a)*4,3,5,'#6fa872');}g.disc(12,10,4,'#d9efff');g.disc(12,9,2,'#ffffff');break;}
  case 'mondsteinring':{c=cnv(34,20);g=G(c);for(let i=0;i<8;i++){const a=i*Math.PI/4;g.ell(17+Math.cos(a)*13,13+Math.sin(a)*5,3,2,'#8f8a98');}g.disc(17,10,3,'#cfe6ff');break;}
  case 'regenhaendler':{c=cnv(34,48);g=G(c);g.r(12,16,10,24,'#40556f');g.ell(17,13,7,8,'#d2a47e');g.r(9,5,16,8,'#27394f');g.r(12,1,10,7,'#334c66');g.r(6,17,22,4,'#27445d');g.line(8,20,3,42,'#6b4423',2);g.ell(3,43,6,3,'#476b82');g.r(24,23,8,15,'#8a5a33');g.r(25,25,6,3,'#cfe6ff');break;}
  /* ---------- Dorf: Teehaus vorher, Baustelle, Café ---------- */
  case 'teehaus_alt':case 'teehaus_bau':case 'cafe':{const W=82,H=78,cafe=kind==='cafe',bau=kind==='teehaus_bau';c=cnv(W,H);g=G(c);
   const wall=cafe?'#f3e2c8':'#b9ab94',wallD=cafe?'#e0c9a6':'#a1937c',roof=cafe?'#6f8f5a':'#6e625a',roofD=cafe?'#557446':'#574d46';
   g.r(3,34,76,42,wall);g.r(3,34,76,2,shade(wall,.2));for(let y=40;y<76;y+=6)g.r(3,y,76,1,wallD);
   for(let i=0;i<16;i++)g.r(1+i*1.2,32-i*1.9,80-i*2.4,2,i%2?roof:roofD);g.r(0,32,82,3,shade(roofD,-.2));if(snow)g.r(10,4,62,4,'#ffffff');
   g.r(58,6,7,14,cafe?'#9a5a3a':'#6a5a50');g.r(57,5,9,2,'#4a3a32');
   if(cafe){g.r(34,48,14,28,'#6b4423');g.r(36,50,10,24,'#8a5a33');g.r(38,52,6,8,'#ffd77a');g.p(44,64,'#f6d55c');
    for(const wx of [9,57]){g.r(wx,46,16,14,'#f0e3c8');g.r(wx+1,47,14,12,extra?'#ffd77a':'#a8d8f4');g.r(wx+7,47,1,12,'#f0e3c8');g.r(wx+1,52,14,1,'#f0e3c8');
     g.r(wx-1,60,18,4,'#8a5a33');for(let i=0;i<5;i++)g.disc(wx+1+i*3.5,59,1.6,['#e0476a','#f6d55c','#ffffff','#e0476a','#b49ae0'][i]);g.r(wx,58,16,1,'#4f8a3a');}
    for(let i=0;i<10;i++)g.r(4+i*7.4,38,7.4,6,i%2?'#f4ead8':'#d9473a');for(let i=0;i<10;i++)g.disc(7.7+i*7.4,44,3.2,i%2?'#f4ead8':'#d9473a');
    g.r(24,22,34,10,'#3a2a22');g.r(25,23,32,8,'#f4ead8');const x=g.ctx;x.fillStyle='#7a4a2e';x.font='bold 6px monospace';x.textAlign='center';x.textBaseline='middle';x.fillText('Café Mondlicht',41,27.5);
    g.disc(28,27,2,'#f6d55c');g.disc(29,26,2,'#f4ead8');}
   else{g.r(34,50,14,26,'#4a3a30');g.r(36,52,10,22,'#5a463a');for(const wx of [9,57]){g.r(wx,46,16,14,'#3a3430');g.line(wx,48,wx+15,58,'#a07a50',2);g.line(wx,58,wx+15,48,'#a07a50',2);}
    g.r(30,24,22,8,'#8a7a62');g.r(31,25,20,6,'#b8a888');g.r(34,27,14,1,'#6a5a48');g.r(10,72,8,4,'#5a7a3a');g.r(66,70,8,6,'#5a7a3a');
    if(bau){g.r(2,30,2,46,'#96613a');g.r(78,30,2,46,'#96613a');g.r(2,40,78,2,'#bf925b');g.r(2,58,78,2,'#bf925b');g.line(4,42,40,58,'#96613a',2);g.r(60,66,14,8,'#a8743f');g.r(60,66,14,2,'#c58d52');g.r(20,70,10,5,'#9d958a');}}
   break;}
  case 'kundenstopper':c=cnv(14,22);g=G(c);g.line(2,21,5,2,'#8a5a33',2);g.line(11,21,8,2,'#8a5a33',2);g.r(3,3,8,13,'#2f4a3a');g.r(4,4,6,11,'#3d5c48');g.r(5,6,4,1,'#f4f1ea');g.r(5,8,3,1,'#f4f1ea');g.r(5,10,4,1,'#f6d55c');g.disc(7,13,1.3,'#e0476a');break;
  /* ---------- Café innen ---------- */
  case 'cafe_theke':c=cnv(50,34);g=G(c);g.r(1,12,48,20,'#8a5a33');g.r(1,12,48,4,'#e9dfc8');g.r(1,15,48,1,'#c8bca2');for(let i=0;i<4;i++)g.r(4+i*11,19,8,11,'#a8743f');g.r(1,31,48,2,'#5a3a22');
   g.r(5,2,12,11,'#5a5a64');g.r(5,2,12,2,'#7a7a84');g.r(7,6,8,4,'#2a2a30');g.r(9,10,4,2,'#f4f1ea');g.p(10,9,'#7a4a2e');g.r(14,4,2,2,'#e8483a');
   g.r(22,8,7,5,'#f6d55c');g.r(23,6,5,2,'#e8b84a');g.r(31,9,6,4,'#f4f1ea');g.r(37,10,2,2,'#f4f1ea');g.r(40,4,6,9,'#c9a46a');g.r(41,2,4,2,'#8a5a33');g.r(41,6,4,1,'#f4ead8');break;
  case 'vitrine':{c=cnv(34,32);g=G(c);g.r(1,18,32,13,'#7a4a2e');g.r(1,18,32,2,'#a8743f');g.r(2,4,30,15,'#cfeaf6');g.r(2,4,30,1,'#ffffff');g.r(2,11,30,1,'#e9eef2');g.r(1,3,32,2,'#7a4a2e');
   const items=extra||[];items.slice(0,6).forEach((k,i)=>{const x=4+(i%3)*10,y=i<3?5:12;const col={mondkuchen:'#f3d77a',shake:'#f6b3c9',erdbeere:'#d9283a',suppe:'#c94a3a',kuerbissuppe:'#e8842a',nudeln:'#f0d38a',tee:'#a8c84a',rolle:'#e8b86a',ei:'#fbf6e9',milch:'#f4f1ea'}[k]||'#e8b84a';
    g.r(x,y+4,8,1,'#f4f1ea');g.ell(x+4,y+3,3.2,2,col);g.r(x+3,y+1,2,1,shade(col,.3));});
   g.r(30,6,1,10,'#ffffff');break;}
  case 'tafel':{c=cnv(34,36);g=G(c);g.r(3,4,28,22,'#7a4a2e');g.r(5,6,24,18,'#2f4a3a');g.r(5,6,24,1,'#3d5c48');g.line(6,26,3,35,'#7a4a2e',2);g.line(28,26,31,35,'#7a4a2e',2);
   const x=g.ctx;x.fillStyle='#f4f1ea';x.font='bold 5px monospace';x.textAlign='center';x.textBaseline='top';x.fillText('HEUTE',17,7);
   const items=extra||[];if(items.length)items.slice(0,3).forEach((k,i)=>{const ic=A.icon(k);x.drawImage(ic,0,0,16,16,7+i*7,14,7,7);});else{g.r(9,16,16,1,'#c8d4cc');g.r(11,19,12,1,'#c8d4cc');}
   g.disc(26,9,1.4,'#f6d55c');g.r(4,26,26,2,'#5a3a22');break;}
  case 'cafepflanze':c=cnv(18,28);g=G(c);g.r(4,18,10,9,'#c9683a');g.r(4,18,10,2,'#e8843a');g.r(5,22,8,1,'#a8542a');for(const [x,y,r,col] of [[9,12,6,'#3f8a34'],[5,9,3.5,'#5aa646'],[13,9,3.5,'#5aa646'],[9,5,3.5,'#4f9e3a'],[6,14,3,'#4f9e3a'],[12,15,3,'#3f8a34']])g.disc(x,y,r,col);g.p(7,7,'#a6dc6a');g.p(12,10,'#a6dc6a');break;
  case 'cafetisch':c=cnv(18,40);g=G(c);g.r(8,0,1,10,'#3a3a44');g.r(4,9,10,5,'#5f8f6a');g.r(5,10,8,1,'#7aa884');g.r(7,14,4,2,'#ffd77a');
   g.ell(9,27,8,3.2,'#c8945a');g.ell(9,26,7.5,2.6,'#f4ead8');for(const dx of [-4,0,4])g.p(9+dx,26,'#d9473a');g.r(8,30,2,8,'#6b4423');g.r(5,38,8,2,'#6b4423');
   g.r(8,21,2,4,'#cfe6ff');g.disc(9,20,1.6,'#e0476a');g.r(12,24,2,2,'#f4f1ea');break;
  case 'stuhl':c=cnv(14,18);g=G(c);g.r(2,1,2,12,'#7a4a2e');g.r(2,1,2,1,'#a8743f');g.r(2,9,10,3,'#a8743f');g.r(2,9,10,1,'#c58d52');g.r(3,12,2,6,'#6b4423');g.r(10,12,2,6,'#6b4423');g.r(4,10,7,1,'#d9473a');if(extra)return outline(flip(c));break;
  case 'lichterkette':{const w=(extra||12)*16;c=cnv(w,10);g=G(c);for(let x=0;x<w;x++){const y=2+Math.round(Math.sin(x/w*Math.PI*6)*1.5+1.5);g.p(x,y,'#3a3a44');if(x%10===5){g.disc(x,y+3,1.7,['#ffd77a','#ff9fb8','#a8e0ff','#c6f09a'][(x/10|0)%4]);}}return c;}
  /* ---------- Hund-Schatz, Ziege, Teich, Rettung ---------- */
  case 'pfote':c=cnv(10,8);g=G(c);const pc='#5a3c28';g.ell(3,5,1.5,1.2,pc);g.p(1,3,pc);g.p(3,2,pc);g.p(5,3,pc);g.ell(8,3,1.2,1,pc);g.p(7,1,pc);g.p(9,1,pc);return c;
  case 'grabstelle':c=cnv(18,14);g=G(c);g.ell(9,9,8,4,'#6e4e30');g.ell(9,8,6,3,'#8a6440');for(const [x,y] of [[4,6],[13,7],[9,5]])g.p(x,y,'#5a3c24');g.r(12,1,1,4,'#fff6c0');g.r(11,2,3,2,'#fff6c0');g.p(5,2,'#fff6c0');break;
  case 'leckstein':c=cnv(14,14);g=G(c);g.r(6,7,2,7,'#6b4423');g.ell(7,6,6,4,'#e8e2e8');g.ell(7,5,5,3,'#f6f2f6');g.p(4,4,'#ffffff');g.r(8,7,3,1,'#d8cfd8');break;
  case 'teichschild':c=cnv(16,26);g=G(c);g.r(7,10,2,15,'#6b4423');g.r(1,2,14,10,'#a8743f');g.r(2,3,12,8,'#e8d8b0');g.ell(8,8,4,2,'#4f8fcf');g.r(6,4,3,2,'#f3c34a');g.p(9,4,'#e8843a');g.r(3,24,10,2,'#5a7a3a');break;
  case 'teich_bau':c=cnv(18,18);g=G(c);g.ell(9,13,8,4,'#8a6a46');g.ell(8,11,6,4,'#a07a50');g.line(13,2,10,13,'#8a5a33',2);g.r(12,1,4,3,'#9aa3ad');g.r(2,12,4,3,'#9d958a');break;
  case 'entenhaus':c=cnv(18,24);g=G(c);g.r(3,10,12,12,'#c98f5a');for(let i=4;i<15;i+=3)g.r(i,10,1,12,'#a8743f');g.ell(9,17,3,3.5,'#3a2218');for(let r=0;r<8;r++){const w=4+r*2.2;g.r(9-w/2,2+r,w,1,r%2?'#5a8ab0':'#4f7aa0');}if(snow)g.r(4,2,10,3,'#ffffff');g.r(2,21,14,2,'#e8c95a');g.p(5,20,'#f3dc7a');g.p(12,20,'#f3dc7a');break;
  case 'futterstelle':c=cnv(18,14);g=G(c);g.r(1,5,16,7,'#8a5a33');g.r(2,6,14,3,'#5a3a24');if(extra){g.r(2,5,14,3,'#e8c95a');g.r(4,4,3,1,'#f3dc7a');g.r(11,4,3,1,'#f3dc7a');}g.r(1,11,2,3,'#6b4423');g.r(15,11,2,3,'#6b4423');g.r(5,0,8,3,'#4f8fcf');g.r(6,1,6,1,'#a8d8f4');break;
  case 'korb_wald':c=cnv(18,14);g=G(c);g.ell(9,9,8,4.5,'#b07a3e');for(let i=2;i<17;i+=3)g.r(i,6,1,7,'#8a5a2a');g.r(1,6,16,1,'#c8955b');g.ell(9,6,6,2,'#f4ead8');g.disc(11,4,2.5,'#e08a3a');g.p(10,3,'#2b1e2a');g.p(12,3,'#2b1e2a');g.p(9,1,'#e08a3a');g.p(13,1,'#e08a3a');break;
  case 'pflegekorb':c=cnv(20,16);g=G(c);g.ell(10,11,9,4.5,'#b07a3e');for(let i=2;i<19;i+=3)g.r(i,8,1,7,'#8a5a2a');g.r(1,8,18,1,'#c8955b');g.ell(10,8,7,2.5,'#d9707a');g.r(4,7,12,1,'#e8949c');
   g.ell(9,7,3.5,2.2,'#e08a3a');g.disc(13,5,2.4,'#e08a3a');g.p(12,4,'#2b1e2a');g.p(14,4,'#2b1e2a');g.p(11,2,'#e08a3a');g.p(15,2,'#e08a3a');g.r(5,6,3,1,'#c86a2a');break;
  default:return null;}
 return outline(c);}
function outline(c){A.outline(c,OUT);return c;}
const prop0=A.prop;A.prop=function(kind,se,extra){return sprite(kind,se,extra)||prop0(kind,se,extra);};
const icon0=A.icon;A.icon=function(k){
 if(k==='entenei'||k==='leckstein'||k==='mondkuchen'||k==='tier_ziege'||k==='mondsamen'||k==='mondblume'||k==='mondtau'){const c=cnv(16,16),g=G(c);
  if(k==='entenei'){g.ell(8,9,4.5,5.5,'#cfe8d8');g.r(10,7,1,5,'#a8c8b4');g.r(6,5,1,2,'#ffffff');}
  if(k==='leckstein'){g.ell(8,9,6,4.5,'#e8e2e8');g.ell(8,8,5,3,'#f6f2f6');g.r(7,12,2,3,'#6b4423');}
  if(k==='mondkuchen'){g.r(2,8,12,6,'#e8b86a');g.r(2,8,12,2,'#f6d79a');g.r(2,11,12,1,'#d9473a');g.disc(8,6,2.6,'#f6e6a0');g.disc(9,5,2.2,'#e8b86a');g.r(1,14,14,1,'#f4f1ea');}
  if(k==='tier_ziege'){const p=A.pet('ziege','weiss');c.getContext('2d').drawImage(p.r[0],0,0,p.r[0].width,p.r[0].height,0,1,16,14);return c;}
  if(k==='mondsamen'){g.r(3,5,10,10,'#62517a');g.r(4,3,8,3,'#403651');g.disc(8,10,3,'#cfe6ff');g.p(7,9,'#ffffff');}
  if(k==='mondblume'){g.r(7,7,2,8,'#4f8a62');for(let i=0;i<6;i++){const a=i*Math.PI/3;g.ell(8+Math.cos(a)*4,6+Math.sin(a)*3,3,2,'#9fc8ff');}g.disc(8,6,2,'#ffffff');}
  if(k==='mondtau'){g.ell(8,9,5,7,'#9fdcff');g.ell(7,7,2,3,'#ffffff');}
  A.outline(c,'#3a2a2a');return c;}
 return icon0(k);};

const crop0=A.crop;A.crop=function(k,stage){if(k!=='mondblume')return crop0(k,stage);const c=cnv(18,28),g=G(c),B=25;
 if(stage===0){g.ell(9,B,4,2,'#4b365f');g.p(8,B-2,'#d9efff');}
 else{g.r(8,B-(7+stage*3),2,7+stage*3,'#4f8a62');for(let i=0;i<3+stage;i++){const a=i*1.7;g.ell(9+Math.cos(a)*4,B-6-stage*2+Math.sin(a)*3,3,2,'#629f78');}if(stage>=3)for(let i=0;i<6;i++){const a=i*Math.PI/3;g.ell(9+Math.cos(a)*5,B-14+Math.sin(a)*4,3.5,2.2,stage===4?'#bfe3ff':'#829bc8');}if(stage>=3)g.disc(9,B-14,2.5,stage===4?'#ffffff':'#cbd7ee');}
 A.outline(c,'#243044');return c;};

/* ---------- Tierfiguren: r[0]=steht, r[1..2]=läuft, r[3..4]=Spezialpose (schläft/kaut/schwimmt), l gespiegelt ---------- */
const DUCK={wild:['#8a6a46','#3f7a4a','#5a4630'],weiss:['#f6f4ee','#f6f4ee','#d8d4cc'],gold:['#f3d04a','#f6e07a','#d9a52a']};
A.pet=function(kind,look){const fr=[];
 for(let f=0;f<5;f++){let c,g;
  if(kind==='katze'||kind==='kaetzchen'){const small=kind==='kaetzchen',b=small?'#e08a3a':'#8f8f99',d=small?'#c86a2a':'#6e6e78',l=small?'#f4c08a':'#b8b8c2';
   c=cnv(20,16);g=G(c);const sleep=f>=3;
   if(sleep){g.ell(10,11,7,3.6,b);g.ell(10,10,5,2,l);g.r(4,12,12,1,d);g.disc(14,9,3,b);g.p(13,8,'#2b1e2a');g.p(15,8,'#2b1e2a');g.p(12,6,b);g.p(16,6,b);g.line(3,11,8,13,d,1);
    if(f===4){g.p(17,2,'#ffffff');g.p(18,1,'#ffffff');g.p(16,1,'#ffffff');}}
   else{const st=f===0?0:f===1?1:-1;g.ell(9,10,5.5,3,b);g.r(5,11,2,4+(st>0?0:1),d);g.r(11,11,2,4+(st<0?0:1),d);g.r(7,12,1,3,b);g.r(13,12,1,3,b);
    g.disc(15,7,3.2,b);g.r(13,3,2,2,b);g.r(16,3,2,2,b);g.p(13,3,'#f0a8b0');g.p(17,3,'#f0a8b0');g.p(14,7,'#9ad86a');g.p(16,7,'#9ad86a');g.p(15,9,'#f0a8b0');
    g.line(4,9,1,3+(f%2),b,2);g.r(6,8,6,1,l);if(!small){g.r(8,9,1,2,d);g.r(10,9,1,2,d);}}
   if(small){c=(()=>{const s=cnv(20,16);s.getContext('2d').drawImage(c,0,0,20,16,3,4,15,12);return s;})();}}
  else if(kind==='ziege'){c=cnv(26,24);g=G(c);const W='#f2eee6',S='#d4cdc0',chew=f>=3,mouth=f===4?1:0;
   const st=f===1?1:f===2?-1:0;[[6,st],[9,-st],[16,-st],[19,st]].forEach(([x,o])=>{g.r(x,15,2,6-Math.abs(o),S);g.r(x,21-Math.abs(o),2,1,'#5a4a40');});
   g.ell(12,12,8,4.5,W);g.r(5,14,15,1,S);g.line(4,9,2,6,W,2);
   const hy=chew?6:4;g.r(19,hy+2,3,5,W);g.ell(22,hy+2,3.2,2.6,W);g.r(23,hy+3+mouth,2,2,S);g.p(22,hy+1,'#3a2a2a');g.line(20,hy-1,18,hy-4,'#b8a888',1);g.line(22,hy-1,22,hy-4,'#b8a888',1);
   g.r(23,hy+5+mouth,1,3,'#e8e2d8');g.r(19,hy+1,2,1,S);
   }
  else{const P=DUCK[look]||DUCK.wild,kid=kind==='kueken';c=cnv(18,14);g=G(c);const swim=f>=3;
   if(swim){g.ell(8,10,6.5,2.6,P[0]);g.ell(8,9,5,2,shade(P[0],.12));g.r(2,8,3,2,P[2]);g.disc(13,5,2.6,P[1]);g.r(15,5,3,2,'#f3a83a');g.p(13,4,'#1a1a1a');
    g.r(0,12,4,1,'#cfeaf6');g.r(13,12,5,1,'#cfeaf6');if(f===4){g.r(1,13,3,1,'#ffffff');g.r(14,13,3,1,'#ffffff');}}
   else{const st=f===1?1:f===2?-1:0;g.r(6,10,1,3+(st>0?0:1),'#f3a83a');g.r(9,10,1,3+(st<0?0:1),'#f3a83a');g.ell(8,8,6,3,P[0]);g.r(2,6,3,2,P[2]);g.disc(13,4,2.6,P[1]);g.r(15,4,3,2,'#f3a83a');g.p(13,3,'#1a1a1a');}
   if(kid){const s=cnv(18,14);s.getContext('2d').drawImage(c,0,0,18,14,4,5,11,9);c=s;}}
  outline(c);fr.push(c);}
 return {r:fr,l:fr.map(flip)};};
})();
