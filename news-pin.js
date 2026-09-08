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
      card.querySelectorAll('.news-pin-icon,.news-pin-web').forEach(x=>x.remove());
      if(!pinned)return;

      ['tl','tr','bl','br'].forEach(pos=>{
        const web=document.createElement('span');
        web.className=`news-pin-web news-pin-web-${pos}`;
        web.setAttribute('aria-hidden','true');
        web.textContent='🕸️';
        card.appendChild(web);
      });

      const pin=document.createElement('span');
      pin.className='news-pin-icon';
      pin.setAttribute('aria-label','Przypięta aktualność');
      pin.textContent='📌';

      const badge=card.querySelector('.card-badge');
      if(badge){
        badge.insertAdjacentElement('afterend',pin);
      }else{
        const copy=card.querySelector('.news-post-copy')||card.querySelector('.news-layout-head > div:last-child')||card.querySelector(':scope > div:last-child');
        if(copy)copy.insertBefore(pin,copy.firstChild);
        else card.insertBefore(pin,card.firstChild);
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