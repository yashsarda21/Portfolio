/** localStorage key set once the visitor has seen the landing boot (read by the head script below). */
export const LANDING_SEEN_KEY = "arena:landing-seen";

/**
 * Inline in <head>, before first paint: `.js` lets CSS hide parts a timeline will reveal; a return visit
 * gets the cut-down pace.
 */
export const HEAD_FLAGS_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('${LANDING_SEEN_KEY}')==='1')d.setAttribute('data-return-visit','')}catch(e){}})();`;
