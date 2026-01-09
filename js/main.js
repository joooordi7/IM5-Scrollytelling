// =====================================
// Cinematic scroll slideshow
// =====================================

const slides = document.querySelectorAll('.slide-image');
let currentIndex = 0;
let isAnimating = false;
const ANIMATION_DURATION = 900;

// =====================================
// Scroll-to-explore (ONLY first slide, then never again)
// =====================================

const hintStart = document.querySelector('.hint-start');
let hintDismissed = false;

function updateHint() {
  if (!hintStart) return;

  if (currentIndex === 0 && !hintDismissed) {
    hintStart.classList.remove('is-hidden');
  } else {
    hintStart.classList.add('is-hidden');
  }
}

if (hintStart) {
  hintStart.addEventListener('click', () => {
    if (isAnimating) return;
    hintDismissed = true;
    updateHint();
    goNext();
  });
}

// =====================================
// Sounds (loop per specific slide) + smooth fades
// =====================================

const SOUND_MAP = {
  türkisch: 'assets/Türkisch.wav',
  filter: 'assets/Filter.wav',
  coffeebrew: 'assets/CoffeeBrew.wav',
  bialetti: 'assets/Bialetti.wav',
  nespresso: 'assets/Nespresso.wav'
};

const TARGET_VOLUME = 0.9;
const FADE_MS = 700; // adjust: 500–1200 feels nice

const audioByKey = {};
Object.entries(SOUND_MAP).forEach(([key, src]) => {
  const a = new Audio(src);
  a.loop = true;
  a.preload = 'auto';
  a.volume = 0; // start silent; we fade in
  audioByKey[key] = a;
});

let currentSoundKey = null;
let audioUnlocked = false;
let fadeToken = 0; // cancels older fades when switching quickly

function unlockAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  applySoundForSlide(currentIndex).catch(() => {});
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function fadeAudio(audio, from, to, ms, tokenAtStart) {
  return new Promise((resolve) => {
    const start = performance.now();
    const delta = to - from;

    function step(now) {
      // cancel if a new fade has started
      if (tokenAtStart !== fadeToken) return resolve(false);

      const t = clamp01((now - start) / ms);
      audio.volume = from + delta * t;

      if (t >= 1) return resolve(true);
      requestAnimationFrame(step);
    }

    audio.volume = from;
    requestAnimationFrame(step);
  });
}

async function stopWithFade(key) {
  if (!key) return;

  const a = audioByKey[key];
  if (!a) return;

  const myToken = ++fadeToken;

  // fade out from current volume to 0
  await fadeAudio(a, a.volume, 0, FADE_MS, myToken);

  // if still current fade, stop/reset
  if (myToken === fadeToken) {
    a.pause();
    a.currentTime = 0;
  }
}

async function playWithFade(key) {
  const a = audioByKey[key];
  if (!a) return;

  const myToken = ++fadeToken;

  // ensure it starts at 0 volume, then play, then fade in
  a.volume = 0;

  // play can throw if not unlocked; we call this only after unlock
  await a.play();

  await fadeAudio(a, 0, TARGET_VOLUME, FADE_MS, myToken);
}

async function crossfade(fromKey, toKey) {
  if (fromKey === toKey) return;

  const fromA = fromKey ? audioByKey[fromKey] : null;
  const toA = toKey ? audioByKey[toKey] : null;

  const myToken = ++fadeToken;

  // start new audio at 0
  if (toA) {
    toA.volume = 0;
    await toA.play();
  }

  // fade both simultaneously
  const jobs = [];

  if (fromA) jobs.push(fadeAudio(fromA, fromA.volume, 0, FADE_MS, myToken));
  if (toA) jobs.push(fadeAudio(toA, 0, TARGET_VOLUME, FADE_MS, myToken));

  await Promise.all(jobs);

  // stop old after fade
  if (myToken === fadeToken && fromA) {
    fromA.pause();
    fromA.currentTime = 0;
  }
}

async function applySoundForSlide(slideIndex) {
  const slide = slides[slideIndex];
  if (!slide) return;

  const nextKey = slide.dataset.sound || null;

  // only play after user gesture
  if (!audioUnlocked) return;

  // no sound assigned -> fade out current
  if (!nextKey) {
    if (currentSoundKey) {
      const oldKey = currentSoundKey;
      currentSoundKey = null;
      await stopWithFade(oldKey);
    }
    return;
  }

  // if no current -> fade in next
  if (!currentSoundKey) {
    currentSoundKey = nextKey;
    await playWithFade(nextKey);
    return;
  }

  // if switching -> crossfade
  if (currentSoundKey !== nextKey) {
    const oldKey = currentSoundKey;
    currentSoundKey = nextKey;
    await crossfade(oldKey, nextKey);
  }
}

// =====================================
// Slide transitions
// =====================================

function goToSlide(newIndex) {
  if (newIndex === currentIndex || newIndex < 0 || newIndex >= slides.length) return;

  const currentSlide = slides[currentIndex];
  const nextSlide = slides[newIndex];

  isAnimating = true;

  // once we leave the first slide, dismiss hint forever
  if (newIndex !== 0) hintDismissed = true;

  nextSlide.classList.add('is-active');
  nextSlide.classList.remove('is-leaving');

  currentSlide.classList.remove('is-active');
  currentSlide.classList.add('is-leaving');

  setTimeout(() => {
    currentSlide.classList.remove('is-leaving');
    currentIndex = newIndex;
    isAnimating = false;

    applySoundForSlide(currentIndex).catch(() => {});
    updateHint();
  }, ANIMATION_DURATION);
}

function goNext() {
  if (currentIndex < slides.length - 1) goToSlide(currentIndex + 1);
}

function goPrev() {
  if (currentIndex > 0) goToSlide(currentIndex - 1);
}

// =====================================
// Controls (wheel / keyboard / touch)
// =====================================

window.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    unlockAudioOnce();
    if (isAnimating) return;

    if (event.deltaY > 0) goNext();
    else if (event.deltaY < 0) goPrev();
  },
  { passive: false }
);

window.addEventListener('keydown', (event) => {
  unlockAudioOnce();
  if (isAnimating) return;

  if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
    goNext();
  } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    goPrev();
  }
});

let touchStartY = null;

window.addEventListener('touchstart', (event) => {
  unlockAudioOnce();
  touchStartY = event.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (event) => {
  unlockAudioOnce();
  if (touchStartY === null || isAnimating) return;

  const touchEndY = event.changedTouches[0].clientY;
  const diffY = touchStartY - touchEndY;
  const threshold = 40;

  if (diffY > threshold) goNext();
  else if (diffY < -threshold) goPrev();

  touchStartY = null;
}, { passive: true });

// =====================================
// Initial state
// =====================================

if (slides.length > 0) {
  slides[0].classList.add('is-active');
  updateHint();
}

// =====================================
// Coffee bean cursor (image only)
// =====================================

const bean = document.querySelector('.cursor-bean');

if (bean) {
  window.addEventListener('mousemove', (event) => {
    bean.style.transform =
      `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate3d(-50%, -50%, 0)`;
  });

  window.addEventListener('mouseleave', () => {
    bean.style.opacity = '0';
  });

  window.addEventListener('mouseenter', () => {
    bean.style.opacity = '1';
  });
}
