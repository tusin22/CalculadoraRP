const BIN_ID = "6998a16dd0ea881f40ca5bf0";
const API_KEY = "$2a$10$9cyIi/5q86ZybmWCrVgC4OgaPyvT9Rq4r/OQrR74.rTE5LmaTNo0u";
const SENHA_ACESSO = "4499";

let historico = [];
let chartInstance = null;

document.addEventListener("DOMContentLoaded", () => {

    // TRAVA DE SEGURANÇA
    const tentativa = prompt("Digite a senha para acessar a Fazenda:");
    if (tentativa !== SENHA_ACESSO) {
        document.body.innerHTML = "<h2 style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Acesso Negado ❌</h2><div style='text-align:center; margin-top:20px;'><a href='index.html' style='color:#ccc; text-decoration:underline;'>Voltar ao Painel</a></div>";
        return;
    }

    // Set Date Filter to Today
    const dateInput = document.getElementById("filtroData");
    const today = new Date();
    dateInput.value = getLocalDateString(today);

    // Event Listeners
    dateInput.addEventListener("change", render);
    document.getElementById("btnRegistrar").addEventListener("click", registrar);
    document.getElementById("btnBaixar").addEventListener("click", baixarPlanilha);
    document.getElementById("btnLimpar").addEventListener("click", limparHistorico);

    document.getElementById("tabelaLog").addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-excluir")) {
            const index = e.target.getAttribute("data-index");
            deletarLinha(parseInt(index));
        }
    });

    // Enter key support
    document.getElementById("leiteInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            registrar();
        }
    });

    if (BIN_ID && API_KEY) {
        fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest?nocache=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
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
                let puxado = Array.isArray(data.record) ? data.record : [];
                historico = puxado.filter(item => !item.vazio);
            }
            render();
        })
        .catch(error => {
            console.error("Erro ao carregar histórico:", error);
            render();
        });
    } else {
        console.warn("BIN_ID ou API_KEY não configurados.");
        render();
    }
});

function getLocalDateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function render() {
    const dateInput = document.getElementById("filtroData");
    const selectedDateStr = dateInput.value;

    const tabelaLog = document.getElementById("tabelaLog");
    tabelaLog.innerHTML = "";

    const fragment = document.createDocumentFragment();

    // Renderiza Tabela (Do mais novo para o mais antigo, filtrado)
    for (let i = historico.length - 1; i >= 0; i--) {
        const item = historico[i];
        const itemDate = new Date(item.timestamp);
        const itemDateStr = getLocalDateString(itemDate);

        if (itemDateStr === selectedDateStr) {
            const row = document.createElement("tr");
            const dataFormatada = itemDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

            row.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${item.nome}</td>
                <td>${item.leite}</td>
                <td>${item.queijo}</td>
                <td><button class="btn-excluir" data-index="${i}" aria-label="Excluir linha">❌</button></td>
            `;

            fragment.appendChild(row);
        }
    }

    tabelaLog.appendChild(fragment);

    // Renderiza Resumo do Dia (Agrupado por Pessoa, filtrado)
    const resumoContent = document.getElementById("resumoDiaContent");
    resumoContent.innerHTML = "";

    const totais = {};

    historico.forEach(item => {
        const itemDate = new Date(item.timestamp);
        const itemDateStr = getLocalDateString(itemDate);

        if (itemDateStr === selectedDateStr) {
            if (!totais[item.nome]) {
                totais[item.nome] = { leite: 0, queijo: 0 };
            }
            totais[item.nome].leite += item.leite;
            totais[item.nome].queijo += item.queijo;
        }
    });

    if (Object.keys(totais).length === 0) {
        resumoContent.innerHTML = "<div class='resumo-item' style='justify-content:center; color:#666;'>Nenhum registro nesta data.</div>";
    } else {
        Object.keys(totais).sort().forEach(nome => {
            const dados = totais[nome];
            const div = document.createElement("div");
            div.className = "resumo-item";
            div.innerHTML = `<span style="color:#fff">${nome}</span> <span style="color:#ffc107; font-weight:bold;">🥛 ${dados.leite} &nbsp;|&nbsp; 🧀 ${dados.queijo}</span>`;
            resumoContent.appendChild(div);
        });
    }

    // Renderiza Gráfico
    renderChart(selectedDateStr);
}

function renderChart(selectedDateStr) {
    // Calculate yesterday
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const selDate = new Date(y, m - 1, d);
    const yesterday = new Date(selDate);
    yesterday.setDate(selDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    // Aggregate data for yesterday
    const totalsYesterday = {};
    historico.forEach(item => {
        const itemDate = new Date(item.timestamp);
        const itemDateStr = getLocalDateString(itemDate);

        if (itemDateStr === yesterdayStr) {
            if (!totalsYesterday[item.nome]) {
                totalsYesterday[item.nome] = 0;
            }
            totalsYesterday[item.nome] += item.queijo;
        }
    });

    const knownNames = ["Tusin", "Gabo", "RZ"];
    const finalLabels = [...knownNames];

    // Add dynamically found names if any
    Object.keys(totalsYesterday).forEach(name => {
        if (!finalLabels.includes(name)) finalLabels.push(name);
    });

    const finalData = finalLabels.map(name => totalsYesterday[name] || 0);

    const ctx = document.getElementById('graficoColeta').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    const yesterdayFormatted = yesterday.toLocaleDateString('pt-BR');

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: finalLabels,
            datasets: [{
                label: `Queijos a Colher (${yesterdayFormatted})`,
                data: finalData,
                backgroundColor: 'rgba(255, 193, 7, 0.6)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#fff'
                    },
                    grid: {
                        color: '#444'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: '#444'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            }
        }
    });
}

function saveToBin() {
    if (!BIN_ID || !API_KEY) {
        return;
    }

    const dadosParaSalvar = historico.length === 0 ? [{"vazio": true}] : historico;

    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY,
            'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify(dadosParaSalvar)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        return response.json();
    })
    .then(data => console.log("Histórico salvo com sucesso!"))
    .catch(error => console.error("Erro ao salvar histórico:", error));
}

function registrar() {
    const nomeInput = document.getElementById("nomeInput");
    const leiteInput = document.getElementById("leiteInput");

    const nome = nomeInput.value;
    const leiteVal = leiteInput.value;

    if (leiteVal === "" || leiteVal <= 0) {
        alert("Insira uma quantidade válida de caixas de leite.");
        return;
    }

    const leite = parseInt(leiteVal);
    // Matemática: 3 caixas de leite = 1 queijo (arredondado para baixo)
    const queijo = Math.floor(leite / 3);

    const agora = new Date();

    const novoRegistro = {
        timestamp: agora.toISOString(),
        nome: nome,
        leite: leite,
        queijo: queijo
    };

    historico.push(novoRegistro);
    render();
    saveToBin();

    leiteInput.value = "";
    leiteInput.focus();
}

function deletarLinha(index) {
    if(confirm("Tem certeza que deseja excluir este registro?")) {
        historico.splice(index, 1);
        render();
        saveToBin();
    }
}

function baixarPlanilha() {
    if (historico.length === 0) {
        alert("O histórico está vazio.");
        return;
    }

    let csvContent = "Data;Hora;Nome;Leite;Queijo\n";
    const historicoReverso = [...historico].reverse();

    historicoReverso.forEach(item => {
        const dataObj = new Date(item.timestamp);
        const data = dataObj.toLocaleDateString('pt-BR');
        const hora = dataObj.toLocaleTimeString('pt-BR');

        const row = [
            data,
            hora,
            item.nome,
            item.leite,
            item.queijo
        ];
        csvContent += row.join(";") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "historico_fazenda.csv";
    link.click();
}

function limparHistorico() {
    if(confirm("Tem certeza que deseja apagar TODO o histórico da Fazenda?")) {
        historico = [];
        render();
        saveToBin();
    }
}
