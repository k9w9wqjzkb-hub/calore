function aggiornaUltimaLettura() {

    const letture = getDB().letture;

    const elemento = document.getElementById("ultimaLettura");

    if (!elemento) return;

    if (!letture.length) {
        elemento.textContent = "Nessuna lettura";
        return;
    }

    const ultima = letture.reduce((ultima, lettura) => {

        return new Date(lettura.data) > new Date(ultima.data)
            ? lettura
            : ultima;

    });

    elemento.textContent =
        new Date(ultima.data).toLocaleDateString("it-IT");

}

document.addEventListener("DOMContentLoaded", () => {

    aggiornaStatistiche();

});

function aggiornaStatistiche(){

    document.getElementById("totCaloriferi").textContent =
        getDB().caloriferi.length;

    document.getElementById("totLetture").textContent =
        getDB().letture.length;

    document.getElementById("annoAttivo").textContent =
        getAnnoTermicoAttivo();

    if(typeof APP_VERSION !== "undefined"){

        document.getElementById("versioneApp").textContent =
            APP_VERSION;

    }
        aggiornaUltimaLettura();
    }