/* ============================================
   NEXUS IMPORTS — Tela Produto (Detalhe) JS
   - Autenticação
   - Carrega produto pelo ?id= na URL
   - Seletor de quantidade limitado ao estoque
   - Botão comprar (modal + POST /compra)
   - Botão carrinho (sessionStorage)
   ============================================ */

(function () {
  'use strict';

  const API = 'http://localhost:3000';

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
  const btnAvatar = document.getElementById('btnAvatarHeader');
  if (btnAvatar) btnAvatar.addEventListener('click', () => window.location.href = 'telausuario.html');

  /* ── 3. REFS DOM ────────────────────────────── */
  const loader           = document.getElementById('produtoLoader');
  const mainEl           = document.getElementById('produtoMain');
  const erroEl           = document.getElementById('produtoErro');
  const breadCat         = document.getElementById('breadcrumbCat');
  const breadNome        = document.getElementById('breadcrumbNome');
  const produtoImg       = document.getElementById('produtoImg');
  const produtoImgPh     = document.getElementById('produtoImgPlaceholder');
  const produtoBadge     = document.getElementById('produtoBadge');
  const produtoMarca     = document.getElementById('produtoMarca');
  const produtoIdBadge   = document.getElementById('produtoIdBadge');
  const produtoNome      = document.getElementById('produtoNome');
  const produtoDescricao = document.getElementById('produtoDescricao');
  const produtoPreco     = document.getElementById('produtoPreco');
  const estoqueDot       = document.getElementById('estoqueDot');
  const estoqueLabel     = document.getElementById('estoqueLabel');
  const qtySection       = document.getElementById('qtySection');
  const qtyMinus         = document.getElementById('qtyMinus');
  const qtyPlus          = document.getElementById('qtyPlus');
  const qtyInput         = document.getElementById('qtyInput');
  const qtyTotal         = document.getElementById('qtyTotal');
  const produtoAcoes     = document.getElementById('produtoAcoes');
  const semEstoque       = document.getElementById('semEstoqueAviso');
  const btnComprar       = document.getElementById('btnComprar');
  const btnCarrinho      = document.getElementById('btnCarrinho');
  const modalOverlay     = document.getElementById('modalOverlay');
  const modalBody        = document.getElementById('modalBody');
  const modalCancel      = document.getElementById('modalCancel');
  const modalConfirm     = document.getElementById('modalConfirm');
  const toast            = document.getElementById('toast');

  /* ── 4. UTILIDADES ───────────────────────────── */
  function fmt(v) {
    return parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function showToast(msg, tipo = '', dur = 3000) {
    toast.textContent = msg;
    toast.className = 'toast visible' + (tipo ? ' toast--' + tipo : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), dur);
  }

  /* ── 5. LEITURA DO ID NA URL ─────────────────── */
  const params = new URLSearchParams(window.location.search);
  const produtoId = params.get('id');

  if (!produtoId) {
    mostrarErro();
  } else {
    carregarProduto(produtoId);
  }

  function mostrarErro() {
    loader.style.display = 'none';
    erroEl.style.display = 'flex';
  }

  /* ── 6. CARREGAR PRODUTO DO BACKEND ─────────── */
  async function carregarProduto(id) {
    try {
      const res = await fetch(`${API}/produto/${id}`);
      if (!res.ok) { mostrarErro(); return; }
      const p = await res.json();
      loader.style.display = 'none';
      renderProduto(p);
    } catch (err) {
      console.error(err);
      loader.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.35">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style="font-size:12px;color:var(--text-muted)">Servidor indisponível.<br>Certifique-se que o backend está rodando.</span>`;
    }
  }

  /* ── 7. RENDERIZAR PRODUTO ───────────────────── */
  let produtoAtual = null;

  function renderProduto(p) {
    produtoAtual = p;

    // Título da página
    document.title = `Nexus Imports — ${p.produto}`;

    // Breadcrumb
    if (breadCat)  breadCat.textContent  = p.categoria || 'Produto';
    if (breadNome) breadNome.textContent = p.produto;

    // Imagem
    if (p.imagem_url) {
      produtoImg.src = p.imagem_url;
      produtoImg.alt = p.produto;
      produtoImg.style.display = 'block';
      if (produtoImgPh) produtoImgPh.style.display = 'none';
    } else {
      produtoImg.style.display = 'none';
      if (produtoImgPh) produtoImgPh.style.display = 'flex';
    }

    // Badge categoria
    if (produtoBadge && p.categoria) produtoBadge.textContent = p.categoria;

    // Meta
    if (produtoMarca)   produtoMarca.textContent  = p.marca   || '';
    if (produtoIdBadge) produtoIdBadge.textContent = `ID #${p.id}`;

    // Textos
    produtoNome.textContent      = p.produto;
    produtoDescricao.textContent = p.descricao || 'Sem descrição disponível.';
    produtoPreco.textContent     = fmt(p.valor_unitario);

    // Estoque
    const qtd = parseInt(p.quantidade) || 0;
    if (qtd <= 0) {
      estoqueDot.className = 'estoque-dot estoque-dot--zero';
      estoqueLabel.textContent = 'Sem estoque';
      qtySection.style.display = 'none';
      produtoAcoes.style.display = 'none';
      semEstoque.style.display = 'flex';
    } else {
      const baixo = qtd <= 5;
      estoqueDot.className = 'estoque-dot' + (baixo ? ' estoque-dot--baixo' : '');
      estoqueLabel.textContent = baixo ? `Estoque baixo — apenas ${qtd} unidade${qtd > 1 ? 's' : ''}` : `${qtd} unidades disponíveis`;
      qtyInput.max = qtd;
      qtyInput.value = 1;
      atualizarTotal();
      qtySection.style.display = 'block';
      produtoAcoes.style.display = 'flex';
      semEstoque.style.display = 'none';
    }

    // Mostrar main
    mainEl.style.display = 'block';

    // Acionar scroll reveal para os novos elementos
    mainEl.querySelectorAll('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.1) {
        setTimeout(() => el.classList.add('visible'), 60);
      }
    });
  }

  /* ── 8. CONTROLE DE QUANTIDADE ───────────────── */
  function getQty()    { return parseInt(qtyInput.value) || 1; }
  function getMaxQty() { return parseInt(qtyInput.max)   || 1; }

  function atualizarTotal() {
    if (!produtoAtual) return;
    const q     = getQty();
    const total = q * parseFloat(produtoAtual.valor_unitario);
    qtyTotal.textContent = `Total: ${fmt(total)}`;
    qtyMinus.disabled = q <= 1;
    qtyPlus.disabled  = q >= getMaxQty();
  }

  qtyMinus.addEventListener('click', () => {
    const v = getQty();
    if (v > 1) { qtyInput.value = v - 1; atualizarTotal(); }
  });
  qtyPlus.addEventListener('click', () => {
    const v = getQty();
    if (v < getMaxQty()) { qtyInput.value = v + 1; atualizarTotal(); }
  });
  qtyInput.addEventListener('input', () => {
    let v = parseInt(qtyInput.value) || 1;
    v = Math.max(1, Math.min(v, getMaxQty()));
    qtyInput.value = v;
    atualizarTotal();
  });
  qtyInput.addEventListener('blur', () => {
    if (!qtyInput.value || qtyInput.value < 1) qtyInput.value = 1;
    atualizarTotal();
  });

  /* ── 9. CARRINHO (sessionStorage) ───────────── */
  function getCarrinho() {
    try { return JSON.parse(sessionStorage.getItem('carrinho') || '[]'); }
    catch (e) { return []; }
  }
  function salvarCarrinho(c) { sessionStorage.setItem('carrinho', JSON.stringify(c)); }

  btnCarrinho && btnCarrinho.addEventListener('click', () => {
    if (!produtoAtual) return;
    const carrinho = getCarrinho();
    const qty      = getQty();
    const idx      = carrinho.findIndex(i => i.id === produtoAtual.id);

    if (idx >= 0) {
      const novo = carrinho[idx].quantidade + qty;
      if (novo > getMaxQty()) {
        showToast(`Limite de estoque atingido (${getMaxQty()} un.)`, 'error');
        return;
      }
      carrinho[idx].quantidade = novo;
    } else {
      carrinho.push({
        id:             produtoAtual.id,
        produto:        produtoAtual.produto,
        categoria:      produtoAtual.categoria,
        marca:          produtoAtual.marca,
        valor_unitario: produtoAtual.valor_unitario,
        imagem_url:     produtoAtual.imagem_url,
        quantidade:     qty,
        estoque:        getMaxQty()
      });
    }

    salvarCarrinho(carrinho);
    showToast(`✓ ${qty}× ${produtoAtual.produto} adicionado ao carrinho`, 'success');
  });

  /* ── 10. COMPRA DIRETA (modal + POST) ────────── */
  let pendingCompra = null;

  btnComprar && btnComprar.addEventListener('click', () => {
    if (!produtoAtual) return;
    const qty   = getQty();
    const total = qty * parseFloat(produtoAtual.valor_unitario);
    pendingCompra = { produto_id: produtoAtual.id, quantidade: qty };

    modalBody.innerHTML = `
      <strong>${produtoAtual.produto}</strong><br>
      Quantidade: <strong>${qty}</strong><br>
      Total: <strong>${fmt(total)}</strong><br><br>
      Confirmar a compra direta deste produto?`;

    modalOverlay.classList.add('visible');
    modalOverlay.setAttribute('aria-hidden', 'false');
    modalConfirm.focus();
  });

  function fecharModal() {
    modalOverlay.classList.remove('visible');
    modalOverlay.setAttribute('aria-hidden', 'true');
    pendingCompra = null;
  }

  modalCancel.addEventListener('click', fecharModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) fecharModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

  modalConfirm.addEventListener('click', async () => {
    if (!pendingCompra || !usuario.id) return;

    modalConfirm.disabled = true;
    modalConfirm.innerHTML = '<div class="loader-ring" style="width:16px;height:16px;border-width:2px"></div><span>Processando…</span>';

    try {
      const res = await fetch(`${API}/compra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.id,
          itens: [pendingCompra]
        })
      });
      const data = await res.json();

      fecharModal();
      modalConfirm.disabled = false;
      modalConfirm.innerHTML = '<span>Confirmar compra</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

      if (res.ok) {
        showToast('✓ Compra realizada com sucesso!', 'success', 3500);
        // Atualiza estoque local
        const novo = (parseInt(produtoAtual.quantidade) || 0) - pendingCompra.quantidade;
        produtoAtual.quantidade = Math.max(0, novo);
        qtyInput.max = produtoAtual.quantidade;
        if (produtoAtual.quantidade <= 0) {
          qtySection.style.display = 'none';
          produtoAcoes.style.display = 'none';
          semEstoque.style.display = 'flex';
          estoqueDot.className = 'estoque-dot estoque-dot--zero';
          estoqueLabel.textContent = 'Sem estoque';
        } else {
          const baixo = produtoAtual.quantidade <= 5;
          estoqueDot.className = 'estoque-dot' + (baixo ? ' estoque-dot--baixo' : '');
          estoqueLabel.textContent = baixo
            ? `Estoque baixo — apenas ${produtoAtual.quantidade} unidade${produtoAtual.quantidade > 1 ? 's' : ''}`
            : `${produtoAtual.quantidade} unidades disponíveis`;
          qtyInput.value = 1;
          atualizarTotal();
        }
        setTimeout(() => window.location.href = 'telacompras.html', 2000);
      } else {
        showToast(data.erro || 'Erro ao processar compra.', 'error');
      }
    } catch (err) {
      fecharModal();
      modalConfirm.disabled = false;
      modalConfirm.innerHTML = '<span>Confirmar compra</span>';
      showToast('Erro de conexão. Tente novamente.', 'error');
    }
  });

})();
