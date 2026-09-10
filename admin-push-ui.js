(()=>{
const richLoader=document.createElement('script');richLoader.src='admin-rich-loader.js?v=1';richLoader.async=true;document.head.appendChild(richLoader);
const createBtn=document.getElementById('createNewsPost');if(!createBtn)return;
const style=document.createElement('style');style.textContent='.audit-row{position:relative;padding-right:54px!important}.audit-push-bell{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:25px;line-height:1;opacity:.42;pointer-events:none}.audit-row>strong{display:block;padding-right:4px}';document.head.appendChild(style);
const baseRender=window.renderAudit;
if(typeof baseRender==='function')window.renderAudit=function(logs){baseRender(logs);(logs||[]).forEach((l,i)=>{if(l.action!=='news_post_created')return;const row=document.querySelectorAll('#auditLogs .audit-row')[i];if(!row)return;const title=l.details?.title||'';const strong=row.querySelector('strong');if(strong)strong.textContent=title?`Dodano aktualność: ${title}`:'Dodano aktualność';const bell=document.createElement('span');bell.className='audit-push-bell';const pushed=l.details?.push===true;bell.textContent=pushed?'🔔':'🔕';bell.title=pushed?'Wysłano powiadomienie push':'Bez powiadomienia push';row.appendChild(bell)})};
const wrap=document.createElement('label');wrap.className='switch-row';wrap.style.marginTop='4px';wrap.innerHTML='<div><strong>Wyślij powiadomienie push</strong><small>Po opublikowaniu wpisu powiadom zapisane urządzenia.</small></div><input id="newNewsPush" type="checkbox"><span class="switch"></span>';
createBtn.parentNode.insertBefore(wrap,createBtn);
const original=createBtn.onclick;
createBtn.onclick=async function(e){
 const toggle=document.getElementById('newNewsPush');const wantsPush=!!toggle?.checked;const title=document.getElementById('newNewsTitle')?.value?.trim()||'';const rawBody=document.getElementById('newNewsBody')?.value?.trim()||'';const body=window.H3RichText?.toPlain?window.H3RichText.toPlain(rawBody):rawBody.replace(/<[^>]*>/g,' ');
 await original?.call(this,e);const created=!!title&&!(document.getElementById('newNewsTitle')?.value?.trim());if(!created)return;window.H3RichText?.setValue?.(document.getElementById('newNewsBody'),'');let pushSent=false;
 if(wantsPush){try{const r=await fetch(`${SUPABASE_URL}/functions/v1/send-news-push`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({device_token:adminDevice,title,body})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Błąd wysyłania powiadomień');pushSent=true;toggle.checked=false;msg(`Aktualność dodana ✓ Powiadomienia: ${data.sent||0}`)}catch(err){msg(`Aktualność dodana, ale push się nie wysłał: ${err.message||err}`,true)}}
 try{await sb.rpc('admin_mark_latest_news_push',{p_device_token:adminDevice,p_title:title,p_sent:pushSent});await loadDashboard()}catch{}
};
})();