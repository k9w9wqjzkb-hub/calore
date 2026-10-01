const CACHE_NAME = 'calore-v2';

const ASSETS = [
    './',
    './index.html',
    './caloriferi.html',
    './storico.html',
    './grafici.html',
    './ripartizione.html',
    './impostazioni.html',
    './manifest.json',

    // CSS
    './css/variables.css',
    './css/typography.css',
    './css/layout.css',
    './css/buttons.css',
    './css/cards.css',
    './css/forms.css',
    './css/topbar.css',
    './css/dashboard.css',
    './css/caloriferi.css',
    './css/storico.css',
    './css/grafici.css',
    './css/ripartizione.css',
    './css/impostazioni.css',
    './css/responsive.css',
    './css/modals.css',
    './css/style.css',

    // JavaScript
    './js/theme.js',
    './js/version.js',
    './js/app.js',
    './js/dashboard.js',
    './js/caloriferi.js',
    './js/storico.js',
    './js/grafici.js',
    './js/ripartizione.js',
    './js/impostazioni.js',
    './js/modals.js'
];


// ==================================================
// INSTALLAZIONE
// ==================================================

self.addEventListener('install', event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                console.log('Calore: creazione cache offline');

                return cache.addAll(ASSETS);

            })

    );

    self.skipWaiting();

});


// ==================================================
// ATTIVAZIONE
// ==================================================

self.addEventListener('activate', event => {

    event.waitUntil(

        caches.keys()
            .then(keys => {

                return Promise.all(

                    keys.map(key => {

                        if (key !== CACHE_NAME) {

                            console.log(
                                'Calore: eliminazione vecchia cache:',
                                key
                            );

                            return caches.delete(key);

                        }

                    })

                );

            })

    );

    self.clients.claim();

});


// ==================================================
// RICHIESTE
// ==================================================

self.addEventListener('fetch', event => {

    const request = event.request;

    // Gestiamo solamente le richieste GET
    if (request.method !== 'GET') {
        return;
    }

    event.respondWith(

        caches.match(request)
            .then(cachedResponse => {

                // Se il file è già in cache lo utilizziamo
                if (cachedResponse) {

                    return cachedResponse;

                }

                // Altrimenti proviamo a scaricarlo
                return fetch(request)
                    .then(networkResponse => {

                        // Salviamo in cache solo risposte valide
                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type === 'basic'
                        ) {

                            const responseClone =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(
                                        request,
                                        responseClone
                                    );
                                });

                        }

                        return networkResponse;

                    })
                    .catch(() => {

                        // Se siamo offline e la richiesta
                        // non è disponibile in cache
                        if (request.mode === 'navigate') {

                            return caches.match('./index.html');

                        }

                    });

            })

    );

});