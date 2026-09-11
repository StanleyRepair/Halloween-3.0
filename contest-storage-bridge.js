(()=>{
if(typeof sb==='undefined'||sb.__h3ContestStorageBridge)return;
const originalRpc=sb.rpc.bind(sb);
async function invoke(action,body){
  const{data,error}=await sb.functions.invoke('contest-storage',{body:{action,...body}});
  if(error||data?.error)return{data:null,error:error||new Error(data.error)};
  if(data?.old_photo_cleanup_warning)console.warn('Nie udało się usunąć poprzedniego zdjęcia konkursowego:',data.old_photo_cleanup_warning);
  return{data:data?.entry_id||null,error:null};
}
sb.rpc=async function(name,args={},options){
  if(name==='submit_contest_entry'||name==='update_my_entry'){
    const token=String(args?.p_participant_token||''),imagePath=String(args?.p_image_path||'');
    const result=await invoke('participant_save_entry',{participant_token:token,name:String(args?.p_name||''),description:String(args?.p_description||''),image_path:imagePath});
    if(result.error&&imagePath){
      try{await sb.functions.invoke('contest-storage',{body:{action:'participant_discard_photo',participant_token:token,image_path:imagePath}})}catch{}
    }
    return result;
  }
  return originalRpc(name,args,options);
};
sb.__h3ContestStorageBridge=true;
})();