const LETRAS_MAIUSCULAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITOS = '0123456789'.split('');

const ESTADOS_DSL = [
    '1',
    'q_R', 'q_L1', 'q_L2', 'q_L3',
    'q_PA0', 'q_PA1', 'q_PA2', 'q_PA3', 'q_PA_FIM',
    'q_PM1', 'q_PM2', 'q_PM3', 'q_PM_FIM',
    'q_REG0', 'q_REG1', 'q_REG2', 'q_REG3', 'q_REG4', 'q_REG5', 'q_REG6', 'q_REG7', 'q_REG8', 'q_REG_FIM',
    'q_RS', 'q_VAL_Z', 'q_VI1', 'q_VI2', 'q_VI3', 'q_VM0', 'q_VM1', 'q_VM2', 'q_VAL_P', 'q_VAL_D1', 'q_VAL_FIM',
    'q_D01', 'q_D2', 'q_HH', 'q_H_DP', 'q_H_M1', 'q_HORA_FIM',
    'q_VEL_D', 'q_VK', 'q_VKM', 'q_VBAR', 'q_VEL_FIM',
    'F_PLACA_ANT', 'F_PLACA_MER', 'F_REGISTRO', 'F_VELOCIDADE', 'F_VALOR', 'F_HORARIO'
];

const ESTADOS_FINAIS_DSL = [
    'F_PLACA_ANT',
    'F_PLACA_MER',
    'F_REGISTRO',
    'F_VELOCIDADE',
    'F_VALOR',
    'F_HORARIO'
];

const CATEGORIAS_ESTADOS = {
    F_PLACA_ANT: {
        codigo: 'PLACA_ANTIGA',
        nome: 'Placa Padrão Antigo',
        descricao: 'Identificação veicular AAA-0000'
    },
    F_PLACA_MER: {
        codigo: 'PLACA_MERCOSUL',
        nome: 'Placa Padrão Mercosul',
        descricao: 'Identificação veicular AAA0A00'
    },
    F_REGISTRO: {
        codigo: 'CODIGO_REGISTRO',
        nome: 'Código RENAVAM',
        descricao: 'Prefixo # seguido de 9 dígitos'
    },
    F_VELOCIDADE: {
        codigo: 'VELOCIDADE',
        nome: 'Leitura de Velocidade',
        descricao: 'Leitura numérica com unidade km/h'
    },
    F_VALOR: {
        codigo: 'VALOR_MONETARIO',
        nome: 'Valor Monetário',
        descricao: 'Prefixo R$ com milhar (.) e decimal (,)'
    },
    F_HORARIO: {
        codigo: 'HORARIO',
        nome: 'Horário Válido',
        descricao: 'Formato HH:MM de 00:00 a 23:59'
    },
    F: {
        codigo: 'TOKEN_ACEITO',
        nome: 'Token Reconhecido',
        descricao: 'Token aceito por AFD externo'
    }
};

const EXEMPLOS_DSL = {
    valido: 'ABC-1234 BRA2E19 #123456789 14:30 80km/h R$1.000.000,98',
    erro: 'ABC-1234 24:00 #12345 80km/h R$195.23'
};

function adicionarTransicao(lista, origem, simbolo, destino) {
    lista.push({ origem, simbolo, destino });
}

function adicionarListaTransicoes(lista, origem, simbolos, destino) {
    for (const simbolo of simbolos) {
        adicionarTransicao(lista, origem, simbolo, destino);
    }
}

function adicionarDelimitadores(lista, origem, destino) {
    adicionarTransicao(lista, origem, ' ', destino);
    adicionarTransicao(lista, origem, '\\n', destino);
}

