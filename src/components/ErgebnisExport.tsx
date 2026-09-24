import type { ComponentProps, ReactNode } from 'react';
import type { PdfDocConfig } from '../lib/pdf/pdfModel';
import { AktenzeichenFeld } from './AktenzeichenFeld';
import { PdfExportButton } from './PdfExport';
import { IcsExportButton } from './IcsExportButton';
import { LinkTeilenButton } from './LinkTeilenButton';

// ─── Export-Zeile der Rechner (DESIGN-REGLEMENT §R-5, W2·29-WERKBANK-RECHNER R3) ──
// Aktenzeichen → PDF → ICS (0..n) → Teilen in fester Reihenfolge. Reine Darstellung
// (§3): alle Fachwerte kommen fertig vom Formular; der Rahmen reicht nur
// Aktenzeichen und Query an die ICS-Knöpfe weiter. `children` folgt nach «Teilen».
// Das Aktenzeichen-Feld steht nur, wenn es in PDF oder Kalender einfliesst (R5a).
type IcsEintrag = Omit<ComponentProps<typeof IcsExportButton>, 'aktenzeichen' | 'query' | 'className'>;

export function ErgebnisExport({ aktenzeichen, onAktenzeichen, pdf, ics = [], query, children }: {
  aktenzeichen: string;
  onAktenzeichen: (v: string) => void;
  pdf?: PdfDocConfig | null;
  ics?: IcsEintrag[];
  query?: () => string;
  children?: ReactNode;
}) {
  return (
    <>
      {(pdf || ics.length > 0) && <AktenzeichenFeld value={aktenzeichen} onChange={onAktenzeichen} />}
      <div className="flex flex-wrap items-center gap-3">
        {pdf && <PdfExportButton config={pdf} />}
        {ics.map((e, i) => <IcsExportButton key={i} {...e} aktenzeichen={aktenzeichen} query={query} />)}
        {query && <LinkTeilenButton query={query} />}
        {children}
      </div>
    </>
  );
}
