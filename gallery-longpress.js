(()=>{
let timer=null,startX=0,startY=0,activeWrap=null,suppressUntil=0;
const HOLD_MS=460,MOVE_CANCEL=14;
function closeMenus(except=null){document.querySelectorAll('.gallery-photo-item .photo-reaction-ui.open').forEach(ui=>{if(ui===except)return;ui.classList.remove('open');const m=ui.querySelector('.photo-reactions');if(m)m.hidden=true;ui.closest('.gallery-photo-item')?.classList.remove('reaction-hold')})}
function cancelHold(){if(timer){clearTimeout(timer);timer=null}if(activeWrap&&!activeWrap.querySelector('.photo-reaction-ui.open'))activeWrap.classList.remove('reaction-hold');activeWrap=null}
function openFor(wrap){const ui=wrap?.querySelector('.photo-reaction-ui'),menu=ui?.querySelector('.photo-reactions');if(!ui||!menu)return;closeMenus(ui);ui.classList.add('open');menu.hidden=false;wrap.classList.add('reaction-hold');suppressUntil=Date.now()+900;try{navigator.vibrate?.(18)}catch{} }
document.addEventListener('pointerdown',e=>{const img=e.target.closest?.('.gallery-photo-item>img');if(!img||e.pointerType==='mouse'&&e.button!==0)return;cancelHold();activeWrap=img.closest('.gallery-photo-item');startX=e.clientX;startY=e.clientY;timer=setTimeout(()=>{timer=null;openFor(activeWrap)},HOLD_MS)},{passive:true});
document.addEventListener('pointermove',e=>{if(!timer)return;if(Math.hypot(e.clientX-startX,e.clientY-startY)>MOVE_CANCEL)cancelHold()},{passive:true});
document.addEventListener('pointerup',cancelHold,{passive:true});document.addEventListener('pointercancel',cancelHold,{passive:true});
document.addEventListener('contextmenu',e=>{if(e.target.closest?.('.gallery-photo-item>img'))e.preventDefault()});
document.addEventListener('click',e=>{const img=e.target.closest?.('.gallery-photo-item>img');if(img&&Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();return}if(!e.target.closest?.('.gallery-photo-item .photo-reaction-ui'))closeMenus()},true);
document.addEventListener('click',e=>{const r=e.target.closest?.('.gallery-photo-item .photo-reaction');if(!r)return;setTimeout(()=>{r.closest('.gallery-photo-item')?.classList.remove('reaction-hold')},80)},false);
})();