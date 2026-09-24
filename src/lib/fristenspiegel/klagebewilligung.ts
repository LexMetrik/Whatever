import { berechneFrist } from '../zpoFristen';
import { PRESETS } from '../zpoPresets';
import type { Kanton } from '../../types/legal';
import type { FristenspiegelErgebnis, SpiegelZeile } from './typen';

// ─── Fristenspiegel A.7: Zustellung der Klagebewilligung ────────────────────
//
// Orchestrierung über die ZPO-Presets (Konzept-Dossier A.7, «NICHTS fehlt»):
// die Miete/Pacht-Weiche wählt das Preset (Art. 209 Abs. 3 vs. Abs. 4 ZPO);
// gerechnet wird mit EXAKT dessen Parametern (§5, Test erzwingt Identität).

export type KlagebewilligungSpiegelInput = {
  zustellung: string; // yyyy-MM-dd — Eröffnung/Zustellung der Klagebewilligung
  kanton: Kanton;
  /** Streitigkeit aus Miete/Pacht von Wohn-/Geschäftsräumen bzw. landw. Pacht. */
  mietOderPacht: boolean;
};

function preset(key: string) {
  const p = PRESETS.find((x) => x.key === key);
  if (!p) throw new Error(`ZPO-Preset fehlt: ${key}`);
  return p;
}

export function berechneKlagebewilligungsSpiegel(input: KlagebewilligungSpiegelInput): FristenspiegelErgebnis {
  const p = preset(input.mietOderPacht ? 'klagefrist_miete' : 'klagebewilligung');
  const frist = berechneFrist({
    ereignis: input.zustellung, einheit: p.einheit, laenge: p.laenge!,
    verfahren: p.verfahren, kanton: input.kanton, fristnatur: p.fristnatur,
  });

  const zeilen: SpiegelZeile[] = [
    {
      key: 'klagefrist',
      label: input.mietOderPacht
        ? 'Klage einreichen (Miete/Pacht — verkürzte Frist)'
        : 'Klage einreichen (Gültigkeit der Klagebewilligung)',
      normRef: p.norm,
      fristnatur: 'klagefrist',
      status: 'berechnet',
      endeText: frist.diesAdQuem,
      endeISO: frist.diesAdQuemISO,
      bedingung: input.mietOderPacht
        ? 'Wohn-/Geschäftsräume und landwirtschaftliche Pacht: 30 Tage (Art. 209 Abs. 4 ZPO).'
        : 'Regelfall: drei Monate ab Eröffnung (Art. 209 Abs. 3 ZPO).',
    },
  ];

  return {
    ereignisLabel: 'Zustellung der Klagebewilligung',
    ereignisDatumISO: input.zustellung,
    zeilen,
    annahmen: [
      `Kanton ${input.kanton} (Gerichtsort — Feiertage für die Endnormalisierung, Art. 142 Abs. 3 ZPO).`,
      'Versäumte Klagefrist: Die Klagebewilligung verfällt; das Schlichtungsverfahren wäre neu einzuleiten (die Verjährungsunterbrechung von Art. 135 OR bleibt davon unberührt zu prüfen).',
    ],
    // Preset-Hinweis offenlegen (§8). Seit RL-20/R5-05 (24.9.2026): Stillstand
    // gilt (BGE 138 III 615); vorher hiess es «nicht abschliessend geklärt».
    warnungen: [...frist.warnungen, ...(p.hinweis ? [p.hinweis] : [])],
  };
}
