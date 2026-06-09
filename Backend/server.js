const express = require('express');
const path = require('path');
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

        // Valida campos obrigatórios
        if (!nome || !email || !cpf_cnpj || !senha) {
            return res.status(400).json({ erro: 'Nome, email, CPF/CNPJ e senha são obrigatórios' });
        }

        // Verifica se email já existe
        const emailExiste = await executarQuery(
            'SELECT id FROM usuario WHERE email = ?',
            [email]
        );
        if (emailExiste.length > 0) {
            return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
        }

        // Verifica se CPF/CNPJ já existe
        const cpfExiste = await executarQuery(
            'SELECT id FROM usuario WHERE cpf_cnpj = ?',
            [cpf_cnpj]
        );
        if (cpfExiste.length > 0) {
            return res.status(409).json({ erro: 'Este CPF/CNPJ já está cadastrado' });
        }

        // Insere o novo usuário
        const resultado = await executarQuery(
            'INSERT INTO usuario (nome, email, cpf_cnpj, telefone, endereco, senha) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, email, cpf_cnpj, telefone || null, endereco || null, senha]
        );

        res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso!',
            usuario: {
                id: resultado.insertId,
                nome,
                email
            }
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

        // Busca o usuário pelo email
        const resultado = await executarQuery(
            'SELECT * FROM usuario WHERE email = ?',
            [email]
        );

        if (resultado.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const usuario = resultado[0];

        // Compara a senha
        if (senha !== usuario.senha) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        // Login ok
        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (erro) {
        console.error('Erro no login:', erro);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// ── Lista usuários (só pra teste) ───────────────────
app.get('/usuarios', async (req, res) => {
    try {
        const resultado = await executarQuery('SELECT id, nome, email, criado_em FROM usuario');
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ── Inicia o servidor ───────────────────────────────
app.listen(3000, () => {
    console.log('Servidor Nexus rodando em http://localhost:3000');
});
