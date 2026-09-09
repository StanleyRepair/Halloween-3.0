(()=>{
const view=document.querySelector('[data-view="other"]');if(!view)return;
const list=view.querySelector('#otherTiles'),detail=view.querySelector('#otherDetail');
let data=[],navStack=[];
const GAME_ID='__creepy_pumpkin__';
const gameTile={id:GAME_ID,title:'Creepy Pumpkin',icon:'🎃',body:'',image_path:null,children:[],builtin_game:true};
const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const imageUrl=path=>`${SUPABASE_URL}/storage/v1/object/public/other-images/${String(path||'').split('/').map(encodeURIComponent).join('/')}`;
function hasOwnContent(t){return !!((t.body||'').trim()||t.image_path||t.builtin_game)}
function tileMarkup(t,sub=false){const hasChildren=!!(t.children||[]).length,hasContent=hasOwnContent(t)||hasChildren;return `<button type="button" class="${sub?'other-subtile':'other-tile'}" data-other-id="${t.id}"><span class="other-tile-icon">${esc(t.icon||'📄')}</span><span><strong>${esc(t.title)}</strong><small>${hasContent?'Otwórz':'JUŻ WKRÓTCE.. 🔧'}</small></span><span class="other-chevron">›</span></button>`}
function rootTiles(){return [...(data||[]),gameTile]}
function renderList(){window.CreepyPumpkinGame?.unmount?.();navStack=[];detail.dataset.currentId='';detail.hidden=true;list.hidden=false;list.innerHTML=rootTiles().map(t=>tileMarkup(t)).join('')||'<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>'}
function findTile(id){if(id===GAME_ID)return gameTile;for(const r of data){if(r.id===id)return r;const c=(r.children||[]).find(x=>x.id===id);if(c)return c}return null}
function showGame(tile,push=true){if(push&&detail.dataset.currentId)navStack.push(detail.dataset.currentId);list.hidden=true;detail.hidden=false;detail.dataset.currentId=tile.id;detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail"><div class="other-detail-head"><span class="other-detail-icon">🎃</span><h2>Creepy Pumpkin</h2></div><div id="creepyPumpkinHost"></div></div>`;window.CreepyPumpkinGame?.mount?.(detail.querySelector('#creepyPumpkinHost'))}
function showTile(tile,push=true){window.CreepyPumpkinGame?.unmount?.();if(tile.builtin_game)return showGame(tile,push);if(push&&detail.dataset.currentId)navStack.push(detail.dataset.currentId);list.hidden=true;detail.hidden=false;detail.dataset.currentId=tile.id;const parts=[];if((tile.body||'').trim())parts.push(`<div class="other-detail-body">${esc(tile.body)}</div>`);if(tile.image_path)parts.push(`<img class="other-detail-image" src="${imageUrl(tile.image_path)}" alt="${esc(tile.title)}">`);if((tile.children||[]).length)parts.push(`<div class="other-submenu">${tile.children.map(c=>tileMarkup(c,true)).join('')}</div>`);const inner=parts.length?parts.join(''):'<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>';detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail"><div class="other-detail-head"><span class="other-detail-icon">${esc(tile.icon||'📄')}</span><h2>${esc(tile.title)}</h2></div>${inner}</div>`}
function goBack(){window.CreepyPumpkinGame?.unmount?.();if(navStack.length){const prev=findTile(navStack.pop());if(prev)return showTile(prev,false)}renderList()}
async function loadOther(){window.CreepyPumpkinGame?.unmount?.();list.innerHTML='<div class="other-soon">Ładowanie...</div>';try{const{data:d,error}=await sb.rpc('get_other_tiles');if(error)throw error;data=d||[];renderList()}catch(e){console.warn(e);data=[];renderList()}}
view.addEventListener('click',e=>{const b=e.target.closest('[data-other-id]');if(b){const t=findTile(b.dataset.otherId);if(t)showTile(t,true);return}if(e.target.closest('.other-back'))goBack()});
document.querySelector('.nav-item[data-tab="other"]')?.addEventListener('click',loadOther);
document.querySelectorAll('.nav-item:not([data-tab="other"])').forEach(b=>b.addEventListener('click',()=>window.CreepyPumpkinGame?.unmount?.()));
if(location.hash==='#other')setTimeout(()=>document.querySelector('.nav-item[data-tab="other"]')?.click(),0);
})();