/* ============================================
   NEXUS — Tela de Carrinho JS
   ============================================ */

(function () {
  'use strict';

  // Conta itens e atualiza badge
  function updateCount() {
    const cards = document.querySelectorAll('.produto-card');
    const badge = document.getElementById('badgeCount');
    const total = document.getElementById('totalItens');
    const n = cards.length;
    if (badge) badge.textContent = `${n} ${n === 1 ? 'item' : 'itens'}`;
    if (total) total.textContent = n;
  }

  // Remover produto com animação
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-remove');
    if (!btn) return;
    const card = btn.closest('.produto-card');
    if (!card) return;
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.92) translateY(-6px)';
    setTimeout(() => {
      card.remove();
      updateCount();
    }, 300);
  });

  updateCount();

})();
