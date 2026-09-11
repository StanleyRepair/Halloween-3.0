(()=>{
let current=null;
const BEST_KEY='h3_pumpkin_blaster_best';
const W=540;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const LANES=[90,270,450];
const REWARDS=[
  {key:'damage',icon:'🔥',short:'DMG +1'},
  {key:'rate',icon:'⚡',short:'SZYBKOŚĆ'},
  {key:'multi',icon:'🔱',short:'+1 POCISK'},
  {key:'points',icon:'🍬',short:'+100'}
];

function mount(host){
  unmount();
  if(!host)return;
  host.innerHTML=`<div class="blaster-shell"><div class="blaster-hud"><div><span>Wynik</span><strong class="blaster-score">0</strong></div><div><span>Fala</span><strong class="blaster-wave">1</strong></div><div><span>Rekord</span><strong class="blaster-best">0</strong></div></div><div class="blaster-stage"><canvas class="blaster-canvas" width="540" height="900" aria-label="Plansza Pumpkin Blaster"></canvas><button type="button" class="blaster-exit-fs" aria-label="Wyłącz pełny ekran">✕</button><div class="blaster-overlay"><div class="blaster-card"><h3>🎃 Pumpkin Blaster</h3><p>Przesuwaj łowcę w lewo i prawo. Strzela automatycznie. Rozbij dyniowe barykady z liczbami i wybierz najlepsze ulepszenie, zanim przeszkoda do Ciebie dotrze.</p><button type="button" class="blaster-start">START</button></div></div></div><div class="blaster-tip">Przeciągaj palcem między torami. Mniejsza liczba oznacza łatwiejszą barykadę.</div></div>`;

  const canvas=host.querySelector('.blaster-canvas'),ctx=canvas.getContext('2d',{alpha:false}),stage=host.querySelector('.blaster-stage'),overlay=host.querySelector('.blaster-overlay'),card=host.querySelector('.blaster-card'),startBtn=host.querySelector('.blaster-start'),scoreEl=host.querySelector('.blaster-score'),waveEl=host.querySelector('.blaster-wave'),bestEl=host.querySelector('.blaster-best'),exitFs=host.querySelector('.blaster-exit-fs');
  let viewH=900,dpr=1,scale=1,running=false,dead=false,raf=0,last=0,best=Number(localStorage.getItem(BEST_KEY)||0),score=0,wave=1,row=null,bullets=[],particles=[],fireClock=0,damage=1,fireDelay=.19,multishot=1,playerX=270,targetX=270,dragging=false,fullscreen=false,pushedState=false,resizeObserver=null;
  bestEl.textContent=String(best);

  function fitCanvas(){
    const r=canvas.getBoundingClientRect();
    dpr=Math.min(2,window.devicePixelRatio||1);
    const cssW=Math.max(1,r.width),cssH=Math.max(1,r.height);
    canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);
    scale=canvas.width/W;
    viewH=canvas.height/scale;
    ctx.setTransform(scale,0,0,scale,0,0);
    playerX=clamp(playerX,42,W-42);targetX=clamp(targetX,42,W-42);
    if(!running)draw();
  }
  resizeObserver=new ResizeObserver(fitCanvas);resizeObserver.observe(canvas);fitCanvas();

  function playerY(){return viewH-92}
  function updateHud(){scoreEl.textContent=String(Math.floor(score));waveEl.textContent=String(wave);bestEl.textContent=String(best)}
  function rewardForWave(i){
    const pool=wave<2?REWARDS.filter(x=>x.key!=='multi'):REWARDS;
    let r=pool[Math.floor(Math.random()*pool.length)];
    if(i===1&&wave%4===0)r=REWARDS[2];
    return {...r};
  }
  function makeRow(){
    const base=10+wave*4.2;
    const easy=Math.floor(Math.random()*3);
    const boss=wave%6===0;
    const mults=[1.08,1.22,1.35];
    if(boss)mults.splice(0,3,1.45,1.62,1.82);
    const barriers=LANES.map((x,i)=>{
      const factor=i===easy?(boss?.9:.55):mults[i];
      const hp=Math.max(3,Math.round(base*factor));
      return {x,hp,maxHp:hp,reward:rewardForWave(i),broken:false,collected:false,flash:0};
    });
    row={y:-110,speed:Math.min(82,43+wave*1.5),barriers,boss};
  }
  function reset(){
    running=false;dead=false;score=0;wave=1;row=null;bullets=[];particles=[];fireClock=0;damage=1;fireDelay=.19;multishot=1;playerX=270;targetX=270;makeRow();updateHud();draw();
  }
  function start(){
    reset();running=true;overlay.hidden=true;last=performance.now();
    window.H3Analytics?.track?.('pumpkin_blaster_start').catch?.(()=>{});
    cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
  }
  function finish(){
    if(!running)return;
    running=false;dead=true;cancelAnimationFrame(raf);
    const final=Math.floor(score);const isNew=final>best;
    if(isNew){best=final;localStorage.setItem(BEST_KEY,String(best));bestEl.textContent=String(best)}
    burst(playerX,playerY()-15,'#ff702b',34);draw();
    card.querySelector('h3').textContent=isNew?'🏆 Nowy rekord!':'💀 Barykada Cię dopadła';
    card.querySelector('p').innerHTML=`Wynik: <strong>${final}</strong><br>Dotarłeś do fali: <strong>${wave}</strong><br>Rekord: <strong>${best}</strong>`;
    startBtn.textContent='SPRÓBUJ PONOWNIE';overlay.hidden=false;
    window.H3Analytics?.track?.('pumpkin_blaster_over',{score:final,best,wave,damage,multishot,fire_rate:Number((1/fireDelay).toFixed(1))}).catch?.(()=>{});
    try{navigator.vibrate?.([45,30,80])}catch{}
  }
  function burst(x,y,color,n=10){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-150,150),vy:rand(-220,80),life:rand(.25,.65),r:rand(2,5),color})}
  function shoot(){
    const count=multishot,spacing=15;
    for(let i=0;i<count;i++){
      const off=(i-(count-1)/2)*spacing;
      bullets.push({x:playerX+off,y:playerY()-52,vy:-720,damage});
    }
  }
  function applyReward(b){
    if(b.collected)return;b.collected=true;
    const r=b.reward;
    if(r.key==='damage')damage=Math.min(9,damage+1);
    else if(r.key==='rate')fireDelay=Math.max(.075,fireDelay*.86);
    else if(r.key==='multi')multishot=Math.min(5,multishot+1);
    else score+=100;
    score+=35;burst(b.x,row.y-18,'#ffc463',18);
    try{navigator.vibrate?.([12,18,18])}catch{}
  }
  function update(dt){
    if(!row)makeRow();
    playerX+=(targetX-playerX)*Math.min(1,dt*13);
    fireClock-=dt;if(fireClock<=0){shoot();fireClock+=fireDelay}
    row.y+=row.speed*dt;
    for(const b of row.barriers)b.flash=Math.max(0,b.flash-dt*5);
    for(const bullet of bullets){bullet.y+=bullet.vy*dt}
    for(let bi=bullets.length-1;bi>=0;bi--){
      const p=bullets[bi];let hit=false;
      for(const b of row.barriers){
        if(b.broken)continue;
        if(Math.abs(p.x-b.x)<70&&p.y<row.y+38&&p.y>row.y-42){
          b.hp=Math.max(0,b.hp-p.damage);b.flash=1;score+=p.damage*2;burst(p.x,p.y,'#ff9a43',4);hit=true;
          if(b.hp<=0){b.broken=true;score+=45+wave*4;burst(b.x,row.y,'#ff6b27',20);try{navigator.vibrate?.(14)}catch{}}
          break;
        }
      }
      if(hit||p.y<-30)bullets.splice(bi,1);
    }
    const py=playerY();
    if(row.y>py-72&&row.y<py+36){
      for(const b of row.barriers){
        if(Math.abs(playerX-b.x)<62){
          if(!b.broken){finish();return}
          if(!b.collected)applyReward(b);
        }
      }
    }
    if(row.y>viewH+95){wave++;score+=80;makeRow();updateHud()}
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=320*dt;p.life-=dt}
    particles=particles.filter(p=>p.life>0);
    updateHud();
  }

  function rr(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h)}
  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,0,viewH);g.addColorStop(0,'#15101e');g.addColorStop(.45,'#251017');g.addColorStop(1,'#090506');ctx.fillStyle=g;ctx.fillRect(0,0,W,viewH);
    ctx.fillStyle='rgba(255,184,104,.75)';ctx.beginPath();ctx.arc(440,105,38,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,101,40,.08)';ctx.beginPath();ctx.arc(440,105,60,0,Math.PI*2);ctx.fill();
    const roadTop=110;ctx.fillStyle='#21191b';ctx.beginPath();ctx.moveTo(145,roadTop);ctx.lineTo(395,roadTop);ctx.lineTo(520,viewH);ctx.lineTo(20,viewH);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,120,54,.2)';ctx.lineWidth=2;for(const x of [180,360]){ctx.beginPath();ctx.moveTo(270+(x-270)*.43,roadTop);ctx.lineTo(x,viewH);ctx.stroke()}
    ctx.strokeStyle='rgba(248,222,188,.16)';ctx.lineWidth=5;ctx.setLineDash([24,30]);for(const x of [230,310]){ctx.beginPath();ctx.moveTo(270+(x-270)*.43,roadTop);ctx.lineTo(x,viewH);ctx.stroke()}ctx.setLineDash([]);
    for(let i=0;i<8;i++){
      const y=((i*150+(row?.y||0)*.18)%1200)-100;const side=i%2?1:-1;const x=side>0?490:50;ctx.fillStyle='rgba(28,14,18,.72)';ctx.fillRect(x-5,y,10,54);ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.fill();
    }
  }
  function drawBarrier(b){
    const y=row.y;if(b.broken){
      if(!b.collected){ctx.save();ctx.translate(b.x,y-6);ctx.fillStyle='rgba(20,7,5,.88)';ctx.strokeStyle='#ff914d';ctx.lineWidth=3;rr(-53,-31,106,62,18);ctx.fill();ctx.stroke();ctx.font='27px sans-serif';ctx.textAlign='center';ctx.fillText(b.reward.icon,0,2);ctx.fillStyle='#ffe0b8';ctx.font='800 11px Inter, sans-serif';ctx.fillText(b.reward.short,0,22);ctx.restore()}
      else{ctx.fillStyle='rgba(255,112,38,.15)';ctx.fillRect(b.x-62,y-4,124,8)}
      return;
    }
    ctx.save();ctx.translate(b.x,y);ctx.shadowColor=b.flash?'rgba(255,219,157,.95)':'rgba(0,0,0,.35)';ctx.shadowBlur=b.flash?20:8;
    const grad=ctx.createLinearGradient(-66,0,66,0);grad.addColorStop(0,'#5b2818');grad.addColorStop(.2,'#a94c24');grad.addColorStop(.5,'#d06a30');grad.addColorStop(.8,'#9c421f');grad.addColorStop(1,'#532416');ctx.fillStyle=grad;ctx.strokeStyle=row.boss?'#ffb14e':'#6c2e1d';ctx.lineWidth=row.boss?5:3;rr(-68,-38,136,76,22);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(30,10,7,.42)';ctx.fillRect(-44,-38,8,76);ctx.fillRect(36,-38,8,76);ctx.fillStyle='#ffe4c0';ctx.font=`900 ${b.hp>=100?28:34}px Inter, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(Math.ceil(b.hp)),0,2);ctx.restore();
    if(row.boss){ctx.fillStyle='#ffb14e';ctx.font='900 10px Inter, sans-serif';ctx.textAlign='center';ctx.fillText('BOSS',b.x,y-49)}
  }
  function drawPlayer(){
    const y=playerY();ctx.save();ctx.translate(playerX,y);
    ctx.fillStyle='rgba(255,106,36,.15)';ctx.beginPath();ctx.ellipse(0,34,44,13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#2a1815';rr(-24,-22,48,57,15);ctx.fill();ctx.fillStyle='#ff792e';ctx.beginPath();ctx.arc(0,-26,22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1e0a06';ctx.fillRect(-9,-31,6,6);ctx.fillRect(4,-31,6,6);ctx.beginPath();ctx.moveTo(-10,-20);ctx.lineTo(-2,-14);ctx.lineTo(3,-20);ctx.lineTo(10,-14);ctx.lineTo(12,-22);ctx.closePath();ctx.fill();
    ctx.fillStyle='#b9a9a0';ctx.fillRect(-4,-61,8,33);ctx.fillStyle='#ff9f42';ctx.fillRect(-8,-64,16,7);ctx.restore();
  }
  function drawBullets(){ctx.fillStyle='#ffd46f';for(const b of bullets){ctx.shadowColor='#ff8a2e';ctx.shadowBlur=10;ctx.fillRect(b.x-2,b.y-12,4,15)}ctx.shadowBlur=0}
  function drawParticles(){for(const p of particles){ctx.globalAlpha=clamp(p.life/.5,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  function drawTopInfo(){
    if(!running)return;ctx.fillStyle='rgba(8,4,4,.58)';rr(14,14,174,42,13);ctx.fill();ctx.fillStyle='#f4c9a3';ctx.font='800 12px Inter, sans-serif';ctx.textAlign='left';ctx.fillText(`🔥 ${damage}   ⚡ ${(1/fireDelay).toFixed(1)}/s   🔱 ${multishot}`,28,40)
  }
  function draw(){drawBackground();if(row)for(const b of row.barriers)drawBarrier(b);drawBullets();drawPlayer();drawParticles();drawTopInfo()}
  function loop(now){if(!running)return;const dt=Math.min(.03,Math.max(.001,(now-last)/1000));last=now;update(dt);draw();if(running)raf=requestAnimationFrame(loop)}

  function pointX(e){const r=canvas.getBoundingClientRect();return clamp((e.clientX-r.left)/r.width*W,42,W-42)}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;targetX=pointX(e);try{canvas.setPointerCapture(e.pointerId)}catch{}});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;e.preventDefault();targetX=pointX(e)});
  canvas.addEventListener('pointerup',e=>{dragging=false;try{canvas.releasePointerCapture(e.pointerId)}catch{}});canvas.addEventListener('pointercancel',()=>dragging=false);
  const onKey=e=>{if(e.code==='ArrowLeft'){targetX=clamp(targetX-90,42,W-42)}else if(e.code==='ArrowRight'){targetX=clamp(targetX+90,42,W-42)}else return;e.preventDefault()};window.addEventListener('keydown',onKey,{passive:false});
  startBtn.addEventListener('click',e=>{e.preventDefault();start()});

  async function enterFullscreen(){
    const box=host.closest('.blaster-game-detail');if(!box)return;fullscreen=true;box.classList.add('blaster-game-fullscreen-box');document.body.classList.add('blaster-game-fullscreen');
    const btn=box.querySelector('.blaster-fullscreen-button');if(btn){btn.textContent='✕';btn.setAttribute('aria-label','Wyłącz pełny ekran')}
    if(!history.state?.h3BlasterFullscreen){history.pushState({...history.state,h3BlasterFullscreen:true},'',location.href);pushedState=true}
    try{if(!document.fullscreenElement&&box.requestFullscreen)await box.requestFullscreen({navigationUI:'hide'})}catch{}
    try{await screen.orientation?.lock?.('portrait')}catch{}
    setTimeout(fitCanvas,90);
  }
  async function exitFullscreen(fromPop=false){
    if(!fullscreen)return;fullscreen=false;const box=host.closest('.blaster-game-detail');box?.classList.remove('blaster-game-fullscreen-box');document.body.classList.remove('blaster-game-fullscreen');
    const btn=box?.querySelector('.blaster-fullscreen-button');if(btn){btn.textContent='⛶';btn.setAttribute('aria-label','Włącz pełny ekran')}
    try{screen.orientation?.unlock?.()}catch{}try{if(document.fullscreenElement)await document.exitFullscreen?.()}catch{}
    if(!fromPop&&pushedState&&history.state?.h3BlasterFullscreen){pushedState=false;history.back()}else pushedState=false;setTimeout(fitCanvas,80)
  }
  function toggleFullscreen(){fullscreen?exitFullscreen():enterFullscreen()}
  exitFs.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();exitFullscreen()});
  const onPop=()=>{if(fullscreen)exitFullscreen(true)};const onResize=()=>setTimeout(fitCanvas,80);window.addEventListener('popstate',onPop);window.addEventListener('resize',onResize);window.addEventListener('orientationchange',onResize);
  reset();
  current={host,toggleFullscreen,exitFullscreen,stop(){running=false;cancelAnimationFrame(raf);resizeObserver?.disconnect();window.removeEventListener('keydown',onKey);window.removeEventListener('popstate',onPop);window.removeEventListener('resize',onResize);window.removeEventListener('orientationchange',onResize);exitFullscreen(true)}};
}
function unmount(){if(current){current.stop();current=null}}
function toggleFullscreen(){current?.toggleFullscreen?.()}
window.H3PumpkinBlaster={mount,unmount,toggleFullscreen};
})();
