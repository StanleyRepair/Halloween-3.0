(()=>{
const urlInput=document.getElementById('googleAlbumUrl');
const saveButton=document.getElementById('saveGoogleAlbum');
if(!urlInput||!saveButton||document.getElementById('googleAlbumTitle'))return;
const form=urlInput.closest('.inline-form');
if(!form)return;
const fields=document.createElement('div');
fields.className='google-album-meta-fields';
fields.innerHTML='<label>Tytuł kafelka<input id="googleAlbumTitle" type="text" maxlength="100" placeholder="Wspólny album Google Zdjęcia"></label><label>Opis kafelka<input id="googleAlbumDescription" type="text" maxlength="180" placeholder="Otwórz wspólny album"></label>';
form.parentNode.insertBefore(fields,form);
const style=document.createElement('style');
style.textContent='.google-album-meta-fields{display:grid;grid-template-columns:1fr;gap:10px;margin:10px 0 12px}.google-album-meta-fields label{margin:0}.google-album-meta-fields input{width:100%}@media(min-width:700px){.google-album-meta-fields{grid-template-columns:1fr 1fr}}';
document.head.appendChild(style);
const titleInput=document.getElementById('googleAlbumTitle');
const descriptionInput=document.getElementById('googleAlbumDescription');
function applyGoogle(tile){
  if(document.activeElement!==titleInput)titleInput.value=tile?.title||'Wspólny album Google Zdjęcia';
  if(document.activeElement!==descriptionInput)descriptionInput.value=tile?.description??'Otwórz wspólny album';
}
const baseRender=window.renderGallery;
if(typeof baseRender==='function'){
  window.renderGallery=function(tiles){
    const out=baseRender(tiles);
    applyGoogle((tiles||[]).find(t=>t.type==='google'));
    return out;
  };
}
async function refreshMeta(){
  try{
    const{data,error}=await sb.rpc('admin_get_gallery',{p_device_token:adminDevice});
    if(error)throw error;
    applyGoogle((data||[]).find(t=>t.type==='google'));
  }catch(e){console.warn('Google album metadata load failed',e)}
}
saveButton.onclick=async function(){
  const url=urlInput.value.trim();
  const title=titleInput.value.trim();
  const description=descriptionInput.value.trim();
  if(!title)return msg('Podaj tytuł kafelka albumu.',true);
  this.disabled=true;
  try{
    const{error}=await sb.rpc('admin_set_google_album_details',{p_device_token:adminDevice,p_url:url,p_title:title,p_description:description});
    if(error)throw error;
    msg(url?'Kafelek albumu zapisany ✓':'Kafelek albumu wyłączony ✓');
    if(typeof loadDashboard==='function')await loadDashboard();else await refreshMeta();
  }catch(e){msg(e.message||'Nie udało się zapisać kafelka albumu.',true)}finally{this.disabled=false}
};
document.getElementById('refreshGallery')?.addEventListener('click',()=>setTimeout(refreshMeta,50));
setTimeout(refreshMeta,150);
})();