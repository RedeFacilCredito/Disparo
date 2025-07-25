// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // Pega o token do cabeçalho 'Authorization'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (token == null) {
        // Se não houver token, o acesso é não autorizado
        return res.sendStatus(401); 
    }

    // Verifica se o token é válido
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Se o token for inválido (expirado, etc.)
            return res.sendStatus(403); 
        }
        // Se for válido, adiciona o payload do usuário (que inclui o ID) ao objeto `req`
        req.user = user;
        next(); // Passa para a próxima função (a rota em si)
    });
}

module.exports = authMiddleware;