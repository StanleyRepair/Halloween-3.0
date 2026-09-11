(()=>{
const steps=document.getElementById('iosInstallSteps');
if(!steps)return;
const shareIcon='<svg class="ios-page-menu-icon ios-share-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v11M8.5 6.5 12 3l3.5 3.5M6 11.5v6.2A1.3 1.3 0 0 0 7.3 19h9.4a1.3 1.3 0 0 0 1.3-1.3v-6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let applying=false;
function applyShareIcon(){
  if(applying)return;
  applying=true;
  try{
    const firstStep=steps.querySelector(':scope > div:first-child span');
    if(!firstStep||!firstStep.textContent.includes('Udostępnij')||firstStep.querySelector('.ios-share-icon'))return;
    const word=[...firstStep.querySelectorAll('b')].find(el=>el.textContent.trim()==='Udostępnij');
    if(word)word.insertAdjacentHTML('beforebegin',shareIcon+' ');
  }finally{applying=false}
}
applyShareIcon();
new MutationObserver(applyShareIcon).observe(steps,{childList:true,subtree:true});
})();
