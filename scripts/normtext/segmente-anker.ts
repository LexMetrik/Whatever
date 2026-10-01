// ── Anker-Lokalisierung und Soll-Vollständigkeit des Tors `check:segmente` ───
//
// Aus segmente-logik.ts ausgelagert (§6.6 Datei-Schlankheit, 1.10.2026): die
// Datei überschritt mit dem Fix die 800-Zeilen-Schwelle. Reine Funktionen, keine
// Abhängigkeit zu segmente-logik.ts (Knoten strukturell, kein Zyklus).
//
// W2·27-BUND-FERTIG (1.10.2026, Fedlex-Frische-Lauf 36828566407): VZV trägt DREI
// <section id="annex_u1">; der Extraktor vergibt den Folge-Vorkommen den
// Synthese-Suffix «__2»/«__3» (extrahiere-fedlex.ts `alleAnhangAnker`), das Tor
// lokalisierte nur per getElementById und klammerte beide als «Anker nicht in der
// HTML lokalisierbar» aus — `--schreiben` brach ab, der CI-Lauf (Modus B) blieb grün.

import { zerlegeVorkommenSuffix } from './anhang-vorkommen.ts';

interface MitAttribut {
  getAttribute: (name: string) => string | null;
}

/**
 * Lokalisiert einen Anker im geparsten Dokument. `getElementById` löst eine
 * doppelte id immer auf das ERSTE Element auf und kennt den Synthese-Suffix
 * «__N» nicht (er existiert als Attribut-Wert nie) — daher: eine echte id
 * gewinnt; sonst ist «<basis>__N» das N-te `<section id="<basis>">` in
 * Dokumentreihenfolge (Konvention und Zerlegung geteilt mit der Anhang-Anker-
 * Auflösung, `zerlegeVorkommenSuffix`; der Extraktor zählt dieselben
 * `<section>`-Öffnungen, `extrahiereAnhang`).
 *
 * Bewusst NUR `<section>` (Anhänge, Gliederung): ein doppeltes `<article>`
 * (KKV art_126_z, Fedlex-Quellfehler) bleibt «nicht lokalisierbar» und ist die
 * einzige dokumentierte Ausklammerung (`AUSKLAMMERUNG_AUSNAHME`, check-segmente.ts).
 */
export function lokalisiereAnker<K extends MitAttribut>(
  dokument: { getElementById: (id: string) => K | null; querySelectorAll: (sel: string) => Iterable<K> },
  ankerId: string,
): K | null {
  const direkt = dokument.getElementById(ankerId);
  if (direkt) return direkt;
  const suffix = zerlegeVorkommenSuffix(ankerId);
  if (!suffix || suffix.nth < 2) return null;
  const gleichnamig = [...dokument.querySelectorAll('section[id]')].filter(
    (el) => el.getAttribute('id') === suffix.basis,
  );
  return gleichnamig[suffix.nth - 1] ?? null;
}

/**
 * Modus B (§6.7, 1.10.2026): jeder Projektions-Eintrag eines Erlasses muss im
 * Soll einen Schlüssel tragen (das Soll entsteht aus HTML-Ankern VEREINIGT mit
 * den Projektions-eIds). Fehlt einer, hat das Tor ihn nie geprüft — das Soll ist
 * hinter der Projektion zurück (#1204: VZV annex_u1__2/__3). Ohne diese Prüfung
 * las der CI-Lauf (nur Soll, keine HTML) grün, bis die Neugenerierung rot wurde.
 * @param praefix «bund/<KEY>/»; liefert die eIds OHNE Präfix.
 */
export function projektionOhneSoll(
  praefix: string,
  projektionsIds: Iterable<string>,
  sollEids: Iterable<string>,
): string[] {
  const soll = new Set(sollEids);
  const fehlend: string[] = [];
  for (const id of projektionsIds) {
    if (!id.startsWith(praefix)) continue;
    const eId = id.slice(praefix.length);
    if (!soll.has(eId)) fehlend.push(eId);
  }
  return fehlend;
}
