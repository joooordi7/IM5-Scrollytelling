// Cinematic scroll slideshow – smooth crossfade + subtle zoom

const slides = document.querySelectorAll('.slide-image');
let currentIndex = 0;
let isAnimating = false;

// match CSS transition (~900ms)
const ANIMATION_DURATION = 900;

// Helper: switch slides with crossfade
function goToSlide(newIndex) {
    if (newIndex === currentIndex || newIndex < 0 || newIndex >= slides.length) return;

    const currentSlide = slides[currentIndex];
    const nextSlide = slides[newIndex];

    isAnimating = true;

    // Prepare next slide
    nextSlide.classList.add('is-active');
    nextSlide.classList.remove('is-leaving'); // just in case

    // Animate current slide out
    currentSlide.classList.remove('is-active');
    currentSlide.classList.add('is-leaving');

    // After animation: clean up
    setTimeout(() => {
        currentSlide.classList.remove('is-leaving');
        currentIndex = newIndex;
        isAnimating = false;
    }, ANIMATION_DURATION);
}

function goNext() {
    if (currentIndex >= slides.length - 1) return;
    goToSlide(currentIndex + 1);
}

function goPrev() {
    if (currentIndex <= 0) return;
    goToSlide(currentIndex - 1);
}

/* ===== Scroll (wheel / trackpad) ===== */

window.addEventListener(
    'wheel',
    (event) => {
        event.preventDefault(); // keep page fixed

        if (isAnimating) return;

        if (event.deltaY > 0) {
            // scroll down
            goNext();
        } else if (event.deltaY < 0) {
            // scroll up
            goPrev();
        }
    },
    { passive: false }
);

/* ===== Keyboard navigation (optional) ===== */

window.addEventListener('keydown', (event) => {
    if (isAnimating) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        goNext();
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        goPrev();
    }
});

/* ===== Touch / swipe on mobile ===== */

let touchStartY = null;

window.addEventListener('touchstart', (event) => {
    touchStartY = event.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (event) => {
    if (touchStartY === null || isAnimating) return;

    const touchEndY = event.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    const threshold = 40; // need a bigger swipe

    if (diffY > threshold) {
        // swipe up -> next
        goNext();
    } else if (diffY < -threshold) {
        // swipe down -> previous
        goPrev();
    }

    touchStartY = null;
}, { passive: true });

/* ===== Initial state ===== */

// make sure the first slide is visible
if (slides.length > 0) {
    slides[0].classList.add('is-active');
}
