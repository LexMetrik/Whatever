// ─── W2·10-UI-NAV/R1+R2 · Reine Ableitungen für Treffer-Navigation & Quickjump ──
//
// Zwei deterministische Hilfen der DARSTELLUNGSSCHICHT (§3) — keine Rechtsregel,
// kein Normtext, kein Index:
//
//  · `loeseArtikelEingabe` — der Quickjump «Art. N» (R2). Er löst eine getippte
//    Artikel-Bezeichnung gegen die BEREITS geladenen Artikel-Token des Erlasses
//    auf. KEIN Suchindex, kein Server, keine Heuristik: dieselbe Normalisierung
//    (klein, alles Nicht-Alphanumerische raus), die `internRefs.tokenMap` im
//    Reader für bare Artikelverweise verwendet — «Art. 6a», «6 a», «ART.6A» und
//    «6a» führen deshalb alle auf denselben Token `6_a`. Kein Treffer ⇒ null
//    (der Aufrufer sagt es ehrlich, §8 — nie zum «ungefähr passenden» springen).
//
//  · `pfadLabels` — die «Sie sind hier»-Zeile des mobilen Gliederungs-Sheets (R2).
//    Sie projiziert die vom Scroll-Spy gelieferten Sektions-IDs (`aktivIds`) auf
//    ihre Gliederungs-Labels. Reine Projektion einer BESTEHENDEN Zustandsgrösse —
//    es wird nichts neu beobachtet, nichts geschätzt.
//
// Beide sind rein (§2) und Vitest-getestet.

import type { Sektion } from '../../lib/normtext/browse';

/** Normalform einer Artikel-Bezeichnung: klein, ohne Nicht-Alphanumerisches.
 *  IDENTISCH zur Token-Normalisierung in `inhalt.tsx` (internRefs) — dort wird
 *  die Map gebaut, hier die Eingabe darauf abgebildet (§5: eine Regel). */
export function normArtEingabe(eingabe: string): string {
  return eingabe
    .toLowerCase()
    // Führendes «art»/«§»/«artikel»/«para» abschneiden, bevor normalisiert wird —
    // sonst landete «Art. 6a» als «art6a» neben dem Token «6a» und fände nichts.
    .replace(/^\s*(?:art(?:ikel)?\.?|§+|par(?:agraph|agraf)?\.?)\s*/u, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Löst eine Quickjump-Eingabe gegen die vorhandenen Artikel-Token auf.
 * `tokenMap` ist die Normalform→Token-Abbildung des Readers (internRefs).
 * Rückgabe: der echte Token oder null (kein Treffer ⇒ kein Sprung, §8).
 */
export function loeseArtikelEingabe(eingabe: string, tokenMap: ReadonlyMap<string, string>): string | null {
  const n = normArtEingabe(eingabe);
  if (n === '') return null;
  return tokenMap.get(n) ?? null;
}

/**
 * Anker-Token einer Adresse auf den Token des Erlasses abbilden (Nebenfund S6,
 * Audit E 23.9.2026: `/gesetze/bund/OR#art-336c` sprang nicht, weil der Token
 * `336_c` heisst). EXAKT vor unscharf; unscharf nur über dieselbe Normalform
 * wie der Quickjump (`normArtEingabe`, §5) und nur bei EINDEUTIGEM Treffer —
 * sonst bleibt der rohe Token und der Sprung unterbleibt wie bisher (§8: kein
 * Rate-Sprung).
 */
export function kanonischerAnkerToken(roh: string, tokens: readonly string[]): string {
  if (tokens.includes(roh)) return roh;
  const n = normArtEingabe(roh);
  if (n === '') return roh;
  const treffer = tokens.filter((t) => normArtEingabe(t) === n);
  return treffer.length === 1 ? treffer[0] : roh;
}

/**
 * Labels der aktiven Gliederungs-IDs, in Pfad-Reihenfolge («Sie sind hier»).
 * IDs ohne Knoten im Baum werden übersprungen (kuratierter TOC-Baum ist eine
 * Teilmenge — nie einen Platzhalter erfinden, §8).
 */
export function pfadLabels(sektionen: Sektion[], aktivIds: readonly string[]): string[] {
  if (aktivIds.length === 0) return [];
  const labelById = new Map<string, string>();
  const geheDurch = (liste: Sektion[]) => {
    for (const s of liste) { labelById.set(s.id, s.label); geheDurch(s.kinder); }
  };
  geheDurch(sektionen);
  const out: string[] = [];
  for (const id of aktivIds) {
    const l = labelById.get(id);
    if (l) out.push(l);
  }
  return out;
}
