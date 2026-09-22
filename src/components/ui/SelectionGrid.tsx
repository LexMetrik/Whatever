// ─── SelectionGrid: Auswahlkacheln (aria-pressed) – Darstellungsschicht (§3) ─
// Verhaltensneutrale Entdoppelung (5.6.2026): zuvor ~14× wortgleich in den
// Vorlagen-Wizards (Arbeitsvertrag, Mietvertrag, Vorsorgeauftrag,
// Patientenverfügung, Schlichtungsgesuch) und im Teuerungsrechner.
// Markup-Klassen sind EXAKT wie zuvor; die Fundstellen unterschieden sich nur
// im Grid-Container (Spaltenzahl → `className`) und darin, ob eine Kachel eine
// Unterzeile (`sub`) trägt. Keine Logik — reiner gesteuerter View.

// ─── D-3 (W2·19-DESIGN-KONSISTENZ, Runde 2, 31.8.2026) ──────────────────────
//
// Befund D-3 der Finder-Welle: vier Wizard-Stellen bauten dieselbe Sache — eine
// Reihe sich gegenseitig ausschliessender Auswahl-Knöpfe mit `aria-pressed` —
// als eigene PILLEN, an SelectionGrid vorbei, und signalisierten die Auswahl mit
// einer invertierten `bg-ink-900`-Füllung statt mit dem Auswahl-Signal des
// Hauses (`border-brass-500 bg-brass-100/60`). Zwei Auswahl-Grammatiken für
// eine Sache. Die Pillen sind darum eine VARIANTE dieses Bausteins geworden
// (additiv: die Kachel-Fundstellen sind unverändert), die Kopien sind gelöscht.
//
// Behalten bleibt die semantische Tönung der Patientenverfügungs-Entscheide
// («zustimmen» sage · «ablehnen» danger · «nur befristet» warn): dort trägt die
// Farbe BEDEUTUNG, nicht bloss den Auswahl-Zustand — sie wegzunehmen wäre ein
// Informationsverlust (§1/§8), kein Vereinheitlichen. Sie steht als deklarierter
// `ton` am Item; ohne `ton` gilt das Kanon-Signal.

type SelectionTon = 'zustimmung' | 'ablehnung' | 'vorbehalt';

export type SelectionItem<T extends string> = {
  code: T;
  label: React.ReactNode;
  /** Optionale Unterzeile (text-xs). Fehlt sie, entfällt die Sub-Span.
      Nur `variant="kachel"` — eine Pille trägt keine zweite Zeile. */
  sub?: React.ReactNode;
  /** Semantische Tönung der AKTIVEN Pille (nur `variant="pille"`). */
  ton?: SelectionTon;
  /**
   * Nicht wählbar (B3-4/R3-α, 31.8.2026 — additiv).
   *
   * Der `ZustaendigkeitForm`-Rechtsweg trug eine handgezeichnete Kachel-Reihe
   * NUR deshalb, weil sie einen dritten Zustand kennt: Rechtswege, deren Engine
   * noch fehlt, stehen sichtbar (§8: die Lücke wird benannt, nicht verschwiegen)
   * und sind nicht anklickbar. Das Feld gehört an den Baustein, nicht in eine
   * dreizehnte Kopie. `titel` wird zum `title` des Knopfs — er sagt, WARUM.
   */
  disabled?: boolean;
  /** Zusatzauskunft am Knopf (`title`), z. B. der Grund einer Sperre. */
  titel?: string;
};

