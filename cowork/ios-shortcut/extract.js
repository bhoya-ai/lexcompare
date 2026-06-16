/*
 * Cowork Capture — extracción para Atajo de iOS
 * --------------------------------------------------------------
 * Pega TODO este código dentro de la acción "Ejecutar JavaScript
 * en la página web" del Atajo (ver README.md de esta carpeta).
 *
 * Esa acción SOLO funciona cuando el Atajo se lanza desde la hoja
 * de compartir de SAFARI. A cambio da acceso al DOM completo de la
 * página, así que extrae texto limpio + metadatos igual que el
 * bookmarklet de escritorio.
 *
 * Devuelve, vía completion(), un diccionario con:
 *   subject  -> asunto sugerido para el correo
 *   body     -> texto limpio + cabecera de metadatos
 *   source   -> "X" | "LinkedIn" | dominio
 *   url       -> URL de origen
 *   author   -> autor/es detectados (si los hay)
 * El siguiente paso del Atajo usa "Obtener valor de diccionario".
 */
var host = document.location.hostname;
var url = document.location.href;

function clean(t){
  return (t || '')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function txt(el){ return el ? clean(el.innerText || el.textContent || '') : ''; }

var source = 'Web';
if (/(^|\.)x\.com$|twitter\.com$/.test(host)) source = 'X';
else if (/linkedin\.com$/.test(host)) source = 'LinkedIn';
else source = host.replace(/^www\./, '');

var sel = ((window.getSelection && window.getSelection().toString()) || '').trim();

var pieces = [];
var authors = [];
var postDate = '';

if (sel) {
  pieces.push(sel);
} else if (source === 'X') {
  var arts = document.querySelectorAll('article[data-testid="tweet"]');
  if (!arts.length) arts = document.querySelectorAll('article');
  arts.forEach(function(a){
    var name = txt(a.querySelector('[data-testid="User-Name"]'));
    var body = txt(a.querySelector('[data-testid="tweetText"]'));
    var tm = a.querySelector('time');
    var when = tm ? tm.getAttribute('datetime') : '';
    if (when && !postDate) postDate = when;
    var link = (tm && tm.parentElement && tm.parentElement.href) ? tm.parentElement.href : '';
    var media = a.querySelector('[data-testid="tweetPhoto"], video') ? '\n[contiene imagen/video]' : '';
    var head = (name ? name : '') + (when ? ' (' + when + ')' : '');
    var piece = ((head ? head + '\n' : '') + body + media + (link ? '\n' + link : '')).trim();
    if (body || name) {
      pieces.push(piece);
      if (name && authors.indexOf(name) < 0) authors.push(name.split('\n')[0]);
    }
  });
} else if (source === 'LinkedIn') {
  var ups = document.querySelectorAll('.feed-shared-update-v2, .feed-shared-update-v2__content, div[data-urn]');
  var seen = {};
  ups.forEach(function(u){
    var actor = txt(u.querySelector('.update-components-actor__title, .update-components-actor__name'));
    var c = u.querySelector('.update-components-text, .feed-shared-update-v2__description, .update-components-update-v2__commentary');
    var body = txt(c);
    if (!body || seen[body]) return;
    seen[body] = 1;
    pieces.push(((actor ? actor + '\n' : '') + body).trim());
    if (actor && authors.indexOf(actor) < 0) authors.push(actor.split('\n')[0]);
  });
  if (!pieces.length) pieces.push(txt(document.querySelector('main') || document.body));
} else {
  /* Web genérica: prioriza el <article> principal */
  var art = document.querySelector('article') || document.querySelector('main') || document.body;
  pieces.push(txt(art));
  var metaAuthor = document.querySelector('meta[name="author"], meta[property="article:author"]');
  if (metaAuthor && metaAuthor.content) authors.push(metaAuthor.content);
  var metaDate = document.querySelector('meta[property="article:published_time"], meta[name="date"]');
  if (metaDate && metaDate.content) postDate = metaDate.content;
}

var content = pieces.join('\n\n----------\n\n');
var captured = new Date().toISOString().slice(0, 16).replace('T', ' ');
var author = authors.join(', ');

var header =
  'FUENTE: ' + source + '\n' +
  'ORIGEN: ' + url + '\n' +
  (author ? 'AUTOR: ' + author + '\n' : '') +
  (postDate ? 'FECHA POST: ' + postDate + '\n' : '') +
  'CAPTURADO: ' + captured + ' UTC\n' +
  '\n----------\n\n';

var snippet = clean(content).replace(/\n/g, ' ').slice(0, 60);
var subject = '[' + source + '] ' + (snippet || 'captura');
var body = content ? (header + content) : (header + '[No se pudo extraer texto del cuerpo. Revisa el enlace de ORIGEN.]');

completion({
  subject: subject,
  body: body,
  source: source,
  url: url,
  author: author
});
