/*==================================================
    CALORE v1.0

    Core Application

    Autore : Sergio Comi
    Anno   : 2026
==================================================*/

/*==================================================
    01 COSTANTI
==================================================*/

const DB_KEY = "calore-db";
const APP_VERSION = "1.0";

/*==================================================
    02 DATABASE
==================================================*/

const defaultDB = {
      annoTermicoAttivo: null,
      caloriferi: [],
      letture: [],
};

/**
 * Restituisce il database corrente.
 */
function getDB() {
  const db = JSON.parse(localStorage.getItem(DB_KEY)) || structuredClone(defaultDB)
    
  return db;
}

/**
 * Salva il database nel Local Storage.
 */
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/*==================================================
    03 IDENTIFICATORI
==================================================*/

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/*==================================================
    04 FORMATTAZIONE
==================================================*/

function formatDate(date) {
  return new Date(date).toLocaleDateString("it-IT");
}

function formatDisplay(valore) {

    return Number(valore).toLocaleString("it-IT");
}

function formatFattore(valore) {

    if (valore == null) return "--";

    return Number(valore).toLocaleString("it-IT", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    });

}

function formatUnita(valore) {

    if (valore == null) return "--";

    return Math.round(valore).toLocaleString("it-IT");

}

/*==================================================
    05 - ANNO TERMICO
==================================================*/

