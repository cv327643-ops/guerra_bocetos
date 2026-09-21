// Guerra de Bocetos — servidor Node (Railway)
// Sirve la página de inscripción y expone /stats y /register.
// Los datos viven en Supabase, en el esquema aislado "guerra_bocetos"
// (separado del ERP de Neomech). Este servidor solo habla con dos
// funciones RPC públicas: gb_stats() y gb_register(payload).

const http = require("http");
const { URL } = require("url");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = process.env.PORT || 3000;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. " +
      "Configúralas en las variables de entorno del servicio en Railway."
  );
}

async function callRpc(fnName, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    return { error: (data && data.message) || text || "rpc error" };
  }
  return { data };
}

const PAGE = [
  "<!doctype html>",
  '<html lang="es">',
  "<head>",
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  "<title>Guerra de Bocetos — Inscripción</title>",
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">',
  "<style>",
  ":root{--bg:#f3efe7;--surface:#ffffff;--ink:#17161a;--ink-soft:#6b675f;--line:#17161a;--accent:#e8422a;--accent-ink:#fffaf3;--good:#1c8a53;--good-bg:#e5f5ec;--chip-bg:#fdece7;--shadow:3px 3px 0 var(--line);}",
  "@media (prefers-color-scheme: dark){:root{--bg:#141316;--surface:#1f1e22;--ink:#f3f0ea;--ink-soft:#a9a49b;--line:#f3f0ea;--accent:#ff6a52;--accent-ink:#17161a;--good:#4fd48c;--good-bg:#123024;--chip-bg:#2e1c19;} select{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9'%3E%3Cpath d='M1 1l6 6 6-6' stroke='%23f3f0ea' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");}}",
  "*{box-sizing:border-box;}",
  "body{background:var(--bg);color:var(--ink);font-family:'Work Sans',system-ui,sans-serif;margin:0;padding:0 16px 48px;}",
  ".wrap{max-width:640px;margin:0 auto;}",
  "h1,h2,h3{font-family:'Anton','Work Sans',sans-serif;font-weight:400;letter-spacing:.02em;text-transform:uppercase;}",
  ".mono{font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;}",
  "header{padding:28px 0 10px;}",
  "header h1{font-size:2rem;margin:0 0 4px;}",
  "header p{margin:0;color:var(--ink-soft);font-size:.9rem;}",
  ".stats{display:flex;gap:10px;margin:16px 0;}",
  ".stat{flex:1;background:var(--surface);border:2px solid var(--line);border-radius:10px;padding:10px 12px;box-shadow:var(--shadow);text-align:center;}",
  ".stat .num{font-family:'Anton',sans-serif;font-size:1.6rem;}",
  ".stat .label{font-size:.7rem;text-transform:uppercase;color:var(--ink-soft);letter-spacing:.03em;}",
  ".card{background:var(--surface);border:2px solid var(--line);border-radius:12px;padding:18px;box-shadow:var(--shadow);margin-bottom:18px;}",
  ".card h2{font-size:1.3rem;margin:0 0 12px;}",
  "label{display:block;font-size:.78rem;font-weight:600;margin-bottom:4px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.02em;}",
  "input[type=text],input[type=tel],input[type=email],select{width:100%;padding:10px;border:2px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font-family:inherit;font-size:.95rem;margin-bottom:12px;}",
  "select{appearance:none;-webkit-appearance:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9'%3E%3Cpath d='M1 1l6 6 6-6' stroke='%2317161a' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center;padding-right:34px;}",
  ".row{display:flex;gap:10px;}",
  ".row>*{flex:1;min-width:0;}",
  ".check{display:flex;align-items:flex-start;gap:8px;margin-bottom:14px;font-size:.85rem;line-height:1.4;}",
  ".check input{margin-top:3px;}",
  "details{margin-bottom:14px;}",
  "details summary{cursor:pointer;font-weight:700;font-size:.85rem;color:var(--accent);}",
  ".legal{font-size:.78rem;color:var(--ink-soft);border-left:3px solid var(--accent);padding-left:10px;margin-top:8px;}",
  "button.btn{width:100%;border:2px solid var(--line);border-radius:8px;padding:14px;font-family:'Work Sans',sans-serif;font-weight:700;font-size:1rem;cursor:pointer;background:var(--accent);color:var(--accent-ink);box-shadow:2px 2px 0 var(--line);text-transform:uppercase;letter-spacing:.02em;}",
  "button.btn:disabled{opacity:.5;cursor:not-allowed;}",
  "#msg{margin-top:12px;font-size:.88rem;font-weight:600;}",
  "#msg.ok{color:var(--good);}",
  "#msg.err{color:var(--accent);}",
  ".ig-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;}",
  ".ig-chip{background:var(--chip-bg);color:var(--accent);border:2px solid var(--line);border-radius:999px;padding:6px 12px;font-size:.85rem;font-weight:600;}",
  ".empty{color:var(--ink-soft);font-size:.85rem;}",
  "footer{text-align:center;color:var(--ink-soft);font-size:.75rem;margin-top:24px;}",
  "</style>",
  "</head>",
  '<body><div class="wrap">',
  "<header><h1>Guerra de Bocetos</h1><p>Inscripción oficial — valor de inscripción: $25.000 COP. Los 8 mejores pasan a la fase final.</p></header>",
  '<div class="stats">',
  '<div class="stat"><div class="num mono" id="stat-count">—</div><div class="label">Inscritos</div></div>',
  '<div class="stat"><div class="num mono">8</div><div class="label">Pasan a la final</div></div>',
  "</div>",
  '<div class="card">',
  "<h2>Formulario de inscripción</h2>",
  '<form id="form">',
  '<label for="nombre">Nombre completo</label>',
  '<input type="text" id="nombre" required>',
  '<div class="row">',
  '<div><label for="tipo_documento">Tipo de documento</label><select id="tipo_documento" required><option value="" disabled selected>Selecciona...</option><option value="CC">Cédula de ciudadanía (CC)</option><option value="TI">Tarjeta de identidad (TI)</option><option value="CE">Cédula de extranjería (CE)</option><option value="PA">Pasaporte (PA)</option><option value="RC">Registro civil (RC)</option></select></div>',
  '<div><label for="numero_documento">Número de documento</label><input type="text" id="numero_documento" inputmode="numeric" required></div>',
  "</div>",
  '<label for="telefono">Teléfono / WhatsApp</label>',
  '<input type="tel" id="telefono" required>',
  '<label for="correo">Correo electrónico</label>',
  '<input type="email" id="correo" required>',
  '<label for="ciudad">Ciudad</label>',
  '<input type="text" id="ciudad" required>',
  '<label for="instagram">Instagram (se mostrará en la lista pública de participantes)</label>',
  '<input type="text" id="instagram" placeholder="@tuusuario">',
  '<label for="referencia_pago">Referencia o comprobante de pago ($25.000)</label>',
  '<input type="text" id="referencia_pago" required>',
  "<details><summary>Leer autorización de tratamiento de datos (Habeas Data)</summary>",
  '<div class="legal">',
  'De acuerdo con la Ley 1581 de 2012 y el Decreto 1377 de 2013, autorizo de manera previa, expresa e informada al equipo organizador del evento "Guerra de Bocetos" (contacto: cv327643@gmail.com) para recolectar, almacenar, usar y tratar mis datos personales suministrados en este formulario, con el fin de: (1) gestionar mi inscripción y participación en el evento; (2) hacer seguimiento a mi participación durante las distintas fases, incluida la selección de los 8 finalistas; (3) contactarme sobre horarios, resultados, premios o cambios de logística; y, si autorizo el uso de imagen, (4) usar fotografías o videos en los que aparezca durante el evento con fines de promoción en redes sociales. Puedo conocer, actualizar, rectificar o suprimir mis datos, y revocar esta autorización en cualquier momento escribiendo al correo de contacto. Mis datos serán tratados de forma confidencial y no se compartirán con terceros distintos a los necesarios para organizar el evento, salvo requerimiento legal.',
  "</div></details>",
  '<div class="check"><input type="checkbox" id="habeas" required><label for="habeas" style="margin:0;text-transform:none;font-weight:500;">Sí, he leído y acepto la autorización de tratamiento de datos personales (obligatorio).</label></div>',
  '<div class="check"><input type="checkbox" id="imagen"><label for="imagen" style="margin:0;text-transform:none;font-weight:500;">Autorizo adicionalmente el uso de mi imagen (fotos/video) tomada durante el evento con fines de promoción (opcional).</label></div>',
  '<button class="btn" type="submit" id="submit-btn">Inscribirme</button>',
  '<div id="msg"></div>',
  "</form>",
  "</div>",
  '<div class="card">',
  "<h2>Participantes inscritos</h2>",
  '<p class="empty" style="margin-top:-6px;">Instagram de quienes ya se inscribieron y lo compartieron:</p>',
  '<div class="ig-grid" id="ig-grid"><span class="empty">Cargando…</span></div>',
  "</div>",
  "<footer>Guerra de Bocetos — tus datos se almacenan de forma segura y solo el equipo organizador puede verlos completos.</footer>",
  "</div>",
  "<script>",
  "var BASE = window.location.pathname.replace(/\\/$/, '');",
  "function esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\\'':'&#39;'}[c];});}",
  "function loadStats(){",
  "  fetch(BASE + '/stats').then(function(r){return r.json();}).then(function(data){",
  "    document.getElementById('stat-count').textContent = data.count;",
  "    var grid = document.getElementById('ig-grid');",
  "    if(!data.instagrams || !data.instagrams.length){ grid.innerHTML = '<span class=\"empty\">Aún nadie ha compartido su Instagram.</span>'; return; }",
  "    grid.innerHTML = data.instagrams.map(function(h){ return '<span class=\"ig-chip\">' + esc(h) + '</span>'; }).join('');",
  "  }).catch(function(){});",
  "}",
  "document.getElementById('form').addEventListener('submit', function(ev){",
  "  ev.preventDefault();",
  "  var msg = document.getElementById('msg');",
  "  var btn = document.getElementById('submit-btn');",
  "  msg.textContent = ''; msg.className = '';",
  "  var payload = {",
  "    nombre: document.getElementById('nombre').value.trim(),",
  "    tipo_documento: document.getElementById('tipo_documento').value.trim(),",
  "    numero_documento: document.getElementById('numero_documento').value.trim(),",
  "    telefono: document.getElementById('telefono').value.trim(),",
  "    correo: document.getElementById('correo').value.trim(),",
  "    ciudad: document.getElementById('ciudad').value.trim(),",
  "    instagram: document.getElementById('instagram').value.trim(),",
  "    referencia_pago: document.getElementById('referencia_pago').value.trim(),",
  "    habeas_data_aceptado: document.getElementById('habeas').checked,",
  "    autoriza_imagen: document.getElementById('imagen').checked",
  "  };",
  "  if(!payload.habeas_data_aceptado){ msg.textContent = 'Debes aceptar la autorización de datos para inscribirte.'; msg.className='err'; return; }",
  "  btn.disabled = true; btn.textContent = 'Enviando...';",
  "  fetch(BASE + '/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })",
  "    .then(function(r){ return r.json().then(function(d){ return {status:r.status, body:d}; }); })",
  "    .then(function(res){",
  "      if(res.status === 200 && res.body.ok){",
  "        msg.textContent = '¡Listo! Quedaste inscrito en Guerra de Bocetos.'; msg.className='ok';",
  "        document.getElementById('form').reset();",
  "        loadStats();",
  "      } else {",
  "        msg.textContent = res.body.error || 'No se pudo completar la inscripción.'; msg.className='err';",
  "      }",
  "    })",
  "    .catch(function(){ msg.textContent = 'Error de conexión. Intenta de nuevo.'; msg.className='err'; })",
  "    .then(function(){ btn.disabled = false; btn.textContent = 'Inscribirme'; });",
  "});",
  "loadStats();",
  "setInterval(loadStats, 25000);",
  "</script>",
  "</body></html>",
].join("\n");

