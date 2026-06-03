/* ============================================
   NEXUS IMPORTS — Shared JavaScript
   Scroll reveal + utilities
   ============================================ */

// ── Scroll Reveal (IntersectionObserver lazy) ──
(function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // carrega só uma vez
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  // Observa todos os elementos com classe .reveal
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// ── Dispara reveal imediatamente para elementos acima do fold ──
(function revealVisible() {
  document.querySelectorAll('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      setTimeout(() => el.classList.add('visible'), 60);
    }
  });
})();
