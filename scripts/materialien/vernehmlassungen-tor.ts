// scripts/materialien/vernehmlassungen-tor.ts — reine Prüf-Logik für die
// Vernehmlassungs-Tore (§17-Wurzelfix PR #803 + Gegenprüfungs-Auflagen A1–A3).
//
// Getrennt von den vite-node-Entries (check-materialien.ts,
// check-vernehmlassungen-alter.ts), damit Unit-Tests sie ohne den ganzen Lauf
// importieren können — dasselbe Muster wie wortfeld.ts für check-materialien.ts
// (siehe dessen Schlusskommentar).
//
// K7-Entscheid (Gegenprüfung PR #803, Auflage A1): Finding 7 (deterministisch,
// vergleicht nur gegen den committeten `stand`) bleibt in check-materialien.ts —
// es ist NICHT wanduhr-abhängig. Der Alterungs-Wächter (liest `heute`) ist es
// SEHR wohl und lebt darum NICHT dort, sondern ausschliesslich im eigenen,
// standalone Tor `check:vernehmlassungen-alter` (check-vernehmlassungen-alter.ts).
// Grund: check-materialien.ts wird von mehreren, fachlich UNVERWANDTEN Jobs beim
// Namen aufgerufen (z. B. normen-monitor.yml Job `bs-grossrat`: "check:bs-materialien
// && check:materialien", NUR diese zwei Skripte — nicht die volle check:seriell-Kette).
// Ein wanduhr-abhängiger Alterungs-Fehler dort würde bei jedem Lauf, in dem die
// Vernehmlassungen zufällig zu alt sind, den BS-Grossrat-Job VOR dessen eigenem
// PR-Schritt töten — exakt das K7-Muster («ein ablaufender Registertermin färbt
// sonst alle offenen PRs rot», scripts/check-tor-paritaet.ts ALLOWLIST
// 'check:verfall'). Der neue Tor ist bewusst NICHT Teil von check:seriell (auch
// fedlex-frische.yml fährt sonst via `npm run check` die volle Kette und würde
// wieder an einem fachfremden Befund scheitern) — sein einziger Aufrufer ist der
// wöchentliche Detektor in normen-monitor.yml (Job `normen`, direkt nach
// `check:verfall`, `if: always()` — derselbe etablierte K7-Platz).

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

/** Minimalwert eines Feldes, ISO-gefiltert (robust gegen kaputte Einzelwerte). */
export function minimum(werte: readonly string[]): string | undefined {
  let min: string | undefined;
  for (const w of werte) {
    if (!ISO_DATUM.test(w)) continue;
    if (min === undefined || w < min) min = w;
  }
  return min;
}

/**
 * Alterungs-Wächter: das Erhebungsdatum ist älter als `maxTage` ⇒ Fehler.
 *
 * Auflage A3 (Gegenprüfung PR #803): `erhebung === undefined` (keine
 * BUND/vernehmlassung-Einträge im Register) ist SELBST ein Fehler — kein
 * stiller Skip. Ein Register ohne jede Vernehmlassung ist entweder nie
 * generiert worden oder wurde leergeräumt; beides ist meldenswert.
 *
 * Auflage A2: `heute`/`erhebung` mit ungültigem Datum ⇒ Fehler statt eines
 * stillen `NaN > maxTage === false`, das den ganzen Wächter abschaltet.
 */
export function alterungsFehler(
  erhebung: string | undefined,
  heute: string,
  maxTage: number,
): string | null {
  if (erhebung === undefined) {
    return 'Vernehmlassungs-Register: keine BUND/vernehmlassung-Einträge gefunden — '
      + 'Erhebungsdatum unbestimmbar (Generator nie gelaufen oder Register leer, Datenfehler statt stiller Skip).';
  }
  const heuteMs = Date.parse(heute);
  const erhebungMs = Date.parse(erhebung);
  if (!Number.isFinite(heuteMs) || !Number.isFinite(erhebungMs)) {
    return `Vernehmlassungs-Register: Alterungs-Prüfung nicht auswertbar (heute=${JSON.stringify(heute)}, `
      + `stand=${JSON.stringify(erhebung)} — ungültiges Datum, kein stiller Skip, §A2).`;
  }
  const alterTage = Math.round((heuteMs - erhebungMs) / 86_400_000);
  if (alterTage > maxTage) {
    return `Vernehmlassungs-Register: Erhebungsdatum (stand) ${erhebung} ist ${alterTage} Tage alt `
      + `(> ${maxTage}) — Nachführung fällig (materialien:vernehmlassungen).`;
  }
  return null;
}