const ADMIN_PAGE = [
  "<!doctype html>",
  '<html lang="es">',
  "<head>",
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  "<title>Guerra de Bocetos — Admin</title>",
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">',
  "<style>",
  ":root{--bg:#f3efe7;--surface:#ffffff;--ink:#17161a;--ink-soft:#6b675f;--line:#17161a;--accent:#e8422a;--accent-ink:#fffaf3;--good:#1c8a53;--good-bg:#e5f5ec;--shadow:3px 3px 0 var(--line);}",
  "@media (prefers-color-scheme: dark){:root{--bg:#141316;--surface:#1f1e22;--ink:#f3f0ea;--ink-soft:#a9a49b;--line:#f3f0ea;--accent:#ff6a52;--accent-ink:#17161a;--good:#4fd48c;--good-bg:#123024;}}",
  "*{box-sizing:border-box;}",
  "body{background:var(--bg);color:var(--ink);font-family:'Work Sans',system-ui,sans-serif;margin:0;padding:0 16px 48px;}",
  ".wrap{max-width:900px;margin:0 auto;}",
  "h1,h2{font-family:'Anton','Work Sans',sans-serif;font-weight:400;letter-spacing:.02em;text-transform:uppercase;}",
  ".mono{font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;}",
  "header{padding:28px 0 10px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;}",
  "header h1{font-size:1.7rem;margin:0;}",
  "#gate{max-width:340px;margin:80px auto;background:var(--surface);border:2px solid var(--line);border-radius:12px;padding:24px;box-shadow:var(--shadow);}",
  "#gate input{width:100%;padding:10px;border:2px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font-size:1.2rem;text-align:center;letter-spacing:.2em;margin:12px 0;}",
  "button{border:2px solid var(--line);border-radius:8px;padding:10px 16px;font-family:'Work Sans',sans-serif;font-weight:700;cursor:pointer;background:var(--accent);color:var(--accent-ink);box-shadow:2px 2px 0 var(--line);text-transform:uppercase;font-size:.85rem;}",
  "button.ghost{background:var(--surface);color:var(--ink);}",
  "button:disabled{opacity:.5;cursor:not-allowed;}",
  "#app{display:none;}",
  ".toolbar{display:flex;gap:8px;margin:12px 0 20px;flex-wrap:wrap;align-items:center;}",
  ".badge{background:var(--surface);border:2px solid var(--line);border-radius:999px;padding:4px 12px;font-size:.8rem;font-weight:700;}",
  "table{width:100%;border-collapse:collapse;background:var(--surface);border:2px solid var(--line);border-radius:10px;overflow:hidden;box-shadow:var(--shadow);}",
  "th,td{padding:8px 10px;text-align:left;border-bottom:1px solid color-mix(in srgb, var(--ink) 15%, transparent);font-size:.85rem;vertical-align:middle;}",
  "th{text-transform:uppercase;font-size:.68rem;color:var(--ink-soft);letter-spacing:.03em;}",
  "tr.finalista{background:var(--good-bg);}",
  ".prom{font-weight:700;}",
  ".vote-row{display:flex;gap:4px;align-items:center;}",
  ".vote-row input{width:52px;padding:6px;border:2px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);text-align:center;}",
  ".vote-row button{padding:6px 10px;font-size:.7rem;}",
  ".small{font-size:.7rem;padding:6px 8px;}",
  "#msg{margin:10px 0;font-size:.85rem;font-weight:600;min-height:1.2em;}",
  "#msg.err{color:var(--accent);}",
  "#msg.ok{color:var(--good);}",
  ".empty{color:var(--ink-soft);font-size:.85rem;text-align:center;padding:24px;}",
  "@media (max-width: 720px){table,thead,tbody,th,td,tr{display:block;} thead{display:none;} tr{background:var(--surface);border:2px solid var(--line);border-radius:10px;margin-bottom:10px;padding:10px;box-shadow:var(--shadow);} td{border:none;padding:4px 0;} td::before{content:attr(data-label);display:block;font-size:.65rem;text-transform:uppercase;color:var(--ink-soft);}}",
  "</style>",
  "</head>",
  "<body>",
  '<div id="gate">',
  "<h2>Acceso admin</h2>",
  '<input type="password" id="pin" inputmode="numeric" placeholder="PIN" autofocus>',
  '<button style="width:100%" onclick="tryLogin()">Entrar</button>',
  '<div id="gate-msg" style="margin-top:8px;font-size:.8rem;color:var(--accent);"></div>',
  "</div>",
  '<div id="app"><div class="wrap">',
  "<header><h1>Guerra de Bocetos — Admin</h1><span class=\"badge mono\" id=\"finalistas-count\">0/8 finalistas</span></header>",
  '<div class="toolbar">',
  '<label style="font-size:.75rem;">Tu nombre (juez): <input id="juez" placeholder="Ej: Camilo" style="padding:6px;border:2px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);"></label>',
  '<button class="ghost" onclick="loadList()">Actualizar</button>',
  '<a id="export-link" href="#"><button class="ghost">Descargar Excel (CSV)</button></a>',
  "</div>",
  '<div id="msg"></div>',
  '<div id="table-wrap"></div>',
  "</div></div>",
  "<script>",
  "var PIN = '';",
  "function esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\\'':'&#39;'}[c];});}",
  "function setMsg(t, cls){ var m=document.getElementById('msg'); m.textContent=t||''; m.className=cls||''; }",
  "function tryLogin(){",
  "  var pin = document.getElementById('pin').value.trim();",
  "  if(!pin){ return; }",
  "  PIN = pin;",
  "  loadList(function(ok){",
  "    if(ok){",
  "      document.getElementById('gate').style.display='none';",
  "      document.getElementById('app').style.display='block';",
  "      document.getElementById('export-link').href = '/admin/export.csv?pin=' + encodeURIComponent(PIN);",
  "    } else {",
  "      document.getElementById('gate-msg').textContent = 'PIN incorrecto.';",
  "    }",
  "  });",
  "}",
  "function render(participantes){",
  "  var finalistas = participantes.filter(function(p){ return p.estado === 'finalista'; }).length;",
  "  document.getElementById('finalistas-count').textContent = finalistas + '/8 finalistas';",
  "  if(!participantes.length){",
  "    document.getElementById('table-wrap').innerHTML = '<p class=\"empty\">Aun no hay inscritos.</p>';",
  "    return;",
  "  }",
  "  var rows = participantes.map(function(p){",
  "    var esFinal = p.estado === 'finalista';",
  "    return '<tr class=\"' + (esFinal ? 'finalista' : '') + '\">' +",
  "      '<td data-label=\"Nombre\">' + esc(p.nombre) + '<br><span class=\"mono\" style=\"font-size:.7rem;color:var(--ink-soft);\">' + esc(p.tipo_documento) + ' ' + esc(p.numero_documento) + '</span></td>' +",
  "      '<td data-label=\"Contacto\">' + esc(p.telefono) + '<br>' + esc(p.correo) + '</td>' +",
  "      '<td data-label=\"Ciudad\">' + esc(p.ciudad) + '</td>' +",
  "      '<td data-label=\"Instagram\">' + (p.instagram ? esc(p.instagram) : '—') + '</td>' +",
  "      '<td data-label=\"Promedio\" class=\"prom mono\">' + (p.promedio != null ? p.promedio : '—') + ' <span style=\"font-weight:400;color:var(--ink-soft);\">(' + p.num_votos + ')</span></td>' +",
  "      '<td data-label=\"Votar\"><div class=\"vote-row\"><input type=\"number\" min=\"0\" max=\"10\" step=\"0.5\" id=\"score-' + p.id + '\"><button class=\"small\" onclick=\"vote(\\'' + p.id + '\\')\">Votar</button></div></td>' +",
  "      '<td data-label=\"Finalista\"><button class=\"small ' + (esFinal ? '' : 'ghost') + '\" onclick=\"toggleFinalista(\\'' + p.id + '\\',' + (!esFinal) + ')\">' + (esFinal ? 'Quitar' : 'Marcar') + '</button></td>' +",
  "      '</tr>';",
  "  }).join('');",
  "  document.getElementById('table-wrap').innerHTML =",
  "    '<table><thead><tr><th>Nombre</th><th>Contacto</th><th>Ciudad</th><th>Instagram</th><th>Promedio</th><th>Votar (0-10)</th><th>Finalista</th></tr></thead><tbody>' + rows + '</tbody></table>';",
  "}",
  "function loadList(cb){",
  "  fetch('/admin/api/list', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({pin:PIN}) })",
  "    .then(function(r){ return r.json(); })",
  "    .then(function(res){",
  "      if(res.ok){ render(res.participantes); if(cb) cb(true); }",
  "      else { setMsg(res.error||'Error', 'err'); if(cb) cb(false); }",
  "    })",
  "    .catch(function(){ setMsg('Error de conexion.', 'err'); if(cb) cb(false); });",
  "}",
  "function vote(id){",
  "  var juez = document.getElementById('juez').value.trim();",
  "  if(!juez){ setMsg('Escribe tu nombre como juez antes de votar.', 'err'); return; }",
  "  var input = document.getElementById('score-' + id);",
  "  var puntaje = parseFloat(input.value);",
  "  if(isNaN(puntaje) || puntaje < 0 || puntaje > 10){ setMsg('Puntaje invalido (0-10).', 'err'); return; }",
  "  fetch('/admin/api/vote', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({pin:PIN, participante_id:id, juez:juez, puntaje:puntaje}) })",
  "    .then(function(r){ return r.json(); })",
  "    .then(function(res){",
  "      if(res.ok){ setMsg('Voto guardado.', 'ok'); loadList(); }",
  "      else { setMsg(res.error||'Error al votar', 'err'); }",
  "    })",
  "    .catch(function(){ setMsg('Error de conexion.', 'err'); });",
  "}",
  "function toggleFinalista(id, esFinalista){",
  "  fetch('/admin/api/finalista', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({pin:PIN, participante_id:id, es_finalista:esFinalista}) })",
  "    .then(function(r){ return r.json(); })",
  "    .then(function(res){",
  "      if(res.ok){ setMsg('Actualizado.', 'ok'); loadList(); }",
  "      else { setMsg(res.error||'Error', 'err'); }",
  "    })",
  "    .catch(function(){ setMsg('Error de conexion.', 'err'); });",
  "}",
  "document.getElementById('pin').addEventListener('keydown', function(ev){ if(ev.key==='Enter') tryLogin(); });",
  "</script>",
  "</body></html>",
].join("\n");

