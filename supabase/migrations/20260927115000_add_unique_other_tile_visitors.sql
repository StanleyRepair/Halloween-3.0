create or replace function public.admin_get_analytics(p_device_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  a public.admin_devices%rowtype;
  r_users timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='users'),'epoch'::timestamptz);
  r_installs timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='installs'),'epoch'::timestamptz);
  r_links timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='link_opens'),'epoch'::timestamptz);
  r_all timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='all_opens'),'epoch'::timestamptz);
  r_pwa timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='pwa_opens'),'epoch'::timestamptz);
  r_gp timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='game_players'),'epoch'::timestamptz);
  r_gplays timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='game_plays'),'epoch'::timestamptz);
  r_draw timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='costume_draw'),'epoch'::timestamptz);
  r_push timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='push'),'epoch'::timestamptz);
  r_dashboard timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='dashboard'),'epoch'::timestamptz);
  r_other timestamptz:=coalesce((select reset_at from public.analytics_resets where metric='other'),'epoch'::timestamptz);
  dashboard_today_start timestamptz:=greatest(date_trunc('day',now()),r_dashboard);
  dashboard_week_start timestamptz:=greatest(date_trunc('day',now())-interval '6 days',r_dashboard);
  result jsonb;
begin
  select * into a from public.admin_devices where device_token=p_device_token and active=true limit 1;
  if a.id is null then raise exception 'Brak dostępu administratora'; end if;

  select jsonb_build_object(
    'is_super',a.role='super_admin',
    'users',(select count(*) from public.analytics_visitors where last_seen>=r_users),
    'installed_users',(select count(*) from public.analytics_visitors where installed_at is not null and installed_at>=r_installs),
    'link_opens',(select count(*) from public.analytics_link_sessions where created_at>=r_links),
    'all_opens',(select count(*) from public.analytics_events where event_type='page_open' and created_at>=r_all),
    'pwa_opens',(select count(*) from public.analytics_events where event_type='pwa_open' and created_at>=r_pwa),
    'today_users',(select count(distinct visitor_id) from public.analytics_events where event_type='page_open' and created_at>=dashboard_today_start),
    'today_opens',(select count(*) from public.analytics_events where event_type='page_open' and created_at>=dashboard_today_start),
    'game_players',(select count(distinct visitor_id) from public.analytics_events where event_type='creepy_game_start' and created_at>=r_gp),
    'game_plays',(select count(*) from public.analytics_events where event_type='creepy_game_start' and created_at>=r_gplays),
    'game_best_score',(select coalesce(max(case when (metadata->>'score') ~ '^[0-9]+$' then (metadata->>'score')::int end),0) from public.analytics_events where event_type='creepy_game_over' and created_at>=least(r_gp,r_gplays)),
    'game_avg_score',(select coalesce(round(avg(case when (metadata->>'score') ~ '^[0-9]+$' then (metadata->>'score')::numeric end),1),0) from public.analytics_events where event_type='creepy_game_over' and created_at>=least(r_gp,r_gplays)),
    'costume_draw_users',(select count(distinct visitor_id) from public.analytics_events where event_type='costume_draw' and created_at>=r_draw),
    'costume_draw_uses',(select count(*) from public.analytics_events where event_type='costume_draw' and created_at>=r_draw),
    'other_views',(select count(*) from public.analytics_events where event_type='other_view' and created_at>=r_other),
    'other_unique_visitors',(select count(distinct visitor_id) from public.analytics_events where event_type='other_view' and created_at>=r_other),
    'other_downloads',(select count(*) from public.analytics_events where event_type='other_pdf_download' and created_at>=r_other),
    'other_tiles',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',x.tile_id,
          'title',x.title,
          'views',x.views,
          'unique_visitors',x.unique_visitors,
          'downloads',x.downloads
        )
        order by x.views desc,x.downloads desc,x.title
      )
      from (
        select
          metadata->>'tile_id' as tile_id,
          coalesce(max(nullif(metadata->>'title','')),metadata->>'tile_id') as title,
          count(*) filter (where event_type='other_view') as views,
          count(distinct visitor_id) filter (where event_type='other_view') as unique_visitors,
          count(*) filter (where event_type='other_pdf_download') as downloads
        from public.analytics_events
        where event_type in ('other_view','other_pdf_download')
          and created_at>=r_other
          and nullif(metadata->>'tile_id','') is not null
        group by metadata->>'tile_id'
      ) x
    ),'[]'::jsonb),
    'push_sent',(select coalesce(sum(sent_count),0) from public.push_campaigns where created_at>=r_push),
    'push_campaigns',(select count(*) from public.push_campaigns where created_at>=r_push),
    'push_opened_unique',(select count(*) from public.push_campaign_opens o join public.push_campaigns c on c.id=o.campaign_id where c.created_at>=r_push),
    'push_open_clicks',(select coalesce(sum(o.open_count),0) from public.push_campaign_opens o join public.push_campaigns c on c.id=o.campaign_id where c.created_at>=r_push),
    'push_subscribers',(select count(*) from public.push_subscriptions),
    'push_open_rate',(select case when coalesce(sum(c.sent_count),0)=0 then 0 else round(100.0*(select count(*) from public.push_campaign_opens o join public.push_campaigns c2 on c2.id=o.campaign_id where c2.created_at>=r_push)/sum(c.sent_count),1) end from public.push_campaigns c where c.created_at>=r_push),
    'contexts',coalesce((select jsonb_object_agg(ctx,cnt) from (select coalesce(nullif(context,''),'inne') as ctx,count(*) as cnt from public.analytics_events where event_type='page_open' and created_at>=dashboard_today_start group by coalesce(nullif(context,''),'inne')) q),'{}'::jsonb),
    'last7days',coalesce((select jsonb_agg(jsonb_build_object('date',series_day::date,'opens',coalesce(x.cnt,0)) order by series_day) from generate_series(date_trunc('day',now())-interval '6 days',date_trunc('day',now()),interval '1 day') as series_day left join (select date_trunc('day',created_at) as day_bucket,count(*) as cnt from public.analytics_events where event_type='page_open' and created_at>=dashboard_week_start group by date_trunc('day',created_at)) x on x.day_bucket=series_day),'[]'::jsonb),
    'resets',coalesce((select jsonb_object_agg(metric,reset_at) from public.analytics_resets),'{}'::jsonb)
  ) into result;
  return result;
end;
$function$;
