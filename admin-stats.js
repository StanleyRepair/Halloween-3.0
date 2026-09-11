(()=>{
const card=document.getElementById('adminStatsCard');if(!card)return;
let data=null;
const GAME_INFO={
  creepy:{title:'Creepy Pumpkin',icon:'🎃'},
  candle:{title:'Zgaś świece',icon:'🕯️'},
  halloween_match:{title:'Halloween Match',icon:'🧩'},
  dark_ritual:{title:'Mroczny rytuał',icon:'🔮'}
};
const esc=v=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const fmt=n=>new Intl.NumberFormat('pl-PL').format(Number(n||0));
const humanize=k=>String(k||'gra').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
function gameInfo(key){return GAME_INFO[key]||{title:humanize(key),icon:'🎮'}}
function resetBtn(metric){return data?.is_super?`<button class="analytics-reset" data-reset-stat="${metric}" title="Wyzeruj statystykę">↺</button>`:''}
function stat(icon,value,label,metric,small=''){return `<div class="analytics-stat">${resetBtn(metric)}<div class="analytics-icon">${icon}</div><strong>${fmt(value)}</strong><span>${esc(label)}</span>${small?`<small>${esc(small)}</small>`:''}</div>`}
function pairStat(icon,left,right,label,metric,small=''){return `<div class="analytics-stat">${resetBtn(metric)}<div class="analytics-icon">${icon}</div><strong>${fmt(left)} / ${fmt(right)}</strong><span>${esc(label)}</span>${small?`<small>${esc(small)}</small>`:''}</div>`}
function gameStatsMarkup(){
  const games=Array.isArray(data?.games)?data.games:[];
  return games.map(g=>{
    const info=gameInfo(g.key),metric=`game:${g.key}`;
    return `${stat(info.icon,g.players,`Gracze ${info.title}`,metric,'Unikalni gracze')}${stat('🎮',g.plays,`Rozgrywki ${info.title}`,metric,`Śr. wynik ${g.avg_score||0}, rekord ${g.best_score||0} • zakończone ${fmt(g.completed||0)}`)}`;
  }).join('');
}
function render(){
  if(!data){card.innerHTML='<div class="empty">Ładowanie statystyk...</div>';return}
  const ctx=data.contexts||{},days=data.last7days||[],max=Math.max(1,...days.map(x=>Number(x.opens||0)));
  card.innerHTML=`<div class="analytics-card"><div class="list-head"><div><h2>Statystyki</h2><p class="small">Aktywność użytkowników, instalacje, losowarka przebrań, powiadomienia i wszystkie gry.</p></div><div class="analytics-head-actions">${data.is_super?'<button class="danger-button analytics-reset-all" id="resetAllAnalytics">Wyzeruj wszystko</button>':''}<button class="secondary analytics-refresh" id="refreshAnalytics">Odśwież</button></div></div><div class="analytics-grid">${stat('👥',data.users,'Użytkownicy','users','Identyfikator jest łączony przy przejściu między przeglądarką a PWA')}${stat('📲',data.installed_users,'Instalacje aplikacji','installs','Ponowna instalacja z tym samym identyfikatorem nie zwiększa licznika')}${stat('🔗',data.link_opens,'Otwarcia linku','link_opens','Messenger → przeglądarka liczy się jako jedno')}${stat('👻',data.all_opens,'Wszystkie uruchomienia','all_opens','Każde wejście lub otwarcie aplikacji')}${stat('📱',data.pwa_opens,'Uruchomienia PWA','pwa_opens','Tylko zainstalowana aplikacja')}${pairStat('🎭',data.costume_draw_users,data.costume_draw_uses,'Losowarka przebrań','costume_draw','Urządzenia / wszystkie losowania')}${gameStatsMarkup()}<div class="analytics-stat analytics-wide">${resetBtn('push')}<div class="analytics-icon">🔔</div><strong>${Number(data.push_open_rate||0).toFixed(1)}%</strong><span>Otwarcia powiadomień</span><div class="analytics-push-row"><div><b>${fmt(data.push_sent)}</b><em>Wysłane</em></div><div><b>${fmt(data.push_opened_unique)}</b><em>Otwarte przez użytkowników</em></div><div><b>${fmt(data.push_open_clicks)}</b><em>Łączne kliknięcia</em></div></div><small>${fmt(data.push_campaigns)} kampanii • ${fmt(data.push_subscribers)} aktywnych subskrypcji push</small></div><div class="analytics-stat analytics-wide">${resetBtn('dashboard')}<div class="analytics-icon">📊</div><strong>${fmt(data.today_users)} / ${fmt(data.today_opens)}</strong><span>Dzisiaj: użytkownicy / uruchomienia</span><div class="analytics-contexts"><span>PWA: ${fmt(ctx.pwa||0)}</span><span>Messenger: ${fmt(ctx.messenger||0)}</span><span>Przeglądarka: ${fmt(ctx.browser||0)}</span></div><div class="analytics-bars">${days.map(x=>{const h=Math.max(3,Math.round(62*Number(x.opens||0)/max));const d=new Date(x.date);return `<div class="analytics-bar"><i style="height:${h}px"></i><small>${d.toLocaleDateString('pl-PL',{weekday:'short'}).slice(0,2)}</small></div>`}).join('')}</div></div></div></div>`;
  card.querySelector('#refreshAnalytics')?.addEventListener('click',load);
  card.querySelector('#resetAllAnalytics')?.addEventListener('click',resetAll);
  card.querySelectorAll('[data-reset-stat]').forEach(b=>b.onclick=()=>resetStat(b.dataset.resetStat));
}
async function load(){
  try{
    const [baseRes,gamesRes]=await Promise.all([
      sb.rpc('admin_get_analytics',{p_device_token:adminDevice}),
      sb.rpc('admin_get_game_analytics',{p_device_token:adminDevice})
    ]);
    if(baseRes.error)throw baseRes.error;
    if(gamesRes.error)throw gamesRes.error;
    data={...(baseRes.data||{}),games:gamesRes.data?.games||[],is_super:!!(baseRes.data?.is_super||gamesRes.data?.is_super)};
    render();
  }catch(e){card.innerHTML=`<div class="empty">${esc(e.message||'Nie udało się pobrać statystyk.')}</div>`}
}
async function resetStat(metric){
  if(!confirm('Wyzerować tę statystykę? Dane od tego momentu będą liczone od zera.'))return;
  try{
    if(String(metric).startsWith('game:')){
      const key=String(metric).slice(5);
      const{error}=await sb.rpc('admin_reset_game_analytics',{p_device_token:adminDevice,p_game_key:key});
      if(error)throw error;
    }else{
      const{error}=await sb.rpc('admin_reset_analytics',{p_device_token:adminDevice,p_metric:metric});
      if(error)throw error;
    }
    msg('Statystyka wyzerowana ✓');await load();
  }catch(e){msg(e.message||'Nie udało się wyzerować statystyki.',true)}
}
async function resetAll(){
  if(!confirm('Wyzerować wszystkie statystyki? Aktywne subskrypcje push, ustawienia i dane aplikacji pozostaną bez zmian.'))return;
  try{
    const [baseRes,gamesRes]=await Promise.all([
      sb.rpc('admin_reset_analytics',{p_device_token:adminDevice,p_metric:'all'}),
      sb.rpc('admin_reset_game_analytics',{p_device_token:adminDevice,p_game_key:'all'})
    ]);
    if(baseRes.error)throw baseRes.error;
    if(gamesRes.error)throw gamesRes.error;
    msg('Wszystkie statystyki wyzerowane ✓');await load();
  }catch(e){msg(e.message||'Nie udało się wyzerować statystyk.',true)}
}
window.loadAdminStats=load;setTimeout(load,500);
})();