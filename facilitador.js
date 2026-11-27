import {auth,db,firebaseConfigured,setupNotice,$,esc,PLACES,TITLES,TASKS,
 teamRef,rewardRef,eventRef,roleFor,parseQr,sha256,datetime,errText} from "./firebase-core.js";
import {signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {getDoc,onSnapshot,runTransaction,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let role=null,station=null,selected=null,teamData=null,stopTeam=null,stopEvent=null,eventData=null,scanner=null;
function note(s){const n=$("notice");if(n)n.textContent=s;}
function loginView(){
 $("app").innerHTML='<section class="card"><h2>Acceso de facilitador</h2><label>Correo</label><input id="email" type="email" autocomplete="username"><label>Contraseña</label><input id="password" type="password" autocomplete="current-password"><button id="login">Ingresar</button><p id="notice" role="status"></p></section>';
 $("login").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);}catch(e){note(errText(e));}};
}
function shell(){
 const n=Number(station.slice(1));
 $("app").innerHTML='<div class="toolbar"><p><strong>Facilitador · '+esc(station)+'</strong> · '+esc(PLACES[n-1])+'</p><button id="logout" class="alt compact">Salir</button></div><p id="notice" role="status"></p><section class="card"><h2>Escanear QR del equipo</h2><p>Cuando el equipo llegue, escanee el QR mostrado por su líder. La aplicación comprobará que corresponde a esta estación.</p><button id="camera">Abrir cámara</button><div id="reader" class="camera-reader"></div><label>Alternativa: pegar enlace del QR</label><input id="manual" placeholder="https://.../index.html#team=A&key=..."><button id="manual-button" class="alt">Verificar enlace</button></section><div id="team-panel"></div>';
 $("logout").onclick=async()=>{await closeCamera();await signOut(auth);};
 $("camera").onclick=startCamera;
 $("manual-button").onclick=()=>choose($("manual").value.trim());
}
async function closeCamera(){
 if(!scanner)return;
 try{if(scanner.getState()===2)await scanner.stop();await scanner.clear();}catch(e){console.warn(e);}
 scanner=null;
}
async function startCamera(){
 if(scanner)return;
 if(typeof Html5Qrcode==="undefined"){note("No cargó el lector QR. Revise internet o pegue el enlace.");return;}
 try{
  scanner=new Html5Qrcode("reader");
  await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:240,height:240}},async value=>{
   await closeCamera();
   await choose(value);
  },()=>{});
  note("Enfoque el QR que aparece en el teléfono del líder.");
 }catch(e){note("No se pudo iniciar la cámara: "+errText(e));await closeCamera();}
}
async function choose(value){
 try{
  const info=parseQr(value),snapshot=await getDoc(teamRef(info.team));
  if(!snapshot.exists())throw Error("El equipo todavía no se ha registrado.");
  const hash=await sha256(info.token);
  if(hash!==snapshot.data().qrHash)throw Error("Este QR no corresponde al equipo registrado.");
  if(stopTeam){stopTeam();stopTeam=null;}
  selected=info.team;teamData=snapshot.data();
  stopTeam=onSnapshot(teamRef(selected),s=>{
   if(!s.exists()){note("Se eliminó el equipo.");return;}
   teamData=s.data();renderTeam();
  },e=>note(errText(e)));
  note("QR verificado: equipo "+selected+".");
  renderTeam();
 }catch(e){note(errText(e));}
}
function renderTeam(){
 const p=$("team-panel");if(!p||!teamData)return;
 const t=teamData;
 let h='<section class="card"><h2>Equipo '+esc(t.team)+' · '+esc(t.name)+'</h2><p><em>'+esc(t.slogan)+'</em></p><p>Estaciones completadas: <strong>'+t.step+' / 9</strong></p>';
 if(eventData?.status!=="live"){
  h+='<p class="warn">El evento todavía no está activo o ya finalizó. No pueden registrarse validaciones.</p>';
 }else if(t.openedAt){
  h+='<h3 class="ok">Cofre abierto</h3><p>Registro oficial: '+esc(datetime(t.openedAt))+'</p>';
 }else if(t.step===9){
  if(station!==t.startKey)h+='<p>Este equipo completó sus nueve retos. Debe regresar a '+esc(t.startKey)+' · '+esc(PLACES[Number(t.startKey.slice(1))-1])+'.</p>';
  else if(!t.returned){
   h+='<p>El equipo terminó las nueve estaciones y ha regresado a su punto de partida.</p><button id="return-team">Confirmar retorno</button>';
  }else{
   h+='<p class="ok">Retorno confirmado. El equipo debe ordenar sus nueve fragmentos y presentar su código de 18 cifras.</p><label>Código final de 18 dígitos</label><input id="code18" type="text" inputmode="numeric" pattern="[0-9]{18}" maxlength="18" autocomplete="off" placeholder="000000000000000000"><button id="open-chest">Validar apertura del cofre</button>';
  }
 }else{
  const next=t.route[t.step];
  if(next!==station){
   h+='<p class="warn">Este equipo debe acudir primero a '+esc(next)+' · '+esc(PLACES[Number(next.slice(1))-1])+'. No se permite saltar estaciones.</p>';
  }else if(!t.inProgress){
   h+='<h3>'+esc(TITLES[Number(station.slice(1))-1])+'</h3><p>Se comprobará el reto presencialmente. Inicie cuando estén listos.</p><button id="begin-task">Iniciar desafío</button>';
  }else if(t.inProgress.by!==auth.currentUser.uid){
   h+='<p class="warn">Otro facilitador inició este reto. Solo esa cuenta puede validarlo.</p>';
  }else{
   h+='<h3>'+esc(TITLES[Number(station.slice(1))-1])+'</h3><p>'+esc(TASKS[Number(station.slice(1))-1])+'</p><p>Introduzca la validación solo después de comprobar físicamente que el equipo lo resolvió.</p><button id="finish-task">Reto comprobado · validar</button>';
  }
 }
 h+='</section>';p.innerHTML=h;
 if($("begin-task"))$("begin-task").onclick=beginTask;
 if($("finish-task"))$("finish-task").onclick=finishTask;
 if($("return-team"))$("return-team").onclick=markReturn;
 if($("open-chest"))$("open-chest").onclick=openChest;
}
async function beginTask(){
 try{
  await runTransaction(db,async trx=>{
   const ref=teamRef(selected),s=await trx.get(ref);
   if(!s.exists())throw Error("Equipo inexistente.");
   const t=s.data();
   if(t.route[t.step]!==station||t.step>=9||t.inProgress)throw Error("El equipo no está habilitado para comenzar en esta estación.");
   trx.update(ref,{inProgress:{station,by:auth.currentUser.uid,at:serverTimestamp()},updatedAt:serverTimestamp()});
  });
  note("Desafío iniciado. Explique la consigna al equipo.");
 }catch(e){note(errText(e));}
}
async function finishTask(){
 if(!confirm("¿Ha comprobado personalmente que el equipo resolvió correctamente la prueba?"))return;
 try{
  await runTransaction(db,async trx=>{
   const ref=teamRef(selected),reward=rewardRef(selected,Number(station.slice(1)));
   const s=await trx.get(ref);
   const r=await trx.get(reward);
   if(!s.exists()||!r.exists())throw Error("Faltan datos del equipo o sus recompensas.");
   const t=s.data();
   if(t.step>=9||t.route[t.step]!==station||t.inProgress?.by!==auth.currentUser.uid)throw Error("Este reto no está activo para su cuenta.");
   const fragment=r.data().fragments[station];
   if(!/^[0-9]{2}$/.test(fragment))throw Error("Fragmento de recompensa inválido.");
   trx.update(ref,{["completed."+station]:{fragment,by:auth.currentUser.uid,at:serverTimestamp()},step:t.step+1,inProgress:null,updatedAt:serverTimestamp()});
  });
  note("Reto validado y fragmento entregado automáticamente al teléfono del equipo.");
 }catch(e){note(errText(e));}
}
async function markReturn(){
 if(!confirm("¿El equipo regresó físicamente a su estación inicial tras completar los nueve retos?"))return;
 try{await updateDoc(teamRef(selected),{returned:true,returnedAt:serverTimestamp(),updatedAt:serverTimestamp()});note("Retorno confirmado.");}
 catch(e){note(errText(e));}
}
async function openChest(){
 const code=$("code18").value.trim();
 if(!/^[0-9]{18}$/.test(code)){note("El código debe tener exactamente 18 dígitos.");return;}
 const expected=Array.from({length:9},(_,i)=>teamData.completed["E"+(i+1)]?.fragment||"").join("");
 if(code!==expected){note("Código incorrecto. Revisen el orden de los fragmentos E1–E9.");return;}
 if(!confirm("Código correcto. ¿Registrar oficialmente la apertura del cofre?"))return;
 try{await updateDoc(teamRef(selected),{openedCode:code,openedAt:serverTimestamp(),updatedAt:serverTimestamp()});note("¡Cofre abierto! Hora oficial registrada en Firestore.");}
 catch(e){note(errText(e));}
}
async function authenticated(u){
 try{
  role=await roleFor(u.uid);
  if(role.role!=="facilitator"||!/^E[1-9]$/.test(role.station||""))throw Error("Esta cuenta no tiene una estación de facilitación asignada.");
  station=role.station;selected=null;teamData=null;shell();
  stopEvent=onSnapshot(eventRef(),s=>{eventData=s.exists()?s.data():null;renderTeam();},e=>note(errText(e)));
 }catch(e){$("app").innerHTML='<section class="card"><p class="warn">'+esc(errText(e))+'</p><button id="logout">Cerrar sesión</button></section>';$("logout").onclick=()=>signOut(auth);}
}
if(!firebaseConfigured)setupNotice();
else onAuthStateChanged(auth,u=>{
 if(stopEvent){stopEvent();stopEvent=null;}
 if(stopTeam){stopTeam();stopTeam=null;}
 closeCamera();
 if(u)authenticated(u);
 else{eventData=null;teamData=null;selected=null;loginView();}
});
