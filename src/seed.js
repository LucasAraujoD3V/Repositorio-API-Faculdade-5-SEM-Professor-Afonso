// Insere 3 tecnologias de teste no MongoDB. Rodar com: npm run seed
require('dotenv').config();

const mongoose = require('mongoose');
const connectDatabase = require('./config/database');
const Tecnologia = require('./models/Tecnologia');

const exemplos = [
    { nome: 'React', base: 'JS', curvaAprendizado: 3 },
    { nome: 'Laravel', base: 'PHP', curvaAprendizado: 4 },
    { nome: 'ASP.NET Core', base: 'C#', curvaAprendizado: 6 },
];

async function seed() {
    await connectDatabase();

    for (const item of exemplos) {
        // upsert: cria se nao existir, atualiza se ja existir (nao duplica)
        await Tecnologia.updateOne({ nome: item.nome }, { $set: item }, { upsert: true });
    }

    console.log('3 tecnologias de teste inseridas.');
    await mongoose.disconnect();
}

seed().catch((error) => {
    console.error('Erro no seed:', error.message);
    process.exit(1);
});
