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

}