import { MEHR_KNOPF_KLASSEN } from './mehrKnopfKlassen';

/** «Weitere anzeigen» unter einer portionierten Liste.
 *
 *  Stand bis 30.9.2026: lebte in `start/BlattBausteine.tsx` (drei Blätter). Mit
 *  dem vierten Aufrufer, dem Behörden-Deckel der Seite `/materialien`
 *  (W2·31-BILDSCHIRMBREITE P6), zog der Baustein in `ui/` — sonst holte die
 *  Seite über `BlattBausteine` den ganzen Formular-Baukasten (`vorlagen/ui`,
 *  NormText, Fedlex-Links) in ihren Chunk, nur für einen Knopf. `BlattBausteine`
 *  führt den Namen weiter (Re-Export), die drei Blätter bleiben unverändert. */
export function WeitereKnopf({ rest, mehr }: { rest: number; mehr: () => void }) {
  return (
    <button type="button" onClick={mehr} className={`lc-btn-mini ${MEHR_KNOPF_KLASSEN}`}>
      Weitere anzeigen (<span className="num">{rest.toLocaleString('de-CH')}</span> weitere)
    </button>
  );
}
