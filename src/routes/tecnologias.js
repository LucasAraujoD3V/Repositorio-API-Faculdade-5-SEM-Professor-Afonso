const express = require('express');
const Tecnologia = require('../models/Tecnologia');
const verificarToken = require('../middlewares/auth');

const router = express.Router();

// Transforma os erros do MongoDB/Mongoose em respostas simples
function tratarErro(res, error, mensagem) {
    if (error.code === 11000) {
        return res.status(409).json({ mensagem: 'Ja existe uma tecnologia com esse nome.' });
    }
    if (error.name === 'ValidationError') {
        const erros = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ mensagem, erros });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ mensagem: `Valor invalido para o campo ${error.path}.` });
    }
    res.status(500).json({ mensagem, erro: error.message });
}

// GET /tecnologias -> lista todas (nao precisa de token)
router.get('/', async (req, res) => {
    try {
        const tecnologias = await Tecnologia.find().sort({ nome: 1 });
        res.status(200).json(tecnologias);
    }
    catch(error) {
        tratarErro(res, error, 'Erro ao buscar tecnologias.');
    }
});

// GET /tecnologias/:id -> busca uma (nao precisa de token)
router.get('/:id', async (req, res) => {
    try {
        const tecnologia = await Tecnologia.findById(req.params.id);

        if (!tecnologia) {
            return res.status(404).json({ mensagem: 'Tecnologia nao encontrada.' });
        }

        res.status(200).json(tecnologia);
    }
    catch(error) {
        tratarErro(res, error, 'Erro ao buscar tecnologia.');
    }
});

// POST /tecnologias -> cadastra (precisa de token)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { nome, base, curvaAprendizado } = req.body || {};
        const novaTecnologia = await Tecnologia.create({ nome, base, curvaAprendizado });
        res.status(201).json(novaTecnologia);
    }
    catch(error) {
        tratarErro(res, error, 'Nao foi possivel cadastrar a tecnologia.');
    }
});

// PUT /tecnologias/:id -> atualiza (precisa de token)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { nome, base, curvaAprendizado } = req.body || {};
        const tecnologiaAtualizada = await Tecnologia.findByIdAndUpdate(
            req.params.id,
            { nome, base, curvaAprendizado },
            { returnDocument: 'after', runValidators: true }
        );

        if (!tecnologiaAtualizada) {
            return res.status(404).json({ mensagem: 'Tecnologia nao encontrada.' });
        }

        res.status(200).json(tecnologiaAtualizada);
    }
    catch(error) {
        tratarErro(res, error, 'Nao foi possivel atualizar a tecnologia.');
    }
});

// DELETE /tecnologias/:id -> exclui (precisa de token)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const tecnologiaRemovida = await Tecnologia.findByIdAndDelete(req.params.id);

        if (!tecnologiaRemovida) {
            return res.status(404).json({ mensagem: 'Tecnologia nao encontrada.' });
        }

        res.status(200).json({ mensagem: 'Tecnologia excluida com sucesso.' });
    }
    catch(error) {
        tratarErro(res, error, 'Nao foi possivel excluir a tecnologia.');
    }
});

module.exports = router;
