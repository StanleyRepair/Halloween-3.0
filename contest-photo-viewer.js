(()=>{
const HOLD_MS=460,MOVE_CANCEL=14;
let holdTimer=null,holdX=0,holdY=0,holdTarget=null,suppressClickUntil=0;
let viewer=null,stage=null,viewerImg=null,count=null,help=null,photos=[],index=0;
let scale=1,tx=0,ty=0,startScale=1,startDist=0,startX=0,startY=0,startTx=0,startTy=0,lastTap=0,touchMode='none',viewerHistoryActive=false;

function ensureStyle(){
  if(document.getElementById('contestPhotoViewerStyle'))return;
  const s=document.createElement('style');
  s.id='contestPhotoViewerStyle';
  s.textContent=`#contestPhotoViewer[hidden]{display:none!important}#contestPhotoViewer{position:fixed;inset:0;z-index:2600;background:rgba(0,0,0,.97);display:flex;flex-direction:column;overscroll-behavior:contain;touch-action:none;-webkit-user-select:none;user-select:none}.contest-photo-viewer-top{position:absolute;top:calc(env(safe-area-inset-top) + 10px);left:10px;right:10px;z-index:4;display:flex;align-items:center;justify-content:space-between;pointer-events:none}.contest-photo-viewer-close,.contest-photo-viewer-count{pointer-events:auto}.contest-photo-viewer-close{width:44px;height:44px;border-radius:50%;border:1px solid #6f3b22;background:#160d09dd;color:#ffe7c5;font-size:28px;line-height:1}.contest-photo-viewer-count{padding:8px 11px;border-radius:999px;border:1px solid #4e2d1d;background:#120b08cc;color:#d8b99f;font:700 11px Inter,system-ui,sans-serif}.contest-photo-viewer-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;overscroll-behavior:none}.contest-photo-viewer-stage img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;transform-origin:center center;will-change:transform;pointer-events:none}.contest-photo-viewer-help{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 18px);transform:translateX(-50%);z-index:3;width:max-content;max-width:calc(100% - 32px);padding:8px 12px;border-radius:999px;background:#120b08cc;border:1px solid #4a2b1b;color:#a98e79;font:600 10px/1.3 Inter,system-ui,sans-serif;text-align:center;transition:opacity .3s ease}.contest-photo-viewer-help.fade{opacity:0}.contest-photo-viewer-arrow{position:absolute;top:50%;z-index:3;transform:translateY(-50%);width:42px;height:54px;border:0;border-radius:12px;background:#120b08aa;color:#ffad58;font-size:28px}.contest-photo-viewer-prev{left:8px}.contest-photo-viewer-next{right:8px}@media(max-width:520px){.contest-photo-viewer-arrow{display:none}}`;
  document.head.appendChild(s);
}

function ensureViewer(){
  if(viewer)return;
  ensureStyle();
  viewer=document.createElement('div');
  viewer.id='contestPhotoViewer';
  viewer.hidden=true;
  viewer.innerHTML='<div class="contest-photo-viewer-top"><button class="contest-photo-viewer-close" type="button" aria-label="Zamknij">×</button><div class="contest-photo-viewer-count"></div></div><div class="contest-photo-viewer-stage"><img alt="Zdjęcie konkursowe"></div><button class="contest-photo-viewer-arrow contest-photo-viewer-prev" type="button" aria-label="Poprzednie zdjęcie">‹</button><button class="contest-photo-viewer-arrow contest-photo-viewer-next" type="button" aria-label="Następne zdjęcie">›</button><div class="contest-photo-viewer-help">Przesuń palcem, aby zmienić zdjęcie. Zbliż dwoma palcami.</div>';
  document.body.appendChild(viewer);
  stage=viewer.querySelector('.contest-photo-viewer-stage');
  viewerImg=viewer.querySelector('img');
  count=viewer.querySelector('.contest-photo-viewer-count');
  help=viewer.querySelector('.contest-photo-viewer-help');
  viewer.querySelector('.contest-photo-viewer-close').onclick=requestClose;
  viewer.querySelector('.contest-photo-viewer-prev').onclick=()=>change(-1);
  viewer.querySelector('.contest-photo-viewer-next').onclick=()=>change(1);
  viewer.addEventListener('click',e=>{if(e.target===viewer)requestClose()});
  bindGestures();
}

function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function apply(){if(viewerImg)viewerImg.style.transform=`translate3d(${tx}px,${ty}px,0) scale(${scale})`}
function reset(){scale=1;tx=0;ty=0;touchMode='none';apply()}
function collect(start){photos=[...document.querySelectorAll('#contestGrid .candidate-card img')];if(!photos.length)photos=[start];index=Math.max(0,photos.indexOf(start))}
function update(){const p=photos[index];if(!p)return;viewerImg.src=p.currentSrc||p.src;viewerImg.alt=p.alt||'Zdjęcie konkursowe';count.textContent=`${index+1} / ${photos.length}`;reset()}
function openViewer(start){ensureViewer();collect(start);update();viewer.hidden=false;document.body.style.overflow='hidden';help.classList.remove('fade');setTimeout(()=>{if(!viewer.hidden)help.classList.add('fade')},2600);if(!viewerHistoryActive){try{history.pushState({...history.state,h3ContestPhotoViewer:true},'',location.href);viewerHistoryActive=true}catch{viewerHistoryActive=false}}}
function closeVisual(){if(!viewer||viewer.hidden)return;viewer.hidden=true;viewerImg.removeAttribute('src');photos=[];document.body.style.overflow='';viewerHistoryActive=false;reset()}
function requestClose(){if(!viewer||viewer.hidden)return;if(viewerHistoryActive&&history.state?.h3ContestPhotoViewer)history.back();else closeVisual()}
function change(dir){if(!photos.length)return;index=(index+dir+photos.length)%photos.length;update()}
function distance(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}

function bindGestures(){
  stage.addEventListener('touchstart',e=>{
    e.stopPropagation();
    if(e.touches.length===2){e.preventDefault();touchMode='pinch';startDist=distance(e.touches[0],e.touches[1])||1;startScale=scale;startTx=tx;startTy=ty;return}
    if(e.touches.length===1){const t=e.touches[0];startX=t.clientX;startY=t.clientY;startTx=tx;startTy=ty;touchMode=scale>1?'pan':'swipe';const now=Date.now();if(now-lastTap<300){e.preventDefault();scale=scale>1?1:2;tx=0;ty=0;apply();touchMode='none'}lastTap=now}
  },{passive:false});
  stage.addEventListener('touchmove',e=>{
    e.stopPropagation();e.preventDefault();
    if(e.touches.length===2){const d=distance(e.touches[0],e.touches[1])||1;scale=clamp(startScale*d/startDist,1,5);if(scale===1){tx=0;ty=0}apply();return}
    if(e.touches.length===1&&touchMode==='pan'&&scale>1){const t=e.touches[0];tx=startTx+(t.clientX-startX);ty=startTy+(t.clientY-startY);apply()}
  },{passive:false});
  stage.addEventListener('touchend',e=>{
    e.stopPropagation();
    if(e.touches.length)return;
    if(touchMode==='swipe'&&e.changedTouches.length){const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.15)change(dx<0?1:-1)}
    touchMode='none';
  },{passive:false});
  stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;e.preventDefault();startX=e.clientX;startY=e.clientY;startTx=tx;startTy=ty;touchMode=scale>1?'pan':'swipe';stage.setPointerCapture?.(e.pointerId)});
  stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||touchMode!=='pan'||scale<=1)return;tx=startTx+(e.clientX-startX);ty=startTy+(e.clientY-startY);apply()});
  stage.addEventListener('pointerup',e=>{if(e.pointerType==='touch')return;if(touchMode==='swipe'){const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.15)change(dx<0?1:-1)}touchMode='none'});
  stage.addEventListener('wheel',e=>{e.preventDefault();scale=clamp(scale*(e.deltaY<0?1.15:.87),1,5);if(scale===1){tx=0;ty=0}apply()},{passive:false});
}

