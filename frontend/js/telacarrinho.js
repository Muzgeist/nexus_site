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

  // ── Injeta a checkbox de seleção em um card ──
  function injectCheckbox(card) {
    if (card.querySelector('.produto-card-select')) return; // já existe

    const wrap = document.createElement('div');
    wrap.className = 'produto-card-select';
    wrap.innerHTML = `
      <label class="checkbox-wrap" aria-label="Selecionar este produto">
        <input type="checkbox" class="produto-checkbox card-select-checkbox">
        <span class="checkbox-box" aria-hidden="true"></span>
      </label>`;

    const imgWrap = card.querySelector('.produto-img-wrap');
    if (imgWrap) {
      imgWrap.appendChild(wrap);
    } else {
      card.insertBefore(wrap, card.firstChild);
    }

    const checkbox = wrap.querySelector('input');
    checkbox.addEventListener('change', () => {
      card.classList.toggle('is-selected', checkbox.checked);
      updateSelectionUI();
    });
  }

  // ── Atualiza estado visual da seleção (botão + select-all) ──
  function updateSelectionUI() {
    const allChecks = Array.from(document.querySelectorAll('.card-select-checkbox'));
    const checked   = allChecks.filter(c => c.checked);

    const btnSel   = document.getElementById('btnComprarSelecionados');
    const countEl  = document.getElementById('countSelecionados');
    const selectAll = document.getElementById('checkSelectAll');

    if (countEl) countEl.textContent = `(${checked.length})`;
    if (btnSel)  btnSel.disabled = checked.length === 0;

    if (selectAll) {
      if (allChecks.length === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
      } else if (checked.length === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
      } else if (checked.length === allChecks.length) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
      } else {
        selectAll.checked = false;
        selectAll.indeterminate = true;
      }
    }
  }

  // ── Selecionar / desmarcar todos ─────────────
  const checkSelectAll = document.getElementById('checkSelectAll');
  if (checkSelectAll) {
    checkSelectAll.addEventListener('change', () => {
      const allChecks = document.querySelectorAll('.card-select-checkbox');
      allChecks.forEach(c => {
        c.checked = checkSelectAll.checked;
        const card = c.closest('.produto-card');
        if (card) card.classList.toggle('is-selected', c.checked);
      });
      updateSelectionUI();
    });
  }

  // ── Comprar apenas os selecionados ───────────
  const btnSelecionados = document.getElementById('btnComprarSelecionados');
  if (btnSelecionados) {
    btnSelecionados.addEventListener('click', () => {
      const cards = Array.from(document.querySelectorAll('.produto-card'))
        .filter(card => card.querySelector('.card-select-checkbox')?.checked);

      if (cards.length === 0) {
        showToast('Selecione ao menos um produto');
        return;
      }

      // Aqui o backend receberá apenas os itens selecionados com suas quantidades
      // Exemplo de payload: cards.map(c => ({ produto_id: c.dataset.produtoId, quantidade: c.querySelector('.qty-input').value }))
      showToast(`✓ ${cards.length} ${cards.length === 1 ? 'item selecionado enviado' : 'itens selecionados enviados'} para o pedido`);
    });
  }

  // ── Inicializa os controles de cada card ─────
  function initCard(card) {
    injectCheckbox(card);

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
    setTimeout(() => { card.remove(); updateCount(); updateSelectionUI(); }, 310);
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
            updateSelectionUI();
          }
        });
      });
    });
    observer.observe(grid, { childList: true });
  }

  updateCount();
  updateSelectionUI();

})();
