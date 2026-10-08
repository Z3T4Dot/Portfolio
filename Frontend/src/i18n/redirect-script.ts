// Blueprint 12 §hreflang: `/` es una página estática con un script inline (hash en la CSP) que
// redirige con location.replace según preferencia guardada → idioma del navegador → en (02).
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES } from './locales'

/**
 * Código del script inline de `/`. Repite la precedencia de `detectLocale` sin módulos ni
 * dependencias, porque corre antes de cualquier JS de la app; i18n.test.ts verifica que coincidan.
 * Se arma con las mismas constantes para que la clave y los idiomas no diverjan.
 */
export function localeRedirectScript(): string {
  const locales = JSON.stringify(LOCALES)
  return (
    `(function(){var s=${locales},l=null,n,i,p;` +
    `try{l=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)})}catch(e){}` +
    `if(s.indexOf(l)<0){l=null;n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];` +
    `for(i=0;i<n.length&&!l;i++){p=String(n[i]).split("-")[0].toLowerCase();if(s.indexOf(p)>=0)l=p}}` +
    `location.replace("/"+(l||${JSON.stringify(DEFAULT_LOCALE)})+"/")})();`
  )
}
