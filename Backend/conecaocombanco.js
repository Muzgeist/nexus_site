const mysql = require('mysql2/promise');

// ── Conexão com o banco ──────────────────────────────
// Em produção (Railway) usamos as variáveis que o plugin MySQL injeta
// automaticamente no serviço (MYSQLHOST, MYSQLPORT, MYSQLUSER,
// MYSQLPASSWORD, MYSQLDATABASE — ou a MYSQL_URL pronta).
// Em desenvolvimento local, caem nos valores padrão de sempre.
async function conectar() {
    if (process.env.MYSQL_URL) {
        return await mysql.createConnection(process.env.MYSQL_URL);
    }

    return await mysql.createConnection({
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASS,
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'Banco'
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