function construirTransicoesDsl() {
    const t = [];

    // Estado inicial
    adicionarDelimitadores(t, '1', '1');
    adicionarTransicao(t, '1', 'R', 'q_R');
    adicionarListaTransicoes(t, '1', LETRAS_MAIUSCULAS.filter((l) => l !== 'R'), 'q_L1');
    adicionarTransicao(t, '1', '#', 'q_REG0');
    adicionarListaTransicoes(t, '1', ['0', '1'], 'q_D01');
    adicionarTransicao(t, '1', '2', 'q_D2');
    adicionarListaTransicoes(t, '1', ['3', '4', '5', '6', '7', '8', '9'], 'q_VEL_D');

    // Prefixo letras
    adicionarTransicao(t, 'q_R', '$', 'q_RS');
    adicionarListaTransicoes(t, 'q_R', LETRAS_MAIUSCULAS, 'q_L2');
    adicionarListaTransicoes(t, 'q_L1', LETRAS_MAIUSCULAS, 'q_L2');
    adicionarListaTransicoes(t, 'q_L2', LETRAS_MAIUSCULAS, 'q_L3');

    // Bifurcacao placas
    adicionarTransicao(t, 'q_L3', '-', 'q_PA0');
    adicionarListaTransicoes(t, 'q_L3', DIGITOS, 'q_PM1');

    // Placa antiga
    adicionarListaTransicoes(t, 'q_PA0', DIGITOS, 'q_PA1');
    adicionarListaTransicoes(t, 'q_PA1', DIGITOS, 'q_PA2');
    adicionarListaTransicoes(t, 'q_PA2', DIGITOS, 'q_PA3');
    adicionarListaTransicoes(t, 'q_PA3', DIGITOS, 'q_PA_FIM');
    adicionarDelimitadores(t, 'q_PA_FIM', 'F_PLACA_ANT');

    // Placa Mercosul
    adicionarListaTransicoes(t, 'q_PM1', LETRAS_MAIUSCULAS, 'q_PM2');
    adicionarListaTransicoes(t, 'q_PM2', DIGITOS, 'q_PM3');
    adicionarListaTransicoes(t, 'q_PM3', DIGITOS, 'q_PM_FIM');
    adicionarDelimitadores(t, 'q_PM_FIM', 'F_PLACA_MER');

    // Codigo RENAVAM
    for (let i = 0; i < 8; i++) {
        adicionarListaTransicoes(t, `q_REG${i}`, DIGITOS, `q_REG${i + 1}`);
    }
    adicionarListaTransicoes(t, 'q_REG8', DIGITOS, 'q_REG_FIM');
    adicionarDelimitadores(t, 'q_REG_FIM', 'F_REGISTRO');

    // Valor monetario
    adicionarTransicao(t, 'q_RS', '0', 'q_VAL_Z');
    adicionarListaTransicoes(t, 'q_RS', ['1', '2', '3', '4', '5', '6', '7', '8', '9'], 'q_VI1');
    adicionarTransicao(t, 'q_VAL_Z', ',', 'q_VAL_P');

    adicionarListaTransicoes(t, 'q_VI1', DIGITOS, 'q_VI2');
    adicionarTransicao(t, 'q_VI1', '.', 'q_VM0');
    adicionarTransicao(t, 'q_VI1', ',', 'q_VAL_P');

    adicionarListaTransicoes(t, 'q_VI2', DIGITOS, 'q_VI3');
    adicionarTransicao(t, 'q_VI2', '.', 'q_VM0');
    adicionarTransicao(t, 'q_VI2', ',', 'q_VAL_P');

    adicionarTransicao(t, 'q_VI3', '.', 'q_VM0');
    adicionarTransicao(t, 'q_VI3', ',', 'q_VAL_P');

    adicionarListaTransicoes(t, 'q_VM0', DIGITOS, 'q_VM1');
    adicionarListaTransicoes(t, 'q_VM1', DIGITOS, 'q_VM2');
    adicionarListaTransicoes(t, 'q_VM2', DIGITOS, 'q_VI3');

    adicionarListaTransicoes(t, 'q_VAL_P', DIGITOS, 'q_VAL_D1');
    adicionarListaTransicoes(t, 'q_VAL_D1', DIGITOS, 'q_VAL_FIM');
    adicionarDelimitadores(t, 'q_VAL_FIM', 'F_VALOR');

    // Horario velocidade
    adicionarListaTransicoes(t, 'q_D01', DIGITOS, 'q_HH');
    adicionarTransicao(t, 'q_D01', 'k', 'q_VK');

    adicionarListaTransicoes(t, 'q_D2', ['0', '1', '2', '3'], 'q_HH');
    adicionarListaTransicoes(t, 'q_D2', ['4', '5', '6', '7', '8', '9'], 'q_VEL_D');
    adicionarTransicao(t, 'q_D2', 'k', 'q_VK');

    adicionarTransicao(t, 'q_HH', ':', 'q_H_DP');
    adicionarListaTransicoes(t, 'q_HH', DIGITOS, 'q_VEL_D');
    adicionarTransicao(t, 'q_HH', 'k', 'q_VK');

    adicionarListaTransicoes(t, 'q_H_DP', ['0', '1', '2', '3', '4', '5'], 'q_H_M1');
    adicionarListaTransicoes(t, 'q_H_M1', DIGITOS, 'q_HORA_FIM');
    adicionarDelimitadores(t, 'q_HORA_FIM', 'F_HORARIO');

    adicionarListaTransicoes(t, 'q_VEL_D', DIGITOS, 'q_VEL_D');
    adicionarTransicao(t, 'q_VEL_D', 'k', 'q_VK');
    adicionarTransicao(t, 'q_VK', 'm', 'q_VKM');
    adicionarTransicao(t, 'q_VKM', '/', 'q_VBAR');
    adicionarTransicao(t, 'q_VBAR', 'h', 'q_VEL_FIM');
    adicionarDelimitadores(t, 'q_VEL_FIM', 'F_VELOCIDADE');

    return t;
}

