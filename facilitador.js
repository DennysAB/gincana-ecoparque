import {auth,db,firebaseConfigured,notConfigured,call,$,esc,STATIONS,stationName,
 staffRef,eventRef,teamRef,facilitatorInvitationLink,rewardLink,parseLink,safeQr,installHelp,shortError} from "./firebase-core.js";
import {signInAnonymously,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {getDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let user=null,identity=null,station=null,eventData=null,issued=null,activeTeams={},stopEvent=null;
function note(t){if($("notice"))$("notice").textContent=t;}
function error(e){note(shortError(e));}
function cleanHash(){history.replaceState(null,"",location.pathname+location.search);}
function welcome(){
 $("app").innerHTML='<section class="card"><h2>Registro del facilitador</h2>'+
 '<p>Escanee el QR privado asignado por el líder. Este vínculo habilitará exclusivamente su estación.</p>'+
 '<label>Enlace del QR de invitación</label><input id="join-link" placeholder="Pegue aquí el enlace recibido">'+
 '<button id="connect">Vincular mi estación</button><p id="notice" role="status"></p></section>'+installHelp();
 $("connect").onclick=async()=>{
  try{
   const {station:s,token}=parseLink($("join-link").value,"facilitator");
   await call("joinFacilitator",{station:s,token});cleanHash();await checkRole();
  }catch(e){error(e);}
 };
}
async function checkRole(){
 if(!auth.currentUser)return;
 const snap=await getDoc(staffRef(auth.currentUser.uid));
 if(snap.exists()&&snap.data().role==="facilitator"&&STATIONS.includes(snap.data().station)){
  station=snap.data().station;identity=snap.data();renderBase();return;
 }
 if(location.hash.includes("join=")){
  const {station:s,token}=parseLink(location.href,"facilitator");
  await call("joinFacilitator",{station:s,token});
  cleanHash();
  const renewed=await getDoc(staffRef(auth.currentUser.uid));
  if(renewed.exists()){station=renewed.data().station;identity=renewed.data();renderBase();return;}
 }
 welcome();
}
function renderBase(){
 $("app").innerHTML='<section class="card"><small>Cuenta de facilitador vinculada</small>'+
 '<h2>'+esc(station)+' · '+esc(stationName(station))+'</h2>'+
 '<p>Responsable: <strong>'+esc(identity?.name||"Facilitador")+'</strong></p>'+
 '<p>Cuando un equipo complete físicamente la misión, seleccione su identificación y genere su QR de validación.</p>'+
 '<p class="warn">No genere el QR antes de comprobar que el equipo superó el reto.</p>'+
 '<p id="notice" role="status"></p></section>'+
 '<div id="missions"></div>'+installHelp();
 if(stopEvent)stopEvent();
 stopEvent=onSnapshot(eventRef(),snap=>{
  eventData=snap.exists()?snap.data():null;
  if(issued && !(eventData?.reservations?.[station]||[]).includes(issued.team)){
   issued=null;note("El equipo escaneó su QR y recibió su fragmento. La estación quedó actualizada.");
  }
  renderMissions();
 },error);
}
function renderMissions(){
 const root=$("missions");if(!root)return;
 const active=eventData?.status==="live";
 const ids=eventData?.reservations?.[station]||[];
 let s='<section class="card"><h2>Validaciones de '+esc(station)+'</h2>'+
 '<p>Estado: <strong>'+esc(!eventData?"Esperando configuración":active?"En desarrollo":eventData.status==="setup"?"Aún no iniciada":"Finalizada")+'</strong></p>';
 if(active){
  s+='<p>Equipos asignados actualmente: <strong>'+esc(ids.join(", ")||"ninguno")+'</strong></p>';
  if(ids.length){
   s+='<label>Equipo que superó la misión</label><select id="team-select">'+ids.map(id=>'<option value="'+esc(id)+'">Equipo '+esc(id)+'</option>').join("")+'</select>'+
   '<button id="issue">He comprobado la misión · Generar QR de validación</button>';
  }else s+='<p>No hay equipos asignados a esta estación en este momento.</p>';
 }else s+='<p>Los QR de validación solo pueden emitirse durante el evento.</p>';
 s+='</section>';
 if(issued&&active){
  const link=rewardLink(issued.team,issued.station,issued.token);
  s+='<section class="card"><h2>QR para el equipo '+esc(issued.team)+'</h2>'+
   '<p>Muestre este código al equipo. <strong>El equipo debe escanearlo desde su propia aplicación</strong> para recibir dos dígitos y desbloquear la siguiente estación.</p>'+
   '<div class="qr-img qr-team" id="reward-qr"></div>'+
   '<button id="copy-reward" class="alt">Copiar enlace QR</button>'+
   '<p class="small">Este QR es específico para el equipo '+esc(issued.team)+' y esta estación. Es de un solo uso; si caduca puede generar otro.</p></section>';
 }
 root.innerHTML=s;
 if($("issue"))$("issue").onclick=generate;
 if(issued&&$("reward-qr")){
  const link=rewardLink(issued.team,issued.station,issued.token);
  safeQr($("reward-qr"),link,218);
  $("copy-reward").onclick=async()=>{
   try{await navigator.clipboard.writeText(link);note("Enlace copiado. Compártalo únicamente con el equipo autorizado.");}
   catch{prompt("Enlace del QR:",link);}
  };
 }
}
async function generate(){
 const id=$("team-select")?.value;
 if(!id){note("Seleccione el equipo que terminó su misión.");return;}
 if(!confirm("¿Verificó personalmente que el equipo "+id+" cumplió la misión?"))return;
 const button=$("issue");button.disabled=true;
 try{
  issued=await call("issueProof",{team:id});
  renderMissions();note("QR individual generado para el equipo "+id+".");
 }catch(e){error(e);}finally{if(button.isConnected)button.disabled=false;}
}
if(!firebaseConfigured)notConfigured();
else onAuthStateChanged(auth,async u=>{
 user=u;
 if(stopEvent){stopEvent();stopEvent=null;}
 if(!u){try{await signInAnonymously(auth);}catch(e){$("app").innerHTML='<section class="card"><p class="warn">'+esc(shortError(e))+'</p></section>';}return;}
 try{await checkRole();}
 catch(e){welcome();error(e);}
});
