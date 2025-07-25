const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
    try {
        const audiences = await prisma.audience.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(audiences);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar listas de contatos.' });
    }
});

router.post('/upload', upload.single('csvFile'), async (req, res) => {
    const { listName } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Nenhum arquivo CSV enviado.' });
    if (!listName) return res.status(400).json({ error: 'O nome da lista é obrigatório.' });

    const contacts = [];
    const stream = Readable.from(file.buffer); // Usamos o buffer diretamente

    stream
        // 1. CORREÇÃO PRINCIPAL: Adicionamos a opção `bom: true` para remover o caractere fantasma.
        //    Também deixamos o parser detectar os cabeçalhos automaticamente.
        .pipe(csv({ bom: true }))
        .on('data', (row) => {
            // 2. Lógica melhorada para encontrar as colunas
            const phoneKeys = ['phone', 'telefone', 'numero', 'whatsapp'];
            const nameKeys = ['name', 'nome', 'cliente'];

            let phoneNumber = null;
            let contactName = null;

            // Encontra a primeira chave correspondente para telefone e nome, ignorando maiúsculas/minúsculas
            const rowKeys = Object.keys(row);
            const phoneKey = rowKeys.find(key => phoneKeys.includes(key.toLowerCase()));
            const nameKey = rowKeys.find(key => nameKeys.includes(key.toLowerCase()));

            if (phoneKey) phoneNumber = row[phoneKey];
            if (nameKey) contactName = row[nameKey];

            if (phoneNumber) {
                contacts.push({ name: contactName || null, phone: phoneNumber });
            }
        })
        .on('end', async () => {
            if (contacts.length === 0) {
                return res.status(400).json({ error: "Nenhum contato com número de telefone válido foi encontrado. Verifique se o cabeçalho das colunas é 'name' e 'phone' ou similar." });
            }
            try {
                const newAudience = await prisma.$transaction(async (tx) => {
                    const audience = await tx.audience.create({
                        data: {
                            name: listName,
                            fileName: file.originalname,
                            userId: 1, 
                            contactCount: contacts.length,
                        },
                    });

                    const contactsWithAudienceId = contacts.map(c => ({ ...c, audienceId: audience.id }));
                    await tx.contact.createMany({ data: contactsWithAudienceId });
                    return audience;
                });
                res.status(201).json({ message: 'Lista e contatos importados com sucesso!', audience: newAudience });
            } catch (error) {
                console.error("Erro ao salvar no banco:", error);
                res.status(500).json({ error: 'Falha ao salvar os dados no banco.' });
            }
        });
});


router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

    try {
        await prisma.audience.delete({ where: { id } });
        res.status(200).json({ message: 'Lista deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar a lista.' });
    }
});

module.exports = router;