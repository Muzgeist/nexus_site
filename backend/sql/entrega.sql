DROP DATABASE IF EXISTS entrega;

CREATE DATABASE IF NOT EXISTS entrega;
USE entrega;
CREATE TABLE compra(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(250) NOT NULL,
    email VARCHAR (100) NOT NULL UNIQUE,
    cpf_cnpj VARCHAR(14) NOT NULL UNIQUE,
    telefone CHAR (12) UNIQUE,
    endereco VARCHAR(250),
    produto VARCHAR(250) NOT NULL,
    quantidade CHAR(250) NOT NULL
);

SELECT 
    nome,
    email,
    cpf_cnpj,
    telefone,
    endereco,
    produto,
    quantidade
FROM
    compra;