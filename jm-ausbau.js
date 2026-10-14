"use strict";
/* Kleine gemeinsam von Spiel und Node-Tests verwendete Ausbau-Regeln. */
(function(){
const JM=window.JM, X=JM.Ausbau={};
X.food=k=>!!JM.ITEMS[k]&&['crop','animal','fish','forage','dish','ingredient'].includes(JM.ITEMS[k].cat);
X.transfer=function(s,k,n,into){
 if(!X.food(k)||!Number.isSafeInteger(n)||n<=0)return false;
 const a=into?s.inv:s.fridge,b=into?s.fridge:s.inv;
 if((a[k]||0)<n||!Number.isSafeInteger((b[k]||0)+n))return false;
 a[k]-=n;if(!a[k])delete a[k];b[k]=(b[k]||0)+n;return true;
};
X.count=(s,k)=>k==='fisch'?JM.FISHKEYS.reduce((n,f)=>n+X.count(s,f),0):(s.inv[k]||0)+((s.fridge||{})[k]||0);
X.plan=function(s,need){
 const bags=[Object.assign({},s.inv),Object.assign({},s.fridge||{})];
 // Konkrete Arten zuerst reservieren, Sammelkategorie darf sie nicht doppelt zählen.
 const entries=Object.entries(need).sort(([a],[b])=>(a==='fisch')-(b==='fisch'));
 for(const [k,n] of entries){
  if(!Number.isSafeInteger(n)||n<=0)return null;
  let left=n;for(const id of k==='fisch'?JM.FISHKEYS:[k])for(const bag of bags){const take=Math.min(left,bag[id]||0);if(take){bag[id]-=take;if(!bag[id])delete bag[id];left-=take;}}
  if(left)return null;
 }return bags;
};
X.cook=function(s,r){
 if(!r||!s.recipes.includes(r.k))return false;
 const bags=X.plan(s,r.need);if(!bags)return false;
 s.inv=bags[0];s.fridge=bags[1];s.inv[r.k]=(s.inv[r.k]||0)+1;return true;
};
// Grundzutaten sind eine teurere Alternative zur eigenen Ernte, nie Saison-Saatgut ersetzen.
for(const k of new Set(JM.RECIPES.flatMap(r=>Object.keys(r.need)).filter(k=>k!=='fisch'))){
 const stock=JM.SHOPS.markt.stock.find(s=>s.k===k);
 if(stock){delete stock.winter;stock.d='Ganzjähriger Küchenvorrat';}
 else JM.SHOPS.markt.stock.push({k,p:Math.ceil(JM.ITEMS[k].sell*2.2),d:'Ganzjähriger Küchenvorrat · Eigenanbau/Tierhaltung lohnt sich'});
}
})();
