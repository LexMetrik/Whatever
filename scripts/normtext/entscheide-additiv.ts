// ─── Additiver Zusammenführ-Kern (reine Logik, testbar) ───────────────────────
//
// Auftrag David 25.9.2026 («Stichproben der übrigen Gerichte auffrischen»): der
// additive Pfad von `scripts/normtext-entscheide.ts` ergänzt neben den eidg.
// Gerichten (--eidg) jetzt auch kantonale Gerichte (--courts). Diese Datei trägt
// die netzfreie Logik, damit sie ohne OCL-Lauf testbar ist:
//
//  · `waehleNeue`: aus den frisch geholten Snapshots eines Gerichts die N besten
//    nach dem Zweig-Sortierer — OHNE die bereits im Bestand geführten ids. Sonst
//    fielen Bestandsurteile unter die «N neuesten» und würden danach vom Dedupe
//    verworfen: effektiv kämen weniger als N neue dazu (Befund 25.9.2026).
//  · `fuehreAdditivZusammen`: Bestand ZUERST (byte-treu, §6 — ein frisch geholter
//    Snapshot mit Bestands-id überschreibt nie), dann die neuen Snapshots je Zweig,
//    global nach id gededuped. Leer-Guard je Zweig: angefordert, aber 0 GEHOLT
//    (Quelle nicht erreichbar) ⇒ Abbruch, Korpus unberührt. «0 geholt» ist bewusst
//    etwas anderes als «0 neu» (alles schon im Bestand) — Letzteres ist kein
//    Quellausfall und bricht nicht ab.
import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';

/** Ergebnis eines additiven Quellzweigs (eidg. oder kantonal). */
export interface AdditivZweig {
  /** Anzeigename für Log/Abbruchmeldung, z. B. «eidg.» oder «kantonale». */
  name: string;
  /** Anzahl angeforderter Gerichte (0 = Zweig nicht angefordert). */
  angefordert: number;
  /** Anzahl erfolgreich geholter Snapshots VOR Bestands-Ausschluss und Auswahl. */
  geholt: number;
  /** Gewählte neue Snapshots (bereits ohne Bestands-ids). */
  neu: EntscheidSnapshot[];
}

export interface AdditivErgebnis {
  /** Zu schreibender Korpus (Bestand zuerst) — leer, wenn `abbruch` gesetzt ist. */
  auswahl: EntscheidSnapshot[];
  /** Abbruch-Meldung (Leer-Guard); null = schreiben. */
  abbruch: string | null;
  /** Tatsächlich neu hinzugekommene Snapshots je Zweig-Name (nach globalem Dedupe). */
  neuJeZweig: Record<string, number>;
}

/**
 * Aus den frisch geholten Snapshots eines Gerichts die `n` ersten nach `sortierer`,
 * nachdem die im Bestand geführten ids ausgeschlossen wurden (§2: deterministisch,
 * sofern der Sortierer total ist — beide Aufrufer brechen Gleichstände über die id).
 */
export function waehleNeue(
  geholt: EntscheidSnapshot[],
  bestandIds: ReadonlySet<string>,
  n: number,
  sortierer: (xs: EntscheidSnapshot[]) => EntscheidSnapshot[],
): EntscheidSnapshot[] {
  return sortierer(geholt.filter((s) => !bestandIds.has(s.id))).slice(0, n);
}

/** Bestand + neue Zweige zusammenführen; Bestand gewinnt jede id-Kollision. */
export function fuehreAdditivZusammen(
  basis: EntscheidSnapshot[],
  zweige: AdditivZweig[],
): AdditivErgebnis {
  // Leer-Guard (§6): Schutz gegen stillen Bestand-Überschreib bei OCL-Ausfall.
  for (const z of zweige) {
    if (z.angefordert > 0 && z.geholt === 0) {
      return {
        auswahl: [],
        abbruch: `[additiv] 0 ${z.name} Entscheide geholt (Quelle nicht erreichbar?) — Korpus unberührt.`,
        neuJeZweig: {},
      };
    }
  }
  const seen = new Set<string>();
  const nimm = (s: EntscheidSnapshot) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; };
  const auswahl = basis.filter(nimm);
  const neuJeZweig: Record<string, number> = {};
  for (const z of zweige) {
    const dazu = z.neu.filter(nimm);
    auswahl.push(...dazu);
    neuJeZweig[z.name] = dazu.length;
  }
  if (auswahl.length === 0) {
    return { auswahl: [], abbruch: '[additiv] 0 Snapshots — bestehender Korpus bleibt unberührt.', neuJeZweig };
  }
  return { auswahl, abbruch: null, neuJeZweig };
}
