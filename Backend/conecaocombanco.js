const mysql = require('mysql2/promise');

async function conectar() {
    return await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',       // coloque sua senha aqui se tiver
        database: 'cadastro'
    });
}

async function executarQuery(query, params = []) {
    let conexao;
    try {
        conexao = await conectar();
        const [resultado] = await conexao.execute(query, params);
        return resultado;
    } catch (erro) {
        if (erro.code === 'ECONNREFUSED') {
            console.error('❌ Não foi possível conectar ao MySQL! Verifique se o MySQL está rodando na porta 3306.');
        } else if (erro.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('❌ Acesso negado ao MySQL! Verifique usuário e senha em conecaocombanco.js');
        } else if (erro.code === 'ER_BAD_DB_ERROR') {
            console.error('❌ Banco de dados "cadastro" não encontrado! Rode os scripts SQL da pasta /sql primeiro.');
        } else {
            console.error(`Erro ao executar query: ${erro.message}`);
        }
        throw erro;
    } finally {
        if (conexao) await conexao.end();
    }
}

module.exports = executarQuery;
