# Nexus Imports — Pagamento Real + Pedidos/Rastreio (changelog desta sessão)

## ✅ O que foi implementado

### 1. Tela de Pagamento (`telapagamento.html` / `.css` / `.js`) — NOVA
Tela única de checkout acionada por **qualquer** botão de compra do site:
- `telacarrinho.html`: "Comprar" (individual em cada card), "Comprar Selecionados", "Comprar Tudo" e "Finalizar Pedido".
- `telaproduto.html`: "Comprar agora".

Cada botão grava em `sessionStorage` a chave `pedidoPendente` com os itens e valores
corretos referentes àquele clique específico, e redireciona para `telapagamento.html`,
que lê esse valor e monta o resumo do pedido automaticamente.

Formas de pagamento implementadas:
- **Pix**: gera QR Code real (padrão BR Code/EMV do Bacen) + "Copia e Cola", com CRC16
  calculado corretamente. Confirmação por botão de simulação (ver seção "Limitações").
- **Cartão de Crédito/Débito**: formulário com validação de bandeira, algoritmo de Luhn,
  validade e CVV. Parcelamento (1x a 12x) disponível para crédito. **Nenhum número
  completo de cartão ou CVV é enviado ao backend** — apenas bandeira, últimos 4 dígitos
  e nome do titular, só para exibição no histórico.
- **Boleto**: gera linha digitável (layout correto, 47 dígitos) e vencimento em 3 dias,
  com botão de simulação de pagamento.

### 2. Tela de Rastreio (`telarastreio.html` / `.css` / `.js`) — NOVA
Acessada pelo botão **"Rastrear Envio"** em cada pedido na tela de Pedidos.
- Desenha o **trajeto real no Google Maps** (Directions API) entre um centro de
  distribuição fixo (Contagem, MG) e o endereço de entrega do cliente (geocodificado
  com a Geocoding API).
- Marcador do pacote posicionado ao longo da rota de acordo com o progresso estimado
  (calculado a partir do status do pedido e das datas).
- Stepper visual com as 4 etapas: Aguardando Pagamento → Em Separação → Em Trânsito → Entregue.
- Se a chave do Google Maps não estiver configurada, mostra um aviso explicando o que falta
  (não tenta carregar um mapa quebrado).

### 3. Tela de Pedidos (antiga "Compras") — RENOMEADA + RECONSTRUÍDA
- Todas as ocorrências visíveis de "Compras"/"Minhas Compras" no site foram renomeadas
  para "Pedidos"/"Meus Pedidos" (menu hamburguer em todas as páginas, card na home,
  título da aba do navegador, `<h1>` da própria página).
- A tela agora **busca os pedidos reais do backend** (`GET /compras/:usuario_id`) em vez
  de mostrar cards de exemplo fixos.
- Cada pedido exibe a forma de pagamento usada (Pix / Crédito Nx / Débito / Boleto).
- Botão **"Rastrear Envio"** adicionado em cada pedido (habilitado apenas quando o
  pagamento já foi confirmado).
- Cancelamento de pedido passou a chamar a API real (`PUT /compra/:id/cancelar`)
  em vez de só mudar a aparência do card localmente.

### 4. Carrinho — conectado ao carrinho real
A tela de carrinho carregava sempre 3 produtos de exemplo fixos no HTML. Agora ela lê o
carrinho real salvo pela tela de produto (`sessionStorage: 'carrinho'`), permitindo que
os botões de compra calculem o valor certo.

### 5. Backend (`Backend/server.js`)
Novas rotas, sem alterar nenhuma rota existente:
- `POST /pagamento/pix` — gera cobrança Pix
- `POST /pagamento/pix/:txid/confirmar` — confirma pagamento Pix (simulação)
- `POST /pagamento/cartao` — processa cartão de crédito/débito (simulação)
- `POST /pagamento/boleto` — gera boleto
- `POST /pagamento/boleto/:codigo/confirmar` — confirma pagamento de boleto (simulação)
- `GET /pedido/:id/rastreio` — retorna dados de rastreio para o mapa

Novo arquivo `Backend/utils/pagamentos.js` com o gerador de payload Pix (EMV/CRC16) e
gerador de código de boleto de demonstração.

