/* ============================================================
   NEXUS IMPORTS — Tela de Rastreio JS
   Busca o status do pedido no backend e desenha a rota real
   (origem do armazém → endereço de entrega) usando o Google Maps
   JavaScript API + Directions + Geocoding.
   ============================================================ */

(function () {
  'use strict';

  const API = 'http://localhost:3000';

  /* ── 1. GUARD DE AUTENTICAÇÃO ────────────────── */
  const usuarioRaw = sessionStorage.getItem('usuario');
  if (!usuarioRaw) { window.location.replace('telalogin.html'); return; }

  /* ── 2. LÊ O ID DO PEDIDO NA URL ─────────────── */
  const params = new URLSearchParams(window.location.search);
  const pedidoId = params.get('pedido');

  const loaderEl    = document.getElementById('rastreioLoader');
  const erroEl      = document.getElementById('rastreioErro');
  const erroMsgEl   = document.getElementById('rastreioErroMsg');
  const conteudoEl  = document.getElementById('rastreioConteudo');

  if (!pedidoId) {
    mostrarErro('Nenhum pedido informado na URL.');
  } else {
    carregarRastreio(pedidoId);
  }

  function mostrarErro(msg) {
    loaderEl.style.display = 'none';
    erroEl.style.display = 'flex';
    if (msg) erroMsgEl.textContent = msg;
  }

  /* ── 3. BUSCA OS DADOS DO PEDIDO ──────────────── */
  let rastreioData = null;

  async function carregarRastreio(id) {
    try {
      const res = await fetch(`${API}/pedido/${id}/rastreio`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        mostrarErro(data.erro || 'Pedido não encontrado.');
        return;
      }
      rastreioData = await res.json();
      renderizar(rastreioData);
    } catch (err) {
      console.error(err);
      mostrarErro('Servidor indisponível. Certifique-se de que o backend está rodando.');
    }
  }

  /* ── 4. RENDERIZA STATUS, STEPPER E INFO ──────── */
  function renderizar(d) {
    loaderEl.style.display = 'none';
    conteudoEl.style.display = 'block';

    document.getElementById('rastreioPedidoId').textContent = `#${String(d.pedido_id).padStart(4, '0')}`;
    document.getElementById('rastreioProduto').textContent = d.produto;
    document.getElementById('infoOrigem').textContent = d.origem.nome;
    document.getElementById('infoDestino').textContent = d.destino_endereco;
    document.getElementById('infoEta').textContent = d.status_entrega === 'ENTREGUE'
      ? 'Entregue em ' + new Date(d.entregue_em).toLocaleDateString('pt-BR')
      : new Date(d.eta_estimada + 'T00:00:00').toLocaleDateString('pt-BR');

    montarStepper(d.status_entrega);

    if (d.status_entrega === 'CANCELADO') {
      document.querySelector('.mapa-rastreio').style.display = 'none';
      const aviso = document.getElementById('mapaConfigAviso');
      aviso.style.display = 'flex';
      aviso.querySelector('h3').textContent = 'Pedido cancelado';
      aviso.querySelector('p').textContent = 'Este pedido foi cancelado e não possui rastreio de envio.';
      return;
    }

    iniciarMapa(d);
  }

  const ORDEM_STATUS = ['AGUARDANDO', 'PREPARANDO', 'ENVIADO', 'ENTREGUE'];

  function montarStepper(statusAtual) {
    const idxAtual = ORDEM_STATUS.indexOf(statusAtual);
    const steps = document.querySelectorAll('.step');
    const lines = document.querySelectorAll('.step-line');

    steps.forEach((step, i) => {
      step.classList.remove('is-done', 'is-current');
      if (i < idxAtual) step.classList.add('is-done');
      else if (i === idxAtual) step.classList.add('is-current');
    });

    lines.forEach((line, i) => {
      line.classList.toggle('is-done', i < idxAtual);
    });
  }
  /* ── 5. MAPA (iframe do Google Maps, sem chave de API) ── */
  function iniciarMapa(d) {
    const container = document.getElementById('mapaRastreio');

    const origem = encodeURIComponent(`${d.origem.lat},${d.origem.lng}`);
    const destino = encodeURIComponent(d.destino_endereco + ', Brasil');

    const src = `https://maps.google.com/maps?saddr=${origem}&daddr=${destino}&output=embed`;

    container.innerHTML = `
      <iframe
        src="${src}"
        width="100%"
        height="100%"
        style="border:0;"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade">
      </iframe>`;
  }

})();