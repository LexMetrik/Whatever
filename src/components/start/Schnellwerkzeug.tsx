import { Suspense, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { lazyRetry } from '../../lazyRetry';
import { EinfacheFristForm } from '../forms/EinfacheFristForm';
import { StartFlaeche } from './StartFlaeche';
import { SCHNELL_WAHLEN, leseSchnellWahl, speichereSchnellWahl, type SchnellWahl } from './schnellwerkzeugWahl';

// ─── Startseite · Fläche «Schnellwerkzeug», wählbar (U2, 24.9.2026) ─────────
//
// David 24.9.2026: «ich möchte dass man bei den schnellwerkzeugen auswählen
// kann» → Frist · Verzugszins · Verjährung (FAHRPLAN-WERKBANK-UMBAU §5d-bis U2).
// Die Überschrift folgt der Wahl; die Wahl merkt sich der Browser
// (`schnellwerkzeugWahl.ts`, Komfort — ohne Speicher gilt «Frist»).
//
// §15 LADEN: Frist ist die Variante des Prerenders und bleibt im Startseiten-
// Bündel (unverändert gegenüber dem Stand vor U2). Verzugszins und Verjährung
// sind eigene Chunks (`lazyRetry`) und laden erst, wenn sie gewählt sind — oder
// schon beim Zeigen/Fokussieren ihres Reiters (Vorabruf), damit der Klick nicht
// auf das Netz wartet. Logikverlust-Bewertung: keiner — derselbe Code rechnet,
// nur später geladen; die Engines sind unverändert (§1/§2).
//
// §15 HÖHE: der Reiterinhalt steht in einer Bühne mit der Mindesthöhe
// `min-h-start-schnell` (Token). Das Kachelfeld ist per `subgrid` so hoch wie
// diese Fläche (W2·29-WERKBANK-START-LAYOUT «A bündig»); wechselte die Höhe mit
// der Variante, spränge beim Stammnutzer mit gespeicherter Wahl nach dem Laden
// das ganze Feld, und jeder Reiterwechsel zöge die Kacheln mit. Die Bühne ist
// darum so hoch wie die HÖCHSTE Variante (gemessen, siehe Token) — alle drei
// Varianten und der Ladeplatzhalter nehmen gleich viel Platz ein.
//
// A11y: `tablist` mit wanderndem tabindex (Pfeil links/rechts, Pos1/Ende),
// automatische Aktivierung wie ein Segment-Schalter; der Inhalt ist ein
// `tabpanel`, beschriftet vom aktiven Reiter. Eine <h2> je Fläche bleibt.

const VerzugszinsSchnellForm = lazyRetry(() => import('../forms/VerzugszinsSchnellForm').then((m) => ({ default: m.VerzugszinsSchnellForm })));
const VerjaehrungSchnellForm = lazyRetry(() => import('../forms/VerjaehrungSchnellForm').then((m) => ({ default: m.VerjaehrungSchnellForm })));

/** Vorabruf ohne Rendern — der Modul-Cache des Browsers macht den späteren
 *  `lazy`-Import sofort. Fehler still: `lazyRetry` versucht es beim Rendern neu. */
const VORABRUF: Partial<Record<SchnellWahl, () => Promise<unknown>>> = {
  verzugszins: () => import('../forms/VerzugszinsSchnellForm'),
  verjaehrung: () => import('../forms/VerjaehrungSchnellForm'),
};
const vorabruf = (w: SchnellWahl) => { VORABRUF[w]?.().catch(() => { /* s. o. */ }); };

export function Schnellwerkzeug() {
  // Lazy-Init liest den Speicher beim ersten Client-Render (render-then-replace,
  // main.tsx); der Prerender kennt keinen Speicher und zeigt «Frist».
  const [wahl, setWahl] = useState<SchnellWahl>(leseSchnellWahl);
  const basis = useId();
  const reiter = useRef<(HTMLButtonElement | null)[]>([]);
  const aktiv = SCHNELL_WAHLEN.find((w) => w.code === wahl)!;

  const waehle = (w: SchnellWahl) => {
    setWahl(w);
    speichereSchnellWahl(w);
  };

  const taste = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = SCHNELL_WAHLEN.findIndex((w) => w.code === wahl);
    const n = SCHNELL_WAHLEN.length;
    const ziel = e.key === 'ArrowRight' ? (i + 1) % n
      : e.key === 'ArrowLeft' ? (i - 1 + n) % n
        : e.key === 'Home' ? 0
          : e.key === 'End' ? n - 1 : -1;
    if (ziel < 0) return;
    e.preventDefault();
    waehle(SCHNELL_WAHLEN[ziel].code);
    reiter.current[ziel]?.focus();
  };

  return (
    <StartFlaeche titel={aktiv.titel}>
      <div role="tablist" aria-label="Schnellwerkzeug wählen" onKeyDown={taste}
        className="flex gap-1">
        {SCHNELL_WAHLEN.map((w, i) => {
          const gewaehlt = w.code === wahl;
          return (
            <button key={w.code} type="button" role="tab" id={`${basis}-${w.code}`}
              ref={(el) => { reiter.current[i] = el; }}
              aria-selected={gewaehlt} aria-controls={`${basis}-panel`} tabIndex={gewaehlt ? 0 : -1}
              data-schnell={w.code}
              onClick={() => waehle(w.code)}
              onPointerEnter={() => vorabruf(w.code)} onFocus={() => vorabruf(w.code)}
              className={`flex-auto whitespace-nowrap rounded-md px-1.5 py-1.5 font-sans text-xs @[16.5rem]:px-2 @[16.5rem]:text-body-s ${gewaehlt
                ? 'bg-surface font-semibold text-ink-900'
                : 'text-ink-600 hover:text-ink-900'}`}>
              {w.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${basis}-panel`} aria-labelledby={`${basis}-${wahl}`}
        data-schnell-panel={wahl} className="flex flex-col min-h-start-schnell-eng @[16.5rem]:min-h-start-schnell">
        {wahl === 'frist' ? (
          <div className="flex flex-1 flex-col gap-3">
            <EinfacheFristForm minimal />
            <p className="mt-auto font-sans text-xs leading-relaxed text-ink-500">
              Rückwärtsrechnung, Zustellart, Hemmung und Kalender im{' '}
              <Link to="/rechner/tagerechner" className="underline hover:text-reg-w">Fristenrechner</Link>.
            </p>
          </div>
        ) : (
          <Suspense fallback={<p className="font-sans text-body-s text-ink-500" aria-busy="true">Rechner wird geladen …</p>}>
            {wahl === 'verzugszins' ? <VerzugszinsSchnellForm /> : <VerjaehrungSchnellForm />}
          </Suspense>
        )}
      </div>
    </StartFlaeche>
  );
}
