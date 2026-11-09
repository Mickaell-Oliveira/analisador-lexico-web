if (typeof require !== 'undefined' && typeof ConjuntoSimbolo === 'undefined') {
    globalThis.Simbolo = require('./Simbolo.js');
    globalThis.Estado = require('./Estado.js');
    globalThis.TransicaoD = require('./TransicaoD.js');
    globalThis.ConjuntoSimbolo = require('./ConjuntoSimbolo.js');
    globalThis.ConjuntoEstados = require('./ConjuntoEstados.js');
    globalThis.ConjuntoTransicaoD = require('./ConjuntoTransicaoD.js');
}

class AFD {
    constructor(simbolos, estados, funcaoPrograma, estadoInicial, estadosFinais) {
        if (simbolos && estados && funcaoPrograma && estadoInicial && estadosFinais) {
            this.simbolos = simbolos.clonar();
            this.estados = estados.clonar();
            this.funcaoPrograma = funcaoPrograma.clonar();
            this.estadoInicial = estadoInicial.clonar();
            this.estadosFinais = estadosFinais.clonar();
        } else {
            this.simbolos = new ConjuntoSimbolo();
            this.estados = new ConjuntoEstados();
            this.estadosFinais = new ConjuntoEstados();
            this.funcaoPrograma = new ConjuntoTransicaoD();
            this.estadoInicial = new Estado();
        }
        // Indice rapido
        this.mapaTransicoes = new Map();
        this._mapaTamanho = -1;
        this._sincronizarMapa();
    }

    _sincronizarMapa() {
        const lista = this.funcaoPrograma.getElementos();
        if (this._mapaTamanho === lista.length) {
            return;
        }
        this.mapaTransicoes.clear();
        for (const trans of lista) {
            const orig = trans.getOrigem().getNome();
            const simb = trans.getSimbolo().getSimbolo();
            const chave = `${orig}\0${simb}`;
            this.mapaTransicoes.set(chave, trans.getDestino());
        }
        this._mapaTamanho = lista.length;
    }

    _decodificarSimbolo(texto) {
        if (!texto) {
            return '';
        }
        // Normaliza escapes
        const limpo = texto
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
        if (limpo === '\\n') {
            return '\n';
        }
        if (limpo === '\\t') {
            return '\t';
        }
        if (limpo === '\\r') {
            return '\r';
        }
        return limpo.charAt(0);
    }

    _codificarSimbolo(caractere) {
        if (caractere === '\n') {
            return '\\n';
        }
        if (caractere === '\t') {
            return '\\t';
        }
        if (caractere === '\r') {
            return '\\r';
        }
        return this._escaparXml(caractere);
    }

    _escaparXml(texto) {
        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    getEstadoInicial() {
        return this.estadoInicial ? this.estadoInicial.clonar() : null;
    }

    setEstadoInicial(estadoInicial) {
        this.estadoInicial = estadoInicial ? estadoInicial.clonar() : new Estado();
    }

    getEstados() {
        return this.estados.clonar();
    }

    setEstados(estados) {
        this.estados = estados.clonar();
    }

    getEstadosFinais() {
        return this.estadosFinais.clonar();
    }

    setEstadosFinais(estadosFinais) {
        this.estadosFinais = estadosFinais.clonar();
    }

    getFuncaoPrograma() {
        return this.funcaoPrograma.clonar();
    }

    setFuncaoPrograma(funcaoPrograma) {
        this.funcaoPrograma = funcaoPrograma.clonar();
        this._mapaTamanho = -1;
        this._sincronizarMapa();
    }

    getSimbolos() {
        return this.simbolos.clonar();
    }

    setSimbolos(simbolos) {
        this.simbolos = simbolos.clonar();
    }

    clonar() {
        return new AFD(
            this.simbolos,
            this.estados,
            this.funcaoPrograma,
            this.estadoInicial,
            this.estadosFinais
        );
    }

    toString() {
        return `(${this.simbolos.toString()},${this.estados.toString()},${this.getFuncaoPrograma().toString()},${this.estadoInicial.toString()},${this.estadosFinais.toString()})`;
    }

    ler(xmlTexto) {
        if (!xmlTexto || typeof xmlTexto !== 'string') {
            throw new Error('XML vazio ou invalido.');
        }
        this.limpa();
        if (typeof DOMParser !== 'undefined') {
            this._lerComDom(xmlTexto);
        } else {
            this._lerComRegex(xmlTexto);
        }
        this._mapaTamanho = -1;
        this._sincronizarMapa();
    }

    _lerComDom(xmlTexto) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlTexto, 'text/xml');
        const erro = doc.getElementsByTagName('parsererror');
        if (erro && erro.length > 0) {
            throw new Error('Erro ao analisar XML do AFD.');
        }
        const raiz = doc.documentElement;
        const blocoSimb = raiz.getElementsByTagName('simbolos')[0];
        const blocoEst = raiz.getElementsByTagName('estados')[0];
        const blocoFin = raiz.getElementsByTagName('estadosFinais')[0];
        const blocoFunc = raiz.getElementsByTagName('funcaoPrograma')[0];
        const blocoIni = raiz.getElementsByTagName('estadoInicial')[0];

