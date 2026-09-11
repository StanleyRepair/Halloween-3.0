(()=>{
let activeBox=null;
let pushedState=false;

function closeFullscreen(fromPop=false){
  if(!activeBox)return;
  activeBox.classList.remove('candle-game-fullscreen-box');
  document.body.classList.remove('candle-game-fullscreen');
  const btn=activeBox.querySelector('.candle-fullscreen-button');
  if(btn){
    btn.textContent='⛶';
    btn.setAttribute('aria-label','Włącz pełny ekran');
    btn.title='Pełny ekran';
  }
  activeBox=null;
  if(pushedState&&!fromPop){
    pushedState=false;
    try{history.back()}catch{}
  }else{
    pushedState=false;
  }
}

function openFullscreen(box){
  if(activeBox&&activeBox!==box)closeFullscreen();
  activeBox=box;
  box.classList.add('candle-game-fullscreen-box');
  document.body.classList.add('candle-game-fullscreen');
  const btn=box.querySelector('.candle-fullscreen-button');
  if(btn){
    btn.textContent='✕';
    btn.setAttribute('aria-label','Wyłącz pełny ekran');
    btn.title='Wyłącz pełny ekran';
  }
  if(!pushedState){
    try{
      history.pushState({h3CandleFullscreen:true},'',location.href);
      pushedState=true;
    }catch{}
  }
}

function toggle(box){
  if(box.classList.contains('candle-game-fullscreen-box'))closeFullscreen();
  else openFullscreen(box);
}

function enhance(){
  const host=document.getElementById('candleGameHost');
  if(!host){
    if(activeBox&&!document.body.contains(activeBox)){
      activeBox=null;
      pushedState=false;
      document.body.classList.remove('candle-game-fullscreen');
    }
    return;
  }
  const box=host.closest('.other-detail');
  const head=box?.querySelector('.other-detail-head');
  if(!box||!head)return;
  box.classList.add('candle-game-detail');
  head.classList.add('candle-game-head');
  if(head.querySelector('.candle-fullscreen-button'))return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='candle-fullscreen-button';
  btn.textContent='⛶';
  btn.setAttribute('aria-label','Włącz pełny ekran');
  btn.title='Pełny ekran';
  btn.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    toggle(box);
  });
  head.appendChild(btn);
}

window.addEventListener('popstate',()=>{
  if(activeBox)closeFullscreen(true);
});

document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&activeBox)closeFullscreen(false);
});

new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
enhance();
})();
