// ========================================
// La Storia del Caffè - Main JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initHeroKenBurns();
    initInfiniteLoop();
    initScrollAnimations();
});

// ========================================
// Hero Ken Burns Effect
// ========================================
function initHeroKenBurns() {
    const heroImages = document.querySelectorAll('.hero-image');
    if (heroImages.length === 0) return;
    
    let currentIndex = 0;
    const intervalTime = 6000; // 6 seconds per image
    
    // Show first image
    heroImages[currentIndex].classList.add('active');
    
    // Cycle through images
    setInterval(() => {
        heroImages[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % heroImages.length;
        heroImages[currentIndex].classList.add('active');
    }, intervalTime);
}

// ========================================
// Infinite Loop Scroll
// ========================================
function initInfiniteLoop() {
    const lastSlide = document.getElementById('last-slide');
    const hero = document.getElementById('hero');
    
    if (!lastSlide || !hero) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
                // Wait a moment, then scroll back to top
                setTimeout(() => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }, 1500);
            }
        });
    }, {
        threshold: 0.8
    });
    
    observer.observe(lastSlide);
}

// ========================================
// Scroll-Driven Animations
// ========================================
function initScrollAnimations() {
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (!hero || !heroContent) return;
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const heroHeight = hero.offsetHeight;
                const scrollProgress = Math.min(scrollY / heroHeight, 1);
                
                // Parallax effect on hero content
                heroContent.style.transform = `translateY(${scrollProgress * 50}px)`;
                heroContent.style.opacity = 1 - scrollProgress;
                
                // Fade out scroll indicator
                if (scrollIndicator) {
                    scrollIndicator.style.opacity = 1 - (scrollProgress * 2);
                }
                
                ticking = false;
            });
            ticking = true;
        }
    });
}

// ========================================
// Smooth Scroll for Anchor Links
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// Horizontal Scroll Enhancement
// ========================================
document.querySelectorAll('.horizontal-chapter').forEach(chapter => {
    // Enable mouse wheel horizontal scrolling
    chapter.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            chapter.scrollLeft += e.deltaY;
        }
    }, { passive: false });
});
