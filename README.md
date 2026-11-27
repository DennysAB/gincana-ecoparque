# Gincana turística UPEC — Centro Deportivo

**Versión 4 | Tres perfiles, códigos QR y estaciones dinámicas**

Repositorio público del frontend PWA. Backend transaccional: **Firebase Authentication + Firestore + Cloud Functions (2.ª generación)**. La aplicación NO está habilitada hasta conectar Firebase y desplegar las funciones.

## Accesos

- **Líder:** https://dennysab.github.io/gincana-ecoparque/organizacion.html
- **Facilitadores:** https://dennysab.github.io/gincana-ecoparque/facilitador.html
- **Equipos:** https://dennysab.github.io/gincana-ecoparque/

Los QR individuales se generan dentro del panel del líder y del facilitador, no se guardan en archivos públicos.

## Ubicaciones

| Código | Ubicación |
|---|---|
| E1 | Cancha de fútbol 1 |
| E2 | Cancha de fútbol 2 (1) |
| E3 | Cancha de básquet 1 |
| E4 | Cancha de básquet 2 |
| E5 | Ágora 1 |
| E6 | Ágora 2 |
| E7 | Parqueadero |
| E8 | Salón |
| E9 | Cancha de fútbol 2 (2) |

Marcar claramente **E2** y **E9** en sectores diferentes de la cancha de fútbol 2.

## Funcionamiento de la gincana

**1. Preparación del líder.** Inicia sesión con correo y contraseña, introduce los **nueve nombres de equipos** y asigna el nombre de un **facilitador para cada estación**. Al guardar, el servidor crea nueve invitaciones QR individuales de equipo y nueve de facilitador, recompensas privadas y una asignación inicial aleatoria de **una estación distinta para cada equipo**. El líder entrega el QR correcto a cada equipo y facilitador.

**2. Instalación.** Cada persona escanea su QR de invitación desde el teléfono donde instalará la PWA. El enlace abre la web y la vincula con el equipo o estación. Luego debe usar las opciones del navegador: **Safari → Compartir → Añadir a pantalla de inicio** o **Chrome → Instalar / Añadir a pantalla de inicio**. **Un QR no instala automáticamente la aplicación.** En iOS algunos datos pueden quedar separados entre Safari y la PWA instalada; si esto ocurre, se debe **volver a escanear la misma invitación durante la preparación**.

**3. Inicio.** El líder comprueba que aparecen **9/9 equipos** y **9/9 facilitadores vinculados**. Pulsa *Iniciar gincana*. Antes de ello, los equipos ya pueden ver las nueve estaciones, pero no iniciar misiones. Cada equipo identifica su estación inicial marcada.

**4. Misión.** El equipo llega al lugar indicado; el facilitador explica presencialmente la misión y proporciona los materiales. **Solo cuando confirma físicamente que ha sido superada**, selecciona el equipo que corresponde y pulsa *Generar QR de validación*. El QR contiene un token aleatorio de 48 caracteres hexadecimales, válido **una sola vez** y durante **30 minutos** (la prueba no tiene límite de tiempo; si el QR caduca, el facilitador genera otro).

**5. Recompensa.** El equipo escanea el QR **desde el lector de su propia aplicación**. Una Cloud Function verifica que el teléfono pertenece al equipo correcto, la estación es la actual, el QR es válido, no ha sido utilizado y el evento está activo. En una transacción única, marca la misión como completada, revela el **fragmento de dos dígitos** y asigna la siguiente estación aún no visitada.

**6. Asignación adaptativa.** En la siguiente misión se escoge **aleatoriamente entre las estaciones pendientes que tienen menor cantidad de equipos asignados**. El servidor mantiene reservas en Firestore para evitar asignaciones simultáneas conflictivas. Si todas las estaciones pendientes están ocupadas, se permite que coincidan dos o más equipos. No hay garantía matemática de evitar todo choque, porque los retos duran tiempos distintos.

