(()=>{
const list=document.getElementById('adminNewsList');
if(!list)return;
let state=new Map(),busy=false,timer=null,observer=null,destroyed=false;
function syncButton(item,row){
  const actions=row.querySelector('.news-admin-actions');if(!actions)return;
  let b=actions.querySelector('[data-news-pin]');
  if(!b){b=document.createElement('button');b.type='button';b.className='secondary news-pin-admin-button';actions.insertBefore(b,actions.firstChild)}
  b.dataset.newsPin=item.id;
  b.dataset.pinned=item.pinned?'1':'0';
  b.classList.toggle('active',!!item.pinned);
  const text=item.pinned?'📌 Przypięta':'📌 Przypnij';if(b.textContent!==text)b.textContent=text;
}
async function decorate(){
  if(destroyed||busy||document.hidden||document.getElementById('dashboard')?.hidden)return;
  busy=true;
  try{
    const{data,error}=await sb.rpc('admin_get_news',{p_device_token:adminDevice});
    if(error)throw error;
    state=new Map((data||[]).map(x=>[String(x.id),x]));
    list.querySelectorAll(':scope > .news-admin-item').forEach(row=>{
      const item=state.get(String(row.dataset.newsId||''));if(!item)return;
      row.classList.toggle('admin-news-pinned',!!item.pinned);
      syncButton(item,row);
    });
  }catch(e){console.warn('Admin pin decoration failed',e)}finally{busy=false}
}
async function toggle(id,current,button){
  button.disabled=true;
  try{
    const next=!current;
    const{error}=await sb.rpc('admin_set_news_pinned',{p_device_token:adminDevice,p_news_id:id,p_pinned:next});
    if(error)throw error;
    msg(next?'Aktualność przypięta 📌':'Aktualność odpięta ✓');
    document.getElementById('refreshNews')?.click();
    clearTimeout(timer);timer=setTimeout(decorate,220);
  }catch(e){msg(e.message||'Nie udało się zmienić przypięcia.',true)}finally{button.disabled=false}
}
list.addEventListener('click',e=>{
  const b=e.target.closest('[data-news-pin]');if(!b)return;
  e.preventDefault();e.stopPropagation();
  toggle(b.dataset.newsPin,b.dataset.pinned==='1',b);
});
function schedule(){clearTimeout(timer);timer=setTimeout(decorate,90)}
observer=new MutationObserver(records=>{
  if(records.some(r=>r.target===list&&r.type==='childList'))schedule();
});
observer.observe(list,{childList:true,subtree:false});
document.getElementById('refreshNews')?.addEventListener('click',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
window.addEventListener('pagehide',()=>{destroyed=true;clearTimeout(timer);observer?.disconnect()},{once:true});
setTimeout(decorate,500);
})();
