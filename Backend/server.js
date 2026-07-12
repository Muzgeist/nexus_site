require('dotenv').config()
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const executarQuery = require('./conecaocombanco');
const { gerarPayloadPix, gerarTxid, gerarLinhaDigitavelDemo, gerarCodigoBoleto } = require('./utils/pagamentos');

const app = express();

// ── Centro de distribuição (origem fixa para o rastreio no mapa) ──
const ARMAZEM_ORIGEM = {
    nome: 'Centro de Distribuição Nexus Imports — Contagem, MG',
    lat: -19.937916807774236,
    lng: -44.03622928045531
};

// ── Middlewares ────────────────────────────────────
app.use(express.json());

// Permite que o frontend (mesmo aberto direto no browser) acesse o backend
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Serve os arquivos do frontend automaticamente (apenas em desenvolvimento
// local, quando as pastas Backend/ e frontend/ estão lado a lado).
// Em produção o frontend roda como um serviço separado no Railway.
const frontendPath = path.join(__dirname, '../frontend');
if (require('fs').existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('/', (req, res) => {
        res.sendFile(path.join(frontendPath, 'html/telaprincipal.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.json({ ok: true, service: 'nexus-backend' });
    });
}

// ── Status ─────────────────────────────────────────
app.get('/status', (req, res) => {
    res.json({ ok: true });
});

// ── Cadastro ────────────────────────────────────────
app.post('/cadastro', async (req, res) => {
    try {
        let { nome, email, cpf_cnpj, telefone, endereco, senha } = req.body;

        // Remove pontuação (o frontend manda mascarado, ex: "48.685.465/4654-36",
        // mas as colunas do banco guardam só os dígitos)
        if (cpf_cnpj) cpf_cnpj = cpf_cnpj.replace(/\D/g, '');
        if (telefone) telefone = telefone.replace(/\D/g, '');

        if (!nome || !email || !cpf_cnpj || !senha) {
            return res.status(400).json({ erro: 'Nome, email, CPF/CNPJ e senha são obrigatórios' });
        }

        if (cpf_cnpj.length !== 11 && cpf_cnpj.length !== 14) {
            return res.status(400).json({ erro: 'CPF/CNPJ inválido' });
        }

        const emailExiste = await executarQuery(
            'SELECT id FROM usuario WHERE email = ?',
            [email]
        );
        if (emailExiste.length > 0) {
            return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
        }

        const cpfExiste = await executarQuery(
            'SELECT id FROM usuario WHERE cpf_cnpj = ?',
            [cpf_cnpj]
        );
        if (cpfExiste.length > 0) {
            return res.status(409).json({ erro: 'Este CPF/CNPJ já está cadastrado' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const resultado = await executarQuery(
            'INSERT INTO usuario (nome, email, cpf_cnpj, telefone, endereco, senha) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, email, cpf_cnpj, telefone || null, endereco || null, senhaHash]
        );

        res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso!',
            usuario: { id: resultado.insertId, nome, email }
        });

    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Login ───────────────────────────────────────────
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        const resultado = await executarQuery(
            'SELECT * FROM usuario WHERE email = ?',
            [email]
        );

        if (resultado.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const usuario = resultado[0];

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone,
                endereco: usuario.endereco,
                cpf_cnpj: usuario.cpf_cnpj
            }
        });

    } catch (erro) {
        console.error('Erro no login:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Atualizar perfil do usuário ─────────────────────
app.put('/usuario/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let { nome, email, telefone, endereco } = req.body;

        if (telefone) telefone = telefone.replace(/\D/g, '');

        if (!nome) {
            return res.status(400).json({ erro: 'Nome é obrigatório' });
        }

        if (email) {
            const emailEmUso = await executarQuery(
                'SELECT id FROM usuario WHERE email = ? AND id != ?',
                [email, id]
            );
            if (emailEmUso.length > 0) {
                return res.status(409).json({ erro: 'Este e-mail já está em uso por outra conta' });
            }
        }

        await executarQuery(
            'UPDATE usuario SET nome = ?, email = COALESCE(?, email), telefone = ?, endereco = ? WHERE id = ?',
            [nome, email || null, telefone || null, endereco || null, id]
        );

        const atualizado = await executarQuery(
            'SELECT id, nome, email, telefone, endereco, cpf_cnpj FROM usuario WHERE id = ?',
            [id]
        );

        res.json({
            mensagem: 'Perfil atualizado com sucesso!',
            usuario: atualizado[0]
        });

    } catch (erro) {
        console.error('Erro ao atualizar perfil:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Produtos (carrinho) ─────────────────────────────
app.get('/produtos', async (req, res) => {
    try {
        const { categoria, busca } = req.query;

        let query = 'SELECT * FROM vw_estoque_resumo WHERE 1=1';
        const params = [];

        if (categoria) {
            query += ' AND categoria = ?';
            params.push(categoria);
        }

        if (busca) {
            query += ' AND (produto LIKE ? OR descricao LIKE ? OR marca LIKE ?)';
            const termo = `%${busca}%`;
            params.push(termo, termo, termo);
        }

        query += ' ORDER BY categoria, produto';

        const resultado = await executarQuery(query, params);
        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Categorias disponíveis (usado no filtro de telaprodutos) ──
app.get('/categorias', async (req, res) => {
    try {
        const resultado = await executarQuery(
            'SELECT DISTINCT categoria FROM produtos WHERE ativo = 1 ORDER BY categoria'
        );
        res.json(resultado.map(linha => linha.categoria));

    } catch (erro) {
        console.error('Erro ao buscar categorias:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Detalhe de um produto (usado em telaproduto.html) ──
app.get('/produto/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await executarQuery(
            'SELECT * FROM vw_estoque_resumo WHERE id = ?',
            [id]
        );

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        res.json(resultado[0]);

    } catch (erro) {
        console.error('Erro ao buscar produto:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Finalizar compra ────────────────────────────────
app.post('/compra', async (req, res) => {
    try {
        const { usuario_id, itens } = req.body;

        // itens = [{ produto_id, quantidade }, ...]
        if (!usuario_id || !itens || itens.length === 0) {
            return res.status(400).json({ erro: 'Dados de compra inválidos' });
        }

        // Busca dados do usuário
        const usuarios = await executarQuery(
            'SELECT * FROM usuario WHERE id = ?',
            [usuario_id]
        );
        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        const usuario = usuarios[0];

        if (!usuario.endereco) {
            return res.status(400).json({ erro: 'Cadastre um endereço antes de comprar' });
        }

        const comprasIds = [];

        for (const item of itens) {
            const { produto_id, quantidade } = item;

            // Busca produto e valida estoque
            const produtos = await executarQuery(
                'SELECT * FROM produtos WHERE id = ? AND ativo = 1',
                [produto_id]
            );
            if (produtos.length === 0) {
                return res.status(404).json({ erro: `Produto ID ${produto_id} não encontrado` });
            }
            const produto = produtos[0];

            if (produto.quantidade < quantidade) {
                return res.status(400).json({
                    erro: `Estoque insuficiente para "${produto.produto}". Disponível: ${produto.quantidade}`
                });
            }

            // Insere a compra
            const resultado = await executarQuery(
                `INSERT INTO compra
                    (usuario_id, nome, email, cpf_cnpj, telefone, endereco_entrega,
                     produto_id, produto, quantidade, valor_unitario)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    usuario.id,
                    usuario.nome,
                    usuario.email,
                    usuario.cpf_cnpj,
                    usuario.telefone || null,
                    usuario.endereco,
                    produto.id,
                    produto.produto,
                    quantidade,
                    produto.valor_unitario
                ]
            );

            // Desconta do estoque
            await executarQuery(
                'UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?',
                [quantidade, produto.id]
            );

            comprasIds.push(resultado.insertId);
        }

        res.status(201).json({
            mensagem: 'Compra realizada com sucesso!',
            compras_ids: comprasIds
        });

    } catch (erro) {
        console.error('Erro ao finalizar compra:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Histórico de compras do usuário ─────────────────
app.get('/compras/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;

        const resultado = await executarQuery(
            `SELECT * FROM compra
             WHERE usuario_id = ?
             ORDER BY criado_em DESC`,
            [usuario_id]
        );

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao buscar compras:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Cancelar compra ─────────────────────────────────
app.put('/compra/:id/cancelar', async (req, res) => {
    try {
        const { id } = req.params;

        const compras = await executarQuery(
            'SELECT * FROM compra WHERE id = ?',
            [id]
        );

        if (compras.length === 0) {
            return res.status(404).json({ erro: 'Compra não encontrada' });
        }

        const compra = compras[0];

        if (['ENVIADO', 'ENTREGUE'].includes(compra.status_entrega)) {
            return res.status(400).json({ erro: 'Não é possível cancelar uma compra já enviada ou entregue' });
        }

        await executarQuery(
            `UPDATE compra
             SET status_pagamento = 'CANCELADO', status_entrega = 'CANCELADO'
             WHERE id = ?`,
            [id]
        );

        // Devolve ao estoque se já tinha sido pago
        if (compra.status_pagamento === 'PAGO') {
            await executarQuery(
                'UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?',
                [compra.quantidade, compra.produto_id]
            );
        }

        res.json({ mensagem: 'Compra cancelada com sucesso!' });

    } catch (erro) {
        console.error('Erro ao cancelar compra:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Lista usuários (protegida por chave interna) ────
app.get('/usuarios', async (req, res) => {
    const chave = req.headers['x-admin-key'];
    if (chave !== process.env.ADMIN_KEY) {
        return res.status(403).json({ erro: 'Acesso negado' });
    }
    try {
        const resultado = await executarQuery('SELECT id, nome, email, criado_em FROM usuario');
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================================
// PAGAMENTOS — Pix, Cartão (Crédito/Débito) e Boleto
//
// Todos os botões de "Comprar" do frontend (produto, carrinho —
// individual, selecionados ou tudo) terminam em uma destas rotas,
// acionadas pela tela telapagamento.html, que recebe os itens e o
// valor corretos de acordo com o botão que a chamou.
// ============================================================

// ── Helper: valida usuário ──────────────────────────
async function buscarUsuarioValido(usuario_id) {
    const usuarios = await executarQuery('SELECT * FROM usuario WHERE id = ?', [usuario_id]);
    if (usuarios.length === 0) {
        const erro = new Error('Usuário não encontrado');
        erro.status = 404;
        throw erro;
    }
    return usuarios[0];
}

// ── Helper: cria as linhas de `compra` de um pedido inteiro ────
// (um carrinho com 3 produtos gera 3 linhas, todas com o mesmo
// pix_txid/boleto_codigo, para poderem ser confirmadas juntas)
async function criarLinhasDePedido({ usuario, itens, forma_pagamento, parcelas = 1, pago = false, pix_txid = null, boleto_codigo = null, boleto_vencimento = null, enderecoEntrega = null }) {
    const comprasIds = [];
    let valorTotal = 0;

    const enderecoFinal = (enderecoEntrega && enderecoEntrega.trim()) ? enderecoEntrega.trim() : usuario.endereco;
    if (!enderecoFinal) {
        const erro = new Error('Informe um endereço de entrega para continuar');
        erro.status = 400;
        throw erro;
    }

    for (const item of itens) {
        const { produto_id, quantidade } = item;

        const produtos = await executarQuery(
            'SELECT * FROM produtos WHERE id = ? AND ativo = 1',
            [produto_id]
        );
        if (produtos.length === 0) {
            const erro = new Error(`Produto ID ${produto_id} não encontrado`);
            erro.status = 404;
            throw erro;
        }
        const produto = produtos[0];

        if (produto.quantidade < quantidade) {
            const erro = new Error(`Estoque insuficiente para "${produto.produto}". Disponível: ${produto.quantidade}`);
            erro.status = 400;
            throw erro;
        }

        const statusPagamento = pago ? 'PAGO' : 'PENDENTE';
        const pagoEm          = pago ? new Date() : null;
        const statusEntrega   = pago ? 'PREPARANDO' : 'AGUARDANDO';

        const resultado = await executarQuery(
            `INSERT INTO compra
                (usuario_id, nome, email, cpf_cnpj, telefone, endereco_entrega,
                 produto_id, produto, quantidade, valor_unitario,
                 forma_pagamento, parcelas, pix_txid, boleto_codigo, boleto_vencimento,
                 status_pagamento, pago_em, status_entrega)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuario.id, usuario.nome, usuario.email, usuario.cpf_cnpj, usuario.telefone || null, enderecoFinal,
                produto.id, produto.produto, quantidade, produto.valor_unitario,
                forma_pagamento, parcelas, pix_txid, boleto_codigo, boleto_vencimento,
                statusPagamento, pagoEm, statusEntrega
            ]
        );

        // Desconta do estoque imediatamente (mesmo padrão já usado em /compra)
        await executarQuery(
            'UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?',
            [quantidade, produto.id]
        );

        comprasIds.push(resultado.insertId);
        valorTotal += quantidade * parseFloat(produto.valor_unitario);
    }

    return { comprasIds, valorTotal };
}

// ── Pix: gera a cobrança (QR Code / Copia e Cola) ───
app.post('/pagamento/pix', async (req, res) => {
    try {
        const { usuario_id, itens, endereco_entrega } = req.body;
        if (!usuario_id || !itens || itens.length === 0) {
            return res.status(400).json({ erro: 'Dados de pagamento inválidos' });
        }

        const usuario = await buscarUsuarioValido(usuario_id);
        const txid = gerarTxid();

        const { comprasIds, valorTotal } = await criarLinhasDePedido({
            usuario, itens, forma_pagamento: 'PIX', pago: false, pix_txid: txid, enderecoEntrega: endereco_entrega
        });

        const payload = gerarPayloadPix({
            chave:  process.env.PIX_KEY          || 'pagamentos@nexusimports.com.br',
            nome:   process.env.PIX_MERCHANT_NAME || 'NEXUS IMPORTS',
            cidade: process.env.PIX_MERCHANT_CITY || 'CONTAGEM',
            valor:  valorTotal,
            txid
        });

        res.status(201).json({
            mensagem: 'Cobrança Pix gerada com sucesso!',
            compras_ids: comprasIds,
            txid,
            valor_total: valorTotal,
            pix_copia_cola: payload
        });
    } catch (erro) {
        console.error('Erro ao gerar pagamento Pix:', erro);
        res.status(erro.status || 500).json({ erro: erro.message || 'Erro interno no servidor' });
    }
});

// ── Pix: confirma o pagamento ───────────────────────
// ⚠️ SIMULAÇÃO: sem um PSP conectado, não existe webhook real avisando
// que o cliente pagou. Esta rota é chamada pelo botão de demonstração
// "Já paguei" na tela de pagamento. Em produção, substitua a chamada
// deste botão por um webhook do seu gateway Pix (Mercado Pago, Efí, etc.).
app.post('/pagamento/pix/:txid/confirmar', async (req, res) => {
    try {
        const { txid } = req.params;

        const compras = await executarQuery(
            `SELECT * FROM compra WHERE pix_txid = ? AND status_pagamento = 'PENDENTE'`,
            [txid]
        );
        if (compras.length === 0) {
            return res.status(404).json({ erro: 'Cobrança Pix não encontrada ou já processada' });
        }

        await executarQuery(`UPDATE compra SET status_pagamento = 'PAGO' WHERE pix_txid = ?`, [txid]);

        res.json({ mensagem: 'Pagamento Pix confirmado!', compras_ids: compras.map(c => c.id) });
    } catch (erro) {
        console.error('Erro ao confirmar Pix:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Cartão de Crédito / Débito ──────────────────────
// ⚠️ Nenhum número de cartão completo ou CVV chega a esta rota — o
// frontend valida o formato no navegador e envia só bandeira/últimos
// 4 dígitos/nome, só para exibição no histórico. Para cobrar de verdade
// é necessário integrar um gateway de pagamento real (ele que recebe os
// dados sensíveis do cartão, nunca o seu próprio servidor).
app.post('/pagamento/cartao', async (req, res) => {
    try {
        const { usuario_id, itens, forma_pagamento, parcelas, cartao, endereco_entrega } = req.body;

        if (!usuario_id || !itens || itens.length === 0) {
            return res.status(400).json({ erro: 'Dados de pagamento inválidos' });
        }
        if (!['CREDITO', 'DEBITO'].includes(forma_pagamento)) {
            return res.status(400).json({ erro: 'Forma de pagamento inválida' });
        }
        if (!cartao || !cartao.numero_final || !cartao.bandeira || !cartao.nome_titular) {
            return res.status(400).json({ erro: 'Dados do cartão incompletos' });
        }

        const usuario = await buscarUsuarioValido(usuario_id);

        const { comprasIds, valorTotal } = await criarLinhasDePedido({
            usuario, itens,
            forma_pagamento,
            parcelas: forma_pagamento === 'CREDITO' ? (parseInt(parcelas) || 1) : 1,
            pago: true,
            enderecoEntrega: endereco_entrega
        });

        res.status(201).json({
            mensagem: 'Pagamento aprovado!',
            compras_ids: comprasIds,
            valor_total: valorTotal
        });
    } catch (erro) {
        console.error('Erro ao processar pagamento com cartão:', erro);
        res.status(erro.status || 500).json({ erro: erro.message || 'Erro interno no servidor' });
    }
});

// ── Boleto: gera o boleto ────────────────────────────
app.post('/pagamento/boleto', async (req, res) => {
    try {
        const { usuario_id, itens, endereco_entrega } = req.body;
        if (!usuario_id || !itens || itens.length === 0) {
            return res.status(400).json({ erro: 'Dados de pagamento inválidos' });
        }

        const usuario = await buscarUsuarioValido(usuario_id);

        const codigo = gerarCodigoBoleto();
        const vencimento = new Date();
        vencimento.setDate(vencimento.getDate() + 3);
        const vencimentoStr = vencimento.toISOString().slice(0, 10);

        const { comprasIds, valorTotal } = await criarLinhasDePedido({
            usuario, itens, forma_pagamento: 'BOLETO', pago: false,
            boleto_codigo: codigo, boleto_vencimento: vencimentoStr, enderecoEntrega: endereco_entrega
        });

        res.status(201).json({
            mensagem: 'Boleto gerado com sucesso!',
            compras_ids: comprasIds,
            valor_total: valorTotal,
            boleto_codigo: codigo,
            linha_digitavel: gerarLinhaDigitavelDemo(),
            vencimento: vencimentoStr
        });
    } catch (erro) {
        console.error('Erro ao gerar boleto:', erro);
        res.status(erro.status || 500).json({ erro: erro.message || 'Erro interno no servidor' });
    }
});

// ── Boleto: confirma o pagamento (SIMULAÇÃO — ver nota do Pix acima) ──
app.post('/pagamento/boleto/:codigo/confirmar', async (req, res) => {
    try {
        const { codigo } = req.params;

        const compras = await executarQuery(
            `SELECT * FROM compra WHERE boleto_codigo = ? AND status_pagamento = 'PENDENTE'`,
            [codigo]
        );
        if (compras.length === 0) {
            return res.status(404).json({ erro: 'Boleto não encontrado ou já processado' });
        }

        await executarQuery(`UPDATE compra SET status_pagamento = 'PAGO' WHERE boleto_codigo = ?`, [codigo]);

        res.json({ mensagem: 'Pagamento do boleto confirmado!', compras_ids: compras.map(c => c.id) });
    } catch (erro) {
        console.error('Erro ao confirmar boleto:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ============================================================
// RASTREIO DE ENVIO
// Calcula a posição estimada do pedido no trajeto (origem fixa do
// armazém até o endereço de entrega do cliente) com base no status
// e nas datas registradas. O frontend usa isso para desenhar a rota
// real no Google Maps e posicionar o marcador do pacote.
// ============================================================
app.get('/pedido/:id/rastreio', async (req, res) => {
    try {
        const { id } = req.params;

        const compras = await executarQuery('SELECT * FROM compra WHERE id = ?', [id]);
        if (compras.length === 0) {
            return res.status(404).json({ erro: 'Pedido não encontrado' });
        }
        const pedido = compras[0];

        let progresso = 0;
        if (pedido.status_entrega === 'ENTREGUE') {
            progresso = 100;
        } else if (pedido.status_entrega === 'ENVIADO') {
            const inicio = new Date(pedido.pago_em || pedido.criado_em).getTime();
            const DURACAO_TRANSITO_MS = 4 * 24 * 60 * 60 * 1000; // 4 dias estimados de transporte
            const decorrido = Date.now() - inicio;
            progresso = Math.min(96, Math.max(4, Math.round((decorrido / DURACAO_TRANSITO_MS) * 100)));
        } else if (pedido.status_entrega === 'PREPARANDO') {
            progresso = 2;
        }

        const baseData = pedido.pago_em || pedido.criado_em;
        const eta = new Date(baseData);
        eta.setDate(eta.getDate() + 5);

        res.json({
            pedido_id: pedido.id,
            produto: pedido.produto,
            status_pagamento: pedido.status_pagamento,
            status_entrega: pedido.status_entrega,
            criado_em: pedido.criado_em,
            pago_em: pedido.pago_em,
            entregue_em: pedido.entregue_em,
            origem: ARMAZEM_ORIGEM,
            destino_endereco: pedido.endereco_entrega,
            progresso_pct: progresso,
            eta_estimada: eta.toISOString().slice(0, 10)
        });
    } catch (erro) {
        console.error('Erro ao buscar rastreio:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Inicia o servidor ───────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Nexus rodando na porta ${PORT}`);
});