// leadsflow-dev/backend/routes/senders.js

const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const BAILEYS_STATUS_API_URL = process.env.BAILEYS_API_URL;
const BAILEYS_API_SECRET = process.env.BAILEYS_API_SECRET;

router.get('/baileys-online', authMiddleware, async (req, res) => {
    if (!BAILEYS_STATUS_API_URL || !BAILEYS_API_SECRET) {
        console.error("[Senders API] URL ou Chave da API Baileys não configuradas no .env do Leadsflow.");
        return res.status(500).json({ error: "Erro de configuração do servidor." });
    }

    try {
        console.log(`[Senders API] Consultando ponte Baileys em: ${BAILEYS_STATUS_API_URL}/status/online-senders`);
        
        // Faz a chamada para a nova rota no servidor Baileys
        const response = await axios.get(`${BAILEYS_STATUS_API_URL}/status/online-senders`, {
            headers: { 'x-internal-api-secret': BAILEYS_API_SECRET }
        });

        console.log(`[Senders API] Resposta recebida da ponte Baileys. Status: ${response.status}. Itens: ${response.data.length}`);
        
        // Simplesmente repassa a lista recebida para o frontend
        res.json(response.data);

    } catch (error) {
        const errorMsg = error.response ? error.response.data : error.message;
        console.error("Erro ao buscar remetentes online da ponte Baileys:", errorMsg);
        res.status(500).json({ error: 'Falha ao comunicar com o serviço de envio.' });
    }
});

module.exports = router;