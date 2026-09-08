(()=>{
const section=document.querySelector('[data-view="news"]');
if(!section)return;
let busy=false,timer=null;
async function decoratePinnedNews(){
  if(busy)return;
  busy=true;
  try{
    const{data,error}=await sb.rpc('get_news_posts');
    if(error)throw error;
    const posts=data||[];
    const cards=[...section.querySelectorAll(':scope > article.content-card.news-managed')];
    cards.forEach((card,i)=>{
      const post=posts[i];
      const pinned=!!post?.pinned;
      card.classList.toggle('news-pinned',pinned);
      card.querySelectorAll('.news-pin-badge').forEach(x=>x.remove());
      if(pinned){
        const badge=document.createElement('div');
        badge.className='news-pin-badge';
        badge.innerHTML='<span aria-hidden="true">📌</span><span>PRZYPIĘTE</span>';
        const copy=card.querySelector('.news-post-copy')||card.querySelector(':scope > div:last-child');
        if(copy)copy.insertBefore(badge,copy.firstChild);
        else card.insertBefore(badge,card.firstChild);
      }
    });
  }catch(e){console.warn('Pinned news decoration failed',e)}
  finally{busy=false}
}
function schedule(){clearTimeout(timer);timer=setTimeout(decoratePinnedNews,100)}
new MutationObserver(schedule).observe(section,{childList:true,subtree:false});
document.querySelector('.nav-item[data-tab="news"]')?.addEventListener('click',()=>setTimeout(decoratePinnedNews,180));
setTimeout(decoratePinnedNews,350);
})();