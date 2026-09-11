(()=>{
const params=new URLSearchParams(location.search);
const preview=params.get('preview')||'';
const ua=navigator.userAgent||'';
const steps=document.getElementById('iosInstallSteps');
const lead=document.getElementById('iosInstallLead');
const alt=document.getElementById('iosInstallAlt');
if(!steps)return;

function isIphone16Pro(){
  if(preview==='ios16pro'||preview==='ios16')return true;
  if(preview)return false;
  const isIOS=/iPhone/i.test(ua);
  if(!isIOS)return false;
  const sw=Math.round(Math.min(screen.width||0,screen.height||0));
  const sh=Math.round(Math.max(screen.width||0,screen.height||0));
  const dpr=Number(window.devicePixelRatio||1);
  return sw===402&&sh===874&&dpr>=2.5;
}

let applying=false;
function apply(){
  if(applying||!isIphone16Pro())return;
  applying=true;
  try{
    if(lead)lead.textContent='W Safari zrób 5 krótkich kroków.';
    const html='<div><strong>1</strong><span>Stuknij <b>•••</b> na pasku Safari</span></div><div><strong>2</strong><span>Wybierz <b>Udostępnij</b></span></div><div><strong>3</strong><span>Wybierz <b>Do ekranu głównego</b></span></div><div><strong>4</strong><span>Zostaw włączone <b>Otwórz jako aplikację www</b></span></div><div><strong>5</strong><span>Stuknij <b>Dodaj</b></span></div>';
    if(steps.innerHTML!==html)steps.innerHTML=html;
    if(alt){alt.hidden=true;alt.innerHTML=''}
    steps.dataset.iosVariant='iphone16pro-dots';
  }finally{applying=false}
}

apply();
new MutationObserver(apply).observe(steps,{childList:true,subtree:true});
window.addEventListener('resize',apply,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(apply,120));
})();
