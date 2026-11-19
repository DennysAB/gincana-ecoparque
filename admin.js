"use strict";
const $=id=>document.getElementById(id);
const names=["El pasaporte destruido","La maleta imposible","El mapa de las siete piezas","La torre del explorador","La ruta que nadie encuentra","El espejo del espía","Operación silencio absoluto","El robo de la brújula dorada","La bóveda de los nueve secretos"];
const descriptions=[
"Reconstruyan las doce piezas del pasaporte y descubran el código oculto.",
"Seleccionen los objetos que satisfacen todas las restricciones de peso y utilidad.",
"Observen diez segundos la silueta y reconstrúyanla con las siete piezas del tangram.",
"Construyan una torre de vasos con cuerdas y aro, sin tocar los vasos directamente.",
"Determinen la única ruta que cumple todas las restricciones.",
"Descifren la escritura en espejo y el desplazamiento alfabético.",
"Transmitan seis símbolos mediante gestos, sin hablar ni escribir.",
"Identifiquen al responsable, la hora y el escondite mediante una matriz lógica.",
"Resuelvan la cuadrícula numérica y determinen la secuencia final."
];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const alpha="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function key(n=12){const b=crypto.getRandomValues(new Uint8Array(n));return Array.from(b,x=>alpha[x%alpha.length]).join("")}
function b64(b){return btoa(String.fromCharCode(...b))}
async function digest(s){const b=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")}
async function seal(obj,password){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),base=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveKey"]),k=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:120000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt"]),data=await crypto.subtle.encrypt({name:"AES-GCM",iv},k,new TextEncoder().encode(JSON.stringify(obj)));return{s:b64(salt),i:b64(iv),c:b64(new Uint8Array(data))}}
function save(name,data,type="application/json"){const b=new Blob([typeof data==="string"?data:JSON.stringify(data,null,2)],{type}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function render(){let h='<section class="card"><h2>Contenido privado de las nueve estaciones</h2><p>Introduzca aquí los retos y las pistas definitivas. No publique los paquetes JSON ni las claves en GitHub.</p><p class="warn">Los textos iniciales son consignas provisionales; sustituya las pistas cuando se definan las ubicaciones.</p></section>';
names.forEach((name,i)=>{h+='<section class="card"><h3>E'+(i+1)+' · '+esc(name)+'</h3><label>Consigna del reto</label><textarea id="task'+i+'">'+esc(descriptions[i])+'</textarea><label>Pista hacia la estación siguiente</label><textarea id="clue'+i+'">Pista provisional: diríjanse a la estación E'+((i+1)%9+1)+'.</textarea></section>'});
h+='<section class="card"><button id="generate">Generar los nueve equipos y claves</button><p>Se descargarán nueve archivos JSON de equipo y un CSV de claves. El navegador podría pedir permiso para múltiples descargas.</p><p id="status" aria-live="polite"></p></section>';$("app").innerHTML=h;$("generate").onclick=generate}
async function generate(){const btn=$("generate");btn.disabled=true;try{if(!crypto.subtle)throw Error("Se necesita HTTPS para generar paquetes cifrados");const eventId=key(16),csv=[["Equipo","Estacion","Inicio","Validacion","Retorno","Activacion","Fragmento"]],used=new Set();for(let t=0;t<9;t++){const team=String.fromCharCode(65+t),start=t+1,activation=key(),returnKey=key(),stages=[],fragments=[];for(let id=1;id<=9;id++){const startKey=key(),finishKey=key();let fragment;do{fragment=String(crypto.getRandomValues(new Uint32Array(1))[0]%100).padStart(2,"0")}while(used.has(team+"-"+id+"-"+fragment));used.add(team+"-"+id+"-"+fragment);fragments.push(fragment);const clue=$("clue"+(id-1)).value.trim(),task=$("task"+(id-1)).value.trim();if(!task||!clue)throw Error("Todos los retos y pistas deben estar completos");stages.push({id,challenge:await seal({id,title:names[id-1],task},startKey),reward:await seal({id,fragment,clue},finishKey)});csv.push([team,"E"+id,startKey,finishKey,id===start?returnKey:"",id===start?activation:"",fragment])}const kit={version:1,eventId,team,start,activationHash:await digest(activation),returnHash:await digest(returnKey),stages};save("equipo-"+team+".json",kit);$("status").textContent="Paquetes preparados: "+(t+1)+" de 9"}const content="\uFEFF"+csv.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");save("claves-facilitadores.csv",content,"text/csv;charset=utf-8");$("status").textContent="Listo: nueve paquetes y CSV de claves. Guárdelos en un lugar privado."}catch(e){alert(e.message)}finally{btn.disabled=false}}
render();