function gerarXmlDslTransito() {
    const simbolos = [
        ...LETRAS_MAIUSCULAS,
        'k', 'm', 'h',
        ...DIGITOS,
        '-', '#', '$', '.', ',', ':', '/',
        ' ', '\\n'
    ];
    const transicoes = construirTransicoesDsl();

    const linhas = [];
    linhas.push('<AFD>');
    linhas.push('');

    linhas.push('\t<simbolos>');
    for (const s of simbolos) {
        linhas.push(`\t\t<elemento valor="${s}"/>`);
    }
    linhas.push('\t</simbolos>');
    linhas.push('');

    linhas.push('\t<estados>');
    for (const e of ESTADOS_DSL) {
        linhas.push(`\t\t<elemento valor="${e}"/>`);
    }
    linhas.push('\t</estados>');
    linhas.push('');

    linhas.push('\t<estadosFinais>');
    for (const f of ESTADOS_FINAIS_DSL) {
        linhas.push(`\t\t<elemento valor="${f}"/>`);
    }
    linhas.push('\t</estadosFinais>');
    linhas.push('');

    linhas.push('\t<funcaoPrograma>');
    for (const tr of transicoes) {
        linhas.push(`\t\t<elemento origem="${tr.origem}" destino="${tr.destino}" simbolo="${tr.simbolo}"/>`);
    }
    linhas.push('\t</funcaoPrograma>');
    linhas.push('');

    linhas.push('\t<estadoInicial valor="1"/>');
    linhas.push('');
    linhas.push('</AFD>');

    return linhas.join('\n');
}

const AFD_DSL_XML = gerarXmlDslTransito();

if (typeof window !== 'undefined') {
    window.AFD_DSL_XML = AFD_DSL_XML;
    window.CATEGORIAS_ESTADOS = CATEGORIAS_ESTADOS;
    window.EXEMPLOS_DSL = EXEMPLOS_DSL;
    window.gerarXmlDslTransito = gerarXmlDslTransito;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AFD_DSL_XML,
        CATEGORIAS_ESTADOS,
        EXEMPLOS_DSL,
        gerarXmlDslTransito
    };
}
