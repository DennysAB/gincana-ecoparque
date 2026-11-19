"use strict";
const $=id=>document.getElementById(id);
const names=Array.from({length:9},(_,i)=>"Estación E"+(i+1));
const DEMO_STORE="ecoparque_demo_beta12";
function storedDemo(){try{return JSON.parse(localStorage.getItem(DEMO_STORE))}catch{return null}}
function saveDemo(data){localStorage.setItem(DEMO_STORE,JSON.stringify(data))}
function demoHtml(d){
 const cs=d.credentials;
 return '<h3 class="ok">Paquete de prueba disponible</h3><p><strong>Identificador:</strong> '+esc(d.kit.eventId)+'</p>'+
 '<p>Estas claves corresponden al archivo de equipo que puedes volver a descargar. Se conservarán en este navegador hasta que borres sus datos o generes otro paquete.</p>'+
 '<p><strong>Activación del equipo A:</strong> <code>'+esc(d.activation)+'</code></p>'+
 '<p><strong>Retorno:</strong> <code>'+esc(d.returnKey)+'</code></p>'+
 '<button id="redownload-kit">Volver a descargar equipo A</button>'+
 '<button id="redownload-keys" class="alt">Descargar respaldo de claves</button>'+
 '<div class="grid">'+cs.map(x=>'<div class="tile"><strong>E'+x.id+'</strong><small>Inicio</small><br><code>'+esc(x.startKey)+'</code><br><small>Validación</small><br><code>'+esc(x.finishKey)+'</code></div>').join("")+'</div>'+
 '<p class="warn">No compartas las claves con participantes. No utilices este paquete ficticio durante el evento real.</p>'
}
function showDemo(d){
 const box=$("demo-result");if(!box||!d)return;
 box.innerHTML=demoHtml(d);
 $("redownload-kit").onclick=()=>save("equipo-A-PRUEBA.json",d.kit);
 $("redownload-keys").onclick=()=>save("claves-equipo-A-PRUEBA.json",{eventId:d.kit.eventId,activation:d.activation,returnKey:d.returnKey,credentials:d.credentials});
}

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const alpha="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function key(n=12){const b=crypto.getRandomValues(new Uint8Array(n));return Array.from(b,x=>alpha[x%alpha.length]).join("")}
function b64(b){return btoa(String.fromCharCode(...b))}
async function digest(s){const b=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")}
async function seal(obj,password){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),base=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveKey"]),k=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:120000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt"]),data=await crypto.subtle.encrypt({name:"AES-GCM",iv},k,new TextEncoder().encode(JSON.stringify(obj)));return{s:b64(salt),i:b64(iv),c:b64(new Uint8Array(data))}}
function save(name,data,type="application/json"){const b=new Blob([typeof data==="string"?data:JSON.stringify(data,null,2)],{type}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function render(){let h='<section class="card"><h2>Prueba técnica rápida</h2><p>Genere un paquete ficticio del equipo A. El archivo y sus claves se guardarán en este navegador y podrán volver a descargarse.</p><button id="demo">Generar un nuevo equipo A de prueba</button><div id="demo-result"></div></section><section class="card"><h2>Contenido privado de las nueve estaciones</h2><p>Introduzca aquí los retos y las pistas definitivas. No publique los paquetes JSON ni las claves en GitHub.</p><p class="warn">Introduzca las consignas privadas y sustituya las pistas provisionales cuando se definan las ubicaciones.</p></section>';
names.forEach((name,i)=>{h+='<section class="card"><h3>E'+(i+1)+'</h3><label>Nombre secreto del reto</label><input id="title'+i+'" placeholder="Nombre de la estación"><label>Consigna del reto</label><textarea id="task'+i+'" placeholder="Descripción del desafío"></textarea><label>Pista hacia la estación siguiente</label><textarea id="clue'+i+'">Pista provisional: diríjanse a la estación E'+((i+1)%9+1)+'.</textarea></section>'});
h+='<section class="card"><button id="generate">Generar los nueve equipos y claves</button><p>Se descargarán nueve archivos JSON de equipo y un CSV de claves. El navegador podría pedir permiso para múltiples descargas.</p><p id="status" aria-live="polite"></p></section>';$("app").innerHTML=h;$("generate").onclick=generate;$("demo").onclick=generateDemo;showDemo(storedDemo())}
async function generate(){const btn=$("generate");btn.disabled=true;try{if(!crypto.subtle)throw Error("Se necesita HTTPS para generar paquetes cifrados");const eventId=key(16),csv=[["Equipo","Estacion","Inicio","Validacion","Retorno","Activacion","Fragmento"]],used=new Set();for(let t=0;t<9;t++){const team=String.fromCharCode(65+t),start=t+1,activation=key(),returnKey=key(),stages=[],fragments=[];for(let id=1;id<=9;id++){const startKey=key(),finishKey=key();let fragment;do{fragment=String(crypto.getRandomValues(new Uint32Array(1))[0]%100).padStart(2,"0")}while(used.has(team+"-"+id+"-"+fragment));used.add(team+"-"+id+"-"+fragment);fragments.push(fragment);const clue=$("clue"+(id-1)).value.trim(),task=$("task"+(id-1)).value.trim(),title=$("title"+(id-1)).value.trim();if(!title||!task||!clue)throw Error("Complete el nombre, reto y pista de todas las estaciones");stages.push({id,challenge:await seal({id,title,task},startKey),reward:await seal({id,fragment,clue},finishKey)});csv.push([team,"E"+id,startKey,finishKey,id===start?returnKey:"",id===start?activation:"",fragment])}const kit={version:1,eventId,team,start,activationHash:await digest(activation),returnHash:await digest(returnKey),stages};save("equipo-"+team+".json",kit);$("status").textContent="Paquetes preparados: "+(t+1)+" de 9"}const content="\uFEFF"+csv.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");save("claves-facilitadores.csv",content,"text/csv;charset=utf-8");$("status").textContent="Listo: nueve paquetes y CSV de claves. Guárdelos en un lugar privado."}catch(e){alert(e.message)}finally{btn.disabled=false}}

async function generateDemo(){
 const previous=storedDemo();
 if(previous&&!confirm("Ya existe un equipo A de prueba. ¿Generar otro? El nuevo archivo y sus claves serán diferentes; tendrás que volver a importarlo en el iPhone."))return;
 const btn=$("demo");btn.disabled=true;
 try{
  if(!crypto.subtle)throw Error("Abra esta página mediante HTTPS.");
  const eventId="DEMO-"+key(10),activation=key(),returnKey=key(),stages=[],credentials=[];
  for(let id=1;id<=9;id++){
   const startKey=key(),finishKey=key(),fragment=String(crypto.getRandomValues(new Uint32Array(1))[0]%100).padStart(2,"0");
   stages.push({id,
    challenge:await seal({id,title:"Reto de prueba E"+id,task:"SIMULACIÓN: el facilitador confirma verbalmente que el equipo completó la estación E"+id+"."},startKey),
    reward:await seal({id,fragment,clue:"SIMULACIÓN: continúen a la estación E"+((id%9)+1)+"."},finishKey)
   });
   credentials.push({id,startKey,finishKey,fragment});
  }
  const kit={version:1,eventId,team:"A",start:1,activationHash:await digest(activation),returnHash:await digest(returnKey),stages};
  const demo={kit,activation,returnKey,credentials};
  saveDemo(demo);
  showDemo(demo);
  save("equipo-A-PRUEBA.json",kit);
 }catch(err){alert(err.message)}
 finally{btn.disabled=false}
}

render();
