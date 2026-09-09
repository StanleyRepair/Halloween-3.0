(()=>{
const original=window.renderGallery;
if(typeof original!=='function')return;
window.renderGallery=function(tiles){
  const visible=(tiles||[]).filter(t=>t.type!=='google'||!!String(t.google_url||'').trim());
  return original(visible);
};
})();