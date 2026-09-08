(()=>{
const section=document.querySelector('[data-view="news"]');if(!section||typeof sb==='undefined')return;
let busy=false,timer=null;
function fmt(value){if(!value)return'';const d=new Date(value);if(Number.isNaN(d.getTime()))return'';return new Intl.DateTimeFormat('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)}
async function applyDates(){if(busy)return;busy=true;try{const{data,error}=await sb.rpc('get_news_posts');if(error)throw error;const posts=data||[];const cards=[...section.querySelectorAll(':scope > article.content-card.news-managed')];cards.forEach((card,i)=>{card.querySelectorAll('.news-date').forEach(x=>x.remove());const post=posts[i];const text=fmt(post?.created_at);if(!text)return;const date=document.createElement('span');date.className='news-date';date.textContent=text;let copy=card.querySelector('.news-post-copy');if(!copy){const head=card.querySelector('.news-layout-head');copy=head?.querySelector(':scope > div:not(.card-icon)')||[...card.children].find(el=>el.tagName==='DIV'&&!el.classList.contains('card-icon')&&!el.classList.contains('news-layout-head'))||null}if(copy){const title=copy.querySelector('h2');if(title)title.insertAdjacentElement('afterend',date);else copy.appendChild(date)}else card.appendChild(date)})}catch(e){console.warn('News dates failed',e)}finally{busy=false}}
function schedule(){clearTimeout(timer);timer=setTimeout(applyDates,120)}
new MutationObserver(schedule).observe(section,{childList:true,subtree:true});
document.querySelector('.nav-item[data-tab="news"]')?.addEventListener('click',()=>setTimeout(applyDates,180));
setTimeout(applyDates,350);
})();