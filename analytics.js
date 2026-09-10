(()=>{
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE='h3_visitor_id',COOKIE_PATH='/Halloween-3.0/';
const ua=navigator.userAgent||'';
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const messenger=/FBAN|FBAV|FB_IAB|Messenger/i.test(ua);
const inApp=/FBAN|FBAV|FB_IAB|Messenger|Instagram|WhatsApp|Line\/|MicroMessenger|Telegram|Snapchat|TikTok/i.test(ua);
const isIOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const nonSafariIOS=/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|Brave|YaBrowser|FBAN|FBAV|FB_IAB|Messenger|Instagram|WhatsApp|Line\/|MicroMessenger|Telegram|Snapchat|TikTok/i;
const isSafariIOS=isIOS&&/Safari\//i.test(ua)&&!nonSafariIOS.test(ua);
const isAndroid=/Android/i.test(ua);
const isChrome=/Chrome\/\d+/i.test(ua)&&!/EdgA|OPR|SamsungBrowser|FBAN|FBAV|FB_IAB|Messenger|Instagram/i.test(ua);
const context=standalone?'pwa':messenger?'messenger':'browser';
const source=messenger?'messenger':document.referrer?(()=>{try{return new URL(document.referrer).hostname}catch{return 'referrer'}})():'direct';
const params=new URLSearchParams(location.search),preview=params.has('preview');
function safeGet(k){try{return localStorage.getItem(k)}catch{return null}}
function safeSet(k,v){try{localStorage.setItem(k,v)}catch{}}
function cookieGet(){try{const p=document.cookie.split('; ').find(x=>x.startsWith(COOKIE+'='));return p?decodeURIComponent(p.slice(COOKIE.length+1)):null}catch{return null}}
function cookieSet(v){if(!UUID.test(v||''))return;try{document.cookie=`${COOKIE}=${encodeURIComponent(v)}; Max-Age=63072000; Path=${COOKIE_PATH}; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`}catch{}}
if(preview){window.H3Analytics={visitorId:null,sessionId:null,context:'preview',track:async()=>false,pushOpen:async()=>false};return}
let visitor=params.get('h3id');
if(!UUID.test(visitor||''))visitor=cookieGet();
if(!UUID.test(visitor||''))visitor=safeGet('h3_visitor_id')||safeGet('h3_participant_device');
if(!UUID.test(visitor||''))visitor=crypto.randomUUID();
safeSet('h3_visitor_id',visitor);cookieSet(visitor);
let session=null;if(!standalone){session=params.get('h3s');if(!UUID.test(session||''))session=crypto.randomUUID()}
const installPage=/\/install\/?(?:index\.html)?$/i.test(location.pathname);
const needsHandoff=installPage&&((isIOS&&!isSafariIOS)||(isAndroid&&!isChrome)||inApp);
if(!standalone&&(inApp||needsHandoff)){
 const u=new URL(location.href);u.searchParams.set('h3id',visitor);if(session)u.searchParams.set('h3s',session);history.replaceState(history.state,'',u.pathname+u.search+u.hash)
}else if(!inApp&&!needsHandoff&&(params.has('h3id')||params.has('h3s'))){
 const u=new URL(location.href);u.searchParams.delete('h3id');u.searchParams.delete('h3s');history.replaceState(history.state,'',u.pathname+u.search+u.hash)
}
async function rpc(name,args){try{const{error}=await sb.rpc(name,args);if(error)throw error;return true}catch(e){console.warn('Analytics',name,e);return false}}
async function track(type,metadata={}){return rpc('analytics_track',{p_visitor_id:visitor,p_event_type:type,p_context:context,p_session_id:session,p_metadata:metadata})}
async function pushOpen(id){if(!UUID.test(id||''))return false;const ok=await rpc('analytics_push_open',{p_visitor_id:visitor,p_campaign_id:id,p_context:context});if(ok){const u=new URL(location.href);u.searchParams.delete('h3push');if(!inApp&&!needsHandoff){u.searchParams.delete('h3id');u.searchParams.delete('h3s')}history.replaceState(history.state,'',u.pathname+u.search+u.hash)}return ok}
window.H3Analytics={visitorId:visitor,sessionId:session,context,track,pushOpen};
track('page_open',{source});if(standalone)track('pwa_open',{source});
if(session)rpc('analytics_register_link_session',{p_visitor_id:visitor,p_session_id:session,p_source:source,p_context:context});
if(standalone)track('install',{detected:'standalone'});
window.addEventListener('appinstalled',()=>track('install',{detected:'appinstalled'}));
const campaign=params.get('h3push');if(campaign)pushOpen(campaign);
navigator.serviceWorker?.addEventListener('message',e=>{const d=e.data||{};if(d.type==='H3_NOTIFICATION_OPEN'){if(d.campaignId)pushOpen(d.campaignId);const hash=String(d.url||'').split('#')[1];if(hash&&typeof openTab==='function'&&['news','contest','photos','draw','other'].includes(hash))openTab(hash)}});
})();