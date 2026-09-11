(()=>{
let game=null;
const W=540,BEST='h3_pumpkin_blaster_best',LANES=[90,270,450],clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a);
const rewards=[{k:'dmg',i:'🔥',t:'DMG +1'},{k:'rate',i:'⚡',t:'SZYBKOŚĆ'},{k:'multi',i:'🔱',t:'+1 POCISK'},{k:'pts',i:'🍬',t:'+100'}];
function mount(host){
  unmount();
  host.innerHTML='<div class="blaster-shell"><div class="blaster-hud"><div><span>Wynik</span><strong class="blaster-score">0</strong></div><div><span>Fala</span><strong class="blaster-wave">1</strong></div><div><span>Rekord</span><strong class="blaster-best">0</strong></div></div><div class="blaster-stage"><canvas class="blaster-canvas" width="540" height="900"></canvas><button class="blaster-exit-fs" type="button">✕</button><div class="blaster-overlay"><div class="blaster-card"><h3>🎃 Pumpkin Blaster</h3><p>Przesuwaj łowcę w lewo i prawo. Barykady pojawiają się losowo, a ich siła rośnie wraz z mocą Twojego uzbrojenia.</p><button class="blaster-start" type="button">START</button></div></div></div><div class="blaster-tip">Tempo i wytrzymałość przeszkód rosną razem z postępem. Mocniejsza broń oznacza mocniejsze cele.</div></div>';
  const cv=host.querySelector('canvas'),ctx=cv.getContext('2d',{alpha:false}),ov=host.querySelector('.blaster-overlay'),card=host.querySelector('.blaster-card'),startBtn=host.querySelector('.blaster-start'),scoreEl=host.querySelector('.blaster-score'),waveEl=host.querySelector('.blaster-wave'),bestEl=host.querySelector('.blaster-best'),exitBtn=host.querySelector('.blaster-exit-fs');
  let H=900,scale=1,best=Number(localStorage.getItem(BEST)||0),score=0,wave=1,nextWave=1,rows=[],spawnClock=0,bullets=[],parts=[],damage=1,delay=.17,multi=1,fire=0,x=270,target=270,running=false,raf=0,last=0,drag=false,full=false,pushed=false,ro=null;
  bestEl.textContent=best;
  const py=()=>H-92;
  function fit(){const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);cv.width=Math.max(1,Math.round(r.width*d));cv.height=Math.max(1,Math.round(r.height*d));scale=cv.width/W;H=cv.height/scale;ctx.setTransform(scale,0,0,scale,0,0);if(!running)draw()}
  ro=new ResizeObserver(fit);ro.observe(cv);fit();
  function hud(){scoreEl.textContent=Math.floor(score);waveEl.textContent=wave;bestEl.textContent=best}
  function reward(i,w){let pool=w<2?rewards.filter(r=>r.k!=='multi'):rewards;let r=pool[Math.floor(Math.random()*pool.length)];if(i===1&&w%5===0)r=rewards[2];return {...r}}
  function rowSpeed(w){return Math.min(182,96+w*2.7)}
  function spawnDelay(w){const lo=Math.max(2.18,2.92-w*.021),hi=Math.max(2.95,4.06-w*.018);return rnd(lo,hi)}
  function laneCount(w,boss){if(boss)return 3;const r=Math.random();if(r<.48)return 1;if(r<.9)return 2;return 3}
  function shipPower(){const rate=.17/Math.max(.065,delay),spread=1+(multi-1)*.45;return Math.max(1,damage*rate*spread)}
  function hpScale(){return clamp(Math.pow(shipPower(),.44),1,4.35)}
  function addRow(){
    const w=nextWave++,base=7.5+w*2.28,boss=w%7===0,count=laneCount(w,boss),laneIds=[0,1,2].sort(()=>Math.random()-.5).slice(0,count),easy=laneIds[Math.floor(Math.random()*laneIds.length)],power=hpScale();
    const barriers=laneIds.map((lane,pos)=>{
      let factor;
      if(boss)factor=lane===easy?.98:rnd(1.25,1.58);
      else if(lane===easy)factor=rnd(.52,.69);
      else factor=rnd(.95,1.25);
      const adaptive=power*rnd(.94,1.08)*(boss?1.1:1);
      const hp=Math.max(3,Math.round(base*factor*adaptive));
      return{x:LANES[lane],hp,max:hp,r:reward(pos,w),broken:false,taken:false,flash:0}
    });
    rows.push({id:w,w,y:-90,speed:rowSpeed(w),boss,b:barriers});wave=Math.max(wave,w);spawnClock=spawnDelay(w);hud();
  }
  function reset(){score=0;wave=1;nextWave=1;rows=[];spawnClock=0;bullets=[];parts=[];damage=1;delay=.17;multi=1;fire=0;x=target=270;addRow();hud();draw()}
  function start(){reset();running=true;ov.hidden=true;last=performance.now();window.H3Analytics?.track?.('pumpkin_blaster_start').catch?.(()=>{});cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
  function burst(px,yy,c,n=12){const amount=Math.min(n,18);for(let i=0;i<amount;i++)parts.push({x:px,y:yy,vx:rnd(-150,150),vy:rnd(-230,80),life:rnd(.25,.6),r:rnd(2,5),c});if(parts.length>90)parts.splice(0,parts.length-90)}
  function finish(){if(!running)return;running=false;cancelAnimationFrame(raf);const s=Math.floor(score),nr=s>best;if(nr){best=s;localStorage.setItem(BEST,String(best))}burst(x,py()-15,'#ff6f2a',18);draw();card.querySelector('h3').textContent=nr?'🏆 Nowy rekord!':'💀 Koniec gry';card.querySelector('p').innerHTML=`Wynik: <strong>${s}</strong><br>Fala: <strong>${wave}</strong><br>Rekord: <strong>${best}</strong>`;startBtn.textContent='SPRÓBUJ PONOWNIE';ov.hidden=false;hud();window.H3Analytics?.track?.('pumpkin_blaster_over',{score:s,best,wave,damage,multishot:multi}).catch?.(()=>{});try{navigator.vibrate?.([45,30,80])}catch{}}
  function shoot(){for(let i=0;i<multi;i++){const o=(i-(multi-1)/2)*15;bullets.push({x:x+o,y:py()-54,vy:-790,d:damage})}if(bullets.length>110)bullets.splice(0,bullets.length-110)}
  function take(b,r){if(b.taken)return;b.taken=true;if(b.r.k==='dmg')damage=Math.min(10,damage+1);else if(b.r.k==='rate')delay=Math.max(.065,delay*.85);else if(b.r.k==='multi')multi=Math.min(6,multi+1);else score+=100;score+=35;burst(b.x,r.y,'#ffc56c',12);try{navigator.vibrate?.(16)}catch{}}
  function update(dt){
    x+=(target-x)*Math.min(1,dt*14);fire-=dt;if(fire<=0){shoot();fire+=delay}
    spawnClock-=dt;if(spawnClock<=0){if(rows.length<3)addRow();else spawnClock=.7}
    for(const r of rows){r.y+=r.speed*dt;r.b.forEach(b=>b.flash=Math.max(0,b.flash-dt*5))}
    bullets.forEach(p=>p.y+=p.vy*dt);
    const hitRows=[...rows].sort((a,b)=>b.y-a.y);
    for(let i=bullets.length-1;i>=0;i--){
      const p=bullets[i];let hit=false;
      for(const r of hitRows){
        if(p.y>r.y+46||p.y<r.y-46)continue;
        for(const b of r.b){
          if(b.broken)continue;
          if(Math.abs(p.x-b.x)<70){
            b.hp=Math.max(0,b.hp-p.d);b.flash=1;score+=p.d*2;burst(p.x,p.y,'#ff9a43',2);hit=true;
            if(b.hp<=0){b.broken=true;score+=38+r.w*3;burst(b.x,r.y,'#ff6b27',12);try{navigator.vibrate?.(12)}catch{}}
            break;
          }
        }
        if(hit)break;
      }
      if(hit||p.y<-25)bullets.splice(i,1)
    }
    const playerY=py();
    for(const r of rows){
      if(r.y>playerY-72&&r.y<playerY+34){
        for(const b of r.b){
          if(Math.abs(x-b.x)<62){
            if(!b.broken){finish();return}
            take(b,r)
          }
        }
      }
    }
    let passed=0;rows=rows.filter(r=>{if(r.y>H+95){passed++;return false}return true});if(passed)score+=passed*55;
    for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=320*dt;p.life-=dt}parts=parts.filter(p=>p.life>0);hud()
  }
  function rr(a,b,c,d,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(a,b,c,d,r):ctx.rect(a,b,c,d)}
  function bg(){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#15101e');g.addColorStop(.48,'#281016');g.addColorStop(1,'#090506');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(255,190,115,.78)';ctx.beginPath();ctx.arc(440,105,38,0,Math.PI*2);ctx.fill();ctx.fillStyle='#21191b';ctx.beginPath();ctx.moveTo(145,110);ctx.lineTo(395,110);ctx.lineTo(520,H);ctx.lineTo(20,H);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,120,54,.2)';ctx.lineWidth=2;for(const lx of [180,360]){ctx.beginPath();ctx.moveTo(270+(lx-270)*.43,110);ctx.lineTo(lx,H);ctx.stroke()}ctx.strokeStyle='rgba(248,222,188,.15)';ctx.lineWidth=5;ctx.setLineDash([24,30]);for(const lx of [230,310]){ctx.beginPath();ctx.moveTo(270+(lx-270)*.43,110);ctx.lineTo(lx,H);ctx.stroke()}ctx.setLineDash([])
  }
  function barrier(b,r){const y=r.y;if(b.broken){if(!b.taken){ctx.save();ctx.translate(b.x,y);ctx.fillStyle='rgba(20,7,5,.9)';ctx.strokeStyle='#ff914d';ctx.lineWidth=3;rr(-52,-31,104,62,18);ctx.fill();ctx.stroke();ctx.font='26px sans-serif';ctx.textAlign='center';ctx.fillText(b.r.i,0,1);ctx.fillStyle='#ffe0b8';ctx.font='800 11px Inter';ctx.fillText(b.r.t,0,22);ctx.restore()}return}ctx.save();ctx.translate(b.x,y);ctx.shadowColor=b.flash?'#ffd59a':'rgba(0,0,0,.4)';ctx.shadowBlur=b.flash?18:8;const g=ctx.createLinearGradient(-68,0,68,0);g.addColorStop(0,'#5c2818');g.addColorStop(.5,'#d16a30');g.addColorStop(1,'#512315');ctx.fillStyle=g;ctx.strokeStyle=r.boss?'#ffb14e':'#6b2d1d';ctx.lineWidth=r.boss?5:3;rr(-68,-38,136,76,22);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(30,10,7,.43)';ctx.fillRect(-44,-38,8,76);ctx.fillRect(36,-38,8,76);ctx.fillStyle='#ffe4c0';ctx.font=`900 ${b.hp>=100?28:34}px Inter`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.ceil(b.hp),0,2);ctx.restore();if(r.boss){ctx.fillStyle='#ffb14e';ctx.font='900 10px Inter';ctx.textAlign='center';ctx.fillText('BOSS',b.x,y-49)}}
  function player(){const y=py();ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(255,106,36,.16)';ctx.beginPath();ctx.ellipse(0,34,44,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2b1815';rr(-24,-21,48,56,14);ctx.fill();ctx.fillStyle='#ff792e';ctx.beginPath();ctx.arc(0,-26,22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1e0a06';ctx.fillRect(-9,-31,6,6);ctx.fillRect(4,-31,6,6);ctx.beginPath();ctx.moveTo(-10,-20);ctx.lineTo(-2,-14);ctx.lineTo(3,-20);ctx.lineTo(10,-14);ctx.lineTo(12,-22);ctx.closePath();ctx.fill();ctx.fillStyle='#b9a9a0';ctx.fillRect(-4,-61,8,33);ctx.fillStyle='#ff9f42';ctx.fillRect(-8,-64,16,7);ctx.restore()}
  function draw(){bg();for(const r of rows)for(const b of r.b)barrier(b,r);ctx.fillStyle='#ffd46f';ctx.shadowColor='#ff8a2e';ctx.shadowBlur=9;bullets.forEach(p=>ctx.fillRect(p.x-2,p.y-12,4,15));ctx.shadowBlur=0;player();for(const p of parts){ctx.globalAlpha=clamp(p.life/.5,0,1);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;if(running){ctx.fillStyle='rgba(8,4,4,.62)';rr(14,14,190,42,13);ctx.fill();ctx.fillStyle='#f4c9a3';ctx.font='800 12px Inter';ctx.fillText(`🔥 ${damage}   ⚡ ${(1/delay).toFixed(1)}/s   🔱 ${multi}`,28,40)}}
  function loop(n){if(!running)return;const dt=Math.min(.03,Math.max(.001,(n-last)/1000));last=n;update(dt);draw();if(running)raf=requestAnimationFrame(loop)}
  const px=e=>{const r=cv.getBoundingClientRect();return clamp((e.clientX-r.left)/r.width*W,42,W-42)};cv.addEventListener('pointerdown',e=>{e.preventDefault();drag=true;target=px(e);try{cv.setPointerCapture(e.pointerId)}catch{}});cv.addEventListener('pointermove',e=>{if(drag){e.preventDefault();target=px(e)}});cv.addEventListener('pointerup',()=>drag=false);cv.addEventListener('pointercancel',()=>drag=false);startBtn.onclick=start;
  const key=e=>{if(e.code==='ArrowLeft')target=clamp(target-90,42,W-42);else if(e.code==='ArrowRight')target=clamp(target+90,42,W-42);else return;e.preventDefault()};window.addEventListener('keydown',key,{passive:false});
  async function enter(){const box=host.closest('.blaster-game-detail');if(!box)return;full=true;box.classList.add('blaster-game-fullscreen-box');document.body.classList.add('blaster-game-fullscreen');if(!history.state?.h3BlasterFullscreen){history.pushState({...history.state,h3BlasterFullscreen:true},'',location.href);pushed=true}try{if(!document.fullscreenElement&&box.requestFullscreen)await box.requestFullscreen({navigationUI:'hide'})}catch{}try{await screen.orientation?.lock?.('portrait')}catch{}setTimeout(fit,100)}
  async function exit(fromPop=false){if(!full)return;full=false;host.closest('.blaster-game-detail')?.classList.remove('blaster-game-fullscreen-box');document.body.classList.remove('blaster-game-fullscreen');try{screen.orientation?.unlock?.()}catch{}try{if(document.fullscreenElement)await document.exitFullscreen?.()}catch{}if(!fromPop&&pushed&&history.state?.h3BlasterFullscreen){pushed=false;history.back()}else pushed=false;setTimeout(fit,80)}
  const toggle=()=>full?exit():enter(),pop=()=>{if(full)exit(true)},resize=()=>setTimeout(fit,80);exitBtn.onclick=e=>{e.preventDefault();e.stopPropagation();exit()};window.addEventListener('popstate',pop);window.addEventListener('resize',resize);window.addEventListener('orientationchange',resize);reset();
  game={toggle,stop(){running=false;cancelAnimationFrame(raf);ro?.disconnect();window.removeEventListener('keydown',key);window.removeEventListener('popstate',pop);window.removeEventListener('resize',resize);window.removeEventListener('orientationchange',resize);exit(true)}}
}
function unmount(){if(game){game.stop();game=null}}
window.H3PumpkinBlaster={mount,unmount,toggleFullscreen(){game?.toggle?.()}};
})();
