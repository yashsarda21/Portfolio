/** Inline in <head> before first paint so the scaled stage never flashes at the wrong size (spec §4.4). */
export const STAGE_SCALE_SCRIPT =
  "(function(){var d=document.documentElement;function s(){d.style.setProperty('--stage-scale',String(Math.min(d.clientWidth/1440,d.clientHeight/900)))}s();addEventListener('resize',s)})();";
