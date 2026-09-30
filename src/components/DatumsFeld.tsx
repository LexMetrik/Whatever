import { useEffect, useId, useRef, useState } from 'react';
// eslint-disable-next-line no-restricted-imports -- §3-Ausnahme (gegrandfathert 8.8.2026, QS-AUDIT-VERWEISE): addDays navigiert hier nur das Kalender-Raster (Darstellung), es berechnet keine Frist.
import { addDays, format, isValid, parse, parseISO } from 'date-fns';

// Eigenes Datumsfeld im LexMetrik-Look: Texteingabe (TT.MM.JJJJ) plus
// aufklappbarer Kalender – ersetzt den nativen Browser-Datepicker.
// Wert bleibt ISO (yyyy-MM-dd), kompatibel zu <input type="date">.

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

type Props = {
  value: string;                      // ISO yyyy-MM-dd oder ''
  onChange: (iso: string) => void;
  className?: string;                 // Klassen des Eingabefelds
  wrapperClassName?: string;          // Breite/Layout des Felds (z. B. 'w-44')
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

function isoZuAnzeige(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'dd.MM.yyyy') : '';
}

function gleicherTag(a: Date, b: Date | null): boolean {
  return !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DatumsFeld({ value, onChange, className = 'lc-input', wrapperClassName = '', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby }: Props) {
  const [offen, setOffen] = useState(false);
  const [text, setText] = useState(() => (value ? isoZuAnzeige(value) : ''));
  const [monat, setMonat] = useState(() => {
    const d = value ? parseISO(value) : new Date();
    return isValid(d) ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date();
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Tastatur-Fokus im Kalender (roving tabindex, FAHRPLAN-DESIGN 3.1):
  // genau EIN Tag ist tabbbar; Pfeiltasten verschieben ihn.
  const [fokusIso, setFokusIso] = useState<string | null>(null);

  // Externer Wert hat Vorrang (auch nach Auswahl im Kalender) —
  // Sync während des Renderns statt im Effect (React-Pattern «adjusting state»).
  const [letzterWert, setLetzterWert] = useState(value);
  // D1 (W2·24-Gesamtprüfung 7.9.2026): ein unmögliches Datum (z. B. 31.02.2026)
  // löscht unten in `tippen` den `value` (onChange('')) — OHNE dieses Flag würde
  // dieser Sync den gerade getippten (ungültigen) Text sofort wieder mit dem nun
  // leeren `value` überschreiben, und der Nutzer sähe seinen Tippfehler nicht mehr.
  const [ungueltig, setUngueltig] = useState(false);
  const fehlerId = useId();
  if (value !== letzterWert) {
    setLetzterWert(value);
    if (!ungueltig) setText(value ? isoZuAnzeige(value) : '');
  }

  // Schliessen bei Klick ausserhalb / Escape
  useEffect(() => {
    if (!offen) return;
    const klick = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOffen(false);
    };
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOffen(false);
        toggleRef.current?.focus(); // Fokus zurück zum Auslöser (Dialog-Muster)
      }
    };
    document.addEventListener('pointerdown', klick);
    document.addEventListener('keydown', taste);
    return () => {
      document.removeEventListener('pointerdown', klick);
      document.removeEventListener('keydown', taste);
    };
  }, [offen]);

  const [rechtsbuendig, setRechtsbuendig] = useState(false);

  const oeffnen = () => {
    const d = value ? parseISO(value) : new Date();
    const gueltig = isValid(d) ? d : new Date();
    setMonat(new Date(gueltig.getFullYear(), gueltig.getMonth(), 1));
    setFokusIso(format(gueltig, 'yyyy-MM-dd'));
    // Popover nach links klappen, wenn rechts kein Platz mehr ist (Viewport-Rand)
    const rect = wrapRef.current?.getBoundingClientRect();
    setRechtsbuendig(!!rect && rect.left + 280 > window.innerWidth - 12);
    setOffen(true);
  };

  // Pfeiltasten-Navigation im Tagesraster (APG-Grid-Muster); Monatswechsel
  // folgt dem Fokus. Enter/Space wählen nativ (Tage sind Buttons).
  // Liegt der Fokus-Tag nach ‹/›-Blättern NICHT im angezeigten Monat
  // (Bug-Check §9 Agent 2, 7.6.2026), startet die Navigation beim
  // Monatsersten statt zurückzuspringen; der tabbare Tag fällt dann
  // ebenfalls auf den Monatsersten (kein Fokus-Klau beim Maus-Blättern).
  const SCHRITTE: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  const rasterTaste = (e: React.KeyboardEvent) => {
    const schritt = SCHRITTE[e.key];
    if (schritt === undefined) return;
    e.preventDefault();
    const f = fokusIso ? parseISO(fokusIso) : null;
    const imMonat = !!f && f.getFullYear() === monat.getFullYear() && f.getMonth() === monat.getMonth();
    const ziel = imMonat && f ? addDays(f, schritt) : new Date(monat.getFullYear(), monat.getMonth(), 1);
    setMonat(new Date(ziel.getFullYear(), ziel.getMonth(), 1));
    setFokusIso(format(ziel, 'yyyy-MM-dd'));
  };

  // Fokus dem roving tabindex nachführen (auch beim Öffnen: Fokus in den Dialog)
  useEffect(() => {
    if (!offen || !fokusIso) return;
    wrapRef.current?.querySelector<HTMLButtonElement>(`button[data-iso="${fokusIso}"]`)?.focus();
  }, [offen, fokusIso]);

  // Tippen: erst bei vollständigem, gültigem Datum emittieren
  const tippen = (s: string) => {
    setText(s);
    if (!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s.trim())) { setUngueltig(false); return; }
    const d = parse(s.trim(), 'd.M.yyyy', new Date());
    if (isValid(d)) { setUngueltig(false); onChange(format(d, 'yyyy-MM-dd')); return; }
    // D1: vollständig eingegeben, aber kein echtes Kalenderdatum (31.02.2026,
    // 99.99.9999 …). Vorher blieb der ALTE `value` unverändert stehen — das
    // Ergebnis oben zeigte weiter die alte Berechnung, ohne jede Rückmeldung.
    // Jetzt: Feld wird sichtbar ungültig, und der Wert wird geleert — der
    // Aufrufer fällt auf seinen bestehenden Leerzustand zurück (reine
    // Darstellungs-Korrektur, §3 — keine Rechenlogik berührt).
    setUngueltig(true);
    onChange('');
  };

  // Verlassen: leeres Feld löscht den Wert, ungültiger Text springt zurück —
  // ein sichtbar ungültiger Text (D1) bleibt dagegen stehen, bis der Nutzer
  // ihn korrigiert, statt beim Blur kommentarlos zu verschwinden.
  const verlassen = () => {
    if (ungueltig) return;
    if (text.trim() === '') { if (value) onChange(''); return; }
    setText(value ? isoZuAnzeige(value) : '');
  };

  const waehlen = (d: Date) => { onChange(format(d, 'yyyy-MM-dd')); setOffen(false); };
  const blaettern = (deltaMonate: number) =>
    setMonat((m) => new Date(m.getFullYear(), m.getMonth() + deltaMonate, 1));

  // Monatsraster (Mo-first)
  const jahr = monat.getFullYear();
  const m = monat.getMonth();
  const anzahl = new Date(jahr, m + 1, 0).getDate();
  const offset = (new Date(jahr, m, 1).getDay() + 6) % 7;
  const zellen: (Date | null)[] = [
    ...(Array(offset).fill(null) as null[]),
    ...Array.from({ length: anzahl }, (_, i) => new Date(jahr, m, i + 1)),
  ];
  const gewaehlt = value && isValid(parseISO(value)) ? parseISO(value) : null;
  const heute = new Date();
  // Roving tabindex monats-robust: zeigt der Fokus-Tag auf einen anderen
  // Monat (nach ‹/›-Blättern), wird der Monatserste tabbar (Bug-Check §9).
  const fokusImMonat = !!fokusIso && fokusIso.startsWith(format(monat, 'yyyy-MM'));

  const navBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-md text-brass-700 lc-hover-akzent';

  return (
    <div ref={wrapRef} className={`relative ${wrapperClassName}`}>
      <input
        type="text" inputMode="numeric" placeholder="TT.MM.JJJJ"
        value={text} onChange={(e) => tippen(e.target.value)} onBlur={verlassen}
        className={`${className} pr-11`} aria-label={ariaLabel} aria-labelledby={ariaLabelledby}
        aria-invalid={ungueltig} aria-describedby={ungueltig ? fehlerId : undefined}
      />
      <button
        ref={toggleRef}
        type="button" onClick={() => (offen ? setOffen(false) : oeffnen())}
        aria-label="Kalender öffnen" aria-expanded={offen} aria-haspopup="dialog"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-md text-brass-700 lc-hover-akzent"
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 6h14v14H5zM5 10h14M9 4v4M15 4v4" />
        </svg>
      </button>

      {/* D1: Feld-Fehlerzeile im bestehenden Baustein — dieselbe Klasse wie
          `SchkgZustaendigkeitTeil.tsx` an ihrer Feld-Fehlerzeile, hier als
          Danger statt Warn (ein unmögliches Datum ist ein Fehler, keine Warnung). */}
      {ungueltig && (
        <p id={fehlerId} role="alert" className="lc-notice-danger text-body-s mt-1">
          Dieses Datum gibt es nicht – bitte prüfen.
        </p>
      )}

      {offen && (
        <div role="dialog" aria-label="Kalender"
          className={`lc-schwebeflaeche absolute z-modal top-full ${rechtsbuendig ? 'right-0' : 'left-0'} mt-1.5 w-[min(17.5rem,calc(100vw-2rem))] p-3 lc-reveal`}>
          {/* Kopf: Jahr-/Monatsblättern, Monat als Ablese-Anzeige */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex">
              <button type="button" onClick={() => blaettern(-12)} aria-label="Ein Jahr zurück" className={navBtn}>«</button>
              <button type="button" onClick={() => blaettern(-1)} aria-label="Ein Monat zurück" className={navBtn}>‹</button>
            </div>
            <p className="text-body-s font-semibold text-ink-900">
              {MONATE[m]} <span className="num text-ink-600">{jahr}</span>
            </p>
            <div className="flex">
              <button type="button" onClick={() => blaettern(1)} aria-label="Ein Monat vor" className={navBtn}>›</button>
              <button type="button" onClick={() => blaettern(12)} aria-label="Ein Jahr vor" className={navBtn}>»</button>
            </div>
          </div>

          {/* Tagesraster als ARIA-Grid (FAHRPLAN-DESIGN 3.1): Wochen-Zeilen,
              roving tabindex, Pfeiltasten via rasterTaste. Wochentags-Zeile
              auf das micro-Token statt Inline-0.6rem (Token-Treue). */}
          <div role="grid" aria-label={`${MONATE[m]} ${jahr}`} onKeyDown={rasterTaste} className="text-center">
            <div role="row" className="grid grid-cols-7 gap-0.5">
              {WTAGE.map((w) => (
                <div key={w} role="columnheader" className="lc-overline py-1">{w}</div>
              ))}
            </div>
            {Array.from({ length: Math.ceil(zellen.length / 7) }, (_, w) => zellen.slice(w * 7, w * 7 + 7)).map((woche, w) => (
              <div key={w} role="row" className="grid grid-cols-7 gap-0.5">
                {woche.map((d, i) => {
                  if (!d) return <div key={i} role="gridcell" />;
                  const iso = format(d, 'yyyy-MM-dd');
                  const istGewaehlt = gleicherTag(d, gewaehlt);
                  const istHeute = gleicherTag(d, heute);
                  return (
                    <button
                      key={i} type="button" role="gridcell" onClick={() => waehlen(d)}
                      data-iso={iso} tabIndex={iso === fokusIso || (!fokusImMonat && d.getDate() === 1) ? 0 : -1}
                      aria-label={format(d, 'dd.MM.yyyy')} aria-selected={istGewaehlt}
                      className={`num h-8 flex items-center justify-center rounded-md text-body-s transition-colors ${
                        istGewaehlt
                          // Haus-Auswahl-Anatomie (lc-chip-selected/SelectionGrid):
                          // brass-100-Fläche + brass-700-Tinte + brass-500-Ring.
                          // Vorher bg-brass-500 text-ink-900 — ink-900 flippt mit
                          // dem Thema und stand dunkel bei 2.25:1 auf dem Messington
                          // (a11y-Fang 31.8.2026, gefangen von e2e/a11y «Dunkel —
                          // Tagerechner mit offenem Kalender-Popover»).
                          ? 'bg-brass-100 text-brass-700 font-semibold ring-1 ring-inset ring-brass-500'
                          : 'text-ink-700 lc-hover-akzent'
                      }`}
                      style={!istGewaehlt && istHeute ? { boxShadow: 'inset 0 0 0 1px var(--brass-500)' } : undefined}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-2 pt-2 border-t border-line">
            <button type="button" onClick={() => waehlen(new Date())}
              className="text-body-s font-medium text-brass-700 hover:text-brass-600 px-2 py-1">
              Heute
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
