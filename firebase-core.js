import {initializeApp} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {getFirestore, doc, getDoc} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";

export const firebaseConfigured = ["apiKey","authDomain","projectId","appId"].every(k => typeof firebaseConfig[k] === "string" && firebaseConfig[k].trim().length > 0);
export const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const EVENT = "current";
export const PLACES = [
 "Cancha de fútbol 1","Cancha de fútbol 2 (1)","Cancha de básquet 1",
 "Cancha de básquet 2","Ágora 1","Ágora 2","Parqueadero","Salón",
 "Cancha de fútbol 2 (2)"
];
export const TITLES = [
 "El pasaporte destruido","La maleta imposible","El mapa de las siete piezas",
 "La torre del explorador","La ruta que nadie encuentra","El espejo del espía",
 "Operación silencio absoluto","El robo de la brújula dorada",
 "La bóveda de los nueve secretos"
];
export const TASKS = [
 "Reconstruyan en el suelo un pasaporte impreso a doble cara y dividido en 12 piezas. Cuando armen su anverso, den vuelta al conjunto, lean la palabra de seis letras y conviértanla a seis números usando el teclado telefónico T9 (ABC=2, DEF=3, GHI=4, JKL=5, MNO=6, PQRS=7, TUV=8, WXYZ=9). Comuniquen el código al facilitador.",
 "Elijan exactamente cuatro tarjetas de equipaje: una de orientación, una de protección, una de salud y una de comunicación. No pueden superar 8 kg y deben sumar al menos 21 puntos de utilidad. Expliquen el peso y la utilidad de su selección.",
 "Observen durante diez segundos el modelo de velero turístico. Reproduzcan su silueta con las siete piezas del tangram, sin superponerlas y sin usar piezas adicionales. El facilitador comprobará la figura.",
 "Construyan una pirámide con seis vasos: tres abajo, dos encima y uno arriba. Solo pueden sujetar y desplazar cada vaso mediante el aro elástico unido a seis cuerdas. No se permite tocar los vasos directamente durante el armado.",
 "Utilicen el mapa ficticio A4 y sus restricciones para trazar una ruta continua desde SALIDA hasta META. Respeten únicamente las conexiones permitidas y expliquen la secuencia de lugares al facilitador.",
 "Lean el mensaje invertido con ayuda del espejo. Después retrocedan tres letras del alfabeto de 26 letras (sin Ñ): D se convierte en A. Pronuncien la palabra descifrada.",
 "Transmitan en cadena, exclusivamente mediante gestos, seis símbolos turísticos mostrados al primer integrante. El último integrante escribirá las seis palabras en el orden recibido. Nadie puede hablar durante la transmisión.",
 "Analicen el expediente con cuatro sospechosos, cuatro horarios, cuatro lugares y cuatro evidencias. Utilicen las diez pistas para identificar al responsable, la hora, el lugar y el objeto relacionado; expliquen su deducción.",
 "Resuelvan el sudoku 4×4 colocando los números del 1 al 4 una sola vez en cada fila, columna y bloque de 2×2."
];
export const $ = id => document.getElementById(id);
export const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const routeFor = start => Array.from({length:9}, (_,i) => ((start-1+i)%9)+1);
export const stationLabel = n => "E"+n+" · "+PLACES[n-1];
export const teamRef = t => doc(db,"events",EVENT,"teams",t);
export const rewardRef = (t,n) => doc(db,"events",EVENT,"rewards",t+"_E"+n);
export const tokenRef = t => doc(db,"events",EVENT,"tokens",t);
export const eventRef = () => doc(db,"events",EVENT);
export const staffRef = uid => doc(db,"staff",uid);

export async function sha256(s) {
 const data = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return Array.from(new Uint8Array(data),b=>b.toString(16).padStart(2,"0")).join("");
}
export function randomHex(n=16) {
 const a=crypto.getRandomValues(new Uint8Array(n));
 return Array.from(a,b=>b.toString(16).padStart(2,"0")).join("");
}
export function randomPair() {
 const a=crypto.getRandomValues(new Uint32Array(1))[0];
 return String(a%100).padStart(2,"0");
}
export function teamLink(team,token) {
 return new URL("./index.html#team="+encodeURIComponent(team)+"&key="+encodeURIComponent(token),window.location.href).href;
}
export function parseQr(s) {
 let url;
 try{url=new URL(s)}catch{throw Error("El QR no contiene un enlace válido");}
 const expected = new URL("./index.html",location.href);
 if(url.origin!==expected.origin||url.pathname!==expected.pathname)throw Error("El QR no pertenece a esta gincana");
 const args = new URLSearchParams(url.hash.replace(/^#/,""));
 const team=args.get("team"),token=args.get("key");
 if(!/^[A-I]$/.test(team||"")||!/^[0-9a-f]{32}$/.test(token||""))throw Error("El QR no contiene credenciales válidas");
 return {team,token};
}
export async function roleFor(uid) {
 const snap=await getDoc(staffRef(uid));
 if(!snap.exists())throw Error("El usuario no tiene un rol registrado en la colección staff de Firestore");
 return snap.data();
}
export function datetime(value) {
 if(!value)return "—";
 const date=value.toDate?value.toDate():new Date(value);
 return date.toLocaleString("es-EC",{dateStyle:"short",timeStyle:"medium"});
}
export function errText(error) {
 const code=error?.code||"";
 const causes={
 "auth/invalid-credential":"Correo o contraseña incorrectos.",
 "auth/too-many-requests":"Demasiados intentos. Inténtelo más tarde.",
 "permission-denied":"Permiso denegado. Compruebe los roles y publique firestore.rules.",
 "unavailable":"No se pudo conectar a Firestore. Revise la conexión."
 };
 return causes[code]||error?.message||String(error);
}
export function setupNotice(){
 document.querySelector("main").innerHTML='<section class="card"><h2>Configuración Firebase pendiente</h2><p>La aplicación está preparada para Firestore, pero aún debe vincularse a un proyecto Firebase. El organizador debe completar <code>firebase-config.js</code>, habilitar Authentication y publicar las reglas de Firestore siguiendo <code>README.md</code>.</p><p class="warn">No registre equipos ni inicie la gincana hasta finalizar la configuración y probar los nueve dispositivos.</p></section>';
}
