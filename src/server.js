require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDatabase = require('./config/database');
const Aluno = require('./models/Aluno');
const verificarToken = require('./middlewares/auth');

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

app.get('/alunos', async (req, res) => {
    try {
        const alunos = await Aluno.find();
        res.status(200).json(alunos);
    }
    catch(error) {
        res.status(500).json({
            mensagem: 'Erro ao buscar alunos.',
            erro: error.message
        });
    }
});

app.post('/alunos', verificarToken, async (req, res) => {
    try {
        const novoAluno = await Aluno.create(req.body);
        res.status(201).json(novoAluno);
    }
    catch(error) {
        res.status(400).json({
            mensagem: 'Nao foi possivel cadastrar o aluno.',
            erro: error.message
        });
    }
});

app.put('/alunos/:id', verificarToken, async (req, res) => {
    try {
        const alunoAtualizado = await Aluno.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        if (!alunoAtualizado) {
            return res.status(404).json({
                mensagem: 'Aluno nao encontrado.'
            });
        }

        res.status(200).json(alunoAtualizado);
    }
    catch(error) {
        res.status(400).json({
            mensagem: 'Nao foi possivel atualizar o aluno.',
            erro: error.message
        });
    }
});

app.delete('/alunos/:id', verificarToken, async (req, res) => {
    try {
        const alunoRemovido = await Aluno.findByIdAndDelete(req.params.id);

        if (!alunoRemovido) {
            return res.status(404).json({
                mensagem: 'Aluno nao encontrado.'
            });
        }

        res.status(200).json({
            mensagem: 'Aluno excluido com sucesso.'
        });
    }
    catch(error) {
        res.status(400).json({
            mensagem: 'Nao foi possivel excluir o aluno.',
            erro: error.message
        });
    }
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
