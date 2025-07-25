///home/eduardo-disparo/leadsflow-dev/backend/services/sheduler.js

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { getIO } = require('../socket');
const gupshupService = require('./gupshup');
const baileysService = require('./baileys');

const prisma = new PrismaClient();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function getDelayInMs(interval) {
    switch (interval) {
        case 'slow': return (60 + Math.random() * 30) * 1000;
        case 'fast': return (5 + Math.random() * 5) * 1000;
        case 'medium': default: return (30 + Math.random() * 30) * 1000;
    }
}

function buildPersonalizedMessage(templateBody, contactData, variableMapping) {
    if (!templateBody) return ''; // Garante que não quebre se o corpo for nulo
    if (!variableMapping || !contactData) {
        return templateBody;
    }

    let personalizedMessage = templateBody;
    
    personalizedMessage = personalizedMessage.replace(/\{\{([^{}]+)\}\}/g, (match) => {
        const mappedField = variableMapping[match];
        if (mappedField && contactData[mappedField] !== undefined) {
            return contactData[mappedField];
        }
        return match;
    });

    return personalizedMessage;
}


console.log('✔ Scheduler de Campanhas iniciado e pronto.');

cron.schedule('* * * * *', async () => {
    console.log('-------------------------------------');
    console.log('Executando verificação de campanhas agendadas...');

    try {
        const dueCampaigns = await prisma.campaign.findMany({
            where: {
                status: 'Scheduled',
                scheduledAt: { lte: new Date() },
            },
            include: {
                template: true, 
                audience: {
                    include: {
                        contacts: true, 
                    },
                },
            },
        });

        if (dueCampaigns.length === 0) {
            console.log('Nenhuma campanha para enviar no momento.');
            return;
        }

        console.log(`Encontradas ${dueCampaigns.length} campanhas para processar.`);
        const io = getIO();

        for (const campaign of dueCampaigns) {
            let campaignFailed = false;
            console.log(`Processando campanha ID: ${campaign.id} via [${campaign.senderType || 'GUPSHUP'}]`);

            await prisma.campaign.update({
                where: { id: campaign.id },
                data: { status: 'In Progress' },
            });
            
            io.emit('campaign_status_updated', {
                campaignId: campaign.id,
                status: 'In Progress'
            });

            try {
                const { template, audience, customMessageBody } = campaign;
                const contacts = audience?.contacts || [];

                // --- MUDANÇA PRINCIPAL AQUI ---
                // A campanha é válida se tiver contatos E (um template OU uma mensagem customizada)
                if ((!template && !customMessageBody) || contacts.length === 0) {
                    throw new Error(`Conteúdo da mensagem (template ou customizada) ou contatos não encontrados para a campanha ${campaign.id}`);
                }
                
                console.log(`Iniciando envio para ${contacts.length} contatos.`);

                if (campaign.senderType === 'BAILEYS') {
                    // Seleciona o corpo da mensagem correto
                    const messageBody = customMessageBody || template.body;

                    for (const contact of contacts) {
                        const personalizedContent = buildPersonalizedMessage(messageBody, contact.data, campaign.variableMapping);
                        
                        const payload = {
                            instanceId: campaign.senderInstanceId,
                            recipientIdentifier: `${contact.phone.replace(/[^0-9]/g, '')}@s.whatsapp.net`,
                            messageContent: personalizedContent,
                        };

                        const result = await baileysService.sendSimpleMessage(payload);
                        
                        if (!result.success) {
                            console.error(`Erro durante o envio da campanha ${campaign.id}:`, result.error);
                            campaignFailed = true;
                            break; 
                        }
                        
                        const delayTime = getDelayInMs(campaign.messageInterval);
                        console.log(`Aguardando ${Math.round(delayTime / 1000)}s para o próximo envio...`);
                        await delay(delayTime);
                    }
                } else { // Fluxo Gupshup (só funciona com templates)
                    if (!template) {
                        throw new Error(`Campanhas via Gupshup exigem um template. Campanha ${campaign.id} não possui um.`);
                    }
                    for (const contact of contacts) {
                        const result = await gupshupService.sendTemplateMessage(contact.phone, template, contact, campaign);
                        
                        if (!result.success) {
                            console.error(`Falha crítica no envio para a campanha ${campaign.id}. Abortando.`);
                            campaignFailed = true;
                            break;
                        }
                        
                        // Cria o log inicial no banco de dados
                        if (result.data && result.data.messageId) {
                            try {
                                await prisma.messageLog.create({
                                    data: {
                                        campaignId: campaign.id,
                                        contactId: contact.id,
                                        gupshupMessageId: result.data.messageId,
                                        status: 'submitted'
                                    }
                                });
                            } catch (logError) {
                                console.error("Falha ao criar o log da mensagem:", logError);
                            }
                        }

                        const delayTime = getDelayInMs(campaign.messageInterval);
                        console.log(`Aguardando ${Math.round(delayTime / 1000)}s para o próximo envio...`);
                        await delay(delayTime);
                    }
                }

                const finalStatus = campaignFailed ? 'Error' : 'Completed';
                await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { status: finalStatus },
                });
                
                io.emit('campaign_status_updated', {
                    campaignId: campaign.id,
                    status: finalStatus
                });
                
                console.log(`Campanha ID: ${campaign.id} marcada como '${finalStatus}'.`);

            } catch (sendError) {
                console.error(`Erro durante o processamento da campanha ${campaign.id}:`, sendError);
                await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { status: 'Error' },
                });
                io.emit('campaign_status_updated', {
                    campaignId: campaign.id,
                    status: 'Error'
                });
            }
        }
    } catch (error) {
        console.error('Erro geral ao processar campanhas:', error);
    } finally {
        console.log('Verificação de campanhas concluída.');
        console.log('-------------------------------------');
    }
});