**7. Cofre.** Al completar las nueve estaciones, la aplicación muestra los nueve fragmentos y el **código completo de 18 dígitos**, concatenado en orden E1–E9. Aparece un cofre digital para ingresar el código. La función del servidor lo verifica y registra la apertura. **Gana el primer equipo que registre correctamente su apertura en la transacción oficial**. Si varios lo intentan a la vez, solo un equipo puede ocupar el campo \`winner\` del evento. El líder observa el progreso y la identidad del ganador en tiempo real.

**Privacidad de retos:** a los equipos se les muestra **solo el nombre de las nueve ubicaciones, el estado de la estación y sus fragmentos conseguidos**. No se publican consignas, respuestas, materiales ni plantillas en la app de los equipos.

## Preparación obligatoria en Firebase

> No se ha creado ni conectado un proyecto Firebase por parte de ChatGPT. Los archivos están disponibles en GitHub, pero todavía es necesaria su configuración, despliegue y prueba de campo.

### A. Proyecto y facturación

1. Entrar a https://console.firebase.google.com/ y **crear un proyecto** de Firebase.
2. Crear una **aplicación web**, registrar \`dennysab.github.io\` entre los dominios autorizados en Authentication (si no está incluido).
3. Crear **Cloud Firestore**.
4. Activar en Firebase Authentication los proveedores **Correo electrónico/contraseña** (líder) y **Anónimo** (facilitadores/equipos).
5. Para **desplegar Cloud Functions se requiere el plan Blaze**, con cuenta de facturación. Confirmar costes, cuotas y alertas de presupuesto antes de activarlo. No se han producido cargos desde este repositorio.

### B. Configuración pública del frontend

Copiar desde Firebase Console → Configuración del proyecto → Aplicación web estos valores y colocarlos en **\`firebase-config.js\`**:

\`\`\`js
export const firebaseConfig = {
  apiKey: "API_KEY_DE_LA_APLICACION_WEB",
  authDomain: "PROYECTO.firebaseapp.com",
  projectId: "ID_DEL_PROYECTO",
  appId: "APP_ID_DE_LA_APLICACION_WEB"
};
\`\`\`

Estos campos son la **configuración de cliente**, no credenciales administrativas. **Nunca subir** cuentas de servicio JSON, contraseñas de usuarios ni claves privadas a GitHub.

### C. Crear cuenta del líder

1. En Firebase Authentication → Users, crear una cuenta por correo y contraseña para el líder.
2. Copiar su **UID**.
3. En Firestore → Data, crear colección \`staff\`; documento cuyo ID sea **ese UID**, con el campo \`role\` (tipo string) = \`leader\`.
4. **No crear cuentas manuales para los nueve facilitadores ni para los equipos**: las invitaciones QR les permiten vincular dispositivos por autenticación anónima.

La configuración del líder se realiza desde Firebase Console; ningún usuario anónimo puede concederse permisos administrativos.

### D. Desplegar las funciones y reglas

Con Node.js 22 y Firebase CLI, desde la carpeta raíz del repositorio:

\`\`\`bash
npm install --prefix functions
npm install -g firebase-tools
firebase login
firebase deploy --project ID_DEL_PROYECTO --only firestore:rules,functions
\`\`\`

El proyecto incluye:
- \`firebase.json\`: despliegue de Functions y reglas.
- \`firestore.rules\`: clientes autenticados en **solo lectura**, con autorización por rol y pertenencia al equipo.
- \`functions/index.js\`: creación del evento, invitaciones, incorporación de equipos y facilitadores, emisión y canje de QR, asignación dinámica y cofre transaccional.
- \`functions/package.json\`: dependencias y versión de Node.
- \`firebase-config.js\`: configuración web (vacía hasta su activación).

Las funciones necesitan permisos de Firebase Admin SDK sobre Firestore. **No utilizar reglas abiertas para «probar»**: las reglas restringidas ya están preparadas.

### E. Prueba antes de la actividad real

1. Entrar como líder, crear nueve equipos ficticios y los nombres de los facilitadores.
2. Abrir las nueve invitaciones de equipo y las nueve de facilitador en dispositivos/navegadores diferentes; confirmar 9/9 y 9/9.
3. Verificar que los equipos ven nueve ubicaciones **sin contenido de la misión**.
4. Iniciar el evento y comprobar las estaciones iniciales distintas.
5. Validar un equipo en E1 (u otra estación asignada), escanear el QR desde su propia app, y verificar entrega de dos dígitos y nueva estación.
6. Intentar usar el mismo QR otra vez y un QR de otro equipo; ambos deben ser rechazados.
7. Completar nueve validaciones para un equipo; verificar longitud de 18 dígitos, rechazo de entrada incorrecta y apertura correcta.
8. Hacer competir dos equipos: el campo \`winner\` no debe reemplazarse tras la primera apertura correcta.
9. Verificar en tiempo real el tablero de líder y la asignación dinámica frente a estaciones ocupadas.
10. Comprobar red móvil y cámara en **las nueve ubicaciones**. Diferenciar visiblemente E2 y E9.
11. **Las funciones y Firebase deben probarse en un proyecto de prueba** antes del evento. Para empezar limpio el día del evento, use otro proyecto o borre cuidadosamente el árbol \`events/current\` (incluidas subcolecciones) desde herramientas administrativas. El panel no incluye un botón de borrado para evitar eliminar el evento accidentalmente.

### Recuperación de instalación y credenciales

- Las invitaciones de equipo/facilitador son **privadas y transferibles solo durante el estado de preparación**. Si un iPhone crea un usuario anónimo distinto al instalar la PWA, vuelva a escanear su invitación **antes de iniciar**; el servidor cambia el dispositivo vinculado.
- Una vez iniciada la gincana, las invitaciones no permiten suplantar un dispositivo ya vinculado. Si se pierde el teléfono durante el evento, será necesaria una recuperación administrativa deliberada.
- Un QR de misión caduca a los 30 minutos; el facilitador puede emitir uno nuevo antes del canje. Emitir otro invalida el anterior.

## Estructura de los datos

\`\`\`text
staff/{uid}                              -> role=leader o facilitator, station si corresponde
events/current                          -> status, reservations y winner
events/current/teams/A...I              -> nombre, UID vinculado, estación activa, avance
events/current/teamInvites/A...I        -> invitación privada del equipo (solo líder)
events/current/facInvites/E1...E9       -> invitación privada del facilitador (solo líder)
events/current/rewards/A...I            -> fragmentos privados (solo Cloud Functions)
events/current/proofs/A_E1 ... I_E9     -> hashes de QR temporales y registro de consumo
\`\`\`

El cálculo del ganador y de las reservas se ejecuta en transacciones en el servidor; no se basa en la hora que declare el teléfono del participante.

## Referencias técnicas

- Firebase. (s. f.). *Call functions from your app*. https://firebase.google.com/docs/functions/callable
- Firebase. (s. f.). *Transactions and batched writes*. https://firebase.google.com/docs/firestore/manage-data/transactions
- Firebase. (s. f.). *Firebase pricing plans*. https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firebase. (s. f.). *Get realtime updates with Cloud Firestore*. https://firebase.google.com/docs/firestore/query-data/listen
