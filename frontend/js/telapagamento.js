/* ============================================================
   NEXUS IMPORTS — Tela de Pagamento JS
   Recebe o pedido pendente (sessionStorage: 'pedidoPendente'),
   gerado por QUALQUER botão de compra (produto, carrinho —
   individual/selecionados/tudo) e processa o pagamento via
   Pix, Cartão de Crédito/Débito ou Boleto.
   ============================================================ */

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

  /* ── 3. UTILIDADES ───────────────────────────── */
  function fmt(v) {
    return parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const toastEl = document.getElementById('toast');
  function showToast(msg, tipo = '', dur = 3200) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast visible' + (tipo ? ' toast--' + tipo : '');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => toastEl.classList.remove('visible'), dur);
  }

  /* ── 4. CARREGA O PEDIDO PENDENTE ────────────── */
  const vazioEl = document.getElementById('pagamentoVazio');
  const gridEl  = document.getElementById('pagamentoGrid');

  let pedidoPendente = null;
  try { pedidoPendente = JSON.parse(sessionStorage.getItem('pedidoPendente') || 'null'); }
  catch (e) { pedidoPendente = null; }

  if (!pedidoPendente || !Array.isArray(pedidoPendente.itens) || pedidoPendente.itens.length === 0) {
    vazioEl.style.display = 'flex';
    gridEl.style.display = 'none';
    return; // nada mais a fazer nesta página
  }

  vazioEl.style.display = 'none';
  gridEl.style.display = 'grid';

  const itens = pedidoPendente.itens; // [{ produto_id, produto, categoria, valor_unitario, quantidade, imagem_url }]
  const origem = pedidoPendente.origem || 'carrinho';

  /* ── 5. RENDERIZA O RESUMO DO PEDIDO ─────────── */
  const resumoItensEl = document.getElementById('resumoItens');
  const resumoTotalEl = document.getElementById('resumoTotal');

  let valorTotal = 0;
  resumoItensEl.innerHTML = itens.map(item => {
    const subtotal = item.quantidade * parseFloat(item.valor_unitario);
    valorTotal += subtotal;
    return `
      <div class="resumo-item">
        <div class="resumo-item-info">
          <span class="resumo-item-nome">${item.produto}</span>
          <span class="resumo-item-qty">${item.quantidade}× ${fmt(item.valor_unitario)}</span>
        </div>
        <span class="resumo-item-valor">${fmt(subtotal)}</span>
      </div>`;
  }).join('');
  resumoTotalEl.textContent = fmt(valorTotal);

  // Payload comum enviado a qualquer rota de pagamento
  const itensPayload = itens.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade }));

  /* ── 6. ALTERNÂNCIA DE ABAS (Pix / Cartão / Boleto) ── */
  const tabs    = document.querySelectorAll('.metodo-tab');
  const paineis = document.querySelectorAll('.metodo-painel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const metodo = tab.dataset.metodo;
      paineis.forEach(p => { p.hidden = p.dataset.painel !== metodo; });
    });
  });

  /* ── 7. LIMPEZA PÓS-PAGAMENTO + REDIRECIONAMENTO ── */
  function limparCarrinhoComprado() {
    if (origem !== 'carrinho') return;
    try {
      const carrinho = JSON.parse(sessionStorage.getItem('carrinho') || '[]');
      const idsComprados = new Set(itens.map(i => i.produto_id));
      const restante = carrinho.filter(c => !idsComprados.has(c.id));
      sessionStorage.setItem('carrinho', JSON.stringify(restante));
    } catch (e) { /* sem problema, segue o fluxo */ }
  }

  const sucessoOverlay   = document.getElementById('sucessoOverlay');
  const sucessoCountdown = document.getElementById('sucessoCountdown');

  function mostrarSucesso() {
    limparCarrinhoComprado();
    sessionStorage.removeItem('pedidoPendente');

    sucessoOverlay.classList.add('show');
    sucessoOverlay.removeAttribute('aria-hidden');

    let n = 3;
    sucessoCountdown.textContent = n;
    const intervalo = setInterval(() => {
      n -= 1;
      sucessoCountdown.textContent = n;
      if (n <= 0) {
        clearInterval(intervalo);
        window.location.href = 'telacompras.html';
      }
    }, 1000);
  }

  /* ════════════════════════════════════════════
     PIX
     ════════════════════════════════════════════ */
  const btnGerarPix   = document.getElementById('btnGerarPix');
  const pixResultado  = document.getElementById('pixResultado');
  const pixQrcodeBox  = document.getElementById('pixQrcodeBox');
  const pixCopiaInput = document.getElementById('pixCopiaCola');
  const btnCopiarPix  = document.getElementById('btnCopiarPix');
  const pixStatus     = document.getElementById('pixStatus');
  const btnSimularPix = document.getElementById('btnSimularPix');

  let pixTxidAtual = null;

  btnGerarPix.addEventListener('click', async () => {
    btnGerarPix.disabled = true;
    btnGerarPix.innerHTML = '<span>Gerando cobrança…</span>';

    try {
      const res = await fetch(`${API}/pagamento/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id, itens: itensPayload })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.erro || 'Erro ao gerar cobrança Pix.', 'error');
        btnGerarPix.disabled = false;
        btnGerarPix.innerHTML = '<span>Gerar QR Code Pix</span>';
        return;
      }

      pixTxidAtual = data.txid;
      pixCopiaInput.value = data.pix_copia_cola;

      // Renderiza o QR Code (biblioteca carregada via CDN)
      pixQrcodeBox.innerHTML = '';
      if (window.QRCode) {
        try {
          new QRCode(pixQrcodeBox, {
            text: data.pix_copia_cola,
            width: 196,
            height: 196,
            colorDark: '#1a0030',
            colorLight: '#ffffff'
          });
        } catch (e) {
          pixQrcodeBox.innerHTML = '<span style="color:#1a0030;font-size:12px;max-width:196px;display:block">Não foi possível desenhar o QR Code. Use o código Copia e Cola abaixo.</span>';
        }
      } else {
        pixQrcodeBox.innerHTML = '<span style="color:#1a0030;font-size:12px;max-width:196px;display:block">QR Code indisponível offline. Use o código Copia e Cola abaixo.</span>';
      }

      btnGerarPix.style.display = 'none';
      pixResultado.style.display = 'flex';
      showToast('✓ Cobrança Pix gerada. Escaneie ou copie o código.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão. Verifique se o backend está rodando.', 'error');
      btnGerarPix.disabled = false;
      btnGerarPix.innerHTML = '<span>Gerar QR Code Pix</span>';
    }
  });

  btnCopiarPix.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pixCopiaInput.value);
      showToast('✓ Código Pix copiado!', 'success', 2000);
    } catch (e) {
      pixCopiaInput.select();
      showToast('Selecione e copie manualmente (Ctrl+C).', '', 2500);
    }
  });

  btnSimularPix.addEventListener('click', async () => {
    if (!pixTxidAtual) return;
    btnSimularPix.disabled = true;
    btnSimularPix.innerHTML = '<span>Verificando pagamento…</span>';
    pixStatus.classList.add('is-confirmando');
    pixStatus.querySelector('span').textContent = 'Verificando pagamento…';

    setTimeout(async () => {
      try {
        const res = await fetch(`${API}/pagamento/pix/${pixTxidAtual}/confirmar`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.erro || 'Erro ao confirmar pagamento.', 'error');
          btnSimularPix.disabled = false;
          btnSimularPix.innerHTML = '<span>Já paguei (simular confirmação)</span>';
          return;
        }
        pixStatus.querySelector('span').textContent = 'Pagamento confirmado!';
        mostrarSucesso();
      } catch (err) {
        console.error(err);
        showToast('Erro de conexão ao confirmar pagamento.', 'error');
        btnSimularPix.disabled = false;
        btnSimularPix.innerHTML = '<span>Já paguei (simular confirmação)</span>';
      }
    }, 1200);
  });

  /* ════════════════════════════════════════════
     CARTÃO (Crédito / Débito)
     ════════════════════════════════════════════ */
  const cartaoForm     = document.getElementById('cartaoForm');
  const cartaoNumero   = document.getElementById('cartaoNumero');
  const cartaoValidade = document.getElementById('cartaoValidade');
  const cartaoCvv      = document.getElementById('cartaoCvv');
  const bandeiraBadge  = document.getElementById('bandeiraBadge');
  const parcelasWrap   = document.getElementById('parcelasWrap');
  const cartaoParcelas = document.getElementById('cartaoParcelas');
  const btnPagarCartao = document.getElementById('btnPagarCartao');

  function tipoCartaoAtual() {
    const radio = document.querySelector('input[name="tipoCartao"]:checked');
    return radio ? radio.value : 'CREDITO';
  }

  document.querySelectorAll('input[name="tipoCartao"]').forEach(r => {
    r.addEventListener('change', () => {
      parcelasWrap.style.display = tipoCartaoAtual() === 'CREDITO' ? 'block' : 'none';
    });
  });

  // ── Detecção de bandeira pelos primeiros dígitos ──
  function detectarBandeira(numero) {
    const n = numero.replace(/\D/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'Elo';
    if (/^6(?:011|5)/.test(n)) return 'Discover';
    return n.length > 0 ? 'Desconhecida' : '—';
  }

  // ── Formatação ao digitar ──
  cartaoNumero.addEventListener('input', () => {
    let v = cartaoNumero.value.replace(/\D/g, '').substring(0, 16);
    cartaoNumero.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    bandeiraBadge.textContent = detectarBandeira(v);
  });

  cartaoValidade.addEventListener('input', () => {
    let v = cartaoValidade.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
    cartaoValidade.value = v;
  });

  cartaoCvv.addEventListener('input', () => {
    cartaoCvv.value = cartaoCvv.value.replace(/\D/g, '').substring(0, 4);
  });

  // ── Validação Luhn (algoritmo padrão de cartões) ──
  function luhnValido(numero) {
    const digitos = numero.replace(/\D/g, '');
    if (digitos.length < 13) return false;
    let soma = 0, dobrar = false;
    for (let i = digitos.length - 1; i >= 0; i--) {
      let d = parseInt(digitos[i], 10);
      if (dobrar) { d *= 2; if (d > 9) d -= 9; }
      soma += d;
      dobrar = !dobrar;
    }
    return soma % 10 === 0;
  }

  function validadeValida(validade) {
    const m = validade.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const mes = parseInt(m[1], 10);
    const ano = 2000 + parseInt(m[2], 10);
    if (mes < 1 || mes > 12) return false;
    const agora = new Date();
    const expira = new Date(ano, mes, 0); // último dia do mês de validade
    return expira >= new Date(agora.getFullYear(), agora.getMonth(), 1);
  }

  cartaoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const numero    = cartaoNumero.value.replace(/\s/g, '');
    const nome      = document.getElementById('cartaoNome').value.trim();
    const validade  = cartaoValidade.value.trim();
    const cvv       = cartaoCvv.value.trim();
    const tipo      = tipoCartaoAtual();
    const bandeira  = detectarBandeira(numero);

    if (!luhnValido(numero)) { showToast('Número de cartão inválido.', 'error'); return; }
    if (!nome) { showToast('Informe o nome impresso no cartão.', 'error'); return; }
    if (!validadeValida(validade)) { showToast('Validade inválida ou cartão vencido.', 'error'); return; }
    if (cvv.length < 3) { showToast('CVV inválido.', 'error'); return; }

    btnPagarCartao.disabled = true;
    btnPagarCartao.innerHTML = '<span>Processando pagamento…</span>';

    try {
      const res = await fetch(`${API}/pagamento/cartao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.id,
          itens: itensPayload,
          forma_pagamento: tipo,
          parcelas: tipo === 'CREDITO' ? parseInt(cartaoParcelas.value) : 1,
          cartao: {
            numero_final: numero.slice(-4),
            bandeira,
            nome_titular: nome
          }
        })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.erro || 'Pagamento não autorizado.', 'error');
        btnPagarCartao.disabled = false;
        btnPagarCartao.innerHTML = '<span>Pagar com cartão</span>';
        return;
      }

      mostrarSucesso();
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão. Verifique se o backend está rodando.', 'error');
      btnPagarCartao.disabled = false;
      btnPagarCartao.innerHTML = '<span>Pagar com cartão</span>';
    }
  });

  /* ════════════════════════════════════════════
     BOLETO
     ════════════════════════════════════════════ */
  const btnGerarBoleto     = document.getElementById('btnGerarBoleto');
  const boletoResultado    = document.getElementById('boletoResultado');
  const boletoLinhaEl      = document.getElementById('boletoLinhaDigitavel');
  const boletoVencimentoEl = document.getElementById('boletoVencimento');
  const boletoValorEl      = document.getElementById('boletoValor');
  const btnCopiarBoleto    = document.getElementById('btnCopiarBoleto');
  const btnImprimirBoleto  = document.getElementById('btnImprimirBoleto');
  const btnSimularBoleto   = document.getElementById('btnSimularBoleto');

  let boletoCodigoAtual = null;

  btnGerarBoleto.addEventListener('click', async () => {
    btnGerarBoleto.disabled = true;
    btnGerarBoleto.innerHTML = '<span>Gerando boleto…</span>';

    try {
      const res = await fetch(`${API}/pagamento/boleto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id, itens: itensPayload })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.erro || 'Erro ao gerar boleto.', 'error');
        btnGerarBoleto.disabled = false;
        btnGerarBoleto.innerHTML = '<span>Gerar Boleto</span>';
        return;
      }

      boletoCodigoAtual = data.boleto_codigo;
      boletoLinhaEl.textContent = data.linha_digitavel;
      boletoVencimentoEl.textContent = new Date(data.vencimento + 'T00:00:00').toLocaleDateString('pt-BR');
      boletoValorEl.textContent = fmt(data.valor_total);

      btnGerarBoleto.style.display = 'none';
      boletoResultado.style.display = 'flex';
      showToast('✓ Boleto gerado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão. Verifique se o backend está rodando.', 'error');
      btnGerarBoleto.disabled = false;
      btnGerarBoleto.innerHTML = '<span>Gerar Boleto</span>';
    }
  });

  btnCopiarBoleto.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(boletoLinhaEl.textContent);
      showToast('✓ Código de barras copiado!', 'success', 2000);
    } catch (e) {
      showToast('Não foi possível copiar automaticamente.', '', 2500);
    }
  });

  btnImprimirBoleto.addEventListener('click', () => window.print());

  btnSimularBoleto.addEventListener('click', async () => {
    if (!boletoCodigoAtual) return;
    btnSimularBoleto.disabled = true;
    btnSimularBoleto.innerHTML = '<span>Confirmando pagamento…</span>';

    setTimeout(async () => {
      try {
        const res = await fetch(`${API}/pagamento/boleto/${boletoCodigoAtual}/confirmar`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.erro || 'Erro ao confirmar pagamento.', 'error');
          btnSimularBoleto.disabled = false;
          btnSimularBoleto.innerHTML = '<span>Simular pagamento do boleto</span>';
          return;
        }
        mostrarSucesso();
      } catch (err) {
        console.error(err);
        showToast('Erro de conexão ao confirmar pagamento.', 'error');
        btnSimularBoleto.disabled = false;
        btnSimularBoleto.innerHTML = '<span>Simular pagamento do boleto</span>';
      }
    }, 1200);
  });

})();
