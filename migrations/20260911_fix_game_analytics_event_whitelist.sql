create or replace function public.analytics_track(
  p_visitor_id uuid,
  p_event_type text,
  p_context text default null,
  p_session_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  ev text := lower(trim(coalesce(p_event_type,'')));
begin
  if not (
    ev in ('page_open','pwa_open','install','costume_draw')
    or ev ~ '^[a-z0-9_]{1,48}_(start|over|hit)$'
  ) then
    raise exception 'Nieobsługiwany typ zdarzenia';
  end if;

  perform public.analytics_touch_visitor(p_visitor_id,p_context,ev='install');
  insert into public.analytics_events(visitor_id,session_id,event_type,context,metadata)
  values(p_visitor_id,p_session_id,ev,left(coalesce(p_context,''),40),coalesce(p_metadata,'{}'::jsonb));
end;
$function$;
