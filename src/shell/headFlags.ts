import { LANDING_SEEN_KEY, MATCH_RECORD_KEY } from "./storageKeys";

export { LANDING_SEEN_KEY };

/**
 * Inline in <head>, before first paint: `.js` lets CSS hide parts a timeline will reveal; a return visit
 * gets the cut-down pace; `data-record` notes a saved match record exists, so record-bound parts wait for it
 * instead of flashing the fresh state (H5).
 */
export const HEAD_FLAGS_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('${LANDING_SEEN_KEY}')==='1')d.setAttribute('data-return-visit','');if(localStorage.getItem('${MATCH_RECORD_KEY}'))d.setAttribute('data-record','')}catch(e){}})();`;
