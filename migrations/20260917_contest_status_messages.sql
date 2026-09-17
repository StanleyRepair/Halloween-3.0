alter table public.contest_settings
  add column if not exists status_closed_empty_title text not null default 'Konkurs jeszcze nie wystartował',
  add column if not exists status_closed_empty_text text not null default 'Organizator uruchomi zgłoszenia w odpowiednim momencie.',
  add column if not exists status_closed_entries_title text not null default 'Konkurs jest w trakcie',
  add column if not exists status_closed_entries_text text not null default 'Zgłoszenia są zamknięte. Poczekaj na rozpoczęcie głosowania.',
  add column if not exists status_registration_open_title text not null default 'Zgłoszenia są otwarte',
  add column if not exists status_registration_open_text text not null default 'Dodaj jedno zdjęcie swojego przebrania.',
  add column if not exists status_registration_saved_editable_title text not null default 'Zgłoszenie zapisane',
  add column if not exists status_registration_saved_editable_text text not null default 'Możesz poprawić zdjęcie, imię lub opis do czasu zamknięcia zgłoszeń.',
  add column if not exists status_registration_saved_locked_title text not null default 'Zgłoszenie zapisane',
  add column if not exists status_registration_saved_locked_text text not null default 'Organizator wyłączył możliwość edycji zgłoszeń.',
  add column if not exists status_voting_title text not null default 'Głosowanie trwa',
  add column if not exists status_voting_text text not null default 'Zgłoszenia są zamknięte. Wybierz najlepsze przebrania i oddaj głosy.',
  add column if not exists status_finished_title text not null default 'Głosowanie zakończone',
  add column if not exists status_finished_text text not null default 'Oto zwycięzcy Halloween 3.0.';

create or replace function public.get_contest_status_content()
returns jsonb
language sql
security definer
set search_path to 'public'
as $$
  select jsonb_build_object(
    'closed_empty', jsonb_build_object('title',s.status_closed_empty_title,'text',s.status_closed_empty_text),
    'closed_entries', jsonb_build_object('title',s.status_closed_entries_title,'text',s.status_closed_entries_text),
    'registration_open', jsonb_build_object('title',s.status_registration_open_title,'text',s.status_registration_open_text),
    'registration_saved_editable', jsonb_build_object('title',s.status_registration_saved_editable_title,'text',s.status_registration_saved_editable_text),
    'registration_saved_locked', jsonb_build_object('title',s.status_registration_saved_locked_title,'text',s.status_registration_saved_locked_text),
    'voting', jsonb_build_object('title',s.status_voting_title,'text',s.status_voting_text),
    'finished', jsonb_build_object('title',s.status_finished_title,'text',s.status_finished_text)
  )
  from public.contest_settings s
  where s.id=true
$$;

create or replace function public.admin_set_contest_status_content(p_device_token uuid,p_state_key text,p_title text,p_text text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_admin public.admin_devices%rowtype;v_title text:=trim(coalesce(p_title,''));v_text text:=trim(coalesce(p_text,''));
begin
  select * into v_admin from public.admin_devices where device_token=p_device_token and active=true and role in ('admin','super_admin') limit 1;
  if v_admin.id is null then raise exception 'Brak dostępu administratora'; end if;
  if length(v_title)<1 or length(v_title)>120 then raise exception 'Nagłówek musi mieć od 1 do 120 znaków'; end if;
  if length(v_text)<1 or length(v_text)>500 then raise exception 'Treść musi mieć od 1 do 500 znaków'; end if;
  case p_state_key
    when 'closed_empty' then update public.contest_settings set status_closed_empty_title=v_title,status_closed_empty_text=v_text,updated_at=now() where id=true;
    when 'closed_entries' then update public.contest_settings set status_closed_entries_title=v_title,status_closed_entries_text=v_text,updated_at=now() where id=true;
    when 'registration_open' then update public.contest_settings set status_registration_open_title=v_title,status_registration_open_text=v_text,updated_at=now() where id=true;
    when 'registration_saved_editable' then update public.contest_settings set status_registration_saved_editable_title=v_title,status_registration_saved_editable_text=v_text,updated_at=now() where id=true;
    when 'registration_saved_locked' then update public.contest_settings set status_registration_saved_locked_title=v_title,status_registration_saved_locked_text=v_text,updated_at=now() where id=true;
    when 'voting' then update public.contest_settings set status_voting_title=v_title,status_voting_text=v_text,updated_at=now() where id=true;
    when 'finished' then update public.contest_settings set status_finished_title=v_title,status_finished_text=v_text,updated_at=now() where id=true;
    else raise exception 'Nieprawidłowy stan komunikatu';
  end case;
  update public.admin_devices set last_seen_at=now() where id=v_admin.id;
  perform public.write_admin_audit(v_admin.id,'contest_status_message_changed','contest_settings',p_state_key,jsonb_build_object('state_key',p_state_key));
  return public.get_contest_status_content();
end
$$;

grant execute on function public.get_contest_status_content() to anon, authenticated;
grant execute on function public.admin_set_contest_status_content(uuid,text,text,text) to anon, authenticated;