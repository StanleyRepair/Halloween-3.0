(()=>{
const params=new URLSearchParams(location.search);
const preview=params.get('preview')||'';
const ua=navigator.userAgent||'';
const isIOS=preview.startsWith('ios')||/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS)return;

const isIPad=/iPad/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const card=document.getElementById('iosInstallCard');
const kicker=document.getElementById('iosInstallKicker');
const lead=document.getElementById('iosInstallLead');
const steps=document.getElementById('iosInstallSteps');
const alt=document.getElementById('iosInstallAlt');
if(!card||!steps)return;

function detectIOSMajor(){
  if(preview)return 26;
  const m=ua.match(/(?:CPU(?: iPhone)? OS|iPhone OS)\s(\d+)[._]/i);
  if(m)return Number(m[1])||null;
  return null;
}

function guideMarkup(){
  const major=detectIOSMajor();
  const webAppStep=major&&major>=26
    ? 'Zostaw włączone <b>Otwórz jako aplikację www</b>'
    : 'Jeśli widzisz <b>Otwórz jako aplikację www</b>, zostaw tę opcję włączoną';
  return `<div><strong>1</strong><span>Stuknij <b>Udostępnij</b>. Jeśli przycisku nie ma na pasku, stuknij <b>•••</b> i wybierz <b>Udostępnij</b></span></div><div><strong>2</strong><span>Przewiń listę i wybierz <b>Do ekranu głównego</b></span></div><div><strong>3</strong><span>${webAppStep}</span></div><div><strong>4</strong><span>Stuknij <b>Dodaj</b></span></div>`;
}

function altMarkup(){
  if(isIPad){
    return 'Jeśli nie widzisz <b>Do ekranu głównego</b>, przewiń listę do końca i sprawdź dodatkowe czynności.';
  }
  return 'Safari może mieć różny układ paska. Jeśli <b>Udostępnij</b> jest widoczny bezpośrednio na dole, użyj go. Jeśli go nie ma, użyj <b>••• → Udostępnij</b>. Ikony <b>Menu strony</b> po lewej nie trzeba używać do instalacji. Gdy brakuje <b>Do ekranu głównego</b>, przewiń na sam dół i wybierz <b>Edytuj czynności</b>.';
}

let applying=false;
function applyReliableGuide(){
  if(applying)return;
  applying=true;
  try{
    const expected=guideMarkup();
    if(kicker){
      const label=isIPad?'IPAD • SAFARI':'IPHONE • SAFARI';
      if(kicker.textContent!==label)kicker.textContent=label;
    }
    if(lead&&lead.textContent!=='W Safari zrób 4 krótkie kroki.')lead.textContent='W Safari zrób 4 krótkie kroki.';
    if(steps.innerHTML!==expected)steps.innerHTML=expected;
    if(alt){
      const note=altMarkup();
      if(alt.innerHTML!==note)alt.innerHTML=note;
      if(alt.hidden)alt.hidden=false;
    }
    card.dataset.iosGuide='reliable-v1';
  }finally{
    applying=false;
  }
}

let scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;applyReliableGuide()});
}

applyReliableGuide();
const observer=new MutationObserver(schedule);
observer.observe(card,{subtree:true,childList:true,attributes:true});
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('orientationchange',schedule,{passive:true});
window.addEventListener('pageshow',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
})();
