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

app.listen(3000, () => {
    console.log('o banderclay tá funcionando');
});