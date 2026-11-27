# Gincana turística UPEC — Centro Deportivo

**Versión conectada v3**: nueve estaciones, nueve equipos, códigos QR y avance en tiempo real con Firebase Authentication y Cloud Firestore. Publicada mediante GitHub Pages.

> IMPORTANTE: el código de la web está preparado, pero **no funcionará sin un proyecto Firebase real y sin publicar las reglas**. La configuración se entrega vacía intencionadamente; no se han creado proyectos, usuarios ni bases de datos en nombre del usuario.

## Direcciones

- Equipo / líder: https://dennysab.github.io/gincana-ecoparque/
- Organización: https://dennysab.github.io/gincana-ecoparque/organizacion.html
- Facilitador: https://dennysab.github.io/gincana-ecoparque/facilitador.html

## Estaciones UPEC

| Código | Ubicación | Prueba |
|---|---|---|
| E1 | Cancha de fútbol 1 | El pasaporte destruido |
| E2 | Cancha de fútbol 2 (1) | La maleta imposible |
| E3 | Cancha de básquet 1 | El mapa de las siete piezas |
| E4 | Cancha de básquet 2 | La torre del explorador |
| E5 | Ágora 1 | La ruta que nadie encuentra |
| E6 | Ágora 2 | El espejo del espía |
| E7 | Parqueadero | Operación silencio absoluto |
| E8 | Salón | El robo de la brújula dorada |
| E9 | Cancha de fútbol 2 (2) | La bóveda de los nueve secretos |

**Señalización obligatoria:** diferenciar físicamente E2 y E9 dentro de la cancha de fútbol 2.

## 1. Crear y configurar Firebase (tarea del administrador propietario)

1. Cree un proyecto en https://console.firebase.google.com/ y registre una **aplicación web**.
2. Habilite **Cloud Firestore** en modo Native/Standard y configure la ubicación/región. Puede existir consumo o facturación según las cuotas del proyecto.
3. En **Authentication → Sign-in method**, habilite **Correo electrónico/contraseña** para organizador y facilitadores, y **Anónimo** para los teléfonos de los líderes.
4. En **Authentication → Settings → Authorized domains**, incluya `dennysab.github.io` si aún no aparece. No use contraseñas triviales.
5. En configuración de la aplicación web, copie los valores `apiKey`, `authDomain`, `projectId` y `appId` y **edite** `firebase-config.js`. Estos identificadores son configuración de cliente, **no** claves privadas administrativas.
6. En **Cloud Firestore → Rules**, sustituya las reglas predeterminadas por el contenido íntegro de `firestore.rules` y **publíquelas**. **No** use reglas de prueba con escritura libre en producción.
7. En **Authentication → Users**, cree **una cuenta de organizador** y **nueve cuentas de facilitador** con contraseñas diferentes. Registre el UID exacto de cada cuenta.
8. En **Firestore → Data**, cree la colección `staff`: documento con ID igual al UID de la persona responsable y campo `role` (string) igual a `admin`; nueve documentos adicionales, uno por UID del facilitador, con `role` (string) = `facilitator` y `station` (string) = `E1`, `E2`, ..., `E9` respectivamente. Los documentos iniciales se crean desde Firebase Console porque las reglas impiden que la web se autoproclame administradora.
9. Compruebe la conexión y los permisos con las cuentas de prueba antes de crear los equipos definitivos.

**No comparta aquí contraseñas, credenciales de servicio ni claves privadas de Firebase.**

## 2. Preparación de equipos en el evento

1. El organizador entra en `organizacion.html` con su cuenta de organizador.
2. Registra **nueve equipos A–I**, sus nombres y eslóganes. Puede cambiar la **estación inicial** de cada equipo en el formulario (deben ser nueve estaciones distintas).
3. Pulsa **Guardar equipos y generar QR**. El sistema guarda equipos, recompensas de dos dígitos por estación y tokens QR de 128 bits en Firestore. Los enlaces QR no contienen las recompensas.
4. Copia a cada líder **solo el enlace privado de su equipo**. El líder lo abre desde su teléfono y muestra el QR de su pantalla a los facilitadores. También se pueden visualizar los nueve QR en el panel.
5. Descarga el archivo JSON privado de respaldo de enlaces y lo conserva fuera del repositorio público.
6. Después de verificar dispositivos, roles y carteles, pulsa **Iniciar evento**. A partir de ese momento no se permite cambiar la estación inicial.

## 3. Trabajo de facilitadores

1. Cada facilitador entra a `facilitador.html` con **su propia cuenta**, autorizada solo para la estación que se le asignó.
2. Escanea el **QR del equipo** usando la cámara. Si el permiso de cámara no está disponible, puede pegar el enlace del QR como alternativa.
3. La app comprueba el token del equipo y si su ruta circular realmente lo conduce a esa estación.
4. Pulsa **Iniciar desafío** y explica la prueba. Tras comprobar físicamente la solución, pulsa **Reto comprobado · validar**.
5. Firestore guarda la hora del registro y libera **solo el par de dígitos correspondiente a esa estación**, visible inmediatamente en el teléfono del equipo.
6. El equipo se desplaza a la siguiente estación circular. El orden depende del inicio asignado: E1 → ... → E9 → E1. Cada equipo visita exactamente las nueve estaciones.

