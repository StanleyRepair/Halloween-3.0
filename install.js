(()=>{
const params=new URLSearchParams(location.search),requestedPreview=params.get('preview')||'',allowedPreviews=new Set(['ios13mini','ios14','ios16pro','iosmax','ios-ipad','ios16','ios13','ios-messenger','ios-external','android-chrome','android-other']),previewMode=allowedPreviews.has(requestedPreview)?requestedPreview:'';
const ua=navigator.userAgent||'';
const detectedStandalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const detectedIOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const detectedIPad=/iPad/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const nonSafariIOS=/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|Brave|YaBrowser|FBAN|FBAV|FB_IAB|Messenger|Instagram|WhatsApp|Line\/|MicroMessenger|Telegram|Snapchat|TikTok/i;
const detectedSafariIOS=detectedIOS&&/Safari\//i.test(ua)&&!nonSafariIOS.test(ua);
const detectedChrome=/Chrome\/\d+/i.test(ua)&&!/EdgA|EdgiOS|OPR|SamsungBrowser|FBAN|FBAV|FB_IAB|Messenger|Instagram/i.test(ua);
const detectedAndroid=/Android/i.test(ua);
const detectedInAppBrowser=/FBAN|FBAV|FB_IAB|Messenger|Instagram|WhatsApp|Line\/|MicroMessenger|Telegram|Snapchat|TikTok/i.test(ua);
const previewSafariIOS=new Set(['ios13mini','ios14','ios16pro','iosmax','ios-ipad','ios16','ios13']);
const isIOS=previewMode?(previewMode.startsWith('ios')):detectedIOS;
const isIPad=previewMode?previewMode==='ios-ipad':detectedIPad;
const isSafariIOS=previewMode?previewSafariIOS.has(previewMode):detectedSafariIOS;
const isAndroid=previewMode?previewMode.startsWith('android'):detectedAndroid;
const isChrome=previewMode?previewMode==='android-chrome':detectedChrome;
const isInAppBrowser=previewMode?previewMode==='ios-messenger':detectedInAppBrowser;
const standalone=previewMode?false:detectedStandalone;
const installCard=document.getElementById('chromeInstallCard'),iosCard=document.getElementById('iosInstallCard'),browserCard=document.getElementById('openChromeCard'),installedCard=document.getElementById('installedCard'),installBtn=document.getElementById('installNowButton'),chromeBtn=document.getElementById('openChromeButton'),fallbackBtn=document.getElementById('showInstallInstead'),status=document.getElementById('installStatus'),installedTitle=document.getElementById('installedTitle'),installedText=document.getElementById('installedText'),installedStatus=document.getElementById('installedStatus'),platformSwitch=document.getElementById('installPlatformSwitch'),iosKicker=document.getElementById('iosInstallKicker'),iosLead=document.getElementById('iosInstallLead'),iosSteps=document.getElementById('iosInstallSteps'),iosAlt=document.getElementById('iosInstallAlt');
let deferredPrompt=null,waiters=[],forcedPlatform=null,safariAutoTimer=null,safariLaunchTimer=null;
if(previewMode){document.body.dataset.installPreview=previewMode;if(platformSwitch)platformSwitch.hidden=true}
try{if(!previewMode){const saved=sessionStorage.getItem('h3_install_platform_override');if(saved==='ios'||saved==='android')forcedPlatform=saved}}catch{}
function track(name,data){if(!previewMode)window.H3Analytics?.track?.(name,data)}
function detectedPlatform(){return isIOS?'ios':isAndroid?'android':'other'}
function activePlatform(){return forcedPlatform||detectedPlatform()}
function iosScreenSignature(){
  const sw=Math.round(Math.min(screen.width||window.innerWidth||0,screen.height||window.innerHeight||0));
  const sh=Math.round(Math.max(screen.width||window.innerWidth||0,screen.height||window.innerHeight||0));
  const dpr=Math.round((window.devicePixelRatio||1)*100)/100;
  return {sw,sh,dpr,key:`${sw}x${sh}@${dpr}`};
}
function detectIosInstructionVariant(){
  if(previewMode==='ios13mini'||previewMode==='ios13')return 'mini';
  if(previewMode==='ios14')return 'standard';
  if(previewMode==='ios16pro'||previewMode==='ios16')return 'pro';
  if(previewMode==='iosmax')return 'max';
  if(previewMode==='ios-ipad')return 'ipad';
  if(isIPad)return 'ipad';
  const {sw,sh}=iosScreenSignature();
  if(sw===375&&sh===812)return 'mini';
  if(sw===390&&sh===844)return 'standard';
  if((sw===393&&sh===852)||(sw===402&&sh===874))return 'pro';
  if((sw===428&&sh===926)||(sw===430&&sh===932)||(sw===440&&sh===956))return 'max';
  if(sw<=375&&sh<=812)return 'mini';
  return 'standard';
}
const pageMenuIcon='<svg class="ios-page-menu-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5 3h8v2a2 2 0 1 0 0 4v2H5V9H3a2 2 0 0 1 0-4h2V3z"/><path d="M5 16h14M5 21h10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
function pageMenuLabel(){return `<b class="ios-page-menu-label">${pageMenuIcon}<span>Menu strony</span></b>`}
function configureIosInstructions(){
  if(!iosSteps)return;
  const variant=detectIosInstructionVariant(),menuLabel=pageMenuLabel();
  if(iosKicker)iosKicker.textContent=isIPad?'IPAD • SAFARI':'IPHONE • SAFARI';
  if(variant==='mini'){
    if(iosLead)iosLead.textContent='W Safari zrób 5 krótkich kroków.';
    iosSteps.innerHTML=`<div><strong>1</strong><span>Stuknij ${menuLabel} po lewej stronie paska adresu</span></div><div><strong>2</strong><span>Wybierz <b>Udostępnij</b></span></div><div><strong>3</strong><span>Wybierz <b>Do ekranu głównego</b></span></div><div><strong>4</strong><span>Zostaw włączone <b>Otwórz jako aplikację www</b></span></div><div><strong>5</strong><span>Stuknij <b>Dodaj</b></span></div>`;
    if(iosAlt){iosAlt.hidden=false;iosAlt.innerHTML=`Jeśli zamiast ${menuLabel} widzisz bezpośrednio przycisk <b>Udostępnij</b>, możesz użyć właśnie jego.`}
    return;
  }
  if(variant==='ipad'){
    if(iosLead)iosLead.textContent='W Safari zrób 4 krótkie kroki.';
    iosSteps.innerHTML='<div><strong>1</strong><span>Stuknij <b>Udostępnij</b></span></div><div><strong>2</strong><span>Wybierz <b>Do ekranu głównego</b></span></div><div><strong>3</strong><span>Jeśli widzisz <b>Otwórz jako aplikację www</b>, zostaw tę opcję włączoną</span></div><div><strong>4</strong><span>Stuknij <b>Dodaj</b></span></div>';
    if(iosAlt){iosAlt.hidden=false;iosAlt.innerHTML='Jeśli nie widzisz <b>Do ekranu głównego</b>, przewiń listę czynności niżej.'}
    return;
  }
  if(iosLead)iosLead.textContent='W Safari zrób 4 krótkie kroki.';
  iosSteps.innerHTML=`<div><strong>1</strong><span>Stuknij <b>Udostępnij</b> na dolnym pasku</span></div><div><strong>2</strong><span>Wybierz <b>Do ekranu głównego</b></span></div><div><strong>3</strong><span>Zostaw włączone <b>Otwórz jako aplikację www</b></span></div><div><strong>4</strong><span>Stuknij <b>Dodaj</b></span></div>`;
  if(iosAlt){iosAlt.hidden=false;iosAlt.innerHTML=`Jeśli nie widzisz przycisku <b>Udostępnij</b> na pasku, stuknij ${menuLabel} po lewej stronie paska adresu i wybierz <b>Udostępnij</b>.`}
}
function updateIosInAppNotice(){
  const shouldShow=activePlatform()==='ios'&&isInAppBrowser&&!standalone&&!isSafariIOS;
  let notice=document.getElementById('iosInAppNotice');
  if(!shouldShow){if(notice)notice.hidden=true;document.body.classList.remove('ios-inapp-browser');return}
  if(!notice){notice=document.createElement('div');notice.id='iosInAppNotice';notice.className='ios-inapp-notice';notice.setAttribute('role','note');document.body.appendChild(notice)}
  notice.innerHTML='<div class="ios-inapp-notice-copy"><strong>Najpierw otwórz w przeglądarce</strong><span>Stuknij <b>•••</b> u góry i wybierz <b>Otwórz w przeglądarce</b>.</span></div><span class="ios-inapp-pointer" aria-hidden="true">↗</span>';
  notice.hidden=false;document.body.classList.add('ios-inapp-browser');
}
function safariConfirmNotice(show=true){
  let notice=document.getElementById('iosSafariConfirmNotice');
  const allowed=show&&isIOS&&!isSafariIOS&&!isInAppBrowser&&!standalone;
  if(!allowed){if(notice)notice.hidden=true;document.body.classList.remove('ios-safari-handoff');return}
  if(!notice){notice=document.createElement('div');notice.id='iosSafariConfirmNotice';notice.className='ios-safari-confirm-notice';notice.setAttribute('role','status');notice.innerHTML='<strong>Zezwól, aby otworzyć w Safari</strong>';document.body.appendChild(notice)}
  notice.hidden=false;document.body.classList.add('ios-safari-handoff');
}
function setBrowserButtonVisible(visible){if(!chromeBtn)return;chromeBtn.hidden=!visible;chromeBtn.style.display=visible?'':'none'}
function configureBrowserCard(){
  if(!browserCard||!chromeBtn)return;
  const mark=browserCard.querySelector('.browser-mark'),kicker=browserCard.querySelector('.install-kicker'),heading=browserCard.querySelector('h1'),copy=browserCard.querySelector('p'),note=browserCard.querySelector('.install-status');
  setBrowserButtonVisible(true);
  if(activePlatform()==='ios'&&isIOS&&!isSafariIOS&&isInAppBrowser){
    if(mark)mark.textContent='🌐';
    if(kicker)kicker.textContent='KROK 1';
    if(heading)heading.textContent='Najpierw otwórz w przeglądarce';
    if(copy)copy.innerHTML='Stuknij <b>•••</b> w prawym górnym rogu i wybierz <b>Otwórz w przeglądarce</b>.';
    setBrowserButtonVisible(false);
    if(note)note.textContent='Po otwarciu strony poza Messengerem przejdziesz dalej do Safari.';
    return;
  }
  if(activePlatform()==='ios'&&isIOS&&!isSafariIOS){
    if(mark)mark.textContent='🧭';
    if(kicker)kicker.textContent='KROK 2 • SAFARI';
    if(heading)heading.textContent='Przejdź do Safari';
    if(copy)copy.textContent='Za chwilę iPhone poprosi o zgodę na otwarcie Safari.';
    chromeBtn.textContent='OTWÓRZ W SAFARI';
    if(note)note.textContent='W systemowym oknie wybierz „Zezwól”.';
    return;
  }
  if(mark)mark.textContent='🌐';
  if(kicker)kicker.textContent='OTWÓRZ W CHROME';
  if(heading)heading.textContent='Ta strona służy do instalacji aplikacji';
  if(copy)copy.textContent='Otwórz ten link w Google Chrome, aby zainstalować Halloween 3.0.';
  chromeBtn.textContent='OTWÓRZ W CHROME';
  if(note)note.textContent='Po otwarciu w Chrome zobaczysz ekran instalacji.';
}
function markPlatform(){platformSwitch?.querySelectorAll('[data-install-platform]').forEach(b=>{const active=b.dataset.installPlatform===activePlatform();b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false')});if(activePlatform()==='ios')configureIosInstructions();configureBrowserCard();updateIosInAppNotice();if(!isIOS||isSafariIOS||isInAppBrowser)safariConfirmNotice(false)}
function show(el){[installCard,iosCard,browserCard,installedCard].forEach(x=>{if(x)x.hidden=x!==el});markPlatform()}
function setInstalledMarker(){if(previewMode)return;try{localStorage.setItem('h3_install_confirmed','1')}catch{}}
function hasInstalledMarker(){if(previewMode)return false;try{return localStorage.getItem('h3_install_confirmed')==='1'}catch{return false}}
function showInstalled(certain=true){installedTitle.textContent=certain?'Aplikacja jest zainstalowana':'Aplikacja była instalowana na tym urządzeniu';installedText.textContent='Uruchom Halloween 3.0 z jej ikony na ekranie głównym.';installedStatus.textContent=certain?'Instalacja została wykryta.':'Jeśli aplikacja została później usunięta, wybierz poniżej ponowną instalację.';safariConfirmNotice(false);show(installedCard)}
function safariTarget(){if(location.protocol!=='https:')return null;return `x-safari-https://${location.host}${location.pathname}${location.search}${location.hash}`}
function openSafari(auto=false){
  const target=safariTarget();if(previewMode){safariConfirmNotice(true);return true}if(!isIOS||isSafariIOS||isInAppBrowser||!target)return false;
  track(auto?'install_open_safari_auto':'install_open_safari_click',{source:'ios_browser'});
  safariConfirmNotice(true);clearTimeout(safariLaunchTimer);
  safariLaunchTimer=setTimeout(()=>{try{location.href=target}catch(e){console.warn('Safari open failed',e)}},auto?950:420);
  return true
}
function attemptSafariAuto(){if(!isIOS||isSafariIOS||isInAppBrowser||standalone)return;if(previewMode){safariConfirmNotice(true);return}let done=false;try{done=sessionStorage.getItem('h3_safari_auto_attempted')==='1';if(!done)sessionStorage.setItem('h3_safari_auto_attempted','1')}catch{}if(done){safariConfirmNotice(true);return}clearTimeout(safariAutoTimer);safariAutoTimer=setTimeout(()=>openSafari(true),180)}
function showInstallChoice(){const platform=activePlatform();if(platform==='ios'){if(isIOS&&!isSafariIOS&&!standalone){show(browserCard);if(!isInAppBrowser)attemptSafariAuto()}else{show(iosCard);safariConfirmNotice(false);track('install_landing_ios_instructions',{source:'install_page',manual:forcedPlatform==='ios',variant:detectIosInstructionVariant()})}return}if(platform==='android'){safariConfirmNotice(false);if(isChrome)show(installCard);else show(browserCard);return}if(isChrome){safariConfirmNotice(false);show(installCard);return}safariConfirmNotice(false);show(browserCard)}
function setPlatform(platform){if(previewMode||platform!=='ios'&&platform!=='android')return;forcedPlatform=platform;try{sessionStorage.setItem('h3_install_platform_override',platform)}catch{}showInstallChoice();track('install_platform_override',{platform})}
function resolvePrompt(){waiters.splice(0).forEach(r=>r())}
async function isInstalled(){if(previewMode)return false;if(standalone)return true;try{if(typeof navigator.getInstalledRelatedApps==='function'){const apps=await navigator.getInstalledRelatedApps();if(Array.isArray(apps)&&apps.some(a=>a.platform==='webapp'))return true}}catch(e){console.warn('Installed app detection failed',e)}return false}
window.addEventListener('beforeinstallprompt',e=>{if(previewMode)return;e.preventDefault();deferredPrompt=e;resolvePrompt();if(activePlatform()==='android'&&isChrome&&!standalone)show(installCard)});
window.addEventListener('appinstalled',()=>{if(previewMode)return;deferredPrompt=null;setInstalledMarker();setTimeout(()=>showInstalled(true),500);track('install_landing_installed',{source:'install_page'})});
async function waitForPrompt(ms=3200){if(deferredPrompt)return true;await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};waiters.push(finish);setTimeout(finish,ms)});return !!deferredPrompt}
async function install(){if(previewMode){status.textContent='Tryb podglądu administratora. Instalator nie jest uruchamiany.';return}installBtn.disabled=true;installBtn.textContent='URUCHAMIANIE INSTALATORA…';status.textContent='Przygotowuję instalację…';track('install_landing_click',{browser:'chrome'});try{if(await isInstalled()){setInstalledMarker();showInstalled(true);return}const ready=await waitForPrompt();if(!ready){if(await isInstalled()){setInstalledMarker();showInstalled(true);return}installBtn.textContent='SPRAWDŹ PONOWNIE';status.textContent='Chrome nie udostępnił automatycznego instalatora. Otwórz menu ⋮ i wybierz „Zainstaluj aplikację”.';return}const prompt=deferredPrompt;deferredPrompt=null;await prompt.prompt();const result=await prompt.userChoice;if(result?.outcome==='accepted'){status.textContent='Instalowanie aplikacji…';installBtn.textContent='INSTALOWANIE…';setInstalledMarker();setTimeout(()=>showInstalled(true),900)}else{status.textContent='Instalacja została anulowana.';installBtn.textContent='ZAINSTALUJ APLIKACJĘ'}}catch(e){console.warn(e);status.textContent='Nie udało się uruchomić instalatora Chrome. Użyj menu ⋮ i opcji „Zainstaluj aplikację”.';installBtn.textContent='SPRAWDŹ PONOWNIE'}finally{installBtn.disabled=false}}
function openPreferredBrowser(){if(previewMode)return;if(isIOS&&!isSafariIOS&&!isInAppBrowser){openSafari(false);return}track('install_open_chrome_click',{source:/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)?'messenger':'other_browser'});if(isAndroid){const target=location.host+location.pathname+location.search;location.href=`intent://${target}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(location.href)};end`;return}navigator.clipboard?.writeText(location.href).catch(()=>{});chromeBtn.textContent='LINK SKOPIOWANY';setTimeout(()=>{configureBrowserCard()},1800)}
installBtn?.addEventListener('click',install);chromeBtn?.addEventListener('click',openPreferredBrowser);fallbackBtn?.addEventListener('click',()=>{if(previewMode)return;try{localStorage.removeItem('h3_install_confirmed')}catch{}showInstallChoice();if(installBtn){installBtn.textContent='ZAINSTALUJ APLIKACJĘ';status.textContent='Kliknij instalację. Jeśli Chrome nie pokaże okna, użyj menu ⋮ i opcji „Zainstaluj aplikację”.'}});
platformSwitch?.addEventListener('click',e=>{const b=e.target.closest('[data-install-platform]');if(b)setPlatform(b.dataset.installPlatform)});
window.addEventListener('resize',()=>{if(isSafariIOS&&activePlatform()==='ios')configureIosInstructions()});
window.addEventListener('orientationchange',()=>{if(isSafariIOS&&activePlatform()==='ios')setTimeout(configureIosInstructions,120)});
(async()=>{configureIosInstructions();markPlatform();if(forcedPlatform){showInstallChoice();return}if(await isInstalled()){setInstalledMarker();showInstalled(true);return}if(isIOS){if(isSafariIOS){show(iosCard);track('install_landing_ios_instructions',{source:'install_page',manual:false,variant:detectIosInstructionVariant()})}else{show(browserCard);if(!isInAppBrowser)attemptSafariAuto()}return}if(isChrome){if(hasInstalledMarker())showInstalled(false);else show(installCard)}else show(browserCard)})();
})();