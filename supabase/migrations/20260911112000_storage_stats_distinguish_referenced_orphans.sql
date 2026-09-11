create or replace function public.admin_get_storage_stats(p_device_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','storage'
as $function$
declare
  v_admin public.admin_devices%rowtype;
  v_storage bigint := 0;
  v_active_storage bigint := 0;
  v_orphan_storage bigint := 0;
  v_db bigint := 0;
  v_buckets jsonb;
  v_file_count bigint := 0;
  v_active_file_count bigint := 0;
  v_orphan_file_count bigint := 0;
  v_newest timestamptz;
begin
  select * into v_admin from public.admin_devices where device_token=p_device_token and active=true limit 1;
  if v_admin.id is null or v_admin.role='photographer' then raise exception 'Brak dostępu administratora'; end if;

  with refs as (
    select 'admin-gallery'::text bucket_id,image_path object_name from public.gallery_photos
    union all select 'contest-photos',image_path from public.contest_entries
    union all select 'news-images',image_path from public.news_posts where image_path is not null
    union all select 'other-images',image_path from public.other_tiles where image_path is not null
    union all select 'bug-report-images',screenshot_path from public.app_bug_reports where screenshot_path is not null
  ), objs as (
    select o.bucket_id,o.name,coalesce((o.metadata->>'size')::bigint,0) bytes,o.created_at,
           exists(select 1 from refs r where r.bucket_id=o.bucket_id and r.object_name=o.name) referenced
    from storage.objects o where coalesce(o.is_delete_marker,false)=false
  )
  select coalesce(sum(bytes),0),coalesce(sum(bytes) filter(where referenced),0),coalesce(sum(bytes) filter(where not referenced),0),count(*),count(*) filter(where referenced),count(*) filter(where not referenced),max(created_at)
  into v_storage,v_active_storage,v_orphan_storage,v_file_count,v_active_file_count,v_orphan_file_count,v_newest from objs;

  select pg_database_size(current_database()) into v_db;

  with refs as (
    select 'admin-gallery'::text bucket_id,image_path object_name from public.gallery_photos
    union all select 'contest-photos',image_path from public.contest_entries
    union all select 'news-images',image_path from public.news_posts where image_path is not null
    union all select 'other-images',image_path from public.other_tiles where image_path is not null
    union all select 'bug-report-images',screenshot_path from public.app_bug_reports where screenshot_path is not null
  ), objs as (
    select o.bucket_id,o.name,coalesce((o.metadata->>'size')::bigint,0) bytes,o.created_at,
           exists(select 1 from refs r where r.bucket_id=o.bucket_id and r.object_name=o.name) referenced
    from storage.objects o where coalesce(o.is_delete_marker,false)=false
  )
  select coalesce(jsonb_agg(jsonb_build_object('bucket',bucket_id,'bytes',bytes,'files',files,'active_bytes',active_bytes,'active_files',active_files,'orphan_bytes',orphan_bytes,'orphan_files',orphan_files,'newest_file',newest_file) order by bytes desc),'[]'::jsonb)
  into v_buckets
  from (
    select bucket_id,coalesce(sum(bytes),0)::bigint bytes,count(*)::bigint files,coalesce(sum(bytes) filter(where referenced),0)::bigint active_bytes,count(*) filter(where referenced)::bigint active_files,coalesce(sum(bytes) filter(where not referenced),0)::bigint orphan_bytes,count(*) filter(where not referenced)::bigint orphan_files,max(created_at) newest_file
    from objs group by bucket_id
  ) q;

  return jsonb_build_object('storage_used_bytes',v_storage,'storage_active_bytes',v_active_storage,'storage_orphan_bytes',v_orphan_storage,'storage_limit_bytes',1073741824,'storage_remaining_bytes',greatest(1073741824-v_storage,0),'storage_file_count',v_file_count,'storage_active_file_count',v_active_file_count,'storage_orphan_file_count',v_orphan_file_count,'storage_newest_file',v_newest,'database_used_bytes',v_db,'database_limit_bytes',524288000,'database_remaining_bytes',greatest(524288000-v_db,0),'buckets',v_buckets,'plan','Free');
end;
$function$;

create or replace function public.admin_get_orphan_storage_objects(p_device_token uuid)
returns table(bucket_id text,object_name text,bytes bigint,created_at timestamptz)
language plpgsql
security definer
set search_path to 'public','storage'
as $function$
declare v_admin public.admin_devices%rowtype;
begin
  select * into v_admin from public.admin_devices where device_token=p_device_token and active=true limit 1;
  if v_admin.id is null or v_admin.role='photographer' then raise exception 'Brak dostępu administratora'; end if;
  return query
  with refs as (
    select 'admin-gallery'::text bucket_id,image_path object_name from public.gallery_photos
    union all select 'contest-photos',image_path from public.contest_entries
    union all select 'news-images',image_path from public.news_posts where image_path is not null
    union all select 'other-images',image_path from public.other_tiles where image_path is not null
    union all select 'bug-report-images',screenshot_path from public.app_bug_reports where screenshot_path is not null
  )
  select o.bucket_id,o.name,coalesce((o.metadata->>'size')::bigint,0),o.created_at
  from storage.objects o
  where coalesce(o.is_delete_marker,false)=false
    and not exists(select 1 from refs r where r.bucket_id=o.bucket_id and r.object_name=o.name)
  order by o.created_at;
end;
$function$;