### 6. Banco de dados
Nova migração: `Backend/sql/migracao_pagamento_rastreio.sql` — adiciona à tabela `compra`
as colunas `forma_pagamento`, `parcelas`, `pix_txid`, `boleto_codigo`, `boleto_vencimento`.
**Rode esse script depois do `Banco.sql` original**, no mesmo banco.

---

## ⚠️ Limitações importantes (leia antes de ir para produção)

Isto é um e-commerce de demonstração — os 3 pontos abaixo são exatamente onde qualquer
integração de pagamento real precisa de um provedor externo, que eu não posso configurar
por você (exige cadastro/conta bancária/contrato comercial):

1. **Pix**: o QR Code gerado segue o padrão oficial do Bacen e é estruturalmente correto,
   mas usa uma chave Pix de exemplo (`PIX_KEY` no `.env`). Para receber pagamentos de
   verdade, troque pela chave Pix real da conta da loja **e** conecte um PSP
   (Mercado Pago, PagSeguro/PagBank, Gerencianet/Efí, Asaas etc.) que avise seu backend
   via webhook quando o pagamento realmente acontecer — hoje a confirmação é feita por um
   botão de simulação na própria tela ("Já paguei").

2. **Cartão**: a aprovação é simulada localmente. Em produção, os dados do cartão **nunca**
   devem passar pelo seu próprio servidor — você precisa de um gateway de pagamento
   (Stripe, Mercado Pago, Pagar.me etc.) cujo SDK de frontend tokeniza o cartão direto no
   navegador do cliente.

3. **Boleto**: a linha digitável é gerada apenas para fins de layout/demonstração — não é
   um boleto bancário válido. Emitir boletos reais exige convênio de cobrança com um banco
   ou um PSP de boletos.

4. **Mapa do rastreio**: precisa de uma chave de API do Google Maps (Maps JavaScript API +
   Geocoding API). Configure em `frontend/js/nexus-config.js` →
   `window.NEXUS_GOOGLE_MAPS_KEY`. Instruções completas estão como comentário no próprio
   arquivo.

---

## 🧪 Como testar localmente

```bash
# 1. Rodar a migração SQL (depois do Banco.sql original)
mysql -u root -p Banco < Backend/sql/migracao_pagamento_rastreio.sql

# 2. Configurar variáveis de ambiente
cp Backend/.env.example Backend/.env
# edite Backend/.env com sua senha de banco e (opcional) sua chave Pix real

# 3. Instalar dependências e subir o backend (sem novas dependências adicionadas)
cd Backend
npm install
node server.js

# 4. Abrir o frontend (telaprincipal.html) e testar o fluxo:
#    Produto → Comprar agora → telapagamento.html → escolher Pix/Cartão/Boleto
#    Carrinho → Comprar Tudo/Selecionados/individual → telapagamento.html
#    Pedidos → Rastrear Envio → telarastreio.html (mapa real, se a chave estiver configurada)
```

## 📂 Arquivos novos
```
Backend/utils/pagamentos.js
Backend/sql/migracao_pagamento_rastreio.sql
Backend/.env.example
frontend/html/telapagamento.html
frontend/css/telapagamento.css
frontend/js/telapagamento.js
frontend/html/telarastreio.html
frontend/css/telarastreio.css
frontend/js/telarastreio.js
frontend/js/nexus-config.js
```

## 📂 Arquivos modificados
```
Backend/server.js                  (+ rotas de pagamento e rastreio)
frontend/html/telacompras.html     (renomeado para "Pedidos" + lista dinâmica)
frontend/js/telacompras.js         (reescrito: busca real + rastreio + cancelamento via API)
frontend/css/telacompras.css       (+ estilos novos)
frontend/html/telacarrinho.html    (cards de exemplo removidos, "Pedidos" no menu)
frontend/js/telacarrinho.js        (reescrito: carrinho real + redirecionamento p/ pagamento)
frontend/css/telacarrinho.css      (+ estilos novos)
frontend/html/telaproduto.html     ("Pedidos" no menu)
frontend/js/telaproduto.js         (botão Comprar agora redireciona p/ pagamento)
frontend/html/telaprincipal.html   (card "Meus Pedidos", "Pedidos" no menu)
frontend/html/telausuario.html     ("Pedidos" no menu)
frontend/html/telaprodutos.html    ("Pedidos" no menu)
```