function csvEscape(v) {
  var s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(participantes) {
  var headers = [
    "nombre", "tipo_documento", "numero_documento", "telefono", "correo",
    "ciudad", "instagram", "referencia_pago", "estado", "promedio", "num_votos",
    "autoriza_imagen", "created_at",
  ];
  var lines = [headers.join(",")];
  participantes.forEach(function (p) {
    lines.push(headers.map(function (h) { return csvEscape(p[h]); }).join(","));
  });
  return "\uFEFF" + lines.join("\n");
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function sendHtml(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  if (req.method === "GET" && path === "/") {
    return sendHtml(res, 200, PAGE);
  }

  if (req.method === "GET" && path === "/admin") {
    return sendHtml(res, 200, ADMIN_PAGE);
  }

  if (req.method === "POST" && path === "/admin/api/list") {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return sendJson(res, 400, { ok: false, error: "JSON inválido" });
    }
    const { data, error } = await callRpc("gb_admin_list", { pin: body.pin });
    if (error) return sendJson(res, 500, { ok: false, error: "Error del servidor" });
    return sendJson(res, 200, data);
  }

  if (req.method === "POST" && path === "/admin/api/vote") {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return sendJson(res, 400, { ok: false, error: "JSON inválido" });
    }
    const { data, error } = await callRpc("gb_admin_vote", {
      pin: body.pin,
      p_participante_id: body.participante_id,
      p_juez: body.juez,
      p_puntaje: body.puntaje,
    });
    if (error) return sendJson(res, 500, { ok: false, error: "Error del servidor" });
    return sendJson(res, 200, data);
  }

  if (req.method === "POST" && path === "/admin/api/finalista") {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return sendJson(res, 400, { ok: false, error: "JSON inválido" });
    }
    const { data, error } = await callRpc("gb_admin_set_finalista", {
      pin: body.pin,
      p_participante_id: body.participante_id,
      p_es_finalista: body.es_finalista,
    });
    if (error) return sendJson(res, 500, { ok: false, error: "Error del servidor" });
    return sendJson(res, 200, data);
  }

  if (req.method === "GET" && path === "/admin/export.csv") {
    const pin = url.searchParams.get("pin") || "";
    const { data, error } = await callRpc("gb_admin_list", { pin });
    if (error || !data || !data.ok) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("PIN incorrecto o error del servidor");
    }
    const csv = buildCsv(data.participantes);
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="guerra_bocetos_participantes.csv"',
    });
    return res.end(csv);
  }

  if (req.method === "GET" && path === "/stats") {
    const { data, error } = await callRpc("gb_stats");
    if (error) return sendJson(res, 200, { count: 0, instagrams: [] });
    return sendJson(res, 200, data);
  }

  if (req.method === "POST" && path === "/register") {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return sendJson(res, 400, { error: "JSON inválido" });
    }

    const { data, error } = await callRpc("gb_register", { payload: body });
    if (error) {
      return sendJson(res, 500, {
        error: "No se pudo guardar la inscripción. Intenta de nuevo.",
      });
    }
    if (data && data.ok) {
      return sendJson(res, 200, { ok: true });
    }
    return sendJson(res, 400, {
      error: (data && data.error) || "No se pudo completar la inscripción.",
    });
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Guerra de Bocetos escuchando en el puerto ${PORT}`);
});
