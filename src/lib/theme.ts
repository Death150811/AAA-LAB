export const THEME_KEY = "devdock-theme";
export type Theme = "night" | "paper";

/** Выполняется в <head> до отрисовки: выбранный режим применяется без мигания. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="paper")document.documentElement.dataset.theme="paper"}catch(e){}`;
