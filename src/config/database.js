const mongoose = require('mongoose');

async function connectDatabase(){
    await mongoose.connect(process.env.MONGO_URL, {
        dbName: process.env.DB_NAME
    });
    console.log('MongoDB conectado com sucesso');
}

module.exports = connectDatabase;
