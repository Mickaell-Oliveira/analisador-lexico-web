if (typeof require !== 'undefined') {
    if (typeof Simbolo === 'undefined') {
        globalThis.Simbolo = require('../afds/Simbolo.js');
    }
    if (typeof AFD === 'undefined') {
        globalThis.AFD = require('../afds/AFD.js');
    }
    if (typeof AFD_DSL_XML === 'undefined') {
        const dsl = require('./afdXml.js');
        globalThis.AFD_DSL_XML = dsl.AFD_DSL_XML;
        globalThis.CATEGORIAS_ESTADOS = dsl.CATEGORIAS_ESTADOS;
    }
}

class Principal {
    constructor(xmlTexto = null) {
        this.a = new AFD();
        this.corrente = null;
        this.token = '';
        this.ultimoEstadoFinal = null;
        this.ultimosPassos = [];
        const xmlInicial = xmlTexto || (typeof AFD_DSL_XML !== 'undefined' ? AFD_DSL_XML : null);
        if (xmlInicial) {
            this.carregarXml(xmlInicial);
        }
    }

    carregarXml(xmlTexto) {
        this.a.ler(xmlTexto);
        this.corrente = this.a.getEstadoInicial();
        this.token = '';
    }

    criarLeitor(texto) {
        return {
            texto: texto !== undefined && texto !== null ? String(texto) : '',
            indice: 0,
            linha: 1,
            coluna: 1
        };
    }

    proximo(reader) {
        if (!reader || reader.indice >= reader.texto.length) {
            return null;
        }
        const caractere = reader.texto.charAt(reader.indice);
        const codigo = reader.texto.charCodeAt(reader.indice);
        reader.indice += 1;

        // Normaliza quebra
        if (codigo === 10) {
            reader.linha += 1;
            reader.coluna = 1;
            return new Simbolo(' ');
        }
        if (codigo === 13 || codigo === 9) {
            reader.coluna += 1;
            return new Simbolo(' ');
        }

        reader.coluna += 1;
        return new Simbolo(caractere);
    }

    classificarEstado(estado) {
        if (!estado) {
            return {
                codigo: 'ERRO_LEXICO',
                nome: 'Erro Léxico',
                descricao: 'Sequência fora da gramática'
            };
        }
        const nomeEstado = estado.getNome();
        const mapa = typeof CATEGORIAS_ESTADOS !== 'undefined' ? CATEGORIAS_ESTADOS : {};
        if (mapa[nomeEstado]) {
            return mapa[nomeEstado];
        }
        return {
            codigo: 'TOKEN_ACEITO',
            nome: `Aceito (${nomeEstado})`,
            descricao: 'Estado final do autômato'
        };
    }

    lexico(reader) {
        let token = '';
        this.token = '';
        this.ultimoEstadoFinal = null;
        this.ultimosPassos = [];
        this.corrente = this.a.getEstadoInicial();

        if (!this.corrente || !this.corrente.getNome()) {
            return 'erro';
        }
        if (this.a.getEstadosFinais().pertence(this.corrente)) {
            this.ultimoEstadoFinal = this.corrente.clonar();
            return 'fim';
        }

        let p = this.proximo(reader);
        while (p !== null) {
            const charAtual = p.getSimbolo();
            // Ignora espacos
            if (token === '' && charAtual === ' ') {
                p = this.proximo(reader);
                continue;
            }

            const origem = this.corrente.clonar();
            token += charAtual;
            this.corrente = this.a.p(this.corrente, p);

            this.ultimosPassos.push({
                origem: origem.getNome(),
                simbolo: charAtual === ' ' ? '␣' : charAtual,
                destino: this.corrente ? this.corrente.getNome() : '∅ (inválido)'
            });

            // Erro lexico
            if (this.corrente === null) {
                this.token = token.trim();
                return 'erro';
            }
            // Estado final
            if (this.a.getEstadosFinais().pertence(this.corrente)) {
                this.ultimoEstadoFinal = this.corrente.clonar();
                this.token = token.trim();
                return this.token;
            }
            p = this.proximo(reader);
        }

        // Delimitador EOF
        if (token.length > 0) {
            const origem = this.corrente.clonar();
            const delim = new Simbolo(' ');
            this.corrente = this.a.p(this.corrente, delim);
            this.ultimosPassos.push({
                origem: origem.getNome(),
                simbolo: 'EOF',
                destino: this.corrente ? this.corrente.getNome() : '∅ (inválido)'
            });
            if (this.corrente !== null && this.a.getEstadosFinais().pertence(this.corrente)) {
                this.ultimoEstadoFinal = this.corrente.clonar();
                this.token = token.trim();
                return this.token;
            }
            this.token = token.trim();
            return 'erro';
        }

        return 'fim';
    }

