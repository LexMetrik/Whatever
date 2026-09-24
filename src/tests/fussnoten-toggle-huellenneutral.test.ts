/**
 * Die Fussnoten-Weiche der Ansicht — hüllenneutrale CSS-Regel
 * (`.lc-leser`-Scope, kein React-Zweig im Artikel-Baum).
 *
 * ANLASS (Treuebruch 16.8.2026, gemessen, PR #539 / Stand 5e90082e3): Die Regel
 * suchte den Fussnoten-MARKER über seinen ACCESSIBLE NAME
 * (`button[aria-label^="Fussnote"]`) und traf damit in V3 auch den SCHALTER im
 * Ansicht-Menü («Fussnoten (283)») — er blendete sich selbst aus. Der Fix
 * verengte den Selektor damals auf `#lc-lesespalte`. Gemessen an der damaligen
 * Ist-Hülle (BGBM, localhost-Preview, inzwischen mit H5 gelöscht): 4 von 29
 * Marker-Buttons lagen AUSSERHALB `#lc-lesespalte` (Erlasskopf/Ingress) — die
 * Verengung schaltete dort still ab und verletzte die damalige Zusage FL-4
 * (ohne Flag bitgleich).
 *
 * WURZEL-FIX: Der Marker trägt eine eigene Kennung `data-fn-ref`
 * (`src/components/normtext/ArtikelBody.tsx`); die CSS-Regel greift darüber und
 * gar nicht mehr über Text. Der Schalter trägt die Kennung nicht.
 *
 * ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ─────────────────────
 * Der bewachte Regelblock hiess bis 7.9.2026 `html[data-fussnoten="aus"]`. Ihn
 * gibt es nicht mehr: die Ansicht trägt seither EINE dreiwertige Wahl
 * (`html[data-vermerke]`), und keine ihrer Stellungen blendet den amtlichen
 * Apparat als GANZES aus (verlustfrei). Die Zahlen und der Anlass oben bleiben
 * unverändert stehen (§0 Ziff. 2b) — bewacht wird jetzt die Regel, die an ihre
 * Stelle getreten ist, und zusätzlich H0-Auflage 1: `A` ist die EINZIGE
 * Fussnoten-Klasse, die eine Ansicht dämpfen darf.
 *
 * Dieses Tor hält den Mechanismus fest, der ursprünglich bis zur CI unbemerkt
 * blieb — es ist billiger als ein zweites e2e.
 *
 * ── §6.3-DEKLARATION (W2·26/Z8, Mandat David 11.9.2026) ────────────────────
 * Wörtlich: «Fussnoten, die z. B. nur eine SR-Nummer enthalten, müssen ebenfalls
 * weg sein, wenn Fussnoten abgewählt sind.» Die Stellungen «Fassung» und «aus»
 * nehmen den Apparat seither als GANZES — klassenblind, über `[data-fn-ref]`,
 * `[data-fn-marker]`, `[data-fn-apparat]` (Nullprobe und Herleitung am
 * Regelblock in `src/index.css`). Das ist eine FACHLICHE Änderung an der
 * D35-F3-Verlustfreiheit, nicht ein Refactoring, und darum ändert sich dieses
 * Tor mit.
 *
 * ZWEI ANPASSUNGEN, beide verschärfend:
 *   · ANKER ist jetzt der erste Selektor des neuen Blocks (`[data-fn-ref]`).
 *   · H0-Auflage 1 wird STRENGER geprüft: bisher durfte `A` als einzige Klasse
 *     gedämpft werden, jetzt darf es KEINE — kein Selektor dieser Datei nennt
 *     noch eine `kl`-Klasse. Genau das ist die Zusage «der Schalter fasst den
 *     Apparat als Ganzes oder gar nicht», und sie ist maschinell prüfbar.
 * Die Sätze und Zahlen darüber bleiben unverändert stehen (§0 Ziff. 2b).
 *
 * ROT ZU BEKOMMEN (§6.7, gefahren 11.9.2026): in `src/index.css` `.lc-leser `
 * aus einem der Selektoren streichen (Fall 3), `[data-fn-klasse="A"]` in den
 * Block schreiben (Fall 5) oder `data-fn-ref` aus `ArtikelBody.tsx` entfernen
 * (Fall 4).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const cssRoh = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8');
/**
 * W2·26 · NUR DIE REGELN, NICHT DIE HERLEITUNGEN.
 *
 * `src/index.css` trägt die datierten Belege der abgelösten Stände im Kommentar
 * (§0 Ziff. 2b: ergänzt, nie nachgeführt) — und die NENNEN die alten Selektoren
 * beim Namen, `[data-fn-klasse="A"]` eingeschlossen. Eine Textsuche über die
 * ganze Datei liest diese Sätze als Regeln und meldet einen Bruch, den es nicht
 * gibt; umgekehrt könnte ein auskommentierter Selektor ein echtes Tor grün
 * halten. Geprüft wird darum, was der Browser sieht: die Datei ohne Kommentare.
 */
