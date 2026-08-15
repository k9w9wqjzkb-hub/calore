/*==================================================

CALORE PRO

Storico Letture

Versione 1.0

Autore : Sergio Comi
Refactoring completato
Luglio 2026

==================================================*/

/*==================================================
    01 - STATO
==================================================*/

let letturaInModifica = null;

function popolaFiltroStanze() {

    const select = document.getElementById("filtroStanza");

    if (!select) return;

    const db = getDB();

    select.innerHTML = `
        <option value="">
            Tutte le stanze
        </option>
    `;

    const stanze = [...new Set(
        db.caloriferi.map(c => c.stanza)
    )].sort();

    stanze.forEach(stanza => {

        const option = document.createElement("option");

        option.value = stanza;
        option.textContent = stanza;

        select.appendChild(option);

    });

}

function popolaFiltroAnnoTermico() {

    const select = document.getElementById("filtroAnno");

    if (!select) return;

    select.innerHTML = "";

    const anni = new Set(
    getDB().letture.map(l => getAnnoTermico(l.data))
);

// aggiunge sempre l'anno attivo
anni.add(getAnnoTermicoAttivo());

const elenco = [...anni].sort().reverse();

    elenco.forEach(anno => {

        const option = document.createElement("option");

        option.value = anno;
        option.textContent = anno;

        select.appendChild(option);

    });

    select.value = getAnnoTermicoAttivo();

}

/*==================================================
    02 - INIZIALIZZAZIONE
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    refreshStorico();

    document
        .getElementById("filtroStanza")
        ?.addEventListener("change", renderStoricoAttivo);

    document
        .getElementById("filtroAnno")
        ?.addEventListener("change", renderStoricoAttivo);

});


window.addEventListener("pageshow", refreshStorico);

document.addEventListener("visibilitychange", () => {

    if (!document.hidden) {
        refreshStorico();
    }

});

/*==================================================
    03 - RENDER
==================================================*/

function renderStoricoAttivo() {

    const stanza =
    document.getElementById("filtroStanza")?.value || null;

    const anno =
    document.getElementById("filtroAnno")?.value || null;

    const container = document.querySelector(".list-card");

    if (!container) return;

    container.innerHTML = "";

        let letture = getLettureFiltrate({
        stanza
        });

        if (anno) {

        letture = letture.filter(
        l => getAnnoTermico(l.data) === anno
        );
}

letture.sort((a, b) => new Date(b.data) - new Date(a.data));


    letture.forEach(l => {

        const row = document.createElement("div");

        row.className = "list-row";

        row.innerHTML = `
            <div>${formatDate(l.data)}</div>
            <div>${l.stanza ?? "-"}</div>

            <div class="value-col">
                ${formatDisplay(l.valore)}
            </div>

            <div class="actions">

                <button
                    class="icon-btn"
                    onclick="modificaLettura('${l.id}')"
                    aria-label="Modifica lettura">

                    <i data-lucide="square-pen"></i>

                </button>

                <button
                    class="icon-btn"
                    onclick="cancellaLettura('${l.id}')"
                    aria-label="Elimina lettura">

                    <i data-lucide="trash-2"></i>

                </button>

            </div>
        `;

        container.appendChild(row);

    });

    lucide.createIcons();

}

/*==================================================
    04 - MODIFICA LETTURA
==================================================*/

function modificaLettura(id) {
    console.log("MODIFICA", id);

    const db = getDB();

    letturaInModifica = db.letture.find(
        l => l.id === id
    );

    if (!letturaInModifica) return;

    document.getElementById("editData").value =
        String(letturaInModifica.data).split("T")[0];

    document.getElementById("editValore").value =
        letturaInModifica.valore;

    const select = document.getElementById("editStanza");

    select.innerHTML = "";

    const calorifero = db.caloriferi.find(
        c => c.id === letturaInModifica.caloriferoId
    );

    const option = document.createElement("option");

    option.value = calorifero?.stanza || "";
    option.textContent = calorifero?.stanza || "-";

    select.appendChild(option);

    document
        .getElementById("modalModificaLettura")
        .classList.remove("hidden");

}

function chiudiModificaLettura() {

    letturaInModifica = null;

    document
        .getElementById("modalModificaLettura")
        .classList.add("hidden");

}

function salvaModificaLettura() {

    if (!letturaInModifica) return;

    const nuovaData = document.getElementById("editData").value;

    const nuovoValore = Number(
        document.getElementById("editValore").value
    );

    if (!nuovaData || Number.isNaN(nuovoValore) || nuovoValore < 0) {

        alert("Compila correttamente i campi");

        return;

    }

    const db = getDB();

    const lettura = db.letture.find(
        l => l.id === letturaInModifica.id
    );

    if (!lettura) return;

    lettura.data = new Date(
        nuovaData + "T00:00:00"
    ).toISOString();

    lettura.valore = nuovoValore;

    saveDB(db);

    chiudiModificaLettura();

    renderStoricoAttivo();

}

/*==================================================
    05 - ELIMINAZIONE
==================================================*/

function cancellaLettura(id) {
    console.log("CANCELLA", id);

    const db = getDB();

    const lettura = db.letture.find(
        l => l.id === id
    );

    if (!lettura) return;

    const contenuto = `
        <div class="confirm-info">
            <div class="confirm-name">
                ${lettura.calorifero}
            </div>

            <div class="confirm-room">
                📍 ${lettura.stanza}
            </div>

            <div class="confirm-room">
                📅 ${formatDate(lettura.data)}
            </div>

            <div class="confirm-room">
                🔢 ${formatDisplay(lettura.valore)}
            </div>
        </div>

        <div class="confirm-divider"></div>

        <div class="confirm-message">
            Questa lettura verrà eliminata definitivamente.
        </div>
    `;

    apriConferma(
        "🗑 Elimina lettura",
        contenuto,
        () => {

            db.letture = db.letture.filter(
                l => l.id !== id
            );

            saveDB(db);

            renderStoricoAttivo();


        }
    );

}

/*==================================================
    07 - REFRESH
==================================================*/

function refreshStorico() {

    popolaFiltroAnnoTermico();

    popolaFiltroStanze();

    renderStoricoAttivo();

}

/*==================================================
    08 - ESPOSIZIONE FUNZIONI
==================================================*/

window.modificaLettura = modificaLettura;
window.chiudiModificaLettura = chiudiModificaLettura;
window.salvaModificaLettura = salvaModificaLettura;
window.cancellaLettura = cancellaLettura;