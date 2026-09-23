// ─── Lese-Brücke «kantonale Gesetzgebung» (Ratschläge, Grossratsberichte) ─────
//
// S6 · Befund M-3/B-4 (23.9.2026): `public/materialien/register.json` führt die
// Grossratsgeschäfte des Kantons Basel-Stadt (doktyp `ratschlag`, `gr-bericht`,
// `gr-initiative`; gezählt 23.9.2026: 84 + 32 + 1, davon 27 an BS-640.100) — der
// Reiter «Materialien» des Erlass-Blatts las aber nur `doktyp === 'botschaft'`
// (`./botschaften.ts`) und sagte am Kantonserlass «die Sammlung erfasst bisher
// nur Bundeserlasse». Die Daten waren da, die Brücke fehlte.
//
// DASSELBE MUSTER WIE `./botschaften.ts` (§5): Projektion aus demselben lazy
// geladenen Manifest (`ladeMaterialManifest`, gecachte Promise — kein zweiter
// Fetch), Index je Manifest-Referenz memoisiert, `null` nur bei Ladefehler
// (§8: Fetch-Fehler ≠ leer). Reine Ladeschicht (§3), keine Rechtslogik.

import { ladeMaterialManifest } from './browse';
import type { BrowseMaterial, DoktypId, MaterialManifest } from './typen';

/** Die Dokumenttypen der kantonalen Gesetzgebung — Vorlagen und Berichte an das
 *  Parlament, also das kantonale Gegenstück zur Botschaft des Bundesrates. */
export const KANTONALE_GESETZGEBUNG: ReadonlySet<DoktypId> = new Set<DoktypId>(['ratschlag', 'gr-bericht', 'gr-initiative']);

/** Anzeige-Form eines kantonalen Parlamentsgeschäfts. */
export interface KantonalesGeschaeft {
  key: string;
  titel: string;
  /** «Ratschlag», «Grossratsbericht» … (aus dem Register, §5). */
  doktypLabel: string;
  /** «GR BS». */
  behoerdeKuerzel: string;
  /** Geschäftsnummer «24.1692» oder `null`. */
  nummer: string | null;
  /** Datum ISO (= `stand` des Registers). */
  stand: string;
  /** Amtliche Quelle (Grossrats-Geschäftsdatenbank). */
  quelleUrl: string;
  /** Zuordnungs-Hinweis des Registers («maschinell … fachlich nicht geprüft»). */
  hinweis: string | null;
}

let indexCache: { manifest: MaterialManifest; index: Map<string, KantonalesGeschaeft[]> } | null = null;

function alsGeschaeft(m: BrowseMaterial): KantonalesGeschaeft {
  return {
    key: m.key, titel: m.titel, doktypLabel: m.doktypLabel, behoerdeKuerzel: m.behoerdeKuerzel,
    nummer: m.nummer, stand: m.stand, quelleUrl: m.quelleUrl, hinweis: m.hinweis,
  };
}

function vergleiche(a: KantonalesGeschaeft, b: KantonalesGeschaeft): number {
  return a.stand < b.stand ? 1 : a.stand > b.stand ? -1 : (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

/** Rein, ohne Netz: der erlassKey→Geschäfte-Index eines Manifests (neu → alt). */
export function baueKantonsIndex(manifest: MaterialManifest): Map<string, KantonalesGeschaeft[]> {
  const index = new Map<string, KantonalesGeschaeft[]>();
  for (const m of manifest.materialien) {
    if (!KANTONALE_GESETZGEBUNG.has(m.doktyp)) continue;
    const g = alsGeschaeft(m);
    for (const nk of m.normKeys) {
      const liste = index.get(nk) ?? [];
      liste.push(g);
      index.set(nk, liste);
    }
  }
  for (const liste of index.values()) liste.sort(vergleiche);
  return index;
}

/** Kantonale Parlamentsgeschäfte zu den normKeys, vereinigt + dedupliziert (neu →
 *  alt). `[]` = keine Zuordnung, `null` = Manifest nicht erreichbar (§8). */
export async function kantonaleGesetzgebungFuer(normKeys: readonly string[]): Promise<KantonalesGeschaeft[] | null> {
  const manifest = await ladeMaterialManifest();
  if (!manifest) return null;
  if (!indexCache || indexCache.manifest !== manifest) {
    indexCache = { manifest, index: baueKantonsIndex(manifest) };
  }
  const seen = new Set<string>();
  const out: KantonalesGeschaeft[] = [];
  for (const k of normKeys) {
    for (const g of indexCache.index.get(k) ?? []) {
      if (!seen.has(g.key)) { seen.add(g.key); out.push(g); }
    }
  }
  return out.sort(vergleiche);
}
