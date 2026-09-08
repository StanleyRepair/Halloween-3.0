(()=>{
const list=document.getElementById('adminNewsList');
if(!list)return;
let state=new Map(),busy=false,timer=null;
function pinButton(item){
  const b=document.createElement('button');
  b.type='button';
  b.className='secondary news-pin-admin-button'+(item.pinned?' active':'');
  b.dataset.newsPin=item.id;
  b.dataset.pinned=item.pinned?'1':'0';
  b.textContent=item.pinned?'📌 Przypięta':'📌 Przypnij';
  return b;
}
async function decorate(){
  if(busy||document.getElementById('dashboard')?.hidden)return;
  busy=true;
  try{
    const{data,error}=await sb.rpc('admin_get_news',{p_device_token:adminDevice});
    if(error)throw error;
    state=new Map((data||[]).map(x=>[x.id,x]));
    list.querySelectorAll('.news-admin-item').forEach(row=>{
      const item=state.get(row.dataset.newsId);if(!item)return;
      row.classList.toggle('admin-news-pinned',!!item.pinned);
      row.querySelectorAll('[data-news-pin]').forEach(x=>x.remove());
      const actions=row.querySelector('.news-admin-actions');
      if(actions)actions.insertBefore(pinButton(item),actions.firstChild);
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
    setTimeout(decorate,250);
  }catch(e){msg(e.message||'Nie udało się zmienić przypięcia.',true)}finally{button.disabled=false}
}
list.addEventListener('click',e=>{
  const b=e.target.closest('[data-news-pin]');
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  toggle(b.dataset.newsPin,b.dataset.pinned==='1',b);
});
function schedule(){clearTimeout(timer);timer=setTimeout(decorate,120)}
new MutationObserver(schedule).observe(list,{childList:true,subtree:true});
document.getElementById('refreshNews')?.addEventListener('click',()=>setTimeout(decorate,220));
setTimeout(decorate,650);
})();