-- ============================================================
-- NEXUS IMPORTS — Migração: Pagamentos (Pix/Cartão/Boleto) + Rastreio
-- Execute este script depois do Banco.sql original, no mesmo banco.
-- Uso:  mysql -u root -p Banco < Backend/sql/migracao_pagamento_rastreio.sql
-- ============================================================

USE Banco;

-- ── Novas colunas em `compra` para registrar a forma de pagamento ──
ALTER TABLE compra
  ADD COLUMN forma_pagamento   ENUM('PIX','CREDITO','DEBITO','BOLETO') DEFAULT NULL AFTER valor_pago,
  ADD COLUMN parcelas          INT NOT NULL DEFAULT 1                  AFTER forma_pagamento,
  ADD COLUMN pix_txid          VARCHAR(64) DEFAULT NULL                AFTER parcelas,
  ADD COLUMN boleto_codigo     VARCHAR(64) DEFAULT NULL                AFTER pix_txid,
  ADD COLUMN boleto_vencimento DATE DEFAULT NULL                       AFTER boleto_codigo;

-- Índices para localizar rapidamente todas as linhas de um mesmo
-- "pedido" pago via Pix ou Boleto (um carrinho pode gerar várias
-- linhas em `compra`, uma por produto, todas com o mesmo txid/código).
ALTER TABLE compra
  ADD INDEX idx_pix_txid (pix_txid),
  ADD INDEX idx_boleto_codigo (boleto_codigo);

SELECT '✅ Migração de pagamentos aplicada com sucesso!' AS resultado;
