"use strict";
/* Janinas Moon – Spieldaten */
(function(){
const JM = window.JM = window.JM || {};

/* ---------- Persönliches ---------- */
JM.CONFIG = {
  spielerin: "Janina",
  von: "René",
  pudel: [ {name:"", fell:"weiss"}, {name:"", fell:"apricot"} ]
};

JM.SEASONS = ["Frühling","Sommer","Herbst","Winter"];
JM.DPS = 14;
JM.WEEK = ["Mo","Di","Mi","Do","Fr","Sa","So"];
JM.WEEKL = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

JM.FELL = {
  weiss:{n:"Weiß",c:"#f4f1ea",s:"#d2cabb",e:"#1a1a1a"},
  apricot:{n:"Apricot",c:"#e8b47a",s:"#c48d55",e:"#1a1a1a"},
  schwarz:{n:"Schwarz",c:"#35353d",s:"#222228",e:"#d9d9e3",out:"#121216"},
  grau:{n:"Grau",c:"#b0b0b8",s:"#8a8a92",e:"#1a1a1a"},
  braun:{n:"Braun",c:"#80553a",s:"#5e3c26",e:"#f0e6d8"},
  creme:{n:"Creme",c:"#f1dfbf",s:"#d0b98f",e:"#1a1a1a"},
  rot:{n:"Rot",c:"#b8582f",s:"#8a3f20",e:"#1a1a1a"}
};

JM.PLAYER_LOOK = {skin:"#f3cfae", hair:"#5a3622", style:"long", top:"#e89bb0", bot:"#4d6fa8", overall:true, shoes:"#6b3f26", clip:"#f6d55c"};
/* Kleiderschrank: Aussehen jederzeit änderbar */
JM.WARDROBE = {
  hair:[["Braun","#5a3622"],["Dunkelbraun","#3a2418"],["Schwarz","#1f1a22"],["Blond","#e3c27a"],["Rot","#b8482a"],["Kupfer","#c9783a"],["Rosa","#e89bb8"]],
  style:[["Lang","long"],["Zopf","braid"],["Bob","bob"],["Dutt","bun"],["Kurz","short"]],
  top:[["Rosa","#e89bb0"],["Mint","#8fd2b8"],["Gelb","#f3d16a"],["Lila","#b49ae0"],["Weiß","#f4f1ea"],["Rot","#d9574a"],["Himmelblau","#8fc0ea"]],
  outfit:[["Latzhose blau","ov:#4d6fa8"],["Latzhose grün","ov:#4f7a4a"],["Latzhose braun","ov:#8a5a33"],["Kleid","dr:#6b5aa8"],["Rock und Schürze","dr:#c94a5a"]],
  skin:[["Hell","#f3cfae"],["Mittel","#e3b48e"],["Gebräunt","#c99470"],["Dunkel","#8a5a3e"]]
};
JM.lookFrom = (o) => {
  const L = Object.assign({}, JM.PLAYER_LOOK);
  if(!o) return L;
  if(o.hair) L.hair=o.hair; if(o.style) L.style=o.style; if(o.top) L.top=o.top; if(o.skin) L.skin=o.skin;
  if(o.outfit){ const [k,c]=o.outfit.split(":"); L.bot=c; L.overall=k==="ov"; L.dress=k==="dr"; if(k==="dr") L.apron=c==="#c94a5a"?"#f4ead8":null; }
  return L;
};

/* ---------- Gegenstände ---------- */
JM.ITEMS = {
  zwiebel_s:{n:"Frühlingszwiebel-Samen",cat:"seed",crop:"zwiebel"},
  pakchoi_s:{n:"Pak-Choi-Samen",cat:"seed",crop:"pakchoi"},
  erdbeere_s:{n:"Erdbeer-Samen",cat:"seed",crop:"erdbeere"},
  weizen_s:{n:"Weizen-Samen",cat:"seed",crop:"weizen"},
  tomate_s:{n:"Tomaten-Samen",cat:"seed",crop:"tomate"},
  chili_s:{n:"Chili-Samen",cat:"seed",crop:"chili"},
  mais_s:{n:"Mais-Samen",cat:"seed",crop:"mais"},
  kuerbis_s:{n:"Kürbis-Samen",cat:"seed",crop:"kuerbis"},
  suesskartoffel_s:{n:"Süßkartoffel-Samen",cat:"seed",crop:"suesskartoffel"},

  zwiebel:{n:"Frühlingszwiebel",cat:"crop",sell:30,eat:6},
  pakchoi:{n:"Pak Choi",cat:"crop",sell:55,eat:8},
  erdbeere:{n:"Erdbeere",cat:"crop",sell:70,eat:12},
  weizen:{n:"Weizen",cat:"crop",sell:35},
  tomate:{n:"Tomate",cat:"crop",sell:50,eat:8},
  chili:{n:"Chili",cat:"crop",sell:45},
  mais:{n:"Mais",cat:"crop",sell:90,eat:10},
  kuerbis:{n:"Kürbis",cat:"crop",sell:260},
  suesskartoffel:{n:"Süßkartoffel",cat:"crop",sell:75,eat:10},

  ei:{n:"Ei",cat:"animal",sell:40,eat:10},
  goldei:{n:"Goldenes Ei",cat:"animal",sell:150},
  milch:{n:"Milch",cat:"animal",sell:80,eat:15},

  forelle:{n:"Forelle",cat:"fish",sell:60},
  karpfen:{n:"Karpfen",cat:"fish",sell:45},
  barsch:{n:"Barsch",cat:"fish",sell:55},
  wels:{n:"Wels",cat:"fish",sell:130},
  goldfisch:{n:"Goldfisch",cat:"fish",sell:250},
  koi:{n:"Mond-Koi",cat:"fish",sell:600},

  baerlauch:{n:"Bärlauch",cat:"forage",sell:30,eat:8},
  beeren:{n:"Waldbeeren",cat:"forage",sell:25,eat:12},
  pilz:{n:"Steinpilz",cat:"forage",sell:45,eat:8},
  bambus:{n:"Bambussprosse",cat:"forage",sell:40,eat:6},
  kastanie:{n:"Kastanie",cat:"forage",sell:35,eat:8},
  winterwurzel:{n:"Winterwurzel",cat:"forage",sell:50,eat:12},

  huhn:{n:"Hähnchenbrust",cat:"ingredient",sell:30},
  stein:{n:"Stein",cat:"mineral",sell:3},
  kupfer:{n:"Kupfererz",cat:"mineral",sell:8},
  amethyst:{n:"Amethyst",cat:"mineral",sell:60},
  mondquarz:{n:"Mondquarz",cat:"mineral",sell:140},
  duenger:{n:"Dünger",cat:"place"},
  futter:{n:"Tierfutter",cat:"misc"},
  sprinkler:{n:"Sprinkler",cat:"place"},
  mondstein:{n:"Mondstein",cat:"misc",sell:1000},
  amulett:{n:"Mondamulett",cat:"misc"},

  tee:{n:"Jasmintee",cat:"dish",eat:20,sell:20},
  rolle:{n:"Frühlingsrollen",cat:"dish",eat:35,sell:50},
  nudeln:{n:"Chinesische Nudeln mit Tempura-Chicken",cat:"dish",eat:999,sell:600},
  pakchoi_g:{n:"Gebratener Pak Choi",cat:"dish",eat:35,sell:150},
  suppe:{n:"Eier-Nudelsuppe",cat:"dish",eat:45,sell:180},
  tomatenei:{n:"Tomaten-Ei-Pfanne",cat:"dish",eat:40,sell:160},
  fisch_g:{n:"Gebratener Fisch",cat:"dish",eat:40,sell:170},
  shake:{n:"Erdbeer-Milchshake",cat:"dish",eat:45,sell:220},
  kuerbissuppe:{n:"Kürbissuppe",cat:"dish",eat:70,sell:420},
  pilzpfanne:{n:"Pilzpfanne",cat:"dish",eat:45,sell:150}
};
JM.SHIPPABLE = k => { const c=JM.ITEMS[k].cat; return (c==="crop"||c==="animal"||c==="fish"||c==="forage"||c==="dish"||c==="mineral") && JM.ITEMS[k].sell; };
JM.FISHKEYS = ["forelle","karpfen","barsch","wels","goldfisch","koi"];

/* ---------- Pflanzen ---------- */
// days = Tage bis reif, re = Tage bis zur nächsten Ernte (mehrfach erntbar), se = Jahreszeiten
JM.CROPS = {
  zwiebel:{days:3,seed:10,se:[0,1,2]},
  pakchoi:{days:4,seed:20,se:[0,1,2]},
  erdbeere:{days:6,re:3,seed:60,se:[0]},
  weizen:{days:4,seed:15,se:[0,1,2]},
  tomate:{days:6,re:3,seed:40,se:[1]},
  chili:{days:5,re:3,seed:35,se:[1]},
  mais:{days:8,re:4,seed:70,se:[1,2]},
  kuerbis:{days:9,seed:80,se:[2]},
  suesskartoffel:{days:5,seed:30,se:[2]}
};

/* ---------- Rezepte ---------- */
JM.RECIPES = [
  {k:"nudeln", fav:true, need:{weizen:2, pakchoi:1, zwiebel:1, ei:1, huhn:1}, from:"Lin"},
  {k:"pakchoi_g", need:{pakchoi:2, zwiebel:1}, start:true},
  {k:"suppe", need:{weizen:1, ei:1, zwiebel:1}, start:true},
  {k:"tomatenei", need:{tomate:2, ei:1}, from:"Kochshow im Fernsehen"},
  {k:"fisch_g", need:{fisch:1, zwiebel:1}, from:"Henk"},
  {k:"shake", need:{erdbeere:2, milch:1}, from:"Mei"},
  {k:"kuerbissuppe", need:{kuerbis:1, milch:1}, from:"Rosa"},
  {k:"pilzpfanne", need:{pilz:2, zwiebel:1}, from:"Paula"}
];

/* ---------- Werkbank ---------- */
JM.CRAFT = [
  {k:"sprinkler", n:1, need:{kupfer:5, stein:5}, d:"Gießt jeden Morgen die 8 Felder rundherum."},
  {k:"duenger", n:5, need:{stein:3, kupfer:1}, d:"Auf ein Beet streuen: Pflanzen wachsen oft einen Tag schneller."}
];

/* ---------- Herz-Ereignisse (ab 5 Herzen) ---------- */
JM.HEART = {
  mei:{lines:["Du, warte mal. Ich will dir was zeigen.","Das ist die alte Samendose meiner Oma. Sie hat jeden Frühling als Erste im Dorf gesät.","Ich glaube, sie hätte gewollt, dass jemand wie du die letzten Samen bekommt. Hier, für dich."],items:{erdbeere_s:6}},
  lin:{lines:["Komm kurz mit in die Küche. Ich probiere etwas Neues.","Mein Großvater hat immer gesagt: Ein Gericht ist erst fertig, wenn man es mit jemandem teilt.","Also, hier. Die erste Schale ist für dich."],items:{nudeln:1}},
  rosa:{lines:["Schau mal, dieses alte Foto. Das ist das Mondfest vor fünfzig Jahren.","Siehst du den Hof im Hintergrund? Das ist dein Mondhof. Damals hat dort eine Frau gelebt, die jeden im Dorf kannte.","Du erinnerst mich an sie. Behalte das hier, es lag damals in ihrem Briefkasten."],items:{mondstein:1}},
  paula:{lines:["Du kommst genau richtig! Heute Nacht ist bei mir ein Kälbchen zur Welt gekommen.","Ich war die ganze Nacht wach. Aber guck dir das an. So klein und schon so neugierig.","Hier, als Dank, dass du immer so lieb zu deinen Tieren bist."],items:{goldei:2}},
  henk:{lines:["Setz dich. Ich zeig dir was.","Siehst du, wie das Wasser im Waldsee glänzt, wenn der Mond drauf scheint? Da beißt der Koi. Nur dann.","Den Platz kennt sonst keiner. Und das hier, das ist mein bester Fang von letzter Woche."],items:{goldfisch:1}}
};

/* ---------- Erfolge ---------- */
JM.ACH = [
  {id:"ernte1", t:"Erste Ernte", d:"Ernte deine erste Pflanze"},
  {id:"ernte100", t:"Grüner Daumen", d:"Ernte 100 Pflanzen"},
  {id:"fisch5", t:"Anglerin", d:"Fange 5 verschiedene Fischarten"},
  {id:"koi", t:"Der Mond-Koi", d:"Fange den Mond-Koi"},
  {id:"lieb", t:"Lieblingsessen", d:"Koche Chinesische Nudeln mit Tempura-Chicken"},
  {id:"koch", t:"Meisterköchin", d:"Koche jedes Rezept mindestens einmal"},
  {id:"pudel", t:"Beste Freunde", d:"Erreiche bei beiden Pudeln 10 Herzen"},
  {id:"dorf", t:"Herz des Dorfes", d:"Erreiche bei allen im Dorf 5 Herzen"},
  {id:"baum", t:"Der leuchtende Wald", d:"Erfülle alle Gaben am Mondbaum"},
  {id:"quarz", t:"Glitzerfund", d:"Finde einen Mondquarz in der Höhle"},
  {id:"reich", t:"Erfolgreicher Hof", d:"Verdiene insgesamt 10.000 G"},
  {id:"jahr", t:"Ein Jahr auf dem Mondhof", d:"Erlebe alle vier Jahreszeiten"}
];

/* ---------- Läden ---------- */
JM.SHOPS = {
  markt:{npc:"mei", n:"Meis Markt", stock:[
    {k:"zwiebel_s",p:10},{k:"pakchoi_s",p:20},{k:"erdbeere_s",p:60},{k:"weizen_s",p:15},
    {k:"tomate_s",p:40},{k:"chili_s",p:35},{k:"mais_s",p:70},{k:"kuerbis_s",p:80},{k:"suesskartoffel_s",p:30},
    {k:"huhn",p:60,d:"Für das Tempura-Chicken"},
    {k:"zwiebel",p:60,d:"Wintervorrat aus dem Lager",winter:true},
    {k:"pakchoi",p:110,d:"Wintervorrat aus dem Lager",winter:true},
    {k:"weizen",p:70,d:"Wintervorrat aus dem Lager",winter:true},
    {k:"sprinkler",p:800,d:"Gießt jeden Morgen die 8 Felder rundherum",need:"bundle_fr"},
    {k:"kanne2",p:1500,d:"Große Gießkanne: 40 Füllungen",once:true}
  ]},
  nudelhaus:{npc:"lin", n:"Lins Nudelhaus", stock:[
    {k:"tee",p:30,d:"Ein heißer Tee. +20 Energie"},
    {k:"rolle",p:80,d:"Knusprig. +35 Energie"}
  ]},
  tierhof:{npc:"paula", n:"Paulas Tierhof", stock:[
    {k:"futter",p:10,d:"Für Hühner und Kühe. 1 Futter pro Tier und Tag"},
    {k:"tier_huhn",p:600,d:"Ein neues Huhn für deinen Hühnerhof (max. 6)"},
    {k:"tier_kuh",p:1500,d:"Eine Kuh für deinen Stall (max. 2)"}
  ]},
  huette:{npc:"henk", n:"Henks Hütte", stock:[
    {k:"rute2",p:2500,d:"Goldene Angel: Fische lassen sich leichter fangen",once:true}
  ]},
  rathaus:{npc:"rosa", n:"Rathaus", stock:[
    {k:"gewaechshaus",p:4000,d:"Repariert das alte Gewächshaus auf deinem Hof. Dort wächst alles, in jeder Jahreszeit.",once:true}
  ]}
};

/* ---------- Bewohner ---------- */
JM.NPCS = {
  mei:{n:"Mei", role:"Markt", home:"markt", bday:[0,5],
    look:{skin:"#f1d0b0",hair:"#1f1a22",style:"bob",top:"#f4ead8",bot:"#3b4a6b",apron:"#5aa646",shoes:"#3a2a2a"},
    love:["erdbeere","shake","baerlauch","amethyst"], like:["zwiebel","pakchoi","tomate","beeren","tee"], hate:["wels","pilzpfanne"],
    sched:[[360,[13,12]],[540,"in"],[1020,[17,12]],[1260,"off"]], free:[6], freeSched:[[480,[12,9]],[1080,[16,13]],[1200,"off"]],
    recipe:"shake",
    intro:"Oh, du bist die Neue vom Mondhof! Ich bin Mei, mir gehört der Markt. Samen, Zutaten, alles was du brauchst. Komm vorbei, wann immer du willst!",
    lines:[
      ["Frisches Saatgut ist das halbe Leben. Sagt jedenfalls meine Oma.","Pak-Choi-Samen verkaufen sich gerade super. Probier sie mal!","Ich steh seit sechs im Laden. Frühstück? Vergessen.","Jede Jahreszeit hab ich andere Samen. Schau öfter mal rein!"],
      ["Deine Pudel sind so süß. Darf ich sie mal knuddeln?","Weißt du, was ich am liebsten esse? Erdbeeren. Einfach so, direkt vom Feld.","Wenn du was brauchst, leg ich's dir zurück. Für dich mach ich das gern."],
      ["Seit du da bist, ist das Dorf viel lebendiger.","Manchmal sitz ich abends am Brunnen und schau zum Mond. Du auch?","Du bist echt meine Lieblingskundin. Sag's aber nicht den anderen!"]],
    rain:"Bei Regen kommt keiner in den Laden. Schön, dass du da bist!",
    gift:{love:"Erdbeeren?! Du kennst mich einfach. Danke!",like:"Oh, wie lieb von dir. Danke!",neutral:"Danke, das ist nett.",hate:"Hm... das ist nicht so meins. Trotzdem danke."}},
  lin:{n:"Lin", role:"Nudelhaus", home:"nudelhaus", bday:[1,3],
    look:{skin:"#e9c39a",hair:"#1f1a22",style:"short",top:"#f4f1ea",bot:"#2f2f38",scarf:"#c94a3a",hat:"chef",shoes:"#2a2a2a"},
    love:["nudeln","chili","pakchoi_g","bambus"], like:["pakchoi","ei","zwiebel","weizen","tomatenei"], hate:["shake","erdbeere"],
    sched:[[420,[18,13]],[660,"in"],[1260,[14,9]],[1380,"off"]], free:[2], freeSched:[[480,[10,21]],[1020,[17,12]],[1200,"off"]],
    recipe:"nudeln",
    intro:"Willkommen. Ich bin Lin, mir gehört das Nudelhaus. Mein Großvater hat die Nudeln hier schon von Hand gezogen. Komm hungrig wieder.",
    lines:[
      ["Gute Nudeln brauchen Geduld. Wie gutes Gemüse.","Mittwochs ist Ruhetag. Dann teste ich neue Rezepte.","Frischer Pak Choi aus der Gegend ist selten. Wenn du welchen hast, sag Bescheid."],
      ["Tempura muss knusprig sein und leicht wie eine Wolke. Das ist das ganze Geheimnis.","Deine Ernte riecht nach gutem Boden. So etwas schmeckt man.","Bring mir mal Chili. Dann koche ich etwas Scharfes für das ganze Dorf."],
      ["Du kochst inzwischen fast so gut wie ich. Fast.","Mein Großvater hätte dich gemocht.","Für dich ist hier immer ein Platz frei."]],
    rain:"Regen ist Nudelwetter. Eine heiße Schale, und der Tag ist gerettet.",
    gift:{love:"Das ist wunderbar. Damit koche ich heute Abend etwas Besonderes.",like:"Gute Qualität. Danke.",neutral:"Danke.",hate:"Hm. Das passt nicht in meine Küche."}},
  rosa:{n:"Rosa", role:"Bürgermeisterin", home:"rathaus", bday:[2,9],
    look:{skin:"#f0cfb5",hair:"#c9c4cf",style:"bun",top:"#8a5aa8",bot:"#7a4a98",dress:true,glasses:"#5a4a6a",shoes:"#3a2a3a"},
    love:["kuerbissuppe","kuerbis","tomatenei","mondquarz"], like:["tomate","mais","milch","beeren","rolle"], hate:["chili"],
    sched:[[420,[13,9]],[540,"in"],[1020,[16,13]],[1200,"off"]], free:[5,6], freeSched:[[480,[12,12]],[1140,"off"]],
    recipe:"kuerbissuppe",
    intro:"Da bist du ja! Ich bin Rosa, die Bürgermeisterin. Der Mondhof stand viel zu lange leer. Schön, dass wieder Licht in den Fenstern brennt.",
    lines:[
      ["An der Anschlagtafel hängen jeden Tag Wünsche aus dem Dorf. Schau ruhig mal vorbei.","Im Herbst feiern wir das Mondfest. Das schönste Fest des Jahres!","Im Wald südlich deines Hofes steht ein uralter Baum. Man sagt, er hört zu, wenn man ihm etwas schenkt."],
      ["Früher kamen hier jeden Abend alle am Brunnen zusammen. Vielleicht wird das ja wieder so.","Ich hab gehört, du kochst gern. Lin wird begeistert sein.","Kürbissuppe im Herbst, dafür lebe ich."],
      ["Du gehörst jetzt fest zu unserem Dorf. Das weißt du, oder?","Ich bin so froh, dass du gekommen bist.","Wenn ich mal aufhöre, hoffe ich, jemand wie du übernimmt."]],
    rain:"Regen ist gut für die Felder. Und für meinen Rosengarten.",
    gift:{love:"Oh, das ist ja herrlich! Wie aufmerksam von dir!",like:"Danke, meine Liebe!",neutral:"Danke schön.",hate:"Oh. Nun ja... danke."}},
  paula:{n:"Paula", role:"Tierhof", home:"tierhof", bday:[0,12],
    look:{skin:"#e8b991",hair:"#c0582f",style:"braid",top:"#f0e3c0",bot:"#4f7a4a",overall:true,shoes:"#5a3a24",tie:"#f6d55c"},
    love:["milch","goldei","mais"], like:["ei","kuerbis","suesskartoffel","kastanie","beeren"], hate:["chili","fisch_g"],
    sched:[[360,[21,21]],[540,"in"],[960,[20,21]],[1200,"off"]], free:[], freeSched:null,
    recipe:"pilzpfanne",
    intro:"Hey! Paula, Tierhof. Ich verkaufe Hühner, Kühe und Futter. Und ich sag's dir gleich: Wer seine Tiere jeden Tag streichelt, kriegt die besten Eier. Ist so!",
    lines:[
      ["Futter nicht vergessen! Ein hungriges Huhn legt keine Eier.","Meine Kühe hören auf Musik. Echt jetzt.","Zwei Pudel auf einem Hof? Die halten die Hühner bestimmt auf Trab."],
      ["Wenn deine Hühner richtig glücklich sind, legen sie manchmal goldene Eier.","Frische Milch am Morgen, besser geht's nicht.","Du gehst gut mit Tieren um. Das sieht man sofort."],
      ["Wenn du mal Hilfe auf dem Hof brauchst, ruf mich einfach.","Weißt du was? Du bist die Beste, die der Mondhof je hatte.","Deine Pudel lieben dich. Tiere spüren so was."]],
    rain:"Bei Regen bleiben die Kühe lieber im Stall. Ich auch, ehrlich gesagt.",
    gift:{love:"Wow! Genau das Richtige! Danke dir!",like:"Oh, cool, danke!",neutral:"Danke!",hate:"Äh... nee, das ist nichts für mich."}},
  henk:{n:"Henk", role:"Fischer", home:"huette", bday:[3,4],
    look:{skin:"#e3b48e",hair:"#e9e6e0",style:"short",beard:true,top:"#e8c33a",bot:"#3b4a6b",coat:true,hat:"cap",hatC:"#2d3a5a",shoes:"#2a2a2a"},
    love:["koi","fisch_g","wels","goldfisch"], like:["forelle","karpfen","barsch","suppe","tee","mondquarz"], hate:["erdbeere","shake"],
    sched:[[300,[9,24]],[1020,"in"],[1140,[15,13]],[1260,"off"]], free:[], freeSched:null,
    recipe:"fisch_g",
    intro:"Moin. Henk. Fischer. Seit fünfzig Jahren an diesem Fluss. ... Hier, nimm meine alte Angel. Ich hab noch drei andere.",
    lines:[
      ["Die Fische beißen am besten morgens.","Geduld. Mehr braucht man nicht zum Angeln.","Im Wald, ganz hinten rechts, ist eine alte Höhle. Da glitzert es in den Wänden.","Im Waldsee soll ein Koi leben, der im Mondlicht glänzt. Hab ihn nie gefangen."],
      ["Wenn's zieht, nicht hektisch werden. Ruhig halten. Dann hast du ihn.","Deine Hunde sitzen immer so brav neben dir. Gute Tiere.","Gebratener Fisch mit Frühlingszwiebeln. Mehr braucht man nicht."],
      ["Du bist ein guter Mensch. Sag ich nicht oft.","Komm, setz dich. Wir schweigen ein bisschen zusammen.","Wenn ich den Mond-Koi doch noch fange, bekommst du ihn."]],
    rain:"Regen? Bestes Angelwetter.",
    gift:{love:"...Hm. Das ist gut. Wirklich gut. Danke.",like:"Danke.",neutral:"Mhm.",hate:"Nee. Lass mal."}}
};
JM.NPC_ORDER = ["mei","lin","rosa","paula","henk"];

/* ---------- Feste ---------- */
JM.FESTS = [
  {id:"blumen", n:"Blumenfest", s:0, d:8, from:540, to:1080, desc:"Das Dorf feiert den Frühling mit Blumen und Tanz auf dem Dorfplatz."},
  {id:"feuerwerk", n:"Sommerfeuerwerk", s:1, d:10, from:1140, to:1350, desc:"Abends gibt es Feuerwerk über dem Dorfplatz."},
  {id:"mond", n:"Mondfest", s:2, d:14, from:1080, to:1380, desc:"Das schönste Fest des Jahres. Laternen steigen zum Vollmond auf."},
  {id:"sterne", n:"Sternennacht", s:3, d:10, from:1080, to:1320, desc:"Im Winter beschenken sich alle unter den Sternen."}
];

/* ---------- Gaben am Mondbaum ---------- */
JM.BUNDLES = [
  {id:"fr", n:"Frühlingsgabe", need:{zwiebel:5,pakchoi:3,erdbeere:2,baerlauch:1}, rew:"3 Sprinkler, und Mei verkauft ab jetzt Sprinkler"},
  {id:"ho", n:"Hofgabe", need:{ei:5,milch:2}, rew:"+30 maximale Energie"},
  {id:"fl", n:"Flussgabe", need:{forelle:1,karpfen:1,barsch:1}, rew:"Die goldene Angel"},
  {id:"so", n:"Sommergabe", need:{tomate:3,chili:3,mais:2}, rew:"Die große Gießkanne"},
  {id:"he", n:"Herbstgabe", need:{kuerbis:1,suesskartoffel:3,pilz:2}, rew:"Das Gewächshaus wird repariert"}
];

/* ---------- Fische ---------- */
// dif: Schwierigkeit 0..1, at: Gewässer, rare: Seltenheit
JM.FISH = {
  karpfen:{dif:.22, at:["teich","fluss"]},
  barsch:{dif:.38, at:["teich","dorf","see"]},
  forelle:{dif:.34, at:["dorf","fluss"]},
  wels:{dif:.6, at:["dorf","see"], night:true},
  goldfisch:{dif:.55, at:["teich","see"], rare:.12},
  koi:{dif:.82, at:["see"], rare:.07}
};
JM.FORAGE = [["baerlauch","bambus"],["beeren","bambus"],["pilz","kastanie"],["winterwurzel"]];

/* ---------- Tipps im Fernsehen ---------- */
JM.TIPS = [
  "Wisch mit dem Finger über mehrere Beete, dann arbeitest du sie alle nacheinander ab.",
  "Gegossene Beete sind dunkel. Nur gegossene Pflanzen wachsen über Nacht.",
  "Erdbeeren, Tomaten, Chili und Mais kannst du mehrmals ernten.",
  "Tiere, die jeden Tag gestreichelt werden, sind glücklicher. Glückliche Hühner legen manchmal goldene Eier.",
  "An Regentagen musst du nicht gießen.",
  "Wenn die Energie knapp wird, iss etwas aus dem Rucksack.",
  "Jede Person im Dorf freut sich über Geschenke. Am Geburtstag zählt ein Geschenk dreifach.",
  "Wenn beim Angeln ein Ausrufezeichen erscheint, tippe schnell. Dann halte den Fisch im grünen Bereich.",
  "Pflanzen, die nicht zur neuen Jahreszeit passen, gehen beim Wechsel ein. Plane die letzten Tage gut.",
  "Deine Pudel finden manchmal Dinge für dich, wenn sie dich sehr mögen.",
  "Samstags ist Markttag auf dem Dorfplatz. Am eigenen Stand verkaufst du teurer, und jeder Verkauf lockt mehr Kundschaft an.",
  "Im Kleiderschrank kannst du jederzeit Frisur, Haarfarbe und Kleidung ändern.",
  "In der Mondhöhle hinten im Wald findest du Kupfer und Edelsteine. An der Werkbank im Haus baust du daraus Sprinkler und Dünger.",
  "Im Tagebuch unter Karte kannst du mit der Kutsche schnell zwischen Hof, Dorf, Wald und Höhle reisen."
];

/* ---------- Tagesziele ---------- */
// ev: Ereignis, n: Anzahl, need: Voraussetzung
JM.DAILY = [
  {k:"pet", t:"Streichle beide Pudel", ev:"petdog", n:2, uniq:true, g:50},
  {k:"water", t:"Gieße 8 Beete", ev:"water", n:8, g:60, need:"crops"},
  {k:"harvest", t:"Ernte 3 Pflanzen", ev:"harvest", n:3, g:80, need:"ripe"},
  {k:"talk", t:"Sprich mit 2 Leuten im Dorf", ev:"talk", n:2, uniq:true, g:70, need:"met"},
  {k:"gift", t:"Mach jemandem ein Geschenk", ev:"gift", n:1, g:80, need:"met"},
  {k:"fish", t:"Fang einen Fisch", ev:"fish", n:1, g:90, need:"rod"},
  {k:"forage", t:"Sammle 2 Fundstücke", ev:"forage", n:2, g:70},
  {k:"egg", t:"Sammle 2 Eier", ev:"egg", n:2, g:60, need:"eggs"},
  {k:"ship", t:"Leg etwas in die Versandkiste", ev:"ship", n:1, g:50},
  {k:"cook", t:"Koche ein Gericht", ev:"cook", n:1, g:90, need:"cook"},
  {k:"board", t:"Erfülle den Wunsch an der Anschlagtafel", ev:"board", n:1, g:100, need:"board"},
  {k:"mine", t:"Bau 5 Steine in der Höhle ab", ev:"mine", n:5, g:70, need:"cave"}
];

/* ---------- Hauptgeschichte ---------- */
// ev: Ereignis, das zählt. tg: Ziel für den Pfeil.
JM.QUESTS = [
  {id:"brief", t:"Ein Brief für dich", d:"Lies den Brief, der auf dem Tisch liegt.", ev:"letter", n:1, tg:"house"},
  {id:"pudel", t:"Alte Freunde", d:"Tippe {d0} und {d1} an und wähle Streicheln. Sie spielen am Haus. Willst du sie dabeihaben, wähle Mitkommen lassen.", ev:"petdog", n:2, uniq:true, tg:"dogs"},
  {id:"raeumen", t:"Das Feld freiräumen", d:"Tippe auf Unkraut, Steine und Äste im Feld, um sie wegzuräumen.", ev:"clear", n:5, tg:"debris"},
  {id:"hacken", t:"Beete anlegen", d:"Tippe auf freie Feldstücke, um sie umzugraben. Du kannst auch mit dem Finger über mehrere wischen.", ev:"till", n:6, tg:"field"},
  {id:"saeen", t:"Die erste Saat", d:"Wähle unten die Frühlingszwiebel-Samen und tippe auf die umgegrabenen Beete.", ev:"plant", n:6, tg:"tilled", hold:"zwiebel_s"},
  {id:"giessen", t:"Wasser marsch", d:"Wähle unten die Hand und tippe auf die Beete, um sie zu gießen. Ist die Kanne leer, tippe auf den Teich.", ev:"water", n:6, tg:"dry", hold:"auto"},
  {id:"schlafen", t:"Feierabend", d:"Gut gemacht! Geh ins Haus und schlaf. Gegossene Pflanzen wachsen über Nacht.", ev:"sleep", n:1, tg:"house"},
  {id:"eier", t:"Frische Eier", d:"Geh in den Hühnerhof und sammle 2 Eier ein. Füll auch den Futtertrog auf.", ev:"egg", n:2, tg:"eggs"},
  {id:"dorf", t:"Ab ins Dorf", d:"Folge dem Weg nach Osten ins Dorf und sprich mit Mei.", ev:"talk_mei", n:1, tg:"npc:mei", reward:{items:{pakchoi_s:6,weizen_s:4}, text:"Mei schenkt dir 6 Pak-Choi- und 4 Weizen-Samen."}},
  {id:"nachbarn", t:"Neue Nachbarn", d:"Stell dich Lin, Rosa, Paula und Henk vor.", ev:"meet", n:4, uniq:true, tg:"npc:unmet", reward:{g:300, text:"Rosa heißt dich mit 300 G im Dorf willkommen."}},
  {id:"angeln", t:"Petri Heil", d:"Henk hat dir eine Angel geschenkt. Wähle sie unten aus und tippe auf Wasser, zum Beispiel den Teich auf deinem Hof. Erscheint das !, tippen. Dann gedrückt halten, damit der grüne Balken beim Fisch bleibt.", ev:"fish", n:1, tg:"water", hold:"rute"},
  {id:"wald", t:"Der Mondbaum", d:"Während deine Pflanzen wachsen: Rosa erzählt von einem alten Baum im Wald. Geh vom Hof nach Süden und finde ihn. Unterwegs liegen Fundstücke.", ev:"mondbaum", n:1, tg:"mondbaum"},
  {id:"ernte", t:"Erste Ernte", d:"Gieß deine Pflanzen jeden Tag. Wenn sie reif sind, tippe sie an.", ev:"harvest", n:6, tg:"ripe"},
  {id:"versand", t:"Ab in die Kiste", d:"Leg Ernte in die Versandkiste neben dem Haus. Das Geld kommt am nächsten Morgen.", ev:"ship", n:1, tg:"box"},
  {id:"lin", t:"Lins Geheimrezept", d:"Bring Lin einen Pak Choi als Geschenk. Wähl ihn unten aus und tippe Lin an.", ev:"gift_lin_pakchoi", n:1, tg:"npc:lin"},
  {id:"lieblingsessen", t:"Dein Lieblingsessen", d:"Koche Chinesische Nudeln mit Tempura-Chicken. Du brauchst 2 Weizen, Pak Choi, Frühlingszwiebel, ein Ei und Hähnchenbrust von Mei.", ev:"cook_nudeln", n:1, tg:"house"},
  {id:"gabe", t:"Eine Gabe für den Baum", d:"Leg am Mondbaum alle Dinge für eine Gabe ab. Am schnellsten geht die Flussgabe: eine Forelle, ein Karpfen und ein Barsch. Die gibt es das ganze Jahr.", ev:"bundle", n:1, tg:"mondbaum"},
  {id:"tier", t:"Zuwachs", d:"Kauf bei Paula ein neues Tier.", ev:"buyanimal", n:1, tg:"npc:paula"},
  {id:"freunde", t:"Gute Freunde", d:"Erreiche bei einer Person im Dorf 3 Herzen. Reden und Geschenke helfen.", ev:"hearts3", n:1, tg:null},
  {id:"mondfest", t:"Das Mondfest", d:"Am 14. Herbst feiert das Dorf das Mondfest. Sei ab 18 Uhr auf dem Dorfplatz und sprich mit Rosa.", ev:"fest_mond", n:1, tg:"fest"},
  {id:"frei", t:"Dein Hof, deine Geschichte", d:"Kapitel 1 ist geschafft! Fülle alle Gaben am Mondbaum, fang den Mond-Koi und schließ Freundschaft mit allen.", ev:"never", n:1, tg:null}
];

/* ---------- Karten ---------- */
// Kachelarten
const T = JM.T = {GRAS:0, TUFF:1, BLUME:2, WEG:3, PLATZ:4, SAND:5, FELD:6, WASSER:7, ZAUN:8, BLOCK:9, BAUM:10, STEG:11, GLAS:12, WALD:14, FELS:15, HBODEN:16};
JM.WALK = new Set([0,1,2,3,4,5,6,11,12,14,16]);

function grid(w,h,v){ const a=[]; for(let y=0;y<h;y++) a.push(new Array(w).fill(v)); return a; }
function mk(id,w,h,base){
  const m={id,w,h,t:grid(w,h,base),obj:[],exits:[],trees:[],lights:[]};
  m.rect=(x0,y0,x1,y1,v)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(y>=0&&x>=0&&y<h&&x<w) m.t[y][x]=v; };
  m.tree=(x,y,kind)=>{ if(x<0||y<0||x>=w||y>=h) return; m.t[y][x]=T.BAUM; m.trees.push({x,y,kind:kind||"oak",v:(x*7+y*13)%5}); };
  m.ring=(x0,y0,x1,y1)=>{ for(let x=x0;x<=x1;x++){ m.t[y0][x]=T.ZAUN; m.t[y1][x]=T.ZAUN; } for(let y=y0;y<=y1;y++){ m.t[y][x0]=T.ZAUN; m.t[y][x1]=T.ZAUN; } };
  m.add=(o)=>{ m.obj.push(o); for(let y=o.y;y<o.y+(o.h||1);y++) for(let x=o.x;x<o.x+(o.w||1);x++) m.t[y][x]=T.BLOCK; return o; };
  m.deco=(fn)=>{ for(let y=0;y<h;y++) for(let x=0;x<w;x++) fn(x,y); };
  return m;
}
const H=(x,y,n)=>(((x*73856093)^(y*19349663)^(n*83492791))>>>0)%1000;

JM.buildMaps = function(){
  const maps={};
  /* --- Hof --- */
  const f=mk("farm",28,32,T.GRAS);
  for(let x=0;x<28;x++){ f.tree(x,0,(x%3)?"oak":"pine"); f.tree(x,1,(x%4)?"pine":"oak"); f.tree(x,30,"oak"); f.tree(x,31,"pine"); }
  for(let y=2;y<30;y++){ f.tree(0,y,"pine"); f.tree(1,y,y%3?"oak":"pine"); f.tree(26,y,"oak"); f.tree(27,y,"pine"); }
  f.trees=f.trees.filter(t=>!((t.x>=26&&(t.y===15||t.y===16))||((t.x===13||t.x===14)&&t.y>=30)));
  f.rect(26,15,27,16,T.WEG); f.rect(13,30,14,31,T.WEG);
  f.rect(3,10,11,19,T.FELD);
  f.rect(5,7,5,8,T.WEG); f.rect(5,8,13,8,T.WEG); f.rect(13,8,13,31,T.WEG); f.rect(14,30,14,31,T.WEG);
  f.rect(13,12,16,12,T.WEG); f.rect(13,14,22,14,T.WEG); f.rect(13,15,27,16,T.WEG); f.rect(13,15,13,16,T.WEG);
  f.rect(18,19,22,22,T.WASSER); f.rect(17,20,17,21,T.WASSER); f.rect(23,20,23,21,T.WASSER);
  f.ring(14,6,18,11); f.rect(15,7,17,10,T.GRAS); f.t[11][16]=T.WEG; f.t[6][16]=T.GRAS;
  f.ring(20,7,25,13); f.rect(21,8,24,12,T.GRAS); f.t[13][22]=T.WEG; f.t[7][22]=T.GRAS; f.t[7][23]=T.GRAS;
  f.rect(16,24,21,26,T.GLAS);
  f.add({k:"house",x:3,y:3,w:5,h:4,door:[5,7],act:"house"});
  f.add({k:"coop",x:15,y:3,w:3,h:3,door:[16,6],act:"coop"});
  f.add({k:"barn",x:21,y:3,w:4,h:4,door:[22,7],act:"barn"});
  f.add({k:"mailbox",x:7,y:7,act:"mail"});
  f.add({k:"box",x:9,y:7,act:"ship"});
  f.add({k:"doghouse",x:2,y:8,act:"doghouse"});
  f.add({k:"trough",x:17,y:7,act:"trough_h"});
  f.add({k:"trough",x:24,y:8,act:"trough_c"});
  [[3,22],[4,25],[2,27],[24,27],[25,23],[11,26],[10,4]].forEach(([x,y])=>f.add({k:"bush",x,y,act:"bush"}));
  [[23,18],[24,24],[8,24],[6,28],[20,28],[12,4],[19,2],[3,21],[9,22]].forEach(([x,y])=>{ if(f.t[y][x]===T.GRAS) f.tree(x,y,(x+y)%3?"oak":"fruit"); });
  f.deco((x,y)=>{ if(f.t[y][x]===T.GRAS){ const h=H(x,y,1); if(h<70) f.t[y][x]=T.TUFF; else if(h<95) f.t[y][x]=T.BLUME; } });
  f.exits=[{x:27,y:15,to:"village",tx:1,ty:9},{x:27,y:16,to:"village",tx:1,ty:10},{x:13,y:31,to:"forest",tx:13,ty:2},{x:14,y:31,to:"forest",tx:14,ty:2}];
  f.coop={x0:15,y0:7,x1:17,y1:10}; f.pasture={x0:21,y0:8,x1:24,y1:12};
  f.spawn=[5,8]; f.water="teich";
  maps.farm=f;

  /* --- Dorf --- */
  const v=mk("village",32,28,T.GRAS);
  for(let x=0;x<32;x++){ v.tree(x,0,"oak"); v.tree(x,1,x%3?"oak":"pine"); v.tree(x,26,"oak"); v.tree(x,27,"pine"); }
  for(let y=2;y<26;y++){ v.tree(0,y,"pine"); v.tree(1,y,"oak"); v.tree(30,y,"oak"); v.tree(31,y,"pine"); }
  v.trees=v.trees.filter(t=>!(t.x<=1&&(t.y===9||t.y===10)));
  v.rect(0,9,11,10,T.WEG);
  v.rect(12,7,19,14,T.PLATZ);
  v.rect(6,6,6,8,T.WEG); v.rect(6,8,11,8,T.WEG);
  v.rect(14,6,14,6,T.PLATZ);
  v.rect(23,6,23,8,T.WEG); v.rect(20,8,23,8,T.WEG);
  v.rect(16,15,16,21,T.WEG); v.rect(5,20,27,21,T.WEG);
  v.rect(2,22,29,22,T.SAND); v.rect(2,23,29,25,T.WASSER);
  v.rect(9,22,9,24,T.STEG);
  v.ring(18,15,22,19); v.rect(19,16,21,18,T.GRAS);
  v.add({k:"markt",x:3,y:3,w:5,h:3,door:[6,6],act:"shop:markt"});
  v.add({k:"nudelhaus",x:12,y:2,w:5,h:4,door:[14,6],act:"shop:nudelhaus"});
  v.add({k:"rathaus",x:21,y:2,w:6,h:4,door:[23,6],act:"shop:rathaus"});
  v.add({k:"tierhof",x:23,y:16,w:5,h:4,door:[25,20],act:"shop:tierhof"});
  v.add({k:"huette",x:3,y:16,w:4,h:4,door:[5,20],act:"shop:huette"});
  v.add({k:"fountain",x:15,y:10,w:2,h:2,act:"fountain"});
  v.add({k:"board",x:18,y:6,act:"board"});
  v.add({k:"stall",x:12,y:10,w:1,h:2,act:"stall"});
  [[12,7],[19,7],[12,14],[19,14],[8,10],[24,9]].forEach(([x,y])=>v.add({k:"lamp",x,y,act:"lamp"}));
  [[9,3],[18,3],[28,6],[28,12],[10,15],[2,13],[27,13],[9,18],[13,18],[28,19],[2,6]].forEach(([x,y])=>{ if(v.t[y][x]===T.GRAS) v.tree(x,y,(x+y)%2?"oak":"fruit"); });
  v.deco((x,y)=>{ if(v.t[y][x]===T.GRAS){ const h=H(x,y,2); if(h<60) v.t[y][x]=T.TUFF; else if(h<110) v.t[y][x]=T.BLUME; } });
  v.exits=[{x:0,y:9,to:"farm",tx:26,ty:15},{x:0,y:10,to:"farm",tx:26,ty:16}];
  v.pen={x0:19,y0:16,x1:21,y1:18};
  v.spawn=[2,9]; v.water="dorf";
  maps.village=v;

  /* --- Wald --- */
  const w=mk("forest",28,26,T.WALD);
  for(let x=0;x<28;x++){ w.tree(x,0,"pine"); w.tree(x,1,"pine"); w.tree(x,24,"pine"); w.tree(x,25,"oak"); }
  for(let y=2;y<24;y++){ w.tree(0,y,"pine"); w.tree(1,y,"oak"); w.tree(26,y,"pine"); w.tree(27,y,"oak"); }
  w.trees=w.trees.filter(t=>!((t.x===13||t.x===14)&&t.y<=1));
  w.rect(13,0,14,10,T.WEG);
  w.rect(2,11,25,13,T.WASSER); w.rect(13,11,14,13,T.STEG);
  w.rect(13,14,14,16,T.WEG);
  w.rect(10,16,17,21,T.GRAS); w.rect(11,17,16,20,T.BLUME);
  w.add({k:"mondbaum",x:13,y:18,w:2,h:2,act:"mondbaum"});
  w.rect(15,4,24,5,T.WEG); w.add({k:"cave",x:23,y:2,w:2,h:2,act:"cave_in"});
  w.rect(19,16,24,21,T.WASSER); w.rect(18,17,18,20,T.WASSER); w.rect(20,15,23,15,T.WASSER);
  w.deco((x,y)=>{ if(w.t[y][x]===T.WALD){ const h=H(x,y,3); const nearPath=(Math.abs(x-13.5)<3&&y<11)||(x>=9&&x<=18&&y>=14&&y<=22);
    if(!nearPath&&h<130) w.tree(x,y,h%3?"pine":"oak"); else if(h<200) w.t[y][x]=T.TUFF; else if(h<230) w.t[y][x]=T.BLUME; } });
  [[6,5],[20,4],[8,17],[22,8],[4,20]].forEach(([x,y])=>{ if(w.t[y][x]===T.WALD||w.t[y][x]===T.TUFF) w.add({k:"bush",x,y,act:"bush"}); });
  w.exits=[{x:13,y:0,to:"farm",tx:13,ty:29},{x:14,y:0,to:"farm",tx:14,ty:29},{x:24,y:4,to:"hoehle",tx:10,ty:14}];
  w.spawn=[13,2]; w.water="fluss";
  maps.forest=w;

  /* --- Mondhöhle --- */
  const h=mk("hoehle",22,18,T.FELS);
  h.rect(2,2,19,15,T.HBODEN); h.rect(9,15,11,16,T.HBODEN);
  [[5,5],[6,5],[5,6],[14,4],[15,4],[15,9],[8,11],[9,11],[16,13],[4,12],[12,7]].forEach(([x,y])=>h.t[y][x]=T.FELS);
  h.add({k:"leiter",x:10,y:16,act:"cave_out"});
  h.exits=[];
  h.spawn=[10,14]; h.cave=true;
  maps.hoehle=h;
  return maps;
};
JM.waterKind = (map,x,y) => map==="forest" ? (x>=18&&y>=14?"see":"fluss") : map==="village" ? "dorf" : "teich";
})();
