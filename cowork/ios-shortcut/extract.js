/*
 * Cowork Capture — extracción para Atajo de iOS
 * --------------------------------------------------------------
 * Pega TODO este código dentro de la acción "Ejecutar JavaScript
 * en la página web" del Atajo (ver README.md de esta carpeta).
 *
 * Esa acción SOLO funciona cuando el Atajo se lanza desde la hoja
 * de compartir de SAFARI. A cambio da acceso al DOM completo de la
 * página, así que extrae texto limpio + metadatos.
 *
 * Misma lógica que el bookmarklet de escritorio (coworkCapture en
 * ../index.html): si LinkedIn/X cambian sus clases, actualiza ambos.
 *
 * Devuelve, vía completion(), un diccionario con:
 *   subject, body, source, url, author
 */
var host = document.location.hostname;
var url = document.location.href;

function clean(t){ return (t||'').replace(/ /g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim(); }
function txt(el){ return el ? clean(el.innerText || el.textContent || '') : ''; }

var NOISE = [
  /^\d[\d.,\s]*$/,
  /^\d[\d.,]*\s*(reacciones?|reactions?|comentarios?|comments?|reposts?|veces compartido|me gusta|likes?|visualizaciones?|impressions?|seguidores?|followers?)$/i,
  /^(mostrar|ver|show|see)\s+(traducci[oó]n|translation)$/i,
  /^(promocionado|promoted|sponsored|publicidad)$/i,
  /^(cargar m[aá]s comentarios|load more comments)$/i,
  /^…?\s*(ver m[aá]s|see more|mostrar m[aá]s|show more)\s*…?$/i,
  /^(seguir|siguiendo|follow|following|conectar|connect)$/i,
  /^[•·∙|\s]+$/
];
function denoise(t){
  return t.split('\n').filter(function(L){
    var s = L.trim();
    if(!s) return true;
    for(var i=0;i<NOISE.length;i++){ if(NOISE[i].test(s)) return false; }
    return true;
  }).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}

var source = 'Web';
if(/(^|\.)x\.com$|twitter\.com$/.test(host)) source = 'X';
else if(/linkedin\.com$/.test(host)) source = 'LinkedIn';
else source = host.replace(/^www\./,'');

var sel = ((window.getSelection && window.getSelection().toString()) || '').trim();
var pieces = [], authors = [], postDate = '';

if(sel){
  pieces.push(sel);
} else if(source === 'X'){
  var sid = (url.match(/status\/(\d+)/)||[])[1];
  var arts = document.querySelectorAll('article[data-testid="tweet"]');
  if(!arts.length) arts = document.querySelectorAll('article');
  var list = []; arts.forEach(function(a){ list.push(a); });
  if(sid){
    var main = list.filter(function(a){ var t=a.querySelector('time'); return t && t.parentElement && t.parentElement.href && t.parentElement.href.indexOf(sid) >= 0; });
    if(main.length) list = [main[0]];
  }
  list.forEach(function(a){
    var name = txt(a.querySelector('[data-testid="User-Name"]')).split('\n')[0];
    var body = txt(a.querySelector('[data-testid="tweetText"]'));
    var tm = a.querySelector('time');
    var when = tm ? tm.getAttribute('datetime') : '';
    if(when && !postDate) postDate = when;
    var media = a.querySelector('[data-testid="tweetPhoto"], video') ? '\n[contiene imagen/video]' : '';
    if(body){
      pieces.push((name ? name+'\n' : '') + body + media);
      if(name && authors.indexOf(name) < 0) authors.push(name);
    }
  });
} else if(source === 'LinkedIn'){
  var idm = url.match(/activity:(\d+)/);
  var root = null;
  if(idm){
    root = document.querySelector('[data-urn*="'+idm[1]+'"]');
    if(root && !root.classList.contains('feed-shared-update-v2')){
      root = root.closest('.feed-shared-update-v2') || root.querySelector('.feed-shared-update-v2') || root;
    }
  }
  var containers;
  if(root){ containers = [root]; }
  else {
    var all = document.querySelectorAll('.feed-shared-update-v2');
    containers = all.length ? [all[0]] : [document.querySelector('main') || document.body];
  }
  containers.forEach(function(u){
    var name = txt(u.querySelector('.update-components-actor__title')).split('\n')[0].replace(/\s*[•·].*$/,'').trim();
    var headline = txt(u.querySelector('.update-components-actor__description')).split('\n')[0];
    var when = txt(u.querySelector('.update-components-actor__sub-description')).split('\n')[0].replace(/\s*[•·].*$/,'').trim();
    var bodyEl = u.querySelector('.update-components-text') || u.querySelector('.feed-shared-update-v2__description') || u.querySelector('.update-components-update-v2__commentary');
    var body = txt(bodyEl);
    if(!body) body = txt(u);
    var hdr = (name||'') + (headline ? ' — '+headline : '') + (when ? ' ('+when+')' : '');
    pieces.push((hdr.trim() ? hdr.trim()+'\n' : '') + body);
    if(name) authors.push(name);
  });
} else {
  var art = document.querySelector('article') || document.querySelector('main') || document.body;
  pieces.push(txt(art));
  var metaAuthor = document.querySelector('meta[name="author"], meta[property="article:author"]');
  if(metaAuthor && metaAuthor.content) authors.push(metaAuthor.content);
  var metaDate = document.querySelector('meta[property="article:published_time"], meta[name="date"]');
  if(metaDate && metaDate.content) postDate = metaDate.content;
}

var content = denoise(pieces.join('\n\n----------\n\n'));
var captured = new Date().toISOString().slice(0,16).replace('T',' ');
var author = authors.join(', ');

var header =
  'FUENTE: ' + source + '\n' +
  'ORIGEN: ' + url + '\n' +
  (author ? 'AUTOR: ' + author + '\n' : '') +
  (postDate ? 'FECHA POST: ' + postDate + '\n' : '') +
  'CAPTURADO: ' + captured + ' UTC\n' +
  '\n----------\n\n';

var snippet = content.replace(/\n/g,' ').slice(0,60);
var subject = '[' + source + '] ' + (snippet || 'captura');
var body = content ? (header + content) : (header + '[No se pudo extraer texto del cuerpo. Revisa el enlace de ORIGEN.]');

completion({ subject: subject, body: body, source: source, url: url, author: author });
