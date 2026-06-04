/* ============================================
   NEXUS — Tela de Compras JS
   Cancelamento de pedido com modal de confirmação
   ============================================ */

(function () {
  'use strict';

  const overlay        = document.getElementById('modalOverlay');
  const modalPedidoNum = document.getElementById('modalPedidoNum');
  const btnModalCancel = document.getElementById('btnModalCancel');
  const btnModalConfirm= document.getElementById('btnModalConfirm');

  let cardAlvo = null;

  // Abre modal
  function abrirModal(card) {
    cardAlvo = card;
    const num = card.dataset.pedido || '#????';
    if (modalPedidoNum) modalPedidoNum.textContent = num;
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    btnModalConfirm.focus();
  }

  // Fecha modal
  function fecharModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    cardAlvo = null;
  }

  // Confirma cancelamento
  function confirmarCancelamento() {
    if (!cardAlvo) return;

    const statusEl = cardAlvo.querySelector('.compra-status');
    const btnCancelar = cardAlvo.querySelector('.btn-cancelar-compra');

    // Atualiza status visual
    if (statusEl) {
      statusEl.textContent = 'Cancelado';
      statusEl.className = 'compra-status';
    }

    // Desativa botão
    if (btnCancelar) {
      btnCancelar.disabled = true;
      btnCancelar.classList.add('btn-cancelar--disabled');
    }

    // Aplica estilo de cancelado com animação
    cardAlvo.style.transition = 'opacity 0.5s ease, filter 0.5s ease';
    setTimeout(() => {
      cardAlvo.classList.add('compra-card--cancelado');
    }, 50);

    fecharModal();
  }

  // Delegação de evento para botões de cancelar
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-cancelar-compra');
    if (btn && !btn.disabled) {
      const card = btn.closest('.compra-card');
      if (card) abrirModal(card);
    }
  });

  if (btnModalCancel)  btnModalCancel.addEventListener('click', fecharModal);
  if (btnModalConfirm) btnModalConfirm.addEventListener('click', confirmarCancelamento);

  // Fechar modal clicando no overlay
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) fecharModal();
    });
  }

  // Fechar com Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay?.classList.contains('open')) fecharModal();
  });

})();