const css = cssRoh.replace(/\/\*[\s\S]*?\*\//g, '');
const artikelBody = readFileSync(
  fileURLToPath(new URL('../components/normtext/ArtikelBody.tsx', import.meta.url)),
  'utf8',
);

/** Anker: der erste ECHTE Selektor der Dämpfungs-Regel (nicht ihr Kommentar).
 *  §6.3-DEKLARATION (S6 W1f, 24.9.2026): die Stellung «fassung» ist gefallen
 *  (Entscheid David 24.9.2026, Funktionszeile aufgelöst; `data-vermerke` ist
 *  zweiwertig). Der erste Selektor des Blocks ist damit der der Stellung
 *  «aus» — derselbe Block, dieselben Zusagen; nur der Anker rückt nach. */
const ANKER = 'html[data-vermerke="aus"] .lc-leser [data-fn-ref]';

/** Die Selektor-Liste des Dämpfungs-Blocks (bis zur öffnenden `{`). */
function daempfSelektoren(): string[] {
  const start = css.indexOf(ANKER);
  expect(start, `Regelblock ${ANKER} fehlt in src/index.css`).toBeGreaterThan(-1);
  const ende = css.indexOf('{', start);
  expect(ende).toBeGreaterThan(start);
  return css
    .slice(start, ende)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

describe('Die Ansicht-Weiche dämpft hüllenneutral und ohne Klassen-Ansehen', () => {
  it('kein Selektor sucht den Marker über seinen accessible name (aria-label)', () => {
    const ueberText = daempfSelektoren().filter((s) => s.includes('aria-label'));
    expect(
      ueberText,
      'CSS darf Elemente nicht über ihren Text suchen — sonst trifft die Regel den Schalter mit',
    ).toEqual([]);
  });

  it('kein Selektor ist auf einen hüllen-spezifischen Wrapper gescopt', () => {
    // `.lc-leser` ist der einzige Wurzelknoten, den BEIDE Hüllen tragen.
    // `#lc-lesespalte` gibt es zwar in beiden, aber Erlasskopf/Ingress liegen
    // ausserhalb davon — ein Scope darauf verliert Marker (gemessen: 4/29 BGBM).
    const engeScopes = daempfSelektoren().filter((s) => s.includes('#lc-lesespalte'));
    expect(
      engeScopes,
      'Erlasskopf/Ingress liegen ausserhalb #lc-lesespalte — dort schaltet die Weiche sonst nicht',
    ).toEqual([]);
  });

  it('jeder Selektor ist auf .lc-leser gescopt (nur der Gesetzes-Reader, nie das Norm-Popover)', () => {
    for (const s of daempfSelektoren()) {
      expect(s, `Selektor ohne .lc-leser-Scope: ${s}`).toContain('.lc-leser ');
    }
  });

  it('die Marker-Kennung data-fn-ref bleibt gesetzt (der Wurzel-Fix von 16.8.2026)', () => {
    // Sie trägt seit D35-F3 keine Dämpfungs-Regel mehr — sie ist der NACHWEIS,
    // dass der Marker eine eigene, textfreie Kennung hat, an der eine künftige
    // Regel ansetzen kann, ohne wieder über den Accessible Name zu greifen.
    expect(artikelBody, 'ArtikelBody setzt data-fn-ref nicht mehr').toMatch(/data-fn-ref\b/);
  });

  it('H0-Auflage 1 (W2·26 verschärft): KEINE Regel dämpft nach Fussnoten-Klasse', () => {
    // Bis W2·26 stand hier «keine ANDERE Klasse als A». Seit Z8 fasst die Wahl
    // den Apparat als Ganzes; eine klassen-selektive Regel wäre damit die zweite
    // Weiche neben der einen (§5) — und genau die Bauart, aus der Ä68 den
    // versteckten zweiten Fussnoten-Schalter gemacht hat. `A` steht deshalb
    // jetzt mit in der Liste.
    // `includes` statt `not.toContain(css)`: der Diff einer 4100-Zeilen-Datei
    // im Fehlerbild ist unlesbar (und teuer) — der Satz sagt alles (T5).
    for (const kl of ['A', 'V', 'G', 'Z', 'U']) {
      expect(
        css.includes(`[data-fn-klasse="${kl}"]`),
        `src/index.css selektiert [data-fn-klasse="${kl}"] — H0-Auflage 1 verletzt`,
      ).toBe(false);
    }
  });

  it('die Menü-Bausteine tragen die Marker-Kennung nicht (sonst blenden sie sich selbst aus)', () => {
    // `LeserAnsichtMenu.tsx` (Ist-Hülle) gelöscht 21.8.2026 (H5).
    for (const datei of [
      '../pages/gesetz-leser/v3/LeserAnsichtV3.tsx',
      '../pages/gesetz-leser/v3/LeserAenderungsWahl.tsx',
    ]) {
      const quelle = readFileSync(fileURLToPath(new URL(datei, import.meta.url)), 'utf8');
      expect(quelle, `${datei} trägt data-fn-ref — die Wahl blendet sich selbst aus`).not.toMatch(
        /data-fn-ref\b/,
      );
      expect(quelle, `${datei} trägt data-fn-klasse — die Wahl blendet sich selbst aus`).not.toMatch(
        /data-fn-klasse\b/,
      );
    }
  });
});
