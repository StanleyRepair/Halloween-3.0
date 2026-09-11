create or replace function public.admin_get_game_analytics(p_device_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  a public.admin_devices%rowtype;
  r_all timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='games_all'),'epoch'::timestamptz);
  result jsonb;
begin
  select * into a from public.admin_devices where device_token=p_device_token and active=true limit 1;
  if a.id is null then raise exception 'Brak dostępu administratora'; end if;

  with discovered as (
    select case
      when event_type ~ '_game_(start|over)$' then regexp_replace(event_type,'_game_(start|over)$','')
      else regexp_replace(event_type,'_(start|over)$','')
    end as game_key,
    bool_or(event_type ~ '_(game_)?start$') as has_start,
    bool_or(event_type ~ '_(game_)?over$') as has_over
    from public.analytics_events
    where event_type ~ '^[a-z0-9_]+_(game_)?(start|over)$'
    group by 1
  ), game_keys as (
    select game_key from (values ('creepy'),('candle'),('halloween_match'),('dark_ritual'),('halloween_dash')) v(game_key)
    union
    select game_key from discovered where has_start and has_over
  ), game_stats as (
    select
      k.game_key,
      greatest(
        r_all,
        coalesce((select reset_at from public.analytics_resets where metric='game:'||k.game_key),'epoch'::timestamptz),
        case when k.game_key='creepy' then greatest(
          coalesce((select reset_at from public.analytics_resets where metric='game_players'),'epoch'::timestamptz),
          coalesce((select reset_at from public.analytics_resets where metric='game_plays'),'epoch'::timestamptz)
        ) else 'epoch'::timestamptz end
      ) as reset_at
    from game_keys k
  )
  select jsonb_build_object(
    'is_super',a.role='super_admin',
    'games',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'key',g.game_key,
          'players',(select count(distinct visitor_id) from public.analytics_events e where e.event_type in (g.game_key||'_start',g.game_key||'_game_start') and e.created_at>=g.reset_at),
          'plays',(select count(*) from public.analytics_events e where e.event_type in (g.game_key||'_start',g.game_key||'_game_start') and e.created_at>=g.reset_at),
          'completed',(select count(*) from public.analytics_events e where e.event_type in (g.game_key||'_over',g.game_key||'_game_over') and e.created_at>=g.reset_at),
          'best_score',(select coalesce(max(case when (metadata->>'score') ~ '^[0-9]+$' then (metadata->>'score')::int end),0) from public.analytics_events e where e.event_type in (g.game_key||'_over',g.game_key||'_game_over') and e.created_at>=g.reset_at),
          'avg_score',(select coalesce(round(avg(case when (metadata->>'score') ~ '^[0-9]+$' then (metadata->>'score')::numeric end),1),0) from public.analytics_events e where e.event_type in (g.game_key||'_over',g.game_key||'_game_over') and e.created_at>=g.reset_at),
          'reset_at',g.reset_at
        ) order by case g.game_key when 'creepy' then 1 when 'candle' then 2 when 'halloween_match' then 3 when 'dark_ritual' then 4 when 'halloween_dash' then 5 else 99 end,g.game_key
      ) from game_stats g
    ),'[]'::jsonb)
  ) into result;
  return result;
end;
$function$;