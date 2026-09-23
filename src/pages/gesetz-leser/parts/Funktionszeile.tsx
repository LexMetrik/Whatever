import { useId, useRef, useState, type ReactNode } from 'react';

// ═══ DIE FUNKTIONSZEILE AM ARTIKELENDE (Inventar 2.3.9) ═══════════════════════
//
//     Gilt seit 1.1.2023 › · 11 Entscheide › · 2 Materialien › · 6 Verweise ›
//                                           Zitat · Link · Amtliche Fassung ↗
//
// Links die Rubriken DIESES Artikels mit ihren Zahlen, rechts seine Aktionen
// (`./ArtikelAktionen.tsx`). Die Regeln, je mit ihrem Entscheid — die volle
// Herleitung steht in der Versionsgeschichte dieser Datei (D34/D35/D40/W2·26;
// bis W2·26 hiess sie `BezuegeKopf.tsx`) und in
// `abnahme/design-identitaet/D35-F1-FUSSZEILE.md`:
//
// · JE RUBRIK EIN GRIFF (`<button>`, D35-F1, David 7.9.2026: «nur auf klick
//   aufklappbar»): Enter/Space, Fokus und `aria-expanded` kommen vom Browser.
// · AKKORDEON (W2·26/Z4, 11.9.2026): höchstens EINE Rubrik offen — der Zustand
//   ist `reg | null` und kann die Regel gar nicht verletzen. Escape schliesst
//   und gibt den Fokus an den Griff zurück.
// · IMMER ZU BEIM LADEN (D35-F1): kein gemerkter Zustand, kein localStorage.
// · FASSUNG VORN (D40), zugeklappt mit ihrem Stand statt der Zahl (Z2); sie
//   trägt den Registerstrich der Gesetze, aber den eigenen Buchstaben `f`.
// · EINE RUBRIK OHNE ECHTE ZAHL ERSCHEINT NICHT (§8); die Zeile steht, solange
//   eine Rubrik ODER die Aktionen etwas tragen.
// · AKTIONEN ERST, WENN ERREICHBAR (Z6, §15): bei Hover/Fokus an der Zeile oder
//   offener Rubrik — auf Geräten ohne Hover IMMER. Anlass: 13 532 Knöpfe im
//   OR-Leser (gemessen 11.9.2026), rund 5000 davon unsichtbare Aktionen.
//   Logikverlust: keiner, nur der Render-Zeitpunkt ändert sich. Die Griffe
//   bleiben immer im DOM — sie tragen die Zahlen.
// · IM DRUCK AUSGEBLENDET (`print:hidden`, Inventar 2.3.13).
//
// W2·29-WERKBANK-LESER S1 (23.9.2026): die FORM steht als Token-Utility hier,
// nicht mehr in `src/index.css`. Die Klassen `.lr7-bez*` sowie `data-reg` und
// `data-bez-marken` bleiben als Anker der Sonden und der CSS-Schalter der
// Rubriken-Wahl (Inventar N8; `src/index.css`, Suchwort «ARTIKELFUSS»).
//
// `(hover: none)` wird EINMAL beim Laden des Moduls gelesen, nicht je Artikel
// (1686 Abonnenten einer Medienabfrage wären dieselbe Rechnung wie oben). Ohne
// `window` (Prerender, Tests) gilt «Gerät mit Hover» — das prerenderte HTML
// trägt ohnehin keine Funktionszeile.
const OHNE_HOVER: boolean = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(hover: none)').matches;

/** Registerstrich je Rubrik als linke Kante des Griffs — `f` trägt den der
 *  Gesetze (D40: die Fassung ist Auskunft über den Erlass selbst, eine sechste
 *  Farbe wäre eine zweite Legende, §5). Die `hover:`-Hälfte hält die Farbe gegen
 *  die Hover-Kante von `.lc-btn-mini`. Literale, damit Tailwind sie findet. */
const KANTE: Record<BezugsMarke['reg'], string> = {
  f: 'border-l-reg-g hover:border-l-reg-g',
  r: 'border-l-reg-r hover:border-l-reg-r',
  m: 'border-l-reg-m hover:border-l-reg-m',
  g: 'border-l-reg-g hover:border-l-reg-g',
  w: 'border-l-reg-w hover:border-l-reg-w',
};

