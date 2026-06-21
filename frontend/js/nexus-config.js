/* ============================================================
   NEXUS IMPORTS — Configuração do Frontend
   ============================================================
   Preencha NEXUS_GOOGLE_MAPS_KEY com sua chave de API do Google Maps
   para ativar o mapa real na tela de rastreio (telarastreio.html).

   Como obter a chave:
   1. Acesse https://console.cloud.google.com/google/maps-apis
   2. Crie um projeto (ou use um existente) e ative as APIs:
        - "Maps JavaScript API"
        - "Geocoding API"
   3. Crie uma credencial do tipo "Chave de API".
   4. (Recomendado) Restrinja a chave por domínio/referenciador HTTP
      para o(s) endereço(s) onde o site será publicado.
   5. Cole a chave abaixo, entre as aspas.

   Sem essa chave configurada, a tela de rastreio mostra uma
   mensagem explicando o que falta — ela não tenta carregar um
   mapa quebrado.
   ============================================================ */

window.NEXUS_GOOGLE_MAPS_KEY = '';

// Coordenadas do centro de distribuição (deve bater com ARMAZEM_ORIGEM
// definido no Backend/server.js — usado só como reforço visual local).
window.NEXUS_ARMAZEM = {
  nome: 'Centro de Distribuição Nexus Imports — Contagem, MG',
  lat: -19.9317,
  lng: -44.0536
};
