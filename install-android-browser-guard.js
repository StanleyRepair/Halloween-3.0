(()=>{
const params=new URLSearchParams(location.search);
if(params.has('preview'))return;
const ua=navigator.userAgent||'';
const brands=(navigator.userAgentData?.brands||[]).map(x=>x?.brand||'').join(' ');
if(!/Android/i.test(ua))return;
const browserSignature=`${ua} ${brands}`;
const isOemBrowser=/HeyTapBrowser|OppoBrowser|OPPOBrowser|OplusBrowser|RealmeBrowser/i.test(browserSignature);
if(!isOemBrowser)return;
const installCard=document.getElementById('chromeInstallCard');
const iosCard=document.getElementById('iosInstallCard');
const browserCard=document.getElementById('openChromeCard');
const installedCard=document.getElementById('installedCard');
const chromeBtn=document.getElementById('openChromeButton');
const platformSwitch=document.getElementById('installPlatformSwitch');
function iosOverride(){try{return sessionStorage.getItem('h3_install_platform_override')==='ios'}catch{return false}}
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function chromeIntent(){
  const target=location.host+location.pathname+location.search+location.hash;
  return `intent://${target}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(location.href)};end`;
}
function forceChromeHandoff(){
  if(iosOverride()||standalone()||!browserCard)return;
  if(installedCard&&!installedCard.hidden)return;
  if(installCard&&!installCard.hidden)installCard.hidden=true;
  if(iosCard&&!iosCard.hidden)iosCard.hidden=true;
  if(browserCard.hidden)browserCard.hidden=false;
  const mark=browserCard.querySelector('.browser-mark');
  const kicker=browserCard.querySelector('.install-kicker');
  const heading=browserCard.querySelector('h1');
  const copy=browserCard.querySelector('p');
  const note=browserCard.querySelector('.install-status');
  if(mark)mark.textContent='🌐';
  if(kicker)kicker.textContent='OTWÓRZ W CHROME';
  if(heading)heading.textContent='Przejdź do Google Chrome';
  if(copy)copy.textContent='Ta przeglądarka systemowa nie obsługuje poprawnie instalatora Halloween 3.0. Otwieram stronę w Google Chrome.';
  if(chromeBtn){chromeBtn.hidden=false;chromeBtn.style.display='';chromeBtn.textContent='OTWÓRZ W CHROME'}
  if(note)note.textContent='Jeśli Chrome nie otworzy się automatycznie, użyj przycisku powyżej.';
}
function attemptAutoChrome(){
  if(iosOverride()||standalone())return;
  let attempted=false;
  try{attempted=sessionStorage.getItem('h3_android_chrome_auto_attempted')==='1';if(!attempted)sessionStorage.setItem('h3_android_chrome_auto_attempted','1')}catch{}
  if(attempted)return;
  setTimeout(()=>{if(!iosOverride()&&!standalone()){try{location.href=chromeIntent()}catch(e){console.warn('Chrome handoff failed',e)}}},650);
}
const observer=new MutationObserver(()=>setTimeout(forceChromeHandoff,0));
[installCard,browserCard].filter(Boolean).forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['hidden']}));
window.addEventListener('beforeinstallprompt',()=>setTimeout(forceChromeHandoff,0),true);
platformSwitch?.addEventListener('click',()=>setTimeout(forceChromeHandoff,0));
forceChromeHandoff();
setTimeout(forceChromeHandoff,250);
setTimeout(forceChromeHandoff,1400);
attemptAutoChrome();
window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
})();
