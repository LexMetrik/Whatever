// ─── Tabs: generisches Segmented-Control (Darstellungsschicht, §3) ──────────
// Verhaltensneutrale Entdoppelung (5.6.2026): zuvor wortgleich in Katalog
// (Pro-Tabs, Filter-Status-Toggle) und AllgemeineFristForm (Modus-Tabs) —
// dort Markup EXAKT wie zuvor. Die SchKG/ZPO-Phasenwahl (UX B12) wurde
// dagegen BEWUSST vom dunklen Button-Stil auf diese Segmented-Control-Optik
// vereinheitlicht (Funktion identisch). Die ursprünglichen Fundstellen unterschieden
// sich nur in Höhe/Textgrösse/Padding (→ Grösse `s`/`m`) und der Semantik
// (`mode`: ARIA-Tabs `role=tab/aria-selected` vs. Toggle-Buttons
// `aria-pressed`). Keine Logik, kein Zustand — reiner gesteuerter View.

export type TabItem<T extends string> = {
  code: T;
  label: React.ReactNode;
  /**
   * `id`/`aria-controls` des Reiters (E-2-Nachzug, R3-α 31.8.2026 — additiv).
   *
   * Die `Gesetze`-Ebenenwahl war die dritte Kopie dieser Segmented-Control und
   * blieb es bis hierher NUR wegen dieser beiden Attribute: sie verknüpft
   * Reiter und Panel ausdrücklich (`ebene-tab-…` ↔ `ebene-panel-…`). Das ist
   * eine Zusage, die der Baustein können muss — nicht ein Grund für eine
   * eigene Leiste (§5/§10). Ohne Angabe verhält er sich exakt wie bisher.
   */
  id?: string;
  ariaControls?: string;
  /** Zusatzauskunft am Reiter (`title`) — nie einzige Trägerin einer Tatsache. */
  titel?: string;
};

/**
 * Grösse: `m` = h-9/text-body-s/px-3 (Tabs); `s` = h-8/text-xs/px-2.5
 * (Filter-Toggle); `zweizeilig` = Titel + Unterzeile in EINEM Knopf.
 *
 * `zweizeilig` ist der additive Nachzug der Design-Konsistenz-Runde 1 (E-2,
 * 31.8.2026): der Arbeitsrechts-Rechner trug eine wortgleiche Kopie dieser
 * Segmented-Control (eigene Zustands-Klassen `bg-surface-raised text-brass-700
 * shadow-sm border border-line`), weil seine Reiter zwei Zeilen tragen
 * («A – Lohnfortzahlung» / «Art. 324a OR») und die feste Höhe `h-9` die zweite
 * Zeile geklemmt hätte. Statt die Kopie anzugleichen bekommt der EINE Baustein
 * die fehlende Variante (§5/§10): keine feste Höhe, sondern `min-h-11` (44 px,
 * WCAG 2.5.5 AAA — dasselbe Mass wie `Topbar`/`lc-*`) plus eigenes
 * Vertikal-Padding, damit die Höhe dem Inhalt folgt statt ihn zu schneiden.
 */
type TabGroesse = 's' | 'm' | 'zweizeilig';

// ── B-R1 (R9-1, 6.9.2026) · UNTERSTRICH STATT BOX-CHIP ──────────────────────
// Die ANATOMIE (Farbe, Strich, Gewicht, Fokus) steht seit diesem Nachzug EINMAL
// in `src/index.css` als `.lc-tab` — hier bleiben nur Grösse und Polsterung.
// Vorher stand sie als `AKTIV`/`INAKTIV`-Klassenpaar direkt hier und trug
// `bg-surface-raised text-brass-700 shadow-sm border border-line`: Kissen statt
// Kante (F0.5), Fläche statt Linie (F0.6), Messing statt Tinte (F0.3).
// `rounded-md` ist mitentfallen — `--radius-md` steht seit R1 auf 0, die
// Utility LOG also schon vorher (dieselbe Diagnose wie R5-F2 im Wizard).
const KNOPF: Record<TabGroesse, string> = {
  m: 'px-1 text-body-s',
  s: 'px-1 text-xs',
  zweizeilig: 'px-1 py-2 text-body-s',
};
// Mobile grössere Trefferfläche (Redesign E7: h-11 = 44px erreicht auf Touch
// die AAA-Empfehlung), ab sm zurück auf die kompakte Desktop-Höhe.
const HOEHE: Record<TabGroesse, string> = { m: 'h-11 sm:h-9', s: 'h-10 sm:h-8', zweizeilig: 'min-h-11' };


