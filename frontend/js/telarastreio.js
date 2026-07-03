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

  /* ── 5. MAPA (Google Maps JS API) ─────────────── */
  function iniciarMapa(d) {
    const chave = window.NEXUS_GOOGLE_MAPS_KEY;
    if (!chave) {
      document.getElementById('mapaConfigAviso').style.display = 'flex';
      return;
    }

    window.__nexusInitMap = () => desenharMapa(d);

    if (window.google && window.google.maps) {
      desenharMapa(d);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(chave)}&callback=__nexusInitMap`;
    script.async = true;
    script.onerror = () => {
      document.getElementById('mapaConfigAviso').style.display = 'flex';
      document.querySelector('#mapaConfigAviso h3').textContent = 'Não foi possível carregar o Google Maps';
      document.querySelector('#mapaConfigAviso p').textContent = 'Verifique sua chave de API, a conexão com a internet e se as APIs necessárias estão ativadas no Google Cloud Console.';
    };
    document.head.appendChild(script);
  }

  // Estilo customizado do mapa (tons escuros/roxo, alinhado à identidade visual)
  const MAPA_ESTILO_ESCURO = [
    { elementType: 'geometry', stylers: [{ color: '#150022' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#150022' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#c4a8e8' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3d1a66' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#23003d' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1c0033' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d0050' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a0030' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#5c00b3' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2d0050' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2d0050' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0018' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5c3a8f' }] }
  ];

  function iconeSvg(corFundo, corBorda, path, tamanho) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="${corFundo}" stroke="${corBorda}" stroke-width="1.5"/>
        <g transform="translate(5,5) scale(0.58)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</g>
      </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function desenharMapa(d) {
    const origemLatLng = { lat: d.origem.lat, lng: d.origem.lng };

    const map = new google.maps.Map(document.getElementById('mapaRastreio'), {
      center: origemLatLng,
      zoom: 11,
      styles: MAPA_ESTILO_ESCURO,
      disableDefaultUI: true,
      zoomControl: true,
      fullscreenControl: true
    });

    // Marcador do armazém (origem) — sempre exibido
    new google.maps.Marker({
      position: origemLatLng,
      map,
      title: d.origem.nome,
      icon: {
        url: iconeSvg('#5c00b3', '#bb86fc',
          '<path d="M3 9l9-6 9 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21V12h6v9"/>', 32),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }
    });

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: d.destino_endereco + ', Brasil' }, (results, status) => {
      if (status !== 'OK' || !results[0]) {
        document.getElementById('mapaGeocodeAviso').style.display = 'flex';
        return;
      }

      const destinoLatLng = results[0].geometry.location;

      new google.maps.Marker({
        position: destinoLatLng,
        map,
        title: 'Endereço de entrega',
        icon: {
          url: iconeSvg('#e040fb', '#f570ff',
            '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', 32),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#e040fb', strokeOpacity: 0.85, strokeWeight: 4 }
      });

      directionsService.route({
        origin: origemLatLng,
        destination: destinoLatLng,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, statusRota) => {
        if (statusRota !== 'OK') {
          // Sem rota rodoviária encontrada — mantém os marcadores e ajusta o zoom
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(origemLatLng);
          bounds.extend(destinoLatLng);
          map.fitBounds(bounds, 60);
          return;
        }

        directionsRenderer.setDirections(result);

        const path = result.routes[0].overview_path;
        const indice = Math.min(
          path.length - 1,
          Math.max(0, Math.round((d.progresso_pct / 100) * (path.length - 1)))
        );
        const posicaoAtual = path[indice];

        // Marcador do pacote na posição atual do trajeto
        new google.maps.Marker({
          position: posicaoAtual,
          map,
          title: `Pacote — ${d.progresso_pct}% do trajeto`,
          icon: {
            url: iconeSvg('#7c00e0', '#ffffff',
              '<rect x="2" y="7" width="14" height="10" rx="1"/><path d="M16 10h3l3 3v4h-6z"/><circle cx="6.5" cy="19.5" r="1.5"/><circle cx="17.5" cy="19.5" r="1.5"/>', 38),
            scaledSize: new google.maps.Size(38, 38),
            anchor: new google.maps.Point(19, 19)
          },
          zIndex: 999,
          animation: google.maps.Animation.DROP
        });

        const bounds = new google.maps.LatLngBounds();
        path.forEach(p => bounds.extend(p));
        map.fitBounds(bounds, 60);
      });
    });
  }

})();
