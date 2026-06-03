DROP DATABASE IF EXISTS estoque;
CREATE DATABASE IF NOT EXISTS estoque;
USE estoque;

CREATE TABLE produtos (
    id               INT            PRIMARY KEY AUTO_INCREMENT,
    produto          VARCHAR(300)   NOT NULL,
    descricao        TEXT,
    quantidade       INT            NOT NULL DEFAULT 0,
    valor_unitario   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    custo_unitario   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    ativo            TINYINT(1)     NOT NULL DEFAULT 1,
    criado_em        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE historico_estoque (
    id              INT            PRIMARY KEY AUTO_INCREMENT,
    produto_id      INT            NOT NULL,
    tipo_movimento  ENUM('ENTRADA','SAIDA','AJUSTE') NOT NULL,
    quantidade      INT            NOT NULL,
    quantidade_anterior INT        NOT NULL,
    quantidade_nova     INT        NOT NULL,
    motivo          VARCHAR(300),
    referencia_id   INT,
    registrado_em   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_hist_produto FOREIGN KEY (produto_id)
        REFERENCES produtos(id) ON DELETE RESTRICT ON UPDATE CASCADE
);


CREATE OR REPLACE VIEW vw_estoque_resumo AS
    SELECT
        id,
        produto,
        descricao,
        quantidade,
        valor_unitario,
        custo_unitario,
        ativo,
        atualizado_em
    FROM produtos
    WHERE ativo = 1;

