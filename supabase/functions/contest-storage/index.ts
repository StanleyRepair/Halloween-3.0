import { createClient } from 'npm:@supabase/supabase-js@2.95.0';

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!;
function secretKey(){
  const raw=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(raw){try{const parsed=JSON.parse(raw);if(parsed?.default)return parsed.default}catch{}}
  const legacy=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!legacy)throw new Error('Brak klucza serwisowego Supabase');
  return legacy;
}
const sb=createClient(SUPABASE_URL,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}});
const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers})}
function validEntryPath(token:string,path:string){
  if(!UUID.test(token)||typeof path!=='string')return false;
  const esc=token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`^entries/${esc}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.jpg$`,'i').test(path);
}
function validStaffPath(path:string){return /^admin\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/i.test(path)}
async function removePhoto(path:string){
  let last='';
  for(let i=0;i<3;i++){
    const {error}=await sb.storage.from('contest-photos').remove([path]);
    if(!error)return null;
    last=error.message||String(error);
    if(i<2)await new Promise(r=>setTimeout(r,120*(i+1)));
  }
  return last||'Nie udało się usunąć pliku';
}
async function isReferenced(path:string){
  const {data,error}=await sb.from('contest_entries').select('id').eq('image_path',path).limit(1);
  if(error)throw error;
  return !!data?.length;
}
async function staffAllowed(token:string){
  if(!UUID.test(token))return false;
  const {data:admin,error:adminErr}=await sb.from('admin_devices').select('id').eq('device_token',token).eq('active',true).in('role',['admin','super_admin']).maybeSingle();
  if(adminErr)throw adminErr;
  if(admin)return true;
  const {data:photographer,error:photoErr}=await sb.from('photographer_devices').select('id').eq('device_token',token).eq('active',true).maybeSingle();
  if(photoErr)throw photoErr;
  return !!photographer;
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  try{
    const body=await req.json();
    const action=String(body?.action||'');

    if(action==='admin_delete_entry'){
      const token=String(body.device_token||'');
      const entryId=String(body.entry_id||'');
      if(!UUID.test(token)||!UUID.test(entryId))return json({error:'INVALID_REQUEST'},400);
      const {data:adminOk,error:adminErr}=await sb.rpc('is_admin_device',{p_device_token:token});
      if(adminErr||!adminOk)return json({error:'Brak uprawnień'},403);
      const {data:entry,error:entryErr}=await sb.from('contest_entries').select('id,name,image_path').eq('id',entryId).maybeSingle();
      if(entryErr)throw entryErr;
      if(!entry)return json({error:'Zgłoszenie nie istnieje'},404);
      const {error:deleteErr}=await sb.rpc('admin_delete_entry',{p_device_token:token,p_entry_id:entryId});
      if(deleteErr)return json({error:deleteErr.message},400);
      let photo_cleanup_warning:string|null=null;
      if(entry.image_path)photo_cleanup_warning=await removePhoto(entry.image_path);
      return json({ok:true,deleted_entry:entryId,photo_removed:!photo_cleanup_warning,photo_cleanup_warning});
    }

    if(action==='participant_save_entry'){
      const token=String(body.participant_token||'');
      const name=String(body.name||'').trim();
      const description=String(body.description||'').trim();
      const imagePath=String(body.image_path||'');
      if(!UUID.test(token)||!validEntryPath(token,imagePath))return json({error:'INVALID_REQUEST'},400);
      const {data:existing,error:existingErr}=await sb.from('contest_entries').select('id,image_path').eq('participant_token',token).maybeSingle();
      if(existingErr)throw existingErr;
      const args={p_participant_token:token,p_name:name,p_description:description,p_image_path:imagePath};
      const {data:saved,error:saveErr}=existing
        ? await sb.rpc('update_my_entry',args)
        : await sb.rpc('submit_contest_entry',args);
      if(saveErr){
        if(!existing||existing.image_path!==imagePath){
          const {data:current}=await sb.from('contest_entries').select('image_path').eq('participant_token',token).maybeSingle();
          if(current?.image_path!==imagePath)await removePhoto(imagePath);
        }
        return json({error:saveErr.message},400);
      }
      let old_photo_cleanup_warning:string|null=null;
      if(existing?.image_path&&existing.image_path!==imagePath)old_photo_cleanup_warning=await removePhoto(existing.image_path);
      return json({ok:true,mode:existing?'updated':'created',entry_id:existing?.id||saved||null,old_photo_removed:!old_photo_cleanup_warning,old_photo_cleanup_warning});
    }

    if(action==='participant_discard_photo'){
      const token=String(body.participant_token||'');
      const imagePath=String(body.image_path||'');
      if(!UUID.test(token)||!validEntryPath(token,imagePath))return json({error:'INVALID_REQUEST'},400);
      const {data:current,error}=await sb.from('contest_entries').select('image_path').eq('participant_token',token).maybeSingle();
      if(error)throw error;
      if(current?.image_path===imagePath)return json({ok:true,kept:true,reason:'in_use'});
      const cleanup=await removePhoto(imagePath);
      return json({ok:!cleanup,removed:!cleanup,error:cleanup},cleanup?500:200);
    }

    if(action==='staff_save_entry'){
      const token=String(body.device_token||'');
      const name=String(body.name||'').trim();
      const description=String(body.description||'').trim();
      const imagePath=String(body.image_path||'');
      if(!validStaffPath(imagePath)||!await staffAllowed(token))return json({error:'Brak uprawnień lub nieprawidłowy plik'},403);
      const {data:entryId,error}=await sb.rpc('admin_submit_contest_entry',{p_device_token:token,p_name:name,p_description:description,p_image_path:imagePath});
      if(error){
        if(!await isReferenced(imagePath))await removePhoto(imagePath);
        return json({error:error.message},400);
      }
      return json({ok:true,entry_id:entryId});
    }

    if(action==='staff_discard_photo'){
      const token=String(body.device_token||'');
      const imagePath=String(body.image_path||'');
      if(!validStaffPath(imagePath)||!await staffAllowed(token))return json({error:'Brak uprawnień lub nieprawidłowy plik'},403);
      if(await isReferenced(imagePath))return json({ok:true,kept:true,reason:'in_use'});
      const cleanup=await removePhoto(imagePath);
      return json({ok:!cleanup,removed:!cleanup,error:cleanup},cleanup?500:200);
    }

    return json({error:'UNKNOWN_ACTION'},400);
  }catch(e){return json({error:String((e as Error)?.message||e)},500)}
});