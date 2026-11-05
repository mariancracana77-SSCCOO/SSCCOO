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


-- Aviso al móvil de Lorena cuando su padre le pasa una petición (va primero: es lo más importante de ese cambio)
create or replace function public.peticiones_avisa_lorena()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare tit text; cuerpo text; ult jsonb; n_new int; n_old int;
begin
  if not exists (select 1 from public.push_admin where para = 'lorena') then return new; end if;
  if tg_op = 'INSERT' then
    tit := 'Tu padre ha pedido algo (n.º ' || new.id || ')'; cuerpo := new.texto;
  else
    n_new := jsonb_array_length(coalesce(new.mensajes, '[]'::jsonb)); n_old := jsonb_array_length(coalesce(old.mensajes, '[]'::jsonb));
    ult := case when n_new > 0 then new.mensajes -> (n_new - 1) end;
    if new.pasada_lorena is not null and new.pasada_lorena is distinct from old.pasada_lorena then
      tit := 'Tu padre te ha pasado una petición (n.º ' || new.id || ')'; cuerpo := 'Quiere que la sigas tú: ' || left(new.texto, 130);
    elsif new.avisar_lorena is not null and new.avisar_lorena is distinct from old.avisar_lorena then
      tit := 'Tu padre te avisa (n.º ' || new.id || ')'; cuerpo := 'Ha pulsado «Avisar a Lorena»: ' || left(new.texto, 120);
    elsif new.deshacer is not null and new.deshacer is distinct from old.deshacer then
      tit := 'Tu padre quiere volver atrás (n.º ' || new.id || ')'; cuerpo := 'Ha pulsado «Volver a como estaba antes»: ' || left(new.texto, 110);
    elsif new.decision is not null and new.decision is distinct from old.decision then
      tit := 'Tu padre dice ' || upper(new.decision) || ' (n.º ' || new.id || ')'; cuerpo := left(new.texto, 160);
    elsif n_new > n_old and coalesce(ult->>'quien', '') = 'padre' then
      tit := 'Tu padre ha escrito (n.º ' || new.id || ')'; cuerpo := coalesce(ult->>'texto', '');
    elsif new.estado is distinct from old.estado and new.estado in ('lista', 'no_hecha', 'publicada', 'deshecha') then
      tit := case new.estado when 'lista' then 'Lista para revisar' when 'no_hecha' then 'Claude no la ha hecho' when 'publicada' then 'Publicada en la web' else 'Vuelta a como estaba' end || ' (n.º ' || new.id || ')';
      cuerpo := coalesce(nullif(new.respuesta, ''), left(new.texto, 160));
    end if;
  end if;
  if tit is null then return new; end if;
  perform net.http_post(
    url := 'https://kdfedwcskymaitvpryvg.supabase.co/functions/v1/avisar-padre',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select valor from public.config_privada where clave = 'cron_secreto')),
    body := jsonb_build_object('para', 'lorena', 'titulo', tit, 'cuerpo', left(coalesce(cuerpo, ''), 180), 'url', 'admin.html#peticiones'),
    timeout_milliseconds := 30000);
  return new;
end $function$;