        if (!blocoSimb || !blocoEst || !blocoFin || !blocoFunc || !blocoIni) {
            throw new Error('Estrutura XML incompleta para AFD.');
        }

        this._processarElementosDom(0, blocoSimb);
        this._processarElementosDom(1, blocoEst);
        this._processarElementosDom(2, blocoFin);
        this.estadoInicial = new Estado(blocoIni.getAttribute('valor') || '');
        this._processarTransicoesDom(blocoFunc);
    }

    _processarElementosDom(tipo, elem) {
        const children = elem.getElementsByTagName('elemento');
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const valor = child.getAttribute('valor') || '';
            if (tipo === 0) {
                this.simbolos.inclui(new Simbolo(this._decodificarSimbolo(valor)));
            } else if (tipo === 1) {
                this.estados.inclui(new Estado(valor));
            } else if (tipo === 2) {
                this.estadosFinais.inclui(new Estado(valor));
            }
        }
    }

    _processarTransicoesDom(elem) {
        const children = elem.getElementsByTagName('elemento');
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const transD = new TransicaoD();
            transD.setOrigem(new Estado(child.getAttribute('origem') || ''));
            transD.setDestino(new Estado(child.getAttribute('destino') || ''));
            const simbTexto = child.getAttribute('simbolo') || '';
            transD.setSimbolo(new Simbolo(this._decodificarSimbolo(simbTexto)));
            this.funcaoPrograma.inclui(transD);
        }
    }

    _lerComRegex(xmlTexto) {
        const blocoSimb = this._extrairBloco(xmlTexto, 'simbolos');
        const blocoEst = this._extrairBloco(xmlTexto, 'estados');
        const blocoFin = this._extrairBloco(xmlTexto, 'estadosFinais');
        const blocoFunc = this._extrairBloco(xmlTexto, 'funcaoPrograma');
        const matchIni = /<estadoInicial\b([^>]*?)\/?>/i.exec(xmlTexto);

        if (blocoSimb === null || blocoEst === null || blocoFin === null || blocoFunc === null || !matchIni) {
            throw new Error('Estrutura XML incompleta para AFD.');
        }

        for (const attrs of this._extrairElementos(blocoSimb)) {
            this.simbolos.inclui(new Simbolo(this._decodificarSimbolo(attrs.valor || '')));
        }
        for (const attrs of this._extrairElementos(blocoEst)) {
            this.estados.inclui(new Estado(attrs.valor || ''));
        }
        for (const attrs of this._extrairElementos(blocoFin)) {
            this.estadosFinais.inclui(new Estado(attrs.valor || ''));
        }
        const attrsIni = this._lerAtributos(matchIni[1]);
        this.estadoInicial = new Estado(attrsIni.valor || '');

        for (const attrs of this._extrairElementos(blocoFunc)) {
            const transD = new TransicaoD();
            transD.setOrigem(new Estado(attrs.origem || ''));
            transD.setDestino(new Estado(attrs.destino || ''));
            transD.setSimbolo(new Simbolo(this._decodificarSimbolo(attrs.simbolo || '')));
            this.funcaoPrograma.inclui(transD);
        }
    }

    _extrairBloco(xml, tag) {
        const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = regex.exec(xml);
        return match ? match[1] : null;
    }

    _extrairElementos(bloco) {
        const lista = [];
        const regex = /<elemento\b([^>]*?)(?:\/>|><\/elemento>)/gi;
        let match;
        while ((match = regex.exec(bloco)) !== null) {
            lista.push(this._lerAtributos(match[1]));
        }
        return lista;
    }

    _lerAtributos(texto) {
        const attrs = {};
        const regex = /(\w+)\s*=\s*"([^"]*)"/g;
        let match;
        while ((match = regex.exec(texto)) !== null) {
            attrs[match[1]] = match[2];
        }
        return attrs;
    }

    limpa() {
        this.simbolos.limpar();
        this.estados.limpar();
        this.funcaoPrograma.limpar();
        this.estadosFinais.limpar();
        this.estadoInicial = new Estado();
        this.mapaTransicoes.clear();
        this._mapaTamanho = 0;
    }

    // Funcao programa
    p(e, s) {
        if (!e || !s) {
            return null;
        }
        this._sincronizarMapa();
        const chave = `${e.getNome()}\0${s.getSimbolo()}`;
        const destino = this.mapaTransicoes.get(chave);
        return destino ? destino.clonar() : null;
    }

    // Programa estendida
    pe(e, p) {
        let eAtual = e ? e.clonar() : null;
        if (!eAtual) {
            return null;
        }
        const palavra = p !== undefined && p !== null ? String(p) : '';
        for (let i = 0; i < palavra.length; i++) {
            const s = new Simbolo(palavra.charAt(i));
            eAtual = this.p(eAtual, s);
            if (eAtual === null) {
                return null;
            }
        }
        return eAtual;
    }

    Aceita(p) {
        const destino = this.pe(this.getEstadoInicial(), p);
        return this.getEstadosFinais().pertence(destino);
    }

    toXML() {
        const linhas = [];
        linhas.push('<AFD>');
        linhas.push('');

        linhas.push('\t<simbolos>');
        for (const s of this.getSimbolos().getElementos()) {
            linhas.push(`\t\t<elemento valor="${this._codificarSimbolo(s.getSimbolo())}"/>`);
        }
        linhas.push('\t</simbolos>');
        linhas.push('');

        linhas.push('\t<estados>');
        for (const e of this.getEstados().getElementos()) {
            linhas.push(`\t\t<elemento valor="${this._escaparXml(e.toString())}"/>`);
        }
        linhas.push('\t</estados>');
        linhas.push('');

        linhas.push('\t<estadosFinais>');
        for (const f of this.getEstadosFinais().getElementos()) {
            linhas.push(`\t\t<elemento valor="${this._escaparXml(f.toString())}"/>`);
        }
        linhas.push('\t</estadosFinais>');
        linhas.push('');

        linhas.push('\t<funcaoPrograma>');
        for (const t of this.getFuncaoPrograma().getElementos()) {
            linhas.push(
                `\t\t<elemento origem="${this._escaparXml(t.getOrigem().toString())}" destino="${this._escaparXml(t.getDestino().toString())}" simbolo="${this._codificarSimbolo(t.getSimbolo().getSimbolo())}"/>`
            );
        }
        linhas.push('\t</funcaoPrograma>');
        linhas.push('');

        linhas.push(`\t<estadoInicial valor="${this._escaparXml(this.getEstadoInicial().toString())}"/>`);
        linhas.push('');
        linhas.push('</AFD>');
        return linhas.join('\n');
    }
}

if (typeof window !== 'undefined') {
    window.AFD = AFD;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AFD;
}