/** Aktiv-Klassen der Pille: Kanon-Signal, ausser das Item trägt Bedeutung. */
const TON_AKTIV: Record<SelectionTon, string> = {
  // A3-6 (R3-α, 31.8.2026): Zustands-Rolle statt Materialien-Kennfarbe
  // (wertidentisch: --ok-* zeigt auf --sage-*). «zustimmen» ist ein
  // Verdikt, kein Werkstoff — dieselbe Trennung wie bei danger/warn.
  zustimmung: 'bg-ok-bg border-ok-line text-ok-text',
  ablehnung: 'bg-danger-bg border-danger-line text-danger-700',
  vorbehalt: 'bg-warn-bg border-warn-500 text-warn-700',
};
// ─── W2·24 (6.9.2026) · AUSWAHL IST EINE LINIE, KEINE FLAECHE ───────────────
// Vorher: gewaehlt = zweite Fuellung (`bg-brass-100/60`) auf einer Kachel, die
// schon eine Fuellung (`bg-surface`) und einen Vollrahmen trug. Jetzt traegt die
// Ruhe nur die Haarlinie, und die Auswahl den 3-px-Registerstrich samt Haekchen
// (Anatomie in index.css, `.lc-wahl-kachel`). Die semantischen Toene unten
// BEHALTEN ihre Fuellung — dort ist die Farbe eine Aussage (zustimmen/ablehnen/
// Vorbehalt), nicht ein Auswahl-Signal; dieselbe Grenze wie bei `.lc-badge-warn`
// und `.lc-notice` (§13/F2, §8).
const KANON_AKTIV = 'border-line text-ink-900';
const RUHE = 'border-line hover:border-brass-400';
/** Gesperrte Kachel — sichtbar, aber nicht wählbar (§8, s. `disabled`).
 *
 *  LM-093 (W2·17-UI-BEFUNDE B17, 4.9.2026): stand als `bg-surface
 *  opacity-55`. Gemessen auf `/rechner/zustaendigkeit` (1440 px) war die
 *  gesperrte Karte «Verwaltung» damit in Fläche, Rahmen UND Titelfarbe
 *  identisch mit den wählbaren (bg rgb(254,252,250), Titel rgb(28,26,21)) —
 *  der einzige Unterschied war die Deckkraft. Wie beim Knopf-Token
 *  (`.lc-btn*:disabled`, index.css) trägt die Dämpfung jetzt die FLÄCHE: die
 *  gesperrte Kachel sitzt versenkt (`bg-well`) statt erhaben, ihr Titel läuft
 *  gedämpft aber lesbar (`text-ink-600`, s. u.). Eine durchscheinende Kachel
 *  über wechselndem Untergrund ist kein Zustand, sondern ein Zufall.
 *  §8/§3 unberührt: die «In Vorbereitung»-Marke bleibt die Aussage, die Sperre
 *  bleibt beim Aufrufer (`disabled`). */
const GESPERRT = 'border-line bg-well cursor-not-allowed';  // Fuellung BLEIBT: sie IST hier der Zustand (LM-093).

/**
 * Trefferfläche der PILLE (A3-5, R3-α 31.8.2026).
 *
 * Die Pille misst gezeichnet 30 px hoch (`py-1.5` + `text-body-s`) — unter dem
 * AAA-Komfortmass 44 px (`--tap-ziel-komfort`) und, je nach Beschriftung, auch
 * unter den 24 px von WCAG 2.5.8, sobald das Label kurz ist («ja», «nein»).
 * Sie WÄCHST nicht: die Reihe ist bewusst kompakt, und eine 44-px-Pille wäre
 * eine andere Bauform. Statt dessen dieselbe Lösung wie bei `.lc-chip`
 * (index.css): ein unsichtbares `::after` hebt die TREFFERFLÄCHE auf das
 * Komfortmass, ohne die gezeichnete Höhe anzufassen.
 */
const PILLE_HITBOX =
  'relative after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 '
  + 'after:h-[var(--tap-ziel-komfort)] after:min-w-[var(--tap-ziel-komfort)] after:w-full after:content-[""]';