export function Tabs<T extends string>({
  items, value, onChange, groesse = 'm', mode = 'tab', ariaLabel,
}: {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (code: T) => void;
  groesse?: TabGroesse;
  /** `tab` = role=tablist/tab + aria-selected; `pressed` = aria-pressed-Buttons. */
  mode?: 'tab' | 'pressed';
  ariaLabel?: string;
}) {
  // LM-173 (Fahrplan B5, §6): alle Optionen sind <button> und verschwinden im
  // Druck über die Pauschalregel `button { display:none }` (index.css) — der
  // Rahmen bleibt dann als leerer, fast unsichtbarer Streifen stehen (z. B.
  // «Verfahrensphase wählen» im ZPO-Rechner). `print:hidden` blendet die
  // Gruppe im Ausdruck ganz aus; die einzeilige Klartext-Zeile danach zeigt
  // dieselbe Information ohne Interaktions-Chrome.
  const aktivesItem = items.find((it) => it.code === value);
  return (
    <>
    <div
      // `pressed` bekommt `role="group"` (E-2, 31.8.2026): ohne Rolle ist das
      // `aria-label` an einem generischen <div> für Hilfsmittel unsichtbar —
      // die Gruppe hiess dort also gar nicht «Verfahrensphase»/«Mangeltyp».
      // Die abgelöste Kopie in `GewaehrleistungForm` hatte role=group korrekt
      // gesetzt; der geteilte Baustein darf beim Zusammenziehen nichts
      // verlieren (§5/§10). Rein semantisch, keine Optik-Änderung.
      role={mode === 'tab' ? 'tablist' : 'group'}
      aria-label={ariaLabel}
      // ── LM-063 (B8, 31.8.2026) · DIE LEISTE SAGT JETZT, DASS SIE WEITERGEHT ──
      // GEMESSEN am gebauten Stand, `/rechner/schkg-fristen` @720: diese Gruppe
      // war 604 px breit bei 1'193 px Inhalt — **589 px verborgen**, ohne
      // Verlauf, ohne Maske, ohne sichtbaren Balken. Der achte Reiter
      // («Schiedsverfahren») endete mitten im Wort, und nichts sagte, dass dort
      // noch etwas liegt. `/rechner/zpo-fristen` @720: 604/756.
      // `lc-scrollrand-x` ist die GETEILTE Affordanz (Anatomie und Herleitung im
      // Regel-Block `lc-scrollrand` in index.css): zwei Deckel in `local` über
      // zwei Schatten in `scroll` — der Schatten steht genau dann, wenn an
      // dieser Kante wirklich noch Inhalt liegt, und verschwindet am Ende der
      // Strecke. Kein JavaScript, kein Listener, kein Re-Render (§2/§15).
      // `lc-scrollrand-grund-surface`, weil die Leiste auf `bg-surface` sitzt:
      // der Deckel muss die Farbe der Fläche haben, die er abdeckt.
      // NACHTRAG B-R1 (R9-1, 6.9.2026) — der Satz oben galt für die BOX-Leiste:
      // sie trug `bg-surface` selbst, also musste der Deckel `--surface` sein.
      // Mit der Unterstrich-Anatomie hat die Leiste keine eigene Fläche mehr;
      // der Deckel nimmt darum den Vorgabewert `--paper` (`.lc-scrollrand-x`),
      // also die Farbe der Seite, über der er wirklich liegt. Die Messung von
      // damals bleibt richtig, ihr Gegenstand ist weg (§2b).
      // ── R-1 (Fixer 2 → 1b, 6.9.2026) · UNTER 400 px WIRD UMBROCHEN, NICHT
      //    GESCHOBEN ──────────────────────────────────────────────────────────
      // Die Affordanz oben sagt zwar, dass es weitergeht — aber GEMESSEN am
      // gebauten Stand (Playwright, Preview, 6.9.2026):
      //   /rechner/schkg-fristen @390: 300 px sichtbar bei 1157 px Inhalt →
      //     857 px verborgen, also 8 von 9 Verfahrensphasen ausserhalb des
      //     Bildes. Der Nutzer muss wischen, um ueberhaupt zu SEHEN, dass es
      //     neun sind.
      //   /rechner/kuendigung @390: 348/415, 67 px verborgen (3 Knoepfe).
      // Ein Schieber, der drei Viertel seines Inhalts versteckt, ist keine
      // Affordanz-Frage mehr, sondern eine Auffindbarkeits-Frage. Unter 400 px
      // bricht die Leiste darum um: alle Optionen stehen im Bild, mehrzeilig.
      // Ab 400 px bleibt alles exakt wie bisher — `flex-wrap` und `h-auto`
      // greifen nur unterhalb der Schranke, der Schieber daher ebenso.
      // `min-h-11` an den Knoepfen (unten) haelt das 44-px-Fingermass, das die
      // feste Container-Hoehe im umgebrochenen Zustand nicht mehr geben kann.
      // `max-[400px]:bg-none` GEHOERT DAZU (Nachzug B-R1, Sichtbeleg 6.9.2026,
      // `r9-1-reiter-schkg-390-h.jpg`): unter 400 px wird umgebrochen, also
      // NICHT geschoben — die Schatten der Scroll-Affordanz standen dort als
      // heller Balken quer ueber den umgebrochenen Zeilen. Eine Affordanz fuer
      // eine Bewegung, die es nicht gibt, ist ein Fleck. Dieselbe Bauform wie
      // die `lg:bg-none`-Zeile an der Seitenleisten-Schiene.
      // ── W2·31-BILDSCHIRMBREITE B3-Nachzug (Gegenprüfung 26.9.2026, Mangel B3)
      //    · IN DER BREITEN WERKZEUG-KARTE WIRD EBENFALLS UMBROCHEN ──────────
      // Ab 72rem Kartenbreite steht die Eingabe in der linken Spalte (index.css
      // `.lc-rechner-spalten`, ~624–640 px). GEMESSEN @1920 am gebauten Stand:
      // ZPO-Phasen 684/640 px, SchKG-Phasen 1088/640 px (448 px, vier von neun
      // Phasen verborgen). Ein anderes Spaltenverhältnis hilft der SchKG-Leiste
      // nicht und nähme der Erben-Tabelle rechts (712 px) die Breite — darum
      // dieselbe Antwort wie unter 400 px: umbrechen statt schieben. `flex-wrap`
      // bricht nur, wenn der Platz fehlt; passt die Leiste, bleibt sie eine
      // Zeile. `min-h-9` am Knopf hält die Desktop-Höhe, die die feste
      // Container-Höhe im umgebrochenen Zustand nicht mehr gibt.
      className={`print:hidden flex ${HOEHE[groesse]} items-stretch gap-4 w-fit max-w-full overflow-x-auto lc-scrollrand-x max-[400px]:flex-wrap max-[400px]:h-auto max-[400px]:overflow-x-visible max-[400px]:bg-none @[72rem]/rechnerkarte:flex-wrap @[72rem]/rechnerkarte:h-auto @[72rem]/rechnerkarte:overflow-x-visible @[72rem]/rechnerkarte:bg-none`}
    >
      {items.map((it, i) => {
        const aktiv = value === it.code;
        // APG-Tabs-Muster (Redesign E9): roving tabindex (genau ein tabbarer
        // Tab) + Pfeiltasten/Home/End. Vorher war role=tab gesetzt, aber die
        // erwartete Tastaturnavigation fehlte (ARIA-Versprechen ohne Verhalten).
        const aufTaste = (e: React.KeyboardEvent<HTMLButtonElement>) => {
          if (mode !== 'tab') return;
          let ziel: number;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ziel = (i + 1) % items.length;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ziel = (i - 1 + items.length) % items.length;
          else if (e.key === 'Home') ziel = 0;
          else if (e.key === 'End') ziel = items.length - 1;
          else return;
          e.preventDefault();
          onChange(items[ziel].code);
          (e.currentTarget.parentElement?.children[ziel] as HTMLElement | undefined)?.focus();
        };
        return (
          <button
            key={it.code}
            type="button"
            id={it.id}
            aria-controls={it.ariaControls}
            title={it.titel}
            role={mode === 'tab' ? 'tab' : undefined}
            aria-selected={mode === 'tab' ? aktiv : undefined}
            aria-pressed={mode === 'pressed' ? aktiv : undefined}
            tabIndex={mode === 'tab' ? (aktiv ? 0 : -1) : undefined}
            onKeyDown={aufTaste}
            onClick={() => onChange(it.code)}
            // Touch-Target (FAHRPLAN-DESIGN 3.2, revidiert im Bug-Check §9):
            // eine Pseudo-Element-Erweiterung wird vom overflow-x-auto-
            // Container geclippt und wäre wirkungslos. h-8/h-9 erfüllen
            // WCAG 2.2 AA (≥24px); AAA (44px) ist in einer scrollbaren
            // Segmented-Control ohne Redesign nicht erreichbar.
            className={`lc-tab shrink-0 whitespace-nowrap max-[400px]:min-h-11 @[72rem]/rechnerkarte:min-h-9 ${KNOPF[groesse]}`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
    {/* Nur im Ausdruck sichtbar (Gegenstück zu print:hidden oben) — Klartext
        statt Button-Gruppe, damit die getroffene Wahl im Ausdruck lesbar
        bleibt, ohne die Bildschirm-Optik zu berühren (byte-gleich bei
        Bildschirm-Medien, da `hidden` dort weiterhin greift). */}
    <p className="hidden print:block text-body-s text-ink-700">
      {ariaLabel ? `${ariaLabel}: ` : ''}{aktivesItem?.label}
    </p>
    </>
  );
}
