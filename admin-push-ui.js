(()=>{
const createBtn=document.getElementById('createNewsPost');if(!createBtn)return;
const wrap=document.createElement('label');wrap.className='switch-row';wrap.style.marginTop='4px';wrap.innerHTML='<div><strong>Wyślij powiadomienie push</strong><small>Po opublikowaniu wpisu powiadom zapisane urządzenia.</small></div><input id="newNewsPush" type="checkbox"><span class="switch"></span>';
createBtn.parentNode.insertBefore(wrap,createBtn);
const original=createBtn.onclick;
createBtn.onclick=async function(e){
 const toggle=document.getElementById('newNewsPush');
 const wantsPush=!!toggle?.checked;
 const title=document.getElementById('newNewsTitle')?.value?.trim()||'';
 const body=document.getElementById('newNewsBody')?.value?.trim()||'';
 await original?.call(this,e);
 const created=!!title && !(document.getElementById('newNewsTitle')?.value?.trim());
 if(!created)return;
 let pushSent=false;
 if(wantsPush){
  try{
   const r=await fetch(`${SUPABASE_URL}/functions/v1/send-news-push`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({device_token:adminDevice,title,body})});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(data.error||'Błąd wysyłania powiadomień');
   pushSent=true;toggle.checked=false;msg(`Aktualność dodana ✓ Powiadomienia: ${data.sent||0}`);
  }catch(err){msg(`Aktualność dodana, ale push się nie wysłał: ${err.message||err}`,true)}
 }
 try{await sb.rpc('admin_mark_latest_news_push',{p_device_token:adminDevice,p_title:title,p_sent:pushSent});await loadDashboard()}catch{}
};
})();