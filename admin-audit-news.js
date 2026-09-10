(()=>{
const logs=document.getElementById('auditLogs');if(!logs)return;
function enhance(){
 const rows=[...logs.querySelectorAll('.audit-row')];
 const auditData=window.__lastAuditLogs||[];
 rows.forEach((row,i)=>{
  const l=auditData[i];if(!l||l.action!=='news_post_created')return;
  const title=l.details?.title||'';
  const strong=row.querySelector('strong');
  const wantedTitle=title?`Dodano aktualność: ${title}`:'Dodano aktualność';
  if(strong&&strong.textContent!==wantedTitle)strong.textContent=wantedTitle;
  let bell=row.querySelector('.audit-push-bell');
  if(!bell){bell=document.createElement('span');bell.className='audit-push-bell';row.appendChild(bell)}
  const pushed=l.details?.push===true,wanted=pushed?'🔔':'🔕',wantedTip=pushed?'Wysłano powiadomienie push':'Bez powiadomienia push';
  if(bell.textContent!==wanted)bell.textContent=wanted;
  if(bell.title!==wantedTip)bell.title=wantedTip;
 });
}
const originalRender=window.renderAudit;
if(typeof originalRender==='function'){
 window.renderAudit=function(items){window.__lastAuditLogs=items||[];originalRender(items);enhance()};
}
requestAnimationFrame(enhance);
})();
