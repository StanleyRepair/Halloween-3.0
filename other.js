(()=>{
const view=document.querySelector('[data-view="other"]');if(!view)return;
const list=view.querySelector('#otherTiles'),detail=view.querySelector('#otherDetail');
let data=[];
const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const imageUrl=path=>`${SUPABASE_URL}/storage/v1/object/public/other-images/${String(path||'').split('/').map(encodeURIComponent).join('/')}`;
function hasOwnContent(t){return !!((t.body||'').trim()||t.image_path)}
function tileMarkup(t,sub=false){const hasChildren=!!(t.children||[]).length,hasContent=hasOwnContent(t)||hasChildren;return `<button type="button" class="${sub?'other-subtile':'other-tile'}" data-other-id="${t.id}"><span class="other-tile-icon">${esc(t.icon||'📄')}</span><span><strong>${esc(t.title)}</strong><small>${hasContent?'Otwórz':'JUŻ WKRÓTCE.. 🔧'}</small></span><span class="other-chevron">›</span></button>`}
function renderList(){detail.hidden=true;list.hidden=false;list.innerHTML=(data||[]).map(t=>tileMarkup(t)).join('')||'<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>'}
function findTile(id){for(const r of data){if(r.id===id)return r;const c=(r.children||[]).find(x=>x.id===id);if(c)return c}return null}
function showTile(tile){list.hidden=true;detail.hidden=false;const parts=[];if((tile.body||'').trim())parts.push(`<div class="other-detail-body">${esc(tile.body)}</div>`);if(tile.image_path)parts.push(`<img class="other-detail-image" src="${imageUrl(tile.image_path)}" alt="${esc(tile.title)}">`);if((tile.children||[]).length)parts.push(`<div class="other-submenu">${tile.children.map(c=>tileMarkup(c,true)).join('')}</div>`);const inner=parts.length?parts.join(''):'<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>';detail.innerHTML=`<button type="button" class="other-back">← Wróć</button><div class="other-detail"><div class="other-detail-head"><span class="other-detail-icon">${esc(tile.icon||'📄')}</span><h2>${esc(tile.title)}</h2></div>${inner}</div>`}
async function loadOther(){list.innerHTML='<div class="other-soon">Ładowanie...</div>';try{const{data:d,error}=await sb.rpc('get_other_tiles');if(error)throw error;data=d||[];renderList()}catch(e){console.warn(e);list.innerHTML='<div class="other-soon">JUŻ WKRÓTCE.. 🔧</div>'}}
view.addEventListener('click',e=>{const b=e.target.closest('[data-other-id]');if(b){const t=findTile(b.dataset.otherId);if(t)showTile(t);return}if(e.target.closest('.other-back'))renderList()});
document.querySelector('.nav-item[data-tab="other"]')?.addEventListener('click',loadOther);
if(location.hash==='#other')setTimeout(()=>document.querySelector('.nav-item[data-tab="other"]')?.click(),0);
})();