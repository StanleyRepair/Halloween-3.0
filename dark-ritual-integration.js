(()=>{
const RITUAL_ID='__dark_ritual__';
const detail=document.getElementById('otherDetail');
const list=document.getElementById('otherTiles');
if(!detail||!list)return;
let assetsPromise=null;

function stop(){window.H3DarkRitual?.unmount?.()}
function ensureAssets(){
  if(window.H3DarkRitual)return Promise.resolve();
  if(assetsPromise)return assetsPromise;
  assetsPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-dark-ritual]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='dark-ritual.css?v=1';l.dataset.darkRitual='1';document.head.appendChild(l);
    }
    const s=document.createElement('script');s.src='dark-ritual.js?v=1';s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  return assetsPromise;
}

function addTile(){
  if(detail.hidden||detail.dataset.currentId!=='__games__')return;
  const menu=detail.querySelector('.other-submenu');
  if(!menu||menu.querySelector('[data-dark-ritual-open]'))return;
  const btn=document.createElement('button');
  btn.type='button';btn.className='other-subtile';btn.dataset.darkRitualOpen='1';
  btn.innerHTML='<span class="other-tile-icon">🔮</span><span><strong>Mroczny rytuał</strong><small>Otwórz</small></span><span class="other-chevron">›</span>';
  menu.appendChild(btn);
}

async function openRitual(){
  stop();
  list.hidden=true;detail.hidden=false;detail.dataset.currentId=RITUAL_ID;
  detail.innerHTML='<button type="button" class="ritual-back other-back-look">← Wróć</button><div class="other-detail ritual-game-detail"><div class="other-detail-head ritual-game-head"><span class="other-detail-icon">🔮</span><h2>Mroczny rytuał</h2><button type="button" class="ritual-fullscreen-button" aria-label="Włącz pełny ekran">⛶</button></div><div id="darkRitualHost"><div class="other-soon">Uruchamianie gry...</div></div></div>';
  try{
    await ensureAssets();
    if(detail.dataset.currentId!==RITUAL_ID)return;
    window.H3DarkRitual?.mount?.(detail.querySelector('#darkRitualHost'));
    detail.querySelector('.ritual-fullscreen-button')?.addEventListener('click',()=>window.H3DarkRitual?.toggleFullscreen?.());
  }catch(e){
    console.warn(e);
    const host=detail.querySelector('#darkRitualHost');if(host)host.innerHTML='<div class="other-soon">Nie udało się uruchomić gry.</div>';
  }
}

function backToGames(){
  stop();
  const games=list.querySelector('[data-other-id="__games__"]');
  if(games){games.click();setTimeout(addTile,0);return}
  document.querySelector('.nav-item[data-tab="other"]')?.click();
}

detail.addEventListener('click',e=>{
  if(e.target.closest('[data-dark-ritual-open]')){e.preventDefault();e.stopPropagation();openRitual();return}
  if(e.target.closest('.ritual-back')){e.preventDefault();e.stopPropagation();backToGames()}
},true);

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{if(detail.dataset.currentId===RITUAL_ID)stop()},true));
new MutationObserver(()=>{if(detail.dataset.currentId===RITUAL_ID&&!detail.querySelector('#darkRitualHost'))stop();addTile()}).observe(detail,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','data-current-id']});
addTile();
})();