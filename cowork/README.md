# Cowork Capture

Sistema para capturar inputs de **LinkedIn** y **X**, acumularlos en un lote y
exportarlos como **archivo Markdown** que **Cowork** procesa desde una carpeta
(Drive o local) o adjunto a la conversación. Resuelve el problema original:
los reenvíos de esas plataformas a Gmail llegaban sucios/truncados y se perdían
inputs valiosos.

## Arquitectura (v4 — lote en el sitio + digest a archivo)

```
LinkedIn / X (navegador)                        Carpeta / Cowork
┌────────────────────────────────────┐  .md   ┌──────────────────┐
│ bookmarklet: extrae + limpia posts ├───────►│ cowork-digest-   │
│ lote en el propio sitio + panel    │descarga│ linkedin-FECHA.md│
│ (confirmar, copiar, descargar)     │        │ → Cowork procesa │
└────────────────────────────────────┘        └──────────────────┘
```

- **Todo ocurre dentro de la página** de LinkedIn/X: el bookmarklet extrae y
  limpia el post, lo guarda en el lote y muestra un panel flotante. Sin
  transporte entre páginas (los visores embebidos y los límites de gesto de
  usuario lo hacían inviable) y sin email (la URL de Gmail compose limita el
  tamaño y obligaba a trocear).
- **Digest**: `Descargar digest (n)` genera un `.md` con cabecera y una sección
  por captura (`Fuente / Origen / Autor / Fecha post / Capturado` + contenido).
  Sin límite de tamaño. También se puede `Copiar` para pegarlo directamente en
  una conversación de Cowork.
- **Almacenamiento con escalones verificados**: localStorage del sitio
  (LinkedIn suele tenerlo lleno y rechaza escrituras) → sessionStorage de la
  pestaña → `window.name` → memoria del panel. Cada escritura se relee para
  confirmar; el panel avisa cuando el lote vive solo en la pestaña.
- **Página hub** (este `index.html`, publicada como artefacto de claude.ai):
  solo genera el bookmarklet (sin ningún dato personal incrustado) y ofrece el
  modo manual (pegar texto → limpiar → descargar .md). 
- **Deduplicación** por contenido; prioridad a la selección del usuario;
  panel construido sin `innerHTML` (Trusted Types de X) ni `<style>` inyectado
  (CSP).

## Extracción

- **LinkedIn**: con URL de post (`activity:ID`) apunta solo a ese contenedor
  vía `[data-urn]`; extrae cuerpo (`.update-components-text`) + autor/titular/
  fecha. Capturar desde el post individual, no desde el feed.
- **X**: en `/status/ID` selecciona el tweet principal por su permalink.
- **Filtro de ruido** por líneas: contadores de reacciones, "Mostrar
  traducción", "Promocionado", "Seguir", etc.

## Limitaciones conocidas

- Los selectores de LinkedIn/X cambian con el tiempo. Red de seguridad:
  seleccionar el texto con el ratón antes de pulsar, o el modo manual.
  Selectores en `coworkCapture()` (aquí) y `ios-shortcut/extract.js`.
- El lote vive por red y por navegador (no se sincroniza entre dispositivos).
- La carpeta fija usa la File System Access API (Chrome/Edge): se elige una
  vez y los digests se escriben ahí directamente; en navegadores sin la API
  (Safari) cae a la descarga clásica en Descargas, y en último caso al
  portapapeles.

## Historial de decisiones

- v1–v2: correo por captura / hub con lote y digest por email. Descartados:
  el visor de artefactos bloquea hash y portapapeles; el clic de marcador no
  cuenta como gesto de usuario; la URL de Gmail compose limita el tamaño
  (Error 400) y trocear en partes creaba un problema de reensamblado.
- v3: lote y panel dentro del propio sitio (válido, se conserva).
- v4: entrega por archivo .md en vez de email (decisión de producto:
  procesar y unir correos de vuelta no tenía sentido).

## iOS

Ver `ios-shortcut/`: Atajo que extrae texto limpio + metadatos desde Safari.
Pendiente de alinear con v4 (guardar en Archivos/Drive en vez de email).
