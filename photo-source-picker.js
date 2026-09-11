(()=>{
const knownIds=new Set(['galleryInput','cameraInput','newNewsImage','photoEntryPhoto']);
const imageExt=/\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;

function isPhotoInput(input){
  if(!(input instanceof HTMLInputElement)||input.type!=='file')return false;
  const accept=String(input.getAttribute('accept')||'').toLowerCase();
  return knownIds.has(input.id)||input.hasAttribute('data-upload')||accept.includes('image');
}

function relax(input){
  if(!isPhotoInput(input))return;
  input.dataset.h3PhotoSource='system';
  input.removeAttribute('capture');
  input.removeAttribute('accept');
}

function scan(root=document){
  if(root instanceof HTMLInputElement)relax(root);
  root.querySelectorAll?.('input[type="file"]').forEach(relax);
}

function simplifyContestPicker(){
  const gallery=document.getElementById('galleryInput');
  const camera=document.getElementById('cameraInput');
  const actions=gallery?.closest('.photo-actions');
  if(!gallery||!actions||actions.dataset.h3UniversalPicker==='1')return;
  actions.dataset.h3UniversalPicker='1';
  const label=gallery.closest('label');
  if(label){
    label.textContent='📎 Dodaj zdjęcie';
    label.appendChild(gallery);
    label.style.gridColumn='1 / -1';
  }
  camera?.closest('label')?.remove();
}

function validImage(file){
  if(!file)return false;
  const type=String(file.type||'').toLowerCase();
  if(type.startsWith('image/'))return true;
  if(!type||type==='application/octet-stream')return imageExt.test(String(file.name||''));
  return false;
}

function notifyInvalid(){
  const text='Wybierz plik ze zdjęciem. Filmy i inne typy plików nie są obsługiwane.';
  if(window.H3Toast?.warning)return window.H3Toast.warning(text);
  try{if(typeof window.msg==='function')return window.msg(text,true)}catch{}
  if(typeof window.alert==='function')window.alert(text);
}

document.addEventListener('change',e=>{
  const input=e.target;
  if(!(input instanceof HTMLInputElement)||input.dataset.h3PhotoSource!=='system')return;
  const files=[...(input.files||[])];
  if(!files.length)return;
  if(files.every(validImage))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  input.value='';
  notifyInvalid();
},true);

function init(){scan(document);simplifyContestPicker()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

const observer=new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)scan(node);
  simplifyContestPicker();
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
})();
