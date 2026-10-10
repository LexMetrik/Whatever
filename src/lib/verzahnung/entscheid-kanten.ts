// ─── Entscheid → Entscheid: Auflösung zitierter Entscheide (V1.3) ────────────
//
// Die rückwärtige «Zitiert»-Gruppe des EntscheidLesers (FAHRPLAN-VERZAHNUNG-UI
// §2.2): `zitierteEntscheide` (maschinell aus dem Urteilstext gelesene Zitate wie
// «BGE 144 II 486») werden gegen das kuratierte Manifest aufgelöst. Dargestellt
// werden NUR aufgelöste Treffer als Link-Chips + Zähler + EIN ehrlicher
// Hinweissatz für den Rest (§0-1c: keine grauen Nicht-Link-Chip-Wüsten).
// Zusätzlich trägt jede aufgelöste Kante den Anker der Erwägung im ZITIERENDEN
// Text (Auftrag David 3.7.2026: die Fundstelle des Zitats ist ansteuerbar).
//
// Reine Auflösungsschicht (§3), deterministisch (§2). Kein Netz — Manifest und
// Abschnitte liefert der Aufrufer.
//
// Erweiterungspunkt V2: die masse-DB-Kanten (`zitat_kanten`) liefern Zitat +
// Erwägungs-Fundstelle als Spalten — dann speist die Edge-Query diese Kanten
// auch für Long-Tail-Entscheide ohne Client-Parse (FAHRPLAN §V2).

import type { EntscheidIndexEintrag } from '../rechtsprechung/entscheid-index';
import type { EntscheidAbschnitt, Leitcharakter } from '../rechtsprechung/typen';
import { ersteTextFundstelle } from '../rechtsprechung/abschnitte';

interface ZitierteEntscheidKante {
  /** Roh-Zitat aus dem Urteilstext («BGE 144 II 486»). */
  zitat: string;
  /** Aufgelöstes Korpus-Ziel oder null (nicht erfasst). */
  ziel: { key: string; zitierung: string; leitcharakter: Leitcharakter } | null;
  /** Erwägungs-Anker des Zitats im ZITIERENDEN Text («e-2-3») oder null. */
  fundstelleAnker: string | null;
}

export interface ZitierteEntscheide {
  /** Alle Zitate (dedupliziert, Eingabereihenfolge), aufgelöste zuerst. */
  kanten: ZitierteEntscheidKante[];
  /** Anzahl erfasste Zitate gesamt (dedupliziert). */
  gesamt: number;
  /** Davon im Korpus aufgelöst (= Anzahl Link-Chips). */
  imKorpus: number;
}

/** «BGE 144 II 486» → «144 II 486»; alles andere unverändert (whitespace-glatt). */
function normZitat(z: string): string {
  return z.replace(/\s+/g, ' ').trim();
}

/**
 * Zitate gegen das Manifest auflösen. Match-Regeln (deterministisch, §2):
 * BGE-Zitate über `bgeReferenz`, Aktenzeichen über `nummer`. Verweis-Einträge
 * (Karten-Duplikate ohne eigene Datei) werden übersprungen; der Entscheid
 * selbst (`selbstKey`) zählt nie als eigenes Zitat-Ziel.
 */
export function aufloeseZitierteEntscheide(
  zitierte: readonly string[],
  manifest: readonly EntscheidIndexEintrag[],
  abschnitte: EntscheidAbschnitt[],
  selbstKey: string,
): ZitierteEntscheide {
  // Nachschlage-Karten einmalig (kein O(n·m)): nur echte Einträge mit Datei.
  const nachBge = new Map<string, EntscheidIndexEintrag>();
  const nachNummer = new Map<string, EntscheidIndexEintrag>();
  for (const e of manifest) {
    if (e.verweis || !e.datei || e.key === selbstKey) continue;
    if (e.bgeReferenz && !nachBge.has(e.bgeReferenz)) nachBge.set(e.bgeReferenz, e);
    if (e.nummer && !nachNummer.has(e.nummer)) nachNummer.set(e.nummer, e);
  }

  const gesehen = new Set<string>();
  const kanten: ZitierteEntscheidKante[] = [];
  for (const roh of zitierte) {
    const zitat = normZitat(roh);
    if (!zitat || gesehen.has(zitat)) continue;
    gesehen.add(zitat);
    const bgeRef = zitat.replace(/^BGE\s+/i, '');
    const treffer = (bgeRef !== zitat ? nachBge.get(bgeRef) : undefined) ?? nachNummer.get(zitat);
    kanten.push({
      zitat,
      ziel: treffer
        ? { key: treffer.key, zitierung: treffer.zitierung, leitcharakter: treffer.leitcharakter }
        : null,
      // in-Text-Fundstelle nur für dargestellte (aufgelöste) Kanten suchen —
      // die unaufgelösten erscheinen nicht als Chips (§0-1c).
      fundstelleAnker: treffer ? ersteTextFundstelle(abschnitte, zitat) : null,
    });
  }
  // Aufgelöste zuerst (stabile Reihenfolge innerhalb beider Klassen).
  kanten.sort((a, b) => Number(!!b.ziel) - Number(!!a.ziel));
  return {
    kanten,
    gesamt: kanten.length,
    imKorpus: kanten.filter((k) => k.ziel).length,
  };
}
