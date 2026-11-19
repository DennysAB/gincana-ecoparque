# Agentes de Información Turística — Ecoparque de Tulcán

**Versión beta 1.0 · aplicación estática instalable y sin conexión durante la actividad.**

Este repositorio contiene **solo código público**. No suba paquetes de equipos, claves de facilitadores, registros de participantes ni el respaldo del organizador.

## Archivos

- `index.html`, `app.js`, `style.css`: aplicación de cada equipo.
- `organizacion.html`, `organizacion.js`: generador local de nueve paquetes cifrados y claves de facilitadores.
- `sw.js`, `manifest.webmanifest`, `icon.svg`: instalación PWA y caché sin conexión.

## Preparación

1. Aloje estos archivos mediante HTTPS (por ejemplo, GitHub Pages si su cuenta y visibilidad lo permiten).
2. Abra `organizacion.html` en el navegador con conexión, rellene los nueve retos y pistas **en el equipo de la organización**, y genere los paquetes.
3. Descargue y guarde de manera privada los nueve JSON de equipo y el CSV de claves. **No los suba al repositorio.**
4. En cada teléfono, abra `index.html`, instale la PWA e importe **solo el JSON del equipo correspondiente**.
5. Pruebe cada teléfono en modo avión, cierre y reabra la aplicación y confirme que conserva el progreso.
6. En el evento, la organización activa el equipo; cada facilitador introduce la clave de inicio al llegar y la clave de validación después de comprobar el reto.
7. Después de las nueve estaciones y la confirmación del retorno, el equipo organiza los nueve pares en orden E1–E9 y abre el cofre.

## Restricciones conocidas

- Sin red local ni internet no existe sincronización ni clasificación automática global.
- Los tiempos y resultados registrados en los teléfonos no son evidencia resistente a manipulaciones. La llegada del ganador debe verificarse presencialmente.
- El almacenamiento local puede perderse si se borran los datos del navegador, se desinstala la aplicación o se usa navegación privada. Haga pruebas y conserve respaldos.
- La confidencialidad de retos cifrados depende de que las claves de activación no se divulguen. No existe protección absoluta frente a usuarios con acceso físico al dispositivo.
- La aplicación debe abrirse por HTTPS o localhost para utilizar service workers y Web Crypto.
- Los retos físicos y las pistas geográficas definitivas se incorporan después de la visita técnica.
- La instalación PWA varía según navegador y sistema operativo; pruebe los dispositivos reales antes del evento.

## Comprobación mínima

- Cada equipo A–I inicia en E1–E9 respectivamente y completa exactamente nueve estaciones.
- Cada estación requiere **dos claves distintas**: inicio y validación.
- La consulta docente puede registrarse **una sola vez por equipo**.
- El retorno a la estación inicial exige una clave específica.
- El cofre solo se habilita con nueve estaciones validadas y retorno confirmado.
- Los fragmentos se introducen en el orden E1–E9, independientemente del orden de visita.

## Privacidad

No se necesita información personal: basta un identificador A–I y el nombre creativo del equipo. No almacene nombres de estudiantes ni datos sensibles.
