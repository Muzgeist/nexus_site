-- Active: 1770140834426@@127.0.0.1@3306@banco
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
('Intel Core i3-12100F', 'Processador Intel Core i3-12100F, 4 núcleos, 8 threads, 3.3GHz base / 4.3GHz turbo, socket LGA1700, 12MB cache L3, sem GPU integrada', 'https://hotsite.pichau.com.br/descricao/Intel/I3-12100F/i3-12100f.png', 'Processadores', 'Intel', 30, 549.90, 380.00),
('Intel Core i5-12400F', 'Processador Intel Core i5-12400F, 6 núcleos, 12 threads, 2.5GHz base / 4.4GHz turbo, socket LGA1700, 18MB cache L3, sem GPU integrada', 'https://cdn.awsli.com.br/2500x2500/2547/2547358/produto/206196999/processador-intel-core-i5-12400f-2-5ghz-4-4ghz-turbo--12--gera-o--6-cores--12-t-tbmgqq3ew5.jpg', 'Processadores', 'Intel', 25, 899.90, 640.00),
('Intel Core i5-13600K', 'Processador Intel Core i5-13600K, 14 núcleos (6P+8E), 20 threads, 3.5GHz base / 5.1GHz turbo, socket LGA1700, 24MB cache L3, desbloqueado', 'https://m.media-amazon.com/images/I/518UUvBjZdL._AC_UF894,1000_QL80_.jpg', 'Processadores', 'Intel', 20, 1599.90, 1150.00),
('Intel Core i7-13700K', 'Processador Intel Core i7-13700K, 16 núcleos (8P+8E), 24 threads, 3.4GHz base / 5.4GHz turbo, socket LGA1700, 30MB cache L3, desbloqueado', 'https://img.terabyteshop.com.br/produto/g/processador-intel-core-i7-13700kf-34ghz-54ghz-turbo-13-geracao-16-core-24-threads-lga-1700-bx8071513700kf_152337.jpg', 'Processadores', 'Intel', 15, 2299.90, 1700.00),
('Intel Core i9-13900K', 'Processador Intel Core i9-13900K, 24 núcleos (8P+16E), 32 threads, 3.0GHz base / 5.8GHz turbo, socket LGA1700, 36MB cache L3, desbloqueado - Top de linha', 'https://www.lognetinfo.com.br/imagens/original/21585A.jpg', 'Processadores', 'Intel', 10, 3799.90, 2900.00),
('Intel Xeon E-2388G', 'Processador Intel Xeon E-2388G, 8 núcleos, 16 threads, 3.2GHz base / 5.1GHz turbo, socket LGA1200, 16MB cache L3, para servidores workstation', 'https://snpi.dell.com/snp/images/products/large/pt-br~338-CCYR/338-CCYR.jpg', 'Processadores', 'Intel', 8, 4299.90, 3200.00),
('AMD Ryzen 3 4100', 'Processador AMD Ryzen 3 4100, 4 núcleos, 8 threads, 3.8GHz base / 4.0GHz turbo, socket AM4, 6MB cache L3, ótimo custo-benefício', 'https://images.tcdn.com.br/img/img_prod/313499/processador_amd_ryzen_3_4100_3_8ghz_4_0ghz_turbo_4_cores_8_threads_am4_com_cooler_100_100000510box_19836_1_eaf6507fc643caf37327e8f1c2e08776.jpg', 'Processadores', 'AMD', 35, 499.90, 340.00),
('AMD Ryzen 5 5600X', 'Processador AMD Ryzen 5 5600X, 6 núcleos, 12 threads, 3.7GHz base / 4.6GHz turbo, socket AM4, 35MB cache total, Zen 3', 'https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-5600x.jpg', 'Processadores', 'AMD', 30, 999.90, 720.00),
('AMD Ryzen 7 5800X3D', 'Processador AMD Ryzen 7 5800X3D, 8 núcleos, 16 threads, 3.4GHz base / 4.5GHz turbo, socket AM4, 100MB cache 3D V-Cache, melhor gaming AM4', 'https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-5800x3d-og.jpg', 'Processadores', 'AMD', 12, 1899.90, 1400.00),
('AMD Ryzen 9 7900X', 'Processador AMD Ryzen 9 7900X, 12 núcleos, 24 threads, 4.7GHz base / 5.6GHz turbo, socket AM5, 76MB cache total, Zen 4', 'https://img.terabyteshop.com.br/produto/g/processador-amd-ryzen-9-7900x-47ghz-56ghz-turbo-12-cores-24-threads-am5-100-100000589wof_149279.png', 'Processadores', 'AMD', 10, 2899.90, 2200.00),
('AMD Ryzen 9 7950X', 'Processador AMD Ryzen 9 7950X, 16 núcleos, 32 threads, 4.5GHz base / 5.7GHz turbo, socket AM5, 80MB cache total, Zen 4, melhor multi-thread consumer', 'https://m.media-amazon.com/images/I/5116zdA9uyL._AC_UF894,1000_QL80_.jpg', 'Processadores', 'AMD', 8, 4299.90, 3300.00),
('AMD Threadripper PRO 5975WX', 'Processador AMD Threadripper PRO 5975WX, 32 núcleos, 64 threads, 3.6GHz base / 4.5GHz turbo, socket sWRX8, 256MB cache total, workstation profissional', 'https://www.gigantec.com.br/media/catalog/product/cache/66c3fa0fb26d248d0ca40a64a387c3da/p/r/processador-amd-ryzen-threadripper-pro-5975wx-swrx8-100-100000445wof-002.jpg', 'Processadores', 'AMD', 4, 14999.90, 11500.00),
('AMD EPYC 7543', 'Processador AMD EPYC 7543, 32 núcleos, 64 threads, 2.8GHz base / 3.7GHz turbo, socket SP3, 256MB cache total, para servidores enterprise', 'https://www.serverbasket.com/wp-content/uploads/2023/01/amd-epyc-7543-processors.png', 'Processadores', 'AMD', 3, 19999.90, 15000.00),
('ASUS GeForce RTX 4060 Dual OC 8GB', 'Placa de vídeo ASUS Dual GeForce RTX 4060 OC Edition 8GB GDDR6, 128-bit, boost 2565MHz, DLSS 3, Ray Tracing, Ada Lovelace', 'https://fujiokadistribuidor.vteximg.com.br/arquivos/ids/406611', 'Placas de Vídeo', 'ASUS', 20, 2299.90, 1750.00),
('MSI GeForce RTX 4070 Gaming X Trio 12GB', 'Placa de vídeo MSI GeForce RTX 4070 Gaming X Trio 12GB GDDR6X, 192-bit, boost 2610MHz, DLSS 3, Ray Tracing, RGB Mystic Light', 'https://storage-asset.msi.com/global/picture/product/product_16812916502ca0a14b6dfb5319c99da1d4ffb3a8ad.webp', 'Placas de Vídeo', 'MSI', 15, 3899.90, 3000.00),
('Gigabyte GeForce RTX 4070 Ti Super Aorus Master 16GB', 'Placa de vídeo Gigabyte Aorus RTX 4070 Ti Super 16GB GDDR6X, 256-bit, boost 2670MHz, DLSS 3.5, cooler triplo WindForce', 'https://images6.kabum.com.br/produtos/fotos/sync_mirakl/587846/Placa-De-V-deo-RTX-4070-Nvidia-Geforce-Gigabyte-Ti-Super-Master-16GB-GDDR6-256-bit-Preto_1717513908_gg.jpg', 'Placas de Vídeo', 'Gigabyte', 10, 5499.90, 4200.00),
('Zotac GeForce RTX 4080 Super AMP Extreme 16GB', 'Placa de vídeo Zotac Gaming RTX 4080 Super AMP Extreme 16GB GDDR6X, 256-bit, boost 2595MHz, DLSS 3.5, design premium', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBBJxfkmlL83OEWSkv4uzIigHLk7c2JbRprxfEgRh_HKW4UVzJW66PfA16&s=10', 'Placas de Vídeo', 'Zotac', 8, 7999.90, 6200.00),
('GALAX GeForce RTX 4090 HOF Pro 24GB', 'Placa de vídeo GALAX RTX 4090 Hall of Fame Pro 24GB GDDR6X, 384-bit, boost 2580MHz, DLSS 3.5, top de linha', 'https://images3.kabum.com.br/produtos/fotos/404443/placa-de-video-rtx-4090-hof-galax-nvidia-24-gb-gddr6x-argb-dlss-ray-tracing-49nxm5md6phe_1671565210_gg.jpg', 'Placas de Vídeo', 'GALAX', 5, 16999.90, 13000.00),
('PNY GeForce RTX 4060 Ti XLR8 16GB', 'Placa de vídeo PNY XLR8 Gaming Verto RTX 4060 Ti 16GB GDDR6, 128-bit, boost 2580MHz, DLSS 3, ótimo custo-benefício 1080p/1440p', 'https://m.media-amazon.com/images/I/61ofMvxzf5L._AC_UF894,1000_QL80_.jpg', 'Placas de Vídeo', 'PNY', 18, 2899.90, 2200.00),
('PNY NVIDIA RTX A4000 16GB', 'Placa de vídeo profissional NVIDIA RTX A4000 16GB GDDR6, ECC, 448GB/s, 6144 CUDA Cores, para workstation CAD/3D/IA', 'https://netcomputadores.com.br/dbimg/produtos/vcnrtxa4000_pb_135350_g.jpg', 'Placas de Vídeo', 'PNY', 6, 14999.90, 11500.00),
('ASUS Radeon RX 7600 Dual OC 8GB', 'Placa de vídeo ASUS Dual Radeon RX 7600 OC 8GB GDDR6, 128-bit, boost 2755MHz, FSR 3, excelente para 1080p gaming', 'https://dlcdnwebimgs.asus.com/gain/662a0748-5841-4001-af31-ce4cc070b44a/', 'Placas de Vídeo', 'ASUS', 22, 1999.90, 1500.00),
('MSI Radeon RX 7700 XT Gaming Trio 12GB', 'Placa de vídeo MSI Radeon RX 7700 XT Gaming Trio 12GB GDDR6, 192-bit, boost 2599MHz, FSR 3, ideal para 1440p', 'https://www.asrock.com/Graphics-Card/photo/Radeon%20RX%207700%20XT%20Phantom%20Gaming%2012GB%20OC(M1).png', 'Placas de Vídeo', 'MSI', 14, 2799.90, 2100.00),
('Gigabyte Radeon RX 7900 XTX Aorus 24GB', 'Placa de vídeo Gigabyte Aorus Radeon RX 7900 XTX 24GB GDDR6, 384-bit, boost 2615MHz, FSR 3, top de linha AMD', 'https://m.media-amazon.com/images/I/51NUINRqH2L._AC_UF894,1000_QL80_.jpg', 'Placas de Vídeo', 'Gigabyte', 7, 7499.90, 5800.00),
('ASUS ROG Strix B660-F Gaming WiFi', 'Placa-mãe ASUS ROG Strix B660-F Gaming WiFi, socket LGA1700, DDR5, WiFi 6, PCIe 5.0, 2.5G LAN, RGB', 'https://dlcdnwebimgs.asus.com/gain/DEAAF429-3508-4E7E-8BEB-FE74C38B20B6', 'Placas-Mãe', 'ASUS', 15, 1299.90, 950.00),
('ASUS TUF Gaming Z790-Plus WiFi', 'Placa-mãe ASUS TUF Gaming Z790-Plus WiFi, socket LGA1700, DDR5, WiFi 6E, PCIe 5.0, USB 3.2 Gen 2x2, militar grade', 'https://images1.kabum.com.br/produtos/fotos/427131/placa-mae-asus-ruf-gaming-z790-plus-wifi-90mb1d80-m0eay0_1685021659_gg.jpg', 'Placas-Mãe', 'ASUS', 12, 1899.90, 1400.00),
('MSI MAG B650 Tomahawk WiFi', 'Placa-mãe MSI MAG B650 Tomahawk WiFi, socket AM5, DDR5, WiFi 6E, PCIe 5.0 para M.2, 2.5G LAN', 'https://storage-asset.msi.com/global/picture/image/feature/mb/B650/MAG-B650-TOMAHAWK-WIFI/mag-b650-tomahawk-wifi-block02.png', 'Placas-Mãe', 'MSI', 18, 1499.90, 1100.00),
('MSI MEG X670E Ace', 'Placa-mãe MSI MEG X670E Ace, socket AM5, DDR5, WiFi 6E, PCIe 5.0, 10G LAN, para Ryzen 7000 flagship', 'https://storage-asset.msi.com/global/picture/product/product_16596682205f9bff38a307a009b098f69bb8136bdc.webp', 'Placas-Mãe', 'MSI', 6, 3599.90, 2700.00),
('Gigabyte B660M DS3H AX DDR4', 'Placa-mãe Gigabyte B660M DS3H AX DDR4, socket LGA1700, micro-ATX, WiFi 6, PCIe 4.0, ótimo custo-benefício', 'https://static.gigabyte.com/StaticFile/Image/Global/4309d3d236e7e431c3298082fdb31b4f/ProductRemoveBg/30362', 'Placas-Mãe', 'Gigabyte', 25, 699.90, 500.00),
('Gigabyte Z790 Aorus Master', 'Placa-mãe Gigabyte Z790 Aorus Master, socket LGA1700, DDR5, WiFi 6E, Thunderbolt 4, 10G LAN, flagship', 'https://m.media-amazon.com/images/I/71wLxhN2DEL._AC_UF894,1000_QL80_.jpg', 'Placas-Mãe', 'Gigabyte', 8, 3299.90, 2500.00),
('ASRock B550M Pro4', 'Placa-mãe ASRock B550M Pro4, socket AM4, DDR4, micro-ATX, PCIe 4.0, USB 3.2, ótima para Ryzen 5000', 'https://www.asrock.com/mb/photo/B550M%20Pro4(M1).png', 'Placas-Mãe', 'ASRock', 20, 599.90, 420.00),
('Biostar B660MX-E Pro', 'Placa-mãe Biostar B660MX-E Pro, socket LGA1700, DDR4, micro-ATX, PCIe 4.0, opção econômica', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrXyzG74rEqvnTM0N25X6gAH1HQLrE26KF0O-M9E9_4E87NpUHTxHtBGQ&s=10', 'Placas-Mãe', 'Biostar', 15, 499.90, 350.00),
('Colorful CVN B660M Gaming Pro V20', 'Placa-mãe Colorful CVN B660M Gaming Pro V20, socket LGA1700, DDR4, micro-ATX, iluminação RGB', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSd0ZVk9jNA9DRFDEzqONK-U8erQxb12XzxUaXopK2gzs5HCARymxpYr-g&s=10', 'Placas-Mãe', 'Colorful', 12, 549.90, 380.00),
('Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz', 'Kit memória RAM Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz CL16, compatível com Intel XMP e AMD Expo, heatspreader preto', 'https://img.terabyteshop.com.br/produto/g/memoria-ddr4-kingston-fury-beast-rgb-16gb-2x8gb-3600mhz-preto-kf436c17bb2ak216_178521.jpg', 'Memória RAM', 'Kingston', 40, 329.90, 230.00),
('Kingston Fury Beast DDR5 32GB (2x16GB) 5200MHz', 'Kit memória RAM Kingston Fury Beast DDR5 32GB (2x16GB) 5200MHz CL40, XMP 3.0, próxima geração', 'https://media.kingston.com/kingston/product/FURY_Beast_Black_RGB_DDR5_1_angle-zm-lg.jpg', 'Memória RAM', 'Kingston', 25, 699.90, 510.00),
('Corsair Vengeance LPX DDR4 32GB (2x16GB) 3600MHz', 'Kit memória RAM Corsair Vengeance LPX DDR4 32GB (2x16GB) 3600MHz CL18, perfil low-profile, preto', 'https://media.pichau.com.br/media/catalog/product/cache/2f958555330323e505eba7ce930bdf27/c/m/cmk32gx4m2a2666c16.jpg', 'Memória RAM', 'Corsair', 30, 489.90, 340.00),
('Corsair Dominator Platinum RGB DDR5 64GB (2x32GB) 6000MHz', 'Kit memória RAM Corsair Dominator Platinum RGB DDR5 64GB (2x32GB) 6000MHz CL36, RGB icônico, premium', 'https://assets.corsair.com/image/upload/c_pad,q_85,h_1100,w_1100,f_auto/products/Memory/dominator-rgb-ddr5-std-blk-config/2-up/DOMINATOR_RGB_PLATINUM_BLACK_DDR5_01.webp', 'Memória RAM', 'Corsair', 10, 1999.90, 1500.00),
('Crucial Ballistix DDR4 16GB (2x8GB) 3200MHz', 'Kit memória RAM Crucial Ballistix DDR4 16GB (2x8GB) 3200MHz CL16, ótimo custo-benefício, dissipador vermelho', 'https://img.terabyteshop.com.br/produto/m/memoria-ddr4-crucial-ballistix-8gb-3200mhz-red-bl2k8g32c16u4r_109947.png', 'Memória RAM', 'Crucial', 35, 299.90, 210.00),
('G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) 6400MHz', 'Kit memória RAM G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) 6400MHz CL32, RGB premium, overclock extremo', 'https://cdn.awsli.com.br/600x700/2508/2508057/produto/185608798/019f2bce0f.jpg', 'Memória RAM', 'G.Skill', 15, 1199.90, 880.00),
('ADATA XPG Lancer DDR5 32GB (2x16GB) 5200MHz', 'Kit memória RAM ADATA XPG Lancer DDR5 32GB (2x16GB) 5200MHz CL38, dissipador alumínio, RGB', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTIboKtB0wlOqrDGk_G6cSVh-H9E495vxE6vkoLVwSq_Ib7PHmQ5Cwonw&s=10', 'Memória RAM', 'ADATA', 20, 649.90, 470.00),
('TeamGroup T-Force Vulcan DDR4 16GB (2x8GB) 3200MHz', 'Kit memória RAM TeamGroup T-Force Vulcan DDR4 16GB (2x8GB) 3200MHz CL16, dissipador slim, vermelho', 'https://http2.mlstatic.com/D_Q_NP_2X_801480-CBT50640097739_072022-P.webp', 'Memória RAM', 'TeamGroup', 28, 289.90, 200.00),
('Kingston NV2 SSD NVMe M.2 1TB', 'SSD Kingston NV2 NVMe PCIe 4.0 M.2 2280 1TB, leitura até 3500 MB/s, gravação até 2100 MB/s, ideal para uso diário', 'https://fujiokadistribuidor.vteximg.com.br/arquivos/ids/319024', 'SSDs', 'Kingston', 45, 399.90, 270.00),
('Samsung 990 Pro NVMe M.2 1TB', 'SSD Samsung 990 Pro NVMe PCIe 4.0 M.2 2280 1TB, leitura até 7450 MB/s, gravação até 6900 MB/s, melhor performance gaming', 'https://m.media-amazon.com/images/I/61ZL9Qpo1-L.jpg', 'SSDs', 'Samsung', 30, 699.90, 510.00),
('Samsung 990 Pro NVMe M.2 2TB', 'SSD Samsung 990 Pro NVMe PCIe 4.0 M.2 2280 2TB, leitura até 7450 MB/s, gravação até 6900 MB/s, alta capacidade', 'https://media.pichau.com.br/media/catalog/product/cache/2f958555330323e505eba7ce930bdf27/m/z/mz-v9p2t0cw1.jpg', 'SSDs', 'Samsung', 20, 1199.90, 900.00),
('WD Black SN850X NVMe M.2 1TB', 'SSD Western Digital Black SN850X NVMe PCIe 4.0 M.2 2280 1TB, leitura até 7300 MB/s, gaming mode integrado', 'https://m.media-amazon.com/images/I/618RFfiA8dL.jpg', 'SSDs', 'Western Digital', 25, 649.90, 470.00),
('Seagate FireCuda 530 NVMe M.2 2TB', 'SSD Seagate FireCuda 530 NVMe PCIe 4.0 M.2 2280 2TB, leitura até 7300 MB/s, heatsink incluso', 'https://http2.mlstatic.com/D_NQ_NP_977145-MLA49144992525_022022-O.webp', 'SSDs', 'Seagate', 18, 1099.90, 820.00),
('Crucial MX500 SATA SSD 1TB', 'SSD Crucial MX500 SATA 2.5" 1TB, leitura até 560 MB/s, gravação até 510 MB/s, ótimo upgrade para notebook', 'https://m.media-amazon.com/images/I/61qpwctb5uL._AC_UF894,1000_QL80_.jpg', 'SSDs', 'Crucial', 40, 349.90, 240.00),
('ADATA Legend 960 NVMe M.2 1TB', 'SSD ADATA Legend 960 NVMe PCIe 4.0 M.2 2280 1TB, leitura até 7400 MB/s, heatsink incluso', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', 'SSDs', 'ADATA', 22, 429.90, 300.00),
('TeamGroup MP44 NVMe M.2 2TB', 'SSD TeamGroup MP44 NVMe PCIe 4.0 M.2 2280 2TB, leitura até 7400 MB/s, gravação até 7000 MB/s, alta capacidade', 'https://media.pichau.com.br/media/catalog/product/cache/2f958555330323e505eba7ce930bdf27/t/m/tm8fpw002t0c1012.jpg', 'SSDs', 'TeamGroup', 15, 899.90, 660.00),
('Seagate Barracuda 1TB 7200RPM', 'HD Seagate Barracuda 1TB 7200RPM SATA 6Gb/s 3.5", cache 64MB, ideal para armazenamento desktop', 'https://http2.mlstatic.com/D_NQ_NP_806721-MLU78708983624_092024-O.webp', 'HDs', 'Seagate', 50, 249.90, 170.00),
('Seagate Barracuda 2TB 7200RPM', 'HD Seagate Barracuda 2TB 7200RPM SATA 6Gb/s 3.5", cache 256MB, excelente custo por GB', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPYv6n4LURG1RYEk-Q37cmszsijPaUKSujUgfMkNsKwe8ajNfHBNJMP_Gz&s=10', 'HDs', 'Seagate', 40, 399.90, 280.00),
('Seagate IronWolf NAS 4TB', 'HD Seagate IronWolf 4TB para NAS, 5400RPM, SATA 6Gb/s, otimizado para operação 24/7, suporte AgileArray', 'https://images1.kabum.com.br/produtos/fotos/84111/84111_index_gg.jpg', 'HDs', 'Seagate', 20, 699.90, 510.00),
('Western Digital Blue 2TB 7200RPM', 'HD Western Digital Blue 2TB 7200RPM SATA 6Gb/s 3.5", cache 256MB, confiabilidade premium', 'https://media.pichau.com.br/media/catalog/product/cache/2f958555330323e505eba7ce930bdf27/w/d/wd20ezbx.jpg', 'HDs', 'Western Digital', 35, 379.90, 265.00),
('WD Red Plus NAS 4TB', 'HD Western Digital Red Plus 4TB para NAS, 5400RPM, SATA 6Gb/s, NASware 3.0, 24/7 operation', 'https://http2.mlstatic.com/D_Q_NP_679226-MLA107323693927_022026-F.webp', 'HDs', 'Western Digital', 15, 749.90, 550.00),
('Toshiba P300 2TB 7200RPM', 'HD Toshiba P300 2TB 7200RPM SATA 6Gb/s 3.5", cache 128MB, alta performance desktop', 'https://media.pichau.com.br/media/catalog/product/cache/2f958555330323e505eba7ce930bdf27/h/d/hdwd120uzsva2.jpg', 'HDs', 'Toshiba', 30, 359.90, 250.00),
('Cooler Master MasterBox TD500 Mesh V2', 'Gabinete Cooler Master MasterBox TD500 Mesh V2, Mid Tower ATX, painel mesh frontal, 3 fans RGB inclusos, vidro temperado lateral', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-hJfv_lDlvJfpCSLgddx7CFxLKUxkW9IVvz_3vYng_3H5UxnRc9WSLlc&s=10', 'Gabinetes', 'Cooler Master', 20, 699.90, 490.00),
('Corsair 4000D Airflow', 'Gabinete Corsair 4000D Airflow, Mid Tower ATX, painel frontal mesh, 2 fans 120mm inclusos, excelente airflow', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS381IY9VH4cCbizS-gRu0c4TI-zCFBoujV3JKwINdpdjwZX3spcrbvEau&s=10', 'Gabinetes', 'Corsair', 18, 749.90, 530.00),
('NZXT H7 Flow', 'Gabinete NZXT H7 Flow, Mid Tower ATX, design minimalista, 3 fans 120mm inclusos, vidro temperado, excelente ventilação', 'https://patoloco.com.br/arquivos/produtos/imagens_adicionais/1840d818ad2f6351d8cfb4f9637fc009f911a5f6.jpeg', 'Gabinetes', 'NZXT', 15, 1199.90, 880.00),
('Lian Li PC-O11D Evo', 'Gabinete Lian Li PC-O11D Evo, Mid/Full Tower ATX, dual-chamber, 3 lados de vidro temperado, premium build quality', 'https://m.media-amazon.com/images/I/61ODz+JGyVL._AC_UF894,1000_QL80_.jpg', 'Gabinetes', 'Lian Li', 12, 1399.90, 1050.00),
('Redragon Chronos GC-903', 'Gabinete Redragon Chronos GC-903, Mid Tower ATX, vidro temperado lateral, iluminação RGB, custo-benefício gaming', 'https://http2.mlstatic.com/D_NQ_NP_898118-MLB92370258865_092025-O.webp', 'Gabinetes', 'Redragon', 25, 349.90, 240.00),
('Rise Mode Galaxy Glass 03', 'Gabinete Rise Mode Galaxy Glass 03, Mid Tower ATX, full vidro temperado, RGB, design elegante nacional', 'https://images9.kabum.com.br/produtos/fotos/527239/gabinete-gamer-rise-mode-galaxy-full-glass-mid-tower-atx-lateral-e-frente-em-vidro-temperado-preto-rm-ca-fg-b_1724784136_gg.jpg', 'Gabinetes', 'Rise Mode', 22, 399.90, 270.00),
('Cooler Master Hyper 212 Black Edition', 'Cooler CPU Cooler Master Hyper 212 Black Edition, 4 heatpipes, fan 120mm PWM, TDP 150W, compatível AM5/LGA1700', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQR9TjuIcncNhJzxQ0F3MTaCqApTE8JOwnfWSZfvLiAxw&s=10', 'Coolers', 'Cooler Master', 35, 199.90, 135.00),
('Corsair iCUE H100i Elite Capellix 240mm', 'Water Cooler Corsair iCUE H100i Elite Capellix 240mm, radiador dual 120mm, pump RGB, 2 fans LL120, TDP 250W+', 'https://images1.kabum.com.br/produtos/fotos/sync_mirakl/170681/Water-Cooler-Corsair-Icue-H100I-Elite-240mm-CW-9060046-WW_1702068492_gg.jpg', 'Coolers', 'Corsair', 20, 899.90, 650.00),
('Corsair iCUE H150i Elite LCD 360mm', 'Water Cooler Corsair iCUE H150i Elite LCD 360mm, tela LCD 2.1" no pump, radiador triple 120mm, TDP 350W+', 'https://images7.kabum.com.br/produtos/fotos/496647/water-cooler-corsair-icue-h150i-elite-lcd-xt-rgb-360mm-amd-e-intel-tela-lcd-ips-preto-cw-9060075-ww_1732795354_gg.jpg', 'Coolers', 'Corsair', 10, 1599.90, 1200.00),
('DeepCool AK620', 'Cooler CPU DeepCool AK620, dual tower, 6 heatpipes, 2 fans 120mm PWM, TDP 260W, silencioso', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzbA3GOT_M-HN8iT84WoITy8iahdvAmQlRggg8XNb9qg&s=10', 'Coolers', 'DeepCool', 25, 349.90, 240.00),
('DeepCool LS720 360mm Water Cooler', 'Water Cooler DeepCool LS720 360mm, radiador triplo, 3 fans ARGB 120mm, display LCD no pump, TDP 300W+', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8H_j909KMcKDhVgQOlKC1zbZoARfqTTmsEf3BZNQQmQ&s=10', 'Coolers', 'DeepCool', 12, 1099.90, 800.00),
('Thermalright Peerless Assassin 120 SE', 'Cooler CPU Thermalright Peerless Assassin 120 SE, dual tower, 6 heatpipes, 2 fans 120mm, TDP 260W, melhor custo-benefício', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQG7lepbb679NdWIFvsOHSbpmkUE19rlKS15uYZqHUxCg&s=10', 'Coolers', 'Thermalright', 30, 299.90, 205.00),
('Noctua NH-D15 Chromax Black', 'Cooler CPU Noctua NH-D15 Chromax Black, dual tower, 6 heatpipes, 2 fans NF-A15 140mm PWM, TDP 250W, o mais silencioso', 'https://m.media-amazon.com/images/I/91t48GBv8TL.jpg', 'Coolers', 'Noctua', 15, 699.90, 510.00),
('Corsair RM750x 750W 80+ Gold', 'Fonte Corsair RM750x 750W, certificação 80+ Gold, modular total, silent mode 0 RPM, 10 anos garantia', 'https://images5.kabum.com.br/produtos/fotos/156945/fonte-corsair-rm750x-750w-80-plus-gold-modular-preto-cp-9020199-ww_1628281649_gg.jpg', 'Fontes', 'Corsair', 25, 849.90, 620.00),
('Corsair HX1000 1000W 80+ Platinum', 'Fonte Corsair HX1000 1000W, certificação 80+ Platinum, modular total, para sistemas high-end RTX 4090', 'https://images9.kabum.com.br/produtos/fotos/sync_mirakl/185359/Fonte-Corsair-Atx-Hx1000-1000w-80plus-Platinum-FULL-MODULAR-PFC-ativo-Cp-9020139-ww_1667220520_gg.jpg', 'Fontes', 'Corsair', 12, 1499.90, 1100.00),
('Cooler Master MWE Gold 650W V2', 'Fonte Cooler Master MWE Gold 650W V2, certificação 80+ Gold, semi-modular, APFC, 120mm fan', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkfjXRKMDO1LYQ8jBl3vmHkKjmzhi0FSwF1EhMeLQtSg&s=10', 'Fontes', 'Cooler Master', 30, 599.90, 420.00),
('EVGA SuperNOVA 850W G6 80+ Gold', 'Fonte EVGA SuperNOVA 850W G6, certificação 80+ Gold, modular total, ECO Mode, 10 anos garantia', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdDzmFDqqx37_RpfTkdNN3m3HM1tTtDxq8cbnk6gpIqQ&s=10', 'Fontes', 'EVGA', 18, 899.90, 660.00),
('XPG Pylon 650W 80+ Bronze', 'Fonte XPG Pylon 650W, certificação 80+ Bronze, semi-modular, ótimo custo-benefício para builds médios', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSDAnZhUEKe6luES2iKSSolgspzRrjeMhO1b8Z-MGExQ&s=10', 'Fontes', 'XPG', 35, 449.90, 310.00),
('MSI MPG A850G PCIE5 850W 80+ Gold', 'Fonte MSI MPG A850G PCIe 5.0 850W, certificação 80+ Gold, modular total, cabo 16-pin nativo para RTX 4000', 'https://images3.kabum.com.br/produtos/fotos/397723/fonte-msi-mpg-a850g-pcie5-atx-3-0-850w-80-plus-gold-modular-pcie-5-0-pfc-ativo-bivolt-com-cabo-preto-306-7zp7b12-ce0-ean-824142293058_1699624089_gg.jpg', 'Fontes', 'MSI', 15, 999.90, 730.00),
('Gigabyte UD1000GM 1000W 80+ Gold', 'Fonte Gigabyte UD1000GM 1000W, certificação 80+ Gold, modular total, proteções completas OVP/OCP/SCP', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwRA9O2eJlWUV5D2Fud7AM0hQZiFlITu3GuM7EA_SDDUZQz-c_OCRqheI&s=10', 'Fontes', 'Gigabyte', 10, 1099.90, 800.00),
('Redragon K552 Kumara RGB Mecânico', 'Teclado mecânico Redragon K552 Kumara TKL (87 teclas), switches Red, RGB por tecla, anti-ghosting, construção metal', 'https://images2.kabum.com.br/produtos/fotos/93162/93162_2_1523620408_gg.jpg', 'Teclados', 'Redragon', 40, 299.90, 200.00),
('Corsair K70 RGB MK.2 Mecânico', 'Teclado mecânico Corsair K70 RGB MK.2, full size, switches Cherry MX Red, RGB por tecla, liga alumínio, USB passthrough', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_LcXWhcg3hWwBVUMwVRKSHM5uPQuCgEqr5Vuup9cIeQ&s=10', 'Teclados', 'Corsair', 20, 799.90, 580.00),
('Logitech G915 TKL Wireless RGB', 'Teclado mecânico sem fio Logitech G915 TKL, switches GL Linear, RGB, Bluetooth + USB, perfil low-profile, bateria 40h', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOwst8sCilYsDV_Z_BJC9hvtc5Vh_uYdxRKd-CIuUe1v9817BcKP9Csfs&s=10', 'Teclados', 'Logitech', 15, 1299.90, 960.00),
('Razer BlackWidow V4 Pro Mecânico', 'Teclado mecânico Razer BlackWidow V4 Pro, full size, switches Razer Green, Chroma RGB, Bluetooth/USB, dial multifunção', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRq_fb-G9L5aHr2Nii-SSWMLc9UeIwF9nCvdV0ney96_A&s=10', 'Teclados', 'Razer', 12, 1599.90, 1200.00),
('HyperX Alloy Origins 65 Mecânico', 'Teclado mecânico HyperX Alloy Origins 65, 65% layout, switches HyperX Aqua, RGB, liga alumínio, USB-C', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQorg6-n7ZX8XPZ26EyUz9jLmkhGojC-ikp0u2UpMluTw&s=10', 'Teclados', 'HyperX', 18, 649.90, 470.00),
('Logitech G502 X Plus Wireless', 'Mouse gamer sem fio Logitech G502 X Plus, sensor HERO 25K DPI, 13 botões programáveis, RGB LightForce, 89g', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3K1TIMW7-Rx3g2NSfXbCn9M8nqe716JjeOQIFqetodg&s=10', 'Mouses', 'Logitech', 25, 899.90, 650.00),
('Razer DeathAdder V3 HyperSpeed', 'Mouse gamer sem fio Razer DeathAdder V3 HyperSpeed, sensor Focus X 26K DPI, 5 botões, 64g ultra-leve', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSv_GE0Gp-mzcQgYf382hKtqhVirifEaNqlo7VIToLdw&s=10', 'Mouses', 'Razer', 20, 699.90, 510.00),
('HyperX Pulsefire Haste 2 Wireless', 'Mouse gamer sem fio HyperX Pulsefire Haste 2, sensor 26K DPI, HyperFlex cable, honeycomb design, 61g', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRezHDxstbKX32CuAfw1-nqzop-XD_J1mwvA9i1dnPrgg&s=10', 'Mouses', 'HyperX', 22, 599.90, 430.00),
('Redragon M711 Cobra Gaming', 'Mouse gamer Redragon M711 Cobra, sensor 10000 DPI, 7 botões programáveis, RGB, cabo trançado, ótimo custo', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJk1LHsdwC1DUutPwvoZcZ0rDkFz7vF6OxqWxdL7DNbg&s=10', 'Mouses', 'Redragon', 45, 149.90, 100.00),
('Corsair M75 Air Wireless', 'Mouse gamer sem fio Corsair M75 Air, sensor 26K DPI, 7 botões, 60g ultra-leve, bateria 200h, USB-C', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPwnbNUdkZlChP8-kdSvr2gAWPSfN7hdkbd9x52zIDhw&s=10', 'Mouses', 'Corsair', 18, 749.90, 540.00),
('HyperX Cloud II Wireless', 'Headset gamer sem fio HyperX Cloud II Wireless, driver 53mm, surround 7.1, bateria 30h, microfone destacável, USB', 'https://images7.kabum.com.br/produtos/fotos/143077/headset-sem-fio-gamer-hyperx-cloud-ii-7-1-drivers-53mm-preto-hhsc2x-ba-rd-g_1611584616_gg.jpg', 'Headsets', 'HyperX', 20, 699.90, 500.00),
('Razer BlackShark V2 Pro Wireless', 'Headset gamer sem fio Razer BlackShark V2 Pro, driver Razer Triforce 50mm, THX Spatial Audio, bateria 70h, ultra-leve', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxcN8QkQI6ewi-Z3Bf2HeryFuIJWtsZorNDlmqwjJHrA&s=10', 'Headsets', 'Razer', 15, 999.90, 730.00),
('Logitech G733 Lightspeed Wireless', 'Headset gamer sem fio Logitech G733 Lightspeed, driver 40mm, DTS 2.0, RGB, microfone cardioid, bateria 29h', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQkgrcscuCyMzHeji6cX636Vnn3EI4NdHY1qDkAF7vVQ&s=10', 'Headsets', 'Logitech', 18, 799.90, 580.00),
('Corsair HS80 RGB Wireless', 'Headset gamer sem fio Corsair HS80 RGB, driver 50mm neodímio, Dolby Atmos, microfone omnidirecional, bateria 20h', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOJLVdDBcBlRwPkHAL8RQQUmXor2y_VLPX6mMYTVJlbA&s=10', 'Headsets', 'Corsair', 16, 749.90, 540.00),
('JBL Quantum 600 Wireless', 'Headset gamer sem fio JBL Quantum 600, JBL QuantumSURROUND, driver 50mm, microfone flip-up, bateria 14h', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3jnE0wcS9LGIxZkVgu_peQCZqG_MaRJcW6SUycGrYIA&s=10', 'Headsets', 'JBL', 20, 649.90, 470.00),
('TP-Link Archer AX73 WiFi 6 Router', 'Roteador TP-Link Archer AX73 WiFi 6, AX5400, dual band, 6 antenas, OFDMA, MU-MIMO, porta WAN/LAN Gigabit', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjv5CKQagibPVwbLTEXY-wNKnUc4PMUX93eRvw5FYSiQ&s=10', 'Redes', 'TP-Link', 30, 699.90, 490.00),
('D-Link DIR-X3260 WiFi 6 AX3200', 'Roteador D-Link DIR-X3260 WiFi 6 AX3200, dual band, mesh compatível, 4 antenas, beamforming, QoS', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbdsP8WeSXx0l1MQ1rZQHn_cCGE8CFSCb-X9Z081J-4Q&s=10', 'Redes', 'D-Link', 25, 599.90, 420.00),
('Mercusys MR70X WiFi 6 AX1800', 'Roteador Mercusys MR70X WiFi 6 AX1800, dual band, 4 antenas, OFDMA, excelente custo-benefício', 'https://images1.kabum.com.br/produtos/fotos/sync_mirakl/201961/medium/Roteador-Mercusys-Wi-Fi-6-Dual-Band-1800mbps-Ofdma-Mu-Mimo-WPA3-BSS-IPV6-VPN-MR70X_1774379330.jpg', 'Redes', 'Mercusys', 35, 299.90, 200.00),
('MikroTik RB4011 Router', 'Roteador MikroTik RB4011iGS+RM, 10 portas Gigabit, 1x SFP+, RouterOS L5, para redes profissionais', 'https://http2.mlstatic.com/D_NQ_NP_751603-MLA99442322408_112025-O.webp', 'Redes', 'MikroTik', 10, 1599.90, 1200.00),
('Ubiquiti UniFi Dream Machine SE', 'Gateway Ubiquiti UniFi Dream Machine SE, 8 portas PoE Gigabit, 1 porta 10G SFP+, IPS/IDS, console UniFi integrado', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6tFa1r-jKMBNZx2gS68TjY4wCKI9bEou921Vt9VdNjw&s=10', 'Redes', 'Ubiquiti', 6, 3999.90, 3000.00),
('Hub USB-C 7 em 1 - HDMI 4K + USB 3.0 + SD', 'Hub USB-C 7 em 1 com saída HDMI 4K@60Hz, 3x USB 3.0, leitor SD/microSD, USB-C Power Delivery 100W, alumínio', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTW9QNxgk2ZjoP7SqjU-keuxd7a4DOXxwI6C9ecMrEtAA&s=10', 'Acessórios', 'Universal', 50, 149.90, 90.00),
('Adaptador USB-C para USB-A 3.0 (pack 3x)', 'Pack com 3 adaptadores USB-C macho para USB-A 3.0 fêmea, suporta dados até 5Gbps, compatível MacBook/Android/notebooks', 'https://m.media-amazon.com/images/I/51m-IiDd-bL._AC_UF1000,1000_QL80_.jpg', 'Acessórios', 'Universal', 80, 49.90, 28.00),
('Cabo HDMI 2.1 8K 3 metros', 'Cabo HDMI 2.1 ultra high speed 3 metros, suporta 8K@60Hz e 4K@120Hz, 48Gbps bandwidth, HDR, ARC/eARC', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4fA8JhdEQ7FlhWmSu-38SLIXRw67_7Kgum8zhS7Rk8w&s=10', 'Acessórios', 'Universal', 60, 89.90, 50.00),
('Cabo DisplayPort 1.4 8K 2 metros', 'Cabo DisplayPort 1.4 2 metros, suporta 8K@60Hz e 4K@144Hz, 32.4Gbps, para monitor gaming', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJI9TLUi4AJ2lL7wEwJ13eu9pdZkwm7D7EwMorbMoI4SUctaRBnXDKOUxE&s=10', 'Acessórios', 'Universal', 45, 79.90, 45.00),
('Leitor de Cartão USB-C SD/TF', 'Leitor de cartão multifuncional USB-C + USB-A, SD, microSD, CF, MS, velocidade USB 3.0 5Gbps', 'https://m.media-amazon.com/images/I/71uROLvRF2L._AC_UF1000,1000_QL80_.jpg', 'Acessórios', 'Universal', 55, 59.90, 35.00),
('Webcam Full HD 1080p 60fps com Microfone', 'Webcam USB Full HD 1080p 60fps, microfone duplo com cancelamento de ruído, autofoco, compatível com Windows/Mac/Linux', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhokBjuOTl5FH7-ROPG05CcOqRHHUNZV6Hr9G2FD-TQQ&s=10', 'Acessórios', 'Universal', 30, 299.90, 195.00),
('Suporte de Monitor Articulado VESA', 'Suporte articulado para monitor VESA 75x75 e 100x100, gira 360°, inclina +/- 45°, suporta até 10kg, fixação mesa', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXOQwkIhvE0Y2wiMoiTtdV56J-sNjnspD3fJCRqb_Drg&s=10', 'Acessórios', 'Universal', 25, 199.90, 130.00),
('Microfone USB Condensador Cardioide', 'Microfone USB condensador cardioide para streaming/podcast, frequência 20Hz-20kHz, tripé incluído, plug & play', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNjqGjBAxIYgpLhZsRUHXskCh3rE1fffn2D-AlaizGFQ&s=10', 'Acessórios', 'Universal', 20, 349.90, 230.00),
('Dell OptiPlex 7010 Micro Mini PC', 'Mini PC Dell OptiPlex 7010 Micro, Intel Core i5-13500T, 16GB DDR4, SSD 512GB, Windows 11 Pro, garantia 3 anos', 'https://images.tcdn.com.br/img/img_prod/740836/computador_dell_7010_optiplex_micro_core_i5_13500t_memoria_8gb_ssd_256gb_wifi_windows_11_pro_15813_1_197fa12c32b3d52d5b56572ceeb2c0ee.png', 'Corporativo', 'Dell', 10, 5499.90, 4200.00),
('Lenovo ThinkCentre M70q Tiny', 'Mini PC Lenovo ThinkCentre M70q Tiny, Intel Core i7-12700T, 32GB DDR4, SSD 1TB, Windows 11 Pro, vPro', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqPDgFINIPQ3uE2g61lpYxRxlLYdQHhanpcWR3OJX4ug&s=10', 'Corporativo', 'Lenovo', 8, 6999.90, 5300.00),
('HP ProDesk 400 G9 Mini', 'Mini PC HP ProDesk 400 G9 Mini, Intel Core i5-12500T, 16GB DDR4, SSD 256GB, Windows 11 Pro, gerenciamento HP Wolf', 'https://br-media.hptiendaenlinea.com/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/7/2/72S91LA-1_T1680776288.png', 'Corporativo', 'HP', 8, 4999.90, 3800.00),
('Synology DS923+ NAS 4 Bay', 'Storage NAS Synology DS923+, 4 baias, AMD Ryzen R1600, 4GB DDR4 ECC expansível 32GB, 2x 1GbE, 2x NVMe M.2', 'https://images3.kabum.com.br/produtos/fotos/447643/storage-synology-nas-ds423-2-7ghz-2gb-ddr4-torre-4-baias-ds423-_1685047168_gg.jpg', 'Corporativo', 'Synology', 5, 5999.90, 4500.00),
('QNAP TS-453E NAS 4 Bay', 'Storage NAS QNAP TS-453E, 4 baias, Intel Celeron J6412, 8GB DDR4, 2x 2.5GbE, HDMI 2.0, QTS e QuTS hero', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScv2IscdvT9nhuUViDh6C-V4bbzsjOYvmJQNjNYH2oOw&s=10', 'Corporativo', 'QNAP', 5, 5499.90, 4100.00),
('Dell PowerEdge T350 Tower Server', 'Servidor Dell PowerEdge T350 Tower, Intel Xeon E-2336 6C, 16GB ECC DDR4, SSD 480GB SATA, RAID H355, Windows Server 2022', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1CxjIdMGoqUwzdwUI_BUFvzORm-N6y1juF-Zq1stJqA&s=10', 'Corporativo', 'Dell', 3, 22999.90, 17500.00),
('HP Aruba Switch 24 Portas Gerenciável', 'Switch gerenciável HP Aruba 1930 24G, 24x Gigabit RJ45 + 4x SFP, PoE+ 195W, gerenciamento web/cloud', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkGtULmMssDZbPZFg8PLax_9cEeR9y21-FqmukzmVUnw&s=10', 'Corporativo', 'HP', 6, 3999.90, 3000.00),
('Ubiquiti UniFi AP WiFi 6 Pro', 'Access Point Ubiquiti UniFi U6 Pro WiFi 6, cobertura 300m², até 300 clientes simultâneos, 4x4 MU-MIMO, PoE', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCEmdgknHmpcblXoCUzH4ppXH1IPw1dvRzbqadCrgahg&s=10', 'Corporativo', 'Ubiquiti', 8, 2299.90, 1700.00),
('Nobreak APC Smart-UPS 1500VA', 'Nobreak APC Smart-UPS 1500VA Senoidal, 1000W, 8 tomadas, USB + serial, gerenciamento PowerChute, para servidores', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFl-mU67yqfaXFQi-2t7XvzX4J_nDt0kniLNyaOjHBpQ&s=10', 'Corporativo', 'APC', 10, 4299.90, 3200.00),
('Monitor Dell UltraSharp 27" 4K USB-C', 'Monitor Dell UltraSharp U2723DE 27", IPS 4K UHD, USB-C 90W, Hub USB, cor 100% sRGB / 98% DCI-P3, certificação Thunderbolt', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR09xEXGl-emozKc4VoUmimmz939qljs7_W_e12QwQR0A&s=10', 'Corporativo', 'Dell', 8, 5999.90, 4600.00),
('Lenovo ThinkVision T27h 27" QHD', 'Monitor Lenovo ThinkVision T27h 27" QHD IPS, resolução 2560x1440, USB-C 65W, hub USB 3.0, ajuste ergonômico completo', 'https://p3-ofp.static.pub/fes/cms/2022/11/11/lqqit0s07rv41ybwklq5rgr27t7x2q472682.png', 'Corporativo', 'Lenovo', 6, 3999.90, 3000.00),
('Kingston A400 240GB', 'SSD Kingston A400 240GB, interface SATA III 6Gb/s, leitura até 500MB/s, gravação até 350MB/s, formato 2.5 polegadas', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6odqM-UCtZKFq20HTl42tmrLvU9Vruz8V3WmmXDNDSg&s=10', 'SSD SATA', 'Kingston', 40, 189.90, 140.00),
('Kingston A400 480GB', 'SSD Kingston A400 480GB, interface SATA III 6Gb/s, leitura até 500MB/s, gravação até 450MB/s, formato 2.5 polegadas', 'https://media.kingston.com/kingston/product/ktc-product-ssd-a400-sa400s37-480gb-3-zm-lg.jpg', 'SSD SATA', 'Kingston', 35, 289.90, 220.00),
('Crucial BX500 500GB', 'SSD Crucial BX500 500GB, interface SATA III 6Gb/s, leitura até 540MB/s, gravação até 500MB/s, formato 2.5 polegadas', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnLZEXsWWB3XBYIETcJyVJmJRFhcoKy9gIFa55X2WS6Q&s=10', 'SSD SATA', 'Crucial', 28, 319.90, 245.00),
('WD Green 480GB', 'SSD WD Green 480GB, interface SATA III 6Gb/s, leitura até 545MB/s, formato 2.5 polegadas, baixo consumo de energia', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRV0_aSJt6JHxDapzoqI7qZSrtExYh1CWRJokmrdnmpKg&s=10', 'SSD SATA', 'Western Digital', 30, 299.90, 225.00),
('SanDisk SSD Plus 480GB', 'SSD SanDisk Plus 480GB, interface SATA III 6Gb/s, leitura até 535MB/s, gravação até 445MB/s, formato 2.5 polegadas', 'https://images4.kabum.com.br/produtos/fotos/sync_mirakl/256184/xlarge/SSD-Sandisk-Plus-480GB-SATA-Leitura-535MB-Grava-o-445MB_1759163085.jpg', 'SSD SATA', 'SanDisk', 22, 309.90, 235.00),
('Samsung 870 EVO 500GB', 'SSD Samsung 870 EVO 500GB, interface SATA III 6Gb/s, leitura até 560MB/s, gravação até 530MB/s, formato 2.5 polegadas', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9ZfrxtQ198TAXpOn-gqgzk4VTYpYrJuIq12eMObPYAw&s=10', 'SSD SATA', 'Samsung', 20, 429.90, 340.00);

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
