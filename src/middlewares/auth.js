const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const autorizacao = req.headers.authorization;

    if (!autorizacao) {
        return res.status(401).json({
            mensagem: 'Token nao informado.'
        });
    }

    const [tipo, token] = autorizacao.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({
            mensagem: 'Formato de token invalido.'
        });
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    }
    catch(error) {
        return res.status(401).json({
            mensagem: 'Token invalido ou expirado.'
        });
    }
}

module.exports = verificarToken;
