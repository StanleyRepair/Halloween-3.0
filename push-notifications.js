(()=>{
const VAPID_PUBLIC='BJg6Yy6HH6CduNZwTLbtqrqfvjr73AnU-BdLB2kPlRDIS85_W0h_xqiP84lKEqfXC7AM5Vq5DBxmM2d-MvUt3_w';
const ua=navigator.userAgent||'';
const isAndroid=/Android/i.test(ua);
const isIOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let card,btn,copy,help,permissionWatcher,busy=false;
function b64ToU8(base64){const pad='='.repeat((4-base64.length%4)%4),s=(base64+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(s);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
function canPush(){return 'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function waitForSW(ms=10000){const timeout=new Promise((_,rej)=>setTimeout(()=>{const e=new Error('Service worker timeout');e.code='SW_TIMEOUT';rej(e)},ms));return Promise.race([navigator.serviceWorker.ready,timeout])}
async function saveSubscription(sub){const json=sub.toJSON();const{error}=await sb.rpc('save_push_subscription',{p_endpoint:json.endpoint,p_p256dh:json.keys?.p256dh||'',p_auth:json.keys?.auth||'',p_user_agent:navigator.userAgent});if(error){const e=new Error(error.message||'Subscription save failed');e.code='SAVE_FAILED';e.cause=error;throw e}}
function setCard(text,label='Włącz',disabled=false){if(!card)return;copy.textContent=text;btn.textContent=label;btn.disabled=disabled;card.hidden=false}
function closeHelp(){if(help)help.hidden=true}
function toggleHelp(){if(!help)return;if(help.hidden)showHelp();else closeHelp()}
function deniedHelp(){
  if(isAndroid)return `<strong>Jak odblokować powiadomienia</strong><ol><li>Przytrzymaj ikonę <b>Halloween 3.0</b> i wybierz <b>Informacje o aplikacji</b> lub symbol ⓘ.</li><li>Wejdź w <b>Powiadomienia</b> i upewnij się, że są włączone.</li><li>Jeśli w aplikacji wszystko jest włączone, sprawdź także powiadomienia dla <b>przeglądarki, z której instalowano aplikację</b>. W Androidzie wejdź w <b>Ustawienia → Aplikacje → [Twoja przeglądarka] → Powiadomienia</b> i włącz je.</li><li>Wróć do aplikacji i wybierz <b>Sprawdź ponownie</b>.</li></ol><small>Nazwy pozycji mogą się lekko różnić zależnie od producenta telefonu i wersji Androida.</small>`;
  if(isIOS)return `<strong>Jak odblokować powiadomienia</strong><ol><li>Otwórz <b>Ustawienia</b> w iPhonie lub iPadzie.</li><li>Wejdź w <b>Powiadomienia</b>, wybierz <b>Halloween 3.0</b> i włącz <b>Zezwalaj na powiadomienia</b>.</li><li>Wróć do aplikacji i wybierz <b>Sprawdź ponownie</b>.</li></ol><small>Nazwy pozycji mogą się lekko różnić zależnie od wersji systemu.</small>`;
  return `<strong>Jak odblokować powiadomienia</strong><ol><li>Otwórz ustawienia powiadomień dla tej aplikacji lub witryny w swoim systemie albo przeglądarce.</li><li>Włącz zezwolenie na powiadomienia.</li><li>Wróć tutaj i wybierz <b>Sprawdź ponownie</b>.</li></ol>`;
}
function showHelp(){if(!help)return;help.innerHTML=`${deniedHelp()}<button type="button" class="push-help-check" data-push-recheck>Sprawdź ponownie</button>`;help.hidden=false;help.querySelector('[data-push-recheck]')?.addEventListener('click',()=>refreshState(true))}
async function showTest(reg){try{await reg.showNotification('Halloween 3.0 🎃',{body:'Powiadomienia są włączone i działają.',icon:'./icons/notification-news.svg?v=1',badge:'./icons/notification-badge.svg?v=1',tag:'h3-push-enabled',renotify:false})}catch(e){console.warn('Test notification failed',e)}}
async function getPushPermissionState(reg){
  try{
    if(!reg?.pushManager?.permissionState)return null;
    return await reg.pushManager.permissionState({userVisibleOnly:true,applicationServerKey:b64ToU8(VAPID_PUBLIC)});
  }catch(e){
    console.warn('Push permission state check failed',e);
    return null;
  }
}
function handleSetupError(e,stage){
  console.warn('Push setup failed',{stage,name:e?.name,code:e?.code,message:e?.message,error:e});
  if(e?.code==='SW_TIMEOUT'){
    setCard('Moduł powiadomień nie uruchomił się na czas. Zamknij aplikację, uruchom ją ponownie i kliknij „Ponów”.','Ponów');
    return;
  }
  if(e?.code==='SAVE_FAILED'||stage==='save'){
    setCard('Telefon utworzył subskrypcję, ale nie udało się zapisać jej na serwerze. Kliknij „Ponów”.','Ponów');
    return;
  }
  if(e?.name==='NotAllowedError'||e?.name==='SecurityError'){
    setCard('System lub przeglądarka blokuje powiadomienia. Kliknij „Napraw”, aby sprawdzić ustawienia.','Napraw');
    return;
  }
  if(e?.name==='AbortError'){
    setCard('Usługa powiadomień Androida chwilowo nie odpowiedziała. Odczekaj kilka sekund i kliknij „Ponów”.','Ponów');
    return;
  }
  if(stage==='subscribe'){
    setCard('Nie udało się utworzyć subskrypcji push na tym telefonie. Kliknij „Ponów”.','Ponów');
    return;
  }
  setCard('Nie udało się dokończyć włączania powiadomień. Kliknij „Ponów”.','Ponów');
}
async function ensureSubscription(showConfirmation=false){
  if(busy)return false;busy=true;btn.disabled=true;let stage='service-worker';
  try{
    const reg=await waitForSW();
    stage='permission';
    const pushPermission=await getPushPermissionState(reg);
    if(pushPermission==='denied'){
      setCard('Powiadomienia są zablokowane w ustawieniach systemu lub przeglądarki. Kliknij „Napraw”.','Napraw');
      return false;
    }
    stage='subscribe';
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToU8(VAPID_PUBLIC)});
    stage='save';
    await saveSubscription(sub);
    try{localStorage.setItem('h3_push_enabled','1')}catch{}
    closeHelp();card.hidden=true;
    if(showConfirmation)await showTest(reg);
    return true;
  }catch(e){
    handleSetupError(e,stage);
    return false;
  }finally{busy=false;if(btn&&!card.hidden)btn.disabled=false}
}
async function requestAndSubscribe(){
  if(busy||!canPush())return;
  if(Notification.permission==='denied'){toggleHelp();return}
  btn.disabled=true;
  try{
    const before=Notification.permission;
    const permission=before==='granted'?'granted':await Notification.requestPermission();
    if(permission==='granted'){await ensureSubscription(before!=='granted');return}
    if(permission==='denied'){
      setCard('Powiadomienia zostały zablokowane. Kliknij „Napraw”, aby zobaczyć kroki odblokowania.','Napraw');
      showHelp();
      return;
    }
    setCard('Zgoda nie została udzielona. Kliknij „Włącz”, gdy będziesz gotowy.','Włącz');
  }catch(e){
    console.warn('Notification permission failed',e);
    setCard('Nie udało się wyświetlić pytania o powiadomienia. Spróbuj ponownie.','Ponów');
  }finally{if(btn&&!card.hidden)btn.disabled=false}
}
async function refreshState(fromUser=false){
  if(!card)return;
  if(!canPush()){
    card.hidden=true;
    return;
  }
  if(Notification.permission==='denied'){
    try{localStorage.removeItem('h3_push_enabled')}catch{}
    setCard('Powiadomienia są zablokowane w ustawieniach. Kliknij „Napraw”, a pokażę jak je odblokować.','Napraw');
    if(fromUser)showHelp();
    return;
  }
  if(Notification.permission==='default'){
    try{localStorage.removeItem('h3_push_enabled')}catch{}
    closeHelp();setCard('Dostaniesz ważne aktualności nawet gdy aplikacja jest zamknięta.','Włącz');
    return;
  }
  try{
    const reg=await waitForSW(8000);
    const pushPermission=await getPushPermissionState(reg);
    if(pushPermission==='denied'){
      try{localStorage.removeItem('h3_push_enabled')}catch{}
      setCard('Powiadomienia są zablokowane w ustawieniach systemu lub przeglądarki. Kliknij „Napraw”.','Napraw');
      if(fromUser)showHelp();
      return;
    }
    const sub=await reg.pushManager.getSubscription();
    if(sub){
      try{
        await saveSubscription(sub);
        try{localStorage.setItem('h3_push_enabled','1')}catch{}
        closeHelp();card.hidden=true;return;
      }catch(e){
        handleSetupError(e,'save');
        return;
      }
    }
    closeHelp();setCard('Zgoda jest już włączona. Dokończ aktywację powiadomień.','Włącz');
    if(fromUser)await ensureSubscription(true);
  }catch(e){
    console.warn('Push state refresh failed',e);
    if(e?.code==='SW_TIMEOUT')setCard('Moduł powiadomień jeszcze się nie uruchomił. Zamknij aplikację, otwórz ją ponownie i kliknij „Ponów”.','Ponów');
    else setCard('Nie udało się sprawdzić stanu powiadomień. Kliknij, aby spróbować ponownie.','Ponów');
  }
}
async function watchPermission(){
  if(!navigator.permissions?.query)return;
  try{permissionWatcher=await navigator.permissions.query({name:'notifications'});permissionWatcher.onchange=()=>refreshState(false)}catch{}
}
async function init(){
  const news=document.querySelector('[data-view="news"]');if(!news||document.getElementById('pushOptin'))return;
  card=document.createElement('div');card.id='pushOptin';card.className='push-optin';card.hidden=true;
  card.innerHTML='<div class="push-optin-icon">🔔</div><div class="push-optin-copy"><strong>Włącz powiadomienia</strong><small>Dostaniesz ważne aktualności nawet gdy aplikacja jest zamknięta.</small></div><button type="button" class="push-optin-btn">Włącz</button><div class="push-help" hidden></div>';
  news.querySelector('.section-heading')?.insertAdjacentElement('afterend',card);
  btn=card.querySelector('.push-optin-btn');copy=card.querySelector('.push-optin-copy small');help=card.querySelector('.push-help');
  btn.addEventListener('click',()=>{if(canPush()&&Notification.permission==='denied')toggleHelp();else if(btn.textContent==='Napraw')toggleHelp();else requestAndSubscribe()});
  await refreshState(false);watchPermission();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>refreshState(false),250)});
  window.addEventListener('focus',()=>setTimeout(()=>refreshState(false),250));
}
if(document.readyState==='complete')setTimeout(init,150);else window.addEventListener('load',()=>setTimeout(init,150),{once:true});
})();