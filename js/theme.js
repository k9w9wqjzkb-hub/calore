/*==================================================
    CALORE 2.0
    Theme Manager

    Centralizza tutti i Design Tokens CSS
    rendendoli disponibili ai file JavaScript.

    Autore: Sergio Comi
    Anno: 2026
==================================================*/

(function () {

    const css = getComputedStyle(document.documentElement);

    window.THEME = {

        /*==========================================
            COLORI
        ==========================================*/

        colors: {

            primary: css.getPropertyValue('--color-primary').trim(),
            primaryDark: css.getPropertyValue('--color-primary-dark').trim(),
            primaryLight: css.getPropertyValue('--color-primary-light').trim(),

            success: css.getPropertyValue('--success').trim(),
            warning: css.getPropertyValue('--warning').trim(),
            error: css.getPropertyValue('--error').trim(),
            info: css.getPropertyValue('--info').trim(),

            white: css.getPropertyValue('--color-white').trim(),
            black: css.getPropertyValue('--color-black').trim(),

            textTitle: css.getPropertyValue('--text-title').trim(),
            textBody: css.getPropertyValue('--text-body').trim(),
            textMuted: css.getPropertyValue('--text-muted').trim()

        }

    };

})();