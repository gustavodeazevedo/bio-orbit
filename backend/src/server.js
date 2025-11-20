const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuração CORS mais permissiva para produção
const corsOptions = {
    origin: function (origin, callback) {
        console.log('CORS - Origin recebido:', origin);

        // Permitir requisições sem origin (ex: mobile apps, Postman)
        if (!origin) {
            console.log('CORS - Permitindo requisição sem origin');
            return callback(null, true);
        }

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:4173',
            'https://bio-orbit.vercel.app',
            'https://bioorbit.vercel.app',
            'https://www.bio-orbit.vercel.app',
            'https://bio-orbit-git-desenvolvimento-gustavodeazevedos-projects.vercel.app',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        console.log('CORS - Origins permitidos:', allowedOrigins);

        // Permitir qualquer subdomínio do Vercel ou localhost
        const isVercelDomain = origin.includes('.vercel.app');
        const isLocalhost = origin.includes('localhost');
        const isAllowedOrigin = allowedOrigins.includes(origin);

        if (isAllowedOrigin || isVercelDomain || isLocalhost) {
            console.log('CORS - Origin permitido:', origin);
            callback(null, true);
        } else {
            console.log('CORS - Origin bloqueado, mas permitindo temporariamente:', origin);
            // Em produção, permitir temporariamente para debug
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name',
        'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    optionsSuccessStatus: 200,
    preflightContinue: false
};

// Middleware CORS deve vir ANTES de tudo
app.use(cors(corsOptions));

// Middleware adicional para garantir headers CORS em todas as respostas
app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log('Middleware CORS - Origin:', origin);

    // Definir headers CORS manualmente para garantir compatibilidade
    if (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,X-File-Name');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Se for uma requisição OPTIONS, responder imediatamente
    if (req.method === 'OPTIONS') {
        console.log('Respondendo OPTIONS para:', req.url);
        return res.status(200).end();
    }

    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de debug para CORS e requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Origin:', req.get('Origin'));
    console.log('User-Agent:', req.get('User-Agent'));
    next();
});

// Conexão com o MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biocalib', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
})
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Rotas
app.use('/api/equipamentos', require('./routes/equipamentos'));
app.use('/api/calibracoes', require('./routes/calibracoes'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/admin/token', require('./routes/token'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/configuracoes', require('./routes/configuracoes'));
app.use('/api/notificacoes', require('./routes/notificacoes'));

// Rota de health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        cors: 'enabled'
    });
});

// Rota de teste CORS (pública)
app.get('/api/test', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.status(200).json({
        message: 'CORS test successful',
        origin: req.get('Origin'),
        timestamp: new Date().toISOString(),
        method: req.method
    });
});

// Rota padrão
app.get('/', (req, res) => {
    res.send('API do BioCalib funcionando!');
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro capturado:', err.stack);
    res.status(500).json({
        error: 'Algo deu errado!',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});