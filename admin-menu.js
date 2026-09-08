(()=>{
const dashboard=document.getElementById('dashboard');if(!dashboard)return;
const identity=document.getElementById('identity');
const children=[...dashboard.children];
const findCard=title=>children.find(el=>el.matches('section.card')&&el.querySelector('h2')?.textContent.trim()===title);
const upgrade=document.getElementById('upgradeCard');
const stats=children.find(el=>el.classList?.contains('stats'));
const phase=children.find(el=>el.matches('section.card')&&el.querySelector('.phase-grid'));
const edit=children.find(el=>el.matches('section.card')&&el.querySelector('#allowEdit'));
const news=findCard('Aktualności');
const photos=findCard('Zdjęcia');
const superSection=document.getElementById('superSection');
const entries=findCard('Zgłoszenia');
const audit=findCard('Historia zmian');
const groups={
 contest:[stats,phase,edit,entries].filter(Boolean),
 news:[news].filter(Boolean),
 photos:[photos].filter(Boolean),
 admins:[upgrade,superSection].filter(Boolean),
 audit:[audit].filter(Boolean)
};
const menu=document.createElement('div');menu.className='admin-menu';menu.innerHTML=`
<button class="admin-menu-tile" data-admin-open="contest"><span class="admin-menu-icon">🏆</span><span><span class="admin-menu-title">Konkurs</span><span class="admin-menu-desc">Etap konkursu, zgłoszenia i głosy</span></span></button>
<button class="admin-menu-tile" data-admin-open="news"><span class="admin-menu-icon">📰</span><span><span class="admin-menu-title">Aktualności</span><span class="admin-menu-desc">Dodawanie, zdjęcia, przypinanie i kolejność</span></span></button>
<button class="admin-menu-tile" data-admin-open="photos"><span class="admin-menu-icon">📸</span><span><span class="admin-menu-title">Zdjęcia</span><span class="admin-menu-desc">Foldery, galerie i album Google Photos</span></span></button>
<button class="admin-menu-tile" data-admin-open="admins"><span class="admin-menu-icon">🛡️</span><span><span class="admin-menu-title">Administratorzy</span><span class="admin-menu-desc">Uprawnienia, kody i urządzenia</span></span></button>
<button class="admin-menu-tile" data-admin-open="audit"><span class="admin-menu-icon">📜</span><span><span class="admin-menu-title">Historia zmian</span><span class="admin-menu-desc">Kto i kiedy zmieniał ustawienia</span></span></button>`;
if(identity)identity.insertAdjacentElement('afterend',menu);else dashboard.prepend(menu);
const labels={contest:'Konkurs',news:'Aktualności',photos:'Zdjęcia',admins:'Administratorzy',audit:'Historia zmian'};
for(const [key,els] of Object.entries(groups)){
 const panel=document.createElement('div');panel.className='admin-function-panel';panel.dataset.adminPanel=key;
 const head=document.createElement('div');head.className='admin-function-head';head.innerHTML=`<button class="admin-function-back" type="button" aria-label="Wróć do menu">←</button><h2 class="admin-function-heading">${labels[key]}</h2>`;
 panel.appendChild(head);
 const anchor=els[0];if(anchor)anchor.parentNode.insertBefore(panel,anchor);
 els.forEach(el=>panel.appendChild(el));
}
function showMenu(){document.querySelectorAll('.admin-function-panel').forEach(p=>p.classList.remove('active'));menu.hidden=false;window.scrollTo({top:0,behavior:'smooth'});history.replaceState(null,'',location.pathname+location.search)}
function openPanel(key){const panel=document.querySelector(`.admin-function-panel[data-admin-panel="${key}"]`);if(!panel)return;menu.hidden=true;document.querySelectorAll('.admin-function-panel').forEach(p=>p.classList.toggle('active',p===panel));panel.scrollIntoView({block:'start'});history.replaceState(null,'',`#admin-${key}`)}
menu.addEventListener('click',e=>{const b=e.target.closest('[data-admin-open]');if(b)openPanel(b.dataset.adminOpen)});
document.addEventListener('click',e=>{if(e.target.closest('.admin-function-back'))showMenu()});
function restore(){const m=location.hash.match(/^#admin-(contest|news|photos|admins|audit)$/);if(m&& !dashboard.hidden)openPanel(m[1]);else showMenu()}
new MutationObserver(()=>{if(!dashboard.hidden)restore()}).observe(dashboard,{attributes:true,attributeFilter:['hidden']});
if(!dashboard.hidden)restore();
})();