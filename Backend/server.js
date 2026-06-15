require('dotenv').config()
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const executarQuery = require('./conecaocombanco');

const app = express();

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

// Serve os arquivos do frontend automaticamente
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Status ─────────────────────────────────────────
app.get('/status', (req, res) => {
    res.json({ ok: true });
});

// ── Cadastro ────────────────────────────────────────
app.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, cpf_cnpj, telefone, endereco, senha } = req.body;

        if (!nome || !email || !cpf_cnpj || !senha) {
            return res.status(400).json({ erro: 'Nome, email, CPF/CNPJ e senha são obrigatórios' });
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
        const { nome, telefone, endereco } = req.body;

        if (!nome) {
            return res.status(400).json({ erro: 'Nome é obrigatório' });
        }

        await executarQuery(
            'UPDATE usuario SET nome = ?, telefone = ?, endereco = ? WHERE id = ?',
            [nome, telefone || null, endereco || null, id]
        );

        res.json({ mensagem: 'Perfil atualizado com sucesso!' });

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


// ── Categorias de produtos ──────────────────────────
app.get('/categorias', async (req, res) => {
    try {
        const resultado = await executarQuery(
            'SELECT DISTINCT categoria FROM produtos WHERE ativo = 1 AND categoria IS NOT NULL ORDER BY categoria'
        );
        res.json(resultado.map(r => r.categoria));
    } catch (erro) {
        console.error('Erro ao buscar categorias:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Produto individual ──────────────────────────────
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

// ── Inicia o servidor ───────────────────────────────
app.listen(3000, () => {
    console.log('Servidor Nexus rodando em http://localhost:3000');
});