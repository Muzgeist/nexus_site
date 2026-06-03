DROP DATABASE IF EXISTS entrega;
CREATE DATABASE IF NOT EXISTS entrega;
USE entrega;

CREATE TABLE compra (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id        INT            NOT NULL,
    nome              VARCHAR(250)   NOT NULL,
    email             VARCHAR(100)   NOT NULL,
    cpf_cnpj          VARCHAR(14)    NOT NULL,
    telefone          CHAR(12),
    endereco_entrega  VARCHAR(250)   NOT NULL,
    produto_id        INT            NOT NULL,
    produto           VARCHAR(300)   NOT NULL,
    quantidade        INT            NOT NULL DEFAULT 1,
    valor_unitario    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    valor_total       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    valor_pago        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    status_pagamento  ENUM('PENDENTE','PAGO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    pago_em           DATETIME,
    status_entrega    ENUM('AGUARDANDO','PREPARANDO','ENVIADO','ENTREGUE','CANCELADO')
                      NOT NULL DEFAULT 'AGUARDANDO',
    entregue_em       DATETIME,
    criado_em         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- TRIGGER: calcula valor_total automaticamente ao inserir
-- -------------------------------------------------------
DELIMITER $$
CREATE TRIGGER calcula_total
BEFORE INSERT ON compra
FOR EACH ROW
BEGIN
    SET NEW.valor_total = NEW.quantidade * NEW.valor_unitario;
END$$

-- TRIGGER: recalcula valor_total ao atualizar quantidade/valor
CREATE TRIGGER trg_calcula_total
BEFORE UPDATE ON compra
FOR EACH ROW
BEGIN
    SET NEW.valor_total = NEW.quantidade * NEW.valor_unitario;
END$$

-- -------------------------------------------------------
-- TRIGGER: quando pagamento for confirmado (PAGO)
--   1. Registra data/hora do pagamento
--   2. Muda status_entrega para PREPARANDO
--   3. Dá baixa no estoque (via tabela historico_estoque)
--      *** A aplicação deve chamar a stored procedure abaixo ***
-- -------------------------------------------------------
CREATE TRIGGER pagamento_confirmado
BEFORE UPDATE ON compra
FOR EACH ROW
BEGIN
    -- Detecta mudança de status para PAGO
    IF NEW.status_pagamento = 'PAGO' AND OLD.status_pagamento <> 'PAGO' THEN
        SET NEW.pago_em = NOW();
        SET NEW.status_entrega = 'PREPARANDO';
    END IF;

    -- Detecta confirmação de entrega
    IF NEW.status_entrega = 'ENTREGUE' AND OLD.status_entrega <> 'ENTREGUE' THEN
        SET NEW.entregue_em = NOW();
    END IF;
END$$
DELIMITER ;

-- -------------------------------------------------------
-- STORED PROCEDURE: dar baixa no estoque ao confirmar pagamento
-- Chamar na aplicação após confirmar pagamento:
--   CALL entrega.sp_baixa_estoque(compra_id);
-- -------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_baixa_estoque(IN p_compra_id INT)
BEGIN
    DECLARE v_produto_id  INT;
    DECLARE v_quantidade  INT;
    DECLARE v_produto     VARCHAR(300);
    DECLARE v_qtd_atual   INT;

    -- Busca os dados da compra
    SELECT produto_id, quantidade, produto
    INTO v_produto_id, v_quantidade, v_produto
    FROM compra
    WHERE id = p_compra_id AND status_pagamento = 'PAGO';

    -- Verifica se encontrou e tem estoque suficiente
    -- (a verificação real de estoque deve vir do banco estoque via aplicação)
    -- Aqui registramos o movimento no histórico interno de referência:
    INSERT INTO estoque_referencia (produto_id, compra_id, quantidade_baixada, registrado_em)
    VALUES (v_produto_id, p_compra_id, v_quantidade, NOW());
END$$
DELIMITER ;

-- Tabela auxiliar de referência de baixas (a baixa real ocorre no banco estoque)
CREATE TABLE estoque_referencia (
    id                INT       PRIMARY KEY AUTO_INCREMENT,
    produto_id        INT       NOT NULL,
    compra_id         INT       NOT NULL,
    quantidade_baixada INT      NOT NULL,
    registrado_em     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ref_compra FOREIGN KEY (compra_id)
        REFERENCES compra(id) ON DELETE CASCADE
);

-- Views úteis
CREATE OR REPLACE VIEW vw_pedidos_pendentes_preparo AS
    SELECT
        id,
        nome,
        telefone,
        endereco_entrega,
        produto,
        quantidade,
        valor_total,
        valor_pago,
        pago_em,
        status_entrega
    FROM compra
    WHERE status_pagamento = 'PAGO'
      AND status_entrega = 'PREPARANDO'
    ORDER BY pago_em ASC;

CREATE OR REPLACE VIEW vw_historico_pedidos AS
    SELECT
        id,
        nome,
        email,
        produto,
        quantidade,
        valor_unitario,
        valor_total,
        valor_pago,
        status_pagamento,
        status_entrega,
        pago_em,
        entregue_em,
        criado_em
    FROM compra
    ORDER BY criado_em DESC;
