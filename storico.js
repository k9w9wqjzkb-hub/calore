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

function popolaFiltroCaloriferi() {

    const select = document.getElementById("filtroCalorifero");

    if (!select) return;

    const db = getDB();

    select.innerHTML = `<option value="">Tutti i caloriferi</option>`;

    db.caloriferi.forEach(c => {

        const option = document.createElement("option");

        option.value = c.id;
        option.textContent = `${c.nome} (${c.stanza})`;

        select.appendChild(option);

    });

}

/*==================================================
    02 - INIZIALIZZAZIONE
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    refreshStorico();

    document
        .getElementById("filtroCalorifero")
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

    const filtroEl = document.getElementById("filtroCalorifero");
    const filtro = filtroEl ? (filtroEl.value || null) : null;

    const container = document.querySelector(".list-card");

    if (!container) return;

    container.innerHTML = "";

    const letture = getLettureFiltrate({
        caloriferoId: filtro
    }).sort((a, b) => new Date(b.data) - new Date(a.data));

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
                <button onclick="modificaLettura('${l.id}')">✏️</button>
                <button onclick="cancellaLettura('${l.id}')">🗑️</button>
            </div>
        `;

        container.appendChild(row);

    });

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

    popolaFiltroCaloriferi();

    renderStoricoAttivo();

}

/*==================================================
    08 - ESPOSIZIONE FUNZIONI
==================================================*/

window.modificaLettura = modificaLettura;
window.chiudiModificaLettura = chiudiModificaLettura;
window.salvaModificaLettura = salvaModificaLettura;
window.cancellaLettura = cancellaLettura;