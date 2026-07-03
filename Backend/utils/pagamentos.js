/* ============================================================
   NEXUS IMPORTS — Utilitários de Pagamento
   - Gerador de payload Pix (padrão BR Code / EMV do Bacen)
   - Gerador de identificadores de transação
   - Gerador de "linha digitável" de boleto para DEMONSTRAÇÃO

   ⚠️ IMPORTANTE — LEIA ANTES DE USAR EM PRODUÇÃO:
   Este módulo monta o payload Pix no formato correto (igual ao
   que qualquer banco gera), mas para o QR Code realmente liquidar
   em uma conta de verdade você precisa:
     1) Usar uma CHAVE PIX real, registrada na conta bancária da
        Nexus Imports (defina PIX_KEY no arquivo .env do Backend).
     2) Ter um recebimento automático — em produção isso normalmente
        vem de um PSP (Mercado Pago, PagSeguro/PagBank, Gerencianet/Efí,
        Asaas, Stripe, etc.) que avisa seu backend via webhook quando
        o cliente realmente pagou. Aqui, como não há um PSP conectado,
        a confirmação é feita por um botão de simulação na tela de
        pagamento (ver rota POST /pagamento/pix/:txid/confirmar).

   O mesmo vale para o BOLETO: a "linha digitável" gerada aqui é só
   para fins de layout/demonstração. Um boleto válido (que apareça
   no Itaú/Bradesco/Caixa etc. do cliente) exige convênio de cobrança
   com um banco ou um PSP de boletos.
   ============================================================ */

const crypto = require('crypto');

// ── Monta um campo TLV (ID + tamanho + valor) do padrão EMV ──────
function tlv(id, valor) {
    const tamanho = String(valor.length).padStart(2, '0');
    return `${id}${tamanho}${valor}`;
}

// ── CRC16-CCITT (polinômio 0x1021, init 0xFFFF) — exigido pelo Bacen ──
function crc16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ── Gera um TXID curto e alfanumérico (exigência do padrão Pix) ──
function gerarTxid() {
    return crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 chars
}

/**
 * Gera o payload Pix completo ("Pix Copia e Cola") no padrão BR Code.
 * @param {Object} opts
 * @param {string} opts.chave    Chave Pix do recebedor (email, CPF/CNPJ, telefone ou aleatória)
 * @param {string} opts.nome     Nome do recebedor (máx. 25 caracteres)
 * @param {string} opts.cidade   Cidade do recebedor (máx. 15 caracteres)
 * @param {number} opts.valor    Valor da cobrança
 * @param {string} opts.txid     Identificador da transação (alfanumérico, máx. 25)
 */
function gerarPayloadPix({ chave, nome, cidade, valor, txid }) {
    const nomeF   = (nome  || 'NEXUS IMPORTS').normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25);
    const cidadeF = (cidade || 'CONTAGEM').normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15);
    const txidF   = ((txid || '***').replace(/[^A-Za-z0-9]/g, '') || '***').substring(0, 25);
    const valorF  = Number(valor).toFixed(2);

    const merchantAccountInfo =
        tlv('00', 'br.gov.bcb.pix') +
        tlv('01', chave);

    const additionalData = tlv('05', txidF);

    let payload =
        tlv('00', '01') +                 // Payload Format Indicator
        tlv('26', merchantAccountInfo) +  // Merchant Account Information (Pix)
        tlv('52', '0000') +               // Merchant Category Code
        tlv('53', '986') +                // Moeda (BRL)
        tlv('54', valorF) +               // Valor da transação
        tlv('58', 'BR') +                 // País
        tlv('59', nomeF) +                // Nome do recebedor
        tlv('60', cidadeF) +              // Cidade do recebedor
        tlv('62', additionalData);        // Dados adicionais (txid)

    payload += '6304'; // ID + tamanho fixo do campo CRC, sem o valor ainda
    const crc = crc16(payload);
    return payload + crc;
}

/**
 * Gera uma "linha digitável" de boleto no formato visual padrão (47 dígitos)
 * para fins de DEMONSTRAÇÃO. Não é um boleto bancário real/registrado.
 */
function gerarLinhaDigitavelDemo() {
    const grupo = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
    return `${grupo(5)}.${grupo(5)} ${grupo(5)}.${grupo(6)} ${grupo(5)}.${grupo(6)} ${grupo(1)} ${grupo(14)}`;
}

function gerarCodigoBoleto() {
    return 'BOL' + crypto.randomBytes(7).toString('hex').toUpperCase(); // 17 chars
}

module.exports = {
    gerarPayloadPix,
    gerarTxid,
    gerarLinhaDigitavelDemo,
    gerarCodigoBoleto
};
