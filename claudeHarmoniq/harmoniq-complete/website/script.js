// ============================================
// HARMONIQ WEBSITE - Interactivity
// ============================================

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Mobile menu
const mobileMenu = document.getElementById('mobileMenu');
const navLinks = document.getElementById('navLinks');
if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        mobileMenu.classList.toggle('open', isOpen);
        mobileMenu.setAttribute('aria-expanded', isOpen);
    });
    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            mobileMenu.classList.remove('open');
            mobileMenu.setAttribute('aria-expanded', false);
        });
    });
}

// Scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.feature, .emo-card, .testimonial, .step-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    nav.style.borderBottom = window.scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none';
});

// Emotion card hover
document.querySelectorAll('.emo-card').forEach(card => {
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-8px) scale(1.03)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});


console.log('🎵 Harmoniq website loaded');