    inicio(texto) {
        const reader = this.criarLeitor(texto);
        const linhasConsole = [];
        const tokens = [];

        linhasConsole.push(`AFD M' = ${this.a.toString()}`);

        let achou = this.lexico(reader);
        while (achou !== 'erro' && achou !== 'fim') {
            linhasConsole.push(`Achou: ${achou}`);
            tokens.push({
                lexema: achou,
                estadoFinal: this.ultimoEstadoFinal ? this.ultimoEstadoFinal.getNome() : '',
                categoria: this.classificarEstado(this.ultimoEstadoFinal),
                passos: [...this.ultimosPassos],
                valido: true
            });
            achou = this.lexico(reader);
        }

        linhasConsole.push(achou);

        return {
            status: achou,
            tokens,
            consoleSaida: linhasConsole.join('\n')
        };
    }

    analisarDetalhado(texto) {
        const resultadoPrincipal = this.inicio(texto);
        const reader = this.criarLeitor(texto);
        const itens = [];
        const todosPassos = [];
        let indiceToken = 1;

        while (reader.indice < reader.texto.length) {
            const c = reader.texto.charAt(reader.indice);
            if (c === ' ' || c === '\n' || c === '\r' || c === '\t') {
                this.proximo(reader);
                continue;
            }

            const linhaInicio = reader.linha;
            const colunaInicio = reader.coluna;
            const resultado = this.lexico(reader);
            const passosLocais = [...this.ultimosPassos];

            if (resultado === 'fim') {
                break;
            }

            // Recupera erro
            if (resultado === 'erro') {
                let lexemaErro = this.token;
                const ultimoPasso = passosLocais[passosLocais.length - 1];
                const falhouNoDelimitador =
                    ultimoPasso && (ultimoPasso.simbolo === '␣' || ultimoPasso.simbolo === 'EOF');
                if (!falhouNoDelimitador) {
                    while (reader.indice < reader.texto.length) {
                        const prox = reader.texto.charAt(reader.indice);
                        if (prox === ' ' || prox === '\n' || prox === '\r' || prox === '\t') {
                            break;
                        }
                        lexemaErro += prox;
                        this.proximo(reader);
                    }
                }
                const estadoFalha = ultimoPasso ? ultimoPasso.origem : this.a.getEstadoInicial().getNome();
                const simboloFalha = ultimoPasso ? ultimoPasso.simbolo : '?';
                const itemErro = {
                    ordem: indiceToken++,
                    lexema: lexemaErro,
                    linha: linhaInicio,
                    coluna: colunaInicio,
                    estadoFinal: '∅',
                    categoria: {
                        codigo: 'ERRO_LEXICO',
                        nome: 'Erro Léxico',
                        descricao: `Transição indefinida em (${estadoFalha}, '${simboloFalha}')`
                    },
                    passos: passosLocais,
                    valido: false
                };
                itens.push(itemErro);
                for (const passo of passosLocais) {
                    todosPassos.push({ ...passo, ordem: itemErro.ordem, lexema: lexemaErro, valido: false });
                }
            } else {
                const itemValido = {
                    ordem: indiceToken++,
                    lexema: resultado,
                    linha: linhaInicio,
                    coluna: colunaInicio,
                    estadoFinal: this.ultimoEstadoFinal ? this.ultimoEstadoFinal.getNome() : '',
                    categoria: this.classificarEstado(this.ultimoEstadoFinal),
                    passos: passosLocais,
                    valido: true
                };
                itens.push(itemValido);
                for (const passo of passosLocais) {
                    todosPassos.push({ ...passo, ordem: itemValido.ordem, lexema: resultado, valido: true });
                }
            }
        }

        const totalValidos = itens.filter((item) => item.valido).length;
        const totalErros = itens.length - totalValidos;

        return {
            statusPrincipal: resultadoPrincipal.status,
            consoleSaida: resultadoPrincipal.consoleSaida,
            itens,
            todosPassos,
            resumo: {
                total: itens.length,
                validos: totalValidos,
                erros: totalErros,
                estadosAfd: this.a.getEstados().size(),
                simbolosAfd: this.a.getSimbolos().getElementos().length,
                transicoesAfd: this.a.getFuncaoPrograma().getElementos().length
            }
        };
    }
}

if (typeof window !== 'undefined') {
    window.Principal = Principal;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Principal;
}
