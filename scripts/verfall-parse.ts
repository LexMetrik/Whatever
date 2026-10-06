// ─── Verfalls-Register: reiner Parser (geteilte Quelle, §5) ────────────────────
//
// EINE Parse-Quelle für beide Verbraucher:
//   • scripts/verfall-pruefen.ts      (check:verfall — Deploy-Tor)
//   • scripts/verfall-generieren.ts   (gen:verfall — UI-Datenmodul)
//
// Damit lebt die Datums-Grammatik des Registers genau einmal (§5). Die Funktionen
// sind PUR (kein IO, kein Date.now()): gleiche Eingabe → gleiche Ausgabe. Den
// Tagesbezug (verfallen/fällig) bilden die Verbraucher selbst, nicht dieser Parser.
//
// Datums-Grammatik der Spalte «Nächste Prüfung» bzw. «bis DD.MM.YYYY»-Freitext:
//   «1.11.2026 (BE!)»        → exakter Tag
//   «Anfang Sept. 2026»      → 1. des Monats
//   «Jan. 2027» / «Juni 2027»→ 1. des Monats
//   «—», «offen …», «bei …», «vor …», «mit …», «nach …» → manuell (nie geprüft)

const MONATE: Record<string, number> = {
  jan: 1, feb: 2, maerz: 3, 'märz': 3, mar: 3, apr: 4, mai: 5,
  jun: 6, juni: 6, jul: 7, juli: 7, aug: 8, sep: 9, sept: 9,
  okt: 10, nov: 11, dez: 12,
};

/** Vorlauf in Tagen: ab hier gilt ein Termin als «bald fällig» (check:verfall-Warnung,
 *  Verfall-Erinnerung). Spiegel für die UI-Anzeige: src/components/VerfallUebersicht.tsx. */
export const VORLAUF_TAGE = 45;

export type Termin = {
  label: string;
  datum: string; // ISO «YYYY-MM-DD», als String vergleichbar
  quelle: 'Tabelle' | 'Freitext';
  fundstelle?: string;
  wert?: string;
  rhythmus?: string;
};

/** «7.6.2026» → «2026-06-07» (ISO, vergleichbar als String). */
export function iso(j: number, m: number, t: number): string {
  return `${j}-${String(m).padStart(2, '0')}-${String(t).padStart(2, '0')}`;
}

/** Extrahiert den FRÜHESTEN parsbaren Termin aus einer Zelle (oder null). */
export function parseZelle(zelle: string): string | null {
  const treffer: string[] = [];
  // Form 1: exakter Tag «1.11.2026» (auch fett/mit Zusatz)
  for (const m of zelle.matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g)) {
    treffer.push(iso(Number(m[3]), Number(m[2]), Number(m[1])));
  }
  // Form 2: Monatsname + Jahr («Anfang Sept. 2026», «Jan. 2027», «Juni 2027»)
  for (const m of zelle.matchAll(/\b([A-Za-zÄÖÜäöü]{3,9})\.?\s+(\d{4})\b/g)) {
    const monat = MONATE[m[1].toLowerCase()];
    if (monat) treffer.push(iso(Number(m[2]), monat, 1));
  }
  if (treffer.length === 0) return null;
  treffer.sort();
  return treffer[0];
}

/** Liest die Register-Markdown und sammelt terminierte + manuelle Einträge. */
export function sammleTermine(md: string): { termine: Termin[]; manuell: string[] } {
  const termine: Termin[] = [];
  const manuell: string[] = [];
  const zeilen = md.split('\n');
  const sauber = (s: string) => s.replace(/\*\*/g, '').trim();

  for (const zeile of zeilen) {
    // ── Register-Tabelle: | Parameter | Fundstelle | Wert/Stand | Rhythmus | Nächste Prüfung |
    if (zeile.startsWith('|') && !zeile.startsWith('|---') && !zeile.includes('Nächste Prüfung')) {
      const spalten = zeile.split('|').map((s) => s.trim()).filter((s, i, a) => !(s === '' && (i === 0 || i === a.length - 1)));
      if (spalten.length < 5) continue;
      const label = sauber(spalten[0]);
      const zelle = spalten[spalten.length - 1];
      const datum = parseZelle(zelle);
      if (datum) {
        termine.push({
          label,
          datum,
          quelle: 'Tabelle',
          fundstelle: sauber(spalten[1]),
          wert: sauber(spalten[2]),
          rhythmus: sauber(spalten[3]),
        });
      } else {
        manuell.push(`${label} («${zelle}»)`);
      }
      continue;
    }
    // ── Freitext-Blöcke: «… BIS 30.6.2026 …» → Prüfung ist ab diesem Tag fällig
    const bis = zeile.match(/\bbis\s+(?:zum\s+)?\*{0,2}(\d{1,2})\.(\d{1,2})\.(\d{4})/i);
    if (bis && !zeile.startsWith('|')) {
      // Vollständiges Label (UI). Die CLI kürzt freitext-Labels beim Druck auf 70.
      const label = zeile.replace(/^[-*\s]+/, '').replace(/\*\*/g, '').trim();
      termine.push({ label, datum: iso(Number(bis[3]), Number(bis[2]), Number(bis[1])), quelle: 'Freitext' });
    }
  }
  return { termine, manuell };
}

/** Liest das Datum aus «Stand des Registers: 7.6.2026 …» (oder null). */
export function registerStand(md: string): string | null {
  const m = md.match(/Stand des Registers:\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
  return m ? m[1] : null;
}
