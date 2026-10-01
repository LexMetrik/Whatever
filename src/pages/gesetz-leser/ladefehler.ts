// ─── Ladefehler-Kanal des Gesetzesleser (W2·17-UI-BEFUNDE PA-3-B01/B02, PE-C10-D01) ─
//
// «Der Erlass ist nicht im Bestand» (nicht im Register, Datei 404) und «der Erlass
// konnte nicht geladen werden» (Netz, 5xx, Abbruch) sind zwei verschiedene
// Auskünfte (§8). Der Fehlerzustand des Lesers (`fehler`, ein Boolean in
// `inhalt-zustand.tsx`) trägt nur das EINE Bit; welche Auskunft gemeint ist und
// wie man es noch einmal versucht, reicht dieser kleine Kanal von `useLeserDaten`
// (Schreiber) an `GesetzFehlSeite` (Leser) weiter.
//
// WARUM EIN KANAL UND KEIN ZUSTANDSFELD: der saubere Weg wäre `fehler:
// false | 'nicht-im-bestand' | 'ladefehler'` durch `inhalt-zustand.tsx` →
// `leserV3Modell.ts` → `LeserRahmenV3.tsx` → `FruehAnsicht`. Diese Dateien
// standen beim Bau in einem offenen PR einer anderen Session (#1253); der Kanal
// ist die Brücke bis dahin. Folgeposten: den Kanal durch das typisierte
// Zustandsfeld ersetzen und diese Datei löschen.
//
// Schlüssel = der Erlass-Schlüssel der Adresse. Mehrere Instanzen (Split-View-
// Panes) mit demselben Erlass teilen den Eintrag: «Erneut laden» stösst ALLE
// angemeldeten Ladevorgänge an (jede Instanz hält ihre eigenen Zustände), und
// der Eintrag ist erst weg, wenn die letzte sich abgemeldet hat. Reiner Speicher
// ohne Netz, ohne Uhr, ohne Zufall (§2).

/** `register` = das Register der Erlasse war nicht erreichbar (ob der Erlass im
 *  Bestand ist, ist offen); `datei` = der Erlass steht im Register, seine Datei
 *  war nicht erreichbar. */
export type LadefehlerArt = 'register' | 'datei';

interface Eintrag { art: LadefehlerArt; erneut: Set<() => void> }

const stand = new Map<string, Eintrag>();

/** Meldet einen Ladefehler zum Erlass-Schlüssel an; `erneut` stösst den
 *  Ladevorgang der meldenden Instanz noch einmal an. */
export function meldeLadefehler(schluessel: string, art: LadefehlerArt, erneut: () => void): void {
  const e = stand.get(schluessel);
  if (e) { e.art = art; e.erneut.add(erneut); }
  else stand.set(schluessel, { art, erneut: new Set([erneut]) });
}

/** Nimmt die Meldung dieser Instanz zurück (Neuversuch begonnen, Unmount). */
export function loescheLadefehler(schluessel: string, erneut: () => void): void {
  const e = stand.get(schluessel);
  if (!e) return;
  e.erneut.delete(erneut);
  if (e.erneut.size === 0) stand.delete(schluessel);
}

/** Welcher Ladefehler liegt zu diesem Erlass vor? `null` = keiner gemeldet. */
export function ladefehlerArt(schluessel: string): LadefehlerArt | null {
  return stand.get(schluessel)?.art ?? null;
}

/** «Erneut laden»: stösst den Ladevorgang aller meldenden Instanzen an. */
export function ladefehlerErneut(schluessel: string): void {
  const e = stand.get(schluessel);
  if (!e) return;
  for (const f of [...e.erneut]) f();
}
