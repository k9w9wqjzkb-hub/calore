/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  renderStorico();
});

/* ================= DASHBOARD ================= */
function renderDashboard() {
  const db = getDB();

  renderAnnoTermicoAttivo();
  renderTotali(db);
  renderConsumiPerStanzaCard(db);
  renderAnnoTermicoSelect();
  renderChart(db);
}

/* ================= ANNO TERMICO ================= */

function renderAnnoTermicoAttivo() {

    const el = document.getElementById("annoTermicoAttivo");

    if (!el) return;

    el.textContent = getAnnoTermicoAttivo();

}

/* ================= TOTALI ================= */
function renderTotali(db) {
  const totale = getTotaleConsumi();
    
  const totaleElem = document.getElementById("totaleConsumi");
  if (totaleElem) totaleElem.textContent = totale.toLocaleString("it-IT");

  const numeroCaloriferiElem = document.getElementById("numeroCaloriferi");
  if (numeroCaloriferiElem) numeroCaloriferiElem.textContent = db.caloriferi.length;

  const numeroLettureElem = document.getElementById("numeroLetture");
  if (numeroLettureElem) numeroLettureElem.textContent = db.letture.length;
}

/* ================= CONSUMI PER STANZA ================= */
function renderConsumiPerStanzaCard({ annoTermico = null } = {}) {
  const container = document.getElementById("consumiPerStanza");
  if (!container) return;

  const consumi = getConsumiPerStanza({ annoTermico });

  container.innerHTML = `<h3>Consumi per Stanza</h3>`;

  Object.keys(consumi).sort().forEach(stanza => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span class="pill">${stanza}</span>
      <span class="value">${consumi[stanza].toLocaleString("it-IT")}</span>
    `;
    container.appendChild(row);
  });
}

function getConsumiPerStanza({ annoTermico = null } = {}) {
  const db = getDB();
  const risultati = {};

  db.caloriferi.forEach(c => {
    calcolaConsumiPerCalorifero(c.id).forEach(r => {
      if (annoTermico && getAnnoTermico(r.data) !== annoTermico) return;
      risultati[r.stanza] = (risultati[r.stanza] || 0) + r.consumo;
    });
  });

  return risultati;
}

/* ================= CALCOLA CONSUMI PER CALORIFERO ================= */
function calcolaConsumiPerCalorifero(caloriferoId) {
  const db = getDB();
  const letture = db.letture
    .filter(l => l.caloriferoId === caloriferoId)
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const consumi = [];
  let ultimaLetturaValore = 0;

  letture.forEach((l, idx) => {
    let consumo = 0;

    if (idx === 0) {
      consumo = Number(l.valore); // prima lettura conta
    } else {
      consumo = Number(l.valore) - ultimaLetturaValore;
    }

    if (consumo < 0) consumo = 0;

    consumi.push({
      data: l.data,
      stanza: l.stanza,
      calorifero: l.calorifero,
      consumo
    });

    ultimaLetturaValore = Number(l.valore);
  });

  return consumi;
}

/* ================= ANNO TERMICO ================= */
function getAnniTermiciDisponibili() {
  const anni = new Set();
  getDB().letture.forEach(l => anni.add(getAnnoTermico(l.data)));
  return [...anni].sort((a,b) => Number(b.split("-")[0]) - Number(a.split("-")[0]));
}

function renderAnnoTermicoSelect() {
  const select = document.getElementById("annoTermicoSelect");
  if (!select) return;

  const anni = getAnniTermiciDisponibili();
  select.innerHTML = "";

  anni.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = `Anno termico ${a}`;
    select.appendChild(opt);
  });

  if (anni.length) select.value = anni[0];
}

/* ================= GRAFICO ANDAMENTO CONSUMI MENSILI ================= */
let chart;
function renderChart(db) {
  const canvas = document.getElementById("consumiChart");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = ["Ott","Nov","Dic","Gen","Feb","Mar","Apr","Mag"];
  const consumiMese = Array(8).fill(0);

  db.caloriferi.forEach(c => {
    calcolaConsumiPerCalorifero(c.id).forEach(r => {
      const mese = getMeseAnnoTermico(r.data); // 0=Ott, 1=Nov...
      consumiMese[mese] += r.consumo;
    });
  });

  if (chart) chart.destroy();

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
        legend: { display: false },
        title: { display: true, text: "Andamento Consumi Mensili" }
      },
      scales: {
        y: { grid: { color: "#f2f2f7" }, ticks: { color: "#8e8e93" }, beginAtZero: true },
        x: { grid: { display: false }, ticks: { color: "#8e8e93" } }
      }
    }
  });
}

/* ================= SHEET NUOVA LETTURA ================= */
window.apriSheet = function () {
  const sheet = document.getElementById("letturaSheet");
  const select = document.getElementById("letturaCalorifero");
  if (!sheet || !select) return;

  select.innerHTML = `<option value="">Seleziona calorifero</option>`;
  getDB().caloriferi.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.stanza} – ${c.nome}`;
    select.appendChild(opt);
  });

  document.getElementById("letturaValore").value = "";
  document.getElementById("letturaData").value =
    new Date().toISOString().split("T")[0];

  sheet.classList.remove("hidden");
};

window.chiudiSheet = function () {
  document.getElementById("letturaSheet")?.classList.add("hidden");
};

window.salvaLettura = function () {
  const caloriferoId = document.getElementById("letturaCalorifero").value;
  const valore = parseFloat(document.getElementById("letturaValore").value);
  const data = document.getElementById("letturaData").value;

  if (!caloriferoId || isNaN(valore) || valore <= 0) {
    alert("Compila correttamente tutti i campi");
    return;
  }

  const db = getDB();
  const lettureCalorifero = db.letture
    .filter(l => l.caloriferoId === caloriferoId)
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  if (lettureCalorifero.length &&
      valore <= Number(lettureCalorifero[0].valore)) {
    alert(`La nuova lettura deve essere maggiore dell'ultima (${lettureCalorifero[0].valore})`);
    return;
  }

  aggiungiLettura(caloriferoId, valore, data);
/* ==  chiudiSheet(); == */
  renderDashboard();
  renderStorico();
};

/* ================= STORICO ================= */
function renderStorico() {
  const db = getDB();
  const container = document.querySelector(".list-card");
  if (!container) return;

  container.innerHTML = "";

  [...db.letture]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .forEach((l, i, arr) => {
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        <div class="date-col">${new Date(l.data).toLocaleDateString("it-IT")}</div>
        <div class="rad-col">${l.calorifero}</div>
        <div class="room-col">${l.stanza}</div>
        <div class="value-col">${Number(l.valore).toLocaleString("it-IT")}</div>
      `;
      container.appendChild(row);

      if (i < arr.length - 1) {
        const divider = document.createElement("div");
        divider.className = "divider";
        container.appendChild(divider);
      }
    });

  renderStats(db);
}
