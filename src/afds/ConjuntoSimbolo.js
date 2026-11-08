if (typeof require !== 'undefined' && typeof Simbolo === 'undefined') {
    globalThis.Simbolo = require('./Simbolo.js');
}

class ConjuntoSimbolo {
    constructor() {
        this.elementos = [];
    }

    vazio() {
        return this.elementos.length === 0;
    }

    limpar() {
        this.elementos = [];
    }

    inclui(elem) {
        // Evita duplicatas
        if (elem && !this.pertence(elem)) {
            this.elementos.push(elem.clonar());
        }
    }

    pertence(elemento) {
        if (!elemento) {
            return false;
        }
        return this.elementos.some((simbolo) => simbolo.igual(elemento));
    }

    uniao(ce) {
        const novoConjunto = this.clonar();
        for (const simbolo of ce.getElementos()) {
            if (!novoConjunto.pertence(simbolo)) {
                novoConjunto.inclui(simbolo.clonar());
            }
        }
        return novoConjunto;
    }

    intersecao(ce) {
        const novoConjunto = new ConjuntoSimbolo();
        for (const simbolo of ce.getElementos()) {
            if (this.pertence(simbolo)) {
                novoConjunto.inclui(simbolo.clonar());
            }
        }
        return novoConjunto;
    }

    clonar() {
        const novoConjunto = new ConjuntoSimbolo();
        for (const simbolo of this.elementos) {
            novoConjunto.inclui(simbolo.clonar());
        }
        return novoConjunto;
    }

    igual(cs) {
        if (!cs) {
            return false;
        }
        for (const si of cs.getElementos()) {
            if (!this.pertence(si)) {
                return false;
            }
        }
        for (const si of this.elementos) {
            if (!cs.pertence(si)) {
                return false;
            }
        }
        return true;
    }

    toString() {
        const textos = this.elementos.map((si) => {
            const s = si.toString();
            if (s === '\n') {
                return '\\n';
            }
            if (s === '\t') {
                return '\\t';
            }
            return s;
        });
        return `{${textos.join(',')}}`;
    }

    getElementos() {
        return this.elementos;
    }

    iterator() {
        return this.elementos[Symbol.iterator]();
    }

    removerElemento(s) {
        this.elementos = this.elementos.filter((item) => !item.igual(s));
    }
}

if (typeof window !== 'undefined') {
    window.ConjuntoSimbolo = ConjuntoSimbolo;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConjuntoSimbolo;
}
