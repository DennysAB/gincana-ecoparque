# Agentes de Información Turística — Ecoparque de Tulcán

**Versión beta 1.5 · aplicación web progresiva instalable y sin conexión durante la actividad.**

Este repositorio contiene **solo código público**. No suba paquetes de equipos, PIN de facilitadores, registros de participantes ni el respaldo del organizador.

## Archivos

- `index.html`, `app.js`, `style.css`: aplicación de cada equipo.
- `organizacion.html`, `admin.js`: generador local de nueve paquetes cifrados y 180 PIN numéricos únicos de cinco dígitos.
- `sw.js`, `manifest.webmanifest`, `icon.svg`: instalación PWA y caché sin conexión.

## Preparación

1. Aloje estos archivos mediante HTTPS (por ejemplo, GitHub Pages si su cuenta y visibilidad lo permiten).
2. Abra `organizacion.html` en el navegador con conexión, rellene los nueve retos y pistas **en el equipo de la organización**, y genere los paquetes.
3. Descargue y guarde de manera privada los nueve JSON de equipo, los dos CSV de PIN y el respaldo. **No los suba al repositorio.**
4. En cada teléfono, abra `index.html`, instale la PWA e importe **solo el JSON del equipo correspondiente**.
5. Pruebe cada teléfono en modo avión, cierre y reabra la aplicación y confirme que conserva el progreso.
6. En el evento, la organización activa el equipo con su PIN; cada facilitador introduce el PIN de inicio al llegar y el PIN de validación después de comprobar el reto.
7. Después de las nueve estaciones y la confirmación del retorno, el equipo organiza los nueve pares en orden E1–E9 y abre el cofre.

## PIN de cinco dígitos (beta 1.5)

- La organización genera **180 PIN numéricos distintos**, entre 10000 y 99999, para los nueve equipos.
- Nueve PIN activan los equipos y nueve confirman sus retornos.
- Cada una de las 81 combinaciones equipo–estación recibe dos PIN diferentes: inicio y validación.
- El CSV de facilitadores se ordena por estación y equipo, con una fila por combinación.
- Los PIN se introducen con teclado numérico en el iPhone.
- **No reutilice los JSON generados con versiones anteriores:** genere paquetes nuevos, guarde el respaldo privado y reimporte el JSON correspondiente en cada teléfono.
- **Seguridad:** un PIN de cinco dígitos puede probarse por fuerza bruta fuera de línea. El cifrado no proporciona una garantía sólida de confidencialidad con esta longitud de PIN; es indispensable la comprobación física del reto y el control de los teléfonos y hojas de claves.

## Materiales y guía operativa

- `plantillas.html`: 26 páginas A4 para imprimir, incluidas 63 tarjetas de destinos, palabras de nombres/eslóganes y las nueve pruebas.
- `guia.html`: guía con organización, dinámicas iniciales, nueve estaciones, soluciones e ilustraciones. **Atención: el repositorio es público y las soluciones son accesibles. Antes del evento, mantenga estas páginas fuera del alcance de los participantes o traslade la guía a un repositorio privado.**
- Los nueve retos y pistas están precargados en `admin.js` para generar kits; los PIN y fragmentos se generan en el navegador del organizador y no se publican.

## Restricciones conocidas

- Sin red local ni internet no existe sincronización ni clasificación automática global.
- Los tiempos y resultados registrados en los teléfonos no son evidencia resistente a manipulaciones. La llegada del ganador debe verificarse presencialmente.
- El almacenamiento local puede perderse si se borran los datos del navegador, se desinstala la aplicación o se usa navegación privada. Haga pruebas y conserve respaldos.
- La confidencialidad de retos cifrados depende de que las claves de activación no se divulguen. No existe protección absoluta frente a usuarios con acceso físico al dispositivo.
- La aplicación debe abrirse por HTTPS o localhost para utilizar service workers y Web Crypto.
- Las nueve ubicaciones y pistas de traslado están precargadas en la beta 1.5, basadas en la imagen proporcionada por la organización. Verifique físicamente los puntos antes del evento.
- La instalación PWA varía según navegador y sistema operativo; pruebe los dispositivos reales antes del evento.

## Comprobación mínima

- Cada equipo A–I inicia en E1–E9 respectivamente y completa exactamente nueve estaciones.
- Cada estación requiere **dos claves distintas**: inicio y validación.
- No existe comodín de consulta docente; los docentes asistentes participan como integrantes de los equipos.
- El retorno a la estación inicial exige una clave específica.
- El cofre solo se habilita con nueve estaciones validadas y retorno confirmado.
- Los fragmentos se introducen en el orden E1–E9, independientemente del orden de visita.

## Privacidad

No se necesita información personal: basta un identificador A–I y el nombre creativo del equipo. No almacene nombres de estudiantes ni datos sensibles.