function getAnnoTermicoAttivo() {
  const db = getDB();

  // Se esiste già lo utilizza
  if (db.annoTermicoAttivo) {
    return db.annoTermicoAttivo;
  }

  // Altrimenti lo crea automaticamente
  const oggi = new Date();
  const anno = oggi.getFullYear();

  const nuovoAnno =
    oggi.getMonth() >= 9
      ? `${anno}-${anno + 1}`
      : `${anno - 1}-${anno}`;

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
    06 - CALCOLI
==================================================*/

// restituisce array di oggetti { data, consumo }
function calcolaConsumiPerCalorifero(caloriferoId) {

    const letture = getDB().letture
        .filter(l => l.caloriferoId === caloriferoId)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

    const risultati = [];

    for (let i = 0; i < letture.length; i++) {

        const corrente = letture[i];
        const precedente = letture[i - 1];

        const consumo = precedente
            ? Number(corrente.valore) - Number(precedente.valore)
            : Number(corrente.valore);

        risultati.push({
            data: corrente.data,
            consumo: Math.max(consumo, 0),
            stanza: corrente.stanza,
            caloriferoId
        });

    }

    return risultati;
}

function calcolaUnitaContabilizzate(caloriferoId){

    const display = getUltimaLettura(caloriferoId);

    const calorifero = getDB().caloriferi.find(
        c => c.id === caloriferoId
    );

    if (!calorifero) return null;

    return display * calorifero.fattore;
}

function getTotaleConsumi() {

    const db = getDB();

    let totale = 0;

    db.caloriferi.forEach(c => {

        calcolaConsumiPerCalorifero(c.id).forEach(r => {
            totale += r.consumo;
        });

    });

    return totale;
}

function getNumeroCaloriferi() {
  return getDB().caloriferi.length;
}

function getNumeroLetture() {
  return getDB().letture.length;
}

function getFattore(caloriferoId) {

    const db = getDB();

    const calorifero = db.caloriferi.find(c => c.id === caloriferoId);

    return calorifero ? Number(calorifero.fattore) : null;

}

function getUnita(caloriferoId) {

    const display = getUltimaLettura(caloriferoId);

    const fattore = getFattore(caloriferoId);

    if (fattore === null) return null;

    return display * fattore;

}

function getUltimaLettura(caloriferoId) {

    const letture = getDB().letture
        .filter(l => l.caloriferoId === caloriferoId)
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    return letture.length
        ? Number(letture[0].valore)
        : 0;

}

/*==================================================
    07 - DASHBOARD
==================================================*/

function aggiornaDashboard() {
  if (!document.getElementById("totaleConsumi")) return;

  document.getElementById("totaleConsumi").textContent = getTotaleConsumi();
  document.getElementById("numeroCaloriferi").textContent = getNumeroCaloriferi();
  document.getElementById("numeroLetture").textContent = getNumeroLetture();
}

/*==================================================
    08 - CALORIFERI
==================================================*/

let editingId = null;

function apriCaloriferoSheet() {
  document.getElementById("sheetOverlay")?.classList.remove("hidden");
  document.getElementById("caloriferoSheet")?.classList.remove("hidden");
}

function chiudiCaloriferoSheet() {
  document.getElementById("sheetOverlay")?.classList.add("hidden");
  document.getElementById("caloriferoSheet")?.classList.add("hidden");

  editingId = null;
  const nome = document.getElementById("nomeCalorifero");
  const stanza = document.getElementById("stanzaCalorifero");
  if (nome) nome.value = "";
  if (stanza) stanza.value = "";
    const fattore = document.getElementById("fattoreCalorifero");
    if (fattore) fattore.value = "";
}

/**
 * Salva un nuovo calorifero
 * oppure aggiorna quello esistente.
 */
function salvaCalorifero() {
  const nome = document.getElementById("nomeCalorifero").value.trim();
  const stanza = document.getElementById("stanzaCalorifero").value.trim();
  const fattore = parseFloat(
      document.getElementById("fattoreCalorifero").value.replace(",", ".")
    ) || 0;
  if (!nome || !stanza) return alert("Compila tutti i campi");

  const db = getDB();

  if (editingId) {
    const c = db.caloriferi.find(c => c.id === editingId);
    if (c) {
        c.nome = nome;
        c.stanza = stanza;
        c.fattore = fattore;
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

function modificaCalorifero(id) {
  const c = getDB().caloriferi.find(c => c.id === id);
  if (!c) return;

  editingId = id;
  document.getElementById("nomeCalorifero").value = c.nome;
  document.getElementById("stanzaCalorifero").value = c.stanza;
  document.getElementById("fattoreCalorifero").value = c.fattore ?? "";
  apriCaloriferoSheet();
}

function eliminaCalorifero(id) {

    const db = getDB();

    const calorifero = db.caloriferi.find(c => c.id === id);

    if (!calorifero) return;

    const contenuto = `
        <div class="confirm-info">
            <div class="confirm-name">${calorifero.nome}</div>
            <div class="confirm-room">📍 ${calorifero.stanza}</div>
        </div>

        <div class="confirm-divider"></div>

        <div class="confirm-message">
            Verranno eliminate anche tutte le letture associate.<br><br>
            Questa operazione non può essere annullata.
        </div>
    `;

    apriConferma(
        "🗑 Elimina calorifero",
        contenuto,
        () => {

            db.caloriferi = db.caloriferi.filter(c => c.id !== id);
            db.letture = db.letture.filter(l => l.caloriferoId !== id);

            saveDB(db);

            renderCaloriferi();

            aggiornaDashboard();

        }
    );

}

function renderCaloriferi() {
  const container = document.getElementById("caloriferiContainer");
  if (!container) return;

  const db = getDB();
  container.innerHTML = "";

  const perStanza = {};
  db.caloriferi.forEach(c => (perStanza[c.stanza] ||= []).push(c));

  Object.entries(perStanza).forEach(([stanza, list]) => {
    const room = document.createElement("div");
    room.className = "room";
    room.innerHTML = `<h3>🏠 ${stanza} <span>(${list.length})</span></h3>`;

    list.forEach(c => {
      room.innerHTML += `
        <div class="radiator-card">
          <div class="rad-left">
            <div class="rad-icon">♨️</div>
            <div>
              <div class="rad-title">${c.nome}</div>
              <div class="rad-sub">${c.stanza}</div>
            </div>
          </div>
          <div class="rad-actions">
            <button onclick="modificaCalorifero('${c.id}')">✏️</button>
            <button onclick="eliminaCalorifero('${c.id}')">🗑</button>
          </div>
        </div>`;
    });

    container.appendChild(room);
  });
}

/*==================================================
    09 - LETTURE
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

function getLettureFiltrate({ caloriferoId = null, stanza = null } = {}) {
  return getDB().letture
    .filter(l => !caloriferoId || l.caloriferoId === caloriferoId)
    .filter(l => !stanza || l.stanza === stanza)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
}

function apriLetturaSheet() {
  const db = getDB();
  if (db.caloriferi.length === 0) {
    alert("Prima aggiungi almeno un calorifero");
    return;
  }

  const select = document.getElementById("letturaCalorifero");
  select.innerHTML = "";

  db.caloriferi.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.nome} (${c.stanza})`;
    select.appendChild(opt);
  });

    document.getElementById("sheetOverlayLettura").classList.remove("hidden");

    document.getElementById("letturaSheet").classList.remove("hidden");
   
    document.getElementById("letturaValore").value = "";
    document.getElementById("letturaData").value = "";
}

function chiudiLetturaSheet() {
  document.getElementById("sheetOverlayLettura")?.classList.add("hidden");
  document.getElementById("letturaSheet")?.classList.add("hidden");
}

function salvaLettura() {
  const id = document.getElementById("letturaCalorifero").value;
  const valore = document.getElementById("valoreLettura").value;
  const data = document.getElementById("dataLettura").value;

  if (!id || !valore || !data) return alert("Compila tutti i campi");
  if (isNaN(valore) || valore < 0) return alert("Valore non valido");

  aggiungiLettura(id, valore, data);
  chiudiLetturaSheet();
  aggiornaDashboard();
}

/* =================================================
    10 - STORICO
==================================================*/

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
    11 - BACKUP / RIPRISTINO
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
      if (!data.caloriferi || !data.letture) {
        alert("File non valido");
        return;
      }

      localStorage.setItem(DB_KEY, JSON.stringify(data));
      alert("Ripristino completato ✔️");
      location.reload();
    } catch (err) {
      alert("Errore nel file di backup");
    }
  };
  reader.readAsText(file);
}

/*==================================================
    12 - MODALI
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
    13 - INIZIALIZZAZIONE
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    renderCaloriferi();
    aggiornaDashboard();
    popolaFiltroCaloriferi();
    
    /* Inizializza solo gli elementi presenti nella pagina corrente */
    const btnConferma = document.getElementById("btnConferma");

    if (btnConferma) {
        btnConferma.addEventListener("click", eseguiConferma);
    }

});
