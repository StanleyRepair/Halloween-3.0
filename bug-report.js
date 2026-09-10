(()=>{
const view=document.querySelector('[data-view="other"]');if(!view)return;
const list=view.querySelector('#otherTiles'),detail=view.querySelector('#otherDetail');if(!list||!detail)return;
const BUG_ID='__bug_report__',BUCKET='bug-report-images',MAX_IMAGE_BYTES=2*1024*1024;
const ALLOWED_TYPES=new Set(['image/jpeg','image/png','image/webp']);
let sending=false,selectedFile=null,previewUrl=null;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function ensureTile(){if(list.querySelector(`[data-other-id="${BUG_ID}"]`))return;const b=document.createElement('button');b.type='button';b.className='other-tile bug-report-tile';b.dataset.otherId=BUG_ID;b.innerHTML='<span class="other-tile-icon">🐞</span><span><strong>Zgłoś błąd</strong><small>Coś nie działa? Daj nam znać</small></span><span class="other-chevron">›</span>';list.appendChild(b)}
function clearPreviewUrl(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}}
function resetImage(){selectedFile=null;clearPreviewUrl();const input=detail.querySelector('#bugReportImage'),box=detail.querySelector('[data-bug-image-preview]');if(input)input.value='';if(box)box.hidden=true}
function fmtSize(bytes){return bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/1024/1024).toFixed(2)} MB`}
function showForm(){selectedFile=null;clearPreviewUrl();list.hidden=true;detail.hidden=false;detail.dataset.currentId=BUG_ID;detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail bug-report-detail"><div class="other-detail-head"><span class="other-detail-icon">🐞</span><h2>Zgłoś błąd</h2></div><p class="bug-report-intro">Opisz, co się stało i co robiłeś chwilę wcześniej. Informacja o wersji aplikacji i urządzeniu zostanie dołączona automatycznie.</p><label class="bug-report-label" for="bugReportMessage">Opis błędu</label><textarea id="bugReportMessage" class="bug-report-textarea" maxlength="2000" rows="7" placeholder="Np. po wejściu w Zdjęcia i otwarciu fotografii przycisk reakcji nie działa..."></textarea><div class="bug-report-counter"><span data-bug-count>0</span> / 2000</div><div class="bug-report-attachment"><div class="bug-report-label">Zdjęcie <span>opcjonalnie</span></div><div class="bug-report-upload-row"><label class="bug-report-upload">📎 Dodaj zdjęcie<input id="bugReportImage" type="file" accept="image/jpeg,image/png,image/webp" hidden></label><small>Pliki powyżej 2 MB zostaną automatycznie skompresowane.</small></div><div class="bug-report-image-preview" data-bug-image-preview hidden><img data-bug-image-thumb alt="Podgląd załącznika"><div class="bug-report-image-meta"><strong data-bug-image-name></strong><small data-bug-image-size></small></div><button type="button" data-bug-image-remove>Usuń</button></div></div><button type="button" class="bug-report-submit" data-bug-submit>WYŚLIJ ZGŁOSZENIE</button></div>`;const ta=detail.querySelector('#bugReportMessage'),count=detail.querySelector('[data-bug-count]'),input=detail.querySelector('#bugReportImage');ta?.focus?.({preventScroll:true});ta?.addEventListener('input',()=>{if(count)count.textContent=String(ta.value.length)});input?.addEventListener('change',()=>selectImage(input.files?.[0]||null))}
function toast(text,error=false){let t=document.getElementById('bugReportToast');if(!t){t=document.createElement('div');t.id='bugReportToast';t.className='bug-report-toast';document.body.appendChild(t)}t.textContent=text;t.classList.toggle('error',!!error);t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),4200)}
function visitorId(){let v=window.H3Analytics?.visitorId||null;if(!v){try{v=localStorage.getItem('h3_visitor_id')}catch{}}return UUID.test(v||'')?v:null}
function context(){return window.H3Analytics?.context||(matchMedia('(display-mode: standalone)').matches?'pwa':'browser')}
function selectImage(file){if(!file){resetImage();return}if(!ALLOWED_TYPES.has(file.type)){toast('Wybierz zdjęcie JPG, PNG lub WebP.',true);resetImage();return}selectedFile=file;clearPreviewUrl();previewUrl=URL.createObjectURL(file);const box=detail.querySelector('[data-bug-image-preview]'),img=detail.querySelector('[data-bug-image-thumb]'),name=detail.querySelector('[data-bug-image-name]'),size=detail.querySelector('[data-bug-image-size]');if(img)img.src=previewUrl;if(name)name.textContent=file.name||'Załączone zdjęcie';if(size)size.textContent=file.size>MAX_IMAGE_BYTES?`${fmtSize(file.size)} • zostanie skompresowane`:fmtSize(file.size);if(box)box.hidden=false}
async function toJpeg(canvas,quality){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Nie udało się przygotować zdjęcia.')),'image/jpeg',quality))}
async function prepareImage(file){
  if(file.size<=MAX_IMAGE_BYTES){const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';return{blob:file,ext,contentType:file.type}}
  let bitmap=null,canvas=null;
  try{
    bitmap=await createImageBitmap(file);
    const originalMax=Math.max(bitmap.width,bitmap.height);let maxSide=Math.min(2200,originalMax);
    for(let pass=0;pass<5;pass++){
      const scale=Math.min(1,maxSide/originalMax);canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      for(const quality of [.88,.80,.72,.64,.56]){const blob=await toJpeg(canvas,quality);if(blob.size<=MAX_IMAGE_BYTES)return{blob,ext:'jpg',contentType:'image/jpeg'}}
      canvas.width=1;canvas.height=1;canvas=null;maxSide=Math.max(800,Math.round(maxSide*.82));
    }
    throw new Error('Nie udało się zmniejszyć zdjęcia poniżej 2 MB. Wybierz inne zdjęcie.');
  }finally{try{bitmap?.close?.()}catch{}if(canvas){canvas.width=1;canvas.height=1}}
}
async function currentVersion(){try{const r=await fetch(`./service-worker.js?bug-report-version=${Date.now()}`,{cache:'no-store'});if(!r.ok)return null;const txt=await r.text(),m=txt.match(/CACHE_NAME\s*=\s*['"]halloween-3-v(\d+)['"]/);return m?`V${m[1]}`:null}catch{return null}}
async function submit(){
  if(sending)return;const ta=detail.querySelector('#bugReportMessage'),btn=detail.querySelector('[data-bug-submit]');if(!ta||!btn)return;const message=ta.value.trim();if(message.length<5){toast('Opisz błąd trochę dokładniej.',true);ta.focus();return}
  sending=true;btn.disabled=true;let uploadedPath=null;
  try{
    if(selectedFile){btn.textContent=selectedFile.size>MAX_IMAGE_BYTES?'KOMPRESOWANIE...':'PRZYGOTOWYWANIE...';const prepared=await prepareImage(selectedFile);btn.textContent='WYSYŁANIE ZDJĘCIA...';const folder=visitorId()||crypto.randomUUID(),path=`reports/${folder}/${crypto.randomUUID()}.${prepared.ext}`;const{error:uploadError}=await sb.storage.from(BUCKET).upload(path,prepared.blob,{contentType:prepared.contentType,upsert:false});if(uploadError)throw uploadError;uploadedPath=path}
    btn.textContent='WYSYŁANIE...';const version=await currentVersion();const{error}=await sb.rpc('submit_app_bug_report_v2',{p_visitor_id:visitorId(),p_message:message,p_context:context(),p_app_version:version,p_user_agent:navigator.userAgent||null,p_screenshot_path:uploadedPath});if(error)throw error;
    ta.value='';const c=detail.querySelector('[data-bug-count]');if(c)c.textContent='0';resetImage();toast('Zgłoszenie wysłane. Dzięki! ✓');btn.textContent='WYSŁANO ✓';setTimeout(()=>{if(document.body.contains(btn)){btn.textContent='WYŚLIJ ZGŁOSZENIE';btn.disabled=false}},1800)
  }catch(e){
    console.warn('Bug report failed',e);if(uploadedPath){try{await sb.storage.from(BUCKET).remove([uploadedPath])}catch(cleanupError){console.warn('Bug report image cleanup failed',cleanupError)}}toast(e.message||'Nie udało się wysłać zgłoszenia.',true);btn.textContent='WYŚLIJ ZGŁOSZENIE';btn.disabled=false
  }finally{sending=false}
}
view.addEventListener('click',e=>{const tile=e.target.closest(`[data-other-id="${BUG_ID}"]`);if(tile){e.preventDefault();showForm();return}if(e.target.closest('[data-bug-submit]')){e.preventDefault();submit();return}if(e.target.closest('[data-bug-image-remove]')){e.preventDefault();resetImage()}});
new MutationObserver(()=>{if(!detail.hidden&&detail.dataset.currentId===BUG_ID)return;ensureTile()}).observe(list,{childList:true});
document.querySelector('.nav-item[data-tab="other"]')?.addEventListener('click',()=>setTimeout(ensureTile,80));
window.addEventListener('pagehide',clearPreviewUrl,{once:true});
setTimeout(ensureTile,300);
})();