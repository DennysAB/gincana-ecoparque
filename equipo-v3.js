import {auth,db,firebaseConfigured,notConfigured,call,$,esc,TEAMS,STATIONS,PLACES,
 eventRef,teamRef,parseLink,shortError,installHelp,dateTime} from "./firebase-core.js";
import {signInAnonymously,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {getDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const KEY="upec_gincana_my_team";
let teamId=null,team=null,eventData=null,stopTeam=null,stopEvent=null,reader=null,scanning=false;
const chestGraphic='<svg xmlns="http://www.w3.org/2000/svg" width="110" height="94" viewBox="0 0 110 94" role="img" aria-label="Cofre digital">'+
 '<path d="M12 37v-11C12 8 98 8 98 26v11" fill="#845522" stroke="#e8c36e" stroke-width="5"/>'+
 '<rect x="8" y="35" width="94" height="53" rx="9" fill="#926028" stroke="#f0c978" stroke-width="5"/>'+
 '<path d="M8 52h94M24 35v53M86 35v53" stroke="#e8c36e" stroke-width="6"/>'+
 '<rect x="47" y="47" width="16" height="23" rx="3" fill="#152c43" stroke="#f0c978" stroke-width="3"/>'+
 '<circle cx="55" cy="56" r="2.5" fill="#f0c978"/></svg>';
function note(s){const n=$("notice");if(n)n.textContent=s;}
function cleanHash(){history.replaceState(null,"",location.pathname+location.search);}
function showError(e){note(shortError(e));}
async function stopCamera(){
 if(!reader)return;
 const current=reader;reader=null;
 try{if(current.getState()===2)await current.stop();await current.clear();}
 catch(e){console.warn("Cámara",e);}
}
async function startScanner(kind){
 if(reader)return;
 if(typeof Html5Qrcode==="undefined"){note("El lector QR no está disponible. Puede pegar el enlace como alternativa.");return;}
 const box=$("reader");if(!box)return;
 try{
  reader=new Html5Qrcode("reader");
  await reader.start({facingMode:"environment"},{fps:10,qrbox:{width:230,height:230}},async value=>{
   await stopCamera();
   if(kind==="reward")await redeem(value);else await join(value);
  },()=>{});
  note("Enfoque el QR con la cámara del teléfono.");
 }catch(e){showError(e);await stopCamera();}
}
function enrollment(){
 stopCamera();
 $("app").innerHTML='<section class="card"><h2>Bienvenidos a la gincana UPEC</h2>'+
 '<p>Soliciten al líder el QR de su equipo. Escanéenlo desde esta pantalla para registrarse y recibir la estación inicial.</p>'+
 '<button id="scan-invite">Escanear QR de inscripción</button><div id="reader" class="camera-reader"></div>'+
 '<label>O pegar enlace del equipo</label><input id="invite-link" placeholder="https://.../index.html#join=A&token=...">'+
 '<button id="join-button" class="alt">Vincular equipo</button><p id="notice" role="status"></p></section>'+
 installHelp();
 $("scan-invite").onclick=()=>startScanner("invite");
 $("join-button").onclick=()=>join($("invite-link").value.trim());
}
async function join(value){
 try{
  const {id,token}=parseLink(value,"team");
  if(!auth.currentUser)throw Error("Aún no está lista la autenticación.");
  await call("joinTeam",{team:id,token});
  teamId=id;localStorage.setItem(KEY,id);cleanHash();
  await stopCamera();await subscribeTeam();
 }catch(e){showError(e);}
}
async function restore(){
 const id=localStorage.getItem(KEY);
 if(!TEAMS.includes(id)){enrollment();return;}
 try{
  const snap=await getDoc(teamRef(id));
  if(!snap.exists())throw Error("Equipo no encontrado.");
  teamId=id;await subscribeTeam();
 }catch(e){
  localStorage.removeItem(KEY);enrollment();note("Debe volver a escanear el QR del equipo desde esta instalación.");
 }
}
async function subscribeTeam(){
 if(stopTeam)stopTeam();if(stopEvent)stopEvent();
 stopTeam=onSnapshot(teamRef(teamId),snap=>{
  if(!snap.exists()){enrollment();return;}
  team=snap.data();render();
 },showError);
 stopEvent=onSnapshot(eventRef(),snap=>{
  eventData=snap.exists()?snap.data():null;render();
 },showError);
}
function stationCell(station){
 const done=team?.completed?.[station],current=team?.current===station;
 return '<div class="station-card '+(done?"done":current?"chosen":"locked")+'">'+
 '<p class="station-number">'+esc(station)+'</p><strong>'+esc(PLACES[STATIONS.indexOf(station)])+'</strong>'+
 (done?'<div class="fragment"><small>Fragmento obtenido</small><strong>'+esc(done.fragment)+'</strong></div>':
 current?'<p class="station-state">ESTACIÓN ASIGNADA</p>':
 '<p class="station-state">Pendiente</p>')+'</div>';
}
function render(){
 if(!teamId||!team)return;
 const completed=team.completed||{},n=team.count||0,live=eventData?.status==="live";
 let html='<section class="card"><small>Gincana turística UPEC</small><h2>Equipo '+esc(team.id)+' · '+esc(team.name)+'</h2>'+
 '<p>'+n+' de 9 misiones superadas</p><div class="progress"><div style="width:'+(n/9*100)+'%"></div></div>'+
 (eventData?.status==="setup"?'<p class="warn">Esperen la señal de inicio del líder.</p>':
 eventData?.status==="finished"?'<p class="warn">El evento ha finalizado.</p>':"")+
 '</section><section class="card"><h2>Las nueve estaciones</h2>'+
 '<p>Se muestran únicamente las ubicaciones. Las instrucciones y los materiales serán proporcionados por el facilitador correspondiente.</p>'+
 '<div class="stations-grid">'+STATIONS.map(stationCell).join("")+'</div></section>';
 if(n<9){
  const station=team.current;
  html+='<section class="card"><h2>'+(station?"Diríjanse a "+esc(station):"Esperando asignación")+'</h2>'+
  (station?'<p><strong>'+esc(PLACES[STATIONS.indexOf(station)])+'</strong></p>':"")+
  '<p>Cuando terminen la misión, el facilitador mostrará un QR exclusivo para su equipo. Escanéenlo aquí para obtener el fragmento de dos dígitos y desbloquear otra estación.</p>'+
  '<button id="scan-reward" '+(live?"":"disabled")+'>Escanear QR del facilitador</button>'+
  '<div id="reader" class="camera-reader"></div>'+
  '<label>O pegar enlace del QR de validación</label><input id="reward-link" placeholder="https://.../index.html#reward=...">'+
  '<button id="redeem-link" class="alt" '+(live?"":"disabled")+'>Validar QR</button>'+
  '<p id="notice" role="status"></p></section>';
 }else{
  const code=STATIONS.map(st=>completed[st]?.fragment||"").join("");
  html+='<section class="card"><h2>¡Las nueve misiones están completas!</h2>'+
  '<p>El código final, ordenado de E1 a E9, tiene 18 dígitos:</p>'+
  '<div class="final-code" id="final-code">'+esc(code)+'</div>'+
  '<div class="chest-graphic">'+chestGraphic+'</div>'+
  '<h3>Cofre digital</h3>'+
  (!team.chestAt?'<p>Introduzcan los 18 dígitos en el cofre. La primera apertura correcta registrada por el servidor determina al equipo ganador.</p>'+
  '<label>Código de apertura</label><input id="chest-code" inputmode="numeric" maxlength="18" pattern="[0-9]{18}" autocomplete="off" placeholder="000000000000000000">'+
  '<button id="open-chest" '+(live?"":"disabled")+'>Abrir cofre</button><p id="notice" role="status"></p>':
  '<h2 class="ok">Cofre abierto</h2><p>Hora registrada: '+esc(dateTime(team.chestAt))+'</p>')+
  (eventData?.winner?'<p class="ok"><strong>Equipo ganador: '+esc(eventData.winner.team)+' · '+esc(eventData.winner.name)+'</strong></p>':"")+
  '</section>';
 }
 html+=installHelp();
 $("app").innerHTML=html;
 if($("scan-reward"))$("scan-reward").onclick=()=>startScanner("reward");
 if($("redeem-link"))$("redeem-link").onclick=()=>redeem($("reward-link").value.trim());
 if($("open-chest"))$("open-chest").onclick=openChest;
}
async function redeem(value){
 if(scanning)return;
 scanning=true;
 try{
  const {id,station,token}=parseLink(value,"reward");
  if(id!==teamId)throw Error("Este QR corresponde a otro equipo.");
  if(team.current!==station)throw Error("Este QR no corresponde a su estación activa.");
  const result=await call("redeemProof",{team:id,station,token});
  cleanHash();await stopCamera();
  alert("¡Misión completada! Fragmento de "+station+": "+result.fragment+
   (result.next?" · Su siguiente estación será "+result.next+".":" · ¡Han completado las nueve estaciones!"));
 }catch(e){showError(e);}finally{scanning=false;}
}
async function openChest(){
 const code=$("chest-code")?.value.trim();
 if(!/^[0-9]{18}$/.test(code||"")){note("Introduzcan exactamente 18 dígitos.");return;}
 const btn=$("open-chest");btn.disabled=true;
 try{
  const result=await call("openChest",{team:teamId,code});
  alert(result.winner?"¡COFRE ABIERTO! ¡Su equipo es el ganador oficial!":"Cofre abierto correctamente. Otro equipo llegó primero.");
 }catch(e){showError(e);}finally{if(btn.isConnected)btn.disabled=false;}
}
async function signedIn(){
 // Las invitaciones desde la cámara del navegador abren un enlace con
 // fragmento. El fragmento no llega al servidor HTTP, y se borra tras uso.
 try{
  if(location.hash.includes("reward=")){
   const parsed=parseLink(location.href,"reward");
   const saved=localStorage.getItem(KEY);
   if(saved===parsed.id){
    await restore();
    await redeem(location.href);
   }else{
    enrollment();
    note("Abra este QR desde la aplicación del equipo "+parsed.id+" antes de validar.");
   }
  }else if(location.hash.includes("join="))await join(location.href);
  else await restore();
 }catch(e){enrollment();showError(e);}
}
if(!firebaseConfigured)notConfigured();
else onAuthStateChanged(auth,async user=>{
 if(!user){try{await signInAnonymously(auth);}catch(e){$("app").innerHTML='<section class="card"><p class="warn">'+esc(shortError(e))+'</p></section>';}return;}
 await signedIn();
});
