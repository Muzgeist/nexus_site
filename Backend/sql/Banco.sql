-- Active: 1779825838040@@127.0.0.1@3306@banco
-- ============================================================
-- NEXUS IMPORTS — SCRIPT COMPLETO E TESTADO
-- Junta Banco.sql + migracao_pagamento_rastreio.sql em um único
-- arquivo, na ordem certa, para deixar o banco compatível com
-- o restante do código (server.js).
-- ATENÇÃO: este script roda 'DROP DATABASE IF EXISTS Banco;' —
-- ele recria o banco do zero. Use apenas em instalação nova.
-- ============================================================

-- Active: 1770140830677@@127.0.0.1@3306@banco
git 
DROP DATABASE IF EXISTS Banco;
CREATE DATABASE IF NOT EXISTS Banco;
USE Banco;

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
-- ESTOQUE



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

-- ============================================================
-- NEXUS TECH - SCRIPT DE PRODUTOS COM IMAGENS
-- Adiciona coluna imagem_url e popula o estoque completo
-- ============================================================
 
USE Banco;
 
-- Adiciona coluna de imagem se não existir
ALTER TABLE produtos
  ADD COLUMN imagem_url VARCHAR(500) DEFAULT NULL AFTER descricao,
  ADD COLUMN  categoria  VARCHAR(100) DEFAULT NULL AFTER imagem_url,
  ADD COLUMN marca      VARCHAR(100) DEFAULT NULL AFTER categoria;
 
