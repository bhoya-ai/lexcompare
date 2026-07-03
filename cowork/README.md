# Cowork Capture

Sistema para capturar inputs de **LinkedIn** y **X**, acumularlos en un lote y
mandarlos limpios a Gmail en un **único correo digest**, de forma que **Cowork**
pueda leerlos bien. Resuelve dos problemas: el reenvío directo de esas
plataformas a Gmail llega sucio/truncado, y un correo por post genera demasiada
fricción cuando hay muchos inputs.

## Arquitectura (v2 — lote y digest)

```
LinkedIn / X (navegador)          Página hub (artefacto)             Gmail
┌──────────────────────┐   #add=  ┌──────────────────────┐  compose ┌─────────┐
│ bookmarklet extrae y ├─────────►│ lote en localStorage  ├─────────►│ 1 correo│
│ limpia el post       │  (hash)  │ revisar/quitar/enviar │  digest  │ → Cowork│
└──────────────────────┘          └──────────────────────┘          └─────────┘
```

- **Página hub**: publicada como artefacto de claude.ai (URL fija; se actualiza
  al republicar, sin re-descargas). Este `index.html` es el código fuente; el
  artefacto se publica desde él.
- **Bookmarklet**: extrae y limpia el post de la página abierta y lo deposita en
  el hub vía fragmento de URL (`#add=<json>`), que **no viaja al servidor**.
  Ya no lleva el email incrustado → cambiar el destino no obliga a reinstalarlo;
  solo hay que re-arrastrarlo si cambia la lógica de extracción.
- **Digest**: un correo con N capturas, cada una con bloque de metadatos
  (`FUENTE / ORIGEN / AUTOR / FECHA POST / CAPTURADO`). Si supera ~8000
  caracteres, el texto completo queda en el portapapeles para pegar en Gmail.
- **Modo manual**: pegar texto a mano (móvil, apps nativas) → limpia y añade al
  mismo lote.

## Extracción

- **LinkedIn**: si la URL es de un post (`activity:ID`), apunta solo a ese
  contenedor vía `[data-urn]`; extrae cuerpo (`.update-components-text`) +
  autor/titular/fecha. Capturar desde el post individual, no desde el feed.
- **X**: en páginas `/status/ID` selecciona el tweet principal por su permalink.
- **Selección manual**: si el usuario selecciona texto antes de pulsar, se usa
  esa selección (red de seguridad universal).
- **Filtro de ruido** por líneas: contadores de reacciones, "Mostrar
  traducción", "Promocionado", "Cargar más comentarios", "Seguir", etc.

## Limitaciones conocidas

- Los selectores de LinkedIn/X cambian con el tiempo. Cuando fallen: selección
  manual o modo manual. Los selectores viven en `coworkCapture()` (aquí) y en
  `ios-shortcut/extract.js` — actualizar ambos.
- El lote vive en `localStorage` del navegador donde se abre el hub: no se
  sincroniza entre dispositivos.
- Gmail recorta cuerpos largos en la URL de compose: el digest completo se copia
  siempre al portapapeles como respaldo.

## iOS

Ver `ios-shortcut/`: Atajo que extrae texto limpio + metadatos desde Safari.
