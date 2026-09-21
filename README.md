# Guerra de Bocetos — Inscripción pública

Página de inscripción para el evento "Guerra de Bocetos" (batalla de bocetos). Los participantes se inscriben desde un link público; el link solo muestra el formulario, la cantidad de personas inscritas y los Instagram de quienes lo compartieron — ningún otro dato personal es visible públicamente.

## Arquitectura

- **Datos**: Supabase, proyecto `hiewaojvwruxtwncatnf` (el mismo proyecto que el ERP de Neomech, pero en un **esquema completamente aislado**: `guerra_bocetos`). Ese esquema no se expone por la API REST; solo es alcanzable a través de dos funciones `SECURITY DEFINER` en el esquema `public`: `gb_register(payload)` y `gb_stats()`. Ver `supabase/migrations/0001_isolate_guerra_bocetos_schema.sql`.
- **Servidor**: `server.js`, un servidor Node sin dependencias externas (usa `http` y `fetch` nativos de Node ≥18). Sirve la página y expone `/stats` y `/register`, hablando con Supabase solo por esas dos funciones RPC usando la `service_role` key (nunca expuesta al navegador).
- **Alternativa**: `supabase/functions/guerra-bocetos/index.ts` es la misma lógica corriendo como Supabase Edge Function (Deno). Se mantiene como respaldo; el despliegue principal es Railway con `server.js`.
- **Votos**: `guerra_bocetos.votos` guarda el puntaje (0-10) de cada juez sobre cada participante. Igual que la tabla de participantes, está aislada del ERP y sin acceso directo por REST. Ver `supabase/migrations/0002_guerra_bocetos_admin_votos.sql`.

## Panel de administrador

`/admin` — protegido por PIN (por defecto `2580`, igual que `letras-fedele`; para cambiarlo, edita el valor `'2580'` en las tres funciones `gb_admin_*` de la migración y vuelve a aplicarla). Permite:

- Ver la lista completa de inscritos (todos los campos) y el promedio de votos de cada uno.
- Que cada juez registre su nombre y califique cada boceto de 0 a 10 (un juez puede actualizar su propio voto; el ranking usa el promedio).
- Marcar/desmarcar hasta 8 finalistas.
- Descargar un CSV (`/admin/export.csv?pin=...`) con todos los inscritos — se abre directamente en Excel.

## Variables de entorno

Copia `.env.example` a `.env` para desarrollo local, o configura estas mismas variables en Railway (Settings → Variables):

- `SUPABASE_URL` — URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — service role key del proyecto (Project Settings → API). **Nunca la subas a git ni la pongas en el frontend.**
- `PORT` — opcional, Railway lo asigna automáticamente.

## Desarrollo local

```bash
npm install   # no hay dependencias externas, pero deja package-lock.json listo
cp .env.example .env   # y completa SUPABASE_SERVICE_ROLE_KEY
node --env-file=.env server.js
```

Abre `http://localhost:3000`.

## Despliegue en Railway

1. Conecta este repositorio de GitHub como un nuevo servicio en Railway.
2. Railway detecta `package.json` y usa `npm start` automáticamente.
3. En Settings → Variables, agrega `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
4. Cada push a la rama principal vuelve a desplegar automáticamente (igual que `letras-fedele`).

## Seguridad y privacidad

- La tabla `guerra_bocetos.participantes` tiene RLS activado y sin políticas: nadie puede leerla ni escribirla directamente, ni siquiera con la clave `anon`.
- Los únicos puntos de entrada son las dos funciones RPC, que validan los campos requeridos y el consentimiento de habeas data antes de insertar.
- `gb_stats()` solo devuelve el conteo total y la lista de Instagrams que los propios participantes decidieron compartir — nunca nombres, cédulas, teléfonos, correos ni referencias de pago.
- Cumple con la Ley 1581 de 2012 y el Decreto 1377 de 2013 (habeas data): el formulario exige aceptar el aviso de tratamiento de datos antes de inscribirse.
