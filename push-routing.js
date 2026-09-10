(()=>{
const TABS=new Set(['news','draw','photos','contest','other']);
let handlingKey='';
function parseTarget(raw){try{const u=new URL(raw||location.href,location.href);const tab=u.searchParams.get('h3tab')||u.hash.replace(/^#/,'')||'news';const newsId=u.searchParams.get('h3news')||'';const campaignId=u.searchParams.get('h3push')||'';return{tab:TABS.has(tab)?tab:'news',newsId,campaignId,key:`${tab}|${newsId}|${campaignId}`}}catch{return{tab:'news',newsId:'',campaignId:'',key:'news||'}}}
function openTab(tab){const btn=document.querySelector(`.nav-item[data-tab="${CSS.escape(tab)}"]`);if(btn){btn.click();return true}return false}
async function focusNews(newsId){if(!newsId)return;for(let i=0;i<40;i++){const article=document.querySelector(`.news-managed[data-news-id="${CSS.escape(newsId)}"]`);if(article){article.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});article.animate?.([{transform:'scale(1)'},{transform:'scale(1.015)'},{transform:'scale(1)'}],{duration:520,easing:'ease-out'});return}await new Promise(r=>setTimeout(r,125))}}
async function handle(raw){const t=parseTarget(raw);if(t.key===handlingKey)return;handlingKey=t.key;for(let i=0;i<20&&!openTab(t.tab);i++)await new Promise(r=>setTimeout(r,100));if(t.tab==='news'&&t.newsId){await new Promise(r=>setTimeout(r,120));await focusNews(t.newsId)}if(t.campaignId)window.H3Analytics?.track?.('push_target_open',{campaign_id:t.campaignId,target_tab:t.tab,news_id:t.newsId||null})}
function initial(){const u=new URL(location.href);if(u.searchParams.has('h3push')||u.searchParams.has('h3tab')||u.searchParams.has('h3news'))setTimeout(()=>handle(location.href),300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});else initial();
navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type==='H3_NOTIFICATION_OPEN')handle(e.data.url||location.href)});
})();