// backend/routes/templates.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Função auxiliar para extrair variáveis do corpo de um template.
 * Ex: "Olá {{1}}, bem-vindo {{nome}}" -> ["{{1}}", "{{nome}}"]
 * @param {string} body O corpo do texto do template.
 * @returns {string[]} Um array com as variáveis encontradas.
 */
function extractVariablesFromBody(body) {
    if (!body || typeof body !== 'string') {
        return [];
    }
    // Usa uma expressão regular para encontrar todas as ocorrências de {{...}}
    const matches = body.match(/\{\{.*?\}\}/g);
    return matches || []; // Retorna as variáveis encontradas ou um array vazio
}


router.get('/', async (req, res) => {
    try {
        const templates = await prisma.template.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(templates);
    } catch (error) {
        console.error("Erro ao buscar templates:", error);
        res.status(500).json({ error: 'Erro ao buscar templates.' });
    }
});

router.post('/sync-gupshup', async (req, res) => {
    const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
    const GUPSHUP_APP_ID = process.env.GUPSHUP_APP_ID;

    if (!GUPSHUP_API_KEY || !GUPSHUP_APP_ID) {
        return res.status(500).json({ error: 'As credenciais da Gupshup (API Key, App ID) não estão configuradas no .env' });
    }

    const GUPSHUP_LIST_URL = `https://api.gupshup.io/wa/app/${GUPSHUP_APP_ID}/template`;

    try {
        console.log(`Iniciando sincronização para o App ID: ${GUPSHUP_APP_ID}...`);
        
        const response = await axios.get(GUPSHUP_LIST_URL, {
            headers: { 'apikey': GUPSHUP_API_KEY }
        });

        const gupshupTemplates = response.data.templates;
        if (!gupshupTemplates) {
             throw new Error('A resposta da Gupshup não continha a lista de templates esperada.');
        }

        console.log(`Encontrados ${gupshupTemplates.length} templates na Gupshup.`);
        let templatesCriados = 0;
        let templatesAtualizados = 0;

        for (const template of gupshupTemplates) {
            // ❗ MUDANÇA: Usando nossa nova função para extrair variáveis
            const extractedVariables = extractVariablesFromBody(template.data);

            const result = await prisma.template.upsert({
                where: { gupshupTemplateId: template.id },
                update: {
                    name: template.elementName,
                    body: template.data,
                    variables: extractedVariables, // Salva as variáveis que NÓS encontramos
                    status: template.status,
                    category: template.category,
                    languageCode: template.languageCode,
                    templateType: template.templateType,
                },
                create: {
                    gupshupTemplateId: template.id,
                    name: template.elementName,
                    body: template.data,
                    variables: extractedVariables, // Salva as variáveis que NÓS encontramos
                    status: template.status,
                    category: template.category,
                    languageCode: template.languageCode,
                    templateType: template.templateType,
                }
            });

            if (result.createdAt.getTime() === result.updatedAt.getTime()) {
                templatesCriados++;
            } else {
                templatesAtualizados++;
            }
        }
        
        console.log('Sincronização concluída.');
        res.status(200).json({
            message: 'Sincronização com a Gupshup concluída!',
            created: templatesCriados,
            updated: templatesAtualizados,
        });

    } catch (error) {
        console.error('Erro ao sincronizar com a Gupshup:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message); 
        res.status(500).json({ error: 'Falha ao sincronizar templates com a Gupshup.' });
    }
});

module.exports = router;