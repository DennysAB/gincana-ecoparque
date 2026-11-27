import {initializeApp} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {getFirestore,doc} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {getFunctions,httpsCallable} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";
import {firebaseConfig} from "./firebase-config.js";

export const firebaseConfigured=["apiKey","authDomain","projectId","appId"].every(k=>String(firebaseConfig[k]||"").trim());
export const app=firebaseConfigured?initializeApp(firebaseConfig):null;
export const auth=app?getAuth(app):null;
export const db=app?getFirestore(app):null;
export const functions=app?getFunctions(app,"us-central1"):null;
export const EVENT="current";
export const PLACES=[
 "Cancha de fútbol 1",
 "Cancha de fútbol 2 (1)",
 "Cancha de básquet 1",
 "Cancha de básquet 2",
 "Ágora 1",
 "Ágora 2",
 "Parqueadero",
 "Salón",
 "Cancha de fútbol 2 (2)"
];
export const STATIONS=Array.from({length:9},(_,i)=>"E"+(i+1));
export const TEAMS="ABCDEFGHI".split("");
export const $=id=>document.getElementById(id);
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const eventRef=()=>doc(db,"events",EVENT);
export const staffRef=uid=>doc(db,"staff",uid);
export const teamRef=id=>doc(db,"events",EVENT,"teams",id);
export const teamInvitesCollection=()=>doc(db,"events",EVENT);
export const stationName=station=>PLACES[Number(station?.slice(1))-1]||"";
export const shortError=e=>{
 const codes={
  "functions/unauthenticated":"Inicie sesión para continuar.",
  "functions/permission-denied":"QR, cuenta o permiso no autorizado.",
  "functions/failed-precondition":e?.message,
  "functions/already-exists":e?.message,
  "auth/invalid-credential":"Correo o contraseña incorrectos.",
  "auth/too-many-requests":"Demasiados intentos. Inténtelo después.",
  "permission-denied":"No tiene permisos para consultar estos datos.",
  "unavailable":"No hay conexión a Internet o Firestore no responde."
 };
 return codes[e?.code]||e?.message||String(e);
};
export const call=async(name,data={})=>{
 if(!functions)throw Error("Firebase no está configurado.");
 const response=await httpsCallable(functions,name)(data);
 return response.data;
};
const root=()=>new URL("./",location.href);
export function teamInvitationLink(id,token){
 const url=new URL("index.html",root());
 url.hash=new URLSearchParams({join:id,token}).toString();
 return url.href;
}
export function facilitatorInvitationLink(station,token){
 const url=new URL("facilitador.html",root());
 url.hash=new URLSearchParams({join:station,token}).toString();
 return url.href;
}
export function rewardLink(id,station,token){
 const url=new URL("index.html",root());
 url.hash=new URLSearchParams({reward:id,station,token}).toString();
 return url.href;
}
export function parseLink(value,kind){
 let url;
 try{url=new URL(String(value||"").trim());}catch{throw Error("El QR no contiene un enlace válido.");}
 const path=new URL(kind==="facilitator"?"facilitador.html":"index.html",root());
 if(url.origin!==path.origin||url.pathname!==path.pathname)throw Error("Este QR pertenece a otra aplicación.");
 const q=new URLSearchParams(url.hash.slice(1));
 const raw=q.get("token");
 if(!/^[a-f0-9]{48}$/.test(raw||""))throw Error("El QR no contiene un token válido.");
 if(kind==="team"){
  const id=q.get("join");
  if(!TEAMS.includes(id))throw Error("QR de equipo incorrecto.");
  return {id,token:raw};
 }
 if(kind==="facilitator"){
  const station=q.get("join");
  if(!STATIONS.includes(station))throw Error("QR de facilitador incorrecto.");
  return {station,token:raw};
 }
 const id=q.get("reward"),station=q.get("station");
 if(!TEAMS.includes(id)||!STATIONS.includes(station))throw Error("QR de recompensa incorrecto.");
 return {id,station,token:raw};
}
export function safeQr(node,url,size=180){
 if(!node)return;
 node.textContent="";
 if(typeof QRCode==="undefined"){
  node.textContent="No se pudo cargar el generador QR. Utilice el enlace como alternativa.";
  return;
 }
 new QRCode(node,{text:url,width:size,height:size,correctLevel:QRCode.CorrectLevel.M});
}
export function installHelp(){
 return '<details class="card"><summary>¿Cómo instalar la aplicación en mi teléfono?</summary>'+
 '<p><strong>iPhone:</strong> abra el enlace en Safari; pulse Compartir y elija «Añadir a pantalla de inicio».</p>'+
 '<p><strong>Android:</strong> abra el enlace en Chrome y elija «Instalar aplicación» o «Añadir a pantalla principal».</p>'+
 '<p><strong>Importante:</strong> escanear un QR abre la web, pero no la instala automáticamente. Si el navegador y la aplicación instalada no comparten sesión, vuelva a escanear su QR durante la preparación.</p></details>';
}
export function notConfigured(){
 $("app").innerHTML='<section class="card"><h2>Conexión Firebase pendiente</h2><p>El código de la gincana está publicado, pero aún no se han instalado las Cloud Functions ni configurado el proyecto Firebase.</p><p>El líder debe completar <code>firebase-config.js</code>, desplegar las funciones y las reglas e iniciar sesión con su cuenta autorizada.</p><p class="warn">La aplicación no permite simular validaciones oficiales sin conexión al servidor.</p></section>';
}
export const dateTime=v=>{
 if(!v)return "—";
 const date=v.toDate?v.toDate():new Date(v);
 return date.toLocaleString("es-EC",{dateStyle:"short",timeStyle:"medium"});
};