**Sin facilitador, el equipo no puede avanzar oficialmente.** Las validaciones están limitadas por `firestore.rules` al rol, la estación asignada, el orden del recorrido y el estado del reto.

## 4. Retorno y apertura del cofre

1. Tras nueve estaciones, cada equipo regresa a su **estación inicial**.
2. El facilitador de esa estación escanea su QR y pulsa **Confirmar retorno**.
3. El líder dispone de los nueve pares de dígitos, presentados en orden de visita. Los ordena de E1 a E9 para construir un código de **18 dígitos**.
4. En la estación inicial, el facilitador introduce el código de 18 dígitos y confirma la apertura. Las reglas de Firestore verifican el código exacto antes de registrar `openedAt`.
5. El panel del organizador muestra el resultado y la hora registrada por el servidor.

**Ganador:** el primer equipo con apertura del cofre registrada oficialmente. Si hay resultados coincidentes o incidentes técnicos, la organización decide con evidencia presencial; la hora de los dispositivos no determina el ganador.

## 5. Estructura de Firestore

```text
staff/{uid}                         -> role: admin | facilitator; station: E1...E9
events/current                     -> status: setup | live | finished
events/current/teams/A...I        -> nombre, eslogan, ruta, avance y pares ya ganados
events/current/rewards/A...I      -> 9 pares secretos del equipo (solo personal autorizado)
events/current/tokens/A...I       -> token QR privado (solo organizador)
```

Las reglas requieren usuarios autenticados para leer el evento. Los teléfonos de equipo se autentican de forma anónima y **son de solo lectura**; la escritura de avances corresponde a facilitadores autorizados. No se guardan nombres de estudiantes ni información sensible.

## 6. Prueba obligatoria antes del evento

- Crear nueve cuentas de facilitador, cada una con estación diferente; comprobar que E1 **no puede validar E2**.
- Registrar nueve equipos de prueba; verificar asignaciones iniciales únicas y QR diferentes.
- Escanear QR de prueba; confirmar rechazo de un código manipulado y rechazo de una estación fuera de secuencia.
- Completar nueve estaciones en orden desde un inicio distinto de E1, verificando el retorno al inicio.
- Comprobar que el código final tiene 18 dígitos, que un código incorrecto no abre el cofre y que uno correcto sí lo registra.
- Probar escaneo en los teléfonos reales, especialmente permisos de cámara en iPhone y Android.
- Verificar que todos los dispositivos tienen Internet estable en cada una de las **nueve ubicaciones**.
- Tras las pruebas, crear un evento real limpio en un proyecto Firebase separado o limpiar **manualmente y con cuidado** los documentos de prueba antes de comenzar. No reutilizar progresos de pruebas.

## Consideraciones técnicas

- GitHub Pages aloja el código, pero no proporciona backend. Firebase Firestore proporciona sincronización en tiempo real y reglas de autorización.
- El escaneo QR usa `html5-qrcode` (2.3.8), y la generación QR usa `qrcodejs` (1.0.0), cargados de CDN. El acceso a la cámara requiere HTTPS y permiso del usuario.
- El SDK Firebase Web se carga de `www.gstatic.com/firebasejs/12.19.0/`. La gincana conectada **requiere internet**.
- No publicar JSON de equipos ni tokens QR en GitHub. El archivo de respaldo entregado por la organización es privado.
- Los fragmentos secretos están en documentos de acceso restringido a organizadores y facilitadores, pero la seguridad depende de la **honestidad y control de las cuentas del personal**.
- La lógica física y la guía ilustrada de los retos son externas a la aplicación; no se han republicado la guía ni las plantillas en GitHub Pages.
- Los archivos antiguos `app.js` y `admin.js` son vestigios de la beta sin conexión; las páginas nuevas usan `equipo-v3.js` y `organizacion-v3.js`.
- Nunca se debe considerar el código de la aplicación como una prueba de campo. Debe comprobarse con Firebase configurado y al menos una simulación completa.

## Referencias técnicas

- Firebase. (s. f.). *Get started with Cloud Firestore*. https://firebase.google.com/docs/firestore/quickstart
- Firebase. (s. f.). *Security Rules and Firebase Authentication*. https://firebase.google.com/docs/rules/rules-and-auth
- Firebase. (s. f.). *Transactions and batched writes*. https://firebase.google.com/docs/firestore/manage-data/transactions
- ScanApp. (s. f.). *Getting started with html5-qrcode*. https://scanapp.org/html5-qrcode-docs/docs/intro
