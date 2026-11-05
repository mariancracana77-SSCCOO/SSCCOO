-- v134 (lo pidió Lorena, 5/11/2026): el padre puede pasarle una petición a Lorena («Que lo siga Lorena») y quitarla de su lista
-- («Quitar de mi lista»). Nada se borra: el disparador peticiones_no_se_borran sigue igual.
alter table public.peticiones_claude add column if not exists pasada_lorena timestamptz;
alter table public.peticiones_claude add column if not exists oculta_padre timestamptz;

create or replace function public.pasar_a_lorena(p_id bigint) returns text
 language plpgsql security definer set search_path to 'public' as $$
declare x public.peticiones_claude;
begin
  if not public.is_admin() then return 'no_admin'; end if;
  select * into x from public.peticiones_claude where id = p_id for update;
  if not found then return 'no_existe'; end if;
  if x.pasada_lorena is not null then return 'ya'; end if;
  update public.peticiones_claude
     set pasada_lorena = now(), oculta_padre = null,
         mensajes = coalesce(mensajes, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('quien', 'padre', 'cuando', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'autor', coalesce(auth.jwt()->>'email', ''), 'texto', 'Se la he pasado a Lorena: que la siga ella.', 'adjuntos', '[]'::jsonb, 'aviso', true))
   where id = p_id;
  return 'ok';
end $$;

create or replace function public.quitar_de_mi_lista(p_id bigint, p_quitar boolean) returns text
 language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_admin() then return 'no_admin'; end if;
  update public.peticiones_claude set oculta_padre = case when p_quitar then now() else null end where id = p_id;
  return case when found then 'ok' else 'no_existe' end;
end $$;
revoke all on function public.pasar_a_lorena(bigint), public.quitar_de_mi_lista(bigint, boolean) from public, anon;
grant execute on function public.pasar_a_lorena(bigint), public.quitar_de_mi_lista(bigint, boolean) to authenticated;
-- El aviso a Lorena: peticiones_avisa_lorena añade el caso «pasada_lorena» (se aplica aparte, con la función entera).
