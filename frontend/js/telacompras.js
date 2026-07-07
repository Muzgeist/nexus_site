/* ============================================================
   NEXUS — Tela de Pedidos (antiga "Compras") JS
   - Busca os pedidos reais do usuário no backend
   - Renderiza cada pedido com status, forma de pagamento
   - Botão "Rastrear Envio" → abre o mapa real (telarastreio.html)
   - Cancelamento de pedido via API
   ============================================================ */

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
  const avatarFallback = document.querySelector('.avatar-header-fallback');
  const fotoSalva = sessionStorage.getItem('fotoPerfil');
  if (fotoSalva && avatarFallback) {
    const img = document.createElement('img');
    img.src = fotoSalva;
    img.className = 'avatar-header-img';
    img.alt = '';
    avatarFallback.replaceWith(img);
  }

  /* ── 3. TOAST ─────────────────────────────────── */
  const toastEl = document.getElementById('toast');
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  function fmt(v) {
    return parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  /* ── 4. MAPAS DE STATUS → TEXTO/CLASSE ───────── */
  const STATUS_ENTREGA_MAP = {
    AGUARDANDO: { label: 'Aguardando Pagamento', classe: 'aguardando' },
    PREPARANDO: { label: 'Em Separação',         classe: 'separacao' },
    ENVIADO:    { label: 'Em Trânsito',          classe: 'transito' },
    ENTREGUE:   { label: 'Entregue',             classe: 'entregue' },
    CANCELADO:  { label: 'Cancelado',            classe: 'cancelado' }
  };

  const FORMA_PAGAMENTO_MAP = {
    PIX:      'Pix',
    CREDITO:  'Cartão de Crédito',
    DEBITO:   'Cartão de Débito',
    BOLETO:   'Boleto'
  };

  function rastreioDisponivel(pedido) {
    // Só faz sentido rastrear pedidos já confirmados (pagos) e não cancelados
    return pedido.status_pagamento === 'PAGO' && pedido.status_entrega !== 'CANCELADO';
  }

  /* ── 5. TEMPLATE DO CARD DE PEDIDO ───────────── */
  function cardTemplate(pedido, index) {
    const statusInfo = STATUS_ENTREGA_MAP[pedido.status_entrega] || STATUS_ENTREGA_MAP.AGUARDANDO;
    const numero = '#' + String(pedido.id).padStart(4, '0');
    const podeCancelar = !['ENVIADO', 'ENTREGUE', 'CANCELADO'].includes(pedido.status_entrega);
    const podeRastrear = rastreioDisponivel(pedido);

    let formaPagLabel = FORMA_PAGAMENTO_MAP[pedido.forma_pagamento] || null;
    if (pedido.forma_pagamento === 'CREDITO' && pedido.parcelas > 1) {
      formaPagLabel += ` (${pedido.parcelas}x)`;
    }

    const dataFormatada = pedido.criado_em
      ? new Date(pedido.criado_em).toLocaleDateString('pt-BR')
      : '—';

    return `
      <article class="compra-card reveal" style="animation-delay:${Math.min(index, 6) * 0.06}s" data-pedido-id="${pedido.id}">
        <div class="compra-accent compra-accent--${statusInfo.classe}"></div>
        <div class="compra-top">
          <span class="compra-numero">${numero}</span>
          <span class="compra-status compra-status--${statusInfo.classe}">${statusInfo.label}</span>
          ${formaPagLabel ? `<span class="pagamento-badge">${escapeHtml(formaPagLabel)}</span>` : ''}

          <div class="compra-top-actions">
            <button
              class="btn-rastrear-compra ${podeRastrear ? '' : 'is-disabled'}"
              data-pedido-id="${pedido.id}"
              ${podeRastrear ? '' : 'disabled'}
              aria-label="Rastrear envio do pedido ${numero}"
              title="${podeRastrear ? 'Ver localização do pedido no mapa' : 'Disponível após confirmação do pagamento'}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Rastrear Envio
            </button>

            <button
              class="btn-cancelar-compra ${podeCancelar ? '' : 'btn-cancelar--disabled'}"
              data-pedido-id="${pedido.id}"
              ${podeCancelar ? '' : 'disabled'}
              aria-label="Cancelar pedido ${numero}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Cancelar Pedido
            </button>
          </div>
        </div>
        <div class="compra-body">
          <div class="compra-field">
            <span class="field-label">Produto</span>
            <span class="field-value">${escapeHtml(pedido.produto)}</span>
          </div>
          <div class="compra-field">
            <span class="field-label">Quantidade</span>
            <span class="field-value">${pedido.quantidade}</span>
          </div>
          <div class="compra-field">
            <span class="field-label">Valor Total</span>
            <span class="field-value field-value--price">${fmt(pedido.valor_total)}</span>
          </div>
          <div class="compra-field">
            <span class="field-label">Data do Pedido</span>
            <span class="field-value">${dataFormatada}</span>
          </div>
        </div>
      </article>`;
  }

  /* ── 6. CARREGA OS PEDIDOS DO BACKEND ────────── */
  const loaderEl = document.getElementById('comprasLoader');
  const vazioEl  = document.getElementById('comprasVazio');
  const listaEl  = document.getElementById('lista-compras');

  async function carregarPedidos() {
    loaderEl.style.display = 'flex';
    vazioEl.style.display = 'none';
    listaEl.style.display = 'none';

    try {
      const res = await fetch(`${API}/compras/${usuario.id}`);
      if (!res.ok) throw new Error('Falha ao buscar pedidos');
      const pedidos = await res.json();

      loaderEl.style.display = 'none';

      if (!pedidos || pedidos.length === 0) {
        vazioEl.style.display = 'flex';
        return;
      }

      listaEl.style.display = 'flex';
      listaEl.innerHTML = pedidos.map(cardTemplate).join('');

      // Os cards são injetados após o IntersectionObserver já ter rodado,
      // então disparamos o "reveal" manualmente (mesmo padrão de telaprodutos.js)
      listaEl.querySelectorAll('.reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 80);
      });
    } catch (err) {
      console.error(err);
      loaderEl.style.display = 'none';
      vazioEl.style.display = 'flex';
      vazioEl.querySelector('h2').textContent = 'Não foi possível carregar seus pedidos';
      vazioEl.querySelector('p').textContent = 'Verifique se o backend está rodando e tente novamente.';
    }
  }

  /* ── 7. RASTREAR ENVIO ───────────────────────── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-rastrear-compra');
    if (btn && !btn.disabled) {
      const pedidoId = btn.dataset.pedidoId;
      window.location.href = `telarastreio.html?pedido=${encodeURIComponent(pedidoId)}`;
    }
  });

  /* ── 8. CANCELAMENTO DE PEDIDO (modal + API) ─── */
  const overlay         = document.getElementById('modalOverlay');
  const modalPedidoNum   = document.getElementById('modalPedidoNum');
  const btnModalCancel   = document.getElementById('btnModalCancel');
  const btnModalConfirm  = document.getElementById('btnModalConfirm');

  let cardAlvo = null;

  function abrirModal(card) {
    cardAlvo = card;
    const numero = '#' + String(card.dataset.pedidoId).padStart(4, '0');
    if (modalPedidoNum) modalPedidoNum.textContent = numero;
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    btnModalConfirm.focus();
  }

  function fecharModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    cardAlvo = null;
  }

  async function confirmarCancelamento() {
    if (!cardAlvo) return;
    const pedidoId = cardAlvo.dataset.pedidoId;

    btnModalConfirm.disabled = true;
    btnModalConfirm.textContent = 'Cancelando…';

    try {
      const res = await fetch(`${API}/compra/${pedidoId}/cancelar`, { method: 'PUT' });
      const data = await res.json();

      btnModalConfirm.disabled = false;
      btnModalConfirm.textContent = 'Sim, cancelar';

      if (!res.ok) {
        showToast(data.erro || 'Não foi possível cancelar este pedido.');
        fecharModal();
        return;
      }

      const statusEl    = cardAlvo.querySelector('.compra-status');
      const accentEl     = cardAlvo.querySelector('.compra-accent');
      const btnCancelar  = cardAlvo.querySelector('.btn-cancelar-compra');
      const btnRastrear  = cardAlvo.querySelector('.btn-rastrear-compra');

      if (statusEl) {
        statusEl.textContent = 'Cancelado';
        statusEl.className = 'compra-status compra-status--cancelado';
      }
      if (accentEl) accentEl.className = 'compra-accent compra-accent--cancelado';
      if (btnCancelar) { btnCancelar.disabled = true; btnCancelar.classList.add('btn-cancelar--disabled'); }
      if (btnRastrear) { btnRastrear.disabled = true; btnRastrear.classList.add('is-disabled'); }

      cardAlvo.style.transition = 'opacity 0.5s ease, filter 0.5s ease';
      setTimeout(() => cardAlvo.classList.add('compra-card--cancelado'), 50);

      showToast('Pedido cancelado com sucesso.');
      fecharModal();
    } catch (err) {
      console.error(err);
      btnModalConfirm.disabled = false;
      btnModalConfirm.textContent = 'Sim, cancelar';
      showToast('Erro de conexão. Tente novamente.');
      fecharModal();
    }
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-cancelar-compra');
    if (btn && !btn.disabled) {
      const card = btn.closest('.compra-card');
      if (card) abrirModal(card);
    }
  });

  if (btnModalCancel)  btnModalCancel.addEventListener('click', fecharModal);
  if (btnModalConfirm) btnModalConfirm.addEventListener('click', confirmarCancelamento);

  if (overlay) {
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay?.classList.contains('open')) fecharModal();
  });

  /* ── 9. INICIALIZAÇÃO ────────────────────────── */
  carregarPedidos();

})();
