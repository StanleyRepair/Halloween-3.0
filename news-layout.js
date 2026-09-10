(()=>{
const section=document.querySelector('[data-view="news"]');if(!section)return;
const LONG_TEXT_MIN=180;
let raf=0;
function bodyFrom(copy){
 return copy?.querySelector(':scope > .news-full-text,:scope > .news-body-content,:scope > .news-rich-content,:scope > .rich-content,:scope > p')||null;
}
function normalizeBody(card,copy,head){
 let body=card.querySelector(':scope > .news-full-text,:scope > .news-body-content,:scope > .news-rich-content,:scope > .rich-content');
 if(!body)body=bodyFrom(copy);
 if(!body)return null;
 body.classList.add('news-full-text');
 if(body.parentElement!==card){
  const action=card.querySelector(':scope > .text-action');
  const image=card.querySelector(':scope > .news-post-image');
  card.insertBefore(body,action||image||null);
 }
 return body;
}
function reflow(card){
 if(!card.classList.contains('news-managed'))return;
 const withImage=card.classList.contains('news-with-image');
 if(withImage){
  let copy=card.querySelector(':scope > .news-post-copy');
  let head=card.querySelector(':scope > .news-post-head');
  if(head)copy=head.querySelector(':scope > .news-post-copy')||copy;
  const body=normalizeBody(card,copy,head);
  const len=(body?.textContent||'').trim().length;
  card.classList.toggle('news-long-post',len>=LONG_TEXT_MIN);
  if(body)body.classList.toggle('news-long-text',len>=LONG_TEXT_MIN);
  return;
 }
 let head=card.querySelector(':scope > .news-layout-head');
 let icon=card.querySelector(':scope > .card-icon');
 let copy=null;
 if(head){
  icon=head.querySelector(':scope > .card-icon')||icon;
  copy=head.querySelector(':scope > .news-post-copy')||[...head.children].find(el=>el!==icon&&el.tagName==='DIV')||null;
 }
 if(!head){
  copy=[...card.children].find(el=>el.tagName==='DIV'&&!el.classList.contains('card-icon')&&!el.classList.contains('news-full-text')&&!el.classList.contains('rich-content'))||null;
  if(icon&&copy){
   head=document.createElement('div');
   head.className='news-layout-head';
   card.insertBefore(head,icon);
   head.append(icon,copy);
  }
 }
 if(!copy)return;
 const body=normalizeBody(card,copy,head);
 const len=(body?.textContent||'').trim().length;
 const isLong=len>=LONG_TEXT_MIN;
 card.classList.toggle('news-long-post',isLong);
 if(body)body.classList.toggle('news-long-text',isLong);
 const btn=copy.querySelector(':scope > .text-action');
 if(btn)card.appendChild(btn);
}
function apply(){raf=0;section.querySelectorAll(':scope > article.content-card.news-managed').forEach(reflow)}
function schedule(){if(raf)return;raf=requestAnimationFrame(apply)}
new MutationObserver(schedule).observe(section,{childList:true,subtree:true});
window.addEventListener('h3:news-rendered',schedule);
document.querySelector('.nav-item[data-tab="news"]')?.addEventListener('click',()=>setTimeout(schedule,40));
setTimeout(schedule,150);
})();