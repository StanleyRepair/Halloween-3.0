(()=>{
const grid=document.getElementById('contestGrid'),counter=document.getElementById('voteCounter'),save=document.getElementById('saveVotes'),help=document.getElementById('voteHelp');if(!grid||!counter||!save)return;
if(!sb.__h3ContestStorageRpcWrapped){
 const originalRpc=sb.rpc.bind(sb);
 sb.rpc=async function(name,args={},options){
  if(name==='submit_contest_entry'||name==='update_my_entry'){
   const token=String(args?.p_participant_token||''),imagePath=String(args?.p_image_path||'');
   const body={action:'participant_save_entry',participant_token:token,name:String(args?.p_name||''),description:String(args?.p_description||''),image_path:imagePath};
   const{data,error}=await sb.functions.invoke('contest-storage',{body});
   if(error||data?.error){
    try{await sb.functions.invoke('contest-storage',{body:{action:'participant_discard_photo',participant_token:token,image_path:imagePath}})}catch{}
    return{data:null,error:error||new Error(data.error)};
   }
   if(data?.old_photo_cleanup_warning)console.warn('Nie udało się posprzątać poprzedniego zdjęcia konkursowego:',data.old_photo_cleanup_warning);
   return{data:name==='submit_contest_entry'?(data?.entry_id||null):null,error:null};
  }
  return originalRpc(name,args,options);
 };
 sb.__h3ContestStorageRpcWrapped=true;
}
let maxVotes=3,selected=new Set(),syncing=false;
async function refreshLimit(){try{const{data,error}=await sb.rpc('get_contest_state');if(error)throw error;const s=Array.isArray(data)?data[0]:data;maxVotes=Math.max(1,Number(s?.max_votes||3));syncFromDom();updateUi();if(help&&!save.hidden)help.textContent=`Dotknij zdjęcia, aby oddać lub cofnąć głos. Możesz wybrać maksymalnie ${maxVotes}.`}catch(e){console.warn(e)}}
function syncFromDom(){selected=new Set([...grid.querySelectorAll('.candidate-card.selected[data-entry]')].map(x=>x.dataset.entry))}
function updateUi(){counter.textContent=`${selected.size} / ${maxVotes}`;grid.querySelectorAll('.candidate-card[data-entry]').forEach(c=>c.classList.toggle('selected',selected.has(c.dataset.entry)))}
grid.addEventListener('click',e=>{const card=e.target.closest('.candidate-card[data-entry]');if(!card||save.hidden)return;e.preventDefault();e.stopImmediatePropagation();const id=card.dataset.entry;if(selected.has(id))selected.delete(id);else if(selected.size<maxVotes)selected.add(id);else{const m=document.getElementById('contestMessage');if(m){m.textContent=`Możesz wybrać maksymalnie ${maxVotes} przebrania.`;m.className='contest-message error';m.hidden=false;setTimeout(()=>m.hidden=true,3500)}return}updateUi()},true);
save.addEventListener('click',async e=>{if(save.hidden)return;e.preventDefault();e.stopImmediatePropagation();save.disabled=true;try{const{error}=await sb.rpc('set_my_votes',{p_voter_token:localStorage.getItem('h3_voter_device'),p_entry_ids:[...selected]});if(error)throw error;const m=document.getElementById('contestMessage');if(m){m.textContent='Głosy zapisane ✓';m.className='contest-message';m.hidden=false;setTimeout(()=>m.hidden=true,3000)}}catch(err){const m=document.getElementById('contestMessage');if(m){m.textContent=err.message||'Nie udało się zapisać głosów.';m.className='contest-message error';m.hidden=false}}finally{save.disabled=false}},true);
new MutationObserver(()=>{if(syncing)return;syncing=true;syncFromDom();updateUi();syncing=false}).observe(grid,{childList:true,subtree:true});
document.querySelector('.nav-item[data-tab="contest"]')?.addEventListener('click',()=>setTimeout(refreshLimit,150));
setTimeout(refreshLimit,300);
})();