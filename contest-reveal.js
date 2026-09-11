(()=>{
const panel=document.getElementById('podiumPanel');
const podium=document.getElementById('podium');
const contestView=document.querySelector('.app-view[data-view="contest"]');
if(!panel||!podium||!contestView)return;

let cycle=0,armedCycle=-1,autoTimer=null,cycleStartedAt=0,manualRequested=false,autoRequested=false,readyLatched=false,revealed=false;
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function clearTimer(){clearTimeout(autoTimer);autoTimer=null}
function cleanup(){
 clearTimer();
 panel.querySelector('.h3-curtain-overlay')?.remove();
 panel.querySelector('.h3-confetti-layer')?.remove();
 panel.classList.remove('h3-reveal-stage','h3-reveal-opening','h3-revealed');
 manualRequested=false;autoRequested=false;readyLatched=false;revealed=false;
}
function stageVisible(){return !panel.hidden&&!contestView.hidden}
function updateReady(){if(podium.children.length>0)readyLatched=true;return readyLatched}

function makeCurtains(){
 const overlay=document.createElement('div');
 overlay.className='h3-curtain-overlay';
 overlay.setAttribute('role','button');
 overlay.setAttribute('tabindex','0');
 overlay.setAttribute('aria-label','Odsłoń zwycięzców konkursu');
 overlay.innerHTML='<div class="h3-stage-shadow"></div><div class="h3-curtain h3-curtain-left"><span class="h3-curtain-tie"></span></div><div class="h3-curtain h3-curtain-right"><span class="h3-curtain-tie"></span></div><div class="h3-curtain-valance"></div><div class="h3-curtain-prompt"><strong>🎭 ODSŁOŃ ZWYCIĘZCÓW</strong><span>Dotknij kotary lub poczekaj 3 sekundy</span></div>';
 return overlay;
}

function confetti(){
 if(reduceMotion)return;
 panel.querySelector('.h3-confetti-layer')?.remove();
 const layer=document.createElement('div');
 layer.className='h3-confetti-layer';
 const colors=['#ff3b30','#ff9f0a','#ffd60a','#fff4dc','#c90e20','#ff6a00'];
 const amount=Math.min(86,Math.max(54,Math.round(panel.clientWidth/6)));
 const fall=Math.max(380,panel.clientHeight+120);
 for(let i=0;i<amount;i++){
  const p=document.createElement('i');
  p.className='h3-confetti';
  p.style.left=`${Math.random()*100}%`;
  p.style.background=colors[Math.floor(Math.random()*colors.length)];
  p.style.setProperty('--delay',`${Math.random()*420}ms`);
  p.style.setProperty('--dur',`${1800+Math.random()*1500}ms`);
  p.style.setProperty('--drift',`${Math.round((Math.random()-.5)*180)}px`);
  p.style.setProperty('--fall',`${fall+Math.round(Math.random()*170)}px`);
  p.style.setProperty('--spin',`${Math.round((Math.random()>.5?1:-1)*(420+Math.random()*980))}deg`);
  p.style.width=`${6+Math.round(Math.random()*5)}px`;
  p.style.height=`${9+Math.round(Math.random()*8)}px`;
  layer.appendChild(p);
 }
 panel.appendChild(layer);
 setTimeout(()=>layer.remove(),3800);
}

function reveal(overlay){
 if(revealed||!overlay||overlay.classList.contains('h3-open')||!updateReady())return;
 revealed=true;
 clearTimer();
 overlay.classList.add('h3-open');
 panel.classList.add('h3-reveal-opening','h3-revealed');
 setTimeout(confetti,reduceMotion?0:320);
 setTimeout(()=>panel.classList.remove('h3-reveal-opening'),reduceMotion?180:1650);
}

function maybeReveal(overlay){
 if(!overlay||revealed)return;
 if(!updateReady())return;
 overlay.classList.add('h3-ready');
 if(manualRequested||autoRequested)reveal(overlay);
}

function startAutoClock(overlay){
 clearTimer();
 const elapsed=Math.max(0,performance.now()-cycleStartedAt);
 const remaining=Math.max(0,3000-elapsed);
 autoTimer=setTimeout(()=>{
  autoTimer=null;
  autoRequested=true;
  maybeReveal(overlay);
 },remaining);
}

function arm(){
 if(armedCycle===cycle||!stageVisible())return;
 armedCycle=cycle;
 clearTimer();
 panel.querySelector('.h3-curtain-overlay')?.remove();
 panel.querySelector('.h3-confetti-layer')?.remove();
 panel.classList.remove('h3-reveal-opening','h3-revealed');
 panel.classList.add('h3-reveal-stage');
 const overlay=makeCurtains();
 panel.appendChild(overlay);
 const requestReveal=()=>{manualRequested=true;maybeReveal(overlay)};
 overlay.addEventListener('click',requestReveal);
 overlay.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();requestReveal()}});
 updateReady();
 if(readyLatched)overlay.classList.add('h3-ready');
 startAutoClock(overlay);
}

function beginCycle(){
 cycle++;
 armedCycle=-1;
 cycleStartedAt=performance.now();
 manualRequested=false;autoRequested=false;readyLatched=false;revealed=false;
 cleanup();
 cycleStartedAt=performance.now();
 arm();
}

new MutationObserver(()=>{
 if(stageVisible())arm();
 else cleanup();
}).observe(panel,{attributes:true,attributeFilter:['hidden']});

new MutationObserver(()=>{
 const overlay=panel.querySelector('.h3-curtain-overlay');
 if(updateReady()&&overlay)overlay.classList.add('h3-ready');
 if(overlay)maybeReveal(overlay);
 else if(stageVisible())arm();
}).observe(podium,{childList:true,subtree:true});

new MutationObserver(()=>{
 if(contestView.hidden)cleanup();
 else beginCycle();
}).observe(contestView,{attributes:true,attributeFilter:['hidden']});

if(!contestView.hidden)beginCycle();
window.addEventListener('pageshow',()=>{if(!contestView.hidden)beginCycle()});
window.addEventListener('pagehide',cleanup,{once:true});
})();
