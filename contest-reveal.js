(()=>{
const panel=document.getElementById('podiumPanel');
const podium=document.getElementById('podium');
const contestView=document.querySelector('.app-view[data-view="contest"]');
const contestTab=document.querySelector('.nav-item[data-tab="contest"]');
if(!panel||!podium||!contestView||!contestTab)return;

let cycle=0,handledCycle=-1,autoTimer=null,removeTimer=null;
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function clearTimers(){clearTimeout(autoTimer);clearTimeout(removeTimer);autoTimer=null;removeTimer=null}
function cleanup(){clearTimers();panel.querySelector('.h3-curtain-overlay')?.remove();panel.querySelector('.h3-confetti-layer')?.remove();panel.classList.remove('h3-reveal-stage','h3-reveal-opening')}
function isReady(){return !panel.hidden&&podium.children.length>0&&!contestView.hidden}

function makeCurtains(){
 const overlay=document.createElement('div');
 overlay.className='h3-curtain-overlay';
 overlay.setAttribute('role','button');
 overlay.setAttribute('tabindex','0');
 overlay.setAttribute('aria-label','Odsłoń zwycięzców konkursu');
 overlay.innerHTML='<div class="h3-curtain h3-curtain-left"></div><div class="h3-curtain h3-curtain-right"></div><div class="h3-curtain-valance"></div><div class="h3-curtain-prompt"><strong>🎭 ODSŁOŃ ZWYCIĘZCÓW</strong><span>Dotknij kotary lub poczekaj 3 sekundy</span></div>';
 return overlay;
}

function confetti(){
 if(reduceMotion)return;
 panel.querySelector('.h3-confetti-layer')?.remove();
 const layer=document.createElement('div');
 layer.className='h3-confetti-layer';
 const colors=['#ff3b30','#ff9f0a','#ffd60a','#ffffff','#d41414','#ff6a00'];
 const amount=Math.min(82,Math.max(52,Math.round(panel.clientWidth/6)));
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
 if(!overlay||overlay.classList.contains('h3-open'))return;
 clearTimeout(autoTimer);autoTimer=null;
 overlay.classList.add('h3-open');
 panel.classList.add('h3-reveal-opening');
 setTimeout(confetti,reduceMotion?0:360);
 removeTimer=setTimeout(()=>{overlay.remove();panel.classList.remove('h3-reveal-stage','h3-reveal-opening')},reduceMotion?220:1500);
}

function arm(){
 if(handledCycle===cycle||!isReady())return;
 handledCycle=cycle;
 cleanup();
 panel.classList.add('h3-reveal-stage');
 const overlay=makeCurtains();
 panel.appendChild(overlay);
 const go=()=>reveal(overlay);
 overlay.addEventListener('click',go,{once:true});
 overlay.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}},{once:true});
 autoTimer=setTimeout(go,3000);
}

function beginCycle(){
 cycle++;
 handledCycle=-1;
 cleanup();
 setTimeout(arm,40);
}

const observer=new MutationObserver(()=>arm());
observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
observer.observe(podium,{childList:true});
contestTab.addEventListener('click',beginCycle);

if(!contestView.hidden)beginCycle();
window.addEventListener('pageshow',()=>{if(!contestView.hidden&&panel.hidden===false)beginCycle()});
window.addEventListener('pagehide',()=>{observer.disconnect();cleanup()},{once:true});
})();
