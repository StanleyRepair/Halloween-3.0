const FALLBACK_COSTUMES = [
  { name: 'Shrek', icon: '🧌', vibe: 'Ogr, bagno i absolutny brak manier.', type: 'fantasy' },
  { name: 'Wampir', icon: '🧛🩸', vibe: 'Elegancki krwiopijca po zmroku.', type: 'horror' },
  { name: 'Batman', icon: '🦇🦸', vibe: 'Mroczny rycerz przybywa na imprezę.', type: 'hero' },
  { name: 'Czarownica', icon: '🧙‍♀️🧹', vibe: 'Miotła, zaklęcia i bardzo podejrzane mikstury.', type: 'witch' },
  { name: 'Pirata', icon: '🏴‍☠️⚓', vibe: 'Łupienie parkietu obowiązkowe.', type: 'pirate' }
];

const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
const button = document.getElementById('spinButton');
const display = document.getElementById('costumeDisplay');
const result = document.getElementById('resultCard');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const again = document.getElementById('againButton');
const appInstallButton = document.getElementById('appInstallButton');
let deferredInstallPrompt = null;
let costumes = [];
let busy = false;

function parseCostumes(text) {
  return text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => {
    const [name, icon, vibe = '', type = 'default', image = ''] = line.split('|').map(part => part.trim());
    return { name, icon, vibe, type, image };
  }).filter(item => item.name && item.icon);
}

async function loadCostumes() {
  try {
    const response = await fetch(`costumes.txt?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parseCostumes(await response.text());
    if (!parsed.length) throw new Error('Pusta lista przebrań');
    costumes = parsed;
  } catch (error) {
    console.warn('Nie udało się wczytać costumes.txt. Używam listy awaryjnej.', error);
    costumes = FALLBACK_COSTUMES;
  }
  renderIdleSymbols();
}

function symbolMarkup(costume) {
  const visual = costume.image ? `<img src="images/${encodeURIComponent(costume.image)}" alt="" loading="eager" draggable="false">` : `<span class="symbol-emoji" aria-hidden="true">${costume.icon}</span>`;
  return `<div class="symbol symbol-${costume.type || 'default'}" aria-hidden="true"><div class="symbol-art">${visual}</div><div class="symbol-name">${costume.name}</div></div>`;
}

function renderIdleSymbols() {
  const mystery = `<div class="symbol symbol-mystery" aria-hidden="true"><div class="symbol-art"><span class="bloody-question">?</span></div><div class="symbol-name">???</div></div>`;
  reels.forEach((reel, reelIndex) => {
    reel.innerHTML = mystery;
    reel.style.transition = 'none';
    reel.style.transform = 'translate3d(0,0,0)';
    reel.dataset.reelIndex = reelIndex;
  });
}

function spin() {
  if (busy || !costumes.length) return;
  busy = true; result.hidden = true; display.innerHTML = '<span>LOSOWANIE...</span>'; button.disabled = true; again.disabled = true;
  const pick = costumes[Math.floor(Math.random() * costumes.length)];
  const shuffled = [...costumes].sort(() => Math.random() - 0.5);
  const rounds = 5;
  reels.forEach((reel, reelIndex) => {
    reel.style.transition = 'none'; reel.style.transform = 'translate3d(0,0,0)';
    const sequence = [];
    for (let round = 0; round < rounds; round += 1) shuffled.forEach(costume => sequence.push(costume));
    sequence.push(pick);
    reel.innerHTML = sequence.map(symbolMarkup).join('');
    const itemHeight = reel.querySelector('.symbol').getBoundingClientRect().height;
    const offset = (sequence.length - 1) * itemHeight;
    const duration = 2600 + reelIndex * 650;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      reel.style.transition = `transform ${duration}ms cubic-bezier(.08,.72,.12,1)`;
      reel.style.transform = `translate3d(0,-${offset}px,0)`;
    }));
  });
  setTimeout(() => {
    reels.forEach(reel => {
      const last = reel.lastElementChild; if (!last) return;
      const height = last.getBoundingClientRect().height;
      reel.style.transition = 'none'; reel.style.transform = `translate3d(0,-${(reel.children.length - 1) * height}px,0)`;
    });
    display.innerHTML = '<span>🎃 TRZY TAKIE SAME = WYGRANA! 🎃</span>';
    resultTitle.textContent = pick.name; resultText.textContent = pick.vibe || 'Powodzenia. Będziesz go potrzebować.';
    result.hidden = false; result.classList.remove('jackpot'); void result.offsetWidth; result.classList.add('jackpot');
    button.disabled = false; again.disabled = false; busy = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 3700);
}

function isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (!isStandaloneApp() && appInstallButton) appInstallButton.hidden = false;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (appInstallButton) appInstallButton.hidden = true;
});

if (appInstallButton) {
  if (isStandaloneApp()) appInstallButton.hidden = true;
  appInstallButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    appInstallButton.disabled = true;
    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } finally {
      deferredInstallPrompt = null;
      appInstallButton.hidden = true;
      appInstallButton.disabled = false;
    }
  });
}

loadCostumes();
button.addEventListener('click', spin);
again.addEventListener('click', spin);
