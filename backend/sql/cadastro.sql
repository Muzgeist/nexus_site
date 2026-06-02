DROP DATABASE IF EXISTS cadastro;

CREATE DATABASE IF NOT EXISTS cadastro;
USE  cadastro;
CREATE TABLE usuario(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(250) NOT NULL,
    email VARCHAR (100) NOT NULL UNIQUE,
    cpf_cnpj  VARCHAR(14) NOT NULL UNIQUE,
    telefone CHAR (12) UNIQUE,
    endereco VARCHAR(250),
    imagem VARCHAR(250),
    senha CHAR (20) NOT NULL UNIQUE
);

SELECT 
    nome,
    email,
    cpf_cnpj,
    telefone,
    endereco,
    imagem,
    senha
FROM
    usuario;