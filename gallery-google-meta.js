(()=>{
const showcase=document.getElementById('photoShowcase');
if(!showcase)return;
let timer=null,busy=false,observer=null;
async function apply(){
  if(busy)return;
  const tile=showcase.querySelector('.google-tile');
  if(!tile)return;
  busy=true;
  try{
    const{data,error}=await sb.rpc('get_photo_gallery');
    if(error)throw error;
    const google=(data||[]).find(t=>t.type==='google');
    if(!google)return;
    const title=tile.querySelector('strong');
    const description=tile.querySelector('span');
    if(title)title.textContent=google.title||'Wspólny album Google Zdjęcia';
    if(description){
      const text=String(google.description??'').trim();
      description.textContent=text;
      description.hidden=!text;
    }
  }catch(e){console.warn('Google album metadata render failed',e)}finally{busy=false}
}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,70)}
observer=new MutationObserver(records=>{if(records.some(r=>r.target===showcase&&r.type==='childList'))schedule()});
observer.observe(showcase,{childList:true,subtree:false});
document.querySelector('.nav-item[data-tab="photos"]')?.addEventListener('click',()=>setTimeout(schedule,80));
window.addEventListener('pagehide',()=>{clearTimeout(timer);observer?.disconnect()},{once:true});
setTimeout(schedule,250);
})();