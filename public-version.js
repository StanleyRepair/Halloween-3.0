(()=>{
function loadBugReporting(){
  if(!document.querySelector('link[data-bug-report]')){const l=document.createElement('link');l.rel='stylesheet';l.href='bug-report.css?v=2';l.dataset.bugReport='1';document.head.appendChild(l)}
  if(!document.querySelector('script[data-bug-report]')){const s=document.createElement('script');s.src='bug-report.js?v=2';s.dataset.bugReport='1';document.body.appendChild(s)}
}
function loadPushRouting(){if(!document.querySelector('script[data-push-routing]')){const s=document.createElement('script');s.src='push-routing.js?v=1';s.dataset.pushRouting='1';document.body.appendChild(s)}}
function loadGalleryGoogleMeta(){if(!document.querySelector('script[data-gallery-google-meta]')){const s=document.createElement('script');s.src='gallery-google-meta.js?v=1';s.dataset.galleryGoogleMeta='1';document.body.appendChild(s)}}
function configureInstallLink(){
  const btn=document.getElementById('appInstallButton');if(!btn)return;
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  btn.hidden=standalone;
  btn.onclick=()=>{window.H3Analytics?.track?.('install_landing_open',{source:'app_button'});location.href='./install/'};
}
function installContestCompressionV2(){
  window.compressImage=async function(file){
    const url=URL.createObjectURL(file);
    try{
      const img=new Image();
      img.decoding='async';
      img.src=url;
      if(img.decode){
        try{await img.decode()}catch{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject})}
      }else{
        await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
      }
      const max=2048;
      const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      let ctx;
      try{ctx=canvas.getContext('2d',{alpha:false,colorSpace:'srgb'})}catch{}
      if(!ctx)ctx=canvas.getContext('2d');
      if(!ctx)throw new Error('Brak obsługi Canvas 2D');
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.fillStyle='#fff';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.90));
      if(!blob)throw new Error('Nie udało się skompresować zdjęcia');
      return blob;
    }finally{URL.revokeObjectURL(url)}
  };
  window.H3ContestCompression={version:2,maxSide:2048,jpegQuality:0.90,colorSpace:'srgb'};
}
async function init(){try{const{data,error}=await sb.rpc('get_app_settings');if(error||!data?.show_public_version)return;const r=await fetch(`./service-worker.js?public-version=${Date.now()}`,{cache:'no-store'});const txt=await r.text();const m=txt.match(/CACHE_NAME\s*=\s*['"]halloween-3-v(\d+)['"]/);if(!m)return;const footer=document.querySelector('.app-footer');if(!footer)return;let el=document.getElementById('publicAppVersion');if(!el){el=document.createElement('span');el.id='publicAppVersion';el.style.cssText='display:block;margin-top:6px;opacity:.48;font:600 10px Inter,system-ui,sans-serif;letter-spacing:.08em';footer.appendChild(el)}el.textContent=`WERSJA V${m[1]}`}catch(e){console.warn(e)}}
installContestCompressionV2();
loadBugReporting();loadPushRouting();loadGalleryGoogleMeta();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{configureInstallLink();init()},{once:true});else{configureInstallLink();init()}
window.addEventListener('pageshow',configureInstallLink);
})();