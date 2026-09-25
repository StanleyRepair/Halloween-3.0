(()=>{
'use strict';
const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.min.mjs';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs';
let libPromise=null;
let active=null;

function loadPdfJs(){
  if(libPromise)return libPromise;
  libPromise=import(PDFJS_URL).then(lib=>{
    lib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
    return lib;
  });
  return libPromise;
}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function safeName(name){return String(name||'dokument.pdf').replace(/[\\/:*?"<>|]+/g,'_').slice(0,160)||'dokument.pdf'}
function downloadUrl(url,name){
  const u=new URL(url,location.href);
  u.searchParams.set('download',safeName(name));
  return u.href;
}
function download(url,name,onDownload){
  try{onDownload?.()}catch{}
  const a=document.createElement('a');
  a.href=downloadUrl(url,name);
  a.target='_blank';
  a.rel='noopener';
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
async function renderCanvas(pdf,pageNumber,canvas,cssWidth,resolution){
  const page=await pdf.getPage(pageNumber);
  const unit=page.getViewport({scale:1});
  const width=Math.max(120,cssWidth||320);
  const cssScale=width/unit.width;
  const quality=Math.min(Math.max(Number(resolution)||1,1),2);
  const viewport=page.getViewport({scale:cssScale*quality});
  canvas.width=Math.max(1,Math.floor(viewport.width));
  canvas.height=Math.max(1,Math.floor(viewport.height));
  canvas.style.width=Math.round(unit.width*cssScale)+'px';
  canvas.style.height=Math.round(unit.height*cssScale)+'px';
  canvas.hidden=false;
  await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport}).promise;
}
async function createStack(pdf,container,options={}){
  const cleanup=[];
  const count=pdf.numPages;
  const root=options.root||null;
  const resolution=options.resolution||1.15;
  for(let i=1;i<=count;i++){
    const page=await pdf.getPage(i);
    const unit=page.getViewport({scale:1});
    const wrap=document.createElement('div');
    wrap.className='h3-pdf-page';
    wrap.dataset.page=String(i);
    wrap.style.aspectRatio=unit.width+' / '+unit.height;
    const canvas=document.createElement('canvas');
    canvas.hidden=true;
    const badge=document.createElement('span');
    badge.className='h3-pdf-page-number';
    badge.textContent=String(i);
    wrap.append(canvas,badge);
    if(options.onPageClick){
      wrap.classList.add('is-clickable');
      wrap.tabIndex=0;
      wrap.setAttribute('role','button');
      wrap.setAttribute('aria-label','Otwórz stronę '+i+' na pełnym ekranie');
      wrap.addEventListener('click',()=>options.onPageClick(i));
      wrap.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();options.onPageClick(i)}});
    }
    container.appendChild(wrap);
  }
  const pages=[...container.querySelectorAll('.h3-pdf-page')];
  const renderOne=async el=>{
    if(el.dataset.rendering||el.dataset.rendered)return;
    el.dataset.rendering='1';
    try{
      const innerWidth=Math.max(220,el.clientWidth||container.clientWidth||320);
      await renderCanvas(pdf,Number(el.dataset.page),el.querySelector('canvas'),innerWidth,resolution);
      el.dataset.rendered='1';
      el.classList.add('is-rendered');
    }catch(err){
      console.warn('PDF page render failed',err);
      el.classList.add('is-error');
      el.innerHTML='<div class="h3-pdf-page-error">Nie udało się wyświetlić tej strony.</div>';
    }finally{
      delete el.dataset.rendering;
    }
  };
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){renderOne(entry.target);observer.unobserve(entry.target)}});
    },{root,rootMargin:'900px 0px',threshold:.01});
    pages.forEach(p=>observer.observe(p));
    cleanup.push(()=>observer.disconnect());
  }else{
    pages.forEach(renderOne);
  }
  if(pages[0])renderOne(pages[0]);
  return ()=>cleanup.forEach(fn=>fn());
}
function pageAtCenter(scroller,stack){
  const center=scroller.scrollTop+scroller.clientHeight/2;
  let best=1,dist=Infinity;
  stack.querySelectorAll('.h3-pdf-page').forEach(el=>{
    const d=Math.abs((el.offsetTop+el.offsetHeight/2)-center);
    if(d<dist){dist=d;best=Number(el.dataset.page)||1}
  });
  return best;
}
function openFullscreen(state,startPage){
  if(active)active.close(true);
  const overlay=document.createElement('div');
  overlay.className='h3-pdf-fullscreen';
  overlay.innerHTML='<div class="h3-pdf-fullbar"><button type="button" class="h3-pdf-close" aria-label="Zamknij">×</button><div class="h3-pdf-fulltitle"><strong></strong><span class="h3-pdf-counter"></span></div><div class="h3-pdf-fullactions"></div></div><div class="h3-pdf-full-scroll"><div class="h3-pdf-full-stage"><div class="h3-pdf-stack h3-pdf-full-stack"></div></div></div><div class="h3-pdf-zoom-hint">Przybliż dwoma palcami lub stuknij dwa razy</div>';
  overlay.querySelector('.h3-pdf-fulltitle strong').textContent=state.title||'Dokument';
  const actions=overlay.querySelector('.h3-pdf-fullactions');
  if(state.downloadEnabled){
    const b=document.createElement('button');
    b.type='button';b.className='h3-pdf-download compact';b.textContent='⇩';
    b.setAttribute('aria-label','Pobierz PDF');
    b.onclick=()=>download(state.url,state.fileName,state.onDownload);
    actions.appendChild(b);
  }
  document.body.appendChild(overlay);
  document.body.classList.add('h3-pdf-open');
  const scroller=overlay.querySelector('.h3-pdf-full-scroll');
  const stage=overlay.querySelector('.h3-pdf-full-stage');
  const stack=overlay.querySelector('.h3-pdf-full-stack');
  const counter=overlay.querySelector('.h3-pdf-counter');
  const baseWidth=Math.max(260,Math.min(920,window.innerWidth-16));
  let zoom=1,pinchStartDist=0,pinchStartZoom=1,pinchCenter=null,pinching=false,lastTap=0,lastTapX=0,lastTapY=0,suppressTapUntil=0,stackCleanup=()=>{},scrollTick=0,closed=false,pushed=false;
  stage.style.width=baseWidth+'px';
  function applyZoom(next,cx,cy){
    next=clamp(next,1,3.25);
    const old=zoom;
    if(Math.abs(next-old)<.001)return;
    const rect=scroller.getBoundingClientRect();
    const x=cx==null?rect.width/2:cx-rect.left;
    const y=cy==null?rect.height/2:cy-rect.top;
    const contentX=scroller.scrollLeft+x;
    const contentY=scroller.scrollTop+y;
    zoom=next;
    stage.style.width=Math.round(baseWidth*zoom)+'px';
    scroller.scrollLeft=Math.max(0,contentX*(zoom/old)-x);
    scroller.scrollTop=Math.max(0,contentY*(zoom/old)-y);
    overlay.classList.toggle('is-zoomed',zoom>1.01);
  }
  function distance(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}
  function midpoint(a,b){return{x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2}}
  function onTouchStart(e){
    if(e.touches.length===2){
      pinching=true;suppressTapUntil=Date.now()+350;
      pinchStartDist=distance(e.touches[0],e.touches[1]);
      pinchStartZoom=zoom;pinchCenter=midpoint(e.touches[0],e.touches[1]);
      e.preventDefault();
    }
  }
  function onTouchMove(e){
    if(pinching&&e.touches.length===2){
      const d=distance(e.touches[0],e.touches[1]);
      const c=midpoint(e.touches[0],e.touches[1]);
      applyZoom(pinchStartZoom*(d/Math.max(1,pinchStartDist)),c.x,c.y);
      e.preventDefault();
    }
  }
  function onTouchEnd(e){
    if(pinching&&e.touches.length<2){
      pinching=false;
      zoom=clamp(zoom,1,3.25);
    }
  }
  function onPointerUp(e){
    if(e.pointerType!=='touch'||Date.now()<suppressTapUntil)return;
    const now=Date.now();
    if(now-lastTap<320&&Math.hypot(e.clientX-lastTapX,e.clientY-lastTapY)<42){
      applyZoom(zoom>1.05?1:2,e.clientX,e.clientY);
      lastTap=0;suppressTapUntil=now+300;
    }else{
      lastTap=now;lastTapX=e.clientX;lastTapY=e.clientY;
    }
  }
  function updateCounter(){
    scrollTick=0;
    counter.textContent=pageAtCenter(scroller,stack)+' / '+state.pdf.numPages;
  }
  function onScroll(){
    if(!scrollTick)scrollTick=requestAnimationFrame(updateCounter);
  }
  function cleanup(){
    if(closed)return;closed=true;
    stackCleanup();
    scroller.removeEventListener('touchstart',onTouchStart);
    scroller.removeEventListener('touchmove',onTouchMove);
    scroller.removeEventListener('touchend',onTouchEnd);
    scroller.removeEventListener('touchcancel',onTouchEnd);
    scroller.removeEventListener('pointerup',onPointerUp);
    scroller.removeEventListener('scroll',onScroll);
    document.removeEventListener('keydown',onKey);
    window.removeEventListener('popstate',onPop);
    overlay.remove();
    document.body.classList.remove('h3-pdf-open');
    active=null;
  }
  function close(fromButton=true){
    if(closed)return;
    if(fromButton&&pushed){
      try{history.back();return}catch{}
    }
    cleanup();
  }
  function onPop(){cleanup()}
  function onKey(e){if(e.key==='Escape')close(true)}
  overlay.querySelector('.h3-pdf-close').onclick=()=>close(true);
  scroller.addEventListener('touchstart',onTouchStart,{passive:false});
  scroller.addEventListener('touchmove',onTouchMove,{passive:false});
  scroller.addEventListener('touchend',onTouchEnd,{passive:true});
  scroller.addEventListener('touchcancel',onTouchEnd,{passive:true});
  scroller.addEventListener('pointerup',onPointerUp,{passive:true});
  scroller.addEventListener('scroll',onScroll,{passive:true});
  document.addEventListener('keydown',onKey);
  try{history.pushState({...history.state,h3PdfViewer:true},'',location.href);pushed=true;window.addEventListener('popstate',onPop)}catch{}
  active={close};
  createStack(state.pdf,stack,{root:scroller,resolution:1.55}).then(fn=>{
    stackCleanup=fn;
    requestAnimationFrame(()=>{
      const target=stack.querySelector('[data-page="'+clamp(startPage,1,state.pdf.numPages)+'"]');
      if(target)scroller.scrollTop=Math.max(0,target.offsetTop-8);
      updateCounter();
    });
  });
}
async function mount(host,options){
  if(!host||!options?.url)return()=>{};
  const state={url:options.url,title:options.title||'Dokument',fileName:options.fileName||'dokument.pdf',downloadEnabled:!!options.downloadEnabled,onDownload:options.onDownload||null,pdf:null};
  host.innerHTML='<div class="h3-pdf-loading"><span>📄</span><strong>Ładowanie dokumentu...</strong></div>';
  let destroyed=false,stackCleanup=()=>{};
  try{
    const lib=await loadPdfJs();
    if(destroyed)return()=>{};
    const task=lib.getDocument({url:state.url,withCredentials:false});
    state.pdf=await task.promise;
    if(destroyed){task.destroy();return()=>{}}
    host.innerHTML='<div class="h3-pdf-inline-head"><div><strong>Dokument PDF</strong><span>'+state.pdf.numPages+' str.</span></div><div class="h3-pdf-inline-actions"></div></div><div class="h3-pdf-stack h3-pdf-inline-stack"></div><div class="h3-pdf-inline-tip">Stuknij stronę, aby otworzyć pełny ekran i przybliżanie.</div>';
    const actions=host.querySelector('.h3-pdf-inline-actions');
    const full=document.createElement('button');
    full.type='button';full.className='h3-pdf-full-button';full.textContent='⛶ Pełny ekran';
    full.onclick=()=>openFullscreen(state,1);
    actions.appendChild(full);
    if(state.downloadEnabled){
      const dl=document.createElement('button');
      dl.type='button';dl.className='h3-pdf-download';dl.textContent='⇩ Pobierz';
      dl.onclick=()=>download(state.url,state.fileName,state.onDownload);
      actions.appendChild(dl);
    }
    const stack=host.querySelector('.h3-pdf-inline-stack');
    stackCleanup=await createStack(state.pdf,stack,{resolution:1.15,onPageClick:p=>openFullscreen(state,p)});
  }catch(err){
    console.warn('PDF viewer failed',err);
    if(!destroyed)host.innerHTML='<div class="h3-pdf-error"><strong>Nie udało się wyświetlić PDF.</strong><span>Sprawdź połączenie i spróbuj ponownie.</span></div>';
  }
  return ()=>{
    destroyed=true;
    stackCleanup();
    if(active)active.close(false);
    try{state.pdf?.destroy?.()}catch{}
  };
}
window.H3PdfViewer={mount,close:()=>active?.close?.(true)};
})();