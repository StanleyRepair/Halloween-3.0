(()=>{
const logs=document.getElementById('auditLogs');if(!logs)return;
function enhance(){
 const rows=[...logs.querySelectorAll('.audit-row')];
 const auditData=window.__lastAuditLogs||[];
 rows.forEach((row,i)=>{
  const l=auditData[i];
  if(!l||l.action!=='news_post_created')return;
  const title=l.details?.title||'';
  const strong=row.querySelector('strong');
  if(strong)strong.textContent=title?`Dodano aktualność: ${title}`:'Dodano aktualność';
  let bell=row.querySelector('.audit-push-bell');
  if(!bell){bell=document.createElement('span');bell.className='audit-push-bell';row.appendChild(bell)}
  const pushed=l.details?.push===true;
  bell.textContent=pushed?'🔔':'🔕';
  bell.title=pushed?'Wysłano powiadomienie push':'Bez powiadomienia push';
 });
}
const originalRender=window.renderAudit;
if(typeof originalRender==='function'){
 window.renderAudit=function(items){window.__lastAuditLogs=items||[];originalRender(items);enhance()};
}
new MutationObserver(enhance).observe(logs,{childList:true,subtree:true});
})();