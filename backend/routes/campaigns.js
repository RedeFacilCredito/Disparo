// backend/routes/campaigns.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware'); // << 1. IMPORTA O GUARDIÃO
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');const timeZone = 'America/Sao_Paulo';
dayjs.extend(utc);
dayjs.extend(timezone);


const prisma = new PrismaClient();
const router = express.Router();

// Busca todas as campanhas do usuário logado
router.get('/', authMiddleware, async (req, res) => {
    // Pega o cargo (role) e o ID do usuário do token
    const { userId, role } = req.user;

    // <-- INÍCIO DA MUDANÇA
    // Cria a cláusula 'where' dinamicamente
    const whereCondition = {};

    // Se o usuário não for um admin, adiciona o filtro para mostrar apenas os seus
    if (role !== 'ADMIN') {
        whereCondition.userId = userId;
    }
    // Se for ADMIN, o 'whereCondition' fica vazio, retornando todos os registros.
    // FIM DA MUDANÇA -->

    try {
        const campaigns = await prisma.campaign.findMany({
            where: whereCondition, // <-- Usa a condição dinâmica aqui
            orderBy: { createdAt: 'desc' },
            include: {
                audience: { select: { name: true } },
                template: { select: { name: true } },
            }
        });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar campanhas.' });
    }
});

// Cria uma nova campanha
router.post('/', authMiddleware, async (req, res) => {
    const {
        name, audienceId, templateId, scheduleOption, scheduledAt,
        messageInterval, variableMapping,
        senderType, senderInstanceId,
        customMessageBody
    } = req.body;
    const userId = req.user.userId;

    try {
                const timeZone = 'America/Sao_Paulo';
                const scheduledAtUtc = scheduleOption === 'later' && scheduledAt
                    ? dayjs.tz(scheduledAt, timeZone).toDate()
                    : null;

        const newCampaign = await prisma.campaign.create({
            data: {
                name,
                status: scheduleOption === 'manual' ? 'Draft' : (scheduleOption === 'later' ? 'Scheduled' : 'Draft'),
                
                // ======================= 3. USE A NOVA DATA CONVERTIDA =======================
                scheduledAt: scheduledAtUtc,
                // =============================================================================
                
                messageInterval: messageInterval || 'medium',
                variableMapping: variableMapping || {},
                userId: userId,
                audienceId: parseInt(audienceId),
                templateId: templateId ? parseInt(templateId) : null,
                customMessageBody: customMessageBody,
                senderType: senderType,
                senderInstanceId: senderType === 'BAILEYS' ? parseInt(senderInstanceId) : null,
            }
        });
        res.status(201).json({ message: 'Campanha criada com sucesso!', campaign: newCampaign });
    } catch (error) {
        console.error("Erro ao criar campanha:", error);
        res.status(500).json({ error: 'Falha ao criar campanha.' });
    }
});


// Deleta uma campanha
router.delete('/:id', authMiddleware, async (req, res) => { // << Protegido também
    const id = parseInt(req.params.id);
    try {
        // (Opcional) Adicionar verificação se a campanha pertence ao req.user.userId
        await prisma.campaign.delete({ where: { id } });
        res.status(200).json({ message: 'Campanha deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar campanha.' });
    }
});

// Envia uma campanha manualmente
router.post('/:id/send-manual', authMiddleware, async (req, res) => { // << Protegido também
    const id = parseInt(req.params.id);
    try {
        const campaign = await prisma.campaign.update({
            where: { id },
            data: { 
                status: 'Scheduled',
                scheduledAt: new Date(),
            },
        });
        res.status(200).json({ message: 'Campanha marcada para envio!', campaign });
    } catch (error) {
        console.error("Erro ao enviar campanha manualmente:", error);
        res.status(500).json({ error: 'Erro ao enviar campanha manualmente.' });
    }
});

router.get('/:id/report', authMiddleware, async (req, res) => {
    const campaignId = parseInt(req.params.id);
    const { userId, role } = req.user;

    if (isNaN(campaignId)) {
        return res.status(400).json({ error: "ID de campanha inválido." });
    }

    try {
        // 1. Busca os detalhes principais da campanha
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                audience: { select: { name: true, contactCount: true } },
            }
        });

        if (!campaign || (role !== 'ADMIN' && campaign.userId !== userId)) {
            return res.status(404).json({ error: 'Campanha não encontrada ou acesso negado.' });
        }

        // 2. Calcula as contagens de status "brutas" do banco de dados
        const statusCountsRaw = await prisma.messageLog.groupBy({
            by: ['status'],
            where: { campaignId: campaignId },
            _count: { status: true },
        });
        
        const statusCounts = statusCountsRaw.reduce((acc, current) => {
            acc[current.status] = current._count.status;
            return acc;
        }, {});

        // ======================= INÍCIO DA NOVA LÓGICA =======================
        
        // Garante que todos os status tenham um valor numérico (0 se não existirem)
        const rawSubmitted = statusCounts.submitted || 0;
        const rawSent = statusCounts.sent || 0;
        const rawDelivered = statusCounts.delivered || 0;
        const rawRead = statusCounts.read || 0;
        const rawResponded = statusCounts.responded || 0;
        const rawFailed = statusCounts.failed || 0;

        // Calcula os totais cumulativos
        const cumulativeDelivered = rawDelivered + rawRead + rawResponded;
        const cumulativeRead = rawRead + rawResponded;

        // Monta o objeto de stats final que será enviado ao frontend
        const finalStats = {
            total: campaign.audience.contactCount || 0,
            submitted: rawSubmitted,
            sent: rawSent,
            delivered: cumulativeDelivered,
            read: cumulativeRead,
            responded: rawResponded,
            failed: rawFailed,
        };

        // ======================== FIM DA NOVA LÓGICA =========================


        // 3. Busca a lista detalhada de contatos e seus status
        const contactLogs = await prisma.messageLog.findMany({
            where: { campaignId: campaignId },
            include: {
                contact: {
                    select: {
                        phone: true,
                        data: true,
                    }
                }
            },
        });
        
        // 4. Monta o objeto de resposta final
        const reportData = {
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                scheduledAt: campaign.scheduledAt,
                audienceName: campaign.audience.name,
            },
            stats: finalStats, // <-- Usa os stats cumulativos
            contacts: contactLogs.map(log => ({
                name: log.contact.data?.nome || log.contact.data?.name || log.contact.phone, 
                phone: log.contact.phone,
                status: log.status
            }))
        };

        res.json(reportData);

    } catch (error) {
        console.error(`Erro ao gerar relatório para campanha ${campaignId}:`, error);
        res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
});


module.exports = router;