(()=>{
let current=null;
const BEST_KEY='h3_dark_ritual_best';
const SYMBOLS=[
  {icon:'🎃',name:'Dynia'},
  {icon:'👻',name:'Duch'},
  {icon:'💀',name:'Czaszka'},
  {icon:'🦇',name:'Nietoperz'}
];
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function mount(host){
  unmount();
  if(!host)return;
  host.innerHTML=`<div class="ritual-game"><div class="ritual-stats"><div><span>Runda</span><strong class="ritual-round">0</strong></div><div><span>Sekwencja</span><strong class="ritual-length">0</strong></div><div><span>Rekord</span><strong class="ritual-best">0</strong></div></div><div class="ritual-status" aria-live="polite">Zapamiętaj kolejność symboli</div><div class="ritual-stage"><div class="ritual-ring" aria-label="Plansza gry Mroczny rytuał">${SYMBOLS.map((s,i)=>`<button type="button" class="ritual-pad ritual-pad-${i}" data-ritual-pad="${i}" aria-label="${s.name}"><span>${s.icon}</span></button>`).join('')}<div class="ritual-core"><span>☠️</span><small>RYTUAŁ</small></div></div><div class="ritual-overlay"><div class="ritual-card"><div class="ritual-title">🔮 Mroczny rytuał</div><p>Obserwuj sekwencję symboli i powtórz ją bez pomyłki. Każda runda dodaje kolejny znak i przyspiesza tempo.</p><button type="button" class="ritual-start">START</button></div></div></div><div class="ritual-tip">Zapamiętaj kolejność. Jedna pomyłka kończy rytuał.</div></div>`;

  const pads=[...host.querySelectorAll('.ritual-pad')],overlay=host.querySelector('.ritual-overlay'),card=host.querySelector('.ritual-card'),title=host.querySelector('.ritual-title'),startBtn=host.querySelector('.ritual-start'),roundEl=host.querySelector('.ritual-round'),lengthEl=host.querySelector('.ritual-length'),bestEl=host.querySelector('.ritual-best'),statusEl=host.querySelector('.ritual-status');
  let sequence=[],inputIndex=0,running=false,showing=false,best=Number(localStorage.getItem(BEST_KEY)||0),timers=new Set(),fullscreen=false,pushedState=false,generation=0;
  bestEl.textContent=String(best);

  function later(fn,ms){
    const id=setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id);return id;
  }
  function clearTimers(){for(const id of timers)clearTimeout(id);timers.clear()}
  function pulse(index,duration=300,kind='show'){
    const p=pads[index];if(!p)return;
    p.classList.remove('is-showing','is-hit','is-wrong');
    void p.offsetWidth;
    p.classList.add(kind==='hit'?'is-hit':kind==='wrong'?'is-wrong':'is-showing');
    later(()=>p.classList.remove('is-showing','is-hit','is-wrong'),duration);
  }
  function speed(){return Math.max(270,620-Math.floor(Math.max(0,sequence.length-1)/2)*38)}

  async function playSequence(token){
    showing=true;inputIndex=0;statusEl.textContent='👁️ Patrz uważnie...';
    const on=speed(),gap=Math.max(105,Math.round(on*.28));
    await wait(350);
    if(token!==generation||!running)return;
    for(let i=0;i<sequence.length;i++){
      if(token!==generation||!running)return;
      pulse(sequence[i],Math.max(190,on-35),'show');
      try{navigator.vibrate?.(8)}catch{}
      await wait(on);
      if(token!==generation||!running)return;
      await wait(gap);
    }
    showing=false;
    if(running)statusEl.textContent='👉 Twoja kolej';
  }

  function nextRound(){
    if(!running)return;
    sequence.push(Math.floor(Math.random()*SYMBOLS.length));
    roundEl.textContent=String(sequence.length);
    lengthEl.textContent=String(sequence.length);
    const token=++generation;
    playSequence(token);
  }

  function start(){
    clearTimers();generation++;sequence=[];inputIndex=0;running=true;showing=false;
    roundEl.textContent='0';lengthEl.textContent='0';statusEl.textContent='Zapamiętaj kolejność symboli';
    title.textContent='🔮 Mroczny rytuał';card.querySelector('p').textContent='Obserwuj sekwencję symboli i powtórz ją bez pomyłki. Każda runda dodaje kolejny znak i przyspiesza tempo.';startBtn.textContent='START';overlay.hidden=true;
    window.H3Analytics?.track?.('dark_ritual_start').catch?.(()=>{});
    later(nextRound,300);
  }

  function finish(wrongIndex=-1){
    if(!running)return;
    running=false;showing=false;generation++;clearTimers();
    const score=Math.max(0,sequence.length-1);
    if(score>best){best=score;localStorage.setItem(BEST_KEY,String(best));bestEl.textContent=String(best)}
    if(wrongIndex>=0)pulse(wrongIndex,480,'wrong');
    statusEl.textContent=score>=best&&score>0?'🏆 Nowy rekord!':'Rytuał przerwany';
    title.textContent='Rytuał przerwany';
    card.querySelector('p').innerHTML=`Ukończone rundy: <strong>${score}</strong><br>Rekord: <strong>${best}</strong>`;
    startBtn.textContent='SPRÓBUJ PONOWNIE';
    later(()=>{overlay.hidden=false},wrongIndex>=0?420:0);
    window.H3Analytics?.track?.('dark_ritual_over',{score,best,completed_rounds:score,sequence_length:sequence.length}).catch?.(()=>{});
    try{navigator.vibrate?.([45,35,80])}catch{}
  }

  function tap(index){
    if(!running||showing)return;
    const expected=sequence[inputIndex];
    if(index!==expected){pulse(index,420,'wrong');finish(index);return}
    pulse(index,190,'hit');
    try{navigator.vibrate?.(15)}catch{}
    inputIndex++;
    if(inputIndex<sequence.length){statusEl.textContent=`✓ ${inputIndex} / ${sequence.length}`;return}
    statusEl.textContent='✨ Dobrze! Następna runda';
    showing=true;
    later(()=>{if(running){showing=false;nextRound()}},520);
  }

  pads.forEach((pad,i)=>pad.addEventListener('pointerdown',e=>{e.preventDefault();tap(i)}));
  startBtn.addEventListener('click',e=>{e.preventDefault();start()});

  function exitFullscreen(fromPop=false){
    if(!fullscreen)return;
    fullscreen=false;
    const box=host.closest('.ritual-game-detail');
    box?.classList.remove('ritual-game-fullscreen-box');
    document.body.classList.remove('ritual-game-fullscreen');
    const btn=box?.querySelector('.ritual-fullscreen-button');
    if(btn){btn.textContent='⛶';btn.setAttribute('aria-label','Włącz pełny ekran')}
    if(!fromPop&&pushedState&&history.state?.h3RitualFullscreen){pushedState=false;history.back()}else pushedState=false;
  }
  function toggleFullscreen(){
    if(fullscreen){exitFullscreen();return}
    const box=host.closest('.ritual-game-detail');if(!box)return;
    fullscreen=true;box.classList.add('ritual-game-fullscreen-box');document.body.classList.add('ritual-game-fullscreen');
    const btn=box.querySelector('.ritual-fullscreen-button');if(btn){btn.textContent='✕';btn.setAttribute('aria-label','Wyłącz pełny ekran')}
    if(!history.state?.h3RitualFullscreen){history.pushState({...history.state,h3RitualFullscreen:true},'',location.href);pushedState=true}
  }
  const onPop=()=>{if(fullscreen)exitFullscreen(true)};
  window.addEventListener('popstate',onPop);

  current={host,toggleFullscreen,exitFullscreen,stop(){running=false;showing=false;generation++;clearTimers();window.removeEventListener('popstate',onPop);exitFullscreen(true)}};
}

function unmount(){if(current){current.stop();current=null}}
function toggleFullscreen(){current?.toggleFullscreen?.()}
window.H3DarkRitual={mount,unmount,toggleFullscreen};
})();