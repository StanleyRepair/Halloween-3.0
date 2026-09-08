(()=>{
const hint=document.getElementById('chromeHint');if(!hint)return;
const ua=navigator.userAgent||'';
const inApp=/FBAN|FBAV|FB_IAB|Messenger|Instagram/i.test(ua);
const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
if(!inApp||standalone)return;
setTimeout(()=>{
  if(!document.body.contains(hint))return;
  hint.hidden=false;
  requestAnimationFrame(()=>hint.classList.add('show'));
},1250);
})();