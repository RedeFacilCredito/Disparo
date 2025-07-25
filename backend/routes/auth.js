//backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ROTA DE REGISTRO - AGORA PROTEGIDA
router.post('/register', authMiddleware, async (req, res) => {
    // <-- MUDANÇA: Adicionamos o authMiddleware aqui

    // Garante que o usuário que faz a requisição é um Admin
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem criar usuários.' });
    }

    const { email, name, password } = req.body;

    if (!email || !name || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Novos usuários são criados como USER por padrão (definido no schema.prisma)
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ message: 'Usuário criado com sucesso!', user: userWithoutPassword });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email já cadastrado.' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário.', details: error.message });
    }
});

router.get('/users', authMiddleware, async (req, res) => {
    // Apenas o admin pode listar os usuários
    if (req.user.email !== 'setorsistemas@facilitpromotora.com') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
        const users = await prisma.user.findMany({
            select: { // Seleciona apenas os campos seguros para retornar
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

module.exports = router;


// ROTA DE LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Usuário não encontrado
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Senha incorreta
        }

        // Se chegou aqui, o login é válido. Gerar o token JWT.
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET, // Um segredo para assinar o token
            { expiresIn: '24h' } // Token expira em 24 horas
        );
 	res.json({
	    message: 'Login bem-sucedido!',
	    token,
	    user: {
	        id: user.id,
	        email: user.email,
	        name: user.name,
            role: user.role
	    }
	});
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login.', details: error.message });
    }
});

module.exports = router;
