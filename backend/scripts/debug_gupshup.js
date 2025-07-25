// backend/services/gupshup.js

const axios = require('axios');

const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME;
const GUPSHUP_SOURCE_NUMBER = process.env.GUPSHUP_SOURCE_NUMBER;
const GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/template/msg";

async function sendTemplateMessage(destinationNumber, template, contactData) {
  if (!GUPSHUP_API_KEY || !GUPSHUP_APP_NAME || !GUPSHUP_SOURCE_NUMBER) {
    throw new Error("As credenciais da Gupshup não estão configuradas no .env");
  }

  const cleanDestinationNumber = String(destinationNumber).replace(/\D/g, '');

  const templateParams = [];
  if (template.variables && Array.isArray(template.variables)) {
    for (const variable of template.variables) {
        // Remove os {{ e }} para pegar a chave da variável
        const key = variable.replace(/{{|}}/g, '').trim();
        // Busca o valor no JSON do contato. Se não achar, usa uma string vazia.
        const value = contactData.data[key] || '';
        templateParams.push(value);
    }
  }

  const templateObject = {
    id: template.gupshupTemplateId,
    params: templateParams,
  };

  const requestBody = new URLSearchParams();
  requestBody.append('channel', 'whatsapp');
  requestBody.append('source', GUPSHUP_SOURCE_NUMBER);
  requestBody.append('destination', cleanDestinationNumber);
  requestBody.append('src.name', GUPSHUP_APP_NAME);
  requestBody.append('template', JSON.stringify(templateObject));

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'apikey': GUPSHUP_API_KEY,
  };
  
  // --- INÍCIO DO DEBUG ---
  console.log("\n=======================================");
  console.log("🔍 DEBUG: PREPARANDO ENVIO PARA GUPSHUP");
  console.log("=======================================");
  console.log("URL de Destino:", GUPSHUP_API_URL);
  console.log("Cabeçalhos (Headers):", headers);
  console.log("Corpo da Requisição (Body):");
  console.log(`- channel: ${requestBody.get('channel')}`);
  console.log(`- source: ${requestBody.get('source')}`);
  console.log(`- destination: ${requestBody.get('destination')}`);
  console.log(`- src.name: ${requestBody.get('src.name')}`);
  console.log(`- template: ${requestBody.get('template')}`);
  console.log("---------------------------------------\n");
  // --- FIM DO DEBUG ---

  try {
    const response = await axios.post(GUPSHUP_API_URL, requestBody, { headers });
    console.log(`✅ Resposta da Gupshup para ${cleanDestinationNumber}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    const errorResponse = error.response ? error.response.data : error.message;
    console.error(`❌ Erro ao enviar mensagem para ${cleanDestinationNumber}:`, errorResponse);
    return { success: false, error: errorResponse };
  }
}

module.exports = {
  sendTemplateMessage,
};