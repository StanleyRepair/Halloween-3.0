begin;

alter table public.other_tiles
  add column if not exists pdf_path text,
  add column if not exists pdf_file_name text,
  add column if not exists pdf_download_enabled boolean not null default false;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('other-pdfs','other-pdfs',true,26214400,array['application/pdf']::text[])
on conflict (id) do update
set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "other pdf uploads" on storage.objects;
create policy "other pdf uploads" on storage.objects for insert to anon,authenticated
with check (bucket_id='other-pdfs' and lower(storage.extension(name))='pdf');

create or replace function public.admin_update_other_pdf(p_device_token uuid,p_tile_id uuid,p_pdf_path text,p_pdf_file_name text,p_pdf_download_enabled boolean)
returns void language plpgsql security definer set search_path=''
as $function$
declare v_admin public.admin_devices%rowtype;v_old public.other_tiles%rowtype;v_path text:=nullif(trim(coalesce(p_pdf_path,'')),'');v_name text:=nullif(trim(coalesce(p_pdf_file_name,'')),'');
begin
 select * into v_admin from public.admin_devices where device_token=p_device_token and active=true and role in ('admin','super_admin') limit 1;
 if v_admin.id is null then raise exception 'Brak dostępu administratora'; end if;
 select * into v_old from public.other_tiles where id=p_tile_id limit 1;
 if v_old.id is null then raise exception 'Kafelek nie istnieje'; end if;
 if v_path is not null then
   if split_part(v_path,'/',1)<>p_tile_id::text or right(lower(v_path),4)<>'.pdf' then raise exception 'Nieprawidłowa ścieżka PDF'; end if;
   if v_name is null then v_name:='dokument.pdf'; end if;
 else v_name:=null; end if;
 update public.other_tiles set pdf_path=v_path,pdf_file_name=v_name,pdf_download_enabled=case when v_path is null then false else coalesce(p_pdf_download_enabled,false) end,updated_at=now() where id=p_tile_id;
 perform public.write_admin_audit(v_admin.id,'other_pdf_updated','other_tile',p_tile_id::text,jsonb_build_object('title',v_old.title,'pdf',v_path is not null,'download_enabled',case when v_path is null then false else coalesce(p_pdf_download_enabled,false) end));
end;$function$;
revoke all on function public.admin_update_other_pdf(uuid,uuid,text,text,boolean) from public;
grant execute on function public.admin_update_other_pdf(uuid,uuid,text,text,boolean) to anon,authenticated,service_role;

create or replace function public.get_other_tiles()
returns jsonb language sql security definer set search_path='public'
as $function$
select coalesce(jsonb_agg(jsonb_build_object(
'id',r.id,'title',r.title,'icon',r.icon,'content_type',r.content_type,'body',r.body,'image_path',r.image_path,
'pdf_path',r.pdf_path,'pdf_file_name',r.pdf_file_name,'pdf_download_enabled',r.pdf_download_enabled,
'pdf_download_count',(select count(*) from public.analytics_events e where e.event_type='other_pdf_download' and e.metadata->>'tile_id'=r.id::text),
'sort_order',r.sort_order,
'children',coalesce((select jsonb_agg(jsonb_build_object(
'id',c.id,'title',c.title,'icon',c.icon,'content_type',c.content_type,'body',c.body,'image_path',c.image_path,
'pdf_path',c.pdf_path,'pdf_file_name',c.pdf_file_name,'pdf_download_enabled',c.pdf_download_enabled,
'pdf_download_count',(select count(*) from public.analytics_events e2 where e2.event_type='other_pdf_download' and e2.metadata->>'tile_id'=c.id::text),
'sort_order',c.sort_order) order by c.sort_order,c.created_at) from public.other_tiles c where c.parent_id=r.id and c.active=true),'[]'::jsonb)
) order by r.sort_order,r.created_at),'[]'::jsonb)
from public.other_tiles r where r.parent_id is null and r.active=true;$function$;

