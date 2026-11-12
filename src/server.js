require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDatabase = require('./config/database');
const tecnologiasRoutes = require('./routes/tecnologias');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(express.static('public'));

app.get('/status', (req, res) => {
    const estados = ['desconectado', 'conectado', 'conectando', 'desconectando'];
    const banco = estados[mongoose.connection.readyState] || 'desconhecido';

    res.status(200).json({
        servidor: 'online',
        banco,
        porta: Number(PORT),
        uptimeSegundos: Math.floor(process.uptime()),
        dataHora: new Date().toISOString()
    });
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body || {};

    if (
        usuario !== process.env.ADMIN_USER ||
        senha !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            mensagem: 'Usuario ou senha invalidos.'
        });
    }

    const token = jwt.sign(
        { usuario },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(200).json({ token });
});

// CRUD de tecnologias (rotas em src/routes/tecnologias.js)
app.use('/tecnologias', tecnologiasRoutes);

// JSON mal formatado ou erro inesperado -> responde em JSON
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        mensagem: 'JSON invalido ou erro no servidor.',
        erro: error.message
    });
});

async function startServer() {
    try {
        await connectDatabase();
        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    }
    catch(error) {
        console.error(
            'Nao foi possivel iniciar a aplicacao.',
            error.message
        );
    }
}

startServer();
