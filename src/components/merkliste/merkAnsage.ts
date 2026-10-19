import { MERKLISTE_MAX, type MerkSchaltung, type Uebernahme } from '../../lib/merkliste';

// Die Worte der Merkliste für Screenreader-Ansage und Statuszeile (reine Texte, §3: die Fachlogik
// liegt in lib/merkliste.ts). EHRLICH (§8): «voll» und «Browser sperrt» sind verschiedene Lagen mit
// verschiedener Abhilfe und werden nie vertauscht; beim Übernehmen nennt die Meldung ALLE Zahlen > 0.

export const TEXT_VOLL = `Merkliste voll (${MERKLISTE_MAX}) — zuerst Einträge entfernen`;
export const TEXT_GESPERRT = 'Merkliste nicht gespeichert: der Browser lässt keinen Speicher zu';

const stelle = (n: number) => (n === 1 ? 'Stelle' : 'Stellen');

/** Ansage nach «Merken»/«Entfernen» an einer Stelle. */
export function merkAnsage(titel: string, ergebnis: MerkSchaltung): string {
  if (ergebnis.fehler === 'voll') return TEXT_VOLL;
  if (ergebnis.fehler === 'gesperrt') return TEXT_GESPERRT;
  if (ergebnis.fehler === 'ungueltig') return `${titel} lässt sich nicht merken`;
  return ergebnis.gemerkt ? `${titel} gemerkt` : `${titel} aus der Merkliste entfernt`;
}

/** Meldung nach «Übernehmen»: neu · schon vorhanden · wegen Obergrenze — jede Zahl > 0 wird genannt. */
export function uebernahmeAnsage(u: Uebernahme): string {
  const teile: string[] = [];
  if (u.neu > 0) teile.push(`${u.neu} ${stelle(u.neu)} übernommen`);
  if (u.schonVorhanden > 0) {
    teile.push(`${u.schonVorhanden} ${stelle(u.schonVorhanden)} ${u.schonVorhanden === 1 ? 'war' : 'waren'} schon gemerkt`);
  }
  if (u.wegenObergrenze > 0) {
    teile.push(`${u.wegenObergrenze} ${stelle(u.wegenObergrenze)} nicht übernommen (Merkliste voll, höchstens ${MERKLISTE_MAX})`);
  }
  return teile.length > 0 ? `${teile.join('. ')}.` : 'Nichts zu übernehmen.';
}
