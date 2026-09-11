(()=>{
let current=null;
const ROWS=8,COLS=8,SIZE=ROWS*COLS,GAME_MS=60000,BEST_KEY='h3_halloween_match_best';
const PIECES=[
  {key:'pumpkin',icon:'🎃',label:'Dynia'},
  {key:'ghost',icon:'👻',label:'Duch'},
  {key:'skull',icon:'💀',label:'Czaszka'},
  {key:'bat',icon:'🦇',label:'Nietoperz'},
  {key:'spider',icon:'🕷️',label:'Pająk'},
  {key:'candy',icon:'🍬',label:'Cukierek'}
];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const randType=()=>Math.floor(Math.random()*PIECES.length);

function mount(host){
  unmount();
  if(!host)return;
  host.innerHTML=`<div class="match3-game"><div class="match3-stats"><div><span>Czas</span><strong class="match3-time">60</strong></div><div><span>Wynik</span><strong class="match3-score">0</strong></div><div><span>Rekord</span><strong class="match3-best">0</strong></div></div><div class="match3-status" aria-live="polite">Połącz 3 lub więcej symboli</div><div class="match3-stage"><div class="match3-board" role="grid" aria-label="Plansza Halloween Match"></div><div class="match3-overlay"><div class="match3-card"><div class="match3-title">🎃 Halloween Match</div><p>Zamieniaj sąsiednie symbole miejscami. Połącz co najmniej 3 takie same w rzędzie lub kolumnie.</p><button type="button" class="match3-start">START</button></div></div></div><div class="match3-tip">Przesuń palcem symbol w wybraną stronę albo stuknij dwa sąsiednie pola.</div></div>`;

  const game=host.querySelector('.match3-game'),boardEl=host.querySelector('.match3-board'),overlay=host.querySelector('.match3-overlay'),card=host.querySelector('.match3-card'),title=host.querySelector('.match3-title'),startBtn=host.querySelector('.match3-start'),scoreEl=host.querySelector('.match3-score'),timeEl=host.querySelector('.match3-time'),bestEl=host.querySelector('.match3-best'),statusEl=host.querySelector('.match3-status');
  let board=[],running=false,busy=false,score=0,best=Number(localStorage.getItem(BEST_KEY)||0),selected=-1,raf=0,endAt=0,timeUp=false,pointer=null,fullscreen=false,pushedState=false;
  bestEl.textContent=String(best);

  function index(r,c){return r*COLS+c}
  function row(i){return Math.floor(i/COLS)}
  function col(i){return i%COLS}
  function adjacent(a,b){return a>=0&&b>=0&&Math.abs(row(a)-row(b))+Math.abs(col(a)-col(b))===1}
  function swap(a,b){const t=board[a];board[a]=board[b];board[b]=t}

  function findMatches(){
    const set=new Set();
    for(let r=0;r<ROWS;r++){
      let start=0;
      for(let c=1;c<=COLS;c++){
        const prev=board[index(r,c-1)],cur=c<COLS?board[index(r,c)]:-2;
        if(cur!==prev){if(prev!==null&&c-start>=3)for(let k=start;k<c;k++)set.add(index(r,k));start=c}
      }
    }
    for(let c=0;c<COLS;c++){
      let start=0;
      for(let r=1;r<=ROWS;r++){
        const prev=board[index(r-1,c)],cur=r<ROWS?board[index(r,c)]:-2;
        if(cur!==prev){if(prev!==null&&r-start>=3)for(let k=start;k<r;k++)set.add(index(k,c));start=r}
      }
    }
    return set;
  }

  function hasMove(){
    for(let i=0;i<SIZE;i++){
      const r=row(i),c=col(i);
      for(const j of [c<COLS-1?i+1:-1,r<ROWS-1?i+COLS:-1]){
        if(j<0)continue;swap(i,j);const ok=findMatches().size>0;swap(i,j);if(ok)return true;
      }
    }
    return false;
  }

  function makeBoard(){
    for(let attempt=0;attempt<80;attempt++){
      const b=Array(SIZE).fill(0);
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        let choices=PIECES.map((_,i)=>i);
        if(c>=2&&b[index(r,c-1)]===b[index(r,c-2)])choices=choices.filter(x=>x!==b[index(r,c-1)]);
        if(r>=2&&b[index(r-1,c)]===b[index(r-2,c)])choices=choices.filter(x=>x!==b[index(r-1,c)]);
        b[index(r,c)]=choices[Math.floor(Math.random()*choices.length)];
      }
      board=b;if(hasMove())return;
    }
  }

  function render(extraClass='',marked=new Set()){
    const frag=document.createDocumentFragment();
    boardEl.innerHTML='';
    for(let i=0;i<SIZE;i++){
      const t=board[i],p=t===null?null:PIECES[t],btn=document.createElement('button');
      btn.type='button';btn.className='match3-cell';btn.dataset.index=String(i);btn.setAttribute('role','gridcell');
      if(i===selected)btn.classList.add('is-selected');
      if(marked.has(i)&&extraClass)btn.classList.add(extraClass);
      if(p){btn.dataset.type=p.key;btn.setAttribute('aria-label',p.label);btn.innerHTML=`<span>${p.icon}</span>`}else{btn.classList.add('is-empty');btn.setAttribute('aria-label','Puste pole')}
      frag.appendChild(btn);
    }
    boardEl.appendChild(frag);
  }

  function collapse(){
    for(let c=0;c<COLS;c++){
      const vals=[];for(let r=ROWS-1;r>=0;r--){const v=board[index(r,c)];if(v!==null)vals.push(v)}
      let pos=0;for(let r=ROWS-1;r>=0;r--){board[index(r,c)]=pos<vals.length?vals[pos++]:randType()}
    }
  }

  async function resolveMatches(comboStart=1){
    let combo=comboStart;
    while(running){
      const matches=findMatches();
      if(!matches.size)break;
      const gained=matches.size*10*combo;score+=gained;scoreEl.textContent=String(score);statusEl.textContent=combo>1?`🔥 Combo x${combo}  +${gained}`:`✨ +${gained}`;
      render('is-pop',matches);try{navigator.vibrate?.(Math.min(35,10+combo*5))}catch{}
      await wait(170);
      for(const i of matches)board[i]=null;render();await wait(80);collapse();render('is-drop',new Set(board.map((_,i)=>i)));await wait(150);combo++;
    }
    if(running&&!hasMove()){
      statusEl.textContent='🔀 Brak ruchów, tasuję planszę';await wait(250);makeBoard();render();
    }
  }

  async function trySwap(a,b){
    if(!running||busy||!adjacent(a,b))return;
    busy=true;selected=-1;swap(a,b);render();await wait(110);
    if(!findMatches().size){swap(a,b);render();boardEl.classList.add('is-wrong');try{navigator.vibrate?.(10)}catch{};await wait(150);boardEl.classList.remove('is-wrong');statusEl.textContent='Ten ruch nic nie łączy';busy=false;if(timeUp)finish();return}
    await resolveMatches(1);busy=false;if(timeUp)finish();
  }

  function selectOrSwap(i){
    if(!running||busy)return;
    if(selected<0){selected=i;render();return}
    if(i===selected){selected=-1;render();return}
    if(adjacent(selected,i)){const a=selected;selected=-1;trySwap(a,i);return}
    selected=i;render();
  }

  function updateClock(now){
    if(!running)return;
    const left=Math.max(0,endAt-now);timeEl.textContent=String(Math.ceil(left/1000));
    if(left<=0){timeUp=true;if(!busy)finish();return}
    raf=requestAnimationFrame(updateClock);
  }

  function reset(){
    cancelAnimationFrame(raf);score=0;selected=-1;busy=false;timeUp=false;scoreEl.textContent='0';timeEl.textContent='60';statusEl.textContent='Połącz 3 lub więcej symboli';makeBoard();render();title.textContent='🎃 Halloween Match';card.querySelector('p').textContent='Zamieniaj sąsiednie symbole miejscami. Połącz co najmniej 3 takie same w rzędzie lub kolumnie.';startBtn.textContent='START';
  }

  function start(){
    reset();running=true;overlay.hidden=true;endAt=performance.now()+GAME_MS;window.H3Analytics?.track?.('halloween_match_start').catch?.(()=>{});raf=requestAnimationFrame(updateClock);
  }

  function finish(){
    if(!running)return;running=false;busy=false;cancelAnimationFrame(raf);selected=-1;
    if(score>best){best=score;localStorage.setItem(BEST_KEY,String(best));bestEl.textContent=String(best)}
    title.textContent='Koniec gry';card.querySelector('p').innerHTML=`Wynik: <strong>${score}</strong><br>Rekord: <strong>${best}</strong>`;startBtn.textContent='JESZCZE RAZ';overlay.hidden=false;statusEl.textContent=score>=best&&score>0?'🏆 Nowy rekord!':'Czas minął';window.H3Analytics?.track?.('halloween_match_over',{score,best}).catch?.(()=>{});try{navigator.vibrate?.([35,25,55])}catch{}
  }

  function neighborFromSwipe(i,dx,dy){
    const r=row(i),c=col(i);if(Math.abs(dx)<18&&Math.abs(dy)<18)return -1;
    if(Math.abs(dx)>Math.abs(dy)){if(dx>0&&c<COLS-1)return i+1;if(dx<0&&c>0)return i-1}else{if(dy>0&&r<ROWS-1)return i+COLS;if(dy<0&&r>0)return i-COLS}return -1;
  }

  boardEl.addEventListener('pointerdown',e=>{const cell=e.target.closest('.match3-cell');if(!cell||!running||busy)return;e.preventDefault();pointer={id:e.pointerId,index:Number(cell.dataset.index),x:e.clientX,y:e.clientY};try{cell.setPointerCapture?.(e.pointerId)}catch{}});
  boardEl.addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;e.preventDefault();const p=pointer;pointer=null;const j=neighborFromSwipe(p.index,e.clientX-p.x,e.clientY-p.y);if(j>=0){selected=-1;trySwap(p.index,j)}else selectOrSwap(p.index)});
  boardEl.addEventListener('pointercancel',()=>{pointer=null});
  startBtn.addEventListener('click',e=>{e.preventDefault();start()});

  function exitFullscreen(fromPop=false){
    if(!fullscreen)return;fullscreen=false;const box=host.closest('.match3-game-detail');box?.classList.remove('match3-game-fullscreen-box');document.body.classList.remove('match3-game-fullscreen');const btn=box?.querySelector('.match3-fullscreen-button');if(btn){btn.textContent='⛶';btn.setAttribute('aria-label','Włącz pełny ekran')}
    if(!fromPop&&pushedState&&history.state?.h3Match3Fullscreen){pushedState=false;history.back()}else pushedState=false;
  }
  function toggleFullscreen(){
    if(fullscreen){exitFullscreen();return}
    const box=host.closest('.match3-game-detail');if(!box)return;fullscreen=true;box.classList.add('match3-game-fullscreen-box');document.body.classList.add('match3-game-fullscreen');const btn=box.querySelector('.match3-fullscreen-button');if(btn){btn.textContent='✕';btn.setAttribute('aria-label','Wyłącz pełny ekran')}
    if(!history.state?.h3Match3Fullscreen){history.pushState({...history.state,h3Match3Fullscreen:true},'',location.href);pushedState=true}
  }
  const onPop=()=>{if(fullscreen)exitFullscreen(true)};window.addEventListener('popstate',onPop);

  reset();
  current={host,toggleFullscreen,exitFullscreen,stop(){running=false;cancelAnimationFrame(raf);window.removeEventListener('popstate',onPop);exitFullscreen(true)}};
}
function unmount(){if(current){current.stop();current=null}}
function toggleFullscreen(){current?.toggleFullscreen?.()}
window.H3MatchGame={mount,unmount,toggleFullscreen};
})();
