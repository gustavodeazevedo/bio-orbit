const ML_PATTERN = /\bml\b/i;

const toNumber = (value) => {
    if (value === null || value === undefined) return Number.NaN;
    const normalized = String(value)
        .replace(/\*\*/g, "")
        .replace(/,/g, ".")
        .replace(/\s+/g, "")
        .replace(/[^\d.-]/g, "");

    if (!normalized || normalized === "-" || normalized === ".") {
        return Number.NaN;
    }

    return Number.parseFloat(normalized);
};

const hasNumericValue = (value) => /\d/.test(String(value || ""));

const getLineValue = (text, pattern) => {
    const match = text.match(pattern);
    return match ? match[1].trim() : "";
};

const countMatches = (text, pattern) => {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const regex = new RegExp(pattern.source, flags);
    const matches = text.match(regex);
    return matches ? matches.length : 0;
};

const normalizeOrderNumber = (value) => {
    const digits = String(value || "")
        .replace(/\*\*/g, "")
        .replace(/[^\d]/g, "")
        .trim();

    if (!digits) return "";

    return String(Number.parseInt(digits, 10));
};

const normalizeUniqueTextValue = (value) => {
    const normalized = String(value || "")
        .replace(/\*\*/g, "")
        .trim()
        .toUpperCase();

    if (!normalized || /^(N\/?A|NA)$/i.test(normalized)) {
        return "";
    }

    return normalized;
};

const parseRange = (value) => {
    if (!value) return null;

    const rangeMatch = value.match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)/);
    if (rangeMatch) {
        const first = toNumber(rangeMatch[1]);
        const second = toNumber(rangeMatch[2]);
        if (Number.isFinite(first) && Number.isFinite(second)) {
            return {
                min: Math.min(first, second),
                max: Math.max(first, second),
            };
        }
    }

    const singleMatch = value.match(/(\d+(?:[.,]\d+)?)/);
    if (singleMatch) {
        const single = toNumber(singleMatch[1]);
        if (Number.isFinite(single)) {
            return { min: single, max: single };
        }
    }

    return null;
};

const parseCalibrationPointsFromText = (text) => {
    const points = [];
    const lineRegex = /^\s*-\s*(\d+(?:[.,]\d+)?)\s*=\s*([^\n\r]*)/gm;
    let match;

    while ((match = lineRegex.exec(text)) !== null) {
        const nominalVolume = toNumber(match[1]);
        const rawValues = match[2]
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        const measurements = rawValues
            .map((item) => toNumber(item))
            .filter((item) => Number.isFinite(item));

        points.push({
            nominalVolume,
            rawNominal: match[1],
            rawValues,
            measurements,
        });
    }

    return points;
};

const validateExtractedPoints = (extractedData, errors) => {
    if (!Array.isArray(extractedData?.pontosCalibra)) return;

    extractedData.pontosCalibra.forEach((point, index) => {
        const pointLabel = `Ponto ${index + 1}`;
        const nominal = toNumber(point?.volumeNominal);

        if (!Number.isFinite(nominal) || nominal <= 0) {
            errors.push(`${pointLabel}: volume nominal invalido.`);
        }

        const measurements = Array.isArray(point?.medicoes)
            ? point.medicoes
                .map((value) => toNumber(value))
                .filter((value) => Number.isFinite(value))
            : [];

        if (measurements.length !== 10) {
            errors.push(`${pointLabel}: sao necessarias 10 medicoes validas.`);
        }
    });
};

