(()=>{
function loadBugReporting(){
  if(!document.querySelector('link[data-bug-report]')){const l=document.createElement('link');l.rel='stylesheet';l.href='bug-report.css?v=2';l.dataset.bugReport='1';document.head.appendChild(l)}
  if(!document.querySelector('script[data-bug-report]')){const s=document.createElement('script');s.src='bug-report.js?v=2';s.datasetBugReport='1';s.dataset.bugReport='1';document.body.appendChild(s)}
}
function loadPushRouting(){if(!document.querySelector('script[data-push-routing]')){const s=document.createElement('script');s.src='push-routing.js?v=1';s.dataset.pushRouting='1';document.body.appendChild(s)}}
function loadGalleryGoogleMeta(){if(!document.querySelector('script[data-gallery-google-meta]')){const s=document.createElement('script');s.src='gallery-google-meta.js?v=1';s.dataset.galleryGoogleMeta='1';document.body.appendChild(s)}}
function loadContestPhotoViewer(){if(!document.querySelector('script[data-contest-photo-viewer]')){const s=document.createElement('script');s.src='contest-photo-viewer.js?v=1';s.dataset.contestPhotoViewer='1';document.body.appendChild(s)}}
function configureInstallLink(){
  const btn=document.getElementById('appInstallButton');if(!btn)return;
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  btn.hidden=standalone;
  btn.onclick=()=>{window.H3Analytics?.track?.('install_landing_open',{source:'app_button'});location.href='./install/'};
}
let compressionPromise=null;
function ensureContestCompression(){
  if(typeof window.H3ContestCompress==='function')return Promise.resolve();
  if(compressionPromise)return compressionPromise;
  compressionPromise=new Promise((resolve,reject)=>{
    let s=document.querySelector('script[data-contest-compression]');
    if(!s){
      s=document.createElement('script');
      s.src='contest-image-compression.js?v=2';
      s.dataset.contestCompression='1';
      document.body.appendChild(s);
    }
    const done=()=>typeof window.H3ContestCompress==='function'?resolve():reject(new Error('Nie udało się wczytać kompresji zdjęć'));
    if(typeof window.H3ContestCompress==='function')return resolve();
    s.addEventListener('load',done,{once:true});
    s.addEventListener('error',()=>reject(new Error('Nie udało się wczytać kompresji zdjęć')),{once:true});
  }).finally(()=>{compressionPromise=null});
  return compressionPromise;
}
window.compressImage=async function(file){
  await ensureContestCompression();
  return window.H3ContestCompress(file);
};
async function init(){try{const{data,error}=await sb.rpc('get_app_settings');if(error||!data?.show_public_version)return;const r=await fetch(`./service-worker.js?public-version=${Date.now()}`,{cache:'no-store'});const txt=await r.text();const m=txt.match(/CACHE_NAME\s*=\s*['"]halloween-3-v(\d+)['"]/);if(!m)return;const footer=document.querySelector('.app-footer');if(!footer)return;let el=document.getElementById('publicAppVersion');if(!el){el=document.createElement('span');el.id='publicAppVersion';el.style.cssText='display:block;margin-top:6px;opacity:.48;font:600 10px Inter,system-ui,sans-serif;letter-spacing:.08em';footer.appendChild(el)}el.textContent=`WERSJA V${m[1]}`}catch(e){console.warn(e)}}
ensureContestCompression().catch(e=>console.warn(e));
loadBugReporting();loadPushRouting();loadGalleryGoogleMeta();loadContestPhotoViewer();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{configureInstallLink();init()},{once:true});else{configureInstallLink();init()}
window.addEventListener('pageshow',configureInstallLink);
})();