-- ============================================================
-- PROCESSADORES - INTEL
-- ============================================================
INSERT INTO produtos (produto, descricao, imagem_url, categoria, marca, quantidade, valor_unitario, custo_unitario) VALUES
('Intel Core i3-12100F', 'Processador Intel Core i3-12100F, 4 núcleos, 8 threads, 3.3GHz base / 4.3GHz turbo, socket LGA1700, 12MB cache L3, sem GPU integrada', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80', 'Processadores', 'Intel', 30, 549.90, 380.00),
('Intel Core i5-12400F', 'Processador Intel Core i5-12400F, 6 núcleos, 12 threads, 2.5GHz base / 4.4GHz turbo, socket LGA1700, 18MB cache L3, sem GPU integrada', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80', 'Processadores', 'Intel', 25, 899.90, 640.00),
('Intel Core i5-13600K', 'Processador Intel Core i5-13600K, 14 núcleos (6P+8E), 20 threads, 3.5GHz base / 5.1GHz turbo, socket LGA1700, 24MB cache L3, desbloqueado', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80', 'Processadores', 'Intel', 20, 1599.90, 1150.00),
('Intel Core i7-13700K', 'Processador Intel Core i7-13700K, 16 núcleos (8P+8E), 24 threads, 3.4GHz base / 5.4GHz turbo, socket LGA1700, 30MB cache L3, desbloqueado', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80', 'Processadores', 'Intel', 15, 2299.90, 1700.00),
('Intel Core i9-13900K', 'Processador Intel Core i9-13900K, 24 núcleos (8P+16E), 32 threads, 3.0GHz base / 5.8GHz turbo, socket LGA1700, 36MB cache L3, desbloqueado - Top de linha', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80', 'Processadores', 'Intel', 10, 3799.90, 2900.00),
('Intel Xeon E-2388G', 'Processador Intel Xeon E-2388G, 8 núcleos, 16 threads, 3.2GHz base / 5.1GHz turbo, socket LGA1200, 16MB cache L3, para servidores workstation', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80', 'Processadores', 'Intel', 8, 4299.90, 3200.00),
('AMD Ryzen 3 4100', 'Processador AMD Ryzen 3 4100, 4 núcleos, 8 threads, 3.8GHz base / 4.0GHz turbo, socket AM4, 6MB cache L3, ótimo custo-benefício', 'https://images.unsplash.com/photo-1555617778-02518510b9a3?w=400&q=80', 'Processadores', 'AMD', 35, 499.90, 340.00),
('AMD Ryzen 5 5600X', 'Processador AMD Ryzen 5 5600X, 6 núcleos, 12 threads, 3.7GHz base / 4.6GHz turbo, socket AM4, 35MB cache total, Zen 3', 'https://images.unsplash.com/photo-1555617778-02518510b9a3?w=400&q=80', 'Processadores', 'AMD', 30, 999.90, 720.00),
('AMD Ryzen 7 5800X3D', 'Processador AMD Ryzen 7 5800X3D, 8 núcleos, 16 threads, 3.4GHz base / 4.5GHz turbo, socket AM4, 100MB cache 3D V-Cache, melhor gaming AM4', 'https://images.unsplash.com/photo-1555617778-02518510b9a3?w=400&q=80', 'Processadores', 'AMD', 12, 1899.90, 1400.00),
('AMD Ryzen 9 7900X', 'Processador AMD Ryzen 9 7900X, 12 núcleos, 24 threads, 4.7GHz base / 5.6GHz turbo, socket AM5, 76MB cache total, Zen 4', 'https://images.unsplash.com/photo-1555617778-02518510b9a3?w=400&q=80', 'Processadores', 'AMD', 10, 2899.90, 2200.00),
('AMD Ryzen 9 7950X', 'Processador AMD Ryzen 9 7950X, 16 núcleos, 32 threads, 4.5GHz base / 5.7GHz turbo, socket AM5, 80MB cache total, Zen 4, melhor multi-thread consumer', 'https://images.unsplash.com/photo-1555617778-02518510b9a3?w=400&q=80', 'Processadores', 'AMD', 8, 4299.90, 3300.00),
('AMD Threadripper PRO 5975WX', 'Processador AMD Threadripper PRO 5975WX, 32 núcleos, 64 threads, 3.6GHz base / 4.5GHz turbo, socket sWRX8, 256MB cache total, workstation profissional', 'https://images.unsplash.com/photo-1555617778-02518510b9a3?w=400&q=80', 'Processadores', 'AMD', 4, 14999.90, 11500.00),
('AMD EPYC 7543', 'Processador AMD EPYC 7543, 32 núcleos, 64 threads, 2.8GHz base / 3.7GHz turbo, socket SP3, 256MB cache total, para servidores enterprise', 'https://images.unsplash.com/photo-1555617778-02518510b9a3?w=400&q=80', 'Processadores', 'AMD', 3, 19999.90, 15000.00),
('ASUS GeForce RTX 4060 Dual OC 8GB', 'Placa de vídeo ASUS Dual GeForce RTX 4060 OC Edition 8GB GDDR6, 128-bit, boost 2565MHz, DLSS 3, Ray Tracing, Ada Lovelace', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'ASUS', 20, 2299.90, 1750.00),
('MSI GeForce RTX 4070 Gaming X Trio 12GB', 'Placa de vídeo MSI GeForce RTX 4070 Gaming X Trio 12GB GDDR6X, 192-bit, boost 2610MHz, DLSS 3, Ray Tracing, RGB Mystic Light', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'MSI', 15, 3899.90, 3000.00),
('Gigabyte GeForce RTX 4070 Ti Super Aorus Master 16GB', 'Placa de vídeo Gigabyte Aorus RTX 4070 Ti Super 16GB GDDR6X, 256-bit, boost 2670MHz, DLSS 3.5, cooler triplo WindForce', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'Gigabyte', 10, 5499.90, 4200.00),
('Zotac GeForce RTX 4080 Super AMP Extreme 16GB', 'Placa de vídeo Zotac Gaming RTX 4080 Super AMP Extreme 16GB GDDR6X, 256-bit, boost 2595MHz, DLSS 3.5, design premium', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'Zotac', 8, 7999.90, 6200.00),
('GALAX GeForce RTX 4090 HOF Pro 24GB', 'Placa de vídeo GALAX RTX 4090 Hall of Fame Pro 24GB GDDR6X, 384-bit, boost 2580MHz, DLSS 3.5, top de linha', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'GALAX', 5, 16999.90, 13000.00),
('PNY GeForce RTX 4060 Ti XLR8 16GB', 'Placa de vídeo PNY XLR8 Gaming Verto RTX 4060 Ti 16GB GDDR6, 128-bit, boost 2580MHz, DLSS 3, ótimo custo-benefício 1080p/1440p', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'PNY', 18, 2899.90, 2200.00),
('PNY NVIDIA RTX A4000 16GB', 'Placa de vídeo profissional NVIDIA RTX A4000 16GB GDDR6, ECC, 448GB/s, 6144 CUDA Cores, para workstation CAD/3D/IA', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'PNY', 6, 14999.90, 11500.00),
('ASUS Radeon RX 7600 Dual OC 8GB', 'Placa de vídeo ASUS Dual Radeon RX 7600 OC 8GB GDDR6, 128-bit, boost 2755MHz, FSR 3, excelente para 1080p gaming', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'ASUS', 22, 1999.90, 1500.00),
('MSI Radeon RX 7700 XT Gaming Trio 12GB', 'Placa de vídeo MSI Radeon RX 7700 XT Gaming Trio 12GB GDDR6, 192-bit, boost 2599MHz, FSR 3, ideal para 1440p', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'MSI', 14, 2799.90, 2100.00),
('Gigabyte Radeon RX 7900 XTX Aorus 24GB', 'Placa de vídeo Gigabyte Aorus Radeon RX 7900 XTX 24GB GDDR6, 384-bit, boost 2615MHz, FSR 3, top de linha AMD', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', 'Placas de Vídeo', 'Gigabyte', 7, 7499.90, 5800.00),
('ASUS ROG Strix B660-F Gaming WiFi', 'Placa-mãe ASUS ROG Strix B660-F Gaming WiFi, socket LGA1700, DDR5, WiFi 6, PCIe 5.0, 2.5G LAN, RGB', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'ASUS', 15, 1299.90, 950.00),
('ASUS TUF Gaming Z790-Plus WiFi', 'Placa-mãe ASUS TUF Gaming Z790-Plus WiFi, socket LGA1700, DDR5, WiFi 6E, PCIe 5.0, USB 3.2 Gen 2x2, militar grade', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'ASUS', 12, 1899.90, 1400.00),
('MSI MAG B650 Tomahawk WiFi', 'Placa-mãe MSI MAG B650 Tomahawk WiFi, socket AM5, DDR5, WiFi 6E, PCIe 5.0 para M.2, 2.5G LAN', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'MSI', 18, 1499.90, 1100.00),
('MSI MEG X670E Ace', 'Placa-mãe MSI MEG X670E Ace, socket AM5, DDR5, WiFi 6E, PCIe 5.0, 10G LAN, para Ryzen 7000 flagship', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'MSI', 6, 3599.90, 2700.00),
('Gigabyte B660M DS3H AX DDR4', 'Placa-mãe Gigabyte B660M DS3H AX DDR4, socket LGA1700, micro-ATX, WiFi 6, PCIe 4.0, ótimo custo-benefício', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'Gigabyte', 25, 699.90, 500.00),
('Gigabyte Z790 Aorus Master', 'Placa-mãe Gigabyte Z790 Aorus Master, socket LGA1700, DDR5, WiFi 6E, Thunderbolt 4, 10G LAN, flagship', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'Gigabyte', 8, 3299.90, 2500.00),
('ASRock B550M Pro4', 'Placa-mãe ASRock B550M Pro4, socket AM4, DDR4, micro-ATX, PCIe 4.0, USB 3.2, ótima para Ryzen 5000', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'ASRock', 20, 599.90, 420.00),
('Biostar B660MX-E Pro', 'Placa-mãe Biostar B660MX-E Pro, socket LGA1700, DDR4, micro-ATX, PCIe 4.0, opção econômica', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'Biostar', 15, 499.90, 350.00),
('Colorful CVN B660M Gaming Pro V20', 'Placa-mãe Colorful CVN B660M Gaming Pro V20, socket LGA1700, DDR4, micro-ATX, iluminação RGB', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', 'Placas-Mãe', 'Colorful', 12, 549.90, 380.00),
('Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz', 'Kit memória RAM Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz CL16, compatível com Intel XMP e AMD Expo, heatspreader preto', 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', 'Memória RAM', 'Kingston', 40, 329.90, 230.00),
('Kingston Fury Beast DDR5 32GB (2x16GB) 5200MHz', 'Kit memória RAM Kingston Fury Beast DDR5 32GB (2x16GB) 5200MHz CL40, XMP 3.0, próxima geração', 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', 'Memória RAM', 'Kingston', 25, 699.90, 510.00),
('Corsair Vengeance LPX DDR4 32GB (2x16GB) 3600MHz', 'Kit memória RAM Corsair Vengeance LPX DDR4 32GB (2x16GB) 3600MHz CL18, perfil low-profile, preto', 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', 'Memória RAM', 'Corsair', 30, 489.90, 340.00),
('Corsair Dominator Platinum RGB DDR5 64GB (2x32GB) 6000MHz', 'Kit memória RAM Corsair Dominator Platinum RGB DDR5 64GB (2x32GB) 6000MHz CL36, RGB icônico, premium', 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', 'Memória RAM', 'Corsair', 10, 1999.90, 1500.00),
('Crucial Ballistix DDR4 16GB (2x8GB) 3200MHz', 'Kit memória RAM Crucial Ballistix DDR4 16GB (2x8GB) 3200MHz CL16, ótimo custo-benefício, dissipador vermelho', 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', 'Memória RAM', 'Crucial', 35, 299.90, 210.00),
('G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) 6400MHz', 'Kit memória RAM G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) 6400MHz CL32, RGB premium, overclock extremo', 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', 'Memória RAM', 'G.Skill', 15, 1199.90, 880.00),
('ADATA XPG Lancer DDR5 32GB (2x16GB) 5200MHz', 'Kit memória RAM ADATA XPG Lancer DDR5 32GB (2x16GB) 5200MHz CL38, dissipador alumínio, RGB', 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', 'Memória RAM', 'ADATA', 20, 649.90, 470.00),
('TeamGroup T-Force Vulcan DDR4 16GB (2x8GB) 3200MHz', 'Kit memória RAM TeamGroup T-Force Vulcan DDR4 16GB (2x8GB) 3200MHz CL16, dissipador slim, vermelho', 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', 'Memória RAM', 'TeamGroup', 28, 289.90, 200.00),
('Kingston NV2 SSD NVMe M.2 1TB', 'SSD Kingston NV2 NVMe PCIe 4.0 M.2 2280 1TB, leitura até 3500 MB/s, gravação até 2100 MB/s, ideal para uso diário', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'Kingston', 45, 399.90, 270.00),
('Samsung 990 Pro NVMe M.2 1TB', 'SSD Samsung 990 Pro NVMe PCIe 4.0 M.2 2280 1TB, leitura até 7450 MB/s, gravação até 6900 MB/s, melhor performance gaming', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'Samsung', 30, 699.90, 510.00),
('Samsung 990 Pro NVMe M.2 2TB', 'SSD Samsung 990 Pro NVMe PCIe 4.0 M.2 2280 2TB, leitura até 7450 MB/s, gravação até 6900 MB/s, alta capacidade', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'Samsung', 20, 1199.90, 900.00),
('WD Black SN850X NVMe M.2 1TB', 'SSD Western Digital Black SN850X NVMe PCIe 4.0 M.2 2280 1TB, leitura até 7300 MB/s, gaming mode integrado', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'Western Digital', 25, 649.90, 470.00),
('Seagate FireCuda 530 NVMe M.2 2TB', 'SSD Seagate FireCuda 530 NVMe PCIe 4.0 M.2 2280 2TB, leitura até 7300 MB/s, heatsink incluso', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'Seagate', 18, 1099.90, 820.00),
('Crucial MX500 SATA SSD 1TB', 'SSD Crucial MX500 SATA 2.5" 1TB, leitura até 560 MB/s, gravação até 510 MB/s, ótimo upgrade para notebook', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'Crucial', 40, 349.90, 240.00),
('ADATA Legend 960 NVMe M.2 1TB', 'SSD ADATA Legend 960 NVMe PCIe 4.0 M.2 2280 1TB, leitura até 7400 MB/s, heatsink incluso', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'ADATA', 22, 429.90, 300.00),
('TeamGroup MP44 NVMe M.2 2TB', 'SSD TeamGroup MP44 NVMe PCIe 4.0 M.2 2280 2TB, leitura até 7400 MB/s, gravação até 7000 MB/s, alta capacidade', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'TeamGroup', 15, 899.90, 660.00),
('Seagate Barracuda 1TB 7200RPM', 'HD Seagate Barracuda 1TB 7200RPM SATA 6Gb/s 3.5", cache 64MB, ideal para armazenamento desktop', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'HDs', 'Seagate', 50, 249.90, 170.00),
('Seagate Barracuda 2TB 7200RPM', 'HD Seagate Barracuda 2TB 7200RPM SATA 6Gb/s 3.5", cache 256MB, excelente custo por GB', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'HDs', 'Seagate', 40, 399.90, 280.00),
('Seagate IronWolf NAS 4TB', 'HD Seagate IronWolf 4TB para NAS, 5400RPM, SATA 6Gb/s, otimizado para operação 24/7, suporte AgileArray', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'HDs', 'Seagate', 20, 699.90, 510.00),
('Western Digital Blue 2TB 7200RPM', 'HD Western Digital Blue 2TB 7200RPM SATA 6Gb/s 3.5", cache 256MB, confiabilidade premium', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'HDs', 'Western Digital', 35, 379.90, 265.00),
('WD Red Plus NAS 4TB', 'HD Western Digital Red Plus 4TB para NAS, 5400RPM, SATA 6Gb/s, NASware 3.0, 24/7 operation', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'HDs', 'Western Digital', 15, 749.90, 550.00),
('Toshiba P300 2TB 7200RPM', 'HD Toshiba P300 2TB 7200RPM SATA 6Gb/s 3.5", cache 128MB, alta performance desktop', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'HDs', 'Toshiba', 30, 359.90, 250.00),
('Cooler Master MasterBox TD500 Mesh V2', 'Gabinete Cooler Master MasterBox TD500 Mesh V2, Mid Tower ATX, painel mesh frontal, 3 fans RGB inclusos, vidro temperado lateral', 'https://images.unsplash.com/photo-1587831991001-be539967e94e?w=400&q=80', 'Gabinetes', 'Cooler Master', 20, 699.90, 490.00),
('Corsair 4000D Airflow', 'Gabinete Corsair 4000D Airflow, Mid Tower ATX, painel frontal mesh, 2 fans 120mm inclusos, excelente airflow', 'https://images.unsplash.com/photo-1587831991001-be539967e94e?w=400&q=80', 'Gabinetes', 'Corsair', 18, 749.90, 530.00),
('NZXT H7 Flow', 'Gabinete NZXT H7 Flow, Mid Tower ATX, design minimalista, 3 fans 120mm inclusos, vidro temperado, excelente ventilação', 'https://images.unsplash.com/photo-1587831991001-be539967e94e?w=400&q=80', 'Gabinetes', 'NZXT', 15, 1199.90, 880.00),
('Lian Li PC-O11D Evo', 'Gabinete Lian Li PC-O11D Evo, Mid/Full Tower ATX, dual-chamber, 3 lados de vidro temperado, premium build quality', 'https://images.unsplash.com/photo-1587831991001-be539967e94e?w=400&q=80', 'Gabinetes', 'Lian Li', 12, 1399.90, 1050.00),
('Redragon Chronos GC-903', 'Gabinete Redragon Chronos GC-903, Mid Tower ATX, vidro temperado lateral, iluminação RGB, custo-benefício gaming', 'https://images.unsplash.com/photo-1587831991001-be539967e94e?w=400&q=80', 'Gabinetes', 'Redragon', 25, 349.90, 240.00),
('Rise Mode Galaxy Glass 03', 'Gabinete Rise Mode Galaxy Glass 03, Mid Tower ATX, full vidro temperado, RGB, design elegante nacional', 'https://images.unsplash.com/photo-1587831991001-be539967e94e?w=400&q=80', 'Gabinetes', 'Rise Mode', 22, 399.90, 270.00),
('Cooler Master Hyper 212 Black Edition', 'Cooler CPU Cooler Master Hyper 212 Black Edition, 4 heatpipes, fan 120mm PWM, TDP 150W, compatível AM5/LGA1700', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=400&q=80', 'Coolers', 'Cooler Master', 35, 199.90, 135.00),
('Corsair iCUE H100i Elite Capellix 240mm', 'Water Cooler Corsair iCUE H100i Elite Capellix 240mm, radiador dual 120mm, pump RGB, 2 fans LL120, TDP 250W+', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=400&q=80', 'Coolers', 'Corsair', 20, 899.90, 650.00),
('Corsair iCUE H150i Elite LCD 360mm', 'Water Cooler Corsair iCUE H150i Elite LCD 360mm, tela LCD 2.1" no pump, radiador triple 120mm, TDP 350W+', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=400&q=80', 'Coolers', 'Corsair', 10, 1599.90, 1200.00),
('DeepCool AK620', 'Cooler CPU DeepCool AK620, dual tower, 6 heatpipes, 2 fans 120mm PWM, TDP 260W, silencioso', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=400&q=80', 'Coolers', 'DeepCool', 25, 349.90, 240.00),
('DeepCool LS720 360mm Water Cooler', 'Water Cooler DeepCool LS720 360mm, radiador triplo, 3 fans ARGB 120mm, display LCD no pump, TDP 300W+', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=400&q=80', 'Coolers', 'DeepCool', 12, 1099.90, 800.00),
('Thermalright Peerless Assassin 120 SE', 'Cooler CPU Thermalright Peerless Assassin 120 SE, dual tower, 6 heatpipes, 2 fans 120mm, TDP 260W, melhor custo-benefício', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=400&q=80', 'Coolers', 'Thermalright', 30, 299.90, 205.00),
('Noctua NH-D15 Chromax Black', 'Cooler CPU Noctua NH-D15 Chromax Black, dual tower, 6 heatpipes, 2 fans NF-A15 140mm PWM, TDP 250W, o mais silencioso', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?w=400&q=80', 'Coolers', 'Noctua', 15, 699.90, 510.00),
('Corsair RM750x 750W 80+ Gold', 'Fonte Corsair RM750x 750W, certificação 80+ Gold, modular total, silent mode 0 RPM, 10 anos garantia', 'https://images.unsplash.com/photo-1618090584126-129cd1f3fbae?w=400&q=80', 'Fontes', 'Corsair', 25, 849.90, 620.00),
('Corsair HX1000 1000W 80+ Platinum', 'Fonte Corsair HX1000 1000W, certificação 80+ Platinum, modular total, para sistemas high-end RTX 4090', 'https://images.unsplash.com/photo-1618090584126-129cd1f3fbae?w=400&q=80', 'Fontes', 'Corsair', 12, 1499.90, 1100.00),
('Cooler Master MWE Gold 650W V2', 'Fonte Cooler Master MWE Gold 650W V2, certificação 80+ Gold, semi-modular, APFC, 120mm fan', 'https://images.unsplash.com/photo-1618090584126-129cd1f3fbae?w=400&q=80', 'Fontes', 'Cooler Master', 30, 599.90, 420.00),
('EVGA SuperNOVA 850W G6 80+ Gold', 'Fonte EVGA SuperNOVA 850W G6, certificação 80+ Gold, modular total, ECO Mode, 10 anos garantia', 'https://images.unsplash.com/photo-1618090584126-129cd1f3fbae?w=400&q=80', 'Fontes', 'EVGA', 18, 899.90, 660.00),
('XPG Pylon 650W 80+ Bronze', 'Fonte XPG Pylon 650W, certificação 80+ Bronze, semi-modular, ótimo custo-benefício para builds médios', 'https://images.unsplash.com/photo-1618090584126-129cd1f3fbae?w=400&q=80', 'Fontes', 'XPG', 35, 449.90, 310.00),
('MSI MPG A850G PCIE5 850W 80+ Gold', 'Fonte MSI MPG A850G PCIe 5.0 850W, certificação 80+ Gold, modular total, cabo 16-pin nativo para RTX 4000', 'https://images.unsplash.com/photo-1618090584126-129cd1f3fbae?w=400&q=80', 'Fontes', 'MSI', 15, 999.90, 730.00),
('Gigabyte UD1000GM 1000W 80+ Gold', 'Fonte Gigabyte UD1000GM 1000W, certificação 80+ Gold, modular total, proteções completas OVP/OCP/SCP', 'https://images.unsplash.com/photo-1618090584126-129cd1f3fbae?w=400&q=80', 'Fontes', 'Gigabyte', 10, 1099.90, 800.00),
('Redragon K552 Kumara RGB Mecânico', 'Teclado mecânico Redragon K552 Kumara TKL (87 teclas), switches Red, RGB por tecla, anti-ghosting, construção metal', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80', 'Teclados', 'Redragon', 40, 299.90, 200.00),
('Corsair K70 RGB MK.2 Mecânico', 'Teclado mecânico Corsair K70 RGB MK.2, full size, switches Cherry MX Red, RGB por tecla, liga alumínio, USB passthrough', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80', 'Teclados', 'Corsair', 20, 799.90, 580.00),
('Logitech G915 TKL Wireless RGB', 'Teclado mecânico sem fio Logitech G915 TKL, switches GL Linear, RGB, Bluetooth + USB, perfil low-profile, bateria 40h', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80', 'Teclados', 'Logitech', 15, 1299.90, 960.00),
('Razer BlackWidow V4 Pro Mecânico', 'Teclado mecânico Razer BlackWidow V4 Pro, full size, switches Razer Green, Chroma RGB, Bluetooth/USB, dial multifunção', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80', 'Teclados', 'Razer', 12, 1599.90, 1200.00),
('HyperX Alloy Origins 65 Mecânico', 'Teclado mecânico HyperX Alloy Origins 65, 65% layout, switches HyperX Aqua, RGB, liga alumínio, USB-C', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80', 'Teclados', 'HyperX', 18, 649.90, 470.00),
('Logitech G502 X Plus Wireless', 'Mouse gamer sem fio Logitech G502 X Plus, sensor HERO 25K DPI, 13 botões programáveis, RGB LightForce, 89g', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', 'Mouses', 'Logitech', 25, 899.90, 650.00),
('Razer DeathAdder V3 HyperSpeed', 'Mouse gamer sem fio Razer DeathAdder V3 HyperSpeed, sensor Focus X 26K DPI, 5 botões, 64g ultra-leve', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', 'Mouses', 'Razer', 20, 699.90, 510.00),
('HyperX Pulsefire Haste 2 Wireless', 'Mouse gamer sem fio HyperX Pulsefire Haste 2, sensor 26K DPI, HyperFlex cable, honeycomb design, 61g', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', 'Mouses', 'HyperX', 22, 599.90, 430.00),
('Redragon M711 Cobra Gaming', 'Mouse gamer Redragon M711 Cobra, sensor 10000 DPI, 7 botões programáveis, RGB, cabo trançado, ótimo custo', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', 'Mouses', 'Redragon', 45, 149.90, 100.00),
('Corsair M75 Air Wireless', 'Mouse gamer sem fio Corsair M75 Air, sensor 26K DPI, 7 botões, 60g ultra-leve, bateria 200h, USB-C', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', 'Mouses', 'Corsair', 18, 749.90, 540.00),
('HyperX Cloud II Wireless', 'Headset gamer sem fio HyperX Cloud II Wireless, driver 53mm, surround 7.1, bateria 30h, microfone destacável, USB', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', 'Headsets', 'HyperX', 20, 699.90, 500.00),
('Razer BlackShark V2 Pro Wireless', 'Headset gamer sem fio Razer BlackShark V2 Pro, driver Razer Triforce 50mm, THX Spatial Audio, bateria 70h, ultra-leve', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', 'Headsets', 'Razer', 15, 999.90, 730.00),
('Logitech G733 Lightspeed Wireless', 'Headset gamer sem fio Logitech G733 Lightspeed, driver 40mm, DTS 2.0, RGB, microfone cardioid, bateria 29h', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', 'Headsets', 'Logitech', 18, 799.90, 580.00),
('Corsair HS80 RGB Wireless', 'Headset gamer sem fio Corsair HS80 RGB, driver 50mm neodímio, Dolby Atmos, microfone omnidirecional, bateria 20h', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', 'Headsets', 'Corsair', 16, 749.90, 540.00),
('JBL Quantum 600 Wireless', 'Headset gamer sem fio JBL Quantum 600, JBL QuantumSURROUND, driver 50mm, microfone flip-up, bateria 14h', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', 'Headsets', 'JBL', 20, 649.90, 470.00),
('TP-Link Archer AX73 WiFi 6 Router', 'Roteador TP-Link Archer AX73 WiFi 6, AX5400, dual band, 6 antenas, OFDMA, MU-MIMO, porta WAN/LAN Gigabit', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80', 'Redes', 'TP-Link', 30, 699.90, 490.00),
('D-Link DIR-X3260 WiFi 6 AX3200', 'Roteador D-Link DIR-X3260 WiFi 6 AX3200, dual band, mesh compatível, 4 antenas, beamforming, QoS', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80', 'Redes', 'D-Link', 25, 599.90, 420.00),
('Mercusys MR70X WiFi 6 AX1800', 'Roteador Mercusys MR70X WiFi 6 AX1800, dual band, 4 antenas, OFDMA, excelente custo-benefício', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80', 'Redes', 'Mercusys', 35, 299.90, 200.00),
('MikroTik RB4011 Router', 'Roteador MikroTik RB4011iGS+RM, 10 portas Gigabit, 1x SFP+, RouterOS L5, para redes profissionais', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80', 'Redes', 'MikroTik', 10, 1599.90, 1200.00),
('Ubiquiti UniFi Dream Machine SE', 'Gateway Ubiquiti UniFi Dream Machine SE, 8 portas PoE Gigabit, 1 porta 10G SFP+, IPS/IDS, console UniFi integrado', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80', 'Redes', 'Ubiquiti', 6, 3999.90, 3000.00),
('Hub USB-C 7 em 1 - HDMI 4K + USB 3.0 + SD', 'Hub USB-C 7 em 1 com saída HDMI 4K@60Hz, 3x USB 3.0, leitor SD/microSD, USB-C Power Delivery 100W, alumínio', 'https://images.unsplash.com/photo-1625227764559-fbe47b03f0b8?w=400&q=80', 'Acessórios', 'Universal', 50, 149.90, 90.00),
('Adaptador USB-C para USB-A 3.0 (pack 3x)', 'Pack com 3 adaptadores USB-C macho para USB-A 3.0 fêmea, suporta dados até 5Gbps, compatível MacBook/Android/notebooks', 'https://images.unsplash.com/photo-1625227764559-fbe47b03f0b8?w=400&q=80', 'Acessórios', 'Universal', 80, 49.90, 28.00),
('Cabo HDMI 2.1 8K 3 metros', 'Cabo HDMI 2.1 ultra high speed 3 metros, suporta 8K@60Hz e 4K@120Hz, 48Gbps bandwidth, HDR, ARC/eARC', 'https://images.unsplash.com/photo-1625227764559-fbe47b03f0b8?w=400&q=80', 'Acessórios', 'Universal', 60, 89.90, 50.00),
('Cabo DisplayPort 1.4 8K 2 metros', 'Cabo DisplayPort 1.4 2 metros, suporta 8K@60Hz e 4K@144Hz, 32.4Gbps, para monitor gaming', 'https://images.unsplash.com/photo-1625227764559-fbe47b03f0b8?w=400&q=80', 'Acessórios', 'Universal', 45, 79.90, 45.00),
('Leitor de Cartão USB-C SD/TF', 'Leitor de cartão multifuncional USB-C + USB-A, SD, microSD, CF, MS, velocidade USB 3.0 5Gbps', 'https://images.unsplash.com/photo-1625227764559-fbe47b03f0b8?w=400&q=80', 'Acessórios', 'Universal', 55, 59.90, 35.00),
('Webcam Full HD 1080p 60fps com Microfone', 'Webcam USB Full HD 1080p 60fps, microfone duplo com cancelamento de ruído, autofoco, compatível com Windows/Mac/Linux', 'https://images.unsplash.com/photo-1625227764559-fbe47b03f0b8?w=400&q=80', 'Acessórios', 'Universal', 30, 299.90, 195.00),
('Suporte de Monitor Articulado VESA', 'Suporte articulado para monitor VESA 75x75 e 100x100, gira 360°, inclina +/- 45°, suporta até 10kg, fixação mesa', 'https://images.unsplash.com/photo-1625227764559-fbe47b03f0b8?w=400&q=80', 'Acessórios', 'Universal', 25, 199.90, 130.00),
('Microfone USB Condensador Cardioide', 'Microfone USB condensador cardioide para streaming/podcast, frequência 20Hz-20kHz, tripé incluído, plug & play', 'https://images.unsplash.com/photo-1625227764559-fbe47b03f0b8?w=400&q=80', 'Acessórios', 'Universal', 20, 349.90, 230.00),
('Dell OptiPlex 7010 Micro Mini PC', 'Mini PC Dell OptiPlex 7010 Micro, Intel Core i5-13500T, 16GB DDR4, SSD 512GB, Windows 11 Pro, garantia 3 anos', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80', 'Corporativo', 'Dell', 10, 5499.90, 4200.00),
('Lenovo ThinkCentre M70q Tiny', 'Mini PC Lenovo ThinkCentre M70q Tiny, Intel Core i7-12700T, 32GB DDR4, SSD 1TB, Windows 11 Pro, vPro', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80', 'Corporativo', 'Lenovo', 8, 6999.90, 5300.00),
('HP ProDesk 400 G9 Mini', 'Mini PC HP ProDesk 400 G9 Mini, Intel Core i5-12500T, 16GB DDR4, SSD 256GB, Windows 11 Pro, gerenciamento HP Wolf', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80', 'Corporativo', 'HP', 8, 4999.90, 3800.00),
('Synology DS923+ NAS 4 Bay', 'Storage NAS Synology DS923+, 4 baias, AMD Ryzen R1600, 4GB DDR4 ECC expansível 32GB, 2x 1GbE, 2x NVMe M.2', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'Corporativo', 'Synology', 5, 5999.90, 4500.00),
('QNAP TS-453E NAS 4 Bay', 'Storage NAS QNAP TS-453E, 4 baias, Intel Celeron J6412, 8GB DDR4, 2x 2.5GbE, HDMI 2.0, QTS e QuTS hero', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'Corporativo', 'QNAP', 5, 5499.90, 4100.00),
('Dell PowerEdge T350 Tower Server', 'Servidor Dell PowerEdge T350 Tower, Intel Xeon E-2336 6C, 16GB ECC DDR4, SSD 480GB SATA, RAID H355, Windows Server 2022', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80', 'Corporativo', 'Dell', 3, 22999.90, 17500.00),
('HP Aruba Switch 24 Portas Gerenciável', 'Switch gerenciável HP Aruba 1930 24G, 24x Gigabit RJ45 + 4x SFP, PoE+ 195W, gerenciamento web/cloud', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80', 'Corporativo', 'HP', 6, 3999.90, 3000.00),
('Ubiquiti UniFi AP WiFi 6 Pro', 'Access Point Ubiquiti UniFi U6 Pro WiFi 6, cobertura 300m², até 300 clientes simultâneos, 4x4 MU-MIMO, PoE', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80', 'Corporativo', 'Ubiquiti', 8, 2299.90, 1700.00),
('Nobreak APC Smart-UPS 1500VA', 'Nobreak APC Smart-UPS 1500VA Senoidal, 1000W, 8 tomadas, USB + serial, gerenciamento PowerChute, para servidores', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80', 'Corporativo', 'APC', 10, 4299.90, 3200.00),
('Monitor Dell UltraSharp 27" 4K USB-C', 'Monitor Dell UltraSharp U2723DE 27", IPS 4K UHD, USB-C 90W, Hub USB, cor 100% sRGB / 98% DCI-P3, certificação Thunderbolt', 'https://images.unsplash.com/photo-1527443224154-c4a573d5d6da?w=400&q=80', 'Corporativo', 'Dell', 8, 5999.90, 4600.00),
('Lenovo ThinkVision T27h 27" QHD', 'Monitor Lenovo ThinkVision T27h 27" QHD IPS, resolução 2560x1440, USB-C 65W, hub USB 3.0, ajuste ergonômico completo', 'https://images.unsplash.com/photo-1527443224154-c4a573d5d6da?w=400&q=80', 'Corporativo', 'Lenovo', 6, 3999.90, 3000.00);
 
-- ============================================================
-- ATUALIZA VIEW PARA INCLUIR NOVOS CAMPOS
-- ============================================================
CREATE OR REPLACE VIEW vw_estoque_resumo AS
    SELECT
        id,
        produto,
        descricao,
        imagem_url,
        categoria,
        marca,
        quantidade,
        valor_unitario,
        custo_unitario,
        ativo,
        atualizado_em
    FROM produtos
    WHERE ativo = 1;
 
-- Resumo por categoria
CREATE OR REPLACE VIEW vw_estoque_por_categoria AS
    SELECT
        categoria,
        COUNT(*) AS total_produtos,
        SUM(quantidade) AS total_unidades,
        ROUND(AVG(valor_unitario), 2) AS preco_medio,
        MIN(valor_unitario) AS menor_preco,
        MAX(valor_unitario) AS maior_preco
    FROM produtos
    WHERE ativo = 1
    GROUP BY categoria
    ORDER BY categoria;
 
SELECT CONCAT('✅ Produtos inseridos com sucesso! Total de linhas: ', COUNT(*)) AS resultado FROM produtos;



-- ============================================================
-- ENTREGA
-- ============================================================

CREATE TABLE compra (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id        INT            NOT NULL,
    nome              VARCHAR(250)   NOT NULL,
    email             VARCHAR(100)   NOT NULL,
    cpf_cnpj          VARCHAR(14)    NOT NULL,
    telefone          CHAR(15),
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
-- Tabela auxiliar de referência de baixas
-- -------------------------------------------------------
CREATE TABLE estoque_referencia (
    id                 INT       PRIMARY KEY AUTO_INCREMENT,
    produto_id         INT       NOT NULL,
    compra_id          INT       NOT NULL UNIQUE,
    quantidade_baixada INT       NOT NULL,
    registrado_em      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ref_compra FOREIGN KEY (compra_id)
        REFERENCES compra(id) ON DELETE CASCADE,

    CONSTRAINT fk_ref_produto FOREIGN KEY (produto_id)
        REFERENCES produtos(id) ON DELETE RESTRICT ON UPDATE CASCADE
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

-- -------------------------------------------------------
-- TRIGGER: recalcula valor_total ao atualizar
-- e controla datas/status
-- -------------------------------------------------------
CREATE TRIGGER trg_compra_update
BEFORE UPDATE ON compra
FOR EACH ROW
BEGIN
    SET NEW.valor_total = NEW.quantidade * NEW.valor_unitario;

    -- Detecta mudança de status para PAGO
    IF NEW.status_pagamento = 'PAGO' AND OLD.status_pagamento <> 'PAGO' THEN
        SET NEW.pago_em = NOW();

        IF OLD.status_entrega = 'AGUARDANDO' THEN
            SET NEW.status_entrega = 'PREPARANDO';
        END IF;
    END IF;

    -- Detecta confirmação de entrega
    IF NEW.status_entrega = 'ENTREGUE' AND OLD.status_entrega <> 'ENTREGUE' THEN
        SET NEW.entregue_em = NOW();
    END IF;
END$$

DELIMITER ;

-- -------------------------------------------------------
-- STORED PROCEDURE: dar baixa no estoque ao confirmar pagamento
-- Chamada correta:
--   CALL sp_baixa_estoque(1);
-- -------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE sp_baixa_estoque(IN p_compra_id INT)
BEGIN
    DECLARE v_produto_id   INT;
    DECLARE v_quantidade   INT;
    DECLARE v_produto      VARCHAR(300);
    DECLARE v_qtd_atual    INT;
    DECLARE v_ja_baixado   INT DEFAULT 0;

    -- Busca os dados da compra já paga
    SELECT produto_id, quantidade, produto
      INTO v_produto_id, v_quantidade, v_produto
    FROM compra
    WHERE id = p_compra_id
      AND status_pagamento = 'PAGO'
    LIMIT 1;

    -- Valida compra
    IF v_produto_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Compra inexistente ou pagamento ainda não confirmado.';
    END IF;

    -- Evita baixa duplicada
    SELECT COUNT(*)
      INTO v_ja_baixado
    FROM estoque_referencia
    WHERE compra_id = p_compra_id;

    IF v_ja_baixado > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Baixa de estoque já registrada para esta compra.';
    END IF;

    -- Busca estoque atual
    SELECT quantidade
      INTO v_qtd_atual
    FROM produtos
    WHERE id = v_produto_id
    LIMIT 1;

    IF v_qtd_atual IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Produto não encontrado.';
    END IF;

    IF v_qtd_atual < v_quantidade THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Estoque insuficiente para esta baixa.';
    END IF;

    -- Dá baixa no estoque real
    UPDATE produtos
       SET quantidade = quantidade - v_quantidade
     WHERE id = v_produto_id;

    -- Registra no histórico do estoque
    INSERT INTO historico_estoque (
        produto_id,
        tipo_movimento,
        quantidade,
        quantidade_anterior,
        quantidade_nova,
        motivo,
        referencia_id,
        registrado_em
    )
    VALUES (
        v_produto_id,
        'SAIDA',
        v_quantidade,
        v_qtd_atual,
        v_qtd_atual - v_quantidade,
        CONCAT('Baixa por compra #', p_compra_id),
        p_compra_id,
        NOW()
    );

    -- Registra referência da baixa
    INSERT INTO estoque_referencia (
        produto_id,
        compra_id,
        quantidade_baixada,
        registrado_em
    )
    VALUES (
        v_produto_id,
        p_compra_id,
        v_quantidade,
        NOW()
    );
END$$

DELIMITER ;

-- -------------------------------------------------------
-- Views úteis
-- -------------------------------------------------------
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

-- ============================================================
-- A PARTIR DAQUI: migração de pagamento (Pix/Cartão/Boleto) +
-- colunas usadas pela tela de rastreio
-- ============================================================

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
