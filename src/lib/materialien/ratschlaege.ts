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
import { KANTONALE_GESETZGEBUNG } from './gattung';
import type { BrowseMaterial, MaterialManifest } from './typen';

// Die Menge `KANTONALE_GESETZGEBUNG` stand bis 24.9.2026 hier; sie ist nach
// `./gattung.ts` verschoben (unverändert), weil die Startseite dieselbe
// Materialien/Erläuterungen-Zuordnung braucht wie der Leser (§5).

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
  /** Herkunft der Zuordnung AN DIESEM ERLASS (Register `bsZuordnung`, W2·27-BUND-FERTIG):
   *  'amtlich' = Fussnote der Gesetzessammlung nennt das Geschäft; sonst 'maschinell'
   *  (auch wenn die Angabe fehlt, §8). Je Erlass, nicht je Geschäft — `hinweis` des
   *  Registers gilt je Geschäft und trägt bei gemischten Geschäften beide Texte. */
  zuordnung: 'amtlich' | 'maschinell';
}

let indexCache: { manifest: MaterialManifest; index: Map<string, KantonalesGeschaeft[]> } | null = null;

function alsGeschaeft(m: BrowseMaterial, erlass: string): KantonalesGeschaeft {
  return {
    key: m.key, titel: m.titel, doktypLabel: m.doktypLabel, behoerdeKuerzel: m.behoerdeKuerzel,
    nummer: m.nummer, stand: m.stand, quelleUrl: m.quelleUrl,
    zuordnung: m.bsZuordnung?.[erlass] === 'amtlich' ? 'amtlich' : 'maschinell',
  };
}

function vergleiche(a: KantonalesGeschaeft, b: KantonalesGeschaeft): number {
  return a.stand < b.stand ? 1 : a.stand > b.stand ? -1 : (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

/** Rein, ohne Netz: der erlassKey→Geschäfte-Index eines Manifests (neu → alt). */
function baueKantonsIndex(manifest: MaterialManifest): Map<string, KantonalesGeschaeft[]> {
  const index = new Map<string, KantonalesGeschaeft[]>();
  for (const m of manifest.materialien) {
    if (!KANTONALE_GESETZGEBUNG.has(m.doktyp)) continue;
    for (const nk of m.normKeys) {
      const g = alsGeschaeft(m, nk);
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
  const seen = new Map<string, KantonalesGeschaeft>();
  const out: KantonalesGeschaeft[] = [];
  for (const k of normKeys) {
    for (const g of indexCache.index.get(k) ?? []) {
      const schon = seen.get(g.key);
      if (!schon) { const kopie = { ...g }; seen.set(g.key, kopie); out.push(kopie); }
      // Mehrere Erlasse derselben Seite treffen dasselbe Geschäft: «maschinell» gewinnt
      // (§8 — das Etikett fällt nur weg, wenn JEDER Treffer amtlich belegt ist).
      else if (g.zuordnung === 'maschinell') schon.zuordnung = 'maschinell';
    }
  }
  return out.sort(vergleiche);
}
