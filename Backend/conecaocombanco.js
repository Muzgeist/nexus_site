const mysql = require('mysql2/promise');

async function conectar() {
    return await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'cadastro'
    });
}

async function executarQuery(query, params = []) {
    const conexao = await conectar();

    try {
        const [resultado] = await conexao.execute(query, params);
        return resultado;
    } catch (erro) {
        console.log(`Erro ao executar query: ${erro}`);
        throw erro;
    } finally {
        await conexao.end();
    }
}

module.exports = executarQuery;