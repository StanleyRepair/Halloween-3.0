const costumes=[
 ['🧛','🦇','💀','Wampir'],
 ['🧟','🕷️','👻','Zombie'],
 ['🤡','🎃','😈','Straszny klaun'],
 ['👻','💀','🕸️','Duch'],
 ['🧙','🔮','🦇','Czarodziej'],
 ['🧛‍♀️','🌙','🕷️','Wampirzyca'],
 ['🪓','💀','🩸','Rzeźnik'],
 ['👺','🔥','😈','Demon'],
 ['🧟‍♀️','🕸️','🧠','Zombie girl'],
 ['🧙‍♀️','🌙','🔮','Wiedźma']
];
const reels=[document.getElementById('reel1'),document.getElementById('reel2'),document.getElementById('reel3')];
const button=document.getElementById('spinButton');
const display=document.getElementById('costumeDisplay');
const result=document.getElementById('resultCard');
const resultTitle=document.getElementById('resultTitle');
const again=document.getElementById('againButton');
let busy=false;

function setReel(el, emoji){
 const item=document.createElement('div'); item.className='symbol'; item.textContent=emoji;
 el.appendChild(item); el.style.transform=`translateY(-${(el.children.length-1)*172}px)`;
}
function spin(){
 if(busy)return; busy=true; result.hidden=true; display.innerHTML='<span>LOSOWANIE...</span>';
 const pick=costumes[Math.floor(Math.random()*costumes.length)];
 const choices=[...costumes].sort(()=>Math.random()-.5);
 reels.forEach((reel,i)=>{
   reel.style.transition='none'; reel.style.transform='translateY(0)';
   reel.innerHTML='';
   const sequence=[...Array(8)].flatMap(()=>choices).slice(0,24);
   sequence.forEach(c=>{const d=document.createElement('div');d.className='symbol';d.textContent=c[i%3];reel.appendChild(d)});
   const targetIndex=18+Math.floor(Math.random()*3);
   const wanted=document.createElement('div');wanted.className='symbol';wanted.textContent=pick[i];reel.appendChild(wanted);
   requestAnimationFrame(()=>{
     reel.style.transition=`transform ${2.1+i*.55}s cubic-bezier(.08,.72,.12,1)`;
     reel.style.transform=`translateY(-${(targetIndex+1)*172}px)`;
   });
 });
 setTimeout(()=>{
   display.innerHTML='<span>🎃 TWÓJ KOSTIUM ZOSTAŁ WYBRANY 🎃</span>';
   resultTitle.textContent=pick[3];
   result.querySelector('p').textContent='Los zdecydował. Teraz pozostaje tylko wcielić się w rolę.';
   result.hidden=false;
   result.scrollIntoView({behavior:'smooth',block:'center'});
   busy=false;
 },3900);
}
button.addEventListener('click',spin); again.addEventListener('click',spin);
