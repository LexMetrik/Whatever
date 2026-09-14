import { formatiereDatum, grundartMeta, kopfGlieder } from '../helpers';
import { KopfOverline } from '../../../components/layout/LeserKopfGeruest';
import { MASSGEBLICH_HALBSATZ } from '../../../lib/benennung';
import { ErlassLeserKopf } from '../parts';
import { AmtlichesPdf } from '../parts/AmtlichesPdf';
import { ReiterAktion } from './ReiterAktion';
import { overlineGebiet, titelKennung, type BestimmungsWort } from './erlassAnsicht';
import type { LeserV3Modell } from './leserV3Modell';
import { useZukunftsfassung } from './useZukunftsfassung';

// ─── Der Erlass-Kopf der V3-Zelle (Kap. 4e) ──────────────────────────────────
//
// Herausgelöst aus `LeserRahmenV3.tsx` (H3, §6.6 — der Rahmen soll sagen, WO
// etwas steht, nicht auch noch, welche sieben Props der geteilte Kopf braucht).
// Reine Weitergabe: keine Verzweigung, kein eigener Zustand.
//
// Der geteilte Erlass-Kopf, seit S3 im Neu-Design: Titel · Fakten · Stand+Status
// · Aktionen. Er trägt Stand und die Warnung «nicht konsolidiert» — damit ist
// «Stand + Warnung erkennen» in JEDER Breite ohne Umweg erfüllt, auch dort, wo
// die Leiste ein Sheet ist.
//
// S3-Nachzug: `kennzahlen` ist dieselbe Kennzahl, die die Erlass-Übersicht
// daneben schon bekommt (§5) — sie speist die Anhang-Dominanz («Einträge» statt
// «Artikel»); `nichtKonsolidiertSeit` gibt der Warnung ihren Zeitbezug. Ohne
// beides sagte der V3-Kopf weniger als der Ist-Kopf, obwohl es dieselbe
// Komponente ist.

// C4 (H3-Nachzug): der Slot `fassungsWahl` ist gestrichen — über drei Etappen von
// keinem Aufrufer gesetzt (§17, Herleitung im Rahmen). Die Zeitmaschine (W2·5g)
// bekommt ihren Platz, wenn sie gebaut wird, und dann mit einem Konsumenten.
export function LeserErlassKopfZone({ m, erlass, artikelAnzahl, bestimmungsWort }: {
  m: LeserV3Modell;
  erlass: NonNullable<LeserV3Modell['erlass']>;
  artikelAnzahl: number;
  // B8 (H2b-Nachzug): der TYP aus `./erlassAnsicht`, nie ein neues Literal —
  // sonst stünde «Paragraphen» ein zweites Mal in `v3/` (Fundament-Sonde).
  bestimmungsWort: BestimmungsWort;
}) {
  const meta = grundartMeta(erlass.key);
  // W2·27 (§4 b): «ab <Datum> gilt eine neue Fassung» + amtlicher Link. Die
  // Ableitung sitzt hier und nicht im Kopf, weil sie ein Sidecar anfasst und der
  // Kopf reine Darstellung ist (§3) — Herleitung in `./useZukunftsfassung`.
  const zukunft = useZukunftsfassung(erlass, m.currency?.[erlass.key]);
  return (
    <ErlassLeserKopf erlass={erlass} artikelAnzahl={artikelAnzahl} bestimmungsWort={bestimmungsWort}
      currency={m.currency?.[erlass.key]} nichtKonsolidiert={m.nichtKonsolidiert}
      zukunft={zukunft}
      luecken={m.kantonLuecken[erlass.key]}
      kennzahlen={m.gliederung.kennzahlen} nichtKonsolidiertSeit={m.nichtKonsolidiertSeit}
      // Ä-(d) aus S3: bei sehr langen Titeln steht die Kennung VOR dem Titel
      // statt am Ende einer dreizeiligen H1 (`erlassAnsicht.titelKennung`).
      kennung={titelKennung(erlass)}
      // B-7 (31.8.2026): die Overline ist eine gegliederte Angabe, kein Satz —
      // Herkunft · Art · Sachgebiet, jedes Glied mit seinem Ton, unbekannte
      // ersatzlos (`KopfOverline`). Bis dahin fügte `kopfOverline` sie zu einem
      // String und warf beim Kanton das Sachgebiet weg (Herleitung in `helpers`).
      overline={<KopfOverline glieder={kopfGlieder(erlass, meta.erlassTyp, overlineGebiet(erlass, m.kantonSys))} />}
      // ── Ä-Rest der Live-Prüfung (18.8.2026) · KEIN «SNAPSHOT» IN DER
      //    KERNAUSKUNFT ─────────────────────────────────────────────────────
      // GEMESSEN am Live-Stand: unter dem Erlass-Titel stand «Snapshot —
      // massgeblich ist die amtliche Fassung». Das ist der Satz, der einem
      // Juristen sagt, WAS er hier vor sich hat — und sein erstes Wort war ein
      // englischer Fachbegriff aus unserem Bau-Vokabular. DESIGN-REGLEMENT A3
      // («Klarheit ist Qualität, kein Laien-Rabatt») und §8 verlangen an genau
      // dieser Stelle Klartext.
      // «Kopie vom <Stand>» sagt beides in vier Wörtern: dass es eine Kopie ist
      // (also nicht die Quelle) und von wann. Dass der Stand eine Zeile höher
      // in der «·»-Kette schon steht, ist BEWUSST: die Kette ist die
      // maschinelle Angabenzeile, dieser Satz die Auskunft im Klartext — der
      // Leser, der die Kette überliest, bekommt hier das Datum ausgeschrieben.
      // Ohne Stand (2 von 1469 Erlassen, VD) entfällt das Datum statt eine
      // leere Präposition stehen zu lassen (§8, dieselbe Regel wie B8).
      // B-6-Nachzug (31.8.2026, R2-B): der Vorbehalt war hier zweimal als
      // Literal ausgeschrieben — genau die zweite Wahrheit, vor der die
      // Herleitung in `lib/benennung` warnt. Zeichengleich, jetzt gebaut.
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
