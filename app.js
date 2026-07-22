/*==================================================
    CALORE PRO
    Core applicazione

    Versione : 1.0
    Autore   : Sergio Comi
    Anno     : 2026
==================================================*/


/*==================================================
    01 - COSTANTI
==================================================*/

const DB_KEY = "calore-db";
const APP_VERSION = "1.0";

/*==================================================
    02 - DATABASE
==================================================*/

// Struttura iniziale del database
const defaultDB = {
      annoTermicoAttivo: null,
      caloriferi: [],
      letture: [],
};

/**
 * Restituisce il database corrente.
 */
function getDB() {

    try {

        const db = JSON.parse(localStorage.getItem(DB_KEY));

        return db ?? structuredClone(defaultDB);

    } catch {

        return structuredClone(defaultDB);

    }

}

/**
 * Salva il database nel Local Storage.
 */
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/*==================================================
    03 - UTILS
==================================================*/

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Aggiorna il testo di un elemento del DOM.
 * Se l'elemento non esiste, non esegue alcuna operazione.
 */
function aggiornaElemento(id, valore) {

    const elemento = document.getElementById(id);

    if (!elemento) return;

    elemento.textContent = valore;

}

function getRoomIcon(stanza){

    const nome = stanza.toLowerCase();

    if(nome.includes("soggiorno")) return "weekend";
    if(nome.includes("cucina")) return "kitchen";
    if(nome.includes("camera")) return "bed";
    if(nome.includes("bagno")) return "bathtub";
    if(nome.includes("anticamera")) return "door_front";
    if(nome.includes("ingresso")) return "door_front";
    if(nome.includes("corridoio")) return "door_front";
    if(nome.includes("studio")) return "desk";
    if(nome.includes("lavanderia")) return "local_laundry_service";
    if(nome.includes("ripostiglio")) return "inventory_2";

    return "home";
}

/*==================================================
    04 - FORMATTAZIONE
==================================================*/
const LOCALE = "it-IT";

function formatDate(date) {
    return new Date(date).toLocaleDateString(LOCALE);
}

function formatDisplay(valore) {

    if (valore == null) return "--";

    return Number(valore).toLocaleString(LOCALE);

}

function formatFattore(valore) {

    if (valore == null) return "--";

    return Number(valore).toLocaleString(LOCALE, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    });

}

function formatUnita(valore) {

    if (valore == null) return "--";

    return Math.round(valore).toLocaleString(LOCALE);

}

/*==================================================
    05 - ANNO TERMICO
==================================================*/

function getAnnoTermicoAttivo() {
  const db = getDB();

  // Restituisce l'anno termico salvato
  if (db.annoTermicoAttivo) {
    return db.annoTermicoAttivo;
  }

  // Se non esiste viene inizializzato
  const oggi = new Date();

  const annoCorrente = oggi.getFullYear();

  const nuovoAnno =
    oggi.getMonth() >= 9
      ? `${annoCorrente}-${annoCorrente + 1}`
      : `${annoCorrente - 1}-${annoCorrente}`;

  db.annoTermicoAttivo = nuovoAnno;
  saveDB(db);

  return nuovoAnno;
}

function setAnnoTermicoAttivo(anno) {
  const db = getDB();
  db.annoTermicoAttivo = anno;
  saveDB(db);
}

