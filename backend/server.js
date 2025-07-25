// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // <-- 1. Importe o módulo http
const { initSocket } = require('./socket'); // <-- 2. Importe nosso inicializador

// Importe suas rotas
const authRoutes = require('./routes/auth');
const audienceRoutes = require('./routes/audiences');
const templateRoutes = require('./routes/templates');
const campaignRoutes = require('./routes/campaigns');
const contactRoutes = require('./routes/contacts');
const sendersRoutes = require('./routes/senders');
const webhookRoutes = require('./routes/webhooks'); 



// Inicia o agendador de campanhas
require('./services/scheduler'); 

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/audiences', audienceRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/senders', sendersRoutes);
//app.use('/webhooks', webhookRoutes);
app.use('/api/webhooks', webhookRoutes); 

// --- 3. MUDANÇA PRINCIPAL: Crie o servidor HTTP e Socket.IO ---
const server = http.createServer(app);
initSocket(server); // Inicializa e anexa o Socket.IO ao servidor

server.listen(PORT, () => {
    console.log(`🚀 Servidor Leadsflow rodando na porta ${PORT}`);
});