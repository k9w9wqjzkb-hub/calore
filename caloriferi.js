/*==================================================
    CALORIFERI
==================================================*/

let editingId = null;

document.addEventListener("DOMContentLoaded", () => {

    renderCaloriferi();

    const btnConferma = document.getElementById("btnConferma");

    if (btnConferma) {
        btnConferma.addEventListener("click", eseguiConferma);
    }

});

/*==================================================
    RENDER
==================================================*/

function renderCaloriferi() {

    console.log("CALORIFERI.JS");

    const container = document.getElementById("caloriferiContainer");

    if (!container) return;

    const db = getDB();

    container.innerHTML = "";

    const perStanza = {};

    db.caloriferi.forEach(calorifero => {

        if (!perStanza[calorifero.stanza]) {
            perStanza[calorifero.stanza] = [];
        }

        perStanza[calorifero.stanza].push(calorifero);

    });

    Object.entries(perStanza).forEach(([stanza, caloriferi]) => {

        const room = document.createElement("div");
        room.className = "room";

        let html = `
            <h3>
                🏠 ${stanza}
                <span>(${caloriferi.length})</span>
            </h3>
        `;

        caloriferi.forEach(calorifero => {

            html += `
                <div class="radiator-card">

                    <div class="rad-left">

                        <div class="rad-icon">♨️</div>

                        <div>
                            <div class="rad-title">${calorifero.nome}</div>
                            <div class="rad-sub">${calorifero.stanza}</div>
                        </div>

                    </div>

                    <div class="rad-actions">

                        <button onclick="modificaCalorifero('${calorifero.id}')">
                            ✏️
                        </button>

                        <button onclick="eliminaCalorifero('${calorifero.id}')">
                            🗑
                        </button>

                    </div>

                </div>
            `;

        });

        room.innerHTML = html;

        container.appendChild(room);

    });

}


/*==================================================
    SHEET
==================================================*/

function apriCaloriferoSheet() {

    document.getElementById("sheetOverlay")
        ?.classList.remove("hidden");
     document.getElementById("caloriferoSheet")
        ?.classList.remove("hidden");
}

function chiudiCaloriferoSheet() {

    document.getElementById("sheetOverlay")
        ?.classList.add("hidden");

    document.getElementById("caloriferoSheet")
        ?.classList.add("hidden");

    editingId = null;

    const nome = document.getElementById("nomeCalorifero");
    const stanza = document.getElementById("stanzaCalorifero");
    const fattore = document.getElementById("fattoreCalorifero");

    if (nome) nome.value = "";
    if (stanza) stanza.value = "";
    if (fattore) fattore.value = "";

}


/*==================================================
    SALVATAGGIO
==================================================*/

// salvaCalorifero()


/*==================================================
    MODIFICA
==================================================*/

// modificaCalorifero()


/*==================================================
    ELIMINAZIONE
==================================================*/

// eliminaCalorifero()







/*==================================================
    SALVA CALORIFERO
==================================================*/

function salvaCalorifero() {

    const nome = document
        .getElementById("nomeCalorifero")
        .value
        .trim();

    const stanza = document
        .getElementById("stanzaCalorifero")
        .value
        .trim();

    const fattore = parseFloat(
        document
            .getElementById("fattoreCalorifero")
            .value
            .replace(",", ".")
    ) || 0;

    if (!nome || !stanza) {
        alert("Compila tutti i campi");
        return;
    }

    if (fattore <= 0) {
        alert("Inserisci un fattore di conversione valido.");
        return;
    }

    const db = getDB();

    if (editingId) {

        const calorifero = db.caloriferi.find(
            c => c.id === editingId
        );

        if (calorifero) {

            calorifero.nome = nome;
            calorifero.stanza = stanza;
            calorifero.fattore = fattore;

        }

    } else {

        db.caloriferi.push({
            id: uid(),
            nome,
            stanza,
            fattore
        });

    }

    saveDB(db);

    chiudiCaloriferoSheet();

    renderCaloriferi();

    aggiornaDashboard();

}

/*==================================================
    MODIFICA CALORIFERO
==================================================*/

function modificaCalorifero(id) {

    const calorifero = getDB()
        .caloriferi
        .find(c => c.id === id);

    if (!calorifero) return;

    editingId = id;

    document.getElementById("nomeCalorifero").value =
        calorifero.nome;

    document.getElementById("stanzaCalorifero").value =
        calorifero.stanza;

    document.getElementById("fattoreCalorifero").value =
        calorifero.fattore ?? "";

    apriCaloriferoSheet();

}

/*==================================================
    ELIMINA CALORIFERO
==================================================*/

function eliminaCalorifero(id) {

    const db = getDB();

    const calorifero = db.caloriferi.find(
        c => c.id === id
    );

    if (!calorifero) return;

    const contenuto = `

        <div class="confirm-info">

            <div class="confirm-name">
                ${calorifero.nome}
            </div>

            <div class="confirm-room">
                📍 ${calorifero.stanza}
            </div>

        </div>

        <div class="confirm-divider"></div>

        <div class="confirm-message">

            Verranno eliminate anche tutte le letture associate.

            <br><br>

            Questa operazione non può essere annullata.

        </div>

    `;

    apriConferma(

        "🗑 Elimina calorifero",

        contenuto,

        () => {

            db.caloriferi =
                db.caloriferi.filter(c => c.id !== id);

            db.letture =
                db.letture.filter(l => l.caloriferoId !== id);

            saveDB(db);

            aggiornaDashboard();

            renderCaloriferi();

        }

    );

}

/*==================================================
    13 - INIZIALIZZAZIONE
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    renderCaloriferi();

    const btnConferma = document.getElementById("btnConferma");

    if (btnConferma) {
        btnConferma.addEventListener("click", eseguiConferma);
    }

});