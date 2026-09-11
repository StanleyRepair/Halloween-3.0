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
const ALLOWED_BUCKETS=new Set(['admin-gallery','contest-photos','news-images','other-images','bug-report-images']);
function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers})}
async function adminAllowed(token:string){
  if(!UUID.test(token))return false;
  const{data,error}=await sb.from('admin_devices').select('id,role').eq('device_token',token).eq('active',true).in('role',['admin','super_admin']).maybeSingle();
  if(error)throw error;
  return !!data;
}
async function removeFiles(bucket:string,paths:string[]){
  const clean=[...new Set(paths.map(x=>String(x||'').trim()).filter(Boolean))];
  if(!ALLOWED_BUCKETS.has(bucket)||!clean.length)return {removed:0,error:null};
  let removed=0;
  for(let i=0;i<clean.length;i+=1000){
    const chunk=clean.slice(i,i+1000);
    const{error}=await sb.storage.from(bucket).remove(chunk);
    if(error)return {removed,error:error.message||String(error)};
    removed+=chunk.length;
  }
  return {removed,error:null};
}
async function cleanupNewFile(bucket:string,path:string){
  if(!path)return;
  try{await removeFiles(bucket,[path])}catch{}
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  try{
    const body=await req.json();
    const action=String(body?.action||'');
    const token=String(body?.device_token||'');
    if(!await adminAllowed(token))return json({error:'Brak uprawnień'},403);

    if(action==='gallery_add_photo'){
      const path=String(body.image_path||'');
      const{data,error}=await sb.rpc('admin_add_gallery_photo',{p_device_token:token,p_tile_id:String(body.tile_id||''),p_image_path:path,p_caption:String(body.caption||'')});
      if(error){await cleanupNewFile('admin-gallery',path);return json({error:error.message},400)}
      return json({ok:true,data});
    }

    if(action==='gallery_delete_photo'){
      const id=String(body.photo_id||'');
      const{data:photo,error:readErr}=await sb.from('gallery_photos').select('image_path').eq('id',id).maybeSingle();
      if(readErr)throw readErr;
      if(!photo)return json({error:'Zdjęcie nie istnieje'},404);
      const{error}=await sb.rpc('admin_delete_gallery_photo',{p_device_token:token,p_photo_id:id});
      if(error)return json({error:error.message},400);
      const cleanup=await removeFiles('admin-gallery',[photo.image_path]);
      return json({ok:true,cleanup_warning:cleanup.error});
    }

    if(action==='gallery_delete_folder'){
      const id=String(body.tile_id||'');
      const{data:photos,error:readErr}=await sb.from('gallery_photos').select('image_path').eq('tile_id',id);
      if(readErr)throw readErr;
      const{error}=await sb.rpc('admin_delete_gallery_folder',{p_device_token:token,p_tile_id:id});
      if(error)return json({error:error.message},400);
      const cleanup=await removeFiles('admin-gallery',(photos||[]).map((x:any)=>x.image_path));
      return json({ok:true,removed_files:cleanup.removed,cleanup_warning:cleanup.error});
    }

    if(action==='news_create'){
      const path=String(body.image_path||'').trim();
      const args={p_device_token:token,p_title:String(body.title||''),p_body:String(body.body||''),p_icon:String(body.icon||'🎃'),p_badge:String(body.badge||''),p_image_path:path||null};
      const{data,error}=await sb.rpc('admin_create_news',args);
      if(error){if(path)await cleanupNewFile('news-images',path);return json({error:error.message},400)}
      return json({ok:true,data});
    }

    if(action==='news_update'){
      const id=String(body.news_id||'');
      const newPath=String(body.image_path||'').trim();
      const{data:old,error:readErr}=await sb.from('news_posts').select('image_path').eq('id',id).maybeSingle();
      if(readErr)throw readErr;
      if(!old)return json({error:'Aktualność nie istnieje'},404);
      const args={p_device_token:token,p_news_id:id,p_title:String(body.title||''),p_body:String(body.body||''),p_icon:String(body.icon||'🎃'),p_badge:String(body.badge||''),p_active:body.active!==false,p_image_path:newPath||null};
      const{error}=await sb.rpc('admin_update_news',args);
      if(error){if(newPath&&newPath!==old.image_path)await cleanupNewFile('news-images',newPath);return json({error:error.message},400)}
      let cleanup_warning=null;
      if(old.image_path&&old.image_path!==newPath)cleanup_warning=(await removeFiles('news-images',[old.image_path])).error;
      return json({ok:true,cleanup_warning});
    }

    if(action==='news_delete'){
      const id=String(body.news_id||'');
      const{data:old,error:readErr}=await sb.from('news_posts').select('image_path').eq('id',id).maybeSingle();
      if(readErr)throw readErr;
      const{error}=await sb.rpc('admin_delete_news',{p_device_token:token,p_news_id:id});
      if(error)return json({error:error.message},400);
      let cleanup_warning=null;
      if(old?.image_path)cleanup_warning=(await removeFiles('news-images',[old.image_path])).error;
      return json({ok:true,cleanup_warning});
    }

    if(action==='other_update'){
      const id=String(body.tile_id||'');
      const newPath=String(body.image_path||'').trim();
      const{data:old,error:readErr}=await sb.from('other_tiles').select('image_path').eq('id',id).maybeSingle();
      if(readErr)throw readErr;
      if(!old)return json({error:'Kafelek nie istnieje'},404);
      const args={p_device_token:token,p_tile_id:id,p_title:String(body.title||''),p_icon:String(body.icon||''),p_body:String(body.body||''),p_image_path:newPath||null,p_active:body.active!==false};
      const{error}=await sb.rpc('admin_update_other_tile',args);
      if(error){if(newPath&&newPath!==old.image_path)await cleanupNewFile('other-images',newPath);return json({error:error.message},400)}
      let cleanup_warning=null;
      if(old.image_path&&old.image_path!==newPath)cleanup_warning=(await removeFiles('other-images',[old.image_path])).error;
      return json({ok:true,cleanup_warning});
    }

    if(action==='other_delete'){
      const id=String(body.tile_id||'');
      const{data:old,error:readErr}=await sb.from('other_tiles').select('image_path').eq('id',id).maybeSingle();
      if(readErr)throw readErr;
      const{error}=await sb.rpc('admin_delete_other_tile',{p_device_token:token,p_tile_id:id});
      if(error)return json({error:error.message},400);
      let cleanup_warning=null;
      if(old?.image_path)cleanup_warning=(await removeFiles('other-images',[old.image_path])).error;
      return json({ok:true,cleanup_warning});
    }

    if(action==='cleanup_orphans'){
      const{data,error}=await sb.rpc('admin_get_orphan_storage_objects',{p_device_token:token});
      if(error)return json({error:error.message},400);
      const rows=(data||[]).filter((x:any)=>ALLOWED_BUCKETS.has(String(x.bucket_id||'')));
      let removed=0,bytes=0;
      const warnings:string[]=[];
      for(const bucket of ALLOWED_BUCKETS){
        const group=rows.filter((x:any)=>x.bucket_id===bucket);
        if(!group.length)continue;
        const result=await removeFiles(bucket,group.map((x:any)=>x.object_name));
        removed+=result.removed;
        if(!result.error)bytes+=group.reduce((s:number,x:any)=>s+Number(x.bytes||0),0);
        else warnings.push(`${bucket}: ${result.error}`);
      }
      return json({ok:warnings.length===0,removed_files:removed,removed_bytes:bytes,warnings});
    }

    return json({error:'UNKNOWN_ACTION'},400);
  }catch(e){return json({error:String((e as Error)?.message||e)},500)}
});