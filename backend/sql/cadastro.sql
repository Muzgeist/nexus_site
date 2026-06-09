DROP DATABASE IF EXISTS cadastro;
CREATE DATABASE IF NOT EXISTS cadastro;
USE cadastro;

CREATE TABLE usuario (
    id          INT           PRIMARY KEY AUTO_INCREMENT,
    nome        VARCHAR(250)  NOT NULL,
    email       VARCHAR(100)  NOT NULL UNIQUE,
    cpf_cnpj    VARCHAR(14)   NOT NULL UNIQUE,
    telefone    CHAR(15)      UNIQUE,
    endereco    VARCHAR(250),
    imagem      VARCHAR(250),
    senha       VARCHAR(255)  NOT NULL,
    ativo       TINYINT(1)    NOT NULL DEFAULT 1,
    criado_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
