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
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'rgba(15,15,26,.95)';
        navLinks.style.padding = '1rem 2rem';
        navLinks.style.borderRadius = '0 0 15px 15px';
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

// Download button
document.querySelectorAll('.btn-cta, .btn-nav, .btn-hero-primary').forEach(btn => {
    btn.addEventListener('click', e => {
        if (btn.getAttribute('href') === '#' || btn.getAttribute('href') === '#download') {
            e.preventDefault();
            alert('🎉 Chrome Web Store listing coming soon!\\n\\nFor early access, check our GitHub.');
        }
    });
});

console.log('🎵 Harmoniq website loaded');
