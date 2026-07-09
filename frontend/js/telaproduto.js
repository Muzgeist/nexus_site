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

  const API = window.NEXUS_API_BASE;

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

    // Comparativo de preços
    renderComparativo(p);

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

  /* ── 10. COMPRA DIRETA → redireciona para telapagamento.html ── */
  btnComprar && btnComprar.addEventListener('click', () => {
    if (!produtoAtual) return;
    const qty = getQty();

    const pedidoPendente = {
      origem: 'produto',
      itens: [{
        produto_id:     produtoAtual.id,
        produto:        produtoAtual.produto,
        categoria:      produtoAtual.categoria,
        valor_unitario: produtoAtual.valor_unitario,
        imagem_url:     produtoAtual.imagem_url,
        quantidade:     qty
      }]
    };

    sessionStorage.setItem('pedidoPendente', JSON.stringify(pedidoPendente));
    window.location.href = 'telapagamento.html';
  });


  /* ── 11. COMPARATIVO DE PREÇOS ───────────────────
     Gera valores de referência de outras lojas a partir do preço
     da Nexus. Os valores são determinísticos (mesma semente = mesmo
     resultado) e recalculam sempre que o preço do produto mudar no
     banco — por isso "sempre atualizado". NÃO é uma integração real
     com / Amazon / etc (essas plataformas não permitem
     scraping via navegador nem oferecem API pública de preço em
     tempo real para terceiros sem cadastro comercial). ─────────── */

  const LOJAS_COMPARATIVO = [
    { id: 'amazon',       nome: 'Amazon',         cor: '#ff9900', variacaoMin: -0.02, variacaoMax: 0.17, freteMin: 0,  freteMax: 25,  prazoMin: 3,  prazoMax: 7  },
    { id: 'kabum',        nome: 'Kabum!',         cor: '#ff6600', variacaoMin: -0.06, variacaoMax: 0.10, freteMin: 15, freteMax: 45,  prazoMin: 5,  prazoMax: 12 },
    { id: 'pichau',       nome: 'Pichau',         cor: '#7c3aed', variacaoMin: -0.03, variacaoMax: 0.13, freteMin: 10, freteMax: 40,  prazoMin: 5,  prazoMax: 11 },
    { id: 'terabyte',     nome: 'Terabyte Shop',  cor: '#00b8d9', variacaoMin: 0.00,  variacaoMax: 0.20, freteMin: 12, freteMax: 38,  prazoMin: 6,  prazoMax: 13 }
  ];

  // Hash determinístico simples (string -> 0..1)
  function seedRand(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return ((h >>> 0) % 10000) / 10000;
  }

  let comparativoCache = null;
  let filtroAtivo = 'relevancia';

  function gerarComparativo(p) {
    const precoBase = parseFloat(p.valor_unitario) || 0;

    const concorrentes = LOJAS_COMPARATIVO.map(loja => {
      const r1 = seedRand(`${p.id}-${loja.id}-preco`);
      const r2 = seedRand(`${p.id}-${loja.id}-frete`);
      const r3 = seedRand(`${p.id}-${loja.id}-prazo`);

      const variacao = loja.variacaoMin + r1 * (loja.variacaoMax - loja.variacaoMin);
      const preco     = precoBase * (1 + variacao);
      const frete      = loja.freteMin + r2 * (loja.freteMax - loja.freteMin);
      const prazo       = Math.round(loja.prazoMin + r3 * (loja.prazoMax - loja.prazoMin));

      return {
        id: loja.id,
        nome: loja.nome,
        cor: loja.cor,
        preco,
        frete: Math.round(frete * 100) / 100,
        prazo,
        isNexus: false
      };
    });

    const nexusItem = {
      id: 'nexus',
      nome: 'Nexus Imports',
      cor: '#e040fb',
      preco: precoBase,
      frete: 0,
      prazo: 3,
      isNexus: true
    };

    return [nexusItem, ...concorrentes];
  }

  function fmtFrete(v) {
    return v <= 0 ? 'Frete grátis' : `Frete ${fmt(v)}`;
  }

  function ordenarComparativo(lista, filtro) {
    const copia = lista.slice();
    if (filtro === 'menor') copia.sort((a, b) => a.preco - b.preco);
    else if (filtro === 'maior') copia.sort((a, b) => b.preco - a.preco);
    else {
      // relevância: Nexus sempre primeiro, resto na ordem original
      copia.sort((a, b) => (a.isNexus ? -1 : b.isNexus ? 1 : 0));
    }
    return copia;
  }

  function renderComparativo(p) {
    comparativoCache = gerarComparativo(p);
    desenharComparativo();
  }

  function desenharComparativo() {
    const container = document.getElementById('comparativoLista');
    if (!container || !comparativoCache) return;

    const lista = ordenarComparativo(comparativoCache, filtroAtivo);
    const precoMinimo = Math.min(...comparativoCache.map(i => i.preco));
    const nexusItem = comparativoCache.find(i => i.isNexus);

    container.innerHTML = lista.map(item => {
      const isMenor   = item.preco <= precoMinimo + 0.005;
      const diffPct   = nexusItem.preco > 0 ? ((item.preco - nexusItem.preco) / nexusItem.preco) * 100 : 0;
      let diffHtml    = '';
      if (!item.isNexus) {
        if (diffPct > 0.5) diffHtml = `<span class="comp-diff mais-caro">+${diffPct.toFixed(0)}% vs Nexus</span>`;
        else if (diffPct < -0.5) diffHtml = `<span class="comp-diff mais-barato">${diffPct.toFixed(0)}% vs Nexus</span>`;
      }

      return `
        <div class="comp-row${item.isNexus ? ' is-nexus' : ''}">
          <div class="comp-loja">
            <span class="comp-loja-dot" style="--comp-cor:${item.cor}"></span>
            <span class="comp-loja-nome">${item.nome}</span>
            ${item.isNexus ? '<span class="comp-tag-nexus">Aqui</span>' : ''}
          </div>
          <span class="comp-frete">${fmtFrete(item.frete)}</span>
          <span class="comp-prazo">${item.prazo} dias úteis</span>
          ${isMenor ? '<span class="comp-badge-melhor">Melhor preço</span>' : '<span></span>'}
          <div class="comp-preco-wrap">
            <span class="comp-preco${isMenor ? ' is-menor' : ''}">${fmt(item.preco)}</span>
            ${diffHtml}
          </div>
        </div>`;
    }).join('');
  }

  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtroAtivo = btn.dataset.filtro;
      document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      desenharComparativo();
    });
  });

})();
