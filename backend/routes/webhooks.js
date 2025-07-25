// backend/routes/webhooks.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { getIO } = require('../socket');

const prisma = new PrismaClient();
const router = express.Router();

// Função para salvar o log em um arquivo
function logWebhookToFile(payload) {
    const logFilePath = 'webhook_debug.log';
    const timestamp = new Date().toISOString();
    const logEntry = `
--- LOG EM ${timestamp} ---
${JSON.stringify(payload, null, 2)}
--- FIM DO LOG ---\n\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error("Erro ao escrever no arquivo de log de debug:", err);
        }
    });
}

// Rota para receber ATUALIZAÇÕES DE STATUS do Gupshup
router.post('/gupshup-status', async (req, res) => {
    const payload = req.body;
    const isDebugMode = process.env.DEBUG_WEBHOOKS === 'true';

    if (isDebugMode) {
        logWebhookToFile(payload);
    }
    
    console.log('[Webhook Gupshup] Status recebido.');

    try {
        const statusUpdate = payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];

        if (statusUpdate) {
            const gupshupMessageId = statusUpdate.gs_id; // Usando o gs_id correto
            const newStatus = statusUpdate.status;

            if (gupshupMessageId && newStatus) {
                console.log(`Atualizando status da mensagem ${gupshupMessageId} para '${newStatus}'`);
                await prisma.messageLog.updateMany({
                    where: { gupshupMessageId: gupshupMessageId },
                    data: { status: newStatus },
                });
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('[Webhook Gupshup] Erro ao processar atualização de status:', error);
        res.sendStatus(200); 
    }
});

// Rota que a PONTE irá chamar quando um cliente RESPONDER
router.post('/contact-reply', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Número de telefone ausente.' });
    }

    const cleanPhoneNumber = String(phoneNumber).replace(/\D/g, '');
    console.log(`[Webhook de Resposta] Recebida notificação de resposta para o número: ${cleanPhoneNumber}`);

    try {
        const latestLog = await prisma.messageLog.findFirst({
            where: {
                contact: { phone: { contains: cleanPhoneNumber } },
                NOT: { status: 'responded' },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (latestLog) {
            await prisma.messageLog.update({
                where: { id: latestLog.id },
                data: { status: 'responded' },
            });

            console.log(`[MessageLog] Status do log ID ${latestLog.id} atualizado para 'responded'.`);

            const io = getIO();
            io.emit('campaign_status_updated', {
                campaignId: latestLog.campaignId,
                status: 'responded',
                contactId: latestLog.contactId
            });
        } else {
            console.log(`[Webhook de Resposta] Nenhum log de campanha ativo encontrado para o número ${cleanPhoneNumber}. Nenhuma ação tomada.`);
        }
        res.status(200).json({ message: 'Notificação de resposta recebida.' });
    } catch (error) {
        console.error('[Webhook de Resposta] Erro ao processar a resposta do contato:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

module.exports = router;