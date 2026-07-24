/* ==========================================
   RIPARTIZIONE
   Calore v0.9.1
========================================== */


/* ==========================================
   INIT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    renderRipartizione();

});

/* ==========================================
   RENDER
========================================== */

function renderRipartizione() {

    aggiornaAnnoTermico();

    renderCaloriferiRipartizione();

    aggiornaTotaleRipartizione();

}

/* ==========================================
   ANNO TERMICO
========================================== */

function aggiornaAnnoTermico() {

    const db = getDB();

    const letture = [...db.letture];

    if (letture.length === 0) {
        document.getElementById("annoTermicoAttivo").textContent = "--";
        document.getElementById("ultimoAggiornamento").textContent = "--";
        return;
    }

    letture.sort((a,b)=>new Date(b.data)-new Date(a.data));

    const ultima = letture[0];

    document.getElementById("annoTermicoAttivo").textContent =
        getAnnoTermico(ultima.data);

    document.getElementById("ultimoAggiornamento").textContent =
        formatDate(ultima.data);

}

/* ==========================================
   DATI CALORIFERO
========================================== */

/* ==========================================
   ELENCO CALORIFERI
========================================== */

function renderCaloriferiRipartizione() {

    const db = getDB();
    const container = document.getElementById("ripartizioneContainer");

    container.innerHTML = "";

    db.caloriferi.forEach(calorifero => {

        const card = document.createElement("div");
        card.className = "card";

        const display = getUltimaLettura(calorifero.id);
        const fattore = getFattore(calorifero.id);
        const unita = getUnita(calorifero.id);

        card.innerHTML = `
        <div class="rip-card">

            <div class="rip-left">
                <h3>🏠 ${calorifero.stanza}</h3>
            </div>

            <div class="rip-right">

                <div class="row">
                    <span class="label">Display</span>
                    <span class="value">${formatDisplay(display)}</span>
                </div>

                <div class="row">
                    <span class="label">Fattore</span>
                    <span class="value">
                        ${formatFattore(fattore)}
                    </span>
                </div>

                <div class="row">
                    <span class="label">Unità</span>
                    <span class="value">
                        ${formatUnita(unita)}
                    </span>
                </div>

            </div>

        </div>
        `;
        
        container.appendChild(card);
    });

}

/* ==========================================
   TOTALE
========================================== */

function aggiornaTotaleRipartizione() {
    
    const db = getDB();

    let totale = 0;

    db.caloriferi.forEach(calorifero => {

        const unita = getUnita(calorifero.id);

        if (unita !== null && !isNaN(unita)) {
            totale += unita;
        }

    });

    document.getElementById("totaleUnita").textContent =
    formatUnita(totale)

}

