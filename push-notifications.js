(()=>{
const VAPID_PUBLIC='BJg6Yy6HH6CduNZwTLbtqrqfvjr73AnU-BdLB2kPlRDIS85_W0h_xqiP84lKEqfXC7AM5Vq5DBxmM2d-MvUt3_w';
const isAndroid=/Android/i.test(navigator.userAgent);
let nativeReturn=null;
try{
  const u=new URL(location.href);
  if(u.searchParams.get('h3apk')==='1')localStorage.setItem('h3_android_apk','1');
  nativeReturn=u.searchParams.get('h3nativepush');
  if(nativeReturn==='granted'||nativeReturn==='denied'){
    localStorage.setItem('h3_native_notifications',nativeReturn);
    localStorage.removeItem('h3_native_push_pending');
  }
  if(u.searchParams.has('h3apk')||u.searchParams.has('h3nativepush')||u.searchParams.has('h3nativepush_nonce')){
    u.searchParams.delete('h3apk');
    u.searchParams.delete('h3nativepush');
    u.searchParams.delete('h3nativepush_nonce');
    history.replaceState(history.state,'',u.pathname+(u.search?u.search:'')+u.hash);
  }
}catch{}
function b64ToU8(base64){const pad='='.repeat((4-base64.length%4)%4),s=(base64+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(s);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
function canPush(){return 'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function isAndroidApk(){try{return isAndroid&&localStorage.getItem('h3_android_apk')==='1'}catch{return false}}
function nativeGranted(){try{return localStorage.getItem('h3_native_notifications')==='granted'}catch{return false}}
async function saveSubscription(sub){const json=sub.toJSON();const{error}=await sb.rpc('save_push_subscription',{p_endpoint:json.endpoint,p_p256dh:json.keys?.p256dh||'',p_auth:json.keys?.auth||'',p_user_agent:navigator.userAgent});if(error)throw error}
function openNativePermission(btn,card){
  try{localStorage.setItem('h3_native_push_pending','1')}catch{}
  card.querySelector('small').textContent='Potwierdź systemowe zezwolenie Androida. Po wyborze wrócisz automatycznie do aplikacji.';
  card.hidden=false;
  btn.disabled=true;
  location.href='halloween3://notifications';
}
async function subscribe(btn,card){
  btn.disabled=true;
  try{
    if(Notification.permission==='denied'){
      card.querySelector('small').textContent='Powiadomienia tej strony są zablokowane. Włącz je w ustawieniach witryny.';
      card.hidden=false;
      return;
    }
    const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
    if(permission!=='granted'){
      card.querySelector('small').textContent='Bez zgody nie będziemy wysyłać powiadomień.';
      card.hidden=false;
      return;
    }
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToU8(VAPID_PUBLIC)});
    await saveSubscription(sub);
    try{localStorage.setItem('h3_push_enabled','1')}catch{}
    if(isAndroidApk()&&!nativeGranted()){
      openNativePermission(btn,card);
      return;
    }
    card.hidden=true;
  }catch(e){
    console.warn('Push subscribe failed',e);
    card.querySelector('small').textContent='Nie udało się włączyć powiadomień. Spróbuj ponownie.';
    card.hidden=false;
  }finally{
    if(!(isAndroidApk()&&!nativeGranted()))btn.disabled=false;
  }
}
async function init(){
  const news=document.querySelector('[data-view="news"]');if(!news)return;
  const existing=document.getElementById('pushOptin');if(existing)return;
  const card=document.createElement('div');
  card.id='pushOptin';card.className='push-optin';card.hidden=true;
  card.innerHTML='<div class="push-optin-icon">🔔</div><div class="push-optin-copy"><strong>Włącz powiadomienia</strong><small>Dostaniesz ważne aktualności nawet gdy aplikacja jest zamknięta.</small></div><button type="button" class="push-optin-btn">Włącz</button>';
  news.querySelector('.section-heading')?.insertAdjacentElement('afterend',card);
  const btn=card.querySelector('.push-optin-btn');
  btn.addEventListener('click',()=>subscribe(btn,card));
  if(!canPush())return;
  try{
    if(isAndroidApk()&&!nativeGranted()){
      if(nativeReturn==='denied')card.querySelector('small').textContent='Android nie zezwolił aplikacji Halloween 3.0 na powiadomienia. Kliknij „Włącz”, aby spróbować ponownie.';
      else card.querySelector('small').textContent='Włącz powiadomienia strony i systemowe zezwolenie Androida.';
      btn.disabled=false;
      card.hidden=false;
      return;
    }
    if(Notification.permission==='denied'){
      card.querySelector('small').textContent='Powiadomienia tej strony są zablokowane. Włącz je w ustawieniach witryny.';
      btn.disabled=true;
      card.hidden=false;
      return;
    }
    const reg=await Promise.race([navigator.serviceWorker.ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('SW timeout')),4000))]);
    const sub=await reg.pushManager.getSubscription();
    if(sub){
      await saveSubscription(sub);
      try{localStorage.setItem('h3_push_enabled','1');localStorage.removeItem('h3_native_push_pending')}catch{}
      card.hidden=true;
      return;
    }
    try{localStorage.removeItem('h3_push_enabled')}catch{}
    card.hidden=false;
  }catch(e){
    console.warn('Push init failed',e);
    card.hidden=false;
  }
}
if(document.readyState==='complete')setTimeout(init,150);else window.addEventListener('load',()=>setTimeout(init,150),{once:true});
})();