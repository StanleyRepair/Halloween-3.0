(()=>{
const section=document.querySelector('[data-view="news"]');
if(!section)return;
let busy=false,timer=null;
function formatNewsDate(value){if(!value)return'';const d=new Date(value);if(Number.isNaN(d.getTime()))return'';return new Intl.DateTimeFormat('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)}
function unwrapBadgeRows(card){card.querySelectorAll('.news-badge-row').forEach(row=>{const parent=row.parentNode,badge=row.querySelector('.card-badge');if(badge)parent.insertBefore(badge,row);row.remove()})}
async function decoratePinnedNews(){if(busy)return;busy=true;try{const{data,error}=await sb.rpc('get_news_posts');if(error)throw error;const posts=data||[],byId=new Map(posts.map(p=>[String(p.id||''),p])),cards=[...section.querySelectorAll(':scope > article.content-card.news-managed')];cards.forEach((card,i)=>{const post=byId.get(String(card.dataset.newsId||''))||posts[i],pinned=!!post?.pinned;card.classList.toggle('news-pinned',pinned);unwrapBadgeRows(card);card.querySelectorAll('.news-pin-icon,.news-pin-web,.news-date').forEach(x=>x.remove());const dateText=formatNewsDate(post?.created_at);if(dateText){const date=document.createElement('span');date.className='news-date';date.textContent=dateText;const title=card.querySelector('h2');if(title)title.insertAdjacentElement('afterend',date)}if(!pinned)return;['tl','tr','bl','br'].forEach(pos=>{const web=document.createElement('span');web.className=`news-pin-web news-pin-web-${pos}`;web.setAttribute('aria-hidden','true');web.textContent='🕸️';card.appendChild(web)});const pin=document.createElement('span');pin.className='news-pin-icon';pin.setAttribute('aria-label','Przypięta aktualność');pin.textContent='📌';const badge=card.querySelector('.card-badge');if(badge){const row=document.createElement('div');row.className='news-badge-row';badge.parentNode.insertBefore(row,badge);row.append(badge,pin)}else{const copy=card.querySelector('.news-post-copy')||card.querySelector('.news-layout-head > div:last-child')||card.querySelector(':scope > div:last-child');if(copy)copy.insertBefore(pin,copy.firstChild);else card.insertBefore(pin,card.firstChild)}})}catch(e){console.warn('News decoration failed',e)}finally{busy=false}}
function schedule(){clearTimeout(timer);timer=setTimeout(decoratePinnedNews,70)}
new MutationObserver(schedule).observe(section,{childList:true,subtree:false});
window.addEventListener('h3:news-rendered',schedule);
document.querySelector('.nav-item[data-tab="news"]')?.addEventListener('click',()=>setTimeout(decoratePinnedNews,100));
setTimeout(decoratePinnedNews,220);
const hint=document.getElementById('chromeHint');
const ua=navigator.userAgent||'';
const inAppBrowser=/FBAN|FBAV|FB_IAB|Messenger|Instagram/i.test(ua);
const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
if(hint&&inAppBrowser&&!standalone){setTimeout(()=>{hint.hidden=false;requestAnimationFrame(()=>hint.classList.add('show'))},1250)}
})();