# Halloween Night · invitación digital

Experiencia narrativa responsive hecha con HTML, CSS y JavaScript. No requiere instalar paquetes ni compilar: abre `index.html` localmente o publica la carpeta raíz en GitHub Pages. GSAP y ScrollTrigger se cargan desde CDN; si no están disponibles, la invitación conserva un modo de movimiento reducido y la galería sigue siendo deslizable.

## Personalizar el evento

En las primeras líneas de `script.js`, edita el objeto `EVENT`:

- `guestName`: nombre de la persona invitada.
- `date`: fecha y hora del evento en formato ISO con zona horaria.
- `passCount`: máximo de almas del pase; determina las opciones del RSVP.
- `locationName` y `address`: lugar y dirección que se usan en la invitación y Google Maps.
- `whatsappNumber`: lada y teléfono, solo dígitos, sin `+`, espacios ni guiones.

El itinerario, los textos y el contenido de las secciones están en `index.html`. Cambia sus textos a la par de los datos del evento. Para habilitar WhatsApp, configura un número real con entre 8 y 15 dígitos; el botón prellena el mensaje y no envía nada sin que la persona lo confirme.

## Archivos

- `index.html`: estructura, metadatos y contenido.
- `style.css`: dirección visual, animaciones CSS y responsive.
- `script.js`: animaciones GSAP, cuenta atrás, parallax, audio y RSVP.
- `assets/images/`: escenas originales optimizadas (con encuadre vertical y panorámico para el hero), motivos SVG y prompts de generación.
- `assets/audio/`, `assets/models/` y `assets/textures/`: notas de implementación para recursos opcionales.

El sonido ambiental se sintetiza y empieza apagado; solo se activa al pulsar SOUND. Las imágenes de las escenas son originales generadas para esta invitación, no fotografías documentales de una locación real.

## Ajustes para móvil

En teléfonos y dispositivos con `Save-Data`, el hero deja de fijarse durante el scroll, la galería usa desplazamiento horizontal nativo con ajuste por escena y las revelaciones evitan los filtros de desenfoque. Las partículas bajan a 9, se limitan a 24 FPS y usan una escala de dibujo reducida; con `Save-Data` o movimiento reducido se desactivan. Las imágenes del hero cambian de encuadre según el ancho y la galería se descarga de forma diferida.
