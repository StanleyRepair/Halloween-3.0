(()=>{
const trigger=document.getElementById('hiddenAdminTrigger');if(!trigger)return;
const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let taps=0,lastTap=0,toastTimer=null;
trigger.style.touchAction='manipulation';trigger.style.cursor='default';
function storedAdminToken(){try{return localStorage.getItem('h3_admin_device')||localStorage.getItem('h3_admin_device_backup')||null}catch{return null}}
async function isPairedBrowser(){const token=storedAdminToken();if(!token||typeof sb==='undefined')return false;try{const{data,error}=await sb.rpc('is_admin_device',{p_device_token:token});return !error&&data===true}catch{return false}}
function showBrowserNotice(){
 let toast=document.getElementById('adminAppOnlyToast');
 if(!toast){
  toast=document.createElement('div');
  toast.id='adminAppOnlyToast';
  toast.setAttribute('role','dialog');
  toast.innerHTML='<div>Panel admina działa w aplikacji lub na sparowanym urządzeniu.</div><button type="button" id="adminPairOpen">Mam kod parowania</button>';
  Object.assign(toast.style,{position:'fixed',left:'50%',bottom:'calc(var(--nav-h,74px) + 18px)',transform:'translate(-50%,14px)',zIndex:'1200',width:'min(360px,calc(100% - 28px))',padding:'12px',borderRadius:'14px',border:'1px solid #8a421b',background:'#160d09',color:'#ffe2b7',font:'700 12px/1.35 Inter,system-ui,sans-serif',textAlign:'center',boxShadow:'0 14px 32px rgba(0,0,0,.65)',opacity:'0',transition:'opacity .18s ease,transform .18s ease'});
  const btn=toast.querySelector('#adminPairOpen');Object.assign(btn.style,{marginTop:'10px',width:'100%',minHeight:'40px',borderRadius:'10px',border:'1px solid #7a461d',background:'#25150b',color:'#ffbd70',font:'800 12px Inter,system-ui,sans-serif'});btn.onclick=()=>window.location.assign('./admin.html');
  document.body.appendChild(toast);
 }
 clearTimeout(toastTimer);
 requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translate(-50%,0)'});
 toastTimer=setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translate(-50%,14px)'},5000);
}
const onTap=async()=>{
 const now=Date.now();if(now-lastTap>3000)taps=0;lastTap=now;taps+=1;
 if(taps<5)return;
 taps=0;
 if(standalone){window.location.assign('./admin.html');return}
 if(await isPairedBrowser()){window.location.assign('./admin.html');return}
 showBrowserNotice();
};
trigger.addEventListener('pointerup',onTap,{passive:true});
})();