/** Eine Rubrik der Zeile: Zahl, Wort, Registerfarbe — und was sie aufklappt. */
export interface BezugsMarke {
  /** Registerbuchstabe: r = Rechtsprechung, m = Materialien, g = Gesetze,
   *  w = Werkzeuge; D40 · `f` = Fassung (Farbe der Gesetze, eigener Buchstabe:
   *  er ist Schlüssel des Aufklapp-Zustands und der Menü-Wahl `data-fuss-aus` —
   *  `g` doppelt hiesse, «Verweise» abwählen nähme die Fassung mit). */
  reg: 'f' | 'r' | 'm' | 'g' | 'w';
  /** Anzahl — nur echte, gezählte Werte (§8: nie geschätzt, nie erfunden). */
  anzahl: number;
  /** Einzahl/Mehrzahl des Rubriknamens. */
  wort: [einzahl: string, mehrzahl: string];
  /** W2·26/Z2 · Was die Marke ZUGEKLAPPT liest statt «n Wort» — nur die Fassung
   *  («Gilt seit 1.1.2023»); aufgeklappt steht die Zahl. Der Text kommt fertig
   *  vom Aufrufer (`../fassungsEtikett`), diese Datei formuliert nichts (§3). */
  etikett?: string;
  /** W2·26/Z3 · Zusatz für den `title`: die Grundgesamtheit, wenn die sichtbare
   *  Zahl eine GEFILTERTE ist (§8, wie der `title` in `./BezuegeZeile.tsx`). */
  titel?: string;
  /** W2·5m · Klartext-Leerzustand bei `anzahl === 0`, nur wo die Null gesichert
   *  ist (Verweise, Rechner). Die Zeile hier wertet das Feld NICHT aus — sie
   *  filtert `anzahl > 0`; gelesen wird es vom Dossier (`./ArtikelDossier.tsx`). */
  leer?: string;
  /** Was beim Aufklappen GENAU DIESER Rubrik erscheint. */
  inhalt: ReactNode;
  /** Hängt der Inhalt an einem nachzuladenden Shard? Dann fragt das Aufklappen
   *  danach (`onOeffnen`) und zeigt bis dahin das Skelett. */
  brauchtDaten?: boolean;
  /** D35-F2 · Sekundär-Griff am FUSS des aufgeklappten Blocks («im Blatt
   *  öffnen ›», David 7.9.2026: aufklappen UND ins Blatt öffnen). Wer ihn baut,
   *  entscheidet `./ArtikelLeser.bezuegeFuss.tsx`; hier wird nur gerendert (§3). */
  nebenGriff?: ReactNode;
}

/**
 * Die Funktionszeile am Artikelende.
 *
 * @param marken    Rubriken mit Zahl; Rubriken mit `anzahl === 0` fallen weg.
 * @param zitat     Normzitat für den Namen der Griffe (WCAG 4.1.2).
 * @param aktionen  Rechts stehende Artikel-Aktionen (`./ArtikelAktionen.tsx`).
 * @param onOeffnen Wird beim Aufklappen einer Rubrik gerufen, die Daten
 *                  braucht; armiert den bestehenden Ladepfad (s. u.).
 * @param laedt     Der Apparat ist unterwegs ⇒ Skelett statt Leere.
 */
