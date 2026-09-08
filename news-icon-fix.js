(()=>{
const section=document.querySelector('[data-view="news"]');if(!section||typeof sb==='undefined')return;
let posts=[];
function patch(){const cards=[...section.querySelectorAll('article.news-managed')];cards.forEach((card,i)=>{if(!card.classList.contains('news-with-image')||card.querySelector('.news-post-head'))return;const copy=card.querySelector('.news-post-copy'),img=card.querySelector('.news-post-image');if(!copy||!img)return;const head=document.createElement('div');head.className='news-post-head';const icon=document.createElement('div');icon.className='card-icon news-post-icon';icon.textContent=posts[i]?.icon||'🎃';card.insertBefore(head,copy);head.append(icon,copy)})}
async function load(){try{const{data,error}=await sb.rpc('get_news_posts');if(error)throw error;posts=data||[];patch()}catch(e){console.warn('News icon patch failed',e)}}
new MutationObserver(patch).observe(section,{childList:true,subtree:true});load();
})();