(()=>{
const view=document.querySelector('[data-view="other"]');if(!view)return;
const list=view.querySelector('#otherTiles'),detail=view.querySelector('#otherDetail');let data=[],navStack=[],gameAssetsPromise=null;
const GAME_ID='__creepy_pumpkin__',NOTIF_ID='__notifications__';
const gameTile={id:GAME_ID,title:'Creepy Pumpkin',icon:'🎃',body:'',image_path:null,children:[],builtin_game:true};
const notificationTile={id:NOTIF_ID,title:'Powiadomienia',icon:'🔔',body:'',image_path:null,children:[],builtin_notifications:true};
const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const imageUrl=path=>`${SUPABASE_URL}/storage/v1/object/public/other-images/${String(path||'').split('/').map(encodeURIComponent).join('/')}`;
const ua=navigator.userAgent||'',isAndroid=/Android/i.test(ua),isIOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function waitForSW(ms=8000){const timeout=new Promise((_,rej)=>setTimeout(()=>{const e=new Error('Service worker timeout');e.code='SW_TIMEOUT';rej(e)},ms));return Promise.race([navigator.serviceWorker.ready,timeout])}
function hasOwnContent(t){return !!((t.body||'').trim()||t.image_path||t.builtin_game||t.builtin_notifications)}
function tileMarkup(t,sub=false){const hasChildren=!!(t.children||[]).length,hasContent=hasOwnContent(t)||hasChildren;return `<button type="button" class="${sub?'other-subtile':'other-tile'}" data-other-id="${t.id}"><span class="other-tile-icon">${esc(t.icon||'📄')}</span><span><strong>${esc(t.title)}</strong><small>${hasContent?'Otwórz':'JUŻ WKRÓTCE.. 🔧'}</small></span><span class="other-chevron">›</span></button>`}
function rootTiles(){return [...(data||[]),notificationTile,gameTile]}
function ensureGameAssets(){if(window.CreepyPumpkinGame)return Promise.resolve();if(gameAssetsPromise)return gameAssetsPromise;gameAssetsPromise=new Promise((resolve,reject)=>{if(!document.querySelector('link[data-creepy-pumpkin]')){const l=document.createElement('link');l.rel='stylesheet';l.href='creepy-pumpkin.css?v=2';l.dataset.creepyPumpkin='1';document.head.appendChild(l)}const s=document.createElement('script');s.src='creepy-pumpkin.js?v=3';s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});return gameAssetsPromise}
function renderList(){window.CreepyPumpkinGame?.unmount?.();navStack=[];detail.dataset.currentId='';detail.hidden=true;list.hidden=false;list.innerHTML=rootTiles().map(t=>tileMarkup(t)).join('')||'<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>'}
function findTile(id){if(id===GAME_ID)return gameTile;if(id===NOTIF_ID)return notificationTile;for(const r of data){if(r.id===id)return r;const c=(r.children||[]).find(x=>x.id===id);if(c)return c}return null}
function notificationRepairHtml(){
  if(isAndroid)return `<strong>Jak sprawdzić ustawienia w Androidzie</strong><ol><li>Przytrzymaj ikonę <b>Halloween 3.0</b> i wybierz <b>Informacje o aplikacji</b> lub symbol ⓘ.</li><li>Wejdź w <b>Powiadomienia</b> i upewnij się, że są włączone.</li><li>Jeśli nadal nic nie przychodzi, sprawdź powiadomienia dla przeglądarki, z której aplikacja została zainstalowana.</li><li>Po zmianie ustawień wróć do aplikacji i wyślij test ponownie.</li></ol><small>Android nie udostępnia PWA pewnego odczytu wszystkich systemowych przełączników powiadomień, dlatego test jest najbardziej wiarygodnym sprawdzeniem.</small>`;
  if(isIOS)return `<strong>Jak sprawdzić ustawienia w iPhonie lub iPadzie</strong><ol><li>Otwórz <b>Ustawienia</b>.</li><li>Wejdź w <b>Powiadomienia</b> i wybierz <b>Halloween 3.0</b>.</li><li>Włącz <b>Zezwalaj na powiadomienia</b>.</li><li>Wróć do aplikacji i wyślij test ponownie.</li></ol>`;
  return `<strong>Jak sprawdzić ustawienia</strong><ol><li>Otwórz ustawienia powiadomień dla tej aplikacji lub witryny.</li><li>Włącz powiadomienia.</li><li>Wróć do aplikacji i wyślij test ponownie.</li></ol>`;
}
async function getNotificationState(){
  const result={supported:'Notification'in window&&'serviceWorker'in navigator&&'PushManager'in window,permission:'unsupported',subscription:false,reg:null,error:null};
  if(!result.supported)return result;
  result.permission=Notification.permission;
  try{result.reg=await waitForSW();result.subscription=!!(await result.reg.pushManager.getSubscription())}catch(e){console.warn('Notification diagnostics failed',e);result.error=e?.code==='SW_TIMEOUT'?'sw-timeout':'check-failed'}
  return result;
}
async function showNotifications(tile,push=true){
  window.CreepyPumpkinGame?.unmount?.();if(push&&detail.dataset.currentId)navStack.push(detail.dataset.currentId);list.hidden=true;detail.hidden=false;detail.dataset.currentId=tile.id;
  detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail"><div class="other-detail-head"><span class="other-detail-icon">🔔</span><h2>Powiadomienia</h2></div><div class="other-detail-body" data-notification-status>Sprawdzanie...</div></div>`;
  const state=await getNotificationState();if(detail.dataset.currentId!==NOTIF_ID)return;
  let status='';
  if(!state.supported)status='Ta przeglądarka lub system nie udostępnia wymaganych funkcji powiadomień.';
  else if(state.error==='sw-timeout')status='Moduł powiadomień nie uruchomił się na czas. To właśnie powodowało pozostawanie ekranu na „Sprawdzanie...”. Zamknij aplikację, uruchom ją ponownie i sprawdź jeszcze raz.';
  else if(state.error)status='Nie udało się odczytać stanu modułu powiadomień. Spróbuj ponownie.';
  else if(state.permission==='denied')status='Zgoda na powiadomienia dla witryny jest zablokowana.';
  else if(state.permission==='default')status='Aplikacja nie ma jeszcze przyznanej zgody na powiadomienia.';
  else if(!state.subscription)status='Zgoda WWW jest włączona, ale nie ma aktywnej subskrypcji push. Wróć do Aktualności i dokończ włączanie powiadomień.';
  else status='Zgoda WWW i subskrypcja push są aktywne. Android może jednak niezależnie blokować powiadomienia na poziomie aplikacji lub przeglądarki.';
  const controls=[];
  if(state.error)controls.push('<button type="button" class="other-back" data-notification-recheck>Sprawdź ponownie</button>');
  if(!state.error&&state.permission==='granted'&&state.reg)controls.push('<button type="button" class="other-back" data-notification-test>🔔 Wyślij test</button>');
  if(!state.error&&(state.permission==='default'||(state.permission==='granted'&&!state.subscription)))controls.push('<button type="button" class="other-back" data-notification-news>Przejdź do Aktualności</button>');
  controls.push('<button type="button" class="other-back" data-notification-repair>Napraw / instrukcja</button>');
  detail.querySelector('[data-notification-status]').innerHTML=`<p>${esc(status)}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">${controls.join('')}</div><div data-notification-result style="margin-top:14px"></div><div data-notification-help hidden style="margin-top:14px">${notificationRepairHtml()}</div>`;
}
async function showGame(tile,push=true){if(push&&detail.dataset.currentId)navStack.push(detail.dataset.currentId);list.hidden=true;detail.hidden=false;detail.dataset.currentId=tile.id;detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail creepy-game-detail"><div class="other-detail-head creepy-game-head"><span class="other-detail-icon">🎃</span><h2>Creepy Pumpkin</h2><button type="button" class="creepy-fullscreen-button" aria-label="Włącz pełny ekran">⛶</button></div><div id="creepyPumpkinHost"><div class="other-soon">Uruchamianie gry...</div></div></div>`;try{await ensureGameAssets();if(detail.dataset.currentId!==GAME_ID)return;window.CreepyPumpkinGame?.mount?.(detail.querySelector('#creepyPumpkinHost'));detail.querySelector('.creepy-fullscreen-button')?.addEventListener('click',()=>window.CreepyPumpkinGame?.toggleFullscreen?.())}catch(e){console.warn(e)}}
function showTile(tile,push=true){window.CreepyPumpkinGame?.unmount?.();if(tile.builtin_notifications)return showNotifications(tile,push);if(tile.builtin_game)return showGame(tile,push);if(push&&detail.dataset.currentId)navStack.push(detail.dataset.currentId);list.hidden=true;detail.hidden=false;detail.dataset.currentId=tile.id;const parts=[];if((tile.body||'').trim())parts.push(`<div class="other-detail-body">${esc(tile.body)}</div>`);if(tile.image_path)parts.push(`<img class="other-detail-image" src="${imageUrl(tile.image_path)}" alt="${esc(tile.title)}">`);if((tile.children||[]).length)parts.push(`<div class="other-submenu">${tile.children.map(c=>tileMarkup(c,true)).join('')}</div>`);detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail"><div class="other-detail-head"><span class="other-detail-icon">${esc(tile.icon||'📄')}</span><h2>${esc(tile.title)}</h2></div>${parts.length?parts.join(''):'<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>'}</div>`}
function goBack(){window.CreepyPumpkinGame?.unmount?.();if(navStack.length){const prev=findTile(navStack.pop());if(prev)return showTile(prev,false)}renderList()}
async function loadOther(){window.CreepyPumpkinGame?.unmount?.();list.innerHTML='<div class="other-soon">Ładowanie...</div>';try{const{data:d,error}=await sb.rpc('get_other_tiles');if(error)throw error;data=d||[];renderList()}catch(e){console.warn(e);data=[];renderList()}}
view.addEventListener('click',async e=>{
  const b=e.target.closest('[data-other-id]');if(b){const t=findTile(b.dataset.otherId);if(t)showTile(t,true);return}
  if(e.target.closest('.other-back')&&!e.target.closest('[data-notification-test],[data-notification-news],[data-notification-repair],[data-notification-recheck]')){goBack();return}
  if(e.target.closest('[data-notification-news]')){document.querySelector('.nav-item[data-tab="news"]')?.click();return}
  if(e.target.closest('[data-notification-recheck]')){showNotifications(notificationTile,false);return}
  if(e.target.closest('[data-notification-repair]')){const h=detail.querySelector('[data-notification-help]');if(h)h.hidden=!h.hidden;return}
  if(e.target.closest('[data-notification-test]')){
    const out=detail.querySelector('[data-notification-result]');try{const reg=await waitForSW();await reg.showNotification('Halloween 3.0 🎃',{body:'To jest test powiadomień. Jeśli go widzisz, system pozwala je wyświetlać.',icon:'./icons/notification-news.svg?v=1',badge:'./icons/notification-badge.svg?v=1',tag:'h3-manual-notification-test',renotify:false});if(out)out.innerHTML='<strong>Test wysłany.</strong><br>Jeśli powiadomienie nie pojawiło się również w centrum powiadomień, wybierz „Napraw / instrukcja” i sprawdź ustawienia systemowe.'}catch(err){console.warn(err);if(out)out.textContent=err?.code==='SW_TIMEOUT'?'Moduł powiadomień nie uruchomił się na czas. Zamknij aplikację, uruchom ją ponownie i spróbuj ponownie.':'Nie udało się wysłać testu. Sprawdź uprawnienia i spróbuj ponownie.'}return}
  if(e.target.closest('.other-back'))goBack();
});
document.querySelector('.nav-item[data-tab="other"]')?.addEventListener('click',loadOther);document.querySelectorAll('.nav-item:not([data-tab="other"])').forEach(b=>b.addEventListener('click',()=>window.CreepyPumpkinGame?.unmount?.()));if(location.hash==='#other')setTimeout(()=>document.querySelector('.nav-item[data-tab="other"]')?.click(),0);
})();