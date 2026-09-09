(()=>{
const view=document.querySelector('[data-view="other"]');if(!view)return;
const list=view.querySelector('#otherTiles'),detail=view.querySelector('#otherDetail');
const otherNav=document.querySelector('.nav-item[data-tab="other"]');
let data=[],navStack=[],gameAssetsPromise=null;
let updateMeta=null,updateAvailable=false,updateChecking=false,updateError=false,lastUpdateCheck=0,toastTimer=null;
const GAME_ID='__creepy_pumpkin__';
const gameTile={id:GAME_ID,title:'Creepy Pumpkin',icon:'🎃',body:'',image_path:null,children:[],builtin_game:true};
const UPDATE_META_URL='https://raw.githubusercontent.com/StanleyRepair/Halloween-3.0/main/downloads/android-version.json';
const NATIVE_UPDATE_MIN_CODE=9;
const isAndroid=/Android/i.test(navigator.userAgent);
const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const imageUrl=path=>`${SUPABASE_URL}/storage/v1/object/public/other-images/${String(path||'').split('/').map(encodeURIComponent).join('/')}`;
function captureApkContext(){
  if(!isAndroid)return;
  try{
    const u=new URL(location.href);
    const apkParam=u.searchParams.get('h3apk')==='1';
    const v=u.searchParams.get('h3appver'),c=u.searchParams.get('h3appcode');
    if(apkParam){
      sessionStorage.setItem('h3_apk_session','1');
      localStorage.setItem('h3_android_apk','1');
    }
    if(v){localStorage.setItem('h3_apk_version',v);localStorage.setItem('h3_android_apk','1')}
    if(c&&/^\d+$/.test(c)){localStorage.setItem('h3_apk_version_code',c);localStorage.setItem('h3_android_apk','1')}
  }catch{}
}
function isAndroidApk(){
  if(!isAndroid)return false;
  try{
    return sessionStorage.getItem('h3_apk_session')==='1'
      || localStorage.getItem('h3_android_apk')==='1'
      || /^\d+$/.test(localStorage.getItem('h3_apk_version_code')||'');
  }catch{return false}
}
function installedVersion(){
  try{
    const version=localStorage.getItem('h3_apk_version')||'';
    const rawCode=localStorage.getItem('h3_apk_version_code')||'';
    const code=/^\d+$/.test(rawCode)?Number(rawCode):0;
    return {version,code,known:!!version&&code>0};
  }catch{return {version:'',code:0,known:false}}
}
function compareVersions(a,b){
  const pa=String(a||'0').split('.').map(n=>Number(n)||0),pb=String(b||'0').split('.').map(n=>Number(n)||0),len=Math.max(pa.length,pb.length);
  for(let i=0;i<len;i++){const d=(pa[i]||0)-(pb[i]||0);if(d)return d>0?1:-1}return 0;
}
function hasOwnContent(t){return !!((t.body||'').trim()||t.image_path||t.builtin_game)}
function tileMarkup(t,sub=false){const hasChildren=!!(t.children||[]).length,hasContent=hasOwnContent(t)||hasChildren;return `<button type="button" class="${sub?'other-subtile':'other-tile'}" data-other-id="${t.id}"><span class="other-tile-icon">${esc(t.icon||'📄')}</span><span><strong>${esc(t.title)}</strong><small>${hasContent?'Otwórz':'JUŻ WKRÓTCE.. 🔧'}</small></span><span class="other-chevron">›</span></button>`}
function rootTiles(){return [...(data||[]),gameTile]}
function updateNavDot(){otherNav?.classList.toggle('has-app-update',isAndroidApk()&&updateAvailable)}
function updateCardMarkup(){
  if(!isAndroidApk())return '';
  const installed=installedVersion();
  let status=installed.known?`Zainstalowana wersja ${installed.version}`:'Zainstalowana starsza wersja APK';
  if(updateChecking)status='Sprawdzanie dostępnej wersji...';
  else if(updateAvailable&&updateMeta?.version)status=`Dostępna nowa wersja ${updateMeta.version}`;
  else if(updateError&&!updateMeta)status=installed.known?`Wersja ${installed.version} • nie udało się sprawdzić aktualizacji`:'Nie udało się sprawdzić aktualizacji';
  const label=updateAvailable?'AKTUALIZUJ':'SPRAWDŹ';
  return `<div class="app-update-card${updateAvailable?' is-available':''}"><span class="app-update-dot" aria-hidden="true"></span><span class="app-update-icon">↻</span><span class="app-update-copy"><strong>Aktualizacja aplikacji</strong><small>${esc(status)}</small></span><button type="button" class="app-update-button" data-app-update ${updateChecking?'disabled':''}>${label}</button></div>`;
}
function showUpdateToast(message){
  let toast=document.getElementById('appUpdateToast');
  if(!toast){toast=document.createElement('div');toast.id='appUpdateToast';toast.className='app-update-toast';document.body.appendChild(toast)}
  clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('show');
  toastTimer=setTimeout(()=>toast.classList.remove('show'),4200);
}
async function checkAndroidUpdate(force=false){
  if(!isAndroidApk())return null;
  const now=Date.now();if(updateChecking)return updateMeta;if(!force&&now-lastUpdateCheck<60000)return updateMeta;
  updateChecking=true;updateError=false;lastUpdateCheck=now;
  if(!list.hidden)renderList();
  try{
    const r=await fetch(`${UPDATE_META_URL}?t=${now}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const meta=await r.json();
    if(!meta||!meta.version||!meta.apkUrl)throw new Error('Invalid update metadata');
    updateMeta=meta;
    const installed=installedVersion(),latestCode=Number(meta.versionCode)||0;
    if(!installed.known)updateAvailable=true;
    else updateAvailable=latestCode&&installed.code?latestCode>installed.code:compareVersions(meta.version,installed.version)>0;
    updateError=false;
  }catch(e){console.warn('Android update check failed',e);updateError=true}
  finally{
    updateChecking=false;updateNavDot();
    if(!detail.hidden&&detail.dataset.currentId)return updateMeta;
    if(!list.hidden)renderList();
  }
  return updateMeta;
}
async function handleUpdateClick(btn){
  btn.disabled=true;
  await checkAndroidUpdate(true);
  const installed=installedVersion();
  if(updateError&&!updateMeta){showUpdateToast('Nie udało się sprawdzić aktualizacji. Sprawdź połączenie z internetem.');btn.disabled=false;return}
  if(!updateAvailable){showUpdateToast(`Masz najnowszą wersję aplikacji ${installed.version||updateMeta?.version||''}.`.trim());btn.disabled=false;return}
  if(!updateMeta?.apkUrl){showUpdateToast('Nie udało się pobrać adresu aktualizacji.');btn.disabled=false;return}

  if(installed.known&&installed.code>=NATIVE_UPDATE_MIN_CODE){
    showUpdateToast(`Pobieram Halloween 3.0 ${updateMeta.version}. Po pobraniu instalator Androida otworzy się automatycznie.`);
    const nativeUrl=`halloween3://update?url=${encodeURIComponent(updateMeta.apkUrl)}&version=${encodeURIComponent(updateMeta.version)}`;
    try{location.href=nativeUrl}catch{btn.disabled=false;showUpdateToast('Nie udało się uruchomić instalatora aktualizacji.')}
    return;
  }

  showUpdateToast(`Pobieram Halloween 3.0 ${updateMeta.version}. Tę jedną aktualizację otwórz po pobraniu ręcznie. Od wersji 1.0.8 instalator będzie uruchamiał się automatycznie.`);
  try{location.href=updateMeta.apkUrl}catch{btn.disabled=false;showUpdateToast('Nie udało się rozpocząć pobierania aktualizacji.')}
}
function ensureGameAssets(){if(window.CreepyPumpkinGame)return Promise.resolve();if(gameAssetsPromise)return gameAssetsPromise;gameAssetsPromise=new Promise((resolve,reject)=>{if(!document.querySelector('link[data-creepy-pumpkin]')){const l=document.createElement('link');l.rel='stylesheet';l.href='creepy-pumpkin.css?v=2';l.dataset.creepyPumpkin='1';document.head.appendChild(l)}const s=document.createElement('script');s.src='creepy-pumpkin.js?v=3';s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});return gameAssetsPromise}
function renderList(){window.CreepyPumpkinGame?.unmount?.();navStack=[];detail.dataset.currentId='';detail.hidden=true;list.hidden=false;const tiles=rootTiles().map(t=>tileMarkup(t)).join('');list.innerHTML=updateCardMarkup()+(tiles||'<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>')}
function findTile(id){if(id===GAME_ID)return gameTile;for(const r of data){if(r.id===id)return r;const c=(r.children||[]).find(x=>x.id===id);if(c)return c}return null}
async function showGame(tile,push=true){if(push&&detail.dataset.currentId)navStack.push(detail.dataset.currentId);list.hidden=true;detail.hidden=false;detail.dataset.currentId=tile.id;detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail creepy-game-detail"><div class="other-detail-head creepy-game-head"><span class="other-detail-icon">🎃</span><h2>Creepy Pumpkin</h2><button type="button" class="creepy-fullscreen-button" aria-label="Włącz pełny ekran" title="Pełny ekran">⛶</button></div><div id="creepyPumpkinHost"><div class="other-soon">Uruchamianie gry...</div></div></div>`;try{await ensureGameAssets();if(detail.dataset.currentId!==GAME_ID)return;window.CreepyPumpkinGame?.mount?.(detail.querySelector('#creepyPumpkinHost'));detail.querySelector('.creepy-fullscreen-button')?.addEventListener('click',()=>window.CreepyPumpkinGame?.toggleFullscreen?.())}catch(e){console.warn(e);detail.querySelector('#creepyPumpkinHost').innerHTML='<div class="other-soon">Nie udało się uruchomić gry.</div>'}}
function showTile(tile,push=true){window.CreepyPumpkinGame?.unmount?.();if(tile.builtin_game)return showGame(tile,push);if(push&&detail.dataset.currentId)navStack.push(detail.dataset.currentId);list.hidden=true;detail.hidden=false;detail.dataset.currentId=tile.id;const parts=[];if((tile.body||'').trim())parts.push(`<div class="other-detail-body">${esc(tile.body)}</div>`);if(tile.image_path)parts.push(`<img class="other-detail-image" src="${imageUrl(tile.image_path)}" alt="${esc(tile.title)}">`);if((tile.children||[]).length)parts.push(`<div class="other-submenu">${tile.children.map(c=>tileMarkup(c,true)).join('')}</div>`);const inner=parts.length?parts.join(''):'<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>';detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail"><div class="other-detail-head"><span class="other-detail-icon">${esc(tile.icon||'📄')}</span><h2>${esc(tile.title)}</h2></div>${inner}</div>`}
function goBack(){window.CreepyPumpkinGame?.unmount?.();if(navStack.length){const prev=findTile(navStack.pop());if(prev)return showTile(prev,false)}renderList()}
async function loadOther(){window.CreepyPumpkinGame?.unmount?.();list.innerHTML='<div class="other-soon">Ładowanie...</div>';checkAndroidUpdate(true);try{const{data:d,error}=await sb.rpc('get_other_tiles');if(error)throw error;data=d||[];renderList()}catch(e){console.warn(e);data=[];renderList()}}
view.addEventListener('click',e=>{const u=e.target.closest('[data-app-update]');if(u){handleUpdateClick(u);return}const b=e.target.closest('[data-other-id]');if(b){const t=findTile(b.dataset.otherId);if(t)showTile(t,true);return}if(e.target.closest('.other-back'))goBack()});
otherNav?.addEventListener('click',loadOther);
document.querySelectorAll('.nav-item:not([data-tab="other"])').forEach(b=>b.addEventListener('click',()=>window.CreepyPumpkinGame?.unmount?.()));
captureApkContext();updateNavDot();if(isAndroidApk())checkAndroidUpdate();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isAndroidApk())checkAndroidUpdate()});
if(location.hash==='#other')setTimeout(()=>otherNav?.click(),0);
})();