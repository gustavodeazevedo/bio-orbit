import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { imageToBase64 } from '../utils/imageUtils';

// Configurar as fontes corretamente para compatibilidade ESM/CJS
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
} else if (pdfFonts.default && pdfFonts.default.pdfMake) {
    pdfMake.vfs = pdfFonts.default.pdfMake.vfs;
}

// Configurar fontes usando as fontes padrão do sistema
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};

// Função para formatar data local evitando problemas de fuso horário
const formatarDataLocal = (dataString) => {
    if (!dataString) return '';

    // Separar a data string (formato: YYYY-MM-DD)
    const [ano, mes, dia] = dataString.split('-');

    // Criar data local usando os componentes separados
    const dataLocal = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

    // Formatar para o padrão brasileiro
    return dataLocal.toLocaleDateString('pt-BR');
};

/**
 * Serviço responsável pela geração de certificados de calibração em PDF
 */
export class PDFService {    /**
     * Gera um certificado de calibração em PDF seguindo o modelo Bio Research
     * @param {Object} dadosCertificado - Dados do certificado
     * @param {Object} cliente - Dados do cliente
     * @param {Array} pontosCalibra - Pontos de calibração (ou seringas para repipetadores)
     * @param {number} fatorZ - Fator Z calculado
     * @param {Array} seringas - Dados das seringas (opcional, para repipetadores)
     * @param {string} padroesUtilizados - Padrões utilizados configurados pelo usuário (opcional)
     */
    static async gerarCertificadoCalibracao(dadosCertificado, cliente, pontosCalibra, fatorZ, seringas = null, padroesUtilizados = null) {
        // Validações básicas
        if (!dadosCertificado || !cliente || !fatorZ) {
            throw new Error('Dados insuficientes para gerar o certificado');
        }

        // Verificar se é repipetador e tem seringas
        if (dadosCertificado.tipoEquipamento === 'repipetador') {
            if (!seringas || seringas.length === 0) {
                throw new Error('É necessário ter pelo menos uma seringa para repipetadores');
            }
        } else {
            // Para micropipetas, validar pontos de calibração
            if (!pontosCalibra || pontosCalibra.length === 0) {
                throw new Error('É necessário ter pelo menos um ponto de calibração');
            }
        }// Carregar a imagem do cabeçalho
        const imagemCabecalho = await PDFService.carregarImagemCabecalho();

        // Carregar a imagem da assinatura
        const imagemAssinatura = await PDFService.carregarImagemAssinatura();

        // Carregar a imagem do rodapé
        const imagemRodape = await PDFService.carregarImagemRodape();        // Gerar número do certificado baseado na série
        const numeroCertificado = `CAL – ${dadosCertificado.numeroCertificado || 'XXXX'}`; const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, imagemCabecalho ? 140 : 80, 40, imagemRodape ?
                // Margem dinâmica baseada no número de pontos para monocanais
                (dadosCertificado.tipoInstrumento === 'monocanal' && dadosCertificado.tipoEquipamento !== 'repipetador' && pontosCalibra.length === 1) ? 135 :
                    (dadosCertificado.tipoInstrumento === 'monocanal' && dadosCertificado.tipoEquipamento !== 'repipetador' && pontosCalibra.length === 2) ? 135 :
                        140 : 100],
            defaultStyle: {
                font: 'Roboto'
            },// Cabeçalho em todas as páginas
            header: function (currentPage, pageCount) {
                // Margens diferentes para monocanal vs multicanal
                const isMonocanal = dadosCertificado.tipoInstrumento === 'monocanal';

                return imagemCabecalho ? {
                    image: imagemCabecalho,
                    width: 515,
                    alignment: 'center',
                    margin: isMonocanal ? [0, 4, 0, 10] : [0, 20, 0, 10]
                } : {
                    stack: [
                        {
                            text: 'Bio Research do Brasil Instrumentação Científica Ltda',
                            style: 'companyName',
                            alignment: 'center',
                            margin: [0, 20, 0, 5]
                        },
                        {
                            text: 'CNPJ: 14.088.552/0001-92',
                            style: 'companyInfo',
                            alignment: 'center',
                            margin: [0, 0, 0, 3]
                        },
                        {
                            text: 'Tel: (85) 3286-8748 | e-mail: bioorbit@bioorbit.com.br',
                            style: 'companyInfo',
                            alignment: 'center',
                            margin: [0, 0, 0, 20]
                        }
                    ],
                    margin: [40, 20, 40, 10]
                };
            },
            // Rodapé em todas as páginas
            footer: function (currentPage, pageCount) {
                if (imagemRodape) {
                    return {
                        image: imagemRodape,
                        width: 595,
                        alignment: 'center',
                        margin: [0, 21, 0, 20]
                    };
                }
                return null;
            },            // Faixa vertical verde no lado esquerdo como elemento decorativo
            background: function (currentPage, pageSize) {
                const isMonocanal = dadosCertificado.tipoInstrumento === 'monocanal';
                const isRepipetador = dadosCertificado.tipoEquipamento === 'repipetador';

                return [
                    {
                        canvas: [
                            {
                                type: 'rect',
                                x: 0,
                                y: (isMonocanal || isRepipetador)
                                    ? (imagemCabecalho ? 113 : 60)
                                    : (imagemCabecalho ? 140 : 80),
                                w: 20,
                                h: (isMonocanal || isRepipetador)
                                    ? pageSize.height - (imagemCabecalho ? 120 : 60) - (imagemRodape ? 140 : 100)
                                    : pageSize.height - (imagemCabecalho ? 140 : 80) - (imagemRodape ? 140 : 100),
                                color: '#D8E9A8'
                            }
                        ]
                    }
                ];
            }, content: [
                // Conteúdo principal                // 1. Título do certificado (obrigatório na primeira página)
                {
                    text: `CERTIFICADO DE CALIBRAÇÃO - BIORESEARCH DO BRASIL - Nº ${numeroCertificado}`,
                    style: 'title',
                    alignment: 'left',
                    margin: (dadosCertificado.tipoInstrumento === 'monocanal' || dadosCertificado.tipoEquipamento === 'repipetador') ? [0, -30, 0, 2] : [0, 0, 0, 2]
                },
                {
                    text: 'LABORATÓRIO DE CALIBRAÇÃO E ENSAIO',
                    style: 'subtitle',
                    alignment: 'left',
                    margin: [0, 0, 0, 25]
                },

                // 2. Dados do cliente e instrumento
                ...PDFService.criarBlocoDados(dadosCertificado, cliente),                // 3. Tabela de medições
                {
                    text: 'Tabela de Valores Obtidos:',
                    style: 'sectionTitle',
                    margin: [0, 0, 0, 10]
                },
                ...(dadosCertificado.tipoEquipamento === 'repipetador'
                    ? PDFService.criarTabelasRepipetador(seringas, dadosCertificado)
                    : PDFService.criarTabelasMedicoes(pontosCalibra, dadosCertificado)),                // 4. Padrões utilizados
                {
                    text: 'Padrões Utilizados:',
                    style: 'sectionTitle',
                    margin: [0, 5, 0, 8]
                }, {
                    text: padroesUtilizados || 'Termohigrômetro Digital HT600 Instrutherm, Certificado RBC Nº CAL – A 15694/25 , (Validade 08/2026).\nBalança Analítica Metter Toledo SAG250, Certificado RBC Nº CAL – A 15695/25, (Validade 08/2026).',
                    style: 'normalText',
                    margin: [0, 0, 0, 15]
                },// 5. Parâmetros ambientais
                {
                    text: 'Parâmetros:',
                    style: 'sectionTitle',
                    margin: [0, 0, 0, 8]
                },
                ...PDFService.criarBlocoParametros(dadosCertificado, fatorZ),                // 6. Assinatura
                {
                    stack: [
                        ...(imagemAssinatura ? [
                            {
                                columns: [
                                    { width: '*', text: '' },
                                    {
                                        width: 'auto',
                                        stack: [
                                            {
                                                image: imagemAssinatura,
                                                width: 150,
                                                alignment: 'center'
                                            },
                                            {
                                                canvas: [
                                                    {
                                                        type: 'line',
                                                        x1: 0,
                                                        y1: 0,
                                                        x2: 220,
                                                        y2: 0,
                                                        lineWidth: 1,
                                                        lineColor: '#000000'
                                                    }
                                                ],
                                                margin: [0, 0, 0, 5]
                                            },
                                            {
                                                text: 'Eng. Alejandro Mora Zuniga',
                                                style: 'signature',
                                                alignment: 'center'
                                            },
                                            {
                                                text: 'Diretor Responsável',
                                                style: 'signatureSubtext',
                                                alignment: 'center'
                                            }
                                        ]
                                    },
                                    { width: '*', text: '' }
                                ]
                            }
                        ] : [
                            {
                                text: 'Eng. Alejandro Mora Zuniga',
                                style: 'signature',
                                alignment: 'center'
                            },
                            {
                                text: 'Diretor Responsável',
                                style: 'signatureSubtext',
                                alignment: 'center'
                            }]),],
                    margin: (dadosCertificado.tipoInstrumento === 'monocanal' && dadosCertificado.tipoEquipamento !== 'repipetador') ?
                        // Para monocanais, margem menor já que aumentamos o espaço da página
                        pontosCalibra.length === 1 ? [0, 5, 0, 0] :
                            pontosCalibra.length === 2 ? [0, 10, 0, 0] :
                                [0, 15, 0, 0] : [0, 5, 0, 0],
                    unbreakable: true
                }
            ], styles: {
                companyName: {
                    font: 'Roboto',
                    fontSize: 16,
                    bold: true,
                    color: '#000000'
                },
                companyInfo: {
                    font: 'Roboto',
                    fontSize: 11,
                    color: '#000000'
                },
                title: {
                    font: 'Roboto',
                    fontSize: 14,
                    bold: true,
                    color: '#000000'
                },
                subtitle: {
                    font: 'Roboto',
                    fontSize: 12,
                    bold: true,
                    color: '#000000'
                }, sectionTitle: {
                    font: 'Roboto',
                    fontSize: 12,
                    bold: true,
                    color: '#000000',
                    margin: [0, 5, 0, 5]
                }, canalTitle: {
                    font: 'Roboto',
                    fontSize: 10,
                    bold: true,
                    italics: false,
                    color: '#000000',
                    margin: [0, 15, 0, 10],
                    lineHeight: 1.2
                },
                normalText: {
                    font: 'Roboto',
                    fontSize: 11,
                    color: '#000000',
                    lineHeight: 1.3
                },
                dataLabel: {
                    font: 'Roboto',
                    fontSize: 11,
                    color: '#000000',
                    lineHeight: 1.4
                },
                signature: {
                    font: 'Roboto',
                    fontSize: 12,
                    bold: true,
                    color: '#000000'
                },
                signatureSubtext: {
                    font: 'Roboto',
                    fontSize: 10,
                    bold: false,
                    color: '#000000'
                },                // Novo estilo para textos fixos (em negrito e itálico)
                staticText: {
                    font: 'Roboto',
                    fontSize: 11,
                    bold: true,
                    italics: true,
                    color: '#000000',
                    lineHeight: 1.2
                },
                // Estilo para textos fixos nas tabelas de medições (sem itálico)
                staticTextTable: {
                    font: 'Roboto',
                    fontSize: 10,
                    bold: true,
                    italics: false,
                    color: '#000000',
                    lineHeight: 1.2
                },
                // Novo estilo para textos dinâmicos (sem negrito)
                dynamicText: {
                    font: 'Roboto',
                    fontSize: 11,
                    bold: false,
                    color: '#000000',
                    lineHeight: 1.2
                }
            }
        };

        return pdfMake.createPdf(docDefinition);
    }

    /**
     * Carrega a imagem do cabeçalho com múltiplos fallbacks
     * @returns {Promise<string|null>} - Imagem em base64 ou null se falhar
     */
    static async carregarImagemCabecalho() {
        const caminhosPossiveis = [
            '/images/certificados/cabecalho.png',
            '/images/certificado-cabecalho.png',
            '/images/certificado-cabeçalho.png',
            './images/certificados/cabecalho.png',
            './images/certificado-cabecalho.png',
            './images/certificado-cabeçalho.png',
            './public/images/certificados/cabecalho.png',
            './public/images/certificado-cabecalho.png'
        ];

        for (const caminho of caminhosPossiveis) {
            try {
                console.log(`Tentando carregar imagem do cabeçalho: ${caminho}`);
                const imagem = await imageToBase64(caminho);
                console.log('Imagem do cabeçalho carregada com sucesso!');
                return imagem;
            } catch (error) {
                console.warn(`Falha ao carregar imagem do caminho ${caminho}:`, error.message);
            }
        }        // Tenta com URL absoluto como último recurso
        try {
            const baseUrl = window.location.origin;
            const caminhoAbsoluto = `${baseUrl}/images/certificados/cabecalho.png`;
            console.log(`Tentando carregar imagem com URL absoluto: ${caminhoAbsoluto}`);
            const imagem = await imageToBase64(caminhoAbsoluto);
            console.log('Imagem do cabeçalho carregada com URL absoluto!');
            return imagem;
        } catch (error) {
            console.warn('Falha ao carregar imagem com URL absoluto:', error.message);
        }

        console.warn('Não foi possível carregar a imagem do cabeçalho. Usando fallback em texto.');
        return null;
    }/**
     * Carrega a imagem da assinatura com múltiplos fallbacks
     * @returns {Promise<string|null>} - Imagem em base64 ou null se falhar
     */
    static async carregarImagemAssinatura() {
        const caminhosPossiveis = [
            '/images/certificados/assinatura.png',
            '/images/certificado-assinatura.png',
            './images/certificados/assinatura.png',
            './images/certificado-assinatura.png',
            './public/images/certificados/assinatura.png',
            './public/images/certificado-assinatura.png'
        ];

        for (const caminho of caminhosPossiveis) {
            try {
                console.log(`Tentando carregar imagem da assinatura: ${caminho}`);
                const imagem = await imageToBase64(caminho);
                console.log('Imagem da assinatura carregada com sucesso!');
                return imagem;
            } catch (error) {
                console.warn(`Falha ao carregar imagem da assinatura do caminho ${caminho}:`, error.message);
            }
        }

        // Tenta com URL absoluto como último recurso
        try {
            const baseUrl = window.location.origin;
            const caminhoAbsoluto = `${baseUrl}/images/certificados/assinatura.png`;
            console.log(`Tentando carregar imagem da assinatura com URL absoluto: ${caminhoAbsoluto}`);
            const imagem = await imageToBase64(caminhoAbsoluto);
            console.log('Imagem da assinatura carregada com URL absoluto!');
            return imagem;
        } catch (error) {
            console.warn('Falha ao carregar imagem da assinatura com URL absoluto:', error.message);
        }

        console.warn('Não foi possível carregar a imagem da assinatura. Usando apenas texto.');
        return null;
    }    /**
     * Carrega a imagem do rodapé com múltiplos fallbacks
     * @returns {Promise<string|null>} - Imagem em base64 ou null se falhar
     */
    static async carregarImagemRodape() {
        const caminhosPossiveis = [
            '/images/certificados/rodape.png',
            '/images/certificado-rodapé.png',
            './images/certificados/rodape.png',
            './images/certificado-rodapé.png',
            './public/images/certificados/rodape.png',
            './public/images/certificado-rodapé.png'
        ];

        for (const caminho of caminhosPossiveis) {
            try {
                console.log(`Tentando carregar imagem do rodapé: ${caminho}`);
                const imagem = await imageToBase64(caminho);
                console.log('Imagem do rodapé carregada com sucesso!');
                return imagem;
            } catch (error) {
                console.warn(`Falha ao carregar imagem do rodapé do caminho ${caminho}:`, error.message);
            }
        }

        // Tenta com URL absoluto como último recurso
        try {
            const baseUrl = window.location.origin;
            const caminhoAbsoluto = `${baseUrl}/images/certificados/rodape.png`;
            console.log(`Tentando carregar imagem do rodapé com URL absoluto: ${caminhoAbsoluto}`);
            const imagem = await imageToBase64(caminhoAbsoluto);
            console.log('Imagem do rodapé carregada com URL absoluto!');
            return imagem;
        } catch (error) {
            console.warn('Falha ao carregar imagem do rodapé com URL absoluto:', error.message);
        }

        console.warn('Não foi possível carregar a imagem do rodapé.');
        return null;
    }    /**
     * Cria o bloco de dados do cliente e instrumento
     */
    static criarBlocoDados(dadosCertificado, cliente) {
        const enderecoCompleto = PDFService.formatarEnderecoCompleto(cliente);
        const isRepipetador = dadosCertificado.tipoEquipamento === 'repipetador'; return [
            {
                text: [
                    { text: 'CLIENTE: ', style: 'staticText' },
                    { text: `${cliente?.nome?.toUpperCase() || 'N/A'}\n`, style: 'dynamicText' },

                    { text: 'ENDEREÇO: ', style: 'staticText' },
                    { text: `${enderecoCompleto.toUpperCase()}\n`, style: 'dynamicText' },

                    { text: 'INSTRUMENTO: ', style: 'staticText' },
                    { text: `${isRepipetador ? 'REPIPETADOR' : dadosCertificado.tipoEquipamento === 'bureta' ? 'BURETA' : `MICROPIPETA ${dadosCertificado.tipoInstrumento === 'monocanal' ? 'MONOCANAL' : 'MULTICANAL'}`}\n`, style: 'dynamicText' }, ...(isRepipetador ? [] : [
                        { text: 'FAIXA DE INDICAÇÃO: ', style: 'staticText' },
                        { text: `${dadosCertificado.faixaIndicacao ? dadosCertificado.faixaIndicacao + dadosCertificado.unidadeFaixaIndicacao : dadosCertificado.capacidade + dadosCertificado.unidadeCapacidade}\n`, style: 'dynamicText' },

                        { text: 'FAIXA CALIBRADA: ', style: 'staticText' },
                        { text: `${dadosCertificado.faixaCalibrada ? dadosCertificado.faixaCalibrada + dadosCertificado.unidadeFaixaCalibrada : dadosCertificado.capacidade + dadosCertificado.unidadeCapacidade}\n`, style: 'dynamicText' },
                    ]), { text: 'FABRICANTE: ', style: 'staticText' },
                    { text: `${dadosCertificado.marcaPipeta?.toUpperCase() || 'N/A'}\n`, style: 'dynamicText' },

                    { text: 'Nº DE IDENTIFICAÇÃO: ', style: 'staticText' },
                    { text: `${dadosCertificado.numeroIdentificacao?.toUpperCase() || 'N/A'}\n`, style: 'dynamicText' },

                    { text: 'Nº DE SÉRIE: ', style: 'staticText' },
                    { text: `${dadosCertificado.numeroPipeta?.toUpperCase() || 'N/A'}\n`, style: 'dynamicText' },

                    { text: 'MODELO: ', style: 'staticText' },
                    { text: `${dadosCertificado.modeloPipeta?.toUpperCase() || 'N/A'}\n`, style: 'dynamicText' }, { text: 'DATA DE CALIBRAÇÃO: ', style: 'staticText' },
                    { text: `${formatarDataLocal(dadosCertificado.dataCalibracao)}\n`, style: 'dynamicText' },

                    { text: 'DATA DA EMISSÃO DO CERTIFICADO: ', style: 'staticText' },
                    { text: `${formatarDataLocal(dadosCertificado.dataCalibracao)}`, style: 'dynamicText' }
                ],
                margin: [0, 0, 0, 15]
            }];
    }

    /**
     * Cria tabelas de medições para cada ponto com bordas
     */
    static criarTabelasMedicoes(pontosCalibra, dadosCertificado = {}) {
        // Verificar se é multicanal e tem propriedade canal nos pontos
        const isMulticanal = dadosCertificado.tipoInstrumento === 'multicanal';
        const temCanais = pontosCalibra.length > 0 && pontosCalibra[0].hasOwnProperty('canal');

        if (isMulticanal && temCanais) {
            return PDFService.criarTabelasMulticanal(pontosCalibra);
        } else {
            // Sempre coloca todos os pontos lado a lado para monocanal
            return PDFService.criarTabelasLadoALado(pontosCalibra);
        }
    }    /**
     * Cria tabelas organizadas por canal para micropipetas multicanais
     */
    static criarTabelasMulticanal(pontosCalibra) {
        const tabelas = [];

        // Agrupar pontos por canal
        const pontosPorCanal = {};
        pontosCalibra.forEach(ponto => {
            if (!pontosPorCanal[ponto.canal]) {
                pontosPorCanal[ponto.canal] = [];
            }
            pontosPorCanal[ponto.canal].push(ponto);
        });

        // Ordenar canais numericamente
        const canaisOrdenados = Object.keys(pontosPorCanal).sort((a, b) => parseInt(a) - parseInt(b));

        canaisOrdenados.forEach((canal, canalIndex) => {
            const pontosDoCanal = pontosPorCanal[canal];

            // Ordenar pontos do canal do menor para o maior volume
            pontosDoCanal.sort((a, b) => {
                const volumeA = parseFloat(a.volumeNominal) || 0;
                const volumeB = parseFloat(b.volumeNominal) || 0;
                return volumeA - volumeB;
            });

            // Criar as tabelas dos pontos deste canal usando numeração baseada em pontoPosicao
            const tabelasDoCanal = PDFService.criarTabelasLadoALadoMulticanal(pontosDoCanal);

            // Agrupar título e tabelas do canal em um bloco não quebrável
            const blocoCanal = {
                stack: [
                    {
                        text: `Canal ${canal}:`,
                        style: 'canalTitle',
                        margin: [0, canalIndex === 0 ? 0 : 20, 0, 10]
                    },
                    ...tabelasDoCanal
                ],
                unbreakable: true
            };

            tabelas.push(blocoCanal);
        });

        return tabelas;
    }

    /**
     * Cria tabelas lado a lado específica para multicanais, respeitando a pontoPosicao
     */
    static criarTabelasLadoALadoMulticanal(pontosCalibra) {
        if (!pontosCalibra || pontosCalibra.length === 0) {
            return [];
        }

        const tabelas = [];
        const PONTOS_POR_LINHA = 3; // Sempre 3 pontos por linha para manter consistência visual

        // Configuração fixa que SEMPRE será usada, independente do número de pontos
        const configFixa = {
            widths: [85, 5, 50, 12, 85, 5, 50, 12, 85, 5, 50], // Sempre 11 colunas = 3 pontos
            fontSize: 8,
            padding: { left: 2, right: 2, top: 0, bottom: 0 }
        };

        for (let i = 0; i < pontosCalibra.length; i += PONTOS_POR_LINHA) {
            const pontosOriginais = pontosCalibra.slice(i, i + PONTOS_POR_LINHA);

            // SEMPRE criar array com exatamente 3 elementos para manter estrutura idêntica
            const pontosPadronizados = [
                pontosOriginais[0] || null,
                pontosOriginais[1] || null,
                pontosOriginais[2] || null
            ];

            // Função para criar célula vazia com bordas invisíveis
            const criarCelulaVazia = () => ({
                text: '',
                border: [false, false, false, false],
                fontSize: configFixa.fontSize
            });

            // Função para criar coluna de ponto (sempre 3 células + separador se não for último)
            const criarColunaPonto = (ponto, indice, isUltimo) => {
                if (!ponto) {
                    // Ponto vazio: 3 células vazias + separador se não for último
                    const colunas = [criarCelulaVazia(), criarCelulaVazia(), criarCelulaVazia()];
                    if (!isUltimo) {
                        colunas.push(criarCelulaVazia()); // Separador
                    }
                    return colunas;
                }

                // Usar numeração sequencial baseada na posição global após ordenação
                const numeroPonto = i + indice + 1;

                const colunas = [
                    { text: `Ponto ${numeroPonto} de medição`, style: 'staticTextTable', fontSize: configFixa.fontSize, bold: true },
                    { text: ':', style: 'staticTextTable', alignment: 'center', fontSize: configFixa.fontSize },
                    { text: `${ponto.volumeNominal}${ponto.unidade || 'µL'}`, style: 'dynamicText', fontSize: configFixa.fontSize, bold: true }
                ];

                // Sempre adicionar separador se não for o último (índice 2)
                if (!isUltimo) {
                    colunas.push(criarCelulaVazia());
                }

                return colunas;
            };

            // Função para criar linha de dados (sempre 11 colunas)
            const criarLinhaDados = (propriedade, label, unidadePadrao = '') => {
                return pontosPadronizados.flatMap((ponto, idx) => {
                    const isUltimo = idx === 2;

                    if (!ponto) {
                        return criarColunaPonto(null, idx, isUltimo);
                    }

                    let valor = '';
                    if (propriedade === 'medicoes') {
                        valor = '10'; // Número fixo de medições
                    } else if (propriedade === 'media') {
                        valor = `${ponto.media ? PDFService.formatarNumero(ponto.media) : '0,00'}${ponto.unidade || unidadePadrao}`;
                    } else if (propriedade === 'inexatidao') {
                        valor = `${ponto.inexatidao ? PDFService.formatarNumero(ponto.inexatidao) : '0,00'}${ponto.unidade || unidadePadrao}`;
                    } else if (propriedade === 'desvioPadrao') {
                        valor = `${ponto.desvioPadrao ? PDFService.formatarNumero(ponto.desvioPadrao) : '0,00'}${ponto.unidade || unidadePadrao}`;
                    }

                    const colunas = [
                        { text: label, style: 'dynamicText', fontSize: configFixa.fontSize, bold: false },
                        { text: ':', style: 'dynamicText', alignment: 'center', fontSize: configFixa.fontSize, bold: false },
                        { text: valor, style: 'dynamicText', fontSize: configFixa.fontSize, bold: false }
                    ];

                    if (!isUltimo) {
                        colunas.push(criarCelulaVazia());
                    }

                    return colunas;
                });
            };

            // Criação das 5 linhas da tabela (SEMPRE 5 linhas x 11 colunas)
            const linhas = [
                // Linha 1: Títulos dos pontos
                pontosPadronizados.flatMap((ponto, idx) => criarColunaPonto(ponto, idx, idx === 2)),

                // Linha 2: Número de medições  
                criarLinhaDados('medicoes', 'Número de medições'),

                // Linha 3: Média
                criarLinhaDados('media', 'Média', 'µL'),

                // Linha 4: Inexatidão
                criarLinhaDados('inexatidao', 'Inexatidão / ISO8655', 'µL'),

                // Linha 5: Incerteza
                criarLinhaDados('desvioPadrao', 'Incerteza / ISO8655', 'µL')
            ];

            // Criação da tabela com configuração SEMPRE idêntica
            tabelas.push({
                table: {
                    headerRows: 0,
                    widths: configFixa.widths, // SEMPRE as mesmas 11 larguras
                    body: linhas, // SEMPRE 5 linhas x 11 colunas
                    dontBreakRows: true
                },
                layout: {
                    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0,
                    vLineWidth: (i, node) => {
                        // Layout SEMPRE para 3 pontos (posições fixas das bordas verticais)
                        // [0:P1][1::][2:val] | [3:esp] | [4:P2][5::][6:val] | [7:esp] | [8:P3][9::][10:val]
                        return (i === 0 || i === 3 || i === 4 || i === 7 || i === 8 || i === 11) ? 1 : 0;
                    },
                    hLineColor: '#000000',
                    vLineColor: '#000000',
                    paddingLeft: () => configFixa.padding.left,
                    paddingRight: () => configFixa.padding.right,
                    paddingTop: () => configFixa.padding.top,
                    paddingBottom: () => configFixa.padding.bottom
                },
                margin: [0, 0, 0, 15]
            });
        }

        return tabelas;
    }

    /**
     * Método mantido para compatibilidade (caso precise de layout vertical)
     */
    static criarTabelasVerticais(pontosCalibra) {
        const tabelas = [];

        // Ordenar pontos do menor para o maior volume
        const pontosOrdenados = [...pontosCalibra].sort((a, b) => {
            const volumeA = parseFloat(a.volumeNominal) || 0;
            const volumeB = parseFloat(b.volumeNominal) || 0;
            return volumeA - volumeB;
        });

        pontosOrdenados.forEach((ponto, index) => {
            tabelas.push({
                table: {
                    headerRows: 0,
                    widths: [110, 10, 60], // Aumentado coluna de valores de 50 para 60
                    dontBreakRows: true,
                    body: [[
                        { text: `Ponto ${index + 1} de medição`, style: 'staticTextTable' },
                        { text: ':', style: 'staticTextTable', alignment: 'center' },
                        { text: `${ponto.volumeNominal}${ponto.unidade || 'µL'}`, style: 'dynamicText' }
                    ],
                    [
                        { text: 'Número de medições', style: 'staticTextTable' },
                        { text: ':', style: 'staticTextTable', alignment: 'center' },
                        { text: '10', style: 'dynamicText' } // Número fixo de medições
                    ],
                    [
                        { text: 'Média', style: 'staticTextTable' },
                        { text: ':', style: 'staticTextTable', alignment: 'center' },
                        { text: `${ponto.media ? PDFService.formatarNumero(ponto.media) : '0,00'}${ponto.unidade || 'µL'}`, style: 'dynamicText' }
                    ],
                    [
                        { text: 'Inexatidão / ISO8655', style: 'staticTextTable' },
                        { text: ':', style: 'staticTextTable', alignment: 'center' },
                        { text: `${ponto.inexatidao ? PDFService.formatarNumero(ponto.inexatidao) : '0,00'}${ponto.unidade || 'µL'}`, style: 'dynamicText' }
                    ],
                    [
                        { text: 'Incerteza / ISO8655', style: 'staticTextTable' },
                        { text: ':', style: 'staticTextTable', alignment: 'center' },
                        { text: `${ponto.desvioPadrao ? PDFService.formatarNumero(ponto.desvioPadrao) : '0,00'}${ponto.unidade || 'µL'}`, style: 'dynamicText' }
                    ]
                    ]
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 1 : 0;
                    },
                    vLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.widths.length) ? 1 : 0;
                    },
                    hLineColor: '#000000',
                    vLineColor: '#000000',
                    paddingLeft: function (i, node) { return 4; },
                    paddingRight: function (i, node) { return 4; },
                    paddingTop: function (i, node) { return 2; },
                    paddingBottom: function (i, node) { return 2; }
                },
                margin: [0, 0, 0, 15]
            });
        }); return tabelas;
    }

    /**
     * Cria tabelas lado a lado com máximo de 3 pontos por linha
     */
    static criarTabelasLadoALado(pontosCalibra) {
        if (!pontosCalibra || pontosCalibra.length === 0) {
            return [];
        }

        // Ordenar pontos do menor para o maior volume
        const pontosOrdenados = [...pontosCalibra].sort((a, b) => {
            const volumeA = parseFloat(a.volumeNominal) || 0;
            const volumeB = parseFloat(b.volumeNominal) || 0;
            return volumeA - volumeB;
        });

        const tabelas = [];
        const PONTOS_POR_LINHA = 3;

        for (let i = 0; i < pontosOrdenados.length; i += PONTOS_POR_LINHA) {
            const pontosNessaLinha = pontosOrdenados.slice(i, i + PONTOS_POR_LINHA);
            const quantidadePontos = pontosNessaLinha.length;            // Configuração de larguras das colunas com base na quantidade de pontos
            const configuracoes = {
                1: {
                    widths: [110, 8, 60], // Aumentado coluna de valores de 50 para 60
                    fontSize: 10,
                    padding: { left: 4, right: 4, top: 0, bottom: 0 }
                },
                2: {
                    widths: [100, 6, 60, 15, 100, 6, 60], // Aumentado colunas de valores de 50 para 60, ajustado labels de 110 para 100
                    fontSize: 9,
                    padding: { left: 3, right: 3, top: 0, bottom: 0 }
                },
                3: {
                    widths: [85, 5, 50, 12, 85, 5, 50, 12, 85, 5, 50], // Aumentado colunas de valores de 40 para 50, ajustado labels de 95 para 85
                    fontSize: 8,
                    padding: { left: 2, right: 2, top: 0, bottom: 0 }
                }
            };

            const config = configuracoes[quantidadePontos];            // Criação das linhas da tabela
            const linhas = [                // Linha 1: Título dos pontos
                pontosNessaLinha.flatMap((ponto, idx) => {
                    const colunas = [
                        { text: `Ponto ${i + idx + 1} de medição`, style: 'staticTextTable', fontSize: config.fontSize, bold: true },
                        { text: ':', style: 'staticTextTable', alignment: 'center', fontSize: config.fontSize },
                        { text: `${ponto.volumeNominal}${ponto.unidade || 'µL'}`, style: 'dynamicText', fontSize: config.fontSize, bold: true }
                    ];

                    // Adiciona coluna de espaçamento se não for o último ponto da linha
                    if (idx < pontosNessaLinha.length - 1) {
                        colunas.push({ text: '', border: [false, false, false, false] });
                    }

                    return colunas;
                }),                // Linha 2: Número de medições
                pontosNessaLinha.flatMap((ponto, idx) => {
                    const colunas = [
                        { text: 'Número de medições', style: 'dynamicText', fontSize: config.fontSize, bold: false },
                        { text: ':', style: 'dynamicText', alignment: 'center', fontSize: config.fontSize, bold: false },
                        { text: '10', style: 'dynamicText', fontSize: config.fontSize, bold: false } // Número fixo de medições
                    ];

                    if (idx < pontosNessaLinha.length - 1) {
                        colunas.push({ text: '', border: [false, false, false, false] });
                    }

                    return colunas;
                }),                // Linha 3: Média
                pontosNessaLinha.flatMap((ponto, idx) => {
                    const colunas = [
                        { text: 'Média', style: 'dynamicText', fontSize: config.fontSize, bold: false },
                        { text: ':', style: 'dynamicText', alignment: 'center', fontSize: config.fontSize, bold: false },
                        { text: `${ponto.media ? PDFService.formatarNumero(ponto.media) : '0,00'}${ponto.unidade || 'µL'}`, style: 'dynamicText', fontSize: config.fontSize, bold: false }
                    ];

                    if (idx < pontosNessaLinha.length - 1) {
                        colunas.push({ text: '', border: [false, false, false, false] });
                    }

                    return colunas;
                }),                // Linha 4: Inexatidão
                pontosNessaLinha.flatMap((ponto, idx) => {
                    const colunas = [
                        { text: 'Inexatidão / ISO8655', style: 'dynamicText', fontSize: config.fontSize, bold: false },
                        { text: ':', style: 'dynamicText', alignment: 'center', fontSize: config.fontSize, bold: false },
                        { text: `${ponto.inexatidao ? PDFService.formatarNumero(ponto.inexatidao) : '0,00'}${ponto.unidade || 'µL'}`, style: 'dynamicText', fontSize: config.fontSize, bold: false }
                    ];

                    if (idx < pontosNessaLinha.length - 1) {
                        colunas.push({ text: '', border: [false, false, false, false] });
                    }

                    return colunas;
                }),                // Linha 5: Incerteza
                pontosNessaLinha.flatMap((ponto, idx) => {
                    const colunas = [
                        { text: 'Incerteza / ISO8655', style: 'dynamicText', fontSize: config.fontSize, bold: false },
                        { text: ':', style: 'dynamicText', alignment: 'center', fontSize: config.fontSize, bold: false },
                        { text: `${ponto.desvioPadrao ? PDFService.formatarNumero(ponto.desvioPadrao) : '0,00'}${ponto.unidade || 'µL'}`, style: 'dynamicText', fontSize: config.fontSize, bold: false }
                    ];

                    if (idx < pontosNessaLinha.length - 1) {
                        colunas.push({ text: '', border: [false, false, false, false] });
                    }

                    return colunas;
                })
            ]; tabelas.push({
                table: {
                    headerRows: 0,
                    widths: config.widths,
                    body: linhas,
                    dontBreakRows: true
                }, layout: {
                    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0,
                    vLineWidth: (i, node) => {
                        // Desenhar bordas verticais que conectam todos os pontos
                        if (quantidadePontos === 1) {
                            // Para 1 ponto: apenas bordas externas
                            return (i === 0 || i === node.table.widths.length) ? 1 : 0;
                        } else if (quantidadePontos === 2) {
                            // Para 2 pontos: bordas externas + borda que separa os pontos (após ponto 1)
                            // Posições: [0:Ponto1][1::][2:valor] | [3:espaço] | [4:Ponto2][5::][6:valor]
                            return (i === 0 || i === 3 || i === 4 || i === node.table.widths.length) ? 1 : 0;
                        } else if (quantidadePontos === 3) {
                            // Para 3 pontos: bordas externas + bordas que separam cada ponto
                            // Posições: [0:P1][1::][2:val] | [3:esp] | [4:P2][5::][6:val] | [7:esp] | [8:P3][9::][10:val]
                            return (i === 0 || i === 3 || i === 4 || i === 7 || i === 8 || i === node.table.widths.length) ? 1 : 0;
                        }
                        return 0;
                    },
                    hLineColor: '#000000',
                    vLineColor: '#000000',
                    paddingLeft: () => config.padding.left,
                    paddingRight: () => config.padding.right,
                    paddingTop: () => config.padding.top,
                    paddingBottom: () => config.padding.bottom
                },
                margin: [0, 0, 0, 15]
            });
        }

        return tabelas;
    }

    /**
     * Cria os blocos de medições para cada ponto
     */
    static criarBlocosMedicoes(pontosCalibra) {
        const blocos = [];

        // Ordenar pontos do menor para o maior volume
        const pontosOrdenados = [...pontosCalibra].sort((a, b) => {
            const volumeA = parseFloat(a.volumeNominal) || 0;
            const volumeB = parseFloat(b.volumeNominal) || 0;
            return volumeA - volumeB;
        });

        pontosOrdenados.forEach((ponto, index) => {
            blocos.push({
                text: [
                    { text: `Ponto ${index + 1} de medição        : `, style: 'staticText' },
                    { text: `${ponto.volumeNominal}${ponto.unidade || 'µL'}\n`, style: 'dynamicText' },

                    { text: 'Número de medições        : ', style: 'staticText' },
                    { text: '10\n', style: 'dynamicText' }, // Número fixo de medições

                    { text: 'Média                                 : ', style: 'staticText' },
                    { text: `${ponto.media ? PDFService.formatarNumero(ponto.media) : '0,00'}${ponto.unidade || 'µL'}\n`, style: 'dynamicText' },

                    { text: 'Inexatidão / ISO8655       : ', style: 'staticText' },
                    { text: `${ponto.inexatidao ? PDFService.formatarNumero(ponto.inexatidao) : '0,00'}${ponto.unidade || 'µL'}\n`, style: 'dynamicText' },

                    { text: 'Incerteza / ISO8655         : ', style: 'staticText' },
                    { text: `${ponto.desvioPadrao ? PDFService.formatarNumero(ponto.desvioPadrao) : '0,00'}${ponto.unidade || 'µL'}`, style: 'dynamicText' }
                ],
                margin: [0, 0, 0, 10]
            });
        });

        return blocos;
    }    /**
     * Cria o bloco de parâmetros ambientais
     */
    static criarBlocoParametros(dadosCertificado, fatorZ) {
        const isMonocanal = dadosCertificado.tipoInstrumento === 'monocanal';
        const isRepipetador = dadosCertificado.tipoEquipamento === 'repipetador';

        return [
            {
                text: [
                    { text: 'Temperatura                        : ', style: 'staticText' },
                    { text: `${dadosCertificado.temperatura} ºC\n`, style: 'dynamicText' },

                    { text: 'Umidade Relativa do Ar     : ', style: 'staticText' },
                    { text: `${dadosCertificado.umidadeRelativa}%\n`, style: 'dynamicText' },

                    { text: 'Valor Z de correção            : ', style: 'staticText' },
                    { text: `${PDFService.formatarFatorZ(fatorZ)} µL/mg\n`, style: 'dynamicText' }, { text: 'Prova de acordo                 : ', style: 'staticText' },
                    { text: 'ISO8655', style: 'dynamicText' }
                ],
                margin: isMonocanal ? [0, 0, 0, -3] : [0, 0, 0, 2] // Margem negativa para monocanal
            }
        ];
    }

    /**
     * Formata o endereço completo do cliente
     */    /**
* Formata o endereço completo do cliente para exibição no certificado
* Padrão: "Logradouro, número - Bairro - Cidade - Estado - CEP 00000-000"
* Exemplo: "Avenida Thomas Edison, 294 - Barra Funda - São Paulo - SP - CEP 01140-000"
*/
    static formatarEnderecoCompleto(cliente) {
        if (!cliente) return 'N/A';

        // Verificar se o endereço está em cliente.endereco ou diretamente em cliente
        const enderecoData = cliente.endereco || cliente;

        if (!enderecoData) return 'Endereço não informado';

        // Construir endereço seguindo o padrão: "Logradouro, número - Bairro - Cidade - Estado - CEP"
        let enderecoFormatado = '';

        // 1. Logradouro (rua, avenida, etc.)
        const logradouro = enderecoData.logradouro || enderecoData.rua;
        if (logradouro) {
            enderecoFormatado += logradouro;
        }

        // 2. Número
        if (enderecoData.numero) {
            if (enderecoFormatado) enderecoFormatado += ', ';
            enderecoFormatado += enderecoData.numero;
        }

        // 3. Bairro
        if (enderecoData.bairro) {
            if (enderecoFormatado) enderecoFormatado += ' - ';
            enderecoFormatado += enderecoData.bairro;
        }

        // 4. Cidade
        if (enderecoData.cidade) {
            if (enderecoFormatado) enderecoFormatado += ' - ';
            enderecoFormatado += enderecoData.cidade;
        }

        // 5. Estado
        if (enderecoData.estado) {
            if (enderecoFormatado) enderecoFormatado += ' - ';
            enderecoFormatado += enderecoData.estado.toUpperCase();
        }

        // 6. CEP
        if (enderecoData.cep) {
            // Remove caracteres não numéricos
            const cepFormatado = enderecoData.cep.replace(/\D/g, '');
            // Só adiciona CEP se tiver 8 dígitos
            if (cepFormatado.length === 8) {
                if (enderecoFormatado) enderecoFormatado += ' - ';
                enderecoFormatado += `CEP ${cepFormatado.slice(0, 5)}-${cepFormatado.slice(5)}`;
            }
            // Se não houver CEP válido, não adiciona nada
        }

        return enderecoFormatado || 'Endereço não informado';
    }/**
     * Formata números no padrão brasileiro (vírgula como separador decimal)
     */
    static formatarNumero(numero) {
        if (numero === null || numero === undefined || numero === '') {
            return '0,00';
        }

        // Converter para string se não for
        let numeroStr = String(numero);

        // Se já está formatado com vírgula, retorna como está
        if (numeroStr.includes(',')) {
            return numeroStr;
        }

        // Converter para number se for string
        const num = typeof numero === 'number' ? numero : parseFloat(numeroStr);

        if (isNaN(num)) {
            return '0,00';
        }

        // Formatar com 2 casas decimais e vírgula
        return num.toFixed(2).replace('.', ',');
    }

    /**
     * Formata o fator Z com precisão adequada (4 casas decimais)
     */
    static formatarFatorZ(numero) {
        if (numero === null || numero === undefined || numero === '') {
            return '1,0000';
        }

        // Converter para string se não for
        let numeroStr = String(numero);

        // Se já está formatado com vírgula, retorna como está
        if (numeroStr.includes(',')) {
            return numeroStr;
        }

        // Converter para number se for string
        const num = typeof numero === 'number' ? numero : parseFloat(numeroStr);

        if (isNaN(num)) {
            return '1,0000';
        }

        // Formatar com 4 casas decimais e vírgula para fator Z
        return num.toFixed(4).replace('.', ',');
    }

    /**
     * Baixa o PDF gerado
     */
    static baixarPDF(pdf, nomeArquivo) {
        pdf.download(nomeArquivo);
    }

    /**
     * Abre o PDF em uma nova aba
     */
    static abrirPDF(pdf) {
        pdf.open();
    }    /**
     * Cria tabelas específicas para repipetadores (organizadas por seringa)
     * Cada seringa tem seus próprios pontos de calibração
     */
    static criarTabelasRepipetador(seringas, dadosCertificado = {}) {
        if (!seringas || seringas.length === 0) {
            return [];
        }

        const tabelas = [];

        // Ordenar seringas do menor para o maior volume
        const seringasOrdenadas = [...seringas].sort((a, b) => {
            const volumeA = parseFloat(a.volumeNominal) || 0;
            const volumeB = parseFloat(b.volumeNominal) || 0;
            return volumeA - volumeB;
        });

        seringasOrdenadas.forEach((seringa, seringaIndex) => {
            // Título da seringa
            tabelas.push({
                text: `Seringa de ${seringa.volumeNominal}${seringa.unidade || 'µL'}:`,
                style: 'canalTitle',
                margin: [0, seringaIndex === 0 ? 0 : 20, 0, 10]
            });

            // Criar tabelas dos pontos desta seringa
            const pontosSeringa = seringa.pontosCalibra || [];
            if (pontosSeringa.length > 0) {
                const tabelasDosPontos = PDFService.criarTabelasLadoALado(pontosSeringa);
                tabelas.push(...tabelasDosPontos);
            }
        });

        return tabelas;
    }
}
