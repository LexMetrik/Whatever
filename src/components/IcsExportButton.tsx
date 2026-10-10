import { useLocation } from 'react-router-dom';
import { icsFuerFrist } from '../lib/icsExport';
import { ladeIcs } from './icsDownload';
import { useBekannteFehler } from './bekannteFehlerKontext';
import { bekannteFehlerTextblock } from '../lib/bekannteFehler';

// ─── «In Kalender (.ics)»-Button — geteilter Baustein (FAHRPLAN-PRAXIS 1.1) ─
// Kapselt den clientseitigen Download (geteilt: components/icsDownload.ts);
// der Inhalt kommt deterministisch aus lib/icsExport.ts. Reine Darstellung (§3).
// Beschriftungs-Überarbeitung 7.6.2026: Aktenzeichen und Permalink-Query
// (dieselbe Kodierung wie der LinkTeilenButton, §5) wandern in den Eintrag.

export function IcsExportButton({ titel, endISO, beschreibung, aktenzeichen, query, vorfristTage = 3, dateiName = 'Fristende.ics', className = 'lc-btn-outline' }: {
  titel: string;
  /** Fristende als yyyy-MM-dd — der Button rendert nur bei gültigem Wert. */
  endISO: string | undefined | null;
  beschreibung?: string;
  /** Mandats-Referenz (AktenzeichenFeld) — erscheint in Titel/Beschreibung/UID. */
  aktenzeichen?: string;
  /** Permalink-Query wie beim LinkTeilenButton («?a=…») — der Eintrag verlinkt zurück auf die Berechnung. */
  query?: () => string;
  /** Vorfrist-Alarm in Tagen (0 = keiner). Default 3. */
  vorfristTage?: number;
  dateiName?: string;
  className?: string;
}) {
  const { pathname, hash } = useLocation();
  // WARNHINWEIS: ein Kalendereintrag mit möglicherweise falschem Datum trägt den Hinweis mit (§8).
  const fehler = useBekannteFehler();
  if (!endISO || !/^\d{4}-\d{2}-\d{2}$/.test(endISO)) return null;
  const mitHinweis = fehler.length ? [...bekannteFehlerTextblock(fehler), beschreibung ?? ''].join('\n') : beschreibung;
  const laden = () => ladeIcs(dateiName, icsFuerFrist({
    titel, endISO, beschreibung: mitHinweis, vorfristTage,
    aktenzeichen: aktenzeichen?.trim() || undefined,
    // Hash MITFÜHREN wie der LinkTeilenButton (Tab-/Rechtsweg-Weiche).
    url: query ? `${location.origin}${pathname}${query()}${hash}` : undefined,
  }));
  return (
    <button type="button" className={className} onClick={laden}>
      In Kalender (.ics)
    </button>
  );
}
