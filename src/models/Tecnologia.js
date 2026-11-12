const mongoose = require('mongoose');

const tecnologiaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome e obrigatorio.'],
      trim: true,
      unique: true,
    },
    base: {
      type: String,
      required: [true, 'A base e obrigatoria (ex: JS, PHP, C#).'],
      trim: true,
    },
    // tempo medio (em meses) para ficar proficiente
    curvaAprendizado: {
      type: Number,
      required: [true, 'A curva de aprendizado (em meses) e obrigatoria.'],
      min: [1, 'A curva de aprendizado deve ser de pelo menos 1 mes.'],
      cast: 'A curva de aprendizado deve ser um numero (meses).',
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('Tecnologia', tecnologiaSchema, 'tecnologias');
