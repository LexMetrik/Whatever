// scripts/materialien/vernehmlassungen-tor.ts — reine Prüf-Logik für die
// Vernehmlassungs-Tore (§17-Wurzelfix PR #803 + Gegenprüfungs-Auflagen A1–A3).
//
// Getrennt vom vite-node-Entry check-materialien.ts, damit Unit-Tests die Logik ohne
// den ganzen Lauf importieren können — dasselbe Muster wie wortfeld.ts.
//
// Finding 7 ist deterministisch (vergleicht nur gegen den committeten `stand`, nie gegen
// die Wanduhr). Den früheren wanduhr-abhängigen Alterungs-Wächter
// (`check:vernehmlassungen-alter`) hat der Monitor-Rückbau 5.10.2026 gestrichen
// (Entscheid David: nur Gesetzestext färbt rot; der Wächter fand nie einen echten
// Befund). Frisch gehalten wird der Erhebungsstand vom Monatslauf
// (normen-monatslauf.yml, Job `vernehmlassungen`); `check:vernehmlassungen-netz`
// berichtet Abweichungen im Wochen-Bericht des Normen-Monitors.

export const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `--datum=YYYY-MM-DD` aus argv lesen. Auflage A2 (Gegenprüfung PR #803):
 * `Date.parse('kaputt')` liefert NaN und hätte Alterungs- UND Zukunfts-Check
 * still abgeschaltet (`--datum=kaputt` lieferte vorher OK/exit 0) — ein
 * ungültiges Format ist darum ein HARTER Fehler (wirft), nie ein stiller
 * Fallback auf "kein Override". Kein Argument ⇒ `undefined` (legitim: Aufrufer
 * fällt auf die Wanduhr zurück, wo das überhaupt erlaubt ist, §2).
 */
export function parseDatumArg(argv: readonly string[]): string | undefined {
  const arg = argv.find((a) => a.startsWith('--datum='));
  if (arg === undefined) return undefined;
  const wert = arg.slice('--datum='.length);
  if (!ISO_DATUM.test(wert)) {
    throw new Error(`--datum=${wert} ist kein gültiges ISO-Datum (YYYY-MM-DD erwartet).`);
  }
  return wert;
}

/**
 * Finding 7 (deterministisch, §17-Wurzelfix PR #803): 'laufend' mit fristEnde
 * VOR dem Erhebungsdatum (`stand`, vom Generator geschrieben) ist ein
 * Datenfehler zum Erhebungszeitpunkt — die Quelle zeigte damals schon eine
 * abgelaufene Frist ohne Status-Wechsel. Ein Ablauf NACH der Erhebung
 * (fristEnde ≥ stand) ist reines Kalender-Altern, kein Fehler (dafür der
 * separate Alterungs-Wächter). Kein heute/Date.now — nur committete Werte.
 */
export function finding7Fehler(
  key: string,
  status: string,
  fristEnde: string | undefined,
  stand: string,
): string | null {
  if (status === 'laufend' && fristEnde && fristEnde < stand) {
    return `${key}: Status 'laufend', aber fristEnde ${fristEnde} < Erhebungsdatum (stand) ${stand} — `
      + `Konsistenz-Verstoss (Finding 7, Datenfehler zum Erhebungszeitpunkt). Neu generieren (materialien:vernehmlassungen).`;
  }
  return null;
}
