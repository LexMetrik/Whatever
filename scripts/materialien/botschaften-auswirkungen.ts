// scripts/materialien/botschaften-auswirkungen.ts
// M-5 (Erlass-Blatt Welle 2 Daten-Rest, W2·29-WERKBANK-LESER, 25.9.2026): Mantel-Botschaften
// allen Erlassen zuordnen, die ihr ändernder Erlass (oc) laut Fedlex-Rechtsanalyse
// «Auswirkungen» (jolux:LegalResourceImpact) tatsächlich ändert — nicht nur dem EINEN Erlass,
// unter dessen SR Fedlex den oc klassiert.
//
// Reproduktion am main 59078ae8c: BOTSCHAFT-2019-1847 (19.043, missbräuchlicher Konkurs) nur
// unter OR; AS 2023 628 (oc/2023/628) ist nur unter SR 220 klassiert, die Auswirkungen im
// store-raw bibliothek/normtext/revisionen-raw/{SCHKG,STGB,OR}.json nennen ihn aber für alle
// drei Erlasse. Ebenso BOTSCHAFT-2020-16 (19.074, DLT): oc/2021/33 ändert laut Auswirkungen
// OR und SchKG.
//
// QUELLE: der committete store-raw des Revisionen-Generators (`kontext.auswirkungen`, Pfad (c),
// S6-D1 23.9.2026) — amtliche Fedlex-Daten, kein zweiter Crawl (§11 Re-Parse ohne Re-Crawl).
// Reihenfolge: normtext:revisionen schreibt den raw; dieser Generator liest ihn. Kein Zyklus:
// der raw hängt nicht von botschaften.generated ab (nur die Sidecars tun es, botschaftKey).
//
// Nur Auswirkungs-Typen, die RECHTSETZUNG am Erlass bedeuten, begründen eine Zuordnung
// (Fedlex `vocabulary/impact-type`, Etiketten live gelesen 23.9.2026, s. revisionen-auswirkungen):
//   1 Änderung · 2 Aufhebung · 5 Inkrafttreten · 7 Verlängerung · 27 Vollständige Aufhebung ·
//   30 Teilinkraftsetzung.
// NICHT: 3 Genehmigung, 6 Berichtigung, 9 Geltungsbereich, 12 «2. Fundstelle» — diese nennen
// Publikations-/Staatsvertrags-Vorgänge, keine Rechtsänderung durch das Parlament (§1: lieber
// eine Kante zu wenig als eine Botschaft unter einem Erlass, den sie nicht ändert).
import { readFileSync, readdirSync, existsSync } from 'node:fs';

export const RECHTSETZUNGS_TYPEN: ReadonlySet<number> = new Set([1, 2, 5, 7, 27, 30]);
export const REVISIONEN_RAW_DIR = 'bibliothek/normtext/revisionen-raw';

export interface AuswirkungsQuelle {
  /** Erlass-Key (= Dateiname im store-raw). */
  key: string;
  auswirkungen: ReadonlyArray<{ oc: string; typ: number }>;
  /** oc, die Fedlex unter der SR DIESES Erlasses klassiert (Pfad (b), `bBindings[].oc`). */
  klassiert: ReadonlyArray<string>;
}

/**
 * REIN (§2): oc → Erlass-Keys (nur Rechtsetzungs-Typen) und die «fremd klassierten» oc —
 * jene, die Korpus-Erlasse ändern, aber unter KEINER Korpus-SR klassiert sind. Nur für diese
 * braucht der Generator die zweite SPARQL-Kette (Pfad B, oc → Projekt → Botschaft); alle
 * übrigen erreicht bereits Pfad A über die SR-Klassierung.
 */
export function auswirkungsIndex(quellen: ReadonlyArray<AuswirkungsQuelle>): {
  index: Map<string, Set<string>>;
  fremdOcs: string[];
} {
  const index = new Map<string, Set<string>>();
  const klassiert = new Set<string>();
  for (const q of quellen) {
    for (const oc of q.klassiert) klassiert.add(oc);
    for (const a of q.auswirkungen) {
      if (!RECHTSETZUNGS_TYPEN.has(a.typ)) continue;
      let s = index.get(a.oc);
      if (!s) { s = new Set(); index.set(a.oc, s); }
      s.add(q.key);
    }
  }
  const fremdOcs = [...index.keys()].filter((oc) => !klassiert.has(oc)).sort();
  return { index, fremdOcs };
}

/** Liest den committeten store-raw (Netz-frei). Fehlt er oder ein Erlass darin: leer —
 *  dann fällt der Generator auf die reine SR-Klassierung zurück (Log im Runner). */
export function ladeAuswirkungsQuellen(keys: ReadonlyArray<string>, dir = REVISIONEN_RAW_DIR): AuswirkungsQuelle[] {
  if (!existsSync(dir)) return [];
  const vorhanden = new Set(readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
  const out: AuswirkungsQuelle[] = [];
  for (const key of [...keys].sort()) {
    if (!vorhanden.has(key)) continue;
    const raw = JSON.parse(readFileSync(`${dir}/${key}.json`, 'utf8')) as {
      bBindings?: Array<{ oc?: { value: string } }>;
      kontext?: { auswirkungen?: Array<{ oc: string; typ: number }> } | null;
    };
    out.push({
      key,
      auswirkungen: (raw.kontext?.auswirkungen ?? []).map((a) => ({ oc: a.oc, typ: a.typ })),
      klassiert: (raw.bBindings ?? []).map((b) => b.oc?.value).filter((v): v is string => !!v),
    });
  }
  return out;
}
