(()=>{
let busy=false;
async function compressSafely(file){
  let bitmap=null,canvas=null;
  try{
    bitmap=await createImageBitmap(file);
    const max=1800,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Nie udało się przygotować zdjęcia.')),'image/jpeg',.84));
    return blob;
  }finally{
    try{bitmap?.close?.()}catch{}
    if(canvas){canvas.width=1;canvas.height=1}
  }
}
async function robustUpload(tileId,files){
  files=[...(files||[])];
  if(!files.length||busy)return;
  busy=true;
  let ok=0,failed=0;
  const failures=[];
  try{
    for(let i=0;i<files.length;i++){
      const file=files[i];
      msg(`Dodawanie zdjęcia ${i+1} z ${files.length}…`);
      try{
        const blob=await compressSafely(file);
        const path=`${tileId}/${crypto.randomUUID()}.jpg`;
        const{error:u}=await sb.storage.from('admin-gallery').upload(path,blob,{contentType:'image/jpeg',upsert:false});
        if(u)throw u;
        const{error}=await sb.rpc('admin_add_gallery_photo',{p_device_token:adminDevice,p_tile_id:tileId,p_image_path:path,p_caption:''});
        if(error)throw error;
        ok++;
      }catch(e){
        failed++;
        failures.push(`${file.name||`zdjęcie ${i+1}`}: ${e?.message||'błąd'}`);
      }
      await new Promise(r=>setTimeout(r,40));
    }
    await loadGallery();
    if(failed){
      msg(`Dodano ${ok} z ${files.length} zdjęć. Nie udało się dodać ${failed}.`,true);
      console.warn('Gallery upload failures',failures);
    }else msg(`Dodano wszystkie ${ok} zdjęć ✓`);
  }finally{busy=false}
}
window.uploadGalleryPhotos=robustUpload;
function rebind(){
  document.querySelectorAll('#galleryTiles input[data-upload]').forEach(input=>{
    if(input.dataset.multiFix==='1')return;
    input.dataset.multiFix='1';
    input.multiple=true;
    input.onchange=e=>{const files=Array.from(e.target.files||[]);if(files.length)robustUpload(input.dataset.upload,files);e.target.value=''};
  });
}
const root=document.getElementById('galleryTiles');
if(root){new MutationObserver(rebind).observe(root,{childList:true,subtree:true});rebind()}
})();