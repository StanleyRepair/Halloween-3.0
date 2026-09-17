(()=>{
const titleEl=document.getElementById('contestStatusTitle'),textEl=document.getElementById('contestStatusText');if(!titleEl||!textEl)return;
let content=null,applying=false;
function stateKey(){try{if(typeof contestState==='undefined'||!contestState)return null;const phase=contestState.phase;if(phase==='closed')return Number(contestState.entry_count||0)>0?'closed_entries':'closed_empty';if(phase==='registration'){if(typeof myEntry==='undefined'||!myEntry)return'registration_open';return contestState.allow_entry_edit?'registration_saved_editable':'registration_saved_locked'}if(phase==='voting')return'voting';if(phase==='finished')return'finished';return null}catch{return null}}
function apply(){if(!content)return;const key=stateKey(),item=key?content[key]:null;if(!item)return;applying=true;try{if(item.title&&titleEl.textContent!==item.title)titleEl.textContent=item.title;if(item.text&&textEl.textContent!==item.text)textEl.textContent=item.text}finally{queueMicrotask(()=>applying=false)}}
async function refresh(){try{const{data,error}=await sb.rpc('get_contest_status_content');if(error)throw error;content=data||null;apply()}catch(e){console.warn('Contest status content load failed',e)}}
const observer=new MutationObserver(()=>{if(!applying)queueMicrotask(apply)});observer.observe(titleEl,{childList:true,subtree:true,characterData:true});observer.observe(textEl,{childList:true,subtree:true,characterData:true});
document.querySelector('.nav-item[data-tab="contest"]')?.addEventListener('click',()=>setTimeout(refresh,120));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&location.hash==='#contest')refresh()});
setTimeout(refresh,180);
})();