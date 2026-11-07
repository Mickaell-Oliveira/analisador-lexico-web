class Estado {
    constructor(nome = '') {
        this.nome = nome !== undefined && nome !== null ? String(nome) : '';
    }

    getNome() {
        return this.nome;
    }

    setNome(nome) {
        this.nome = nome !== undefined && nome !== null ? String(nome) : '';
    }

    clonar() {
        return new Estado(this.getNome());
    }

    igual(estado) {
        if (!estado) {
            return false;
        }
        return this.getNome() === estado.getNome();
    }

    toString() {
        return String(this.getNome());
    }
}

if (typeof window !== 'undefined') {
    window.Estado = Estado;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Estado;
}