const validateFieldPresenceAndDuplicates = (text, errors) => {
    const requiredFields = [
        { label: "INSTRUMENTO", pattern: /^\s*INSTRUMENTO\s*:/gim },
        { label: "VOLUME", pattern: /^\s*VOLUME\s*:/gim },
        {
            label: "PONTOS DE INDICACAO",
            pattern: /^\s*PONTOS\s+DE\s+INDICA[C\u00c7][A\u00c3]O\s*:/gim,
        },
        {
            label: "PONTOS CALIBRADOS",
            pattern: /^\s*PONTOS\s+CALIBRADOS\s*:/gim,
        },
        { label: "SERIE", pattern: /^\s*S[E\u00c9]RIE\s*:/gim },
        { label: "MARCA", pattern: /^\s*MARCA\s*:/gim },
        { label: "MODELO", pattern: /^\s*MODELO\s*:/gim },
        {
            label: "N\u00ba DE ORDENACAO",
            pattern:
                /^\s*\*{0,2}\s*N[\u00ba\u00b0o]?\s*DE\s*ORDENA[C\u00c7][A\u00c3]O\s*:/gim,
        },
        {
            label: "N\u00ba DE IDENTIFICACAO",
            pattern:
                /^\s*\*{0,2}\s*N[\u00ba\u00b0o]?\s*DE\s*IDENTIFICA[C\u00c7][A\u00c3]O\s*:/gim,
        },
        {
            label: "PONTOS DE CALIBRACAO",
            pattern: /^\s*PONTOS\s+DE\s+CALIBRA[C\u00c7][A\u00c3]O\s*:/gim,
        },
    ];

    requiredFields.forEach(({ label, pattern }) => {
        const count = countMatches(text, pattern);
        if (count === 0) {
            errors.push(`Campo obrigatorio ausente: ${label}.`);
        }
    });

    const blockCount = countMatches(text, /^\s*INSTRUMENTO\s*:/gim);
    if (blockCount > 1) {
        errors.push(
            "Foram detectados multiplos instrumentos na mesma anotacao. Envie um equipamento por vez.",
        );
    }
};

