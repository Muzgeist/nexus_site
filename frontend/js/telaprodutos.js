/* ============================================
   NEXUS IMPORTS — Tela de Produtos JS
   - Autenticação
   - Carrosséis por categoria com scroll automático
   - Filtro por categoria + busca
   - Grade expansível com scroll infinito
   ============================================ */

(function () {
  'use strict';

  const API = window.NEXUS_API_BASE;

  /* ── 1. GUARD DE AUTENTICAÇÃO ────────────────── */
  const usuarioRaw = sessionStorage.getItem('usuario');
  if (!usuarioRaw) { window.location.replace('telalogin.html'); return; }
  let usuario = {};
  try { usuario = JSON.parse(usuarioRaw); } catch (e) { window.location.replace('telalogin.html'); return; }

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

  /* ── 2b. TOGGLE DE FILTROS (telas pequenas) ──── */
  const btnFilterToggle = document.getElementById('btnFilterToggle');
  const filterBarBody   = document.getElementById('filterBarBody');
  if (btnFilterToggle && filterBarBody) {
    btnFilterToggle.addEventListener('click', () => {
      const isOpen = filterBarBody.classList.toggle('open');
      btnFilterToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ── 3. ESTADO ───────────────────────────────── */
  let todosOsProdutos = [];       // cache completo
  let categorias      = [];       // lista de categorias
  let catAtiva        = '';       // '' = todas
  let buscaAtiva      = '';       // string de busca
  let modoGrade       = false;    // true = grade, false = carrosséis
  let gradePage       = 0;
  const GRADE_POR_PAGINA = 20;
  let gradeCarregando = false;
  let gradeEsgotada   = false;

  /* ── 4. REFS DOM ─────────────────────────────── */
  const loader            = document.getElementById('produtosLoader');
  const carrosselContainer= document.getElementById('carrosselContainer');
  const emptyState        = document.getElementById('emptyState');
  const filterChips       = document.getElementById('filterChips');
  const searchInput       = document.getElementById('searchInput');
  const searchClear       = document.getElementById('searchClear');
  const gradeSection      = document.getElementById('gradeSection');
  const gradeGrid         = document.getElementById('gradeGrid');
  const gradeTitle        = document.getElementById('gradeTitle');
  const gradeCount        = document.getElementById('gradeCount');
  const gradeLoader       = document.getElementById('gradeLoader');
  const gradeEnd          = document.getElementById('gradeEnd');
  const btnVoltarCarrossel= document.getElementById('btnVoltarCarrossel');
  const produtosMain      = document.getElementById('produtosMain');

  /* ── 5. UTILIDADES ───────────────────────────── */
  function fmt(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function showToast(msg, dur = 2800) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), dur);
  }

  function filtrarProdutos() {
    return todosOsProdutos.filter(p => {
      const matchCat   = !catAtiva || p.categoria === catAtiva;
      const termo      = buscaAtiva.toLowerCase();
      const matchBusca = !termo ||
        (p.produto  || '').toLowerCase().includes(termo) ||
        (p.marca    || '').toLowerCase().includes(termo) ||
        (p.descricao|| '').toLowerCase().includes(termo);
      return matchCat && matchBusca;
    });
  }

  /* ── 6. CARD HTML ────────────────────────────── */
  function criarCardHTML(p, idx = 0) {
    const semEstoque = p.quantidade <= 0;
    const baixoEstoque = p.quantidade > 0 && p.quantidade <= 5;
    const estoqueClass = semEstoque ? 'produto-card-estoque--zero' : baixoEstoque ? 'produto-card-estoque--baixo' : '';
    const estoqueLabel = semEstoque ? 'Sem estoque' : baixoEstoque ? `Últimas ${p.quantidade} un.` : `${p.quantidade} disponíveis`;

    const imgHTML = p.imagem_url
      ? `<img src="${p.imagem_url}" alt="${p.produto}" class="produto-card-img" loading="lazy">`
      : `<div class="produto-card-img-placeholder">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
             <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
           </svg>
         </div>`;

    return `
      <a class="produto-card" href="telaproduto.html?id=${p.id}" style="animation-delay:${idx * 0.04}s">
        <div class="produto-card-img-wrap">${imgHTML}</div>
        ${p.categoria ? `<div class="produto-card-tag">${p.categoria}</div>` : ''}
        <div class="produto-card-body">
          <div class="produto-card-nome">${p.produto}</div>
          ${p.marca ? `<div class="produto-card-marca">${p.marca}</div>` : ''}
          <div class="produto-card-footer">
            <span class="produto-card-preco">${fmt(parseFloat(p.valor_unitario))}</span>
            <span class="produto-card-estoque ${estoqueClass}">${estoqueLabel}</span>
          </div>
        </div>
      </a>`;
  }

  /* ── 7. CARROSSÉIS ───────────────────────────── */
  function renderCarrosseis() {
    carrosselContainer.innerHTML = '';

    // Agrupar por categoria
    const grupos = {};
    todosOsProdutos.forEach(p => {
      const cat = p.categoria || 'Outros';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(p);
    });

    const cats = Object.keys(grupos).sort();
    if (cats.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }
    emptyState.style.display = 'none';

    cats.forEach((cat, ci) => {
      const prods = grupos[cat];
      const sec   = document.createElement('div');
      sec.className = 'carousel-section';

      // Velocidade baseada na qtde de produtos (mais produtos = mais rápido)
      const dur = Math.max(18, prods.length * 3.5);
      // Duplicar para loop contínuo
      const itemsHTML = prods.map((p, i) => criarCardHTML(p, i)).join('');
      const loopHTML  = itemsHTML + itemsHTML; // duplicado para loop infinuo

      sec.innerHTML = `
        <div class="carousel-header">
          <div class="carousel-title">
            ${cat}
            <span class="carousel-count">${prods.length} produto${prods.length > 1 ? 's' : ''}</span>
          </div>
          <button class="btn-ver-mais" data-cat="${cat}">
            <span>Ver todos</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <div class="carousel-track-wrap">
          <div class="carousel-track" style="--dur:${dur}s">
            ${loopHTML}
          </div>
        </div>`;

      // Pausa ao hover
      const track = sec.querySelector('.carousel-track');
      const wrap  = sec.querySelector('.carousel-track-wrap');
      wrap.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
      wrap.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');

      // "Ver todos" → ativa grade
      sec.querySelector('.btn-ver-mais').addEventListener('click', e => {
        const cat = e.currentTarget.dataset.cat;
        ativarGrade(cat);
      });

      carrosselContainer.appendChild(sec);

      // Scroll reveal com delay escalonado
      requestAnimationFrame(() => {
        setTimeout(() => sec.classList.add('visible'), ci * 80);
      });
    });
  }

  /* ── 8. GRADE ────────────────────────────────── */
  function ativarGrade(catOverride) {
    modoGrade = true;
    if (catOverride !== undefined) {
      catAtiva = catOverride;
      atualizarChips();
    }
    gradePage      = 0;
    gradeEsgotada  = false;
    gradeCarregando= false;
    gradeGrid.innerHTML = '';
    gradeEnd.style.display = 'none';
    gradeLoader.style.display = 'none';

    const filtrados = filtrarProdutos();
    const label = catAtiva || (buscaAtiva ? `"${buscaAtiva}"` : 'Todos os Produtos');
    gradeTitle.textContent = label;
    gradeCount.textContent = `${filtrados.length} produto${filtrados.length !== 1 ? 's' : ''}`;

    produtosMain.style.display = 'none';
    gradeSection.style.display = 'block';
    window.scrollTo({ top: 0 });

    carregarMaisGrade();
  }

  function carregarMaisGrade() {
    if (gradeCarregando || gradeEsgotada) return;
    gradeCarregando = true;

    const filtrados = filtrarProdutos();
    const start = gradePage * GRADE_POR_PAGINA;
    const slice = filtrados.slice(start, start + GRADE_POR_PAGINA);

    if (slice.length === 0) {
      gradeEsgotada = true;
      gradeEnd.style.display = 'block';
      gradeLoader.style.display = 'none';
      gradeCarregando = false;
      if (filtrados.length === 0) {
        gradeGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>Nenhum produto encontrado</p></div>';
      }
      return;
    }

    slice.forEach((p, i) => {
      const div = document.createElement('div');
      div.innerHTML = criarCardHTML(p, i);
      gradeGrid.appendChild(div.firstElementChild);
    });

    gradePage++;
    gradeCarregando = false;
    gradeLoader.style.display = 'none';

    if (gradePage * GRADE_POR_PAGINA >= filtrados.length) {
      gradeEsgotada = true;
      gradeEnd.style.display = 'block';
    }
  }

  function voltarCarrosseis() {
    modoGrade = false;
    gradeSection.style.display = 'none';
    produtosMain.style.display = 'block';
    window.scrollTo({ top: 0 });
    // Se busca/filtro estava ativo apenas pela grade, não limpar;
    // carrosseis refletem estado global
  }

  btnVoltarCarrossel && btnVoltarCarrossel.addEventListener('click', voltarCarrosseis);

  // Scroll infinito na grade
  window.addEventListener('scroll', () => {
    if (!modoGrade || gradeEsgotada || gradeCarregando) return;
    const dist = document.body.scrollHeight - window.scrollY - window.innerHeight;
    if (dist < 300) {
      gradeLoader.style.display = 'flex';
      carregarMaisGrade();
    }
  });

  /* ── 9. CHIPS DE FILTRO ──────────────────────── */
  function renderChips() {
    // Remove chips dinâmicos antigos (mantém o "Todos")
    filterChips.querySelectorAll('.filter-chip:not([data-cat=""])').forEach(c => c.remove());
    categorias.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.textContent = cat;
      btn.dataset.cat = cat;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => onChipClick(cat));
      filterChips.appendChild(btn);
    });
  }

  function atualizarChips() {
    filterChips.querySelectorAll('.filter-chip').forEach(btn => {
      const active = btn.dataset.cat === catAtiva;
      btn.classList.toggle('filter-chip--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function onChipClick(cat) {
    catAtiva = cat;
    atualizarChips();
    aplicarFiltro();
  }

  // Chip "Todos"
  filterChips.querySelector('[data-cat=""]').addEventListener('click', () => {
    catAtiva = '';
    atualizarChips();
    aplicarFiltro();
  });

  function aplicarFiltro() {
    const filtrados = filtrarProdutos();
    const temFiltro = catAtiva || buscaAtiva;

    if (temFiltro) {
      ativarGrade();
    } else {
      // Sem filtro → volta ao modo carrossel
      if (modoGrade) voltarCarrosseis();
    }
  }

  /* ── 10. BUSCA ───────────────────────────────── */
  let buscaTimer;
  searchInput.addEventListener('input', () => {
    buscaAtiva = searchInput.value.trim();
    searchClear.style.display = buscaAtiva ? 'flex' : 'none';
    clearTimeout(buscaTimer);
    buscaTimer = setTimeout(aplicarFiltro, 320);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    buscaAtiva = '';
    searchClear.style.display = 'none';
    aplicarFiltro();
  });

  /* ── 11. CARGA INICIAL ───────────────────────── */
  async function init() {
    loader.style.display = 'flex';
    carrosselContainer.style.display = 'none';

    try {
      // Busca produtos e categorias em paralelo
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API}/produtos`),
        fetch(`${API}/categorias`)
      ]);

      if (!prodRes.ok) throw new Error('Falha ao carregar produtos');
      if (!catRes.ok)  throw new Error('Falha ao carregar categorias');

      todosOsProdutos = await prodRes.json();
      categorias      = await catRes.json();

      loader.style.display = 'none';
      carrosselContainer.style.display = 'block';

      renderChips();
      renderCarrosseis();

    } catch (err) {
      console.error(err);
      loader.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.4">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style="font-size:12px;color:var(--text-muted)">Não foi possível conectar ao servidor.<br>Certifique-se que o backend está rodando.</span>`;
    }
  }

  init();

})();
