import type { SperrfristenErgebnis } from '../lib/sperrfristen';

// Grafische Antwort für Kündigung + Sperrfristen: Zeitstrahl mit Zugang,
// Sperrfrist-Band und Beendigung bzw. – bei Nichtigkeit – «frühestens neu kündbar».
// Marker sitzen auf der Basislinie; Beschriftungen liegen oben (Zugang) und
// unten (Endpunkt) und werden an den Rändern bündig verankert, damit nichts
// überlappt oder aus der Karte ragt.

const TYP_LABEL: Record<string, string> = {
  krankheit_unfall: 'Krankheit/Unfall', schwangerschaft: 'Schwangerschaft',
  militaer_zivil: 'Militär/Zivil', hilfsaktion: 'Hilfsaktion', betreuungsurlaub: 'Betreuungsurlaub',
  mutterschaftsurlaub_verlaengert: 'Verläng. Mutterschaftsurlaub',
  zusatzurlaub_tod_elternteil: 'Zusatzurlaub (Tod Elternteil)', urlaub_tod_mutter: 'Urlaub (Tod Mutter)',
};

const fmt = (iso?: string) => (iso ? iso.split('-').reverse().join('.') : '–');
const ms = (iso?: string) => (iso ? new Date(iso).getTime() : NaN);

