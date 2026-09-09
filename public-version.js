(()=>{
try{
  if(!document.querySelector('script[data-h3-update-launch]')){
    const s=document.createElement('script');
    s.src=`android-update-launch.js?v=1`;
    s.dataset.h3UpdateLaunch='1';
    document.head.appendChild(s);
  }
}catch{}
async function init(){try{const{data,error}=await sb.rpc('get_app_settings');if(error||!data?.show_public_version)return;const r=await fetch(`./service-worker.js?public-version=${Date.now()}`,{cache:'no-store'});const txt=await r.text();const m=txt.match(/CACHE_NAME\s*=\s*['"]halloween-3-v(\d+)['"]/);if(!m)return;const footer=document.querySelector('.app-footer');if(!footer)return;let el=document.getElementById('publicAppVersion');if(!el){el=document.createElement('span');el.id='publicAppVersion';el.style.cssText='display:block;margin-top:6px;opacity:.48;font:600 10px Inter,system-ui,sans-serif;letter-spacing:.08em';footer.appendChild(el)}el.textContent=`WERSJA V${m[1]}`}catch(e){console.warn(e)}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();