const mongoose = require('mongoose');

const DEFAULT_STORAGE_LIMIT_BYTES = 512 * 1024 * 1024;

const formatCollectionName = (name) => {
    const names = {
        usuarios: 'Usuários',
        clientes: 'Clientes',
        equipamentos: 'Equipamentos',
        calibracoes: 'Calibrações',
        configuracaos: 'Configurações',
        notificacaos: 'Notificações',
        resettokens: 'Tokens de recuperação',
        tokenlogs: 'Registros de autenticação',
        tokenverificacaoemails: 'Verificações de e-mail'
    };

    return names[name] || name;
};

const getStorageUsage = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
            return res.status(503).json({
                message: 'Banco de dados indisponível no momento'
            });
        }

        const databaseStats = await mongoose.connection.db.stats();
        const collections = await mongoose.connection.db
            .listCollections({ type: 'collection' }, { nameOnly: true })
            .toArray();
        const collectionStats = await Promise.all(
            collections.map(async ({ name }) => {
                const stats = await mongoose.connection.db.command({ collStats: name });
                return {
                    name,
                    label: formatCollectionName(name),
                    storageSizeBytes: stats.storageSize || 0,
                    dataSizeBytes: stats.size || 0,
                    documents: stats.count || 0
                };
            })
        );

        const storageLimitBytes = Number(process.env.MONGODB_STORAGE_LIMIT_BYTES) || DEFAULT_STORAGE_LIMIT_BYTES;
        const usedBytes = databaseStats.storageSize || databaseStats.dataSize || 0;
        const usagePercent = Math.min((usedBytes / storageLimitBytes) * 100, 100);

        res.json({
            usedBytes,
            dataBytes: databaseStats.dataSize || 0,
            indexBytes: databaseStats.indexSize || 0,
            storageLimitBytes,
            usagePercent,
            documents: databaseStats.objects || 0,
            collections: collectionStats
                .filter((collection) => collection.storageSizeBytes > 0 || collection.documents > 0)
                .sort((first, second) => second.storageSizeBytes - first.storageSizeBytes)
        });
    } catch (error) {
        console.error('Erro ao consultar armazenamento do banco:', error);
        res.status(500).json({ message: 'Não foi possível consultar o armazenamento' });
    }
};

module.exports = { getStorageUsage };