const validateUnitsAndOrdering = (text, errors, validationContext = {}) => {
    const volumeLine = getLineValue(text, /^\s*VOLUME\s*:\s*([^\n\r]*)/im);
    const indicacaoLine = getLineValue(
        text,
        /^\s*PONTOS\s+DE\s+INDICA[C\u00c7][A\u00c3]O\s*:\s*([^\n\r]*)/im,
    );
    const calibradosLine = getLineValue(
        text,
        /^\s*PONTOS\s+CALIBRADOS\s*:\s*([^\n\r]*)/im,
    );

    if (volumeLine && ML_PATTERN.test(volumeLine)) {
        errors.push("VOLUME nao deve usar ml. Informe somente valor numerico em \u00b5L.");
    }

    if (indicacaoLine && ML_PATTERN.test(indicacaoLine)) {
        errors.push(
            "PONTOS DE INDICACAO nao deve usar ml. Informe somente valores numericos em \u00b5L.",
        );
    }

    if (calibradosLine && ML_PATTERN.test(calibradosLine)) {
        errors.push(
            "PONTOS CALIBRADOS nao deve usar ml. Informe somente valores numericos em \u00b5L.",
        );
    }

    if (volumeLine && !hasNumericValue(volumeLine)) {
        errors.push("VOLUME deve conter valor numerico.");
    }

    if (indicacaoLine && !hasNumericValue(indicacaoLine)) {
        errors.push("PONTOS DE INDICACAO deve conter valores numericos.");
    }

    if (calibradosLine && !hasNumericValue(calibradosLine)) {
        errors.push("PONTOS CALIBRADOS deve conter valores numericos.");
    }

    const orderMatches = [
        ...text.matchAll(
            /^\s*\*{0,2}\s*N[\u00ba\u00b0o]?\s*DE\s*ORDENA[C\u00c7][A\u00c3]O\s*:\s*([^\n\r]*)/gim,
        ),
    ];
    const serieMatches = [
        ...text.matchAll(
            /^\s*\*{0,2}\s*S[E\u00c9]RIE\s*:\s*([^\n\r]*)/gim,
        ),
    ];
    const identificationMatches = [
        ...text.matchAll(
            /^\s*\*{0,2}\s*N[\u00ba\u00b0o]?\s*DE\s*IDENTIFICA[C\u00c7][A\u00c3]O\s*:\s*([^\n\r]*)/gim,
        ),
    ];

    const orderValues = orderMatches
        .map((match) => (match[1] || "").replace(/\*\*/g, "").trim())
        .filter(Boolean);

    const existingOrderNumbers = Array.isArray(
        validationContext?.existingOrderNumbers,
    )
        ? validationContext.existingOrderNumbers
            .map((value) => normalizeOrderNumber(value))
            .filter(Boolean)
        : [];
    const existingSeries = Array.isArray(validationContext?.existingSeries)
        ? validationContext.existingSeries
            .map((value) => normalizeUniqueTextValue(value))
            .filter(Boolean)
        : [];
    const existingIdentifications = Array.isArray(
        validationContext?.existingIdentifications,
    )
        ? validationContext.existingIdentifications
            .map((value) => normalizeUniqueTextValue(value))
            .filter(Boolean)
        : [];
    const existingOrderNumberSet = new Set(existingOrderNumbers);
    const existingSeriesSet = new Set(existingSeries);
    const existingIdentificationSet = new Set(existingIdentifications);

    const seriesValues = serieMatches
        .map((match) => normalizeUniqueTextValue(match[1]))
        .filter(Boolean);
    const identificationValues = identificationMatches
        .map((match) => normalizeUniqueTextValue(match[1]))
        .filter(Boolean);

    orderValues.forEach((value) => {
        if (!/^\d+$/.test(value)) {
            errors.push(
                `N\u00ba DE ORDENACAO invalido: '${value}'. Use apenas numeros inteiros.`,
            );
        }

        const normalizedValue = normalizeOrderNumber(value);
        if (normalizedValue && existingOrderNumberSet.has(normalizedValue)) {
            errors.push(
                `N\u00ba DE ORDENACAO ja utilizado em certificado anterior: ${normalizedValue}.`,
            );
        }
    });

    const normalizedOrderValues = orderValues
        .map((value) => normalizeOrderNumber(value))
        .filter(Boolean);

    const duplicatedOrderNumbers = normalizedOrderValues.filter(
        (value, index) => normalizedOrderValues.indexOf(value) !== index,
    );

    if (duplicatedOrderNumbers.length > 0) {
        errors.push(
            `N\u00ba DE ORDENACAO duplicado na anotacao: ${[
                ...new Set(duplicatedOrderNumbers),
            ].join(", ")}.`,
        );
    }

    seriesValues.forEach((value) => {
        if (existingSeriesSet.has(value)) {
            errors.push(`SERIE ja utilizada em certificado anterior: ${value}.`);
        }
    });

    const duplicatedSeries = seriesValues.filter(
        (value, index) => seriesValues.indexOf(value) !== index,
    );
    if (duplicatedSeries.length > 0) {
        errors.push(
            `SERIE duplicada na anotacao: ${[...new Set(duplicatedSeries)].join(
                ", ",
            )}.`,
        );
    }

    identificationValues.forEach((value) => {
        if (existingIdentificationSet.has(value)) {
            errors.push(
                `N\u00ba DE IDENTIFICACAO ja utilizado em certificado anterior: ${value}.`,
            );
        }
    });

    const duplicatedIdentifications = identificationValues.filter(
        (value, index) => identificationValues.indexOf(value) !== index,
    );
    if (duplicatedIdentifications.length > 0) {
        errors.push(
            `N\u00ba DE IDENTIFICACAO duplicado na anotacao: ${[
                ...new Set(duplicatedIdentifications),
            ].join(", ")}.`,
        );
    }
};

