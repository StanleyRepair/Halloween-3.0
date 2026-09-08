const costumes = [
  { name: 'Shrek', icon: '🧌', vibe: 'Ogr, bagno i absolutny brak manier.' },
  { name: 'Harry Potter', icon: '🧙‍♂️⚡', vibe: 'Peleryna, różdżka i blizna. Magia sama się nie rzuci.' },
  { name: 'Atomówka', icon: '👧🎀', vibe: 'Słodko tylko z pozoru. Nadlatuje mała bohaterka.' },
  { name: 'Spider Man', icon: '🕷️🕸️', vibe: 'Pajęcza sieć i skakanie po ścianach mile widziane.' },
  { name: 'Batman', icon: '🦇🦸', vibe: 'Mroczny rycerz Gotham przybywa na imprezę.' },
  { name: 'Robin', icon: '🦸‍♂️🟢', vibe: 'Młody Tytan wjeżdża w zielono czerwonym stylu.' },
  { name: 'Superman', icon: '🦸‍♂️🔴', vibe: 'Peleryna, supermoce i zdecydowanie za dużo pewności siebie.' },
  { name: 'Wonder Woman', icon: '🦸‍♀️🛡️', vibe: 'Amazonka gotowa ratować świat przed nudą.' },
  { name: 'Iron Man', icon: '🤖❤️', vibe: 'Technologia, ego i czerwono złota zbroja.' },
  { name: 'Hulk', icon: '💚💪', vibe: 'Zielony, wielki i raczej nieproszony na spokojną imprezę.' },
  { name: 'Kapitan Ameryka', icon: '🦸‍♂️🛡️', vibe: 'Tarcza gotowa. Patriotyczny poziom maksimum.' },
  { name: 'Deadpool', icon: '🥷🔴', vibe: 'Czerwony najemnik, który nie potrafi przestać gadać.' },
  { name: 'Kung Fu Panda', icon: '🐼🥋', vibe: 'Mistrz kung fu i specjalista od jedzenia.' },
  { name: 'Ninja', icon: '🥷⚔️', vibe: 'Cicho, szybko i najlepiej bez śladu.' },
  { name: 'Pirata', icon: '🏴‍☠️⚓', vibe: 'Papuga nieobowiązkowa. Łupienie parkietu obowiązkowe.' },
  { name: 'Księżniczka', icon: '👸✨', vibe: 'Królewski szyk, brokat i zero kolejek.' },
  { name: 'Książę', icon: '🤴👑', vibe: 'Elegancja wysokiego poziomu i korona na głowie.' },
  { name: 'Kopciuszek', icon: '👠✨', vibe: 'Jedyny problem to pilnowanie godziny dwunastej.' },
  { name: 'Czerwony Kapturek', icon: '🧺🐺', vibe: 'Las, koszyk i wilk gdzieś bardzo blisko.' },
  { name: 'Wilk', icon: '🐺🌕', vibe: 'Idealny dla tych, którzy wolą wyć niż tańczyć.' },
  { name: 'Kot w Butach', icon: '🐱👢', vibe: 'Miecz, kapelusz i spojrzenie zawodowego podrywacza.' },
  { name: 'Jaś i Małgosia', icon: '🍭🏠', vibe: 'Słodki domek, ale czarownica może pokrzyżować plany.' },
  { name: 'Czarownica', icon: '🧙‍♀️🧹', vibe: 'Miotła, zaklęcia i bardzo podejrzane mikstury.' },
  { name: 'Wampir', icon: '🧛🩸', vibe: 'Elegancki krwiopijca po godzinach.' },
  { name: 'Wiedźma', icon: '🧙‍♀️🔮', vibe: 'Klasyczny Halloween. Kociołek mile widziany.' },
  { name: 'Zombie', icon: '🧟🧠', vibe: 'Powolny marsz, szybki apetyt.' },
  { name: 'Szkielet', icon: '💀☠️', vibe: 'Kości na wierzchu i zero potrzeby kremu.' },
  { name: 'Duch', icon: '👻🕯️', vibe: 'Przyszedł straszyć. Został potańczyć.' },
  { name: 'Demon', icon: '😈🔥', vibe: 'Diabelsko dobry wybór.' },
  { name: 'Straszny Klaun', icon: '🤡🔪', vibe: 'Uśmiech obowiązkowy. Reszta zależy od odwagi.' },
  { name: 'Rzeźnik', icon: '🔪🥩', vibe: 'Halloweenowy klasyk dla twardzieli.' },
  { name: 'Frankenstein', icon: '🧟⚡', vibe: 'Trochę śrub, dużo blizn i jeszcze więcej charakteru.' },
  { name: 'Mumia', icon: '🧻👁️', vibe: 'Mocno owinięty, ale gotowy na parkiet.' },
  { name: 'Piratka', icon: '🏴‍☠️💄', vibe: 'Kapitan parkietu melduje gotowość.' },
  { name: 'Cowboy', icon: '🤠🐎', vibe: 'Dziki zachód przybył do miasta.' },
  { name: 'Indianin', icon: '🪶🏹', vibe: 'Leśny klimat i charakterystyczny pióropusz.' },
  { name: 'Detektyw', icon: '🕵️🔎', vibe: 'Sprawdzi wszystko. Nawet kto zjadł chipsy.' },
  { name: 'Policjant', icon: '👮🚨', vibe: 'Ktoś musi pilnować porządku na imprezie.' },
  { name: 'Strażak', icon: '🧑‍🚒🔥', vibe: 'Gotowy gasić pożary na parkiecie.' },
  { name: 'Lekarz', icon: '🧑‍⚕️🩺', vibe: 'Diagnoza jest jedna: za mało zabawy.' },
  { name: 'Astronauta', icon: '👨‍🚀🚀', vibe: 'Odlotowy kostium dosłownie i w przenośni.' },
  { name: 'Robot', icon: '🤖⚙️', vibe: 'Tryb imprezowy: aktywny.' },
  { name: 'Giermek', icon: '🛡️⚔️', vibe: 'Rycerz jeszcze nie przybył, więc ktoś musi go zastąpić.' },
  { name: 'Rycerz', icon: '🛡️⚔️', vibe: 'Średniowieczny klimat wchodzi na pełnej zbroi.' },
  { name: 'Wiking', icon: '🪓🧔', vibe: 'Broda, topór i bardzo głośne biesiadowanie.' },
  { name: 'Meduza', icon: '👩‍🦱🐍', vibe: 'Mitologiczna fryzura, której nie da się przegapić.' },
  { name: 'Herkules', icon: '💪🏛️', vibe: 'Bohater mitologii w wersji imprezowej.' },
  { name: 'Król', icon: '🤴👑', vibe: 'Korona jest. Teraz trzeba jeszcze zdobyć tron.' },
  { name: 'Królowa', icon: '👸👑', vibe: 'Królewski poziom Halloween.' },
  { name: 'Myszka', icon: '🐭🎀', vibe: 'Kultowy, prosty i rozpoznawalny styl.' },
  { name: 'Kaczor', icon: '🦆🧢', vibe: 'Komiksowy chaos w najlepszym wydaniu.' },
  { name: 'Pikachu', icon: '⚡🐭', vibe: 'Mały, żółty i zdecydowanie elektryzujący.' },
  { name: 'Mario', icon: '🍄👨🏻', vibe: 'Hydraulik gotowy skakać po całej imprezie.' },
  { name: 'Luigi', icon: '🍄🧑🏻', vibe: 'Zielony brat też chce swoje pięć minut.' },
  { name: 'Joker', icon: '🃏😈', vibe: 'Chaos ma dziś twarz uśmiechniętego klauna.' },
  { name: 'Harley Quinn', icon: '🃏💅', vibe: 'Kolorowo, szalenie i zdecydowanie niegrzecznie.' },
  { name: 'Gandalf', icon: '🧙‍♂️🪄', vibe: 'Nie przejdziesz... bez wejścia na parkiet.' },
  { name: 'Frodo', icon: '🧙‍♂️💍', vibe: 'Mały bohater z bardzo dużym problemem.' },
  { name: 'Sherlock Holmes', icon: '🕵️‍♂️🔎', vibe: 'Peleryna, lupa i śledztwo w sprawie znikających drinków.' },
  { name: 'Rocky', icon: '🥊🧤', vibe: 'Trening skończony. Teraz walka o najlepszy kostium.' },
  { name: 'Gangster', icon: '🕴️💰', vibe: 'Elegancki garnitur i podejrzanie dużo gotówki.' },
  { name: 'Kucharz', icon: '🧑‍🍳🍳', vibe: 'Zamiast czarów będzie gotowanie.' },
  { name: 'Ksiądz', icon: '⛪🧑‍💼', vibe: 'Kostium, którego nikt się nie spodziewał.' },
  { name: 'Strach na wróble', icon: '🌾🧑‍🌾', vibe: 'Idealny klasyk z mrocznego pola.' }
];

