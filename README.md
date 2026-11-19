# Agentes de Información Turística — Ecoparque de Tulcán

**Versión beta 1.3 · aplicación web progresiva instalable y sin conexión durante la actividad.**

Este repositorio contiene **solo código público**. No suba paquetes de equipos, claves de facilitadores, registros de participantes ni el respaldo del organizador.

## Archivos

- `index.html`, `app.js`, `style.css`: aplicación de cada equipo.
- `organizacion.html`, `admin.js`: generador local de nueve paquetes cifrados y 180 PIN numéricos únicos de cinco dígitos.
- `sw.js`, `manifest.webmanifest`, `icon.svg`: instalación PWA y caché sin conexión.

## Palabras turísticas (beta 1.3)

- La generación asigna una **palabra turística diferente a cada equipo** para activación y otra para retorno.
- Cada estación recibe **dos palabras distintas** (inicio y validación), compartidas por los nueve equipos. Cada facilitador necesita recordar únicamente sus dos palabras.
- Las palabras se eligen aleatoriamente entre términos de hasta nueve letras, en mayúsculas y sin tildes. La aplicación acepta entradas con o sin tildes y sin distinguir mayúsculas.
- El panel conserva en el navegador el paquete de prueba y el conjunto real. Permite descargar los nueve JSON, los dos CSV de palabras y un respaldo privado.
- **Los paquetes antiguos con claves largas no se convierten automáticamente**. Genere los nuevos paquetes y vuelva a importarlos en cada celular antes del evento.
- **Seguridad:** las palabras son fáciles de adivinar y el vocabulario está incluido en código público. La encriptación AES-GCM no convierte una contraseña de baja entropía en un secreto fuerte. No considere las palabras una barrera criptográfica contra estudiantes con conocimientos técnicos; el control efectivo depende de la verificación presencial de los facilitadores.
- No publique ni comparta los archivos JSON de respaldo y CSV de palabras; se almacenan localmente en el navegador de organización, por lo que conviene descargar copias privadas.

## Preparación

1. Aloje estos archivos mediante HTTPS (por ejemplo, GitHub Pages si su cuenta y visibilidad lo permiten).
2. Abra `organizacion.html` en el navegador con conexión, rellene los nueve retos y pistas **en el equipo de la organización**, y genere los paquetes.
3. Descargue y guarde de manera privada los nueve JSON de equipo, los dos CSV de palabras y el respaldo. **No los suba al repositorio.**
4. En cada teléfono, abra `index.html`, instale la PWA e importe **solo el JSON del equipo correspondiente**.
5. Pruebe cada teléfono en modo avión, cierre y reabra la aplicación y confirme que conserva el progreso.
6. En el evento, la organización activa el equipo con su palabra; cada facilitador introduce la palabra de inicio al llegar y la palabra de validación después de comprobar el reto.
7. Después de las nueve estaciones y la confirmación del retorno, el equipo organiza los nueve pares en orden E1–E9 y abre el cofre.

## PIN de cinco dígitos (beta 1.4)

- La organización genera **180 PIN numéricos distintos**, entre 10000 y 99999, para los nueve equipos.
- Nueve PIN activan los equipos y nueve confirman sus retornos.
- Cada una de las 81 combinaciones equipo–estación recibe dos PIN diferentes: inicio y validación.
- El CSV de facilitadores se ordena por estación y equipo, con una fila por combinación.
- Los PIN se introducen con teclado numérico en el iPhone.
- **No reutilice los JSON generados con versiones anteriores:** genere paquetes nuevos, guarde el respaldo privado y reimporte el JSON correspondiente en cada teléfono.
- **Seguridad:** un PIN de cinco dígitos puede probarse por fuerza bruta fuera de línea. El cifrado no proporciona una garantía sólida de confidencialidad con esta longitud de PIN; es indispensable la comprobación física del reto y el control de los teléfonos y hojas de claves.

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
