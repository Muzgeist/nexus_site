const express = require('express');
const executarQuery = require('./conecaocombanco');

const app = express();

app.use(express.json());

app.get('/status', (req, res) => {
    res.json({ ok: true });
});

app.get('/usuarios', async (req, res) => {
    try {

        const resultado = await executarQuery(
            'SELECT * FROM usuario'
        );

        res.json(resultado);

    } catch (erro) {

        res.status(500).json({
            erro: erro.message
        });

    }
});
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Verifica se os campos vieram
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        // Busca o usuário pelo email
        const resultado = await executarQuery(
            'SELECT * FROM usuario WHERE email = ?',
            [email]
        );

        // Se não achou ninguém com esse email
        if (resultado.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const usuario = resultado[0];

        // Compara a senha digitada com a do banco
        if (senha !== usuario.senha) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        // Login ok — retorna os dados públicos do usuário
        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// essa porra aqui que vai mostrar coisa no front 
app.listen(3000, () => {
    console.log('o banderclay tá funcionando');
});