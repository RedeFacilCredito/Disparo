// ~/leadsflow-dev/backend/routes/contacts.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// A função de middleware ainda existe, mas não será usada pela rota abaixo.
function serviceAuthMiddleware(req, res, next) {
    // ... (código existente)
}

// Rota: GET /api/contacts/by-phone/:phone
// ===== MUDANÇA PRINCIPAL AQUI =====
// O middleware 'serviceAuthMiddleware' foi removido da declaração da rota.
router.get('/by-phone/:phone', async (req, res) => {
    console.log("\n--- Rota /api/contacts/by-phone/:phone ACIONADA (SEM AUTENTICAÇÃO) ---");
    const { phone } = req.params;
    const cleanPhone = phone.replace(/\D/g, '');

    try {
        const contact = await prisma.contact.findFirst({
            where: {
                phone: {
                    endsWith: cleanPhone,
                },
            },
        });

        if (!contact) {
            console.log(`[Busca] Contato com final de telefone ${cleanPhone} não encontrado.`);
            return res.status(404).json({ error: 'Contato não encontrado.' });
        }

        console.log(`[Busca] SUCESSO! Contato encontrado:`, contact.data);
        res.json({ data: contact.data }); // Garante que a resposta tenha o formato { data: ... }

    } catch (error) {
        console.error('Erro ao buscar contato por telefone:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        console.log("-----------------------------------------------------------------------\n");
    }
});

module.exports = router;