export function KuendigungTimeline({ e }: { e: SperrfristenErgebnis }) {
  const nichtig = e.status === 'nichtig';
  const punkte: number[] = [];
  [e.zugangISO, e.beendigungISO, e.fruehesteNeueKuendigungISO].forEach((d) => { const x = ms(d); if (!isNaN(x)) punkte.push(x); });
  (e.sperrIntervalle ?? []).forEach((iv) => { [iv.von, iv.bis].forEach((d) => { const x = ms(d); if (!isNaN(x)) punkte.push(x); }); });
  if (punkte.length < 2) return null;

  let t0 = Math.min(...punkte), t1 = Math.max(...punkte);
  const span = (t1 - t0) || 1; t0 -= span * 0.05; t1 += span * 0.05;
  const pos = (iso?: string) => { const x = ms(iso); return isNaN(x) ? 0 : Math.max(0, Math.min(100, ((x - t0) / (t1 - t0)) * 100)); };

  const endIso = nichtig ? e.fruehesteNeueKuendigungISO : e.beendigungISO;
  const endLabel = nichtig ? 'frühestens neu kündbar' : 'Beendigung';
  // A3-6 (R3-α, 31.8.2026): `--sage-500` → `--ok-solid` (wertidentisch).
// Das Ende der Frist ist eine ZUSTANDS-Aussage; `sage` ist die
// Materialien-Kennfarbe (§4b-B-i, Befunde 7+37).
const endFarbe = nichtig ? 'var(--brass-500)' : 'var(--ok-solid)';

  return (
    // data-ansicht: abgeleitete Ansicht (R4 Ziff. 3) — steht immer NACH dem
    // Verdikt, vom Tor `e2e/qsui-hierarchie.e2e.ts` (I1) geprüft.
    <div data-ansicht="kuendigung-zeitstrahl" className="lc-card p-5 lc-reveal space-y-3">
      <p className="lc-overline">Zeitstrahl</p>
      <div className="relative h-24" role="img" aria-label="Zeitstrahl der Kündigungsfrist mit Sperr-/Hemmungsphasen (Details in der Tabelle und im Rechenweg)">
        {/* Basislinie */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-line-strong" />

        {/* Sperrfrist-Bänder auf der Linie (vgl. Fristband im Kalender) */}
        {(e.sperrIntervalle ?? []).map((iv, i) => {
          const l = pos(iv.von), r = pos(iv.bis);
          const breite = Math.max(1.2, r - l);
          return (
            <div key={i}
              className="absolute top-1/2 -translate-y-1/2 h-6 rounded-full bg-warn-bg flex items-center justify-center overflow-hidden"
              style={{ left: `${l}%`, width: `${breite}%`, boxShadow: 'inset 0 0 0 1px var(--warn-500)' }}
              title={`Sperrfrist ${TYP_LABEL[iv.typ] ?? iv.typ}: ${fmt(iv.von)} – ${fmt(iv.bis)}`}>
              {breite > 22 && (
                <span className="text-warn-700 truncate px-2 text-micro">
                  {TYP_LABEL[iv.typ] ?? iv.typ}
                </span>
              )}
            </div>
          );
        })}

        {/* Zugang oben beschriftet, Endpunkt unten – Kollisionen ausgeschlossen */}
        <Marker p={pos(e.zugangISO)} iso={e.zugangISO} color="var(--ink-900)" label="Zugang" oben />
        {endIso && <Marker p={pos(endIso)} iso={endIso} color={endFarbe} label={endLabel} />}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-body-s text-ink-600 pt-3 border-t border-line">
        <Leg swatch="bg-ink-900" label="Zugang der Kündigung" />
        {(e.sperrIntervalle ?? []).length > 0 && <Leg band label="Sperrfrist" />}
        {nichtig
          ? <Leg swatch="bg-brass-500" label="frühestens neu kündbar" />
          : <Leg swatch="bg-ok-solid" label="Beendigung" />}
        {e.gehemmtTage ? <span className="num text-ink-500">· Hemmung: {e.gehemmtTage} Tage</span> : null}
      </div>
    </div>
  );
}

// Marker: Punkt exakt auf der Basislinie, Lot + Beschriftung darüber/darunter.
// Nahe den Rändern wird die Beschriftung bündig verankert statt zentriert.
function Marker({ p, iso, color, label, oben = false }: { p: number; iso?: string; color: string; label: string; oben?: boolean }) {
  if (!iso) return null;
  const anker: React.CSSProperties =
    p < 10 ? { left: 0, alignItems: 'flex-start', textAlign: 'left' }
    : p > 90 ? { right: 0, alignItems: 'flex-end', textAlign: 'right' }
    : { left: `${p}%`, transform: 'translateX(-50%)', alignItems: 'center', textAlign: 'center' };
  return (
    <>
      {/* Lot vom Punkt zur Beschriftung */}
      <span aria-hidden className="absolute w-px -translate-x-1/2"
        style={{ left: `${p}%`, background: color, opacity: 0.45,
          ...(oben ? { top: '0.9rem', bottom: 'calc(50% + 0.45rem)' } : { top: 'calc(50% + 0.45rem)', bottom: '0.9rem' }) }} />
      {/* Punkt auf der Linie */}
      <span className="absolute top-1/2 w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 z-sticky"
        style={{ left: `${p}%`, background: color, boxShadow: '0 0 0 2px var(--surface)' }} />
      {/* Beschriftung */}
      <div className="absolute flex flex-col pointer-events-none"
        style={{ ...(oben ? { top: 0 } : { bottom: 0 }), ...anker }}>
        <span className="num text-ink-700 whitespace-nowrap leading-tight text-micro">{fmt(iso)}</span>
        {/* DK-17 (30.9.2026): die BESCHRIFTUNG steht in Tinte, die Farbe trägt nur der
            Punkt (+ Lot, + Legende). `color` ist eine Nicht-Text-Rolle: als 11-px-Schrift
            misst `--ok-solid` «Beendigung» dunkel 3.68:1 auf `--surface` (< 4.5, SC 1.4.3);
            `--brass-500` «frühestens neu kündbar» lag im Befund 24.9.2026 bei 4.41:1. */}
        <span className="whitespace-nowrap font-medium leading-tight text-micro text-ink-900" style={{ order: oben ? -1 : 1 }}>{label}</span>
      </div>
    </>
  );
}

function Leg({ swatch, style, label, band }: { swatch?: string; style?: React.CSSProperties; label: string; band?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {band
        ? <span className="inline-block w-5 h-3 rounded-full bg-warn-bg" style={{ boxShadow: 'inset 0 0 0 1px var(--warn-500)' }} />
        : <span className={`inline-block w-3 h-3 rounded-full ${swatch ?? ''}`} style={style} />}
      {label}
    </span>
  );
}
