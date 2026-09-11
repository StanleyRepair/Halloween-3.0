(()=>{
let current=null;
const BEST_KEY='h3_halloween_dash_best';
const W=960,H=540,GROUND=430;
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function mount(host){
  unmount();
  if(!host)return;
  host.innerHTML=`<div class="dash-shell"><div class="dash-hud"><div><span>Wynik</span><strong class="dash-score">0</strong></div><div><span>Prędkość</span><strong class="dash-speed">1.0×</strong></div><div><span>Rekord</span><strong class="dash-best">0</strong></div></div><div class="dash-stage"><canvas class="dash-canvas" width="960" height="540" aria-label="Halloween Dash"></canvas><div class="dash-overlay"><div class="dash-card"><h3>🎃 Halloween Dash</h3><p>Postać biegnie sama. Stuknij ekran, aby skoczyć nad przeszkodami. Im dalej dojdziesz, tym szybciej robi się na trasie.</p><button type="button" class="dash-start">START</button></div></div></div><div class="dash-tip"><b>Sterowanie:</b> stuknięcie ekranu albo spacja. Jeden skok, jeden rytm.</div></div>`;

  const shell=host.querySelector('.dash-shell'),canvas=host.querySelector('.dash-canvas'),ctx=canvas.getContext('2d',{alpha:false}),overlay=host.querySelector('.dash-overlay'),card=host.querySelector('.dash-card'),startBtn=host.querySelector('.dash-start'),scoreEl=host.querySelector('.dash-score'),speedEl=host.querySelector('.dash-speed'),bestEl=host.querySelector('.dash-best');
  let best=Number(localStorage.getItem(BEST_KEY)||0),running=false,dead=false,raf=0,last=0,elapsed=0,distance=0,score=0,speed=360,spawnDistance=0,fullscreen=false,pushedState=false,resizeObserver=null,forcedTimer=0;
  let obstacles=[],particles=[],candies=[],decor=[];
  const player={x:165,y:GROUND-46,w:46,h:46,vy:0,onGround:true,rot:0};
  bestEl.textContent=String(best);

  function fitCanvas(){
    const r=canvas.getBoundingClientRect();
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const cssW=Math.max(1,r.width),cssH=Math.max(1,r.height);
    canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
  }
  resizeObserver=new ResizeObserver(()=>fitCanvas());resizeObserver.observe(canvas);fitCanvas();

  function resetWorld(){
    obstacles=[];particles=[];candies=[];decor=[];elapsed=0;distance=0;score=0;speed=360;spawnDistance=420;
    player.y=GROUND-player.h;player.vy=0;player.onGround=true;player.rot=0;
    for(let i=0;i<18;i++)decor.push({x:i*90+rand(0,60),kind:Math.random()<.55?'grave':'pumpkin',s:rand(.6,1.1)});
    updateHud();
  }
  function updateHud(){scoreEl.textContent=String(score);speedEl.textContent=(speed/360).toFixed(1)+'×';bestEl.textContent=String(best)}

  function start(){
    resetWorld();dead=false;running=true;overlay.hidden=true;last=performance.now();
    window.H3Analytics?.track?.('halloween_dash_start').catch?.(()=>{});
    cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
  }
  function finish(){
    if(!running)return;
    running=false;dead=true;cancelAnimationFrame(raf);
    if(score>best){best=score;localStorage.setItem(BEST_KEY,String(best));bestEl.textContent=String(best)}
    burst(player.x+player.w/2,player.y+player.h/2,'#ff7a2f',28);
    draw();
    card.querySelector('h3').textContent=score>=best&&score>0?'🏆 Nowy rekord!':'💀 Koniec biegu';
    card.querySelector('p').innerHTML=`Wynik: <strong>${score}</strong><br>Rekord: <strong>${best}</strong>`;
    startBtn.textContent='SPRÓBUJ PONOWNIE';overlay.hidden=false;
    window.H3Analytics?.track?.('halloween_dash_over',{score,best,distance:Math.round(distance),seconds:Number(elapsed.toFixed(1))}).catch?.(()=>{});
    try{navigator.vibrate?.([40,35,75])}catch{}
  }
  function jump(){
    if(!running){if(dead)start();return}
    if(!player.onGround)return;
    player.vy=-820;player.onGround=false;
    try{navigator.vibrate?.(10)}catch{}
  }

  function spawn(){
    const difficulty=clamp(score/350,0,1);
    const r=Math.random();
    let type=r<.45?'spike':r<.67?'double':r<.86?'grave':'bat';
    if(score<40&&type==='bat')type='spike';
    const o={x:W+70,type,w:40,h:42,y:GROUND-42};
    if(type==='double'){o.w=76;o.h=42;o.y=GROUND-42}
    if(type==='grave'){o.w=48;o.h=74;o.y=GROUND-74}
    if(type==='bat'){o.w=52;o.h=34;o.y=GROUND-rand(122,155)}
    obstacles.push(o);
    if(Math.random()<.32)candies.push({x:o.x+o.w/2+rand(45,85),y:GROUND-rand(105,170),r:12,t:0});
    spawnDistance=rand(260,390)-difficulty*55;
  }

  function aabb(a,b,pad=0){return a.x+pad<b.x+b.w-pad&&a.x+a.w-pad>b.x+pad&&a.y+pad<b.y+b.h-pad&&a.y+a.h-pad>b.y+pad}
  function update(dt){
    elapsed+=dt;speed=Math.min(620,360+elapsed*7.5);distance+=speed*dt;score=Math.floor(distance/34);
    spawnDistance-=speed*dt;if(spawnDistance<=0)spawn();

    player.vy+=2200*dt;player.y+=player.vy*dt;
    if(player.y>=GROUND-player.h){player.y=GROUND-player.h;player.vy=0;player.onGround=true;player.rot=0}else player.rot+=dt*5.7;

    for(const o of obstacles)o.x-=speed*dt;
    obstacles=obstacles.filter(o=>o.x+o.w>-80);
    for(const c of candies){c.x-=speed*dt;c.t+=dt}
    candies=candies.filter(c=>c.x+c.r>-40);
    for(const d of decor){d.x-=speed*.22*dt;if(d.x<-80)d.x+=W+260}
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=420*dt;p.life-=dt}
    particles=particles.filter(p=>p.life>0);

    const pb={x:player.x+6,y:player.y+5,w:player.w-12,h:player.h-9};
    for(const o of obstacles){
      const ob=o.type==='spike'||o.type==='double'?{x:o.x+7,y:o.y+10,w:o.w-14,h:o.h-10}:o;
      if(aabb(pb,ob,2)){finish();return}
    }
    for(let i=candies.length-1;i>=0;i--){
      const c=candies[i],cb={x:c.x-c.r,y:c.y-c.r,w:c.r*2,h:c.r*2};
      if(aabb(pb,cb)){distance+=850;burst(c.x,c.y,'#ffb23f',12);candies.splice(i,1);try{navigator.vibrate?.(6)}catch{}}
    }
    updateHud();
  }

  function burst(x,y,color,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-180,180),vy:rand(-240,-30),life:rand(.35,.75),r:rand(2,5),color})}

  function drawBackground(){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#10061a');g.addColorStop(.5,'#250b19');g.addColorStop(1,'#080507');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,124,42,.13)';ctx.beginPath();ctx.arc(780,110,72,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,207,134,.72)';ctx.beginPath();ctx.arc(780,110,48,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.34)';for(let i=0;i<10;i++){const x=((i*137-distance*.05)%1200+1200)%1200-80;const h=randHash(i)*90+55;ctx.fillRect(x,GROUND-h,28,h);ctx.beginPath();ctx.moveTo(x-15,GROUND-h);ctx.lineTo(x+14,GROUND-h-45);ctx.lineTo(x+43,GROUND-h);ctx.fill()}
    ctx.fillStyle='rgba(123,41,24,.26)';for(let i=0;i<7;i++){const x=((i*190-distance*.1)%1350+1350)%1350-120;ctx.beginPath();ctx.arc(x,330,55,Math.PI,0);ctx.fill()}
  }
  function randHash(i){const x=Math.sin(i*999+17)*43758.5453;return x-Math.floor(x)}
  function drawGround(){
    ctx.fillStyle='#120909';ctx.fillRect(0,GROUND,W,H-GROUND);ctx.fillStyle='#8a321a';ctx.fillRect(0,GROUND, W,5);ctx.fillStyle='rgba(255,123,50,.14)';
    for(let x=(-distance*.6)%58;x<W;x+=58)ctx.fillRect(x,GROUND+30,32,4);
    for(const d of decor){if(d.kind==='grave'){ctx.fillStyle='rgba(57,45,50,.7)';ctx.fillRect(d.x,GROUND-44*d.s,28*d.s,44*d.s);ctx.beginPath();ctx.arc(d.x+14*d.s,GROUND-44*d.s,14*d.s,Math.PI,0);ctx.fill()}else{ctx.fillStyle='rgba(184,62,18,.5)';ctx.beginPath();ctx.ellipse(d.x,GROUND-15*d.s,18*d.s,14*d.s,0,0,Math.PI*2);ctx.fill()}}
  }
  function drawPlayer(){
    ctx.save();ctx.translate(player.x+player.w/2,player.y+player.h/2);ctx.rotate(player.rot);ctx.shadowColor='rgba(255,103,28,.55)';ctx.shadowBlur=18;ctx.fillStyle='#ef6425';roundRect(-23,-23,46,46,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#2a0d0c';ctx.fillRect(-12,-8,7,8);ctx.fillRect(5,-8,7,8);ctx.beginPath();ctx.moveTo(-12,8);ctx.lineTo(-4,14);ctx.lineTo(2,8);ctx.lineTo(8,14);ctx.lineTo(13,8);ctx.closePath();ctx.fill();ctx.restore()
  }
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):(ctx.rect(x,y,w,h))}
  function drawObstacle(o){
    if(o.type==='spike'||o.type==='double'){
      const count=o.type==='double'?2:1,sw=o.w/count;ctx.fillStyle='#d8d4d0';ctx.strokeStyle='#ff6f2c';ctx.lineWidth=3;
      for(let i=0;i<count;i++){ctx.beginPath();ctx.moveTo(o.x+i*sw,o.y+o.h);ctx.lineTo(o.x+i*sw+sw/2,o.y);ctx.lineTo(o.x+(i+1)*sw,o.y+o.h);ctx.closePath();ctx.fill();ctx.stroke()}
    }else if(o.type==='grave'){
      ctx.fillStyle='#5a4b54';ctx.strokeStyle='#ba5a35';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(o.x,o.y+o.h);ctx.lineTo(o.x,o.y+20);ctx.quadraticCurveTo(o.x+o.w/2,o.y-10,o.x+o.w,o.y+20);ctx.lineTo(o.x+o.w,o.y+o.h);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#1d1418';ctx.font='700 18px Inter';ctx.textAlign='center';ctx.fillText('RIP',o.x+o.w/2,o.y+43)
    }else{
      ctx.save();ctx.translate(o.x+o.w/2,o.y+o.h/2);ctx.fillStyle='#4b243f';ctx.beginPath();ctx.moveTo(-26,3);ctx.quadraticCurveTo(-13,-16,0,-3);ctx.quadraticCurveTo(13,-16,26,3);ctx.quadraticCurveTo(10,-3,0,13);ctx.quadraticCurveTo(-10,-3,-26,3);ctx.fill();ctx.fillStyle='#ff8b3d';ctx.fillRect(-7,-3,4,3);ctx.fillRect(3,-3,4,3);ctx.restore()
    }
  }
  function drawCandy(c){ctx.save();ctx.translate(c.x,c.y+Math.sin(c.t*6)*4);ctx.rotate(c.t*1.8);ctx.fillStyle='#ffb33e';ctx.shadowColor='#ff8b25';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,c.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#55162b';ctx.fillRect(-4,-10,8,20);ctx.restore()}
  function drawParticles(){for(const p of particles){ctx.globalAlpha=clamp(p.life/.5,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  function draw(){drawBackground();drawGround();for(const c of candies)drawCandy(c);for(const o of obstacles)drawObstacle(o);drawPlayer();drawParticles()}
  function loop(now){if(!running)return;const dt=Math.min(.033,Math.max(.001,(now-last)/1000));last=now;update(dt);draw();if(running)raf=requestAnimationFrame(loop)}

  canvas.addEventListener('pointerdown',e=>{e.preventDefault();jump()});
  const onKey=e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump()}};window.addEventListener('keydown',onKey,{passive:false});
  startBtn.addEventListener('click',e=>{e.preventDefault();start()});
  resetWorld();draw();

  function updateOrientationClass(){
    const box=host.closest('.dash-game-detail');if(!box||!fullscreen)return;
    box.classList.toggle('dash-force-landscape',window.innerHeight>window.innerWidth);
    clearTimeout(forcedTimer);forcedTimer=setTimeout(()=>fitCanvas(),80);
  }
  async function enterFullscreen(){
    const box=host.closest('.dash-game-detail');if(!box)return;
    fullscreen=true;box.classList.add('dash-game-fullscreen-box');document.body.classList.add('dash-game-fullscreen');
    const btn=box.querySelector('.dash-fullscreen-button');if(btn){btn.textContent='✕';btn.setAttribute('aria-label','Wyłącz pełny ekran')}
    if(!history.state?.h3DashFullscreen){history.pushState({...history.state,h3DashFullscreen:true},'',location.href);pushedState=true}
    try{if(!document.fullscreenElement&&box.requestFullscreen)await box.requestFullscreen({navigationUI:'hide'})}catch{}
    try{await screen.orientation?.lock?.('landscape')}catch{}
    updateOrientationClass();setTimeout(updateOrientationClass,250);
  }
  async function exitFullscreen(fromPop=false){
    if(!fullscreen)return;
    fullscreen=false;
    const box=host.closest('.dash-game-detail');box?.classList.remove('dash-game-fullscreen-box','dash-force-landscape');document.body.classList.remove('dash-game-fullscreen');
    const btn=box?.querySelector('.dash-fullscreen-button');if(btn){btn.textContent='⛶';btn.setAttribute('aria-label','Włącz pełny ekran')}
    try{screen.orientation?.unlock?.()}catch{}
    try{if(document.fullscreenElement)await document.exitFullscreen?.()}catch{}
    if(!fromPop&&pushedState&&history.state?.h3DashFullscreen){pushedState=false;history.back()}else pushedState=false;
    setTimeout(()=>fitCanvas(),80);
  }
  function toggleFullscreen(){fullscreen?exitFullscreen():enterFullscreen()}
  const onPop=()=>{if(fullscreen)exitFullscreen(true)};
  const onResize=()=>updateOrientationClass();
  window.addEventListener('popstate',onPop);window.addEventListener('resize',onResize);window.addEventListener('orientationchange',onResize);

  current={host,toggleFullscreen,exitFullscreen,stop(){running=false;cancelAnimationFrame(raf);clearTimeout(forcedTimer);resizeObserver?.disconnect();window.removeEventListener('keydown',onKey);window.removeEventListener('popstate',onPop);window.removeEventListener('resize',onResize);window.removeEventListener('orientationchange',onResize);exitFullscreen(true)}};
}

function unmount(){if(current){current.stop();current=null}}
function toggleFullscreen(){current?.toggleFullscreen?.()}
window.H3HalloweenDash={mount,unmount,toggleFullscreen};
})();