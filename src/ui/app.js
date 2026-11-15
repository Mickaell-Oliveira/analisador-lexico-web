const estadoApp = {
    principal: new Principal(),
    xmlAtual: AFD_DSL_XML,
    nomeAfd: 'AFD Padrão'
};

const el = {
    nomeAfdAtivo: document.getElementById('nome-afd-ativo'),
    visualizacaoXml: document.getElementById('visualizacao-xml'),
    uploadXml: document.getElementById('upload-xml'),
    btnRestaurarAfd: document.getElementById('btn-restaurar-afd'),
    btnCopiarXml: document.getElementById('btn-copiar-xml'),
    entradaTexto: document.getElementById('entrada-texto'),
    btnExemploValido: document.getElementById('btn-exemplo-valido'),
    btnExemploErro: document.getElementById('btn-exemplo-erro'),
    uploadTxt: document.getElementById('upload-txt'),
    btnAnalisar: document.getElementById('btn-analisar'),
    btnLimpar: document.getElementById('btn-limpar'),
    statusResumo: document.getElementById('status-resumo'),
    corpoTabelaTokens: document.getElementById('corpo-tabela-tokens'),
    saidaConsole: document.getElementById('saida-console')
};

function formatarCaminho(passos, estadoInicial) {
    if (!passos || passos.length === 0) {
        return estadoInicial || '1';
    }
    const lista = [passos[0].origem];
    for (const passo of passos) {
        lista.push(passo.destino);
    }
    return lista.join(' → ');
}

function atualizarPainelAfd() {
    el.nomeAfdAtivo.textContent = estadoApp.nomeAfd;
    el.visualizacaoXml.textContent = estadoApp.xmlAtual;
}

function renderizarTokens(itens, estadoInicial) {
    el.corpoTabelaTokens.textContent = '';
    if (!itens || itens.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.className = 'vazio';
        td.textContent = 'Nenhuma palavra informada para análise.';
        tr.appendChild(td);
        el.corpoTabelaTokens.appendChild(tr);
        return;
    }

    for (const item of itens) {
        const tr = document.createElement('tr');
        if (!item.valido) {
            tr.className = 'linha-erro';
        }

        const tdOrdem = document.createElement('td');
        tdOrdem.textContent = String(item.ordem);

        const tdLexema = document.createElement('td');
        const codeLex = document.createElement('code');
        codeLex.className = 'token-code';
        codeLex.textContent = item.lexema;
        tdLexema.appendChild(codeLex);

        const tdCat = document.createElement('td');
        const strongCat = document.createElement('strong');
        strongCat.textContent = item.categoria.nome;
        const divDesc = document.createElement('div');
        divDesc.textContent = item.categoria.descricao;
        tdCat.appendChild(strongCat);
        tdCat.appendChild(divDesc);

        const tdCaminho = document.createElement('td');
        tdCaminho.className = 'caminho-texto';
        tdCaminho.textContent = formatarCaminho(item.passos, estadoInicial);

        const tdStatus = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge ${item.valido ? 'badge-sucesso' : 'badge-erro'}`;
        badge.textContent = item.valido ? 'Válido' : 'Erro Léxico';
        tdStatus.appendChild(badge);

        tr.appendChild(tdOrdem);
        tr.appendChild(tdLexema);
        tr.appendChild(tdCat);
        tr.appendChild(tdCaminho);
        tr.appendChild(tdStatus);
        el.corpoTabelaTokens.appendChild(tr);
    }
}

function executarAnalise() {
    // Executa analise
    const texto = el.entradaTexto.value;
    const analise = estadoApp.principal.analisarDetalhado(texto);
    const estIni = estadoApp.principal.a.getEstadoInicial().getNome();

    renderizarTokens(analise.itens, estIni);
    el.saidaConsole.textContent = analise.consoleSaida;

    if (analise.resumo.total === 0) {
        el.statusResumo.textContent = '';
        el.statusResumo.className = 'resumo-linha';
        return;
    }

    const temErro = analise.resumo.erros > 0 || analise.statusPrincipal === 'erro';
    el.statusResumo.textContent = `${analise.resumo.total} palavras · ${analise.resumo.validos} válidas · ${analise.resumo.erros} erros`;
    el.statusResumo.className = `resumo-linha ${temErro ? 'resumo-erro' : 'resumo-sucesso'}`;
}

function limparAnalise() {
    el.entradaTexto.value = '';
    el.statusResumo.textContent = '';
    el.statusResumo.className = 'resumo-linha';
    renderizarTokens([], '1');
    el.saidaConsole.textContent = '';
}

function tratarUploadTxt(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) {
        return;
    }
    const leitor = new FileReader();
    leitor.onload = (e) => {
        el.entradaTexto.value = String(e.target.result || '');
        executarAnalise();
    };
    leitor.readAsText(arquivo, 'UTF-8');
}

function tratarUploadXml(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) {
        return;
    }
    const leitor = new FileReader();
    leitor.onload = (e) => {
        const conteudo = String(e.target.result || '');
        try {
            estadoApp.principal.carregarXml(conteudo);
            estadoApp.xmlAtual = conteudo;
            estadoApp.nomeAfd = arquivo.name;
            atualizarPainelAfd();
            executarAnalise();
        } catch (err) {
            alert(`Erro ao carregar XML: ${err.message}`);
        }
    };
    leitor.readAsText(arquivo, 'UTF-8');
}

function restaurarAfdPadrao() {
    estadoApp.principal.carregarXml(AFD_DSL_XML);
    estadoApp.xmlAtual = AFD_DSL_XML;
    estadoApp.nomeAfd = 'AFD Padrão';
    el.uploadXml.value = '';
    atualizarPainelAfd();
    executarAnalise();
}

function copiarXml() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(estadoApp.xmlAtual).then(() => {
            el.btnCopiarXml.textContent = 'Copiado!';
            setTimeout(() => {
                el.btnCopiarXml.textContent = 'Copiar XML';
            }, 1500);
        });
    }
}

function registrarEventos() {
    el.btnAnalisar.addEventListener('click', executarAnalise);
    el.btnLimpar.addEventListener('click', limparAnalise);

    el.btnExemploValido.addEventListener('click', () => {
        el.entradaTexto.value = EXEMPLOS_DSL.valido;
        executarAnalise();
    });

    el.btnExemploErro.addEventListener('click', () => {
        el.entradaTexto.value = EXEMPLOS_DSL.erro;
        executarAnalise();
    });

    el.uploadTxt.addEventListener('change', tratarUploadTxt);
    el.uploadXml.addEventListener('change', tratarUploadXml);
    el.btnRestaurarAfd.addEventListener('click', restaurarAfdPadrao);
    el.btnCopiarXml.addEventListener('click', copiarXml);
}

function inicializarApp() {
    el.entradaTexto.value = EXEMPLOS_DSL.valido;
    atualizarPainelAfd();
    registrarEventos();
    executarAnalise();
}

document.addEventListener('DOMContentLoaded', inicializarApp);
