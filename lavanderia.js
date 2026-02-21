let historico = [];

// Carrega os dados salvos assim que a página abre
document.addEventListener("DOMContentLoaded", () => {
    
    // Load from LocalStorage
    const storedData = localStorage.getItem("lavanderia_historico");
    if (storedData) {
        try {
            historico = JSON.parse(storedData);
        } catch (e) {
            console.error("Erro ao ler localStorage", e);
            historico = [];
        }
    }
    render();

    // Event Listeners
    document.getElementById("btnCalcular").addEventListener("click", calcular);
    document.getElementById("btnBaixar").addEventListener("click", baixarPlanilha);
    document.getElementById("btnLimpar").addEventListener("click", limparHistorico);

    document.getElementById("tabelaLog").addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-excluir")) {
            const index = e.target.getAttribute("data-index");
            deletarLinha(parseInt(index));
        }
    });

    document.getElementById("valorInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            calcular();
        }
    });
});

function render() {
    const tabelaLog = document.getElementById("tabelaLog");
    tabelaLog.innerHTML = "";

    let somaOriginal = 0;
    let somaFinal = 0;
    let somaLucro = 0;

    const fragment = document.createDocumentFragment();

    for (let i = historico.length - 1; i >= 0; i--) {
        const item = historico[i];
        somaOriginal += item.original;
        somaFinal += item.final;
        somaLucro += item.lucro;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.hora}</td>
            <td>${formatCurrency(item.original)}</td>
            <td>${item.percentual}%</td>
            <td>${formatCurrency(item.final)}</td>
            <td>${formatCurrency(item.valor11)}</td>
            <td>${formatCurrency(item.lucro)}</td>
            <td><button class="btn-excluir" data-index="${i}" aria-label="Excluir linha">❌</button></td>
        `;

        fragment.appendChild(row);
    }

    tabelaLog.appendChild(fragment);

    document.getElementById("totQtd").innerText = historico.length;
    document.getElementById("totOriginal").innerText = somaOriginal.toLocaleString('pt-BR');
    document.getElementById("totFinal").innerText = somaFinal.toLocaleString('pt-BR');
    document.getElementById("totLucro").innerText = somaLucro.toLocaleString('pt-BR');
}

function saveToLocalStorage() {
    localStorage.setItem("lavanderia_historico", JSON.stringify(historico));
}

function formatCurrency(value) {
    return Math.ceil(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function calcular() {
    const valorInput = document.getElementById("valorInput");
    const porcentagemInput = document.getElementById("porcentagemInput");

    const valorStr = valorInput.value;
    const porcentagemStr = porcentagemInput.value;

    if (valorStr === "" || valorStr <= 0) {
        alert("Insira um valor válido maior que zero.");
        return;
    }

    const valor = Math.ceil(parseFloat(valorStr));
    const percentual = parseFloat(porcentagemStr);

    const valorDescontado = Math.ceil(valor - (valor * (percentual / 100)));
    const valor11 = Math.ceil(valor - (valor * 0.11));
    const lucro = valor11 - valorDescontado;

    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const novoCalculo = {
        hora: horaFormatada,
        original: valor,
        percentual: percentual,
        final: valorDescontado,
        valor11: valor11,
        lucro: lucro
    };

    historico.push(novoCalculo);
    render();
    saveToLocalStorage();

    valorInput.value = "";
    valorInput.focus();
}

function deletarLinha(index) {
    historico.splice(index, 1);
    render();
    saveToLocalStorage();
}

function baixarPlanilha() {
    if (historico.length === 0) {
        alert("A tabela está vazia. Calcule algo primeiro antes de baixar.");
        return;
    }

    let csvContent = "Hora;Orig.;%;Final;11%;Lucro\n";
    const historicoReverso = [...historico].reverse();

    historicoReverso.forEach(item => {
        const row = [
            item.hora,
            item.original,
            item.percentual + "%",
            item.final,
            item.valor11,
            item.lucro
        ];
        csvContent += row.join(";") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "historico_calculos.csv";
    link.click();
}

function limparHistorico() {
    if(confirm("Tem certeza que deseja apagar todo o histórico?")) {
        historico = [];
        render();
        saveToLocalStorage();
    }
}
