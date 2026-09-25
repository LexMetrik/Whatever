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
import type { Zurueckgehalten } from './entscheid-kantonsdatum';
export type { Zurueckgehalten };

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
  /**
   * Gerichte des Zweigs, deren Listing/Details nicht erreichbar waren (0 IDs oder 0
   * Details). Sie werden übersprungen, die übrigen geschrieben — aber nie still:
   * Weisung Orchestrator 25.9.2026, «übersprungen» muss im Log UND im Bericht stehen.
   */
  uebersprungen?: string[];
}

export interface AdditivErgebnis {
  /** Zu schreibender Korpus (Bestand zuerst) — leer, wenn `abbruch` gesetzt ist. */
  auswahl: EntscheidSnapshot[];
  /** Abbruch-Meldung (Leer-Guard); null = schreiben. */
  abbruch: string | null;
  /** Tatsächlich neu hinzugekommene Snapshots je Zweig-Name (nach globalem Dedupe). */
  neuJeZweig: Record<string, number>;
  /** Übersprungene Gerichte aller Zweige (Log-Pflicht, siehe `AdditivZweig.uebersprungen`). */
  uebersprungen: string[];
}

/** Datum absteigend, id als totaler Tiebreaker (§2) — «die N neuesten». */
export const nachDatumDesc = (xs: EntscheidSnapshot[]): EntscheidSnapshot[] =>
  [...xs].sort((a, b) => (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/**
 * Auswahl-Sortierer des Kantonszweigs. Additiv (Auffrischen der Stichprobe, Entscheid
 * Orchestrator 25.9.2026): streng nach Datum absteigend wie der eidg. Zweig — der Auftrag
 * heisst «die neuesten». Vollbau: unverändert die Rang-Auswahl (Regeste → Leitentscheid
 * → Datum), damit ein Vollbau byte-gleich wählt wie bisher (§6).
 */
export function kantonSortierer(
  additiv: boolean,
  rangSortierer: (xs: EntscheidSnapshot[]) => EntscheidSnapshot[],
): (xs: EntscheidSnapshot[]) => EntscheidSnapshot[] {
  return additiv ? nachDatumDesc : rangSortierer;
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
  const uebersprungen = zweige.flatMap((z) => z.uebersprungen ?? []);
  // Leer-Guard (§6): Schutz gegen stillen Bestand-Überschreib bei OCL-Ausfall.
  for (const z of zweige) {
    if (z.angefordert > 0 && z.geholt === 0) {
      return {
        auswahl: [],
        abbruch: `[additiv] 0 ${z.name} Entscheide geholt (Quelle nicht erreichbar?) — Korpus unberührt.`,
        neuJeZweig: {},
        uebersprungen,
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
    return { auswahl: [], abbruch: '[additiv] 0 Snapshots — bestehender Korpus bleibt unberührt.', neuJeZweig, uebersprungen };
  }
  return { auswahl, abbruch: null, neuJeZweig, uebersprungen };
}

/**
 * Bestandsschutz für zurückgehaltene kantonale Neuabrufe (Befund D, dritte Gegenprüfung
 * 25.9.2026): der Kantonszweig hält Entscheide ohne eigenen Urteilskopf zurück
 * (`nurMitAmtlichemKopf`, entscheid-kantonsdatum.ts). Ein vorhandener Bestandseintrag
 * bleibt dabei UNVERÄNDERT: er tritt im Kandidatenpool an die Stelle des Neuabrufs
 * (Vollbau schreibt den Korpus neu; additiv ist er ohnehin Bestand und fällt in
 * `waehleNeue` heraus). Identität exakt wie der Kopfdatum-Refresh: court + Aktenzeichen.
 * Rein, nach id sortiert (§2).
 */
export function bestandStattZurueckgehalten(
  zurueck: readonly Zurueckgehalten[],
  bestand: readonly EntscheidSnapshot[],
): EntscheidSnapshot[] {
  const nr = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const keys = new Set(zurueck.map((z) => `${z.court}\u0000${nr(z.nummer)}`));
  return bestand.filter((s) => keys.has(`${s.gericht}\u0000${nr(s.nummer)}`)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Log-Zeile je Gericht (nie still, §8): zurückgehaltene Neuabrufe, nach decisionId sortiert (§2). */
export function zurueckhalteZeile(court: string, zurueck: readonly Zurueckgehalten[], behalten: number): string {
  const z = [...zurueck].sort((a, b) => (a.decisionId < b.decisionId ? -1 : a.decisionId > b.decisionId ? 1 : 0));
  return `[kanton] ${court}: ${z.length} zurückgehalten (kein eigener Urteilskopf; davon ${behalten} Bestand unverändert): ${z.map((x) => `${x.nummer} (${x.grund})`).join('; ')}`;
}
