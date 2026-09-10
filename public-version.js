(()=>{
function loadBugReporting(){
  if(!document.querySelector('link[data-bug-report]')){const l=document.createElement('link');l.rel='stylesheet';l.href='bug-report.css?v=2';l.dataset.bugReport='1';document.head.appendChild(l)}
  if(!document.querySelector('script[data-bug-report]')){const s=document.createElement('script');s.src='bug-report.js?v=2';s.dataset.bugReport='1';document.body.appendChild(s)}
}
function loadPushRouting(){if(!document.querySelector('script[data-push-routing]')){const s=document.createElement('script');s.src='push-routing.js?v=1';s.dataset.pushRouting='1';document.body.appendChild(s)}}
function configureInstallLink(){
  const btn=document.getElementById('appInstallButton');if(!btn)return;
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  btn.hidden=standalone;
  btn.onclick=()=>{window.H3Analytics?.track?.('install_landing_open',{source:'app_button'});location.href='./install/'};
}
async function init(){try{const{data,error}=await sb.rpc('get_app_settings');if(error||!data?.show_public_version)return;const r=await fetch(`./service-worker.js?public-version=${Date.now()}`,{cache:'no-store'});const txt=await r.text();const m=txt.match(/CACHE_NAME\s*=\s*['"]halloween-3-v(\d+)['"]/);if(!m)return;const footer=document.querySelector('.app-footer');if(!footer)return;let el=document.getElementById('publicAppVersion');if(!el){el=document.createElement('span');el.id='publicAppVersion';el.style.cssText='display:block;margin-top:6px;opacity:.48;font:600 10px Inter,system-ui,sans-serif;letter-spacing:.08em';footer.appendChild(el)}el.textContent=`WERSJA V${m[1]}`}catch(e){console.warn(e)}}
loadBugReporting();loadPushRouting();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{configureInstallLink();init()},{once:true});else{configureInstallLink();init()}
window.addEventListener('pageshow',configureInstallLink);
})();