export function SelectionGrid<T extends string>({
  items, value, onSelect, className, variant = 'kachel', gruppenLabel,
}: {
  items: readonly SelectionItem<T>[];
  /** Aktueller Wert; darf breiter sein als die Item-Codes (z. B. ein
      «keine_angabe», das in keiner Kachel vorkommt → keine ist aktiv). */
  value: T | (string & {});
  onSelect: (code: T) => void;
  /** Container-Klassen (Grid-Spalten bzw. `flex flex-wrap`) – wie an der Fundstelle. */
  className: string;
  /** `kachel` (Default) = Auswahlkachel mit Unterzeile; `pille` = kompakte
      Chip-Reihe für kurze, sich ausschliessende Antworten. */
  variant?: 'kachel' | 'pille';
  /** Setzt `role="group"` + `aria-label` am Container (Pillen-Reihen tragen das). */
  gruppenLabel?: string;
}) {
  const pille = variant === 'pille';
  return (
    <div className={className}
      role={gruppenLabel ? 'group' : undefined} aria-label={gruppenLabel}>
      {items.map((it) => {
        const aktiv = value === it.code;
        const aktivKlasse = pille && it.ton ? TON_AKTIV[it.ton] : KANON_AKTIV;
        const ruhe = it.disabled ? GESPERRT : RUHE;
        return (
          <button
            key={it.code}
            type="button"
            disabled={it.disabled}
            title={it.titel}
            data-selection-pille={pille ? '' : undefined}
            onClick={() => !it.disabled && onSelect(it.code)}
            aria-pressed={aktiv}
            className={pille
              ? `lc-wahl-pille ${PILLE_HITBOX} px-3 py-1.5 text-body-s font-medium border transition-colors ${
                aktiv ? aktivKlasse : `${ruhe} text-ink-600`}`
              // ── GB-20/21 (W2·24, Befunde G20/G21, 7.9.2026) · ZEILE STATT KASTEN
              //    GEMESSEN: die Ferien-/Stillstand-Auswahl des Fristenrechners ist
              //    ein Raster aus 6 gerahmten Kästen (`div.border.border-line`) mit
              //    je 3–5 Zeilen Kleintext; der Vorlagen-Assistent trägt 8 davon.
              //    F0.6 («Linien statt Flächen») und David 6.9.2026 («Linien statt
              //    Flächen»). `border` → `border-t`: der Vollrahmen fällt weg, die
              //    obere Haarlinie bleibt und TRENNT die Zeilen. Damit wird das
              //    Raster zur Zeilenliste, ohne dass die 60 Aufrufer ihre
              //    Spaltenzahl ändern müssen (§10 — der Rahmen wird gebaut, nicht
              //    60 Aufrufe umgeschrieben). Der 3-px-Strich in `--reg-w` am
              //    gewählten Zustand, das Häkchen, `pr-6` und `min-h-11` bleiben
              //    Wort für Wort (index.css `.lc-wahl-kachel`).
              //    DIE PILLE BLEIBT GESCHLOSSEN: sie steht in einer Reihe kurzer
              //    Antworten («ja»/«nein»), wo die geschlossene Form die Aussage
              //    «ich bin ein Knopf» ist — eine offene Zeile wäre dort keine
              //    Auswahl mehr, sondern Fliesstext.
              : `lc-wahl-kachel text-left p-3 pr-6 min-h-11 border-t transition-colors ${aktiv ? aktivKlasse : ruhe}`}
          >
            {pille ? it.label : (
              <>
                {/* LM-093: die Titelzeile trug `text-ink-900` unabhängig vom
                    Zustand — die gesperrte Kachel sah damit exakt so aus wie
                    eine wählbare. `ink-600` (nicht ink-400/ink-500) hält den
                    Text auf `bg-well` klar über AA und dämpft trotzdem
                    sichtbar; die Unterzeile daneben läuft aus demselben Grund
                    seit LM-176 in ink-600. */}
                <span className={`block text-body-s font-semibold ${it.disabled ? 'text-ink-600' : 'text-ink-900'}`}>{it.label}</span>
                {/* ink-600, NICHT ink-500 (LM-176, Fahrplan B5 §6): die
                    Unterzeile sitzt in der GEWÄHLTEN Kachel auf `bg-brass-100`
                    — dort misst ink-500 4.37:1 (unter AA), ink-600 6.3:1. Die
                    Messung stammt von den Vorlagen-Kopien, die B3-4 hier
                    einzieht; sie darf beim Einziehen nicht verloren gehen. */}
                {/* LM-130 (W2·17-UI-BEFUNDE-B9, 4.9.2026) · DIE UNTERZEILE BRICHT,
                    SIE LÄUFT NICHT AUS DER KACHEL. Gemessen @390 auf
                    `/vorlagen/nda`, Block «Detailgrad» (`grid-cols-3`, Spalte
                    100 px): «vollständige Grundausstattung» brauchte 98 px in
                    einem 74 px breiten Kasten — 24 px Überlauf, der über den
                    Kartenrand und unter die Nachbarkachel lief (Screenshot-Beweis,
                    ein DOM-Wächter allein hätte ihn nicht gezeigt). Ursache ist
                    nicht das Raster, sondern das EINE unteilbare Kompositum:
                    «Grundausstattung» ist breiter als jede 100-px-Spalte.
                    Die Regel ist die des Hauses und wortgleich mit der des
                    Vorlagen-Titels (`vorlagen/wizard.tsx`): `hyphens-auto` trennt
                    an der Silbengrenze (mit Trennstrich, in Chromium headless wie
                    headed gemessen), `[overflow-wrap:anywhere]` fängt den
                    pathologischen Rest. Am Baustein, nicht an der Fundstelle —
                    dieselbe Kachel-Anatomie trägt alle Untertyp-Raster (§5). */}
                {it.sub !== undefined && <span className="block text-xs text-ink-600 [overflow-wrap:anywhere] hyphens-auto">{it.sub}</span>}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
