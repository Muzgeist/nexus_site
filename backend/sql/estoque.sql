DROP DATABASE IF EXISTS estoque;

CREATE DATABASE IF NOT EXISTS estoque;
USE estoque;
CREATE TABLE produtos(
    id INT PRIMARY KEY AUTO_INCREMENT,
    produto VARCHAR(300) NOT NULL,
    quantidade INT
);

SELECT 
   produto,
   quantidade
FROM
    produtos;