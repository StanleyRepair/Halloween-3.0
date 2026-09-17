(()=>{
const original=window.renderGallery;
if(typeof original==='function')window.renderGallery=function(tiles){
  const visible=(tiles||[]).filter(t=>t.type!=='google'||!!String(t.google_url||'').trim());
  return original(visible);
};
if(!document.querySelector('script[data-h3-contest-status-admin]')){
  const s=document.createElement('script');
  s.src='admin-contest-status.js?v=1';
  s.dataset.h3ContestStatusAdmin='1';
  document.body.appendChild(s);
}
})();