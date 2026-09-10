(()=>{
const dashboard=document.getElementById('dashboard');
const identity=document.getElementById('identity');
if(!dashboard||!identity)return;

const COMPRESSION_SCRIPT='contest-image-compression.js?v=2';
const ADMIN_SCRIPTS=[
  COMPRESSION_SCRIPT,
  'rich-text.js?v=5',
  'admin-rich-loader.js?v=4',
  'admin-share.js?v=4',
  'admin-gallery-fix.js?v=1',
  'admin-news.js?v=2',
  'admin-push-ui.js?v=1',
  'google-photos-picker.js?v=1',
  'admin-menu.js?v=11',
  'admin-install-preview.js?v=1',
  'admin-push-center.js?v=3',
  'admin-contest-extra.js?v=2',
  'admin-contest-push.js?v=1',
  'admin-disk.js?v=3'
];

let adminModulesReady=false;
let adminModulesPromise=null;
let photographerReady=false;

function installContestStorageRpcBridge(){
  if(typeof sb==='undefined'||sb.__h3AdminContestStorageRpcWrapped)return;
  const originalRpc=sb.rpc.bind(sb);
  sb.rpc=async function(name,args={},options){
    if(name==='admin_delete_entry'){
      const{data,error}=await sb.functions.invoke('contest-storage',{body:{action:'admin_delete_entry',device_token:String(args?.p_device_token||''),entry_id:String(args?.p_entry_id||'')}});
      if(error||data?.error)return{data:null,error:error||new Error(data.error)};
      if(data?.photo_cleanup_warning)console.warn('Zgłoszenie usunięte, ale sprzątanie zdjęcia zgłosiło problem:',data.photo_cleanup_warning);
      return{data:null,error:null};
    }
    if(name==='admin_submit_contest_entry'){
      const token=String(args?.p_device_token||''),imagePath=String(args?.p_image_path||'');
      const body={action:'staff_save_entry',device_token:token,name:String(args?.p_name||''),description:String(args?.p_description||''),image_path:imagePath};
      const{data,error}=await sb.functions.invoke('contest-storage',{body});
      if(error||data?.error){
        try{await sb.functions.invoke('contest-storage',{body:{action:'staff_discard_photo',device_token:token,image_path:imagePath}})}catch{}
        return{data:null,error:error||new Error(data.error)};
      }
      return{data:data?.entry_id||null,error:null};
    }
    return originalRpc(name,args,options);
  };
  sb.__h3AdminContestStorageRpcWrapped=true;
}
installContestStorageRpcBridge();

function roleNow(){
  try{return typeof currentSelf!=='undefined'&&currentSelf?currentSelf.role:null}catch{return null}
}

function preloadAdminScripts(){
  const existing=[...document.head.querySelectorAll('link[data-h3-admin-preload]')];
  for(const src of ADMIN_SCRIPTS){
    if(existing.some(link=>link.dataset.h3AdminPreload===src))continue;
    const link=document.createElement('link');
    link.rel='preload';
    link.as='script';
    link.href=src;
    link.dataset.h3AdminPreload=src;
    document.head.appendChild(link);
    existing.push(link);
  }
}

function loadScript(src,timeoutMs=6000){
  return new Promise((resolve,reject)=>{
    let s=[...document.scripts].find(el=>el.dataset.h3AdminSrc===src||el.getAttribute('src')===src);
    if(s?.dataset.h3Loaded==='1')return resolve();
    if(s&&s.dataset.h3Managed!=='1')return resolve();
    if(s?.dataset.h3Failed==='1'){s.remove();s=null}
    let isNew=false;
    if(!s){
      s=document.createElement('script');
      s.src=src;
      s.async=false;
      s.dataset.h3Managed='1';
      s.dataset.h3AdminSrc=src;
      isNew=true;
    }
    let done=false;
    let timer=null;
    const finish=(ok,error)=>{
      if(done)return;
      done=true;
      if(timer)clearTimeout(timer);
      s.removeEventListener('load',onLoad);
      s.removeEventListener('error',onError);
      if(ok){s.dataset.h3Loaded='1';resolve()}
      else{s.dataset.h3Failed='1';s.remove();reject(error)}
    };
    const onLoad=()=>finish(true);
    const onError=()=>finish(false,new Error(`Nie udało się wczytać ${src}`));
    s.addEventListener('load',onLoad,{once:true});
    s.addEventListener('error',onError,{once:true});
    timer=setTimeout(()=>finish(false,new Error(`Przekroczono czas wczytywania ${src}`)),timeoutMs);
    if(isNew)document.body.appendChild(s);
  });
}

async function loadAdminModules(){
  if(adminModulesReady)return true;
  if(adminModulesPromise)return adminModulesPromise;
  preloadAdminScripts();
  adminModulesPromise=(async()=>{
    for(const src of ADMIN_SCRIPTS){
      try{await loadScript(src)}
      catch(e){
        console.error(e);
        setTimeout(()=>{if(!adminModulesReady)loadAdminModules()},1200);
        return false;
      }
    }
    adminModulesReady=true;
    return true;
  })();
  try{return await adminModulesPromise}
  finally{adminModulesPromise=null}
}

function hideRegularDashboard(){
  [...dashboard.children].forEach(el=>{
    if(el!==identity&&el.id!=='photographerWorkspace')el.hidden=true;
  });
}

function ensurePhotographerWorkspace(){
  let workspace=document.getElementById('photographerWorkspace');
  if(workspace)return workspace;
  workspace=document.createElement('div');
  workspace.id='photographerWorkspace';
  workspace.innerHTML=`
    <div id="photographerMenu" class="admin-menu photographer-menu">
      <button class="admin-menu-tile" type="button" data-photographer-open="contest">
        <span class="admin-menu-icon">🏆</span>
        <span>
          <span class="admin-menu-title">Konkurs</span>
          <span class="admin-menu-desc">Zgłaszanie uczestników konkursu</span>
        </span>
      </button>
    </div>
    <div id="photographerContestPanel" class="admin-function-panel photographer-contest-panel">
      <div class="admin-function-head">
        <button id="photographerBack" class="admin-function-back" type="button" aria-label="Wróć do menu">←</button>
        <h2 class="admin-function-heading">Konkurs</h2>
      </div>
      <section class="card contest-extra-card">
        <h2>Dodaj uczestnika</h2>
        <p class="small">Możesz zgłaszać uczestników konkursu bez limitu liczby osób.</p>
        <div class="contest-extra-grid">
          <label>Imię<input id="photoEntryName" type="text" maxlength="60" placeholder="Np. Michał"></label>
          <label>Krótki opis<input id="photoEntryDescription" type="text" maxlength="240" placeholder="Np. Joker"></label>
        </div>
        <label class="contest-extra-photo">📷 Wybierz zdjęcie<input id="photoEntryPhoto" type="file" accept="image/jpeg,image/png,image/webp" hidden></label>
        <img id="photoEntryPreview" class="contest-extra-preview" hidden alt="Podgląd zdjęcia">
        <div class="contest-extra-note">Każde zdjęcie konkursowe jest przetwarzane identycznie. Docelowy rozmiar to około 1 MB.</div>
        <button id="photoSubmitEntry" class="primary" type="button">DODAJ UCZESTNIKA</button>
      </section>
    </div>`;
  identity.insertAdjacentElement('afterend',workspace);
  return workspace;
}

function showPhotographerMenu(){
  const menu=document.getElementById('photographerMenu');
  const panel=document.getElementById('photographerContestPanel');
  if(menu)menu.hidden=false;
  if(panel)panel.classList.remove('active');
  try{history.replaceState(null,'',location.pathname+location.search)}catch{}
  window.scrollTo({top:0,behavior:'smooth'});
}

function showPhotographerContest(){
  const menu=document.getElementById('photographerMenu');
  const panel=document.getElementById('photographerContestPanel');
  if(menu)menu.hidden=true;
  if(panel){panel.classList.add('active');panel.scrollIntoView({block:'start'})}
  try{history.replaceState(null,'','#admin-contest')}catch{}
}

function bindPhotographerForm(){
  const name=document.getElementById('photoEntryName');
  const desc=document.getElementById('photoEntryDescription');
  const file=document.getElementById('photoEntryPhoto');
  const preview=document.getElementById('photoEntryPreview');
  const button=document.getElementById('photoSubmitEntry');
  if(!name||!file||!preview||!button||button.dataset.bound)return;
  button.dataset.bound='1';
  file.onchange=()=>{
    const f=file.files?.[0];
    if(!f){preview.hidden=true;preview.removeAttribute('src');return}
    preview.src=URL.createObjectURL(f);
    preview.hidden=false;
  };
  button.onclick=async()=>{
    const participantName=name.value.trim();
    const description=desc.value.trim();
    const upload=file.files?.[0];
    if(!participantName)return msg('Podaj imię uczestnika.',true);
    if(!upload)return msg('Wybierz zdjęcie.',true);
    if(upload.size>15*1024*1024)return msg('Zdjęcie jest większe niż 15 MB.',true);
    const ext=(upload.name.split('.').pop()||'jpg').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
    if(!['jpg','jpeg','png','webp'].includes(ext))return msg('Obsługiwane formaty zdjęć: JPG, PNG i WEBP.',true);
    button.disabled=true;
    try{
      if(typeof window.H3ContestCompress!=='function')throw new Error('Moduł kompresji zdjęć nie został wczytany.');
      const processed=await window.H3ContestCompress(upload);
      const path=`admin/${crypto.randomUUID()}.jpg`;
      const{error:uploadError}=await sb.storage.from('contest-photos').upload(path,processed,{contentType:'image/jpeg',upsert:false});
      if(uploadError)throw uploadError;
      const{error}=await sb.rpc('admin_submit_contest_entry',{p_device_token:adminDevice,p_name:participantName,p_description:description,p_image_path:path});
      if(error)throw error;
      name.value='';
      desc.value='';
      file.value='';
      preview.hidden=true;
      preview.removeAttribute('src');
      msg('Uczestnik dodany ✓');
    }catch(e){
      msg(e.message||'Nie udało się dodać uczestnika.',true);
    }finally{
      button.disabled=false;
    }
  };
}

function setupPhotographer(){
  if(photographerReady)return;
  photographerReady=true;
  document.documentElement.classList.add('photographer-minimal');
  const badge=identity.querySelector('.role-badge');
  if(badge){badge.textContent='FOTOGRAF';badge.classList.add('photographer-role')}
  hideRegularDashboard();
  const workspace=ensurePhotographerWorkspace();
  workspace.hidden=false;
  const tile=workspace.querySelector('[data-photographer-open="contest"]');
  const back=workspace.querySelector('#photographerBack');
  if(tile)tile.onclick=showPhotographerContest;
  if(back)back.onclick=showPhotographerMenu;
  bindPhotographerForm();
  if(location.hash==='#admin-contest')showPhotographerContest();else showPhotographerMenu();
}

async function bootForCurrentRole(){
  if(dashboard.hidden)return;
  const role=roleNow();
  if(!role)return;
  if(role==='photographer'){
    try{
      await loadScript(COMPRESSION_SCRIPT);
      setupPhotographer();
    }catch(e){
      console.error(e);
      msg('Nie udało się wczytać kompresji zdjęć. Odśwież panel.',true);
    }
  }else{
    loadAdminModules();
  }
}

new MutationObserver(bootForCurrentRole).observe(dashboard,{attributes:true,attributeFilter:['hidden']});
setTimeout(bootForCurrentRole,0);
})();
