// Herkunft: FAHRPLAN-FRISTEN-EINHEIT (git 3fd5db8f9:archiv/FAHRPLAN-FRISTEN-EINHEIT.md)
// ─── FE-3 · EIN Preset-Such-Index über alle Regimes ─────────────────────────
//
// Dünner SUCH-INDEX, kein gemeinsamer Preset-Typ (V2-Erkenntnis: kein
// Typ-Brei, §4/§5): Die Preset-DATEN bleiben in ihren Regime-Dateien
// (zpoPresets · schkgPresets · famStatusPresets · MECHANIK_PRESETS); hier
// wird nur {label, norm, regime, query} aggregiert. Die Query je Eintrag ist
// DIESELBE Kodierung, die die Ziel-Form liest (ZPO_/SCHKG_LINK_SPEC bzw.
// fristQuery/fp — §5: eine Kodierung an genau einer Stelle), inklusive
// presetKey, damit die Form Phase/Hinweis/Dual-Fristen wiederherstellt.
// Suche nach dem katalogSuche-Muster (Label > Label-Teil > Norm-Kompakt).

import { PRESETS as ZPO_PRESETS } from './zpoPresets';
import { PRESETS_SCHKG } from './schkgPresets';
import { FAM_STATUS_PRESETS } from './famStatusPresets';
import { MECHANIK_PRESETS, mechanikPresetQuery } from './allgemeineFrist';
import { permalinkKodieren } from './permalink';
import { ZPO_LINK_SPEC, SCHKG_LINK_SPEC, type ZpoLink, type SchkgLink } from './rechnerPermalinks';
import { umlautFalten } from './katalogSuche';

export type PresetRegime = 'allgemein' | 'zpo' | 'schkg';

export interface PresetIndexEintrag {
  /** Global eindeutig: `${regime}:${quell-key}`. */
  key: string;
  regime: PresetRegime;
  regimeLabel: string;
  label: string;
  norm: string;
  /** URL-Query (mit «?» oder leer) für den Tagerechner — die Ziel-Form
   *  hydratisiert daraus beim Mount. */
  query: string;
  /** Verfahrens-Hash des Tagerechners ('' = Allgemein-Tab). */
  hash: '' | '#zpo' | '#schkg';
}

const REGIME_LABEL: Record<PresetRegime, string> = {
  allgemein: 'Allgemein (Vertrag/OR)',
  zpo: 'Zivilprozess (ZPO)',
  schkg: 'Betreibung (SchKG)',
};

function eintrag(regime: PresetRegime, quellKey: string, label: string, norm: string, query: string): PresetIndexEintrag {
  return {
    key: `${regime}:${quellKey}`, regime, regimeLabel: REGIME_LABEL[regime],
    label, norm, query,
    hash: regime === 'allgemein' ? '' : (`#${regime}` as '#zpo' | '#schkg'),
  };
}

/** Der vollständige Index — deterministisch aus den Regime-Dateien gebaut. */
export const PRESET_INDEX: PresetIndexEintrag[] = [
  ...ZPO_PRESETS.map((p) => eintrag('zpo', p.key, p.label, p.norm,
    permalinkKodieren(ZPO_LINK_SPEC, {
      presetKey: p.key, einheit: p.einheit, verfahren: p.verfahren, fristnatur: p.fristnatur,
      ...(p.laenge != null ? { laenge: p.laenge } : {}),
    } as Partial<ZpoLink> & Record<string, unknown>))),
  ...PRESETS_SCHKG.map((p) => eintrag('schkg', p.key, p.label, p.norm,
    permalinkKodieren(SCHKG_LINK_SPEC, {
      presetKey: p.key, phase: p.phase, modus: p.modus, fristnatur: p.fristnatur, ausloeser: p.ausloeser,
      ...(p.einheit ? { einheit: p.einheit } : {}),
      ...(p.laenge != null ? { laenge: p.laenge } : {}),
    } as Partial<SchkgLink> & Record<string, unknown>))),
  ...FAM_STATUS_PRESETS.map((p) => eintrag('allgemein', p.key, p.label, p.norm, `?fp=${p.key}`)),
  ...MECHANIK_PRESETS.map((p) => eintrag('allgemein', p.key, p.label, '', mechanikPresetQuery(p.patch))),
];

// ── Suche (Muster katalogSuche: gefaltet + kompakt, gerankter Treffer) ──────

const kompakt = (t: string) => t.replace(/\s+/g, '');
const falten = (t: string) => umlautFalten(t.toLowerCase());

type SuchFelder = { label: string; labelKompakt: string; normKompakt: string };
const FELDER = new Map<string, SuchFelder>();
function felder(e: PresetIndexEintrag): SuchFelder {
  let f = FELDER.get(e.key);
  if (!f) {
    const label = falten(e.label);
    f = { label, labelKompakt: kompakt(label), normKompakt: kompakt(falten(e.norm)) };
    FELDER.set(e.key, f);
  }
  return f;
}

export function presetRang(e: PresetIndexEintrag, suche: string): number | null {
  const q = falten(suche.trim());
  if (q === '') return null;
  const qKompakt = kompakt(q);
  const f = felder(e);
  if (f.label.startsWith(q)) return 0;
  if (f.label.includes(q)) return 1;
  if (f.normKompakt && f.normKompakt.includes(qKompakt)) return 2;
  // Mehrwort-Suche: alle Wörter müssen in Label+Norm vorkommen («Berufung
  // Summarentscheid» trifft auch bei anderer Wortstellung).
  const woerter = q.split(/\s+/).filter(Boolean);
  if (woerter.length > 1 && woerter.every((w) => f.label.includes(w) || f.normKompakt.includes(kompakt(w)))) return 3;
  return null;
}

/** Gerankte Trefferliste (deterministisch; Reihenfolge bei Ranggleichheit =
 *  Index-Reihenfolge, also Regime-Datei-Reihenfolge). */
export function presetSuche(suche: string, limit = 12): PresetIndexEintrag[] {
  if (suche.trim() === '') return [];
  return PRESET_INDEX
    .map((e) => [e, presetRang(e, suche)] as const)
    .filter((x): x is readonly [PresetIndexEintrag, number] => x[1] !== null)
    .sort((a, b) => a[1] - b[1])
    .slice(0, limit)
    .map(([e]) => e);
}
