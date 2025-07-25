const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- MUDANÇA PRINCIPAL: Aplica o middleware de autenticação a TODAS as rotas deste arquivo ---
router.use(authMiddleware);

// Função para detetar o delimitador (vírgula ou ponto e vírgula)
function detectDelimiter(header) {
    const commaCount = (header.match(/,/g) || []).length;
    const semicolonCount = (header.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
}

// Rota para buscar as audiências (agora herda a autenticação do router.use)
router.get('/', async (req, res) => {
    const { userId, role } = req.user;
    const whereCondition = {};

    if (role !== 'ADMIN') {
        whereCondition.userId = userId;
    }

    try {
        const audiences = await prisma.audience.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
        });
        res.json(audiences);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar públicos.' });
    }
});

// Rota para apagar uma audiência e as suas campanhas associadas
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

    try {
        // Adicional: Verificar se o utilizador tem permissão para apagar esta audiência
        const audience = await prisma.audience.findUnique({ where: { id } });
        if (!audience || (req.user.role !== 'ADMIN' && audience.userId !== req.user.userId)) {
            return res.status(403).json({ error: "Acesso negado." });
        }

        await prisma.$transaction(async (tx) => {
            await tx.campaign.deleteMany({
                where: { audienceId: id },
            });
            await tx.audience.delete({
                where: { id: id },
            });
        });
        res.status(200).json({ message: 'Lista e campanhas associadas apagadas com sucesso.' });
    } catch (error) {
        console.error("Erro ao apagar lista:", error);
        res.status(500).json({ error: 'Erro ao apagar a lista de contactos.' });
    }
});

// Rota para fazer upload e criar uma nova audiência
// O multer agora é aplicado depois da autenticação global da rota
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).send('O nome da lista é obrigatório.');
    }

    const buffer = req.file.buffer;
    const records = [];
    const firstLine = buffer.toString().split('\n')[0];
    const delimiter = detectDelimiter(firstLine);

    console.log(`🔍 DEBUG: Delimitador detetado: "${delimiter}"`);
    
    const parser = parse({
        delimiter: delimiter,
        columns: true,
        skip_empty_lines: true
    });

    parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
            records.push(record);
        }
    });

    parser.on('error', function(err) {
        console.error(err.message);
        res.status(500).send('Erro ao processar o arquivo CSV.');
    });

    parser.on('end', async function() {
        if (records.length === 0) {
            return res.status(400).send('Arquivo CSV está vazio ou em formato inválido.');
        }

        const headers = Object.keys(records[0]);
        const phoneHeader = headers.find(h => h.toLowerCase().includes('phone') || h.toLowerCase().includes('telefone'));
        if (!phoneHeader) {
            return res.status(400).send('A coluna de telefone não foi encontrada no arquivo.');
        }

        try {
            await prisma.$transaction(async (tx) => {
                const audience = await tx.audience.create({
                    data: {
                        name: name,
                        fileName: req.file.originalname,
                        contactCount: records.length,
                        fields: headers,
                        userId: req.user.userId,
                    },
                });

                const contactsData = records.map(record => ({
                    phone: String(record[phoneHeader]),
                    data: record,
                    audienceId: audience.id,
                }));

                await tx.contact.createMany({
                    data: contactsData,
                });
            });

            res.status(201).send('Público criado com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar no banco:", error);
            res.status(500).send('Erro ao salvar os dados no banco de dados.');
        }
    });

    Readable.from(buffer).pipe(parser);
});

module.exports = router;
