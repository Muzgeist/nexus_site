/* ============================================================
   NEXUS IMPORTS — Servidor estático do frontend
   Usado apenas para hospedar o frontend como serviço separado
   no Railway. Não fala com o banco nem tem lógica de negócio —
   só entrega os arquivos HTML/CSS/JS.
   ============================================================ */

const express = require('express');
const path = require('path');

const app = express();

// Serve tudo dentro de frontend/ (html, css, js, img) mantendo
// os caminhos relativos que as próprias páginas já usam
// (ex: telaprincipal.html -> ../css/..., telaprodutos.html, etc.)
app.use(express.static(__dirname));

// A raiz do site abre a tela principal
app.get('/', (req, res) => {
    res.redirect('/html/telaprincipal.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Frontend Nexus rodando na porta ${PORT}`);
});
