const mongoose = require("mongoose");
const Configuracao = require("../models/Configuracao");
require("dotenv").config();

const seedConfiguracoes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("🔄 Verificando configurações globais...");

        const config = await Configuracao.findOne();

        if (config) {
            console.log("✅ Configuração global já existe:");
            console.log(`   ID: ${config._id}`);
            console.log(`   Padrões: ${config.padroesUtilizados.substring(0, 50)}...`);
        } else {
            console.log("🆕 Criando configuração global...");
            const novaConfig = await Configuracao.create({});
            console.log("✅ Configuração global criada com sucesso!");
            console.log(`   ID: ${novaConfig._id}`);
            console.log(`   Padrões: ${novaConfig.padroesUtilizados.substring(0, 50)}...`);
        }

        await mongoose.disconnect();
        console.log("✅ Processo concluído!");
    } catch (error) {
        console.error("❌ Erro ao criar configurações:", error);
        process.exit(1);
    }
};

seedConfiguracoes();
