/*==================================================
    DASHBOARD
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    renderDashboard();

    document
        .getElementById("letturaCalorifero")
        ?.addEventListener("change", aggiornaUltimaLettura);

});

function renderDashboard() {

    renderAnnoTermicoAttivo();
    renderTotali();
    renderConsumiPerStanzaCard();
    renderChart();

}

/*==================================================
    ANNO TERMICO
==================================================*/

function renderAnnoTermicoAttivo() {

    const el = document.getElementById("annoTermicoAttivo");

    if (!el) return;

    el.textContent = getAnnoTermicoAttivo();

}

/*==================================================
    TOTALI
==================================================*/

function renderTotali() {

    aggiornaElemento(
        "totaleConsumi",
        formatUnita(getTotaleConsumi())
    );

    aggiornaElemento(
        "numeroCaloriferi",
        getNumeroCaloriferi()
    );

    aggiornaElemento(
        "numeroLetture",
        getNumeroLetture()
    );

}

/*==================================================
    CONSUMI PER STANZA
==================================================*/

function renderConsumiPerStanzaCard() {

    const container = document.getElementById("consumiPerStanza");
    if (!container) return;

    const consumi = getConsumiPerStanza();

    container.innerHTML = `
        <div class="rooms-header">
            <h3>Unità per stanza</h3>
        </div>

        <div class="rooms-grid"></div>
    `;

    const grid = container.querySelector(".rooms-grid");

    Object.keys(consumi)
        .sort()
        .forEach(stanza => {

            const card = document.createElement("div");

            card.className = "room-item";

                card.innerHTML = `
                    <div class="room-name">${stanza}</div>

                    <div class="room-value">
                         ${formatUnita(consumi[stanza])}
                    </div>
                `;  
            grid.appendChild(card);

        });

}


/*==================================================
    GRAFICO CONSUMI MENSILI
==================================================*/

let chart = null;

function renderChart() {

    const canvas = document.getElementById("consumiChart");

    if (!canvas || typeof Chart === "undefined") return;

    const labels = [
        "Ott",
        "Nov",
        "Dic",
        "Gen",
        "Feb",
        "Mar",
        "Apr",
        "Mag"
    ];

    const consumiMese = getConsumiMensili();

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label: "Consumo Mensile",

                data: consumiMese,

                borderColor: "#e4572e",

                backgroundColor: "rgba(228,87,46,0.15)",

                fill: true,

                tension: 0.4,

                pointRadius: 4,

                pointBackgroundColor: "#e4572e"

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: false

                }

            },

            scales: {

                y: {

                    beginAtZero: true

                }

            }

        }

    });

}

/*==================================================
    REGISTRA LETTURA
==================================================*/

function aggiornaUltimaLettura() {

    console.log("aggiornaUltimaLettura");

    const id = document.getElementById("letturaCalorifero").value;
    console.log("ID:", id);

    const ultima = getUltimaLetturaCompleta(id);
    console.log("ULTIMA:", ultima);

    const dataEl = document.getElementById("ultimaLetturaData");
    const valoreEl = document.getElementById("ultimaLetturaValore");

    if (!dataEl || !valoreEl) return;

    if (!ultima) {
        dataEl.textContent = "--";
        valoreEl.textContent = "--";
        return;
    }

    dataEl.textContent = `📅 ${formatDate(ultima.data)}`;
    valoreEl.textContent = formatDisplay(ultima.valore);
}

function apriLetturaSheet() {
    const db = getDB();

    if (db.caloriferi.length === 0) {
        alert("Prima aggiungi almeno un calorifero");
        return;
    }

    const select = document.getElementById("letturaCalorifero");

    select.onchange = aggiornaUltimaLettura;

    select.innerHTML = "";

    db.caloriferi.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.nome} (${c.stanza})`;
    select.appendChild(opt);
    });

    // aggiorna la card con il primo calorifero selezionato
    aggiornaUltimaLettura();

    document.getElementById("sheetOverlayLettura").classList.remove("hidden");
    document.getElementById("letturaSheet").classList.remove("hidden");

    document.getElementById("letturaValore").value = "";
    document.getElementById("letturaData").value = "";
    document.getElementById("letturaData").value =
        new Date().toISOString().split("T")[0];

}

function chiudiLetturaSheet() {

    document.getElementById("sheetOverlayLettura")
        ?.classList.add("hidden");

    document.getElementById("letturaSheet")
        ?.classList.add("hidden");

}

function salvaLettura() {

    const id = document.getElementById("letturaCalorifero").value;

    const valore = Number(
        document.getElementById("letturaValore").value
    );

    const data = document.getElementById("letturaData").value;

    if (!id) {
        alert("Seleziona un calorifero");
        return;
    }

    if (Number.isNaN(valore)) {
        alert("Inserisci un valore valido");
        return;
    }

    if (valore < 0) {
        alert("Il valore non può essere negativo");
        return;
    }

    if (!data) {
        alert("Inserisci la data");
        return;
    }

    // Controllo lettura già presente nello stesso giorno
    const esiste = getDB().letture.some(l =>
    l.caloriferoId === id &&
    l.data.split("T")[0] === data
    );

    if (esiste) {
    alert(
        "Esiste già una lettura registrata per questo calorifero nella data selezionata.\n\n" +
        "Per modificare il valore utilizza la pagina Storico."
    );
    return;
    }

    const dataUltima = getDataUltimaLettura(id);

    if (dataUltima && data < dataUltima) {

    alert(
    `La data selezionata è precedente all'ultima lettura registrata (${formatDate(dataUltima)}).\n\n` +
    "Per modificare una lettura esistente utilizza la pagina Storico."
    );

    return;

    }
    const ultima = getUltimaLettura(id);

    // Valore identico
    if (ultima > 0 && valore === ultima) {

   mostraMessaggio(

        "⚠️ Nessuna variazione",

         `Ultima lettura

         📟 Display ${formatDisplay(ultima)}

        Il valore inserito coincide con l'ultima lettura registrata.

        Non è necessario registrare una nuova lettura.`

    );

    return;

    }
    // Valore inferiore
    if (ultima > 0 && valore < ultima) {

    const conferma = confirm(
        `Il valore inserito (${formatDisplay(valore)}) è inferiore all'ultima lettura registrata (${formatDisplay(ultima)}).\n\n` +
        "Se il ripartitore è stato sostituito o azzerato puoi continuare.\n\n" +
        "Vuoi registrare comunque la lettura?"
    );

    if (!conferma) return;
    }

    aggiungiLettura(id, valore, data);

    chiudiLetturaSheet();

    aggiornaDashboard();
}
