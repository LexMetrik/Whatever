import { formatiereDatum, grundartMeta, kopfGlieder } from '../helpers';
import { KopfOverline } from '../../../components/layout/LeserKopfGeruest';
import { MASSGEBLICH_HALBSATZ } from '../../../lib/benennung';
import type { ErlassKopf } from '../../../lib/normtext/browse';
import { ErlassLeserKopf } from '../parts';
import { teilerfassung } from '../erlassUebersichtDaten';
import { AmtlichesPdf } from '../parts/AmtlichesPdf';
import { ReiterAktion } from './ReiterAktion';
import { overlineGebiet, titelKennung, type BestimmungsWort } from './erlassAnsicht';
import type { LeserV3Modell } from './leserV3Modell';
import { useZukunftsfassung } from './useZukunftsfassung';

// ─── Das Titelblatt der V3-Zelle — die Verdrahtung ───────────────────────────
//
// W2·29-WERKBANK-LESER S2 (23.9.2026): das Titelblatt ist EINE Komponente
// (`../parts/ErlassLeserKopf`, trägt seither auch den Ingress). Diese Datei
// liest, was nur die V3-Hülle weiss — Reiter-Toast, Zukunftsfassung (Sidecar,
// darum hier und nicht im reinen Titelblatt, §3), Overline aus der Kantons-
// Systematik, Kennung vor langen Titeln — und reicht es hinein. Keine
// Verzweigung, kein eigener Zustand. Frühere Herleitungen (H3, S3-Nachzug, C4,
// B-7, Ä-Rest «Kopie vom», B-6) im Wortlaut:
// `git show c9fc15513:src/pages/gesetz-leser/v3/LeserErlassKopfZone.tsx`.
export function LeserErlassKopfZone({ m, erlass, artikelAnzahl, bestimmungsWort, ingress }: {
  m: LeserV3Modell;
  erlass: NonNullable<LeserV3Modell['erlass']>;
  artikelAnzahl: number;
  // B8: der TYP aus `./erlassAnsicht`, nie ein neues Literal (Fundament-Sonde).
  bestimmungsWort: BestimmungsWort;
  /** Ingress des Erlasses; `null` im Einzelmodus (W2·5m) und ohne Sidecar. */
  ingress: ErlassKopf | null;
}) {
  const meta = grundartMeta(erlass.key);
  const zukunft = useZukunftsfassung(erlass, m.currency?.[erlass.key]);
  return (
    <ErlassLeserKopf erlass={erlass} artikelAnzahl={artikelAnzahl} bestimmungsWort={bestimmungsWort}
      currency={m.currency?.[erlass.key]} nichtKonsolidiert={m.nichtKonsolidiert}
      zukunft={zukunft}
      luecken={m.kantonLuecken[erlass.key]}
      teilerfassung={teilerfassung(erlass.key)?.befund}
      kennzahlen={m.gliederung.kennzahlen} nichtKonsolidiertSeit={m.nichtKonsolidiertSeit}
      kennung={titelKennung(erlass)}
      ingress={ingress} intern={m.internRefs}
      // B-7: gegliederte Overline — Herkunft · Art · Sachgebiet, unbekannte ersatzlos.
      overline={<KopfOverline glieder={kopfGlieder(erlass, meta.erlassTyp, overlineGebiet(erlass, m.kantonSys))} />}
      // «Kopie vom <Stand>» statt «Snapshot» (A3/§8, 18.8.2026); ohne Stand
      // (2 von 1469, VD) entfällt das Datum statt einer leeren Präposition.
      hinweis={erlass.stand
        ? `Kopie vom ${formatiereDatum(erlass.stand)} — ${MASSGEBLICH_HALBSATZ}`
        : `Kopie des amtlichen Texts — ${MASSGEBLICH_HALBSATZ}`}
      aktionen={
        <>
          <ReiterAktion kuerzel={erlass.kuerzel} onGeoeffnet={() => {
            m.setReiterToast(true);
            const toastRef = m.refs.reiterToastTimerRef;
            if (toastRef.current) window.clearTimeout(toastRef.current);
            toastRef.current = window.setTimeout(() => m.setReiterToast(false), 3200);
          }} />
          {erlass.pdfUrl && (
            <AmtlichesPdf href={erlass.pdfUrl} stand={erlass.pdfStand ?? erlass.stand} extern />
          )}
        </>
      } />
  );
}