function cancelHold(){if(holdTimer){clearTimeout(holdTimer);holdTimer=null}holdTarget=null}
document.addEventListener('pointerdown',e=>{
  const target=e.target.closest?.('#contestGrid .candidate-card img');
  if(!target||e.pointerType==='mouse'&&e.button!==0)return;
  cancelHold();holdTarget=target;holdX=e.clientX;holdY=e.clientY;
  holdTimer=setTimeout(()=>{const t=holdTarget;holdTimer=null;holdTarget=null;if(!t)return;suppressClickUntil=Date.now()+1000;try{navigator.vibrate?.(18)}catch{}openViewer(t)},HOLD_MS);
},{passive:true});
document.addEventListener('pointermove',e=>{if(holdTimer&&Math.hypot(e.clientX-holdX,e.clientY-holdY)>MOVE_CANCEL)cancelHold()},{passive:true});
document.addEventListener('pointerup',cancelHold,{passive:true});
document.addEventListener('pointercancel',cancelHold,{passive:true});
document.addEventListener('contextmenu',e=>{if(e.target.closest?.('#contestGrid .candidate-card img'))e.preventDefault()});
document.addEventListener('click',e=>{if(Date.now()>=suppressClickUntil)return;const card=e.target.closest?.('#contestGrid .candidate-card');if(!card)return;e.preventDefault();e.stopImmediatePropagation()},true);
window.addEventListener('popstate',()=>{if(viewer&&!viewer.hidden)closeVisual()});
document.addEventListener('keydown',e=>{if(!viewer||viewer.hidden)return;if(e.key==='Escape')requestClose();if(e.key==='ArrowLeft')change(-1);if(e.key==='ArrowRight')change(1)});
})();
