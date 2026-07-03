/* ============================================================
   NEXUS — Tela de Carrinho JS
   Carrega o carrinho real salvo em sessionStorage (preenchido
   pela tela de produto), permite editar quantidade, remover
   itens e redireciona QUALQUER botão de compra (individual,
   selecionados, tudo ou finalizar) para telapagamento.html,
   levando os itens e valores corretos.
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. GUARD DE AUTENTICAÇÃO ────────────────── */
  const usuarioRaw = sessionStorage.getItem('usuario');
  if (!usuarioRaw) { window.location.replace('telalogin.html'); return; }
  let usuario = {};
  try { usuario = JSON.parse(usuarioRaw); }
  catch (e) { window.location.replace('telalogin.html'); return; }

  /* ── 2. AVATAR HEADER ───────────────────────── */
  const avatarImg      = document.getElementById('avatarHeaderImg');
  const avatarFallback = document.getElementById('avatarHeaderFallback');
  const fotoSalva      = sessionStorage.getItem('fotoPerfil');
  if (avatarImg && fotoSalva) {
    avatarImg.src = fotoSalva;
    avatarImg.style.display = 'block';
    if (avatarFallback) avatarFallback.style.display = 'none';
  }

  /* ── 3. TOAST ─────────────────────────────────── */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function fmt(v) {
    return parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  /* ── 4. CARRINHO (sessionStorage) ────────────── */
  function getCarrinho() {
    try { return JSON.parse(sessionStorage.getItem('carrinho') || '[]'); }
    catch (e) { return []; }
  }
  function salvarCarrinho(c) { sessionStorage.setItem('carrinho', JSON.stringify(c)); }

  const grid          = document.getElementById('lista-pedidos');
  const carrinhoVazio = document.getElementById('carrinhoVazio');

  function imagemOuPlaceholder(item) {
    if (item.imagem_url) {
      return `<img src="${escapeHtml(item.imagem_url)}" alt="${escapeHtml(item.produto)}" loading="lazy">`;
    }
    return `
      <div class="produto-img-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
      </div>`;
  }

  function cardTemplate(item) {
    const estoque = parseInt(item.estoque) || 99;
    const qty     = Math.min(parseInt(item.quantidade) || 1, estoque);
    return `
      <article class="produto-card reveal" data-produto-id="${item.id}" data-estoque="${estoque}" data-preco="${item.valor_unitario}" data-categoria="${escapeHtml(item.categoria || '')}">
        <div class="produto-img-wrap">${imagemOuPlaceholder(item)}</div>
        <div class="produto-info">
          <span class="produto-categoria">${escapeHtml(item.categoria || '')}</span>
          <h3 class="produto-nome">${escapeHtml(item.produto)}</h3>
          <span class="produto-preco-unit">${fmt(item.valor_unitario)} / un.</span>
          <div class="produto-qty-ctrl">
            <button class="qty-btn qty-btn--minus" aria-label="Diminuir quantidade">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <input type="number" class="qty-input" value="${qty}" min="1" max="${estoque}" aria-label="Quantidade">
            <button class="qty-btn qty-btn--plus" aria-label="Aumentar quantidade">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span class="qty-estoque">/ ${estoque} em estoque</span>
          </div>
        </div>
        <div class="produto-actions">
          <button class="btn-comprar-individual" aria-label="Comprar este produto">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Comprar
          </button>
          <button class="btn-remove" aria-label="Remover produto">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </article>`;
  }

  function renderCarrinho() {
    const carrinho = getCarrinho();
    if (carrinho.length === 0) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      carrinhoVazio.style.display = 'flex';
      document.querySelector('.carrinho-select-all').style.display = 'none';
      document.querySelector('.carrinho-resumo').style.display = 'none';
      updateCount();
      return;
    }

    grid.style.display = 'grid';
    carrinhoVazio.style.display = 'none';
    document.querySelector('.carrinho-select-all').style.display = 'flex';
    document.querySelector('.carrinho-resumo').style.display = 'block';

    grid.innerHTML = carrinho.map(cardTemplate).join('');
    document.querySelectorAll('.produto-card').forEach(initCard);

    // Dispara o "reveal" manualmente (cards injetados após o observer já ter rodado)
    grid.querySelectorAll('.reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 80);
    });

    updateCount();
    updateSelectionUI();
  }

  /* ── 5. Persiste alterações de quantidade/remoção no sessionStorage ── */
  function persistirQuantidade(produtoId, novaQtd) {
    const carrinho = getCarrinho();
    const idx = carrinho.findIndex(i => String(i.id) === String(produtoId));
    if (idx >= 0) {
      carrinho[idx].quantidade = novaQtd;
      salvarCarrinho(carrinho);
    }
  }

  function removerDoCarrinho(produtoId) {
    const carrinho = getCarrinho().filter(i => String(i.id) !== String(produtoId));
    salvarCarrinho(carrinho);
  }

  /* ── 6. Atualiza contagem de itens ───────────── */
  function updateCount() {
    const cards = document.querySelectorAll('.produto-card');
    const badge = document.getElementById('badgeCount');
    const total = document.getElementById('totalItens');
    const n = cards.length;
    if (badge) badge.textContent = `${n} ${n === 1 ? 'item' : 'itens'}`;
    if (total) total.textContent = n;
  }

  /* ── 7. Checkbox de seleção por card ─────────── */
  function injectCheckbox(card) {
    if (card.querySelector('.produto-card-select')) return;

    const wrap = document.createElement('div');
    wrap.className = 'produto-card-select';
    wrap.innerHTML = `
      <label class="checkbox-wrap" aria-label="Selecionar este produto">
        <input type="checkbox" class="produto-checkbox card-select-checkbox">
        <span class="checkbox-box" aria-hidden="true"></span>
      </label>`;

    const imgWrap = card.querySelector('.produto-img-wrap');
    if (imgWrap) imgWrap.appendChild(wrap);
    else card.insertBefore(wrap, card.firstChild);

    const checkbox = wrap.querySelector('input');
    checkbox.addEventListener('change', () => {
      card.classList.toggle('is-selected', checkbox.checked);
      updateSelectionUI();
    });
  }

  function updateSelectionUI() {
    const allChecks = Array.from(document.querySelectorAll('.card-select-checkbox'));
    const checked   = allChecks.filter(c => c.checked);

    const btnSel    = document.getElementById('btnComprarSelecionados');
    const countEl   = document.getElementById('countSelecionados');
    const selectAll = document.getElementById('checkSelectAll');

    if (countEl) countEl.textContent = `(${checked.length})`;
    if (btnSel)  btnSel.disabled = checked.length === 0;

    if (selectAll) {
      if (allChecks.length === 0 || checked.length === 0) {
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

  const checkSelectAll = document.getElementById('checkSelectAll');
  if (checkSelectAll) {
    checkSelectAll.addEventListener('change', () => {
      document.querySelectorAll('.card-select-checkbox').forEach(c => {
        c.checked = checkSelectAll.checked;
        const card = c.closest('.produto-card');
        if (card) card.classList.toggle('is-selected', c.checked);
      });
      updateSelectionUI();
    });
  }

  /* ── 8. Inicializa controles de quantidade de um card ── */
  function initCard(card) {
    injectCheckbox(card);

    const estoque   = parseInt(card.dataset.estoque) || 99;
    const input     = card.querySelector('.qty-input');
    const btnMinus  = card.querySelector('.qty-btn--minus');
    const btnPlus   = card.querySelector('.qty-btn--plus');

    if (!input) return;
    input.max = estoque;

    function updateBtns() {
      const v = parseInt(input.value) || 1;
      if (btnMinus) btnMinus.disabled = v <= 1;
      if (btnPlus)  btnPlus.disabled  = v >= estoque;
    }

    function setQty(val) {
      let v = parseInt(val) || 1;
      if (v < 1) v = 1;
      if (v > estoque) {
        v = estoque;
        input.classList.remove('shake');
        void input.offsetWidth;
        input.classList.add('shake');
        showToast(`Máximo disponível: ${estoque} unidade${estoque > 1 ? 's' : ''}`);
      }
      input.value = v;
      updateBtns();
      persistirQuantidade(card.dataset.produtoId, v);
    }

    if (btnMinus) btnMinus.addEventListener('click', () => setQty(parseInt(input.value) - 1));
    if (btnPlus)  btnPlus.addEventListener('click',  () => setQty(parseInt(input.value) + 1));
    input.addEventListener('change', () => setQty(input.value));
    input.addEventListener('blur',   () => setQty(input.value));
    input.addEventListener('animationend', () => input.classList.remove('shake'));

    updateBtns();
  }

  /* ── 9. Remover produto ──────────────────────── */
  function removeCard(card) {
    removerDoCarrinho(card.dataset.produtoId);
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.92) translateY(-6px)';
    setTimeout(() => {
      card.remove();
      updateCount();
      updateSelectionUI();
      if (document.querySelectorAll('.produto-card').length === 0) renderCarrinho();
    }, 310);
  }

  /* ── 10. Monta um item de pedido a partir de um card ── */
  function cardParaItemPedido(card) {
    return {
      produto_id:     card.dataset.produtoId,
      produto:        card.querySelector('.produto-nome')?.textContent || 'Produto',
      categoria:      card.dataset.categoria || '',
      valor_unitario: parseFloat(card.dataset.preco),
      imagem_url:     card.querySelector('.produto-img-wrap img')?.getAttribute('src') || null,
      quantidade:     parseInt(card.querySelector('.qty-input')?.value) || 1
    };
  }

  /* ── 11. Redireciona para a tela de pagamento ───────── */
  function irParaPagamento(itens) {
    if (itens.length === 0) {
      showToast('Selecione ao menos um produto');
      return;
    }
    sessionStorage.setItem('pedidoPendente', JSON.stringify({ itens, origem: 'carrinho' }));
    window.location.href = 'telapagamento.html';
  }

  /* ── 12. Botões de compra ────────────────────── */
  const btnSelecionados = document.getElementById('btnComprarSelecionados');
  if (btnSelecionados) {
    btnSelecionados.addEventListener('click', () => {
      const itens = Array.from(document.querySelectorAll('.produto-card'))
        .filter(card => card.querySelector('.card-select-checkbox')?.checked)
        .map(cardParaItemPedido);
      irParaPagamento(itens);
    });
  }

  const btnTudo = document.getElementById('btnComprarTudo');
  if (btnTudo) {
    setTimeout(() => {
      btnTudo.classList.add('pulse');
      btnTudo.addEventListener('animationend', () => btnTudo.classList.remove('pulse'), { once: true });
    }, 800);

    btnTudo.addEventListener('click', () => {
      const itens = Array.from(document.querySelectorAll('.produto-card')).map(cardParaItemPedido);
      irParaPagamento(itens);
    });
  }

  const btnFinalizar = document.getElementById('btnFinalizar');
  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', () => {
      const itens = Array.from(document.querySelectorAll('.produto-card')).map(cardParaItemPedido);
      irParaPagamento(itens);
    });
  }

  /* ── 13. Delegação de eventos no grid ────────── */
  if (grid) {
    grid.addEventListener('click', e => {
      const card = e.target.closest('.produto-card');
      if (!card) return;

      if (e.target.closest('.btn-remove')) {
        removeCard(card);
        return;
      }

      if (e.target.closest('.btn-comprar-individual')) {
        irParaPagamento([cardParaItemPedido(card)]);
        return;
      }
    });
  }

  /* ── 14. Inicialização ───────────────────────── */
  renderCarrinho();

})();
