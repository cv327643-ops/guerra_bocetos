-- Esquema completamente separado del ERP: nada del ERP vive aqui, y este esquema
-- no se expone directamente por la API REST (PostgREST solo sirve "public").
create schema if not exists guerra_bocetos;

revoke all on schema guerra_bocetos from public, anon, authenticated;

create table guerra_bocetos.participantes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  tipo_documento text not null,
  numero_documento text not null,
  telefono text not null,
  correo text not null,
  ciudad text not null,
  instagram text,
  referencia_pago text not null,
  habeas_data_aceptado boolean not null default false check (habeas_data_aceptado is true),
  autoriza_imagen boolean not null default false,
  estado text not null default 'inscrito',
  constraint participantes_numero_documento_key unique (numero_documento)
);

alter table guerra_bocetos.participantes enable row level security;

comment on table guerra_bocetos.participantes is 'Inscripciones a Guerra de Bocetos. Esquema aislado del ERP (Neomech). Sin acceso directo via REST; solo mediante las funciones public.gb_register() y public.gb_stats() (SECURITY DEFINER).';

grant usage on schema guerra_bocetos to service_role;
grant all on guerra_bocetos.participantes to service_role;

-- Unicos puntos de entrada publicos: dos funciones en "public" (expuesto por la API),
-- que operan sobre el esquema aislado "guerra_bocetos" con SECURITY DEFINER.
create or replace function public.gb_register(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, guerra_bocetos
as $$
declare
  req text[] := array['nombre','tipo_documento','numero_documento','telefono','correo','ciudad','referencia_pago'];
  f text;
begin
  foreach f in array req loop
    if coalesce(trim(payload->>f), '') = '' then
      return jsonb_build_object('ok', false, 'error', 'Falta el campo: ' || f);
    end if;
  end loop;

  if coalesce((payload->>'habeas_data_aceptado')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'error', 'Debes aceptar la autorizacion de tratamiento de datos.');
  end if;

  begin
    insert into guerra_bocetos.participantes (
      nombre, tipo_documento, numero_documento, telefono, correo, ciudad,
      instagram, referencia_pago, habeas_data_aceptado, autoriza_imagen
    ) values (
      trim(payload->>'nombre'),
      trim(payload->>'tipo_documento'),
      trim(payload->>'numero_documento'),
      trim(payload->>'telefono'),
      trim(payload->>'correo'),
      trim(payload->>'ciudad'),
      nullif(trim(payload->>'instagram'), ''),
      trim(payload->>'referencia_pago'),
      true,
      coalesce((payload->>'autoriza_imagen')::boolean, false)
    );
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'Ya existe una inscripcion con ese numero de documento.');
  end;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.gb_stats()
returns jsonb
language sql
security definer
set search_path = public, guerra_bocetos
as $$
  select jsonb_build_object(
    'count', (select count(*) from guerra_bocetos.participantes),
    'instagrams', coalesce((
      select jsonb_agg(ig.instagram)
      from (
        select instagram from guerra_bocetos.participantes
        where instagram is not null and instagram <> ''
        order by created_at desc
        limit 500
      ) ig
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.gb_register(jsonb) from public;
revoke all on function public.gb_stats() from public;
grant execute on function public.gb_register(jsonb) to anon, service_role;
grant execute on function public.gb_stats() to anon, service_role;
