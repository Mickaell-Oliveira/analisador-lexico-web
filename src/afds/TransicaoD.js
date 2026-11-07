if (typeof require !== 'undefined' && typeof Estado === 'undefined') {
    globalThis.Estado = require('./Estado.js');
    globalThis.Simbolo = require('./Simbolo.js');
}

class TransicaoD {
    constructor(origem = null, simbolo = null, destino = null) {
        this.origem = origem ? origem.clonar() : null;
        this.simbolo = simbolo ? simbolo.clonar() : null;
        this.destino = destino ? destino.clonar() : null;
    }

    getDestino() {
        return this.destino ? this.destino.clonar() : null;
    }

    setDestino(destino) {
        this.destino = destino ? destino.clonar() : null;
    }

    getOrigem() {
        return this.origem ? this.origem.clonar() : null;
    }

    setOrigem(origem) {
        this.origem = origem ? origem.clonar() : null;
    }

    getSimbolo() {
        return this.simbolo ? this.simbolo.clonar() : null;
    }

    setSimbolo(simbolo) {
        this.simbolo = simbolo ? simbolo.clonar() : null;
    }

    clonar() {
        return new TransicaoD(this.origem, this.simbolo, this.destino);
    }

    igual(transicao) {
        if (!transicao || !this.destino || !this.origem || !this.simbolo) {
            return false;
        }
        return (
            this.destino.igual(transicao.getDestino()) &&
            this.origem.igual(transicao.getOrigem()) &&
            this.simbolo.igual(transicao.getSimbolo())
        );
    }

    toString() {
        const orig = this.origem ? this.origem.toString() : '';
        const simb = this.simbolo ? this.simbolo.toString() : '';
        const dest = this.destino ? this.destino.toString() : '';
        return `(${orig},${simb},${dest})`;
    }
}

if (typeof window !== 'undefined') {
    window.TransicaoD = TransicaoD;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransicaoD;
}