const validateCalibrationPoints = (text, extractedData, errors) => {
    const parsedPoints = parseCalibrationPointsFromText(text);

    if (parsedPoints.length === 0) {
        errors.push(
            "Nenhum ponto de calibracao valido foi encontrado na secao PONTOS DE CALIBRACAO.",
        );
        return;
    }

    const duplicatedVolumes = parsedPoints
        .map((point) => point.nominalVolume)
        .filter(
            (value, index, array) =>
                Number.isFinite(value) && array.findIndex((item) => item === value) !== index,
        );

    if (duplicatedVolumes.length > 0) {
        errors.push(
            `Volumes nominais duplicados nos pontos de calibracao: ${[
                ...new Set(duplicatedVolumes.map((value) => value.toString())),
            ].join(", ")}.`,
        );
    }

    const repeatedMeasurementSets = new Map();
    const anomalySamples = [];

    parsedPoints.forEach((point, index) => {
        const pointLabel = `Ponto ${index + 1} (${point.rawNominal})`;

        if (!Number.isFinite(point.nominalVolume) || point.nominalVolume <= 0) {
            errors.push(`${pointLabel}: volume nominal invalido.`);
            return;
        }

        if (point.measurements.length !== 10) {
            errors.push(`${pointLabel}: sao necessarias 10 medicoes validas.`);
        }

        if (point.rawValues.length !== point.measurements.length) {
            errors.push(`${pointLabel}: existem medicoes com formato invalido.`);
        }

        const signature = point.measurements.map((value) => value.toFixed(3)).join("|");
        if (signature) {
            if (repeatedMeasurementSets.has(signature)) {
                const previousPoint = repeatedMeasurementSets.get(signature);
                errors.push(
                    `Possivel copia e cola: ${pointLabel} possui o mesmo conjunto de medicoes de ${previousPoint}.`,
                );
            } else {
                repeatedMeasurementSets.set(signature, pointLabel);
            }
        }

        point.measurements.forEach((measurement) => {
            const ratio = measurement / point.nominalVolume;
            if (ratio < 0.7 || ratio > 1.3) {
                anomalySamples.push(`${point.rawNominal} => ${measurement}`);
            }
        });
    });

    if (anomalySamples.length > 0) {
        const sampleText = anomalySamples.slice(0, 5).join(", ");
        errors.push(
            `Foram encontradas medicoes com magnitude incompativel com o volume nominal. Exemplos: ${sampleText}.`,
        );
    }

    const calibradosLine = getLineValue(
        text,
        /^\s*PONTOS\s+CALIBRADOS\s*:\s*([^\n\r]*)/im,
    );
    const declaredRange = parseRange(calibradosLine || extractedData?.faixaCalibrada || "");

    if (declaredRange) {
        parsedPoints.forEach((point) => {
            if (
                Number.isFinite(point.nominalVolume) &&
                (point.nominalVolume < declaredRange.min || point.nominalVolume > declaredRange.max)
            ) {
                errors.push(
                    `Volume nominal ${point.rawNominal} fora da faixa declarada em PONTOS CALIBRADOS (${declaredRange.min}-${declaredRange.max}).`,
                );
            }
        });
    }

    if (Array.isArray(extractedData?.pontosCalibra) && extractedData.pontosCalibra.length > 0) {
        const extractedVolumes = extractedData.pontosCalibra
            .map((point) => toNumber(point?.volumeNominal))
            .filter((value) => Number.isFinite(value));
        const parsedVolumes = parsedPoints
            .map((point) => point.nominalVolume)
            .filter((value) => Number.isFinite(value));

        if (extractedVolumes.length > 0 && parsedVolumes.length > 0) {
            const missingInParsed = extractedVolumes.filter(
                (value) => !parsedVolumes.includes(value),
            );
            if (missingInParsed.length > 0) {
                errors.push(
                    `Divergencia entre dados extraidos e texto original nos volumes: ${[
                        ...new Set(missingInParsed.map((value) => value.toString())),
                    ].join(", ")}.`,
                );
            }
        }
    }
};

export const validateNotionAnnotationsPayload = (
    extractedData = {},
    originalText = "",
    validationContext = {},
) => {
    const errors = [];
    const text = String(originalText || "").replace(/\r\n/g, "\n").trim();

    const extractedUnits = [
        extractedData?.unidadeCapacidade,
        extractedData?.unidadeFaixaIndicacao,
        extractedData?.unidadeFaixaCalibrada,
    ].filter(Boolean);

    extractedUnits.forEach((unit) => {
        if (ML_PATTERN.test(String(unit).trim())) {
            errors.push(
                `Unidade invalida detectada: ${unit}. O sistema aceita somente \u00b5L (sem precisar digitar unidade).`,
            );
        }
    });

    validateExtractedPoints(extractedData, errors);

    if (!text) {
        return [...new Set(errors)];
    }

    validateFieldPresenceAndDuplicates(text, errors);
    validateUnitsAndOrdering(text, errors, validationContext);
    validateCalibrationPoints(text, extractedData, errors);

    return [...new Set(errors)];
};

export default validateNotionAnnotationsPayload;