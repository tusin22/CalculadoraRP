let BIN_ID = "69987a5943b1c97be98e9cc8";
let API_KEY = "$2a$10$4toTqmFhiXGWPVvVJecY0etjHwM6OAmuGbFBiqbZ.Do5IEIvBVqZ2";
let historico = [];

// Carrega os dados salvos assim que a página abre
document.addEventListener("DOMContentLoaded", () => {
    if (BIN_ID && API_KEY) {
        fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.record) {
                historico = Array.isArray(data.record) ? data.record : (data.record.historico || []);
            }
            render();
        })
        .catch(error => console.error("Erro ao carregar histórico:", error));
    } else {
        console.warn("BIN_ID ou API_KEY não configurados. Histórico não carregado.");
        render();
    }

    // Event Listeners
    document.getElementById("btnCalcular").addEventListener("click", calcular);
    document.getElementById("btnBaixar").addEventListener("click", baixarPlanilha);
    document.getElementById("btnLimpar").addEventListener("click", limparHistorico);

    // Event delegation for delete buttons
    document.getElementById("tabelaLog").addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-excluir")) {
            const index = e.target.getAttribute("data-index");
            deletarLinha(parseInt(index));
        }
    });

    // Enter key support for input
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

    // Iterate in reverse to show newest first (LIFO visual)
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

function saveToBin() {
    if (!BIN_ID || !API_KEY) {
        console.warn("BIN_ID ou API_KEY não configurados.");
        return;
    }

    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
        body: JSON.stringify(historico)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        return response.json();
    })
    .then(data => console.log("Histórico salvo com sucesso:", data))
    .catch(error => console.error("Erro ao salvar histórico:", error));
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

    // Mantendo a lógica de arredondamento original
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
    saveToBin();

    valorInput.value = "";
    valorInput.focus();
}

function deletarLinha(index) {
    historico.splice(index, 1);
    render();
    saveToBin();
}

function baixarPlanilha() {
    if (historico.length === 0) {
        alert("A tabela está vazia. Calcule algo primeiro antes de baixar.");
        return;
    }

    let csvContent = "Hora;Orig.;%;Final;11%;Lucro\n";

    // Iterating to match the visual order? Or array order?
    // Visual order is newest first. CSV usually follows visual or chronological.
    // I'll export chronological (array order) or reverse?
    // Original code exported the table rows, which were newest first.
    // So I should export reversed array to match original behavior.

    const historicoReverso = [...historico].reverse();

    historicoReverso.forEach(item => {
        const row = [
            item.hora,
            item.original, // Removing "R$ " as in original code? Original code stripped "R$ ". Here I have numbers.
            item.percentual + "%",
            item.final,
            item.valor11, // Original table didn't have this in CSV?
            // Original code:
            // for (let j = 0; j < colunas.length - 1; j++) ...
            // Columns: Hora, Orig, %, Final, 11%, Lucro, X
            // So it included 11% column.
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
        saveToBin();
    }
}
