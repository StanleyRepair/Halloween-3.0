(()=>{
const ua=navigator.userAgent||'';
const isAndroid=/Android/i.test(ua);
const isIOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const META_URL='https://raw.githubusercontent.com/StanleyRepair/Halloween-3.0/main/downloads/android-version.json';
const androidPanel=document.getElementById('androidInstall');
const iosPanel=document.getElementById('iosInstall');
const androidDownload=document.getElementById('androidDownload');
const androidVersion=document.getElementById('androidVersion');
const iosButton=document.getElementById('iosInstallButton');
const iosInstructions=document.getElementById('iosInstructions');
const switcher=document.getElementById('platformSwitch');
const title=document.getElementById('installTitle');
const intro=document.getElementById('installIntro');
let apkMeta=null;
function showPlatform(name){
  const android=name==='android';
  androidPanel.hidden=!android;
  iosPanel.hidden=android;
  title.textContent=android?'Pobierz Halloween 3.0':'Zainstaluj Halloween 3.0';
  intro.textContent=android?'Pobierz najnowszą wersję aplikacji na Androida.':'Dodaj aplikację do ekranu początkowego iPhone’a lub iPada.';
  switcher.hidden=false;
  switcher.innerHTML=android?'Masz iPhone’a? <button type="button" data-platform="ios">Instalacja na iOS</button>':'Masz Androida? <button type="button" data-platform="android">Pobierz APK</button>';
  window.H3Analytics?.track?.('install_platform_view',{platform:name,detected:isAndroid?'android':isIOS?'ios':'other'});
}
async function loadAndroidMeta(){
  try{
    const r=await fetch(`${META_URL}?install=${Date.now()}`,{cache:'no-store'});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const m=await r.json();
    if(!m?.version||!m?.apkUrl)throw new Error('Invalid metadata');
    apkMeta=m;
    androidDownload.href=m.apkUrl;
    androidVersion.textContent=`Najnowsza wersja: ${m.version}`;
  }catch(e){
    console.warn('APK metadata failed',e);
    androidDownload.removeAttribute('href');
    androidVersion.textContent='Nie udało się sprawdzić najnowszej wersji. Odśwież stronę.';
  }
}
androidDownload?.addEventListener('click',e=>{
  if(!apkMeta?.apkUrl){e.preventDefault();loadAndroidMeta();return}
  window.H3Analytics?.track?.('install_android_apk_click',{version:apkMeta.version||null});
});
iosButton?.addEventListener('click',()=>{
  iosInstructions.hidden=false;
  iosButton.textContent='INSTRUKCJA INSTALACJI';
  window.H3Analytics?.track?.('install_ios_instructions',{standalone});
});
switcher?.addEventListener('click',e=>{const b=e.target.closest('[data-platform]');if(b)showPlatform(b.dataset.platform)});
loadAndroidMeta();
if(standalone&&isIOS){showPlatform('ios');intro.textContent='Halloween 3.0 jest już uruchomione jako aplikacja.';iosButton.textContent='APLIKACJA JEST ZAINSTALOWANA';iosButton.disabled=true}
else if(isAndroid)showPlatform('android');
else if(isIOS)showPlatform('ios');
else{showPlatform('android');intro.textContent='Wybierz system telefonu, na którym chcesz zainstalować aplikację.'}
window.H3Analytics?.track?.('install_landing_open',{platform:isAndroid?'android':isIOS?'ios':'other',standalone});
})();