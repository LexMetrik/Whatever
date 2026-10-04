import { MASSGEBLICH_HALBSATZ, NEUER_TAB } from '../../../lib/benennung';
import { formatiereDatum } from '../helpers';

// W2·5d U-PDF / A12 — EINE Download-Aktion für das AMTLICHE PDF der gepinnten
// Fassung (David 5.7.2026: «das herunterladen soll amtliches pdf herunterladen»).
// Ehrliche Beschriftung «Amtliches PDF (Fassung vom …)» (§8). Ohne amtliches PDF
// wird die Aktion vom Aufrufer weggelassen (nie Schein-Amtlichkeit, nie
// render-eigenes PDF — FAHRPLAN-GESETZES-UX §10.5). Zwei Quellen, EINE Anatomie:
//   · Bund/Kanton-Snapshot → externe amtliche URL (Fedlex-Filestore / LexWork),
//     `extern` öffnet in einem neuen Tab (cross-origin `download` ist nur ein
//     Hinweis); den Zusatz im aria-Namen setzt Ä127 einheitlich (`../benennung`).
//   · Staatsvertrag/pdf-embed → same-origin gehostetes PDF (`extern=false`),
//     `download` erzwingt den Speicherdialog.
// A9-DoD: `<a>` ist tastaturfokussierbar, `lc-chip` trägt das 24px-Tap-Ziel
// (WCAG 2.2 §2.5.8); aria-label nennt Zweck + Fassungsdatum vollständig.
// B-6 (31.8.2026): der Vorbehalt im `title` sagte «amtliche Quelle», der Kopf
// zwei Zentimeter darüber «amtliche Fassung» — jetzt kommt beides aus derselben
// Wortquelle (`lib/benennung.ts`, Zählung 10:5 zugunsten «Fassung»).
export function AmtlichesPdf({ href, stand, extern, dateiname, aufgehoben }: {
  href: string;
  /** Versionsdatum (ISO) des PDF — ehrliche «Fassung vom …»-Angabe. */
  stand: string;
  /** true = amtliche Fremd-URL (neuer Tab); false = gehostetes same-origin-PDF. */
  extern: boolean;
  /** Nur same-origin: Dateiname für den Speicherdialog. */
  dateiname?: string;
  /** Der Erlass ist ganz aufgehoben: das PDF ist die letzte Fassung VOR der
   *  Aufhebung, nie «die geltende» (PA-9-B01/D01, §8). */
  aufgehoben?: boolean;
}) {
  const fassung = stand ? ` (Fassung vom ${formatiereDatum(stand)})` : '';
  // LM-045: kein `no-underline` mehr — als externer Link trägt der Chip in der
  // lc-chip-zeile die Unterstreichung als Form-Merkmal (Chip-Grammatik, index.css).
  return (
    <a
      href={href}
      {...(extern
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : { download: dateiname ?? true })}
      className="lc-chip hover:text-brass-700"
      aria-label={`Amtliches PDF${fassung} herunterladen${extern ? ` ${NEUER_TAB}` : ''}`}
      title={`${aufgehoben ? 'Amtliches PDF der letzten Fassung vor der Aufhebung' : 'Amtliches PDF der geltenden Fassung'} — ${MASSGEBLICH_HALBSATZ}`}
    >
      ⬇ Amtliches PDF{fassung}
    </a>
  );
}
