(()=>{
const panel=document.getElementById('podiumPanel');
const podium=document.getElementById('podium');
const contestView=document.querySelector('.app-view[data-view="contest"]');
if(!panel||!podium||!contestView)return;

let cycle=0,armedCycle=-1,autoTimer=null,removeTimer=null,cycleStartedAt=0,manualRequested=false;
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function clearTimers(){clearTimeout(autoTimer);clearTimeout(removeTimer);autoTimer=null;removeTimer=null}
function cleanup(){clearTimers();panel.querySelector('.h3-curtain-overlay')?.remove();panel.querySelector('.h3-confetti-layer')?.remove();panel.classList.remove('h3-reveal-stage','h3-reveal-opening');manualRequested=false}
function stageVisible(){return !panel.hidden&&!contestView.hidden}
function winnersReady(){return podium.children.length>0}

function makeCurtains(){
 const overlay=document.createElement('div');
 overlay.className='h3-curtain-overlay';
 overlay.setAttribute('role','button');
 overlay.setAttribute('tabindex','0');
 overlay.setAttribute('aria-label','Odsłoń zwycięzców konkursu');
 overlay.innerHTML='<div class="h3-stage-shadow"></div><div class="h3-curtain h3-curtain-left"><span class="h3-curtain-tie"></span></div><div class="h3-curtain h3-curtain-right"><span class="h3-curtain-tie"></span></div><div class="h3-curtain-valance"></div><div class="h3-curtain-prompt"><strong>🎭 WYNIKI ZA KOTARĄ</strong><span class="h3-curtain-hint">Przygotowuję podium...</span></div>';
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
 if(!overlay||overlay.classList.contains('h3-open')||!winnersReady())return;
 clearTimeout(autoTimer);autoTimer=null;
 overlay.classList.add('h3-open');
 panel.classList.add('h3-reveal-opening');
 setTimeout(confetti,reduceMotion?0:420);
 removeTimer=setTimeout(()=>{overlay.remove();panel.classList.remove('h3-reveal-stage','h3-reveal-opening')},reduceMotion?180:1650);
}

function refreshOverlay(overlay){
 if(!overlay||overlay.classList.contains('h3-open'))return;
 const title=overlay.querySelector('.h3-curtain-prompt strong');
 const hint=overlay.querySelector('.h3-curtain-hint');
 if(!winnersReady()){
  overlay.classList.remove('h3-ready');
  if(title)title.textContent='🎭 WYNIKI ZA KOTARĄ';
  if(hint)hint.textContent='Przygotowuję podium...';
  return;
 }
 overlay.classList.add('h3-ready');
 if(title)title.textContent='🎭 ODSŁOŃ ZWYCIĘZCÓW';
 if(hint)hint.textContent='Dotknij kotary lub poczekaj 3 sekundy';
 if(manualRequested){reveal(overlay);return}
 if(!autoTimer){
  const elapsed=Math.max(0,performance.now()-cycleStartedAt);
  const remaining=Math.max(0,3000-elapsed);
  autoTimer=setTimeout(()=>reveal(overlay),remaining);
 }
}

function arm(){
 if(armedCycle===cycle||!stageVisible())return;
 armedCycle=cycle;
 clearTimers();
 panel.querySelector('.h3-curtain-overlay')?.remove();
 panel.querySelector('.h3-confetti-layer')?.remove();
 panel.classList.remove('h3-reveal-opening');
 panel.classList.add('h3-reveal-stage');
 const overlay=makeCurtains();
 panel.appendChild(overlay);
 const requestReveal=()=>{manualRequested=true;if(winnersReady())reveal(overlay);else refreshOverlay(overlay)};
 overlay.addEventListener('click',requestReveal);
 overlay.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();requestReveal()}});
 refreshOverlay(overlay);
}

function beginCycle(){
 cycle++;
 armedCycle=-1;
 cycleStartedAt=performance.now();
 manualRequested=false;
 cleanup();
 arm();
}

new MutationObserver(()=>{
 if(stageVisible())arm();
 else cleanup();
}).observe(panel,{attributes:true,attributeFilter:['hidden']});

new MutationObserver(()=>{
 const overlay=panel.querySelector('.h3-curtain-overlay');
 if(overlay)refreshOverlay(overlay);
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
