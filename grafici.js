// =========================================
// GRAFICI
// =========================================

const ctxAnno = document.getElementById("chartAnno").getContext("2d");
const ctxStanza = document.getElementById("chartStanza").getContext("2d");

let chartAnno;
let chartStanza;

// ================= CONSUMI REALI =================

function calcolaConsumiPerCalorifero(caloriferoId) {

    const db = getDB();

    const letture = db.letture
        .filter(l => l.caloriferoId === caloriferoId)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

    const consumi = [];

    letture.forEach((l, i) => {

        let consumo = i === 0
            ? Number(l.valore)
            : Number(l.valore) - Number(letture[i - 1].valore);

        if (consumo < 0) consumo = 0;

        consumi.push({
            data: l.data,
            consumo,
            stanza: l.stanza
        });

    });

    return consumi;

}

// ================= ULTIMI 5 ANNI =================

function ultimi5AnniTermici() {

    const db = getDB();

    const anni = [...new Set(db.letture.map(l => getAnnoTermico(l.data)))].sort();

    if (!anni.length) return [];

    const max = Number(anni[anni.length - 1].split("-")[0]);

    return Array.from(
        { length: 5 },
        (_, i) => `${max - 4 + i}-${max - 3 + i}`
    );

}

// ================= FILTRO =================

function popolaFiltroAnno() {

    const anni = ultimi5AnniTermici();

    const select = document.getElementById("filtroAnno");

    select.innerHTML = "";

    anni.forEach(a => {

        const opt = document.createElement("option");

        opt.value = a;
        opt.textContent = a;

        select.appendChild(opt);

    });

    if (anni.length)
        select.value = anni[anni.length - 1];

}

// ================= GRAFICI =================

function aggiornaGrafici() {

    const db = getDB();

    const annoSelezionato =
        document.getElementById("filtroAnno").value;

    if (!annoSelezionato) return;

    // GRAFICO ANNI

    const anni = ultimi5AnniTermici();

    const totaliPerAnno = anni.map(a => {

        let totale = 0;

        db.caloriferi.forEach(c => {

            calcolaConsumiPerCalorifero(c.id).forEach(r => {

                if (getAnnoTermico(r.data) === a)
                    totale += r.consumo;

            });

        });

        return totale;

    });

    if (chartAnno) chartAnno.destroy();

    chartAnno = new Chart(ctxAnno, {

        type: "bar",

        data: {

            labels: anni,

            datasets: [{

                data: totaliPerAnno,

                backgroundColor: "#ff7043"

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: { display: false }

            },

            scales: {

                y: {

                    beginAtZero: true

                }

            }

        }

    });

    // GRAFICO STANZE

    const consumiPerStanza = {};

    db.caloriferi.forEach(c => {

        calcolaConsumiPerCalorifero(c.id).forEach(r => {

            if (getAnnoTermico(r.data) !== annoSelezionato)
                return;

            consumiPerStanza[r.stanza] =
                (consumiPerStanza[r.stanza] || 0) + r.consumo;

        });

    });

    const labels = Object.keys(consumiPerStanza);

    const dati = Object.values(consumiPerStanza);

    if (chartStanza) chartStanza.destroy();

    chartStanza = new Chart(ctxStanza, {

        type: "bar",

        data: {

            labels,

            datasets: [{

                data: dati,

                backgroundColor: "#42a5f5"

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: { display: false }

            },

            scales: {

                y: {

                    beginAtZero: true

                }

            }

        }

    });

}

// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {

    popolaFiltroAnno();

    document
        .getElementById("filtroAnno")
        .addEventListener("change", aggiornaGrafici);

    aggiornaGrafici();

});