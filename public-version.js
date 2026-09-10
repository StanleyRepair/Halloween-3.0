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
async function detectUltraHdr(file){
  if(!file||!/^image\/jpe?g$/i.test(file.type||''))return false;
  try{
    const buf=await file.slice(0,Math.min(file.size,768*1024)).arrayBuffer();
    const txt=new TextDecoder('latin1').decode(buf);
    return txt.includes('hdrgm:Version')||txt.includes('hdr-gain-map/1.0')||txt.includes('Item:Semantic="GainMap"')||txt.includes("Item:Semantic='GainMap'");
  }catch{return false}
}
function canvasToJpeg(canvas,quality){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Nie udało się skompresować zdjęcia')),'image/jpeg',quality))}
async function installContestCompressionV4(){
  window.compressImage=async function(file){
    const ultraHdr=await detectUltraHdr(file);
    const url=URL.createObjectURL(file);
    try{
      const img=new Image();
      img.decoding='async';
      img.src=url;
      if(img.decode){try{await img.decode()}catch{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject})}}
      else await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});

      const targetBytes=950*1024;
      const sides=[2560,2304,2048];
      let lastBlob=null,lastInfo=null;
      for(const maxSide of sides){
        const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
        let ctx=null,ctxMode='srgb-unorm8';
        try{ctx=canvas.getContext('2d',{alpha:false,colorSpace:'display-p3',colorType:'float16'});if(ctx)ctxMode='display-p3-float16'}catch{}
        if(!ctx){try{ctx=canvas.getContext('2d',{alpha:false,colorSpace:'display-p3'});if(ctx)ctxMode='display-p3-unorm8'}catch{}}
        if(!ctx){ctx=canvas.getContext('2d',{alpha:false});ctxMode='srgb-unorm8'}
        if(!ctx)throw new Error('Brak obsługi Canvas 2D');
        ctx.imageSmoothingEnabled=true;
        ctx.imageSmoothingQuality='high';
        ctx.fillStyle='#fff';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        if(ultraHdr)ctx.filter='brightness(1.10)';
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        ctx.filter='none';

        let blob=await canvasToJpeg(canvas,0.96),quality=0.96;
        if(blob.size>targetBytes){
          let lo=0.82,hi=0.96,best=null,bestQ=lo;
          for(let i=0;i<7;i++){
            const q=(lo+hi)/2;
            const candidate=await canvasToJpeg(canvas,q);
            if(candidate.size<=targetBytes){best=candidate;bestQ=q;lo=q}else hi=q;
          }
          if(best){blob=best;quality=bestQ}else{blob=await canvasToJpeg(canvas,0.82);quality=0.82}
        }
        lastBlob=blob;
        lastInfo={maxSide,quality,bytes:blob.size,ultraHdr,ctxMode};
        if(blob.size<=targetBytes){window.H3ContestCompression.last=lastInfo;console.info('H3 photo compression',lastInfo);return blob}
      }
      window.H3ContestCompression.last=lastInfo;console.info('H3 photo compression',lastInfo);return lastBlob;
    }finally{URL.revokeObjectURL(url)}
  };
  window.H3ContestCompression={version:4,maxSide:2560,targetBytes:950*1024,maxJpegQuality:0.96,minJpegQuality:0.82,ultraHdrBrightness:1.10,colorSpace:'display-p3-float16-with-fallback',last:null};
}
async function init(){try{const{data,error}=await sb.rpc('get_app_settings');if(error||!data?.show_public_version)return;const r=await fetch(`./service-worker.js?public-version=${Date.now()}`,{cache:'no-store'});const txt=await r.text();const m=txt.match(/CACHE_NAME\s*=\s*['"]halloween-3-v(\d+)['"]/);if(!m)return;const footer=document.querySelector('.app-footer');if(!footer)return;let el=document.getElementById('publicAppVersion');if(!el){el=document.createElement('span');el.id='publicAppVersion';el.style.cssText='display:block;margin-top:6px;opacity:.48;font:600 10px Inter,system-ui,sans-serif;letter-spacing:.08em';footer.appendChild(el)}el.textContent=`WERSJA V${m[1]}`}catch(e){console.warn(e)}}
installContestCompressionV4();
loadBugReporting();loadPushRouting();loadGalleryGoogleMeta();loadContestPhotoViewer();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{configureInstallLink();init()},{once:true});else{configureInstallLink();init()}
window.addEventListener('pageshow',configureInstallLink);
})();