(()=>{
const panel=document.getElementById('podiumPanel');
const podium=document.getElementById('podium');
const contestView=document.querySelector('.app-view[data-view="contest"]');
if(!panel||!podium||!contestView)return;

let overlay=null,autoTimer=null,confettiTimer=null,resetTimer=null,cycleStartedAt=0,manualRequested=false,autoRequested=false,readyLatched=false,revealed=false;
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function clearTimers(){clearTimeout(autoTimer);clearTimeout(confettiTimer);clearTimeout(resetTimer);autoTimer=null;confettiTimer=null;resetTimer=null}
function stageVisible(){return !panel.hidden&&!contestView.hidden}
function updateReady(){if(podium.children.length>0)readyLatched=true;return readyLatched}

function makeCurtains(){
 const el=document.createElement('div');
 el.className='h3-curtain-overlay';
 el.setAttribute('role','button');
 el.setAttribute('tabindex','0');
 el.setAttribute('aria-label','Odsłoń zwycięzców konkursu');
 el.innerHTML='<div class="h3-stage-shadow"></div><div class="h3-curtain h3-curtain-left"><span class="h3-curtain-tie"></span></div><div class="h3-curtain h3-curtain-right"><span class="h3-curtain-tie"></span></div><div class="h3-curtain-valance"></div><div class="h3-curtain-prompt"><strong>🎭 ODSŁOŃ ZWYCIĘZCÓW</strong><span>Dotknij kotary lub poczekaj 3 sekundy</span></div>';
 el.addEventListener('click',()=>{manualRequested=true;maybeReveal()});
 el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();manualRequested=true;maybeReveal()}});
 return el;
}

function ensureOverlay(){
 if(overlay&&overlay.isConnected)return overlay;
 overlay=makeCurtains();
 panel.appendChild(overlay);
 return overlay;
}

function confetti(){
 if(reduceMotion||!stageVisible())return;
 panel.querySelector('.h3-confetti-layer')?.remove();
 const layer=document.createElement('div');
 layer.className='h3-confetti-layer';
 const colors=['#ff3b30','#ff9f0a','#ffd60a','#fff4dc','#c90e20','#ff6a00'];
 const amount=Math.min(56,Math.max(36,Math.round(panel.clientWidth/9)));
 for(let i=0;i<amount;i++){
  const p=document.createElement('i');
  p.className='h3-confetti';
  p.style.left=`${Math.random()*100}%`;
  p.style.background=colors[Math.floor(Math.random()*colors.length)];
  p.style.setProperty('--delay',`${Math.random()*360}ms`);
  p.style.setProperty('--dur',`${1850+Math.random()*1250}ms`);
  p.style.setProperty('--drift',`${Math.round((Math.random()-.5)*150)}px`);
  p.style.width=`${6+Math.round(Math.random()*4)}px`;
  p.style.height=`${9+Math.round(Math.random()*7)}px`;
  layer.appendChild(p);
 }
 panel.appendChild(layer);
 setTimeout(()=>layer.remove(),3500);
}

function reveal(){
 const el=ensureOverlay();
 if(revealed||el.classList.contains('h3-open')||!updateReady())return;
 revealed=true;
 clearTimeout(autoTimer);autoTimer=null;
 el.classList.add('h3-open','h3-ready');
 panel.classList.add('h3-reveal-opening','h3-revealed');
 confettiTimer=setTimeout(confetti,reduceMotion?0:320);
 setTimeout(()=>panel.classList.remove('h3-reveal-opening'),reduceMotion?180:1450);
}

function maybeReveal(){
 if(!stageVisible()||revealed)return;
 const el=ensureOverlay();
 if(!updateReady())return;
 el.classList.add('h3-ready');
 if(manualRequested||autoRequested)reveal();
}

function startAutoClock(){
 clearTimeout(autoTimer);
 const elapsed=Math.max(0,performance.now()-cycleStartedAt);
 autoTimer=setTimeout(()=>{autoTimer=null;autoRequested=true;maybeReveal()},Math.max(0,3000-elapsed));
}

function resetCycle(){
 if(!stageVisible())return;
 clearTimers();
 panel.querySelector('.h3-confetti-layer')?.remove();
 cycleStartedAt=performance.now();
 manualRequested=false;autoRequested=false;readyLatched=false;revealed=false;
 panel.classList.remove('h3-reveal-opening','h3-revealed');
 panel.classList.add('h3-reveal-stage');
 const el=ensureOverlay();
 el.classList.remove('h3-open','h3-ready');
 updateReady();
 if(readyLatched)el.classList.add('h3-ready');
 startAutoClock();
}

function scheduleReset(){
 clearTimeout(resetTimer);
 resetTimer=setTimeout(()=>{resetTimer=null;resetCycle()},20);
}

function pauseHidden(){
 clearTimers();
 panel.querySelector('.h3-confetti-layer')?.remove();
 panel.classList.remove('h3-reveal-opening');
}

new MutationObserver(()=>{if(stageVisible())scheduleReset();else pauseHidden()}).observe(panel,{attributes:true,attributeFilter:['hidden']});
new MutationObserver(()=>{if(stageVisible())scheduleReset();else pauseHidden()}).observe(contestView,{attributes:true,attributeFilter:['hidden']});
new MutationObserver(()=>{if(updateReady()&&overlay)overlay.classList.add('h3-ready');maybeReveal()}).observe(podium,{childList:true,subtree:true});

if(stageVisible())scheduleReset();
window.addEventListener('pageshow',()=>{if(stageVisible())scheduleReset()});
window.addEventListener('pagehide',pauseHidden,{once:true});
})();
