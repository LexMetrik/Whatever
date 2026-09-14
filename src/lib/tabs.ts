export type { TabEintrag, KurzformTeile, ReiterKarteTeile } from './tabs/typen';
export { tabSchluessel } from './tabs/typen';

export {
  reiterKurzform,
  reiterKurzformTeile,
  reiterKurzformText,
  reiterKarteTeile,
  reiterTitel,
} from './tabs/beschriftung';

export {
  TABS_EVENT,
  festeZone,
  zugErlaubt,
  istFest,
  hefteAn,
  loeseAb,
  ladeTabs,
  tabsGleich,
  merkeTab,
  ersetzeTab,
  ordneTabsUm,
  nachfolgerReiter,
  schliesseTab,
  leereTabs,
  uebernehmeMappe,
  schliesseAndere,
  schliesseRechtsVon,
  stelleLetztenWiederHer,
  naechsteInstanz,
  aktualisiereTabArtikel,
} from './tabs/speicher';

export {
  letzterGeschlossener,
  merkeAktivenReiter,
  vorherigerReiter,
} from './tabs/verlauf';
