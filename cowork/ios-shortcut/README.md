# Atajo de iOS — "Enviar a Cowork"

Captura desde **Safari en el iPhone/iPad** el texto limpio + metadatos de lo que
estás leyendo (incluido LinkedIn y X abiertos en Safari) y abre/manda un correo
a la dirección que lee Cowork. Reemplaza tu atajo actual que solo reenvía el link.

## Por qué desde Safari
La acción **"Ejecutar JavaScript en la página web"** solo se ejecuta cuando el
Atajo se lanza desde la **hoja de compartir de Safari**. A cambio, da acceso al
DOM real de la página → texto limpio + autor + URL + fecha.

> Punto ciego: compartir desde las **apps nativas** de LinkedIn/X entrega solo el
> enlace (sin DOM), así que ahí el JavaScript no corre. Para esos casos usa el
> **modo manual** de `cowork/index.html` (copiar texto en la app → pegar). Si
> abres el post en Safari, el Atajo funciona perfecto.

## Montaje paso a paso (app Atajos)

1. **Atajos → +** (nuevo atajo). Ponle nombre **Enviar a Cowork**.
2. Toca el icono de ajustes (ⓘ) → **Mostrar en hoja para compartir**: actívalo.
   En **Tipos de entrada de la hoja**, deja solo **Páginas web de Safari**
   (y opcionalmente *URL* y *Texto*).
3. Añade la acción **"Ejecutar JavaScript en la página web"**.
   - Pega dentro **todo** el contenido de [`extract.js`](./extract.js).
4. Añade **"Obtener valor de diccionario"**:
   - Diccionario = *Resultado de JavaScript*; Clave = `subject`.
   - Renómbralo a variable o usa "Establecer variable" → `Asunto`.
5. Añade otra **"Obtener valor de diccionario"**:
   - Diccionario = *Resultado de JavaScript*; Clave = `body`.
   - "Establecer variable" → `Cuerpo`.
6. Salida del correo — elige UNA:
   - **Opción A (Mail nativo, 1 toque para enviar):** acción **"Enviar correo"**.
     - Destinatario: la dirección que lee Cowork.
     - Asunto: variable `Asunto`. Cuerpo: variable `Cuerpo`.
     - Desactiva "Mostrar borrador" si quieres que se mande directo, o déjalo
       activado para revisar antes.
   - **Opción B (abrir Gmail):** acción **"Texto"** con este valor y luego
     **"Abrir URLs"**:
     ```
     https://mail.google.com/mail/?view=cm&fs=1&to=TU_DIRECCION_COWORK&su=[Asunto]&body=[Cuerpo]
     ```
     (inserta las variables `Asunto` y `Cuerpo` donde se indica; iOS abrirá la
     app de Gmail si está instalada).

   - **Opción C (añadir al lote del hub):** en vez de componer un correo,
     acción **"Texto"** con `URL_DEL_HUB#add=` + una acción **"Codificar URL"**
     sobre un diccionario JSON con `source`, `url`, `author` y `content`
     (obtenidos del Resultado de JavaScript), y **"Abrir URLs"**. La captura se
     suma al mismo lote que el bookmarklet de escritorio y sale en el digest.

## Uso
En Safari, sobre la página/post → **Compartir → Enviar a Cowork**. Si solo te
interesa un fragmento, **selecciónalo antes de compartir** y usará esa selección.

## Mantenimiento
La lógica de extracción vive en `extract.js` y es gemela de la del bookmarklet
(`../index.html`, función `bookmarkletSource()`). Si LinkedIn/X cambian sus
clases CSS, actualiza los selectores en ambos sitios.
