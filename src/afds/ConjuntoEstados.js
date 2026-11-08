if (typeof require !== 'undefined' && typeof Estado === 'undefined') {
    globalThis.Estado = require('./Estado.js');
}

class ConjuntoEstados {
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
        return this.elementos.some((estado) => estado.igual(elemento));
    }

    retornaIgual(elemento) {
        if (!elemento) {
            return null;
        }
        return this.elementos.find((estado) => estado.igual(elemento)) || null;
    }

    uniao(ce) {
        const novoConjunto = this.clonar();
        for (const estado of ce.getElementos()) {
            if (!novoConjunto.pertence(estado)) {
                novoConjunto.inclui(estado.clonar());
            }
        }
        return novoConjunto;
    }

    intersecao(ce) {
        const novoConjunto = new ConjuntoEstados();
        for (const estado of ce.getElementos()) {
            if (this.pertence(estado)) {
                novoConjunto.inclui(estado.clonar());
            }
        }
        return novoConjunto;
    }

    clonar() {
        const novoConjunto = new ConjuntoEstados();
        for (const estado of this.elementos) {
            novoConjunto.inclui(estado.clonar());
        }
        return novoConjunto;
    }

    igual(ce) {
        if (!ce) {
            return false;
        }
        for (const e of ce.getElementos()) {
            if (!this.pertence(e)) {
                return false;
            }
        }
        for (const e of this.elementos) {
            if (!ce.pertence(e)) {
                return false;
            }
        }
        return true;
    }

    toString() {
        return `{${this.elementos.map((e) => e.toString()).join(',')}}`;
    }

    getElementos() {
        return this.elementos;
    }

    size() {
        return this.elementos.length;
    }

    iterator() {
        return this.elementos[Symbol.iterator]();
    }

    removerElemento(e) {
        this.elementos = this.elementos.filter((item) => !item.igual(e));
    }
}

if (typeof window !== 'undefined') {
    window.ConjuntoEstados = ConjuntoEstados;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConjuntoEstados;
}
