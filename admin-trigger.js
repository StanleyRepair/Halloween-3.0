(()=>{
const trigger=document.getElementById('hiddenAdminTrigger');if(!trigger)return;
const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let taps=0,lastTap=0,toastTimer=null;
trigger.style.touchAction='manipulation';trigger.style.cursor='default';
function showBrowserNotice(){
 let toast=document.getElementById('adminAppOnlyToast');
 if(!toast){
  toast=document.createElement('div');
  toast.id='adminAppOnlyToast';
  toast.setAttribute('role','status');
  toast.textContent='Panel admina działa tylko w aplikacji.';
  Object.assign(toast.style,{position:'fixed',left:'50%',bottom:'calc(var(--nav-h,74px) + 18px)',transform:'translate(-50%,14px)',zIndex:'1200',maxWidth:'calc(100% - 28px)',padding:'11px 16px',borderRadius:'14px',border:'1px solid #8a421b',background:'#160d09',color:'#ffe2b7',font:'700 12px/1.35 Inter,system-ui,sans-serif',textAlign:'center',boxShadow:'0 14px 32px rgba(0,0,0,.65)',opacity:'0',transition:'opacity .18s ease,transform .18s ease',pointerEvents:'none'});
  document.body.appendChild(toast);
 }
 clearTimeout(toastTimer);
 requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translate(-50%,0)'});
 toastTimer=setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translate(-50%,14px)'},2600);
}
const onTap=()=>{
 const now=Date.now();if(now-lastTap>3000)taps=0;lastTap=now;taps+=1;
 if(taps<5)return;
 taps=0;
 if(standalone){window.location.assign('./admin.html')}else{showBrowserNotice()}
};
trigger.addEventListener('pointerup',onTap,{passive:true});
})();