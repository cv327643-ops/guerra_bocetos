-- Votos de los jueces/administradores sobre cada participante.
-- Un juez (identificado por su nombre) puede actualizar su propio voto;
-- el ranking usa el promedio de todos los votos por participante.
create table guerra_bocetos.votos (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references guerra_bocetos.participantes(id) on delete cascade,
  juez text not null,
  puntaje numeric not null check (puntaje >= 0 and puntaje <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint votos_participante_juez_key unique (participante_id, juez)
);

alter table guerra_bocetos.votos enable row level security;

grant usage on schema guerra_bocetos to service_role;
grant all on guerra_bocetos.votos to service_role;

comment on table guerra_bocetos.votos is 'Votos/calificaciones de los administradores sobre cada boceto. Aislado del ERP, sin acceso directo via REST.';

create or replace function public.gb_admin_list(pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, guerra_bocetos
as $$
declare
  result jsonb;
begin
  if pin is distinct from '2580' then
    return jsonb_build_object('ok', false, 'error', 'PIN incorrecto');
  end if;

  select jsonb_build_object('ok', true, 'participantes', coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb))
  into result
  from (
    select
      p.id, p.created_at, p.nombre, p.tipo_documento, p.numero_documento,
      p.telefono, p.correo, p.ciudad, p.instagram, p.referencia_pago,
      p.autoriza_imagen, p.estado,
      (select round(avg(v.puntaje), 2) from guerra_bocetos.votos v where v.participante_id = p.id) as promedio,
      (select count(*) from guerra_bocetos.votos v where v.participante_id = p.id) as num_votos
    from guerra_bocetos.participantes p
    order by promedio desc nulls last, p.created_at asc
  ) t;

  return result;
end;
$$;

create or replace function public.gb_admin_vote(pin text, p_participante_id uuid, p_juez text, p_puntaje numeric)
returns jsonb
language plpgsql
security definer
set search_path = public, guerra_bocetos
as $$
begin
  if pin is distinct from '2580' then
    return jsonb_build_object('ok', false, 'error', 'PIN incorrecto');
  end if;
  if coalesce(trim(p_juez), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Falta el nombre del juez');
  end if;
  if p_puntaje < 0 or p_puntaje > 10 then
    return jsonb_build_object('ok', false, 'error', 'El puntaje debe estar entre 0 y 10');
  end if;

  insert into guerra_bocetos.votos (participante_id, juez, puntaje, updated_at)
  values (p_participante_id, trim(p_juez), p_puntaje, now())
  on conflict (participante_id, juez)
  do update set puntaje = excluded.puntaje, updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.gb_admin_set_finalista(pin text, p_participante_id uuid, p_es_finalista boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, guerra_bocetos
as $$
declare
  actuales int;
begin
  if pin is distinct from '2580' then
    return jsonb_build_object('ok', false, 'error', 'PIN incorrecto');
  end if;

  if p_es_finalista then
    select count(*) into actuales from guerra_bocetos.participantes where estado = 'finalista';
    if actuales >= 8 then
      return jsonb_build_object('ok', false, 'error', 'Ya hay 8 finalistas seleccionados');
    end if;
    update guerra_bocetos.participantes set estado = 'finalista' where id = p_participante_id;
  else
    update guerra_bocetos.participantes set estado = 'inscrito' where id = p_participante_id and estado = 'finalista';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.gb_admin_list(text) from public;
revoke all on function public.gb_admin_vote(text, uuid, text, numeric) from public;
revoke all on function public.gb_admin_set_finalista(text, uuid, boolean) from public;
grant execute on function public.gb_admin_list(text) to anon, service_role;
grant execute on function public.gb_admin_vote(text, uuid, text, numeric) to anon, service_role;
grant execute on function public.gb_admin_set_finalista(text, uuid, boolean) to anon, service_role;
