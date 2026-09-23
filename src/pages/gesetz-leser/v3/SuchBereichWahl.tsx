import type { SuchBereich } from '../leserSuche';

// ─── Suchbereich — vier Werte, EINE Zeile (Kap. 4b, Pos. 5) ─────────────────
//
// «Wo soll gesucht werden?» ist im Gesetz eine echte Frage: wer «Kosten» in der
// StPO sucht, will je nach Absicht die Bestimmungen ÜBER Kosten (Randtitel und
// Gliederung) oder jede Stelle, an der das Wort im Wortlaut steht. Ohne diese
// Wahl liefert der Fliesstext den Titeltreffer unter Hunderten begraben.
//
// SEGMENT STATT DROPDOWN: vier Werte, alle gleich wichtig, ständig im Zugriff —
// ein Dropdown versteckte den Zustand hinter einem Klick, und der Zustand ist
// hier die halbe Aussage der Trefferliste (§8). Vier kurze Wörter passen auch in
// die 15-rem-Leiste; die Prüfung darauf ist `leser-v3-suchbereich`.
//
// `radiogroup` statt einer Knopfreihe: genau EIN Wert ist gewählt, und die
// W3C-ARIA-APG kennt dafür das Radio-Muster mit Pfeiltasten-Navigation. Eine
// Reihe aus `<button aria-pressed>` wäre eine Mehrfachwahl-Zusage, die hier
// falsch ist.

/**
 * Beschriftungen — kurz, weil sie nebeneinander in einer schmalen Spalte stehen.
 *
 * ── Ä120 (Live-Ästhetik-Prüfung 18.8.2026) · «TITEL» KOLLIDIERTE ────────────
 * GEMESSEN am Live-Stand: der Schalter «Titel» stand unmittelbar über einem
 * Trefferlisten-Zwischenkopf «2. TITEL» — dasselbe Wort, zwei Bedeutungen, acht
 * Pixel auseinander. «Titel» ist im Gesetz eine GLIEDERUNGSSTUFE (Teil › Titel ›
 * Abschnitt); der Schalter meint aber jede Überschrift, den Randtitel des
 * einzelnen Artikels eingeschlossen (`lang` sagt das seit je). «Überschriften»
 * benennt genau diese Menge und ist im Erlass kein Fachbegriff für eine Stufe —
 * Glossar «Suchbereich → Alles · Überschriften · Text · Fussnoten».
 *
 * DAS SEGMENT TRÄGT DAS WORT: die Reihe ist `flex-wrap` mit `flex-1` je Knopf
 * und auf `min(100%, 18rem)` gedeckelt (Ä84) — «Überschriften» ist vier Zeichen
 * länger als das bisher längste «Fussnoten» und bricht im engsten Fall in eine
 * zweite Segment-Zeile, statt die Beschriftung zu kappen. Das ist dieselbe
 * Entscheidung wie in der Trefferliste darunter (§8: umbrechen, nie
 * anschneiden), und die Zone existiert ohnehin nur während einer Suche.
 */
const LABEL: Record<SuchBereich, { kurz: string; lang: string }> = {
  alles: { kurz: 'Alles', lang: 'Im ganzen Erlass suchen' },
  titel: { kurz: 'Überschriften', lang: 'Nur in Randtiteln und Gliederungstiteln suchen' },
  text: { kurz: 'Text', lang: 'Nur im Wortlaut suchen (mit Tabellen)' },
  fussnoten: { kurz: 'Fussnoten', lang: 'Nur im Fussnoten-Apparat suchen' },
};

const REIHE: SuchBereich[] = ['alles', 'titel', 'text', 'fussnoten'];

export function SuchBereichWahl({
  wert, setzeWert,
}: {
  wert: SuchBereich;
  setzeWert: (b: SuchBereich) => void;
}) {
  return (
    // ── Ä84 (Ästhetik-Prüfer 17.8.2026) · DAS SEGMENT WÄCHST NICHT MIT ────────
    // Das Segment ist für die 18-rem-Leiste kalibriert (vier kurze Wörter, je
    // `flex-1`). Ohne Deckel dehnt es sich auf die Breite seines Behälters —
    // gemessen 17.8.2026 an der StPO mit «Entschädigung»:
    //
    //   D-Blatt @1440 (Blatt am Feld, `w-72`)   270 px   ← die kalibrierte Breite
    //   H-Blatt @390  (Bottom-Sheet)            358 px
    //   Split/Sheet @720                        688 px   ← 2,5 × so breit
    //
    // Vier Schalter über 688 px sind keine Werkzeugzeile mehr: die Trefferliste
    // darunter bleibt schmal, und das Segment liest sich als Reiter-Leiste einer
    // Zone, die es nicht gibt. `min(100%, 18rem)` gibt allen drei Blättern
    // DASSELBE Raster und lässt das schmalste unangetastet — der Deckel greift
    // erst, wo mehr Platz da ist als die Kalibrierung braucht.
    //
    // Ä94 (18.8.2026) rügte den Rest dieser Rechnung: im H-Blatt blieben rechts
    // 358 − 288 = 70 px Stummel. Der Deckel ist deswegen NICHT gelockert worden —
    // seine Messung oben gilt unverändert, und 18 rem ist die Breite, für die die
    // vier Wörter kalibriert sind. Gefüllt wird der Stummel stattdessen von
    // «↑ Anfang» (62 px), das über dieser Zeile allein in einer eigenen
    // 34-px-Leiste stand: 288 + 8 Fuge + 62 = 358, exakt der Kasten. Ein Befund
    // hat den anderen aufgelöst — Herleitung stand in `v3/anfangSlot.ts` (seit
    // D38 unbesetzt; Knopf-Empfang hier mit W2·29 S4 zurückgebaut, die Datei
    // mit S3 gelöscht, Wortlaut in der Versionsgeschichte).
    <div data-v3-suchbereich role="radiogroup" aria-label="Suchbereich"
      className="flex w-[min(100%,18rem)] flex-wrap items-center gap-0.5 border border-line bg-well p-0.5">
      {REIHE.map((b) => {
        const aktiv = wert === b;
        return (
          <button key={b} type="button" role="radio" aria-checked={aktiv}
            data-v3-bereich={b} data-v3-bereich-aktiv={aktiv ? '1' : undefined}
            title={LABEL[b].lang}
            onClick={() => setzeWert(b)}
            // `min-h-8` statt der 44 px der Sprung-Knöpfe: dies ist ein
            // Filter-Segment in einer Werkzeugzeile, kein Sprungziel im
            // Lesefluss — dieselbe Einordnung wie «alles auf/zu» daneben, das
            // ebenfalls auf Leisten-Höhe sitzt (`lc-leiste-griff`).
            // W2·29 S4 (Werkbank): eckiges Segment, gewählt = Papier + halbfett.
            className={`min-h-8 flex-1 px-1.5 py-1 text-micro transition-colors ${
              aktiv ? 'bg-paper font-semibold text-ink-900' : 'text-ink-600 hover:text-ink-900'
            }`}>
            {LABEL[b].kurz}
          </button>
        );
      })}
    </div>
  );
}