const reels = [
  document.getElementById('reel1'),
  document.getElementById('reel2'),
  document.getElementById('reel3')
];
const button = document.getElementById('spinButton');
const display = document.getElementById('costumeDisplay');
const result = document.getElementById('resultCard');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const again = document.getElementById('againButton');
let busy = false;

function renderIdleSymbols() {
  const starter = costumes.slice(0, 5);
  reels.forEach((reel, reelIndex) => {
    reel.innerHTML = starter.map((costume) => `
      <div class="symbol" aria-hidden="true">${costume.icon}</div>
    `).join('');
    reel.style.transition = 'none';
    reel.style.transform = 'translate3d(0,0,0)';
    reel.dataset.reelIndex = reelIndex;
  });
}

function spin() {
  if (busy) return;
  busy = true;
  result.hidden = true;
  display.innerHTML = '<span>LOSOWANIE...</span>';
  button.disabled = true;
  again.disabled = true;

  const pick = costumes[Math.floor(Math.random() * costumes.length)];
  const shuffled = [...costumes].sort(() => Math.random() - 0.5);
  const spins = 5;

  reels.forEach((reel, reelIndex) => {
    reel.style.transition = 'none';
    reel.style.transform = 'translate3d(0,0,0)';

    const sequence = [];
    for (let round = 0; round < spins; round += 1) {
      shuffled.forEach((costume) => sequence.push(costume.icon));
    }

    // Zawsze dokładamy docelowy symbol jako ostatni element. Dzięki temu
    // transform nigdy nie przesuwa tracka poza jego zawartość, także na telefonie.
    sequence.push(pick.icon);

    reel.innerHTML = sequence.map((icon) => `
      <div class="symbol" aria-hidden="true">${icon}</div>
    `).join('');

    const item = reel.querySelector('.symbol');
    const itemHeight = item.getBoundingClientRect().height;
    const targetIndex = sequence.length - 1;
    const offset = targetIndex * itemHeight;
    const duration = 2600 + reelIndex * 650;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reel.style.transition = `transform ${duration}ms cubic-bezier(.08,.72,.12,1)`;
        reel.style.transform = `translate3d(0,-${offset}px,0)`;
      });
    });
  });

  const finishAfter = 3700;

  setTimeout(() => {
    // Jeszcze raz ustawiamy dokładną pozycję końcową, aby mobilne przeglądarki
    // nie zostawiały szczeliny przez zaokrąglenia subpikselowe.
    reels.forEach((reel) => {
      const last = reel.lastElementChild;
      if (!last) return;
      const height = last.getBoundingClientRect().height;
      const finalOffset = (reel.children.length - 1) * height;
      reel.style.transition = 'none';
      reel.style.transform = `translate3d(0,-${finalOffset}px,0)`;
    });

    display.innerHTML = '<span>🎃 TRZY TAKIE SAME = WYGRANA! 🎃</span>';
    resultTitle.textContent = pick.name;
    resultText.textContent = pick.vibe;
    result.hidden = false;
    result.classList.remove('jackpot');
    void result.offsetWidth;
    result.classList.add('jackpot');
    button.disabled = false;
    again.disabled = false;
    busy = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, finishAfter);
}

renderIdleSymbols();
button.addEventListener('click', spin);
again.addEventListener('click', spin);
