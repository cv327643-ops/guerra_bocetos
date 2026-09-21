// Version desplegada como Supabase Edge Function (alternativa a server.js/Railway).
// Misma logica que server.js, corriendo en el runtime Deno de Supabase.
// Se mantiene aqui como referencia y como opcion de respaldo.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

const PAGE = [
  "<!doctype html>",
  "<html lang=\"es\">",
  "<head>",
  "<meta charset=\"utf-8\">",
  "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
  "<title>Guerra de Bocetos — Inscripción</title>",
  "<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap\">",
  "<style>",
  ":root{--bg:#f3efe7;--surface:#ffffff;--ink:#17161a;--ink-soft:#6b675f;--line:#17161a;--accent:#e8422a;--accent-ink:#fffaf3;--good:#1c8a53;--good-bg:#e5f5ec;--chip-bg:#fdece7;--shadow:3px 3px 0 var(--line);}",
  "@media (prefers-color-scheme: dark){:root{--bg:#141316;--surface:#1f1e22;--ink:#f3f0ea;--ink-soft:#a9a49b;--line:#f3f0ea;--accent:#ff6a52;--accent-ink:#17161a;--good:#4fd48c;--good-bg:#123024;--chip-bg:#2e1c19;}}",
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
  "input[type=text],input[type=tel],input[type=email]{width:100%;padding:10px;border:2px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font-family:inherit;font-size:.95rem;margin-bottom:12px;}",
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
  "<body><div class=\"wrap\">",
  "<header><h1>Guerra de Bocetos</h1><p>Inscripción oficial — valor de inscripción: $25.000 COP. Los 8 mejores pasan a la fase final.</p></header>",
  "<div class=\"stats\">",
  "<div class=\"stat\"><div class=\"num mono\" id=\"stat-count\">—</div><div class=\"label\">Inscritos</div></div>",
  "<div class=\"stat\"><div class=\"num mono\">8</div><div class=\"label\">Pasan a la final</div></div>",
  "</div>",
  "<div class=\"card\">",
  "<h2>Formulario de inscripción</h2>",
  "<form id=\"form\">",
  "<label for=\"nombre\">Nombre completo</label>",
  "<input type=\"text\" id=\"nombre\" required>",
  "<div class=\"row\">",
  "<div><label for=\"tipo_documento\">Tipo de documento</label><input type=\"text\" id=\"tipo_documento\" placeholder=\"CC, TI, CE...\" required></div>",
  "<div><label for=\"numero_documento\">Número de documento</label><input type=\"text\" id=\"numero_documento\" inputmode=\"numeric\" required></div>",
  "</div>",
  "<label for=\"telefono\">Teléfono / WhatsApp</label>",
  "<input type=\"tel\" id=\"telefono\" required>",
  "<label for=\"correo\">Correo electrónico</label>",
  "<input type=\"email\" id=\"correo\" required>",
  "<label for=\"ciudad\">Ciudad</label>",
  "<input type=\"text\" id=\"ciudad\" required>",
  "<label for=\"instagram\">Instagram (se mostrará en la lista pública de participantes)</label>",
  "<input type=\"text\" id=\"instagram\" placeholder=\"@tuusuario\">",
  "<label for=\"referencia_pago\">Referencia o comprobante de pago ($25.000)</label>",
  "<input type=\"text\" id=\"referencia_pago\" required>",
  "<details><summary>Leer autorización de tratamiento de datos (Habeas Data)</summary>",
  "<div class=\"legal\">",
  "De acuerdo con la Ley 1581 de 2012 y el Decreto 1377 de 2013, autorizo de manera previa, expresa e informada al equipo organizador del evento \"Guerra de Bocetos\" (contacto: cv327643@gmail.com) para recolectar, almacenar, usar y tratar mis datos personales suministrados en este formulario, con el fin de: (1) gestionar mi inscripción y participación en el evento; (2) hacer seguimiento a mi participación durante las distintas fases, incluida la selección de los 8 finalistas; (3) contactarme sobre horarios, resultados, premios o cambios de logística; y, si autorizo el uso de imagen, (4) usar fotografías o videos en los que aparezca durante el evento con fines de promoción en redes sociales. Puedo conocer, actualizar, rectificar o suprimir mis datos, y revocar esta autorización en cualquier momento escribiendo al correo de contacto. Mis datos serán tratados de forma confidencial y no se compartirán con terceros distintos a los necesarios para organizar el evento, salvo requerimiento legal.",
  "</div></details>",
  "<div class=\"check\"><input type=\"checkbox\" id=\"habeas\" required><label for=\"habeas\" style=\"margin:0;text-transform:none;font-weight:500;\">Sí, he leído y acepto la autorización de tratamiento de datos personales (obligatorio).</label></div>",
  "<div class=\"check\"><input type=\"checkbox\" id=\"imagen\"><label for=\"imagen\" style=\"margin:0;text-transform:none;font-weight:500;\">Autorizo adicionalmente el uso de mi imagen (fotos/video) tomada durante el evento con fines de promoción (opcional).</label></div>",
  "<button class=\"btn\" type=\"submit\" id=\"submit-btn\">Inscribirme</button>",
  "<div id=\"msg\"></div>",
  "</form>",
  "</div>",
  "<div class=\"card\">",
  "<h2>Participantes inscritos</h2>",
  "<p class=\"empty\" style=\"margin-top:-6px;\">Instagram de quienes ya se inscribieron y lo compartieron:</p>",
  "<div class=\"ig-grid\" id=\"ig-grid\"><span class=\"empty\">Cargando…</span></div>",
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

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/(functions\/v1\/)?guerra-bocetos/, "") || "/";

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method === "GET" && (path === "/" || path === "")) {
    return htmlResponse(PAGE);
  }

  if (req.method === "GET" && path === "/stats") {
    const { data, error } = await supabase.rpc("gb_stats");
    if (error) return json({ count: 0, instagrams: [] });
    return json(data);
  }

  if (req.method === "POST" && path === "/register") {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "JSON inválido" }, 400);
    }

    const { data, error } = await supabase.rpc("gb_register", { payload: body });
    if (error) {
      return json({ error: "No se pudo guardar la inscripción. Intenta de nuevo." }, 500);
    }
    if (data && data.ok) {
      return json({ ok: true });
    }
    return json({ error: (data && data.error) || "No se pudo completar la inscripción." }, 400);
  }

  return json({ error: "not found" }, 404);
});
