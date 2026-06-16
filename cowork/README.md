# Cowork Capture

Sistema para capturar inputs de **LinkedIn** y **X** y mandarlos limpios a Gmail,
de forma que **Cowork** pueda leerlos bien. Resuelve el problema de que el reenvío
directo de esas plataformas a Gmail llega truncado, con imágenes o sin formato.

## Cómo funciona

1. **Página de configuración** (`index.html`): abre el archivo en el navegador.
   - Guardas el email de destino que lee Cowork (se queda en `localStorage`).
   - Generas un **bookmarklet** ("Enviar a Cowork") con ese email ya incrustado.
2. **Bookmarklet**: lo arrastras a la barra de marcadores. Estando en un post de
   LinkedIn o X, lo pulsas y:
   - Lee el contenido del post desde el DOM de la página que ya tienes abierta.
   - Lo limpia y normaliza (autor, texto, URL, fecha de captura).
   - Copia el texto completo al portapapeles (respaldo).
   - Abre Gmail con un correo ya dirigido a Cowork y rellenado.
3. **Modo manual**: si prefieres pegar el texto a mano (p. ej. desde el móvil),
   lo limpia igual y abre el correo.
4. **Atajo de iOS** (`ios-shortcut/`): para capturar desde **Safari en el móvil**
   con texto limpio + metadatos (fuente, origen, autor, fecha), no solo el link.
   Misma lógica de extracción que el bookmarklet. Ver `ios-shortcut/README.md`.

## Por qué este enfoque

LinkedIn y X **prohíben el scraping automático** en servidor y su API es limitada
o de pago. Este sistema no rastrea nada: solo lee la página que **tú ya estás
viendo** en tu propio navegador, igual que copiar y pegar a mano pero
estructurado. No hay backend; todo ocurre en el cliente.

## Detalles técnicos

- **Extracción X**: `article[data-testid="tweet"]`, `[data-testid="tweetText"]`,
  `[data-testid="User-Name"]`, `time[datetime]`. Captura los tweets visibles
  (útil para hilos).
- **Extracción LinkedIn**: `.feed-shared-update-v2`, `.update-components-text`,
  `.update-components-actor__title`. Deduplica posts repetidos.
- **Prioridad a la selección**: si seleccionas texto con el ratón antes de pulsar,
  usa exactamente esa selección (sirve para cualquier web).
- **Salida**: URL de redacción de Gmail (`view=cm`). Si el cuerpo supera ~5000
  caracteres, recorta en el correo pero deja el texto completo en el portapapeles.

## Limitaciones

- Los selectores de LinkedIn/X cambian con el tiempo; si dejan de extraer bien,
  usa la **selección manual** (seleccionar texto antes de pulsar) o el **modo
  manual** de la página. Los selectores se actualizan en `bookmarkletSource()`
  dentro de `index.html`.
- Gmail web acorta cuerpos muy largos en la URL: por eso siempre se copia el
  texto completo al portapapeles.
