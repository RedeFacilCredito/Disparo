// leadsflow-dev/backend/services/baileys.js

const axios = require('axios');

// ATENÇÃO: A URL da sua ponte Baileys.
// Como a ponte não está no Docker, usamos o IP público e a porta dela.
const BAILEYS_API_URL = process.env.BAILEYS_API_URL || 'http://31.97.64.133:3001'; 
const BAILEYS_API_SECRET = process.env.BAILEYS_API_SECRET;

/**
 * Envia uma mensagem de texto simples via a ponte Baileys.
 * @param {object} payload - O objeto contendo os detalhes da mensagem.
 * @param {string} payload.instanceId - O ID da instância/inbox do Chatwoot que fará o envio.
 * @param {string} payload.recipientIdentifier - O JID do destinatário (ex: 551199998888@s.whatsapp.net).
 * @param {string} payload.messageContent - O texto da mensagem a ser enviada.
 */
async function sendSimpleMessage(payload) {
    if (!BAILEYS_API_URL || !BAILEYS_API_SECRET) {
        console.error("[Baileys Service] URL ou Chave Secreta da API Baileys não configurada no .env");
        throw new Error("Configuração da API Baileys incompleta.");
    }

    try {
        console.log(`[Baileys Service] Enviando para Instância ${payload.instanceId}: "${payload.messageContent.substring(0, 30)}..." -> ${payload.recipientIdentifier}`);

        // A rota que vamos criar na ponte Baileys para receber ordens de envio
        const endpoint = `${BAILEYS_API_URL}/internal-api/send-whatsapp`;

        await axios.post(endpoint, payload, {
            headers: { 'x-internal-api-secret': BAILEYS_API_SECRET }
        });

        console.log(`[Baileys Service] Mensagem para ${payload.recipientIdentifier} enviada para a ponte com sucesso.`);
        return { success: true };

    } catch (error) {
        const errorMsg = error.response ? error.response.data : error.message;
        console.error(`[Baileys Service] Falha ao enviar mensagem via ponte:`, errorMsg);
        return { success: false, error: errorMsg };
    }
}

module.exports = {
  sendSimpleMessage,
};