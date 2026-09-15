// ─── check:plan Regel 14 · Etappen-Buchung: Fahrplan-✅ ↔ ROADMAP-Checkbox ──────
//
// ANLASS (15.9.2026, Auftrag David «bereinige die Checkliste und überprüfe, warum
// es nicht abgehakt wurde»). Unter `W2·5m-LESER-V3` standen vier Checklisten-Posten
// offen, die seit dem 16./17./18.8.2026 gebaut waren — D0 (PR #534, `47f805423`),
// S1 (#547, `2538dd356`), S2 (#550, `afc008c19`) und die Kantons-Probe (H4-Kontakt-
// bogen 18.8.2026). Der Fahrplan führte S2 und S4 mit ✅, die ROADMAP führte
// dieselben Etappen mit `- [ ]`: ZWEI WAHRHEITEN über denselben Sachverhalt (§5),
// vier Wochen lang unbemerkt. Die Ursache war in jedem einzelnen Fall mechanisch
// sichtbar und für jedes bestehende Tor unsichtbar — genau die F2-Familie
// («Tor prüft den Container, nicht den Inhalt»): `check:plan` Regel 9/11 prüfte,
// DASS der Fahrplan existiert und der §-Anker auflöst, nie ob er dasselbe sagt
// wie die Checkbox daneben.
//
// REGEL. Für jeden Dach-Schritt mit `fahrplan:`-Feld: trägt eine eingerückte
// Checklisten-Zeile eine Etappen-Kennung (`- [ ] **S2 · …**`) und markiert der
// verlinkte Fahrplan dieselbe Kennung mit ✅ oder «VOLLZOGEN», ist die offene
// Checkbox ein Widerspruch ⇒ rot.
//
// RICHTUNG — bewusst EINSEITIG, und darum hier deklariert statt verschwiegen
// (§6.7: ein Tor, dessen Grenze man nicht kennt, wiegt in Sicherheit). Die
// Gegenrichtung (ROADMAP `[x]` ohne Fahrplan-✅) wird NICHT geprüft: Fahrpläne
// führen ihre Etappen-Tabellen unterschiedlich granular, ein abgehakter
// ROADMAP-Posten ohne Fahrplan-Zeile ist der Normalfall, kein Defekt. Die
// gefährliche Richtung ist die hier bewachte — gebaut und nicht gebucht —, weil
// nur sie eine Folge-Session Arbeit doppelt machen lässt (§17-Massstab).
//
// GEBURTSBEWEIS (§6.7). Rot gezeigt auf `e94a3dc90` (main, 15.9.2026) mit exakt
// zwei Treffern: `W2·5m-LESER-V3` Z. 116 [S2] und Z. 117 [S4]. D0 und S1 fand die
// Regel NICHT — der Fahrplan trägt für sie kein ✅ in Tabellenform; die Regel ist
// also eine Untergrenze, kein Vollständigkeitsbeweis.

export type BuchungsProblem = { id: string; meldung: string };

/** `  - [ ] **S2 · Titel**` → Einrückung, Box-Zustand, Etappen-Kennung. */
const ZEILE = /^\s+- \[( |x)\] \*\*([A-ZÄÖÜ]{1,3}-?\d{0,2}[a-z]?)\s·\s/;

/** `fahrplan: <pfad>` aus einem @meta-Kommentar. */
const META = /@meta id: (\S+)/;
const FAHRPLAN = /fahrplan: (\S+?)\s*(?:·|-->)/;

/**
 * Markiert der Fahrplan die Kennung als vollzogen? Gesucht wird `**S2**` gefolgt
 * von ✅ oder «VOLLZOGEN» innerhalb derselben Tabellenzelle (kein `|` dazwischen)
 * — so zählt ein ✅, das weiter hinten in der Zeile zu einer ANDEREN Aussage
 * gehört (etwa «Ä75 ✅» in der Nachweis-Spalte), nicht als Vollzug der Etappe.
 */
export function fahrplanVollzogen(fahrplanText: string, kennung: string): string | null {
  const esc = kennung.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`\\*\\*${esc}\\*\\*[^|\\n]{0,24}(?:✅|VOLLZOGEN)`).exec(fahrplanText);
  return m ? m[0] : null;
}

export function pruefeEtappenBuchung(md: string, leseDatei: (p: string) => string | null): BuchungsProblem[] {
  const probleme: BuchungsProblem[] = [];
  const zeilen = md.split(/\r?\n/);
  let id: string | null = null;
  let fahrplan: string | null = null;
  const cache = new Map<string, string | null>();

  for (let i = 0; i < zeilen.length; i++) {
    const z = zeilen[i];
    const meta = META.exec(z);
    if (meta) {
      id = meta[1];
      fahrplan = FAHRPLAN.exec(z)?.[1] ?? null;
      continue;
    }
    // Ein neuer Dach-Schritt (Checkbox auf Spalte 0) beendet den Geltungsbereich.
    if (/^- \[( |x)\]/.test(z)) { id = null; fahrplan = null; continue; }
    if (!id || !fahrplan) continue;

    const m = ZEILE.exec(z);
    if (!m || m[1] === 'x') continue;
    const kennung = m[2];
    if (!cache.has(fahrplan)) cache.set(fahrplan, leseDatei(fahrplan));
    const text = cache.get(fahrplan);
    if (!text) continue;
    const treffer = fahrplanVollzogen(text, kennung);
    if (treffer) {
      probleme.push({
        id,
        meldung:
          `ROADMAP.md:${i + 1} führt Etappe "${kennung}" als offen, ${fahrplan} markiert sie als vollzogen ` +
          `(«${treffer.trim()}») — zwei Wahrheiten (§5). Entweder abhaken (mit PR/SHA) oder die ` +
          `Fahrplan-Markierung zurücknehmen; ein Deckungsgleich-Vermerk gehört an BEIDE Stellen.`,
      });
    }
  }
  return probleme;
}
