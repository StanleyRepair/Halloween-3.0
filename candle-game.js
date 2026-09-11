(()=>{
let current=null;
const BEST_KEY='h3_candle_game_best';
const GAME_MS=20000;

function mount(host){
  unmount();
  if(!host)return;
  host.innerHTML=`
    <div class="candle-game">
      <div class="candle-game-stats">
        <div><span>Czas</span><strong class="candle-time">20.0</strong></div>
        <div><span>Wynik</span><strong class="candle-score">0</strong></div>
        <div><span>Rekord</span><strong class="candle-best">0</strong></div>
      </div>
      <div class="candle-stage" aria-label="Plansza gry Zgaś świece">
        ${Array.from({length:9},(_,i)=>`<button type="button" class="candle-slot" data-candle="${i}" aria-label="Świeca ${i+1}"><span class="candle-glow"></span><span class="candle-flame"><i></i></span><span class="candle-wick"></span><span class="candle-body"><i></i></span><span class="candle-puddle"></span></button>`).join('')}
        <div class="candle-game-overlay">
          <div class="candle-game-card">
            <div class="candle-game-title">🕯️ Zgaś świece</div>
            <p>Dotknij płonącej świecy zanim zgaśnie. Tempo będzie rosło.</p>
            <button type="button" class="candle-start">START</button>
          </div>
        </div>
      </div>
      <div class="candle-game-tip">Każda zgaszona świeca to 1 punkt. Pomyłka nie odejmuje punktu.</div>
    </div>`;

  const stage=host.querySelector('.candle-stage');
  const slots=[...host.querySelectorAll('.candle-slot')];
  const overlay=host.querySelector('.candle-game-overlay');
  const card=host.querySelector('.candle-game-card');
  const title=host.querySelector('.candle-game-title');
  const startBtn=host.querySelector('.candle-start');
  const scoreEl=host.querySelector('.candle-score');
  const timeEl=host.querySelector('.candle-time');
  const bestEl=host.querySelector('.candle-best');

  let running=false;
  let score=0;
  let best=Number(localStorage.getItem(BEST_KEY)||0);
  let active=-1;
  let roundTimer=0;
  let nextTimer=0;
  let raf=0;
  let endAt=0;
  let litAt=0;
  bestEl.textContent=String(best);

  function clearTimers(){
    clearTimeout(roundTimer);
    clearTimeout(nextTimer);
    cancelAnimationFrame(raf);
    roundTimer=0;
    nextTimer=0;
    raf=0;
  }

  function darken(index=active){
    if(index<0||!slots[index])return;
    slots[index].classList.remove('is-lit','is-hit','is-missed');
    active=-1;
  }

  function roundWindow(){
    const elapsed=Math.max(0,GAME_MS-(endAt-performance.now()));
    const progress=Math.min(1,elapsed/GAME_MS);
    return Math.round(1100-progress*560);
  }

  function scheduleNext(delay=180+Math.random()*260){
    clearTimeout(nextTimer);
    nextTimer=setTimeout(()=>{
      if(!running)return;
      let next=Math.floor(Math.random()*slots.length);
      if(slots.length>1&&next===active)next=(next+1+Math.floor(Math.random()*(slots.length-1)))%slots.length;
      light(next);
    },delay);
  }

  function light(index){
    if(!running)return;
    clearTimeout(roundTimer);
    darken();
    active=index;
    litAt=performance.now();
    slots[index].classList.add('is-lit');
    roundTimer=setTimeout(()=>{
      if(!running||active!==index)return;
      slots[index].classList.add('is-missed');
      try{navigator.vibrate?.(12)}catch{}
      setTimeout(()=>{if(active===index)darken(index);scheduleNext(120)},90);
    },roundWindow());
  }

  function updateClock(now){
    if(!running)return;
    const left=Math.max(0,endAt-now);
    timeEl.textContent=(left/1000).toFixed(1);
    if(left<=0){finish();return}
    raf=requestAnimationFrame(updateClock);
  }

  function reset(){
    clearTimers();
    darken();
    slots.forEach(s=>s.classList.remove('is-hit','is-missed'));
    score=0;
    scoreEl.textContent='0';
    timeEl.textContent='20.0';
    title.textContent='🕯️ Zgaś świece';
    card.querySelector('p').textContent='Dotknij płonącej świecy zanim zgaśnie. Tempo będzie rosło.';
    startBtn.textContent='START';
  }

  function start(){
    reset();
    running=true;
    overlay.hidden=true;
    endAt=performance.now()+GAME_MS;
    window.H3Analytics?.track?.('candle_game_start').catch?.(()=>{});
    scheduleNext(350);
    raf=requestAnimationFrame(updateClock);
  }

  function finish(){
    if(!running)return;
    running=false;
    clearTimers();
    darken();
    if(score>best){
      best=score;
      localStorage.setItem(BEST_KEY,String(best));
      bestEl.textContent=String(best);
    }
    timeEl.textContent='0.0';
    title.textContent='Koniec gry';
    card.querySelector('p').innerHTML=`Zgaszone świece: <strong>${score}</strong><br>Rekord: <strong>${best}</strong>`;
    startBtn.textContent='JESZCZE RAZ';
    overlay.hidden=false;
    window.H3Analytics?.track?.('candle_game_over',{score,best}).catch?.(()=>{});
    try{navigator.vibrate?.([35,25,55])}catch{}
  }

  function tap(index){
    if(!running)return;
    if(index!==active){
      slots[index]?.classList.add('is-missed');
      setTimeout(()=>slots[index]?.classList.remove('is-missed'),100);
      try{navigator.vibrate?.(8)}catch{}
      return;
    }
    clearTimeout(roundTimer);
    const reaction=Math.round(performance.now()-litAt);
    const slot=slots[index];
    slot.classList.remove('is-lit');
    slot.classList.add('is-hit');
    active=-1;
    score++;
    scoreEl.textContent=String(score);
    try{navigator.vibrate?.(16)}catch{}
    setTimeout(()=>slot.classList.remove('is-hit'),120);
    scheduleNext(Math.max(85,210-score*4));
    window.H3Analytics?.track?.('candle_game_hit',{score,reaction}).catch?.(()=>{});
  }

  slots.forEach((slot,i)=>slot.addEventListener('pointerdown',e=>{e.preventDefault();tap(i)}));
  startBtn.addEventListener('click',e=>{e.preventDefault();start()});

  current={
    host,
    stop(){running=false;clearTimers();darken()}
  };
}

function unmount(){
  if(current){current.stop();current=null}
}

window.H3CandleGame={mount,unmount};
})();
