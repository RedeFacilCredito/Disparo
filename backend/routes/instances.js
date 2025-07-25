// leadsflow-dev/backend/routes/instances.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const SERVICE_API_KEY = process.env.SERVICE_API_KEY;

// Middleware para proteger esta rota
function serviceAuthMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === SERVICE_API_KEY) {
        next();
    } else {
        res.status(401).json({ error: 'Acesso não autorizado.' });
    }
}

// Rota: POST /api/instances/status
// Usada pelo projeto Baileys para reportar seu status (online, offline, etc.)
router.post('/status', serviceAuthMiddleware, async (req, res) => {
    const {
        chatwootInboxId,
        instanceName,
        whatsappNumber,
        status, // 'CONNECTED', 'DISCONNECTED', etc.
    } = req.body;

    if (!chatwootInboxId || !status) {
        return res.status(400).json({ error: 'chatwootInboxId e status são obrigatórios.' });
    }

    try {
        const instance = await prisma.senderInstance.upsert({
            where: { chatwootInboxId: parseInt(chatwootInboxId) },
            update: {
                status: status,
                whatsappNumber: whatsappNumber || null,
                instanceName: instanceName,
            },
            create: {
                chatwootInboxId: parseInt(chatwootInboxId),
                instanceName: instanceName || `Instancia-${chatwootInboxId}`,
                whatsappNumber: whatsappNumber || null,
                status: status,
                type: 'BAILEYS', // Define o tipo como Baileys por padrão
            }
        });

        console.log(`[Status Update] Status da instância ${instance.id} (Inbox ${chatwootInboxId}) atualizado para: ${status}`);
        res.status(200).json(instance);

    } catch (error) {
        console.error('Erro ao atualizar status da instância:', error);
        res.status(500).json({ error: 'Erro interno ao processar o status da instância.' });
    }
});

module.exports = router;