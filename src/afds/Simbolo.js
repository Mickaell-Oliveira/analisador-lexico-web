class Simbolo {
    constructor(simbolo = '') {
        const valor = simbolo !== undefined && simbolo !== null ? String(simbolo) : '';
        this.simbolo = valor.length > 0 ? valor.charAt(0) : '';
    }

    getSimbolo() {
        return this.simbolo;
    }

    setSimbolo(simbolo) {
        const valor = simbolo !== undefined && simbolo !== null ? String(simbolo) : '';
        this.simbolo = valor.length > 0 ? valor.charAt(0) : '';
    }

    clonar() {
        return new Simbolo(this.simbolo);
    }

    igual(outro) {
        if (!outro) {
            return false;
        }
        return this.getSimbolo() === outro.getSimbolo();
    }

    toString() {
        return String(this.simbolo);
    }
}

// Simbolo vazio
Simbolo.VAZIA = new Simbolo('E');

if (typeof window !== 'undefined') {
    window.Simbolo = Simbolo;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Simbolo;
}
