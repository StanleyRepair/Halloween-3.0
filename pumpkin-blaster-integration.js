(()=>{
const GAME_ID='__pumpkin_blaster__';
const detail=document.getElementById('otherDetail');
const list=document.getElementById('otherTiles');
if(!detail||!list)return;
let assetsPromise=null;
function stop(){window.H3PumpkinBlaster?.unmount?.()}
function ensureAssets(){
  if(window.H3PumpkinBlaster)return Promise.resolve();
  if(assetsPromise)return assetsPromise;
  assetsPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-pumpkin-blaster]')){const l=document.createElement('link');l.rel='stylesheet';l.href='pumpkin-blaster.css?v=1';l.dataset.pumpkinBlaster='1';document.head.appendChild(l)}
    const s=document.createElement('script');s.src='pumpkin-blaster-v2.js?v=3';s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)
  });
  return assetsPromise;
}
function addTile(){
  if(detail.hidden||detail.dataset.currentId!=='__games__')return;
  const menu=detail.querySelector('.other-submenu');if(!menu||menu.querySelector('[data-pumpkin-blaster-open]'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='other-subtile';btn.dataset.pumpkinBlasterOpen='1';btn.innerHTML='<span class="other-tile-icon">🎯</span><span><strong>Pumpkin Blaster</strong><small>Otwórz</small></span><span class="other-chevron">›</span>';menu.appendChild(btn)
}
async function openGame(){
  stop();list.hidden=true;detail.hidden=false;detail.dataset.currentId=GAME_ID;
  detail.innerHTML='<button type="button" class="other-back blaster-back">← Wróć</button><div class="other-detail blaster-game-detail"><div class="other-detail-head blaster-game-head"><span class="other-detail-icon">🎯</span><h2>Pumpkin Blaster</h2><button type="button" class="blaster-fullscreen-button" aria-label="Włącz pełny ekran">⛶</button></div><div id="pumpkinBlasterHost"><div class="other-soon">Uruchamianie gry...</div></div></div>';
  try{await ensureAssets();if(detail.dataset.currentId!==GAME_ID)return;window.H3PumpkinBlaster?.mount?.(detail.querySelector('#pumpkinBlasterHost'));detail.querySelector('.blaster-fullscreen-button')?.addEventListener('click',()=>window.H3PumpkinBlaster?.toggleFullscreen?.())}
  catch(e){console.warn(e);const h=detail.querySelector('#pumpkinBlasterHost');if(h)h.innerHTML='<div class="other-soon">Nie udało się uruchomić gry.</div>'}
}
function backToGames(){stop();const games=list.querySelector('[data-other-id="__games__"]');if(games){games.click();setTimeout(addTile,0);return}document.querySelector('.nav-item[data-tab="other"]')?.click()}
detail.addEventListener('click',e=>{if(e.target.closest('[data-pumpkin-blaster-open]')){e.preventDefault();e.stopPropagation();openGame();return}if(e.target.closest('.blaster-back')){e.preventDefault();e.stopPropagation();backToGames()}},true);
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{if(detail.dataset.currentId===GAME_ID)stop()},true));
new MutationObserver(()=>{if(detail.dataset.currentId===GAME_ID&&!detail.querySelector('#pumpkinBlasterHost'))stop();addTile()}).observe(detail,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','data-current-id']});
addTile();
})();