export function Funktionszeile({ marken, zitat, aktionen, onOeffnen, laedt = false }: {
  marken: readonly BezugsMarke[];
  zitat: string;
  aktionen?: ReactNode;
  onOeffnen?: () => void;
  laedt?: boolean;
}) {
  // Der Zustand gehört GENAU EINEM Artikel (§15): ein Klick rendert diesen
  // einen Artikel neu, keinen der übrigen 1685.
  const [offen, setOffen] = useState<BezugsMarke['reg'] | null>(null);
  // Z6 · «steht die Maus (oder der Fokus) an dieser Zeile?»
  const [nah, setNah] = useState(false);
  const blockId = useId();
  /** Die Griffe dieser Zeile, für die Fokus-Rückgabe bei Escape (Z4). */
  const griffe = useRef<Partial<Record<BezugsMarke['reg'], HTMLButtonElement | null>>>({});
  const sichtbar = marken.filter((m) => m.anzahl > 0);
  // D40 · zwei Hälften: die Fassung (Auskunft über DIESEN Artikel) vorn, die
  // Bezüge (zeigen von ihm WEG) danach. Zwei `filter`, keine Sortierung: die
  // Reihenfolge innerhalb bleibt die des Aufrufers (§3).
  const eigen = sichtbar.filter((m) => m.reg === 'f');
  const bezug = sichtbar.filter((m) => m.reg !== 'f');
  const offeneMarke = sichtbar.find((m) => m.reg === offen) ?? null;
  const zeigeAktionen = OHNE_HOVER || nah || offen !== null;
  // Kein leerer Fuss ohne Deckung (§8).
  if (sichtbar.length === 0 && !aktionen) return null;

  // D30 · Das Aufklappen fragt nach den Daten — an der EINEN Stelle, an der das
  // Nachladen entschieden wird (`../v3/panelModell.ts`, `weckeDaten`), und nur
  // für Rubriken, die einen Shard brauchen (Verweise/Rechner stehen sofort, §15).
  const schalte = (m: BezugsMarke) => {
    const jetzt = offen !== m.reg;
    setOffen(jetzt ? m.reg : null);
    if (jetzt && m.brauchtDaten) onOeffnen?.();
  };

  /** Der Griff EINER Rubrik (lokal: die Datei exportiert nur Komponenten). */
  const griff = (m: BezugsMarke) => {
    const auf = offen === m.reg;
    const name = m.anzahl === 1 ? m.wort[0] : m.wort[1];
    // Z2 · zugeklappt das Etikett, aufgeklappt immer die Zahl. `\u00A0`: «11»
    // und «Entscheide» dürfen nicht umbrechen.
    const beschriftung = !auf && m.etikett ? m.etikett : `${m.anzahl}\u00A0${name}`;
    return (
      // `.lc-btn-mini` ist der Knopf-Baustein (Haarlinie, `--tap-ziel` als
      // Mindesthöhe, WCAG 2.5.8; Ratsche `design-r9-knopf-baustein`); die linke
      // Kante trägt als 3-px-Strich das Register (F0.2: Strich, nie Fläche).
      <button key={m.reg} type="button"
        className={`lc-btn-mini lr7-bez-marke group/griff gap-1 whitespace-nowrap border-l-[3px] ${KANTE[m.reg]} text-ink-600 aria-expanded:text-ink-900`}
        ref={(el) => { griffe.current[m.reg] = el; }}
        data-reg={m.reg} aria-expanded={auf} aria-controls={auf ? blockId : undefined}
        // WCAG 4.1.2 · der Name nennt Rubrik UND Artikel (1686 Artikel je
        // Seite); den Zustand trägt `aria-expanded`, nie das Wort
        // (ARIA_ZUSTANDSNAME). Die Zahl steht auch hinter dem Etikett.
        aria-label={`${m.anzahl} ${name} zu ${zitat}`}
        title={m.titel}
        onClick={() => schalte(m)}>
        {beschriftung}
        <span aria-hidden className="lr7-bez-pfeil group-aria-expanded/griff:rotate-90">›</span>
      </button>
    );
  };

  return (
    // D34 · eigene Grenze nach oben: die leiseste Linie (`--rule-soft`) trennt
    // den Wortlaut von seinem Apparat — eine Linie, kein Kasten (F0.6). Der
    // Abstand davor ist grösser als dahinter: die Zeile gehört zu dem, was sie
    // aufklappt. `data-bez-marken`: welche Rubriken der Artikel führt (Sonden).
    <div className="lr7-bez mt-4 border-t border-rule-soft pt-2 print:hidden"
      data-bez-marken={sichtbar.map((m) => m.reg).join('')}
      // Z6 · Hover UND Fokus an der Zeile; `onFocus`/`onBlur` blubbern in React
      // und wirken wie `:focus-within`.
      onMouseEnter={() => setNah(true)} onMouseLeave={() => setNah(false)}
      onFocus={() => setNah(true)} onBlur={() => setNah(false)}
      // Z4 · Escape an der WURZEL, damit er auch im aufgeklappten Block greift.
      onKeyDown={(ev) => {
        if (ev.key !== 'Escape' || offen === null) return;
        ev.stopPropagation();
        const zurueck = griffe.current[offen];
        setOffen(null);
        zurueck?.focus();
      }}>
      {/* `leading-6` = die Höhe einer Chip-Zeile (`min-h-beiwerk`). */}
      <div className="lr7-bez-zeile flex flex-wrap items-center gap-2 font-sans text-xs leading-6 text-ink-500">
        {eigen.map(griff)}
        {bezug.map(griff)}
        {zeigeAktionen && aktionen}
      </div>
      {offeneMarke && (
        <div className="lr7-bez-inhalt">
          <div id={blockId} className="lr7-bez-block" data-reg={offeneMarke.reg}>
            {/* Das Skelett steht NUR in der wartenden Rubrik und reserviert
                einen BODEN (`min-h-bez-skelett`), nie mehr als der echte Inhalt —
                sonst schrumpfte der Block beim Laden (Sonde `leser-d35-f1`). */}
            {offeneMarke.brauchtDaten && laedt && !offeneMarke.inhalt
              ? (
                <span className="lr7-bez-skelett min-h-bez-skelett">
                  <span className="lc-overline mr-1"><span className="lc-punkt" aria-hidden />{offeneMarke.wort[1]}</span>
                  <span className="text-body-s text-ink-500">lädt …</span>
                </span>
              )
              : offeneMarke.inhalt}
            {/* C-D1/E-9 (S6-W1a, 23.9.2026) · «im Erlass-Blatt öffnen» klappt die
                Rubrik ZU: dieselbe Liste stand sonst zweimal gleichzeitig da —
                hier und im Blatt (Audit C-D1). Der Klick des Griffs läuft
                zuerst (Blatt auf), dann blubbert er hierher; der Fokus kehrt an
                den Rubrik-Griff zurück, statt mit dem Knopf zu verschwinden. */}
            {offeneMarke.nebenGriff && (
              <div className="contents" onClick={() => {
                const zurueck = griffe.current[offeneMarke.reg];
                setOffen(null);
                zurueck?.focus();
              }}>{offeneMarke.nebenGriff}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
