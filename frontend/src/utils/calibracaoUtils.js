/**
 * Utilities para cálculos de calibração de micropipetas - BioOrbit
 * Implementa as regras da ISO 8655 para validação de equipamentos
 */

/**
 * Calcula o erro relativo entre volume nominal e medido
 * @param {number} volumeNominal - Volume esperado em μL
 * @param {number} volumeMedido - Volume medido na calibração em μL
 * @returns {number} Erro relativo em porcentagem
 */
export const calcularErroRelativo = (volumeNominal, volumeMedido) => {
    if (volumeNominal === 0) return 0
    return ((volumeMedido - volumeNominal) / volumeNominal) * 100
}

/**
 * Calcula a média de um array de medições
 * @param {Array<string|number>} medicoes - Array de medições
 * @returns {number|null} Média das medições válidas ou null se não houver valores válidos
 */
export const calcularMedia = (medicoes) => {
    const valoresNumericos = medicoes
        .filter(med => med !== "" && med != null)
        .map(med => parseFloat(med))
        .filter(val => !isNaN(val))

    if (valoresNumericos.length === 0) return null

    const soma = valoresNumericos.reduce((acc, val) => acc + val, 0)
    return soma / valoresNumericos.length
}

/**
 * Determina o status de calibração baseado nos limites da ISO 8655
 * @param {Array<string|number>} medicoes - Array de medições
 * @param {number} volumeNominal - Volume nominal em μL
 * @returns {string} Status: 'APROVADO', 'REPROVADO' ou 'DADOS_INSUFICIENTES'
 */
export const determinarStatusCalibracao = (medicoes, volumeNominal) => {
    const media = calcularMedia(medicoes)
    if (media === null) return 'DADOS_INSUFICIENTES'

    const erroRelativo = Math.abs(calcularErroRelativo(volumeNominal, media))

    // Limites de erro para micropipetas segundo ISO 8655
    const limite = volumeNominal >= 100 ? 2.0 : 5.0 // 2% para ≥100μL, 5% para <100μL

    return erroRelativo <= limite ? 'APROVADO' : 'REPROVADO'
}

/**
 * Calcula desvio padrão de medições
 * @param {Array<string|number>} medicoes - Array de medições
 * @param {number} media - Média pré-calculada
 * @returns {number|null} Desvio padrão ou null se dados insuficientes
 */
export const calcularDesvioPadrao = (medicoes, media) => {
    if (media === null) return null

    const valoresNumericos = medicoes
        .filter(med => med !== "" && med != null)
        .map(med => parseFloat(med))
        .filter(val => !isNaN(val))

    if (valoresNumericos.length <= 1) return 0

    const somaDosQuadradosDasDiferencas = valoresNumericos.reduce(
        (acc, val) => acc + Math.pow(val - media, 2),
        0
    )

    return Math.sqrt(somaDosQuadradosDasDiferencas / (valoresNumericos.length - 1))
}

/**
 * Calcula coeficiente de variação (CV%)
 * @param {number} desvioPadrao - Desvio padrão
 * @param {number} media - Média
 * @returns {number|null} CV% ou null se dados inválidos
 */
export const calcularCoeficienteVariacao = (desvioPadrao, media) => {
    if (media === null || media === 0 || desvioPadrao === null) return null
    return (desvioPadrao / media) * 100
}

/**
 * Valida se o volume está dentro da faixa operacional (10-100% da capacidade)
 * @param {number} volume - Volume a ser validado
 * @param {number} capacidadeMaxima - Capacidade máxima do equipamento
 * @returns {boolean} True se dentro da faixa operacional
 */
export const validarFaixaOperacional = (volume, capacidadeMaxima) => {
    const percentual = (volume / capacidadeMaxima) * 100
    return percentual >= 10 && percentual <= 100
}

/**
 * Valida se o erro está dentro dos limites aceitáveis
 * @param {number} erroPercentual - Erro em percentual
 * @param {number} volumeNominal - Volume nominal em μL
 * @returns {boolean} True se erro está dentro dos limites
 */
export const validarErro = (erroPercentual, volumeNominal) => {
    const limite = volumeNominal >= 100 ? 2.0 : 5.0
    return Math.abs(erroPercentual) <= limite
}

/**
 * Valida condições ambientais para calibração
 * @param {number} temperatura - Temperatura em °C
 * @returns {boolean} True se temperatura está na faixa válida (15-35°C)
 */
export const validarTemperatura = (temperatura) => {
    return temperatura >= 15 && temperatura <= 35
}

/**
 * Valida umidade relativa para calibração
 * @param {number} umidade - Umidade relativa em %
 * @returns {boolean} True se umidade está na faixa válida (30-80%)
 */
export const validarUmidade = (umidade) => {
    return umidade >= 30 && umidade <= 80
}