// Calcola anno termico: ottobre–maggio
function getAnnoTermico(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  return d.getMonth() >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

// Calcola mese termico: ottobre=0, novembre=1, ..., maggio=7
function getMeseAnnoTermico(date) {
  const d = new Date(date);
  const m = d.getMonth(); // 0–11
  return m >= 9 ? m - 9 : m + 3;
}

/*==================================================
    06 - SERVIZI
==================================================*/

// restituisce array di oggetti { data, consumo }
function calcolaConsumiPerCalorifero(caloriferoId) {

    const letture = getDB().letture
        .filter(l => l.caloriferoId === caloriferoId)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

    const risultati = [];

    for (let i = 0; i < letture.length; i++) {

        const corrente = letture[i];

        const consumo = i === 0
            ? Number(corrente.valore)
            : Number(corrente.valore) - Number(letture[i - 1].valore);

        risultati.push({
            data: corrente.data,
            consumo: Math.max(consumo, 0),
            stanza: corrente.stanza,
            caloriferoId
        });

    }

    return risultati;

}

function getTotaleConsumi(annoTermico = getAnnoTermicoAttivo()) {

    const db = getDB();

    let totale = 0;

    db.caloriferi.forEach(calorifero => {

        calcolaConsumiPerCalorifero(calorifero.id)
            .forEach(consumo => {

                if (getAnnoTermico(consumo.data) !== annoTermico) return;

                totale += consumo.consumo;

            });

    });

    return totale;

}

function getConsumiPerStanza(annoTermico = getAnnoTermicoAttivo()) {

    const db = getDB();
    const risultati = {};

    db.caloriferi.forEach(calorifero => {

        calcolaConsumiPerCalorifero(calorifero.id).forEach(consumo => {

            if (getAnnoTermico(consumo.data) !== annoTermico) return;

            risultati[consumo.stanza] =
                (risultati[consumo.stanza] || 0) + consumo.consumo;

        });

    });

    return risultati;

}

function getConsumiMensili(annoTermico = getAnnoTermicoAttivo()) {

    const db = getDB();
    const consumi = Array(8).fill(0);

    db.caloriferi.forEach(calorifero => {

        calcolaConsumiPerCalorifero(calorifero.id).forEach(consumo => {

            if (getAnnoTermico(consumo.data) !== annoTermico) return;

            consumi[getMeseAnnoTermico(consumo.data)] += consumo.consumo;

        });

    });

    return consumi;

}

function getUltimaLetturaCompleta(caloriferoId) {

    const letture = getDB().letture
        .filter(l => l.caloriferoId === caloriferoId)
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    return letture.length ? letture[0] : null;

}

function getDataUltimaLettura(caloriferoId) {

    const ultima = getUltimaLetturaCompleta(caloriferoId);

    return ultima
        ? ultima.data.split("T")[0]
        : null;

}

function getUltimaLettura(caloriferoId) {

    const ultima = getUltimaLetturaCompleta(caloriferoId);

    return ultima
        ? Number(ultima.valore)
        : 0;

}

function getUnita(caloriferoId) {

    const display = getUltimaLettura(caloriferoId);
    const fattore = getFattore(caloriferoId);

    if (display === null || fattore === null) {
        return null;
    }

    return display * fattore;

}

function getFattore(caloriferoId) {

    const calorifero = getDB().caloriferi.find(
    c => c.id === caloriferoId
    );

    return calorifero ? Number(calorifero.fattore) : null;

}

function getNumeroLetture() {
  return getDB().letture.length;
}

function getNumeroCaloriferi() {
  return getDB().caloriferi.length;
}

function getMediaConsumi(annoTermico = getAnnoTermicoAttivo()) {

    const consumi = [];

    const db = getDB();

    db.caloriferi.forEach(calorifero => {

        calcolaConsumiPerCalorifero(calorifero.id)
            .forEach(consumo => {

                if (getAnnoTermico(consumo.data) !== annoTermico) return;

                if (consumo.consumo > 0) {
                    consumi.push(consumo.consumo);
                }

            });

    });

    if (consumi.length === 0) return 0;

    return consumi.reduce((a, b) => a + b, 0) / consumi.length;

}

function getUltimaLetturaRegistrata() {

    const letture = getDB().letture;

    if (letture.length === 0) return null;

    return letture
        .slice()
        .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

}

/*==================================================
    07 - DASHBOARD
==================================================*/

function aggiornaDashboard() {

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
    08 - LETTURE
==================================================*/
function aggiungiLettura(caloriferoId, valore, data) {
  const db = getDB();
  const c = db.caloriferi.find(c => c.id === caloriferoId);
  if (!c) return;

  db.letture.push({
    id: uid(),
    caloriferoId,
    calorifero: c.nome,
    stanza: c.stanza,
    valore: Number(valore),
    data: new Date(data).toISOString()
  });

  saveDB(db);
}

function getLettureFiltrate({ caloriferoId , stanza } = {}) {
  return getDB().letture
    .filter(l => !caloriferoId || l.caloriferoId === caloriferoId)
    .filter(l => !stanza || l.stanza === stanza)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
}

/*==================================================
    09 - BACKUP / RIPRISTINO
==================================================*/
// Esporta database in file JSON
function backupDB() {
  const db = getDB();
  const dataStr = JSON.stringify(db, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calore-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// Importa database da file JSON
function ripristinaDB(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);

      // Validazione minima
        if (
            !Array.isArray(data.caloriferi) ||
            !Array.isArray(data.letture) ||
            !("annoTermicoAttivo" in data)
        ) {
            alert("File non valido");
        return;
        }

      saveDB(data);
      alert("Ripristino completato ✔️");
      location.reload();
    } catch (_) {
      alert("Errore nel file di backup");
    }
  };
  reader.readAsText(file);
}

/*==================================================
    10 - MODALI
==================================================*/

let callbackConferma = null;

/**
 * Apre la modale di conferma.
 * @param {string} titolo
 * @param {string} contenutoHtml
 * @param {Function|null} callback
 */
function apriConferma(titolo, contenutoHtml, callback = null) {

    callbackConferma = callback;

    document.getElementById("titoloConferma").textContent = titolo;

    document.getElementById("testoConferma").innerHTML = contenutoHtml;

    document.getElementById("overlayConferma").classList.remove("hidden");
    document.getElementById("modalConferma").classList.remove("hidden");
}

function chiudiConferma() {

    document.getElementById("overlayConferma").classList.add("hidden");
    document.getElementById("modalConferma").classList.add("hidden");

    callbackConferma = null;
}

function eseguiConferma() {

    if (typeof callbackConferma === "function") {
        callbackConferma();
    }

    chiudiConferma();

}

/*==================================================
    11 - INIZIALIZZAZIONE
==================================================*/
document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("totaleConsumi")) {
        aggiornaDashboard();
    }

    if (document.getElementById("filtroCalorifero")) {
        popolaFiltroCaloriferi();
    }

    const btnConferma = document.getElementById("btnConferma");

    if (btnConferma) {
        btnConferma.addEventListener("click", eseguiConferma);
    }

});