create or replace function public.analytics_track(p_visitor_id uuid,p_event_type text,p_context text default null::text,p_session_id uuid default null::uuid,p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path='public'
as $function$
declare ev text:=lower(trim(coalesce(p_event_type,'')));
begin
 if not (ev in ('page_open','pwa_open','install','costume_draw','other_view','other_pdf_download') or ev ~ '^[a-z0-9_]{1,48}_(start|over|hit)$') then raise exception 'Nieobsługiwany typ zdarzenia'; end if;
 perform public.analytics_touch_visitor(p_visitor_id,p_context,ev='install');
 insert into public.analytics_events(visitor_id,session_id,event_type,context,metadata) values(p_visitor_id,p_session_id,ev,left(coalesce(p_context,''),40),coalesce(p_metadata,'{}'::jsonb));
end;$function$;

create index if not exists analytics_events_other_tile_idx on public.analytics_events ((metadata->>'tile_id'),event_type,created_at) where event_type in ('other_view','other_pdf_download');

create or replace function public.admin_get_analytics(p_device_token uuid)
returns jsonb language plpgsql security definer set search_path='public'
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
 'other_downloads',(select count(*) from public.analytics_events where event_type='other_pdf_download' and created_at>=r_other),
 'other_tiles',coalesce((select jsonb_agg(jsonb_build_object('id',x.tile_id,'title',x.title,'views',x.views,'downloads',x.downloads) order by x.views desc,x.downloads desc,x.title) from (
   select metadata->>'tile_id' tile_id,coalesce(max(nullif(metadata->>'title','')),metadata->>'tile_id') title,
   count(*) filter(where event_type='other_view') views,count(*) filter(where event_type='other_pdf_download') downloads
   from public.analytics_events
   where event_type in ('other_view','other_pdf_download') and created_at>=r_other and nullif(metadata->>'tile_id','') is not null
   group by metadata->>'tile_id'
 ) x),'[]'::jsonb),
 'push_sent',(select coalesce(sum(sent_count),0) from public.push_campaigns where created_at>=r_push),
 'push_campaigns',(select count(*) from public.push_campaigns where created_at>=r_push),
 'push_opened_unique',(select count(*) from public.push_campaign_opens o join public.push_campaigns c on c.id=o.campaign_id where c.created_at>=r_push),
 'push_open_clicks',(select coalesce(sum(o.open_count),0) from public.push_campaign_opens o join public.push_campaigns c on c.id=o.campaign_id where c.created_at>=r_push),
 'push_subscribers',(select count(*) from public.push_subscriptions),
 'push_open_rate',(select case when coalesce(sum(c.sent_count),0)=0 then 0 else round(100.0*(select count(*) from public.push_campaign_opens o join public.push_campaigns c2 on c2.id=o.campaign_id where c2.created_at>=r_push)/sum(c.sent_count),1) end from public.push_campaigns c where c.created_at>=r_push),
 'contexts',coalesce((select jsonb_object_agg(ctx,cnt) from (select coalesce(nullif(context,''),'inne') ctx,count(*) cnt from public.analytics_events where event_type='page_open' and created_at>=dashboard_today_start group by coalesce(nullif(context,''),'inne')) q),'{}'::jsonb),
 'last7days',coalesce((select jsonb_agg(jsonb_build_object('date',series_day::date,'opens',coalesce(x.cnt,0)) order by series_day) from generate_series(date_trunc('day',now())-interval '6 days',date_trunc('day',now()),interval '1 day') series_day left join (select date_trunc('day',created_at) day_bucket,count(*) cnt from public.analytics_events where event_type='page_open' and created_at>=dashboard_week_start group by date_trunc('day',created_at)) x on x.day_bucket=series_day),'[]'::jsonb),
 'resets',coalesce((select jsonb_object_agg(metric,reset_at) from public.analytics_resets),'{}'::jsonb)
 ) into result;
 return result;
end;$function$;

create or replace function public.admin_reset_analytics(p_device_token uuid,p_metric text)
returns void language plpgsql security definer set search_path='public'
as $function$
declare a public.admin_devices%rowtype;m text:=lower(trim(coalesce(p_metric,'')));v_now timestamptz:=now();
begin
 select * into a from public.admin_devices where device_token=p_device_token and active=true limit 1;
 if a.id is null or a.role<>'super_admin' then raise exception 'Tylko Super Admin może zerować statystyki'; end if;
 if m='all' then
   insert into public.analytics_resets(metric,reset_at)
   select metric,v_now from unnest(array['users','installs','link_opens','all_opens','pwa_opens','game_players','game_plays','costume_draw','push','dashboard','other']) metric
   on conflict(metric) do update set reset_at=excluded.reset_at;
   perform public.write_admin_audit(a.id,'analytics_reset_all','analytics','all',jsonb_build_object('metric','all'));return;
 end if;
 if m not in ('users','installs','link_opens','all_opens','pwa_opens','game_players','game_plays','costume_draw','push','dashboard','other') then raise exception 'Nieobsługiwana statystyka'; end if;
 insert into public.analytics_resets(metric,reset_at) values(m,v_now) on conflict(metric) do update set reset_at=excluded.reset_at;
 perform public.write_admin_audit(a.id,'analytics_reset','analytics',m,jsonb_build_object('metric',m));
end;$function$;

commit;