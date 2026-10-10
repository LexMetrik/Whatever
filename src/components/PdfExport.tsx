import { useState } from 'react';
import type { PdfDocConfig } from '../lib/pdf/pdfModel';
import { FehlerBox } from './vorlagen/ui';
import { useBekannteFehler } from './bekannteFehlerKontext';
import { BEKANNTER_FEHLER_SATZ, BEKANNTER_FEHLER_TITEL, bekannterFehlerZeile } from '../lib/bekannteFehler';

// Schlanker Export-Button. Jeder Rechner liefert seine PdfDocConfig (Titel,
// Domäne, Eingaben, Ergebnisse, einschlägige Normen, Disclaimer); gerendert
// wird zentral in src/lib/pdf/. Der Renderer (inkl. jsPDF) wird erst beim
// Klick dynamisch geladen – hält das Haupt-Bundle klein.

export function PdfExportButton({ config }: { config: PdfDocConfig }) {
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  // WARNHINWEIS: bekannte Fehler des Werkzeugs (Rahmen der Seite) gehen ins PDF —
  // dieselbe Quelle wie der Ergebnisblock (§5/§8). Ohne Rahmen: config unverändert.
  const bekannte = useBekannteFehler();
  if (config.sections.length === 0) return null;
  // Async-Klick mit try/catch: scheitert das Nachladen des Renderers oder die
  // PDF-Erzeugung, erscheint eine sichtbare Meldung statt einer stillen
  // Unhandled Rejection. Während des Nachladens/Erzeugens hält `laedt` den
  // Button disabled (aria-busy) und verhindert Mehrfachklicks (§13/F4).
  const onClick = async () => {
    if (laedt) return;
    setFehler(null);
    setLaedt(true);
    try {
      const { exportPdf } = await import('../lib/pdf/pdfRender');
      exportPdf(bekannte.length > 0
        ? { ...config, bekannteFehler: { titel: BEKANNTER_FEHLER_TITEL, eintraege: [BEKANNTER_FEHLER_SATZ, ...bekannte.map(bekannterFehlerZeile)] } }
        : config);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Der PDF-Export ist fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setLaedt(false);
    }
  };
  return (
    <div className="space-y-3">
      <button type="button" onClick={onClick} disabled={laedt} aria-busy={laedt} className="lc-btn-primary gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        {laedt ? 'PDF wird erstellt …' : 'PDF-Rechenbericht'}
      </button>
      {fehler && <FehlerBox fehler={[fehler]} />}
    </div>
  );
}
