(()=>{
const DASH_ID='__halloween_dash__';
const detail=document.getElementById('otherDetail');
const list=document.getElementById('otherTiles');
if(!detail||!list)return;
let assetsPromise=null;

function stop(){window.H3HalloweenDash?.unmount?.()}
function ensureAssets(){
  if(window.H3HalloweenDash)return Promise.resolve();
  if(assetsPromise)return assetsPromise;
  assetsPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-halloween-dash]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='halloween-dash.css?v=1';l.dataset.halloweenDash='1';document.head.appendChild(l);
    }
    const s=document.createElement('script');s.src='halloween-dash.js?v=1';s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  return assetsPromise;
}

function addTile(){
  if(detail.hidden||detail.dataset.currentId!=='__games__')return;
  const menu=detail.querySelector('.other-submenu');
  if(!menu||menu.querySelector('[data-halloween-dash-open]'))return;
  const btn=document.createElement('button');
  btn.type='button';btn.className='other-subtile';btn.dataset.halloweenDashOpen='1';
  btn.innerHTML='<span class="other-tile-icon">🎃</span><span><strong>Halloween Dash</strong><small>Otwórz</small></span><span class="other-chevron">›</span>';
  menu.appendChild(btn);
}

async function openDash(){
  stop();
  list.hidden=true;detail.hidden=false;detail.dataset.currentId=DASH_ID;
  detail.innerHTML='<button type="button" class="dash-back other-back-look">← Wróć</button><div class="other-detail dash-game-detail"><div class="other-detail-head dash-game-head"><span class="other-detail-icon">🎃</span><h2>Halloween Dash</h2><button type="button" class="dash-fullscreen-button" aria-label="Włącz pełny ekran">⛶</button></div><div id="halloweenDashHost"><div class="other-soon">Uruchamianie gry...</div></div></div>';
  try{
    await ensureAssets();
    if(detail.dataset.currentId!==DASH_ID)return;
    window.H3HalloweenDash?.mount?.(detail.querySelector('#halloweenDashHost'));
    detail.querySelector('.dash-fullscreen-button')?.addEventListener('click',()=>window.H3HalloweenDash?.toggleFullscreen?.());
  }catch(e){
    console.warn(e);
    const host=detail.querySelector('#halloweenDashHost');if(host)host.innerHTML='<div class="other-soon">Nie udało się uruchomić gry.</div>';
  }
}

function backToGames(){
  stop();
  const games=list.querySelector('[data-other-id="__games__"]');
  if(games){games.click();setTimeout(addTile,0);return}
  document.querySelector('.nav-item[data-tab="other"]')?.click();
}

detail.addEventListener('click',e=>{
  if(e.target.closest('[data-halloween-dash-open]')){e.preventDefault();e.stopPropagation();openDash();return}
  if(e.target.closest('.dash-back')){e.preventDefault();e.stopPropagation();backToGames()}
},true);

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{if(detail.dataset.currentId===DASH_ID)stop()},true));
new MutationObserver(()=>{if(detail.dataset.currentId===DASH_ID&&!detail.querySelector('#halloweenDashHost'))stop();addTile()}).observe(detail,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','data-current-id']});
addTile();
})();