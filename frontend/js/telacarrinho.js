/* ============================================
   NEXUS — Tela de Carrinho JS
   Quantidade editável, compra individual, comprar tudo
   ============================================ */

(function () {
  'use strict';

  // ── Toast ────────────────────────────────────
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // ── Atualiza contagem de itens ───────────────
  function updateCount() {
    const cards  = document.querySelectorAll('.produto-card');
    const badge  = document.getElementById('badgeCount');
    const total  = document.getElementById('totalItens');
    const n = cards.length;
    if (badge) badge.textContent = `${n} ${n === 1 ? 'item' : 'itens'}`;
    if (total) total.textContent = n;
  }

  // ── Inicializa os controles de cada card ─────
  function initCard(card) {
    const estoque   = parseInt(card.dataset.estoque) || 99;
    const input     = card.querySelector('.qty-input');
    const btnMinus  = card.querySelector('.qty-btn--minus');
    const btnPlus   = card.querySelector('.qty-btn--plus');
    const estoqueEl = card.querySelector('.qty-estoque');

    if (!input) return;

    // Define o máximo real pelo estoque
    input.max = estoque;
    if (estoqueEl) estoqueEl.textContent = `/ ${estoque} em estoque`;

    function updateBtns() {
      const v = parseInt(input.value) || 1;
      if (btnMinus) btnMinus.disabled = v <= 1;
      if (btnPlus)  btnPlus.disabled  = v >= estoque;
    }

    function setQty(val) {
      let v = parseInt(val) || 1;
      if (v < 1)       { v = 1; }
      if (v > estoque) {
        v = estoque;
        // shake no input ao tentar passar do limite
        input.classList.remove('shake');
        void input.offsetWidth; // reflow para reiniciar animação
        input.classList.add('shake');
        showToast(`Máximo disponível: ${estoque} unidade${estoque > 1 ? 's' : ''}`);
      }
      input.value = v;
      updateBtns();
    }

    if (btnMinus) btnMinus.addEventListener('click', () => setQty(parseInt(input.value) - 1));
    if (btnPlus)  btnPlus.addEventListener('click',  () => setQty(parseInt(input.value) + 1));

    input.addEventListener('change', () => setQty(input.value));
    input.addEventListener('blur',   () => setQty(input.value));
    input.addEventListener('animationend', () => input.classList.remove('shake'));

    updateBtns();
  }

  // ── Remover produto ──────────────────────────
  function removeCard(card) {
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.92) translateY(-6px)';
    setTimeout(() => { card.remove(); updateCount(); }, 310);
  }

  // ── Comprar produto individual ───────────────
  function comprarIndividual(card) {
    const nome  = card.querySelector('.produto-nome')?.textContent || 'produto';
    const qty   = card.querySelector('.qty-input')?.value || '1';
    showToast(`✓ ${nome} (×${qty}) adicionado ao pedido`);
    // Aqui o backend receberá: { produto_id, quantidade }
  }

  // ── Comprar tudo ─────────────────────────────
  const btnTudo = document.getElementById('btnComprarTudo');
  if (btnTudo) {
    // Pulso de atenção ao carregar
    setTimeout(() => {
      btnTudo.classList.add('pulse');
      btnTudo.addEventListener('animationend', () => btnTudo.classList.remove('pulse'), { once: true });
    }, 800);

    btnTudo.addEventListener('click', () => {
      const cards = document.querySelectorAll('.produto-card');
      if (cards.length === 0) { showToast('Seu carrinho está vazio'); return; }
      showToast(`✓ ${cards.length} ${cards.length === 1 ? 'item enviado' : 'itens enviados'} para o pedido`);
      // Aqui o backend receberá todos os itens com suas quantidades
    });
  }

  // ── Delegação de eventos no grid ────────────
  const grid = document.getElementById('lista-pedidos');
  if (grid) {
    grid.addEventListener('click', e => {
      const card = e.target.closest('.produto-card');
      if (!card) return;

      if (e.target.closest('.btn-remove')) {
        removeCard(card);
        return;
      }

      if (e.target.closest('.btn-comprar-individual')) {
        comprarIndividual(card);
        return;
      }
    });
  }

  // ── Inicializa todos os cards existentes ─────
  document.querySelectorAll('.produto-card').forEach(initCard);

  // ── MutationObserver para cards adicionados via backend ──
  if (grid) {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('produto-card')) {
            initCard(node);
            updateCount();
          }
        });
      });
    });
    observer.observe(grid, { childList: true });
  }

  updateCount();

})();
