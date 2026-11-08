if (typeof require !== 'undefined' && typeof TransicaoD === 'undefined') {
    globalThis.TransicaoD = require('./TransicaoD.js');
}

class ConjuntoTransicaoD {
    constructor() {
        this.elementos = [];
    }

    vazio() {
        return this.elementos.length === 0;
    }

    limpar() {
        this.elementos = [];
    }

    inclui(elemento) {
        // Evita duplicatas
        if (elemento && !this.pertence(elemento)) {
            this.elementos.push(elemento.clonar());
        }
    }

    pertence(elemento) {
        if (!elemento) {
            return false;
        }
        return this.elementos.some((transicaoD) => transicaoD.igual(elemento));
    }

    uniao(ce) {
        const novoConjunto = this.clonar();
        for (const transicaoD of ce.getElementos()) {
            if (!novoConjunto.pertence(transicaoD)) {
                novoConjunto.inclui(transicaoD.clonar());
            }
        }
        return novoConjunto;
    }

    intersecao(ce) {
        const novoConjunto = new ConjuntoTransicaoD();
        for (const transicaoD of ce.getElementos()) {
            if (this.pertence(transicaoD)) {
                novoConjunto.inclui(transicaoD.clonar());
            }
        }
        return novoConjunto;
    }

    clonar() {
        const novoConjunto = new ConjuntoTransicaoD();
        for (const transicaoD of this.elementos) {
            novoConjunto.inclui(transicaoD.clonar());
        }
        return novoConjunto;
    }

    igual(ct) {
        if (!ct) {
            return false;
        }
        for (const transicaoD of ct.getElementos()) {
            if (!this.pertence(transicaoD)) {
                return false;
            }
        }
        for (const transicaoD of this.elementos) {
            if (!ct.pertence(transicaoD)) {
                return false;
            }
        }
        return true;
    }

    toString() {
        return `{${this.elementos.map((t) => t.toString()).join(',')}}`;
    }

    getElementos() {
        return this.elementos;
    }

    iterator() {
        return this.elementos[Symbol.iterator]();
    }

    removerElemento(t) {
        this.elementos = this.elementos.filter((item) => !item.igual(t));
    }
}

if (typeof window !== 'undefined') {
    window.ConjuntoTransicaoD = ConjuntoTransicaoD;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConjuntoTransicaoD;
}
