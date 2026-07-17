/*==================================================
    MODALS
==================================================*/

function mostraMessaggio(titolo, testo){

    const overlay=document.createElement("div");

    overlay.className="app-modal-overlay";

    overlay.innerHTML=`

        <div class="app-modal">

            <div class="app-modal-header">

                ${titolo}

            </div>

            <div class="app-modal-body">

                ${testo}

            </div>

            <div class="app-modal-footer">

                <button class="app-modal-btn">

                    OK

                </button>

            </div>

        </div>

    `;

    overlay
        .querySelector("button")
        .onclick=()=>overlay.remove();

    document.body.appendChild(overlay);

}