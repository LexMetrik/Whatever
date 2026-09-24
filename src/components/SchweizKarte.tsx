import { useState } from 'react';
import { KANTONE_KARTE } from '../data/kantoneKarte';
import { STUFE_WORT, type ErfassungsStufe } from '../lib/normtext/erfassungsgrad';
import { markierungen } from './schweizKarteMarkierung';

/** Was die Karte über einen Kanton weiss. `null` = keine erfassten Erlasse. */
export interface KartenGrad {
  stufe: ErfassungsStufe;
  /** Fertiger Klartext für Bildunterschrift, Tooltip und aria-label (z. B. «3 Erlasse · Auswahl»). */
  text: string;
}

// ── Füllung = Bedeutung (Entscheid David 29.8.2026 «2B», Befund F1) ──────────
// Vorher streute `farbe(i)` einen Goldwinkel über den Farbkreis: 26 Pastelltöne,
// die NICHTS kodierten und keine Legende hatten. Jetzt trägt die Füllung genau
// eine Aussage — den Erfassungsgrad des Kantons (SSoT lib/normtext/
// erfassungsgrad.ts, §5: dieselbe Quelle wie Kachel-Badge, Sidebar-Einstufung
// und Schnellwechsel-Pill). Die Farbwerte liegen als Tokens in index.css
// (§13/B3 — keine Ad-hoc-Farben hier); diese Tabelle ist die EINE Stelle, die
// Stufe auf Token abbildet.
const FUELLUNG: Readonly<Record<ErfassungsStufe, string>> = Object.freeze({
  vollstaendig: 'var(--karte-voll)',
  auswahl: 'var(--karte-auswahl)',
  duenn: 'var(--karte-duenn)',
});

// Schraffur für Kantone ohne erfasste Erlasse. §11.6.8 «nie nur Farbe»: die drei
// Erfassungs-Stufen trennt die Luminanz, die vierte (neutrale) Stufe trennt
// zusätzlich eine TEXTUR — sie bleibt damit auch dann als «leer» erkennbar, wenn
// Farbe und Helligkeit nicht gelesen werden können.
const SCHRAFFUR_ID = 'karte-leer-schraffur';

// Strichstärken im viewBox-Raum (1052×744; die Karte rendert rund 640 px breit,
// ein viewBox-Punkt ist also etwa 0.6 CSS-px).
const KANTE = 1;
const RING_INNEN = { stark: 3, weich: 2 } as const;
const RING_GEHAEUSE = { stark: 6, weich: 4.5 } as const;

// ── `kompakt`: Trefferfläche für kleine Kantone (START-UEBERARBEITUNG U5,
// Befund U1-Bau 24.9.2026) ───────────────────────────────────────────────────
// In der schmalen Kantone-Spalte der Wahl-Stufe rendert dieselbe Karte auf
// ~200 px statt ~640 px — Basel-Stadt misst im viewBox-Raum nur rund 22×24
// Einheiten (gemessen an `KANTONE_KARTE.paths.BS`), bei 200 px Kartenbreite
// also rund 4×5 CSS-px: ein Zeigerklick trifft dort nicht zuverlässig.
//
// Fix nach Wahl (b) aus dem Auftrag: für jeden kleinen Kanton trägt ein
// umschliessendes `<g role="button" …>` ZWEI Kind-Pfade — den sichtbaren
// (dünner Rand, normale Füllung) und einen unsichtbaren mit breitem `stroke`
// (`pointerEvents="all"` — Füllung UND breiter Rand). Rolle/Label/Klick-Handler sitzen auf dem `<g>`,
// nicht auf dem sichtbaren Pfad allein: ein ERSTER Anlauf mit zwei GESCHWISTER-
// Pfaden auf gleicher Ebene liess Playwrights Ziel-Auflösung («target or
// descendant of target») am eigenen unsichtbaren Geschwister-Pfad scheitern
// (`<path …> intercepts pointer events`, rot gezeigt 24.9.2026) — beide Pfade
// als Kinder DESSELBEN zugänglichen Elements beheben das strukturell, nicht
// nur für Playwright: ein echter Zeigerklick zählt so oder so als Klick auf
// den Kanton. Die kleinen Kantone werden bei `kompakt` zusätzlich ANS ENDE der
// Zeichenfolge verschoben, damit ihr breiter Rand über jedem Nachbarn liegt —
// unabhängig von der Reihenfolge in `KANTONE_KARTE.paths`. Nur additiv über
// die neue Prop `kompakt` (Default `false`): alle anderen Aufrufer (u. a.
// `/gesetze`, Stufe „Kantone“) bleiben byte-gleich im Verhalten. Liste =
// Befund U1-Bau (kleinste Flächen auf der Karte); eine feste Breite statt
// einer Formel je Kanton, weil das Ziel „zuverlässig treffbar auf der
// schmalen Spalte“ ist, nicht ein exaktes Mass.
const KLEINE_KANTONE: readonly string[] = ['BS', 'ZG', 'AI', 'AR', 'NW', 'OW', 'SH', 'GE'];
const HALO_BREITE = 46;

/**
 * Markierungs-Ring über einem Kanton: dunkles Gehäuse (--karte-kante) UNTER dem
 * Messing-Ring (--karte-marke). Das Gehäuse ist der Grund, warum die Markierung
 * in BEIDEN Themes eine ≥3:1-Luminanzkante gegen jede mögliche Füllung hat — ein
 * Messing-Ring allein schafft das im Dunkelmodus gegen die kräftigen Stufen nicht
 * (gemessen 1.31:1 gegen «vollständig»). `fill="none"`: der Ring zeichnet nur die
 * Kontur und überschreibt die bedeutungstragende Füllung NICHT.
 */
function Ring({ d, stark }: { d: string; stark: boolean }) {
  const s = stark ? 'stark' : 'weich';
  return (
    <g aria-hidden pointerEvents="none">
      <path d={d} fill="none" stroke="var(--karte-kante)" strokeWidth={RING_GEHAEUSE[s]} strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--karte-marke)" strokeWidth={RING_INNEN[s]} strokeLinejoin="round" />
    </g>
  );
}

/** Ein Legenden-Eintrag: Farbfeld + Wort. Das Wort ist Text, nie nur die Farbe. */
function LegendeFeld({ fuellung, schraffiert, wort }: { fuellung: string; schraffiert?: boolean; wort: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm border"
        style={{
          borderColor: 'var(--karte-kante)',
          background: schraffiert
            ? `repeating-linear-gradient(45deg, ${fuellung} 0 2px, var(--karte-kante) 2px 3px)`
            : fuellung,
        }} />
      {wort}
    </li>
  );
}

/**
 * Interaktive Schweiz-Karte: jeder Kanton ist ein klickbarer Pfad, seine FÜLLUNG
 * kodiert den Erfassungsgrad (Legende unter der Karte). Hover/Fokus und Auswahl
 * markieren über einen RING, nicht über die Füllung — sonst überschriebe die
 * Bedienung die Aussage. Reine Darstellung (§3): die Stufe kommt fertig von
 * aussen, die Karte leitet nichts ab.
 */
export function SchweizKarte({ aktiv, onWaehle, nameFuer, verfuegbar, gradFuer, className, kompakt = false }: {
  aktiv?: string | null;
  onWaehle: (kanton: string) => void;
  nameFuer?: (kanton: string) => string;
  verfuegbar?: (kanton: string) => boolean;
  /** Erfassungsgrad je Kanton — `null`/fehlend = keine erfassten Erlasse (neutral + schraffiert). */
  gradFuer?: (kanton: string) => KartenGrad | null;
  className?: string;
  /** Karte rendert sehr schmal (Wahl-Spalte): vergrössert die Trefferfläche
   *  kleiner Kantone, siehe `KLEINE_KANTONE` oben. Default `false` — ohne die
   *  Prop bleibt jeder bestehende Aufrufer byte-gleich im Verhalten. */
  kompakt?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const name = (k: string) => (nameFuer ? nameFuer(k) : k);
  const grad = (k: string) => gradFuer?.(k) ?? null;
  // Tooltip-Text: Name + Zahl + Zustands-Wort. Damit steht die Aussage der
  // Füllung auch als TEXT bereit (§11.6.8 «nie nur Farbe») — für den Zeiger im
  // <title>, für Zeiger UND Tastaturfokus zusätzlich in der aria-live-
  // Bildunterschrift oben (onFocus setzt denselben Zustand wie onMouseEnter).
  // Das aria-label bleibt bewusst der reine Kantonsname (bzw. «— keine
  // Erlasse»): es ist der NAME des Bedienelements, und die Kantons-Walks
  // adressieren die Fläche exakt darüber (e2e gesetze-ia-v2-walks §11.6).
  const tooltip = (k: string) => {
    const g = grad(k);
    return g ? `${name(k)} — ${g.text}` : `${name(k)} — keine Erlasse`;
  };
  // Cowork-Befund 40 (18.8.2026): die Liste wurde FRÜHER hier nach aktiv/hover
  // sortiert (Kommentar war «Aktiven/gehoverten Kanton zuletzt zeichnen»), damit
  // sein Rand nicht von Nachbarn überdeckt wird. Das reordnete aber die
  // INTERAKTIVEN <path>-Elemente noch VOR dem Klick — schon `onMouseEnter` (das
  // jede reale Zeigergeste vor dem Klick auslöst) löste den Re-Render/Reorder
  // aus. Trifft der Mausklick dann denselben Bildschirmpunkt, kann
  // `mousedown`/`mouseup` durch die geänderte Maler-Reihenfolge auf verschiedene
  // Elemente fallen — der Browser liefert dann GAR KEIN `click` an den Pfad
  // (Ziel-Divergenz), und erst der ZWEITE Klick (Reorder bereits stabil) traf.
  // Reproduziert 18.8.2026 (echtes Hover-dann-Klick-Gesten-Muster via Playwright:
  // 1. Klick wirkungslos, 2. Klick setzt `kt=`; ein Klick OHNE vorherige
  // Zeigerbewegung traf sofort). Fix: fixe Grund-Reihenfolge (keine Sortierung
  // mehr) — die Hervorhebung kommt über SEPARATE, nicht-interaktive Ring-Pfade
  // ganz am Ende (unten), die nur zeichnen, nie einen Klick fangen.
  const eintraege = Object.entries(KANTONE_KARTE.paths);
  // Fehlerbuch-Befund 12 (Prüfung 29.8.2026) — BEHOBEN 29.8.2026:
  // Früher stand hier `const gezeigt = hover ?? aktiv` und speiste EINEN
  // Overlay-Pfad. Hover verdrängte damit den aktiven Kanton aus dem Overlay: Wer
  // über einen NACHBARN fuhr, verlor die Auswahl-Markierung unter der Maus und
  // bekam sie erst beim Verlassen zurück. Folgenlos war das nur, solange KEIN
  // Aufrufer `aktiv` übergab — also genau so lange, bis jemand die Karte im
  // Detail-Zustand stehen lässt. Jetzt zeichnen ZWEI unabhängige Ringe: der
  // aktive Kanton behält seinen (kräftigen) Ring immer, der gehoverte bekommt
  // zusätzlich einen weichen. `aktiv` ist damit kein scharfer toter Code mehr (§17).
  const ringe = markierungen(aktiv, hover);
  const aktivPfad = ringe.aktiv ? KANTONE_KARTE.paths[ringe.aktiv] : undefined;
  const hoverPfad = ringe.hover ? KANTONE_KARTE.paths[ringe.hover] : undefined;
  // Die Bildunterschrift folgt weiterhin dem Zeiger und fällt auf die Auswahl
  // zurück — dort ist die Verdrängung richtig, es kann nur EIN Text stehen.
  const gezeigt = hover ?? aktiv ?? null;
  return (
    <div className={className ?? 'w-full max-w-[40rem] mx-auto'}>
      {/* Bildunterschrift: zeigt, was unter dem Zeiger/Fokus liegt. `kompakt`:
          zusätzlich `overflow-hidden whitespace-nowrap` — auf der schmalen
          Spalte lief die dreiteilige Zeile (Name · Kürzel · Zustand) sonst um
          und wuchs auf zwei Zeilen, was die KARTE DARUNTER beim Hover nach
          unten schob (rot gezeigt 24.9.2026: ein `mousemove` auf einen
          kleinen Kanton verschob dessen eigene Fläche unter dem Zeiger, bevor
          `mousedown`/`mouseup` dort ankamen — derselbe Effekt träfe auch
          einen echten Zeiger, nicht nur den Test). `min-h` bleibt für BEIDE
          Modi die einzige Höhen-Klammer. */}
      <div className={`mb-2 flex items-baseline gap-2 min-h-[1.5rem]${kompakt ? ' overflow-hidden whitespace-nowrap' : ''}`} aria-live="polite">
        {gezeigt ? (
          <>
            <span className="text-body-s font-semibold text-ink-900">{name(gezeigt)}</span>
            <span aria-hidden className="num text-xs text-ink-500">{gezeigt}</span>
            {/* Wörter stehen in der Fliesstext-Stimme, nicht in der Mono-Stimme
                (Zwei-Stimmen-Regel, Review-Befund T6): `num` trägt oben das
                Kürzel, hier laufen «3 Erlasse · dünn» als Text. */}
            <span className="text-xs text-ink-500">{grad(gezeigt)?.text ?? '— keine Erlasse'}</span>
          </>
        ) : (
          <span className="text-xs text-ink-500">Kanton auf der Karte wählen</span>
        )}
      </div>
      <svg viewBox={KANTONE_KARTE.viewBox} role="group" aria-label="Karte der Schweizer Kantone — Kanton wählen"
        className="w-full h-auto">
        <defs>
          <pattern id={SCHRAFFUR_ID} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="var(--karte-leer)" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--karte-kante)" strokeWidth="2" />
          </pattern>
        </defs>
        {/* `kompakt`: die kleinen Kantone rücken ans ENDE der Zeichenfolge
            (Reihenfolge unverändert für alle anderen), damit ihre breitere
            Trefferfläche über jedem Nachbarn liegt, unabhängig davon, wie
            `KANTONE_KARTE.paths` selbst sortiert ist. */}
        {(kompakt
          ? [...eintraege].sort((a, b) => Number(KLEINE_KANTONE.includes(a[0])) - Number(KLEINE_KANTONE.includes(b[0])))
          : eintraege
        ).map(([k, d]) => {
          const ist = aktiv === k;
          const waehlbar = verfuegbar ? verfuegbar(k) : true;
          const g = grad(k);
          // Ohne Erfassungsgrad (kein Erlass — oder im aktiven Filter keiner
          // übrig) neutral UND schraffiert; sonst die Stufe als Füllung.
          const fill = g ? FUELLUNG[g.stufe] : `url(#${SCHRAFFUR_ID})`;
          const gemeinsam = {
            onClick: waehlbar ? () => onWaehle(k) : undefined,
            onMouseEnter: () => setHover(k),
            onMouseLeave: () => setHover((h: string | null) => (h === k ? null : h)),
            onFocus: () => setHover(k),
            onBlur: () => setHover((h: string | null) => (h === k ? null : h)),
            onKeyDown: waehlbar ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onWaehle(k); } } : undefined,
            tabIndex: waehlbar ? 0 : -1,
            role: 'button' as const,
            'aria-pressed': ist,
            'aria-label': waehlbar ? name(k) : `${name(k)} — keine Erlasse`,
            className: waehlbar ? 'cursor-pointer' : 'cursor-default',
          };
          // Tooltip trägt Zahl + Zustands-Wort — die Aussage der Füllung
          // steht damit auch als Text bereit (§11.6.8).
          const titel = <title>{tooltip(k)}</title>;
          if (!kompakt || !KLEINE_KANTONE.includes(k)) {
            return (
              <path key={k} d={d} {...gemeinsam} style={{ fill, stroke: 'var(--karte-kante)', strokeWidth: KANTE }}>
                {titel}
              </path>
            );
          }
          // Kleiner Kanton in `kompakt`: Rolle/Label/Handler sitzen auf dem
          // `<g>`, nicht auf dem sichtbaren Pfad — der breite unsichtbare
          // Treffer-Pfad ist dann ein DESCENDANT desselben zugänglichen
          // Elements statt eines Geschwisters (Begründung oben bei
          // `KLEINE_KANTONE`).
          return (
            <g key={k} {...gemeinsam}>
              {titel}
              {/* `pointerEvents="all"`: fängt die GANZE Geometrie (Füllung UND
                  Rand-Band), unabhängig von der (hier fehlenden) sichtbaren
                  Malung — `pointerEvents="stroke"` allein liess die MITTE des
                  Kantons klicklos (rot gezeigt 24.9.2026: Playwright klickt
                  auf die Bbox-Mitte, die im Innern liegt, nicht am Rand). */}
              <path d={d} aria-hidden fill="none" stroke="transparent" strokeWidth={HALO_BREITE}
                strokeLinejoin="round" pointerEvents="all" />
              <path d={d} aria-hidden pointerEvents="none" style={{ fill, stroke: 'var(--karte-kante)', strokeWidth: KANTE }} />
            </g>
          );
        })}
        {/* Nicht-interaktive Ring-Pfade: zeichnen die Markierung EIN zweites Mal
            obenauf, damit sie nicht von Nachbarn überdeckt wird — ohne dafür die
            interaktiven Pfade oben umzusortieren (Befund 40). `pointerEvents=
            "none"`: fangen selbst nie einen Klick, auch nicht bei überlappenden
            Rand-Pixeln. Zwei statt einem: siehe Befund 12 oben. */}
        {aktivPfad && <Ring d={aktivPfad} stark />}
        {hoverPfad && <Ring d={hoverPfad} stark={false} />}
      </svg>
      {/* Legende (Entscheid David 29.8.2026 «2B»): ohne sie wäre die Farbe eine
          unbeantwortete Frage — genau der Vorwurf aus Befund F1/49. Wort UND
          Farbfeld, in der Reihenfolge der Stufen (dicht → dünn → leer). */}
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
        <li className="lc-overline">Erfassungsgrad</li>
        <LegendeFeld fuellung="var(--karte-voll)" wort={STUFE_WORT.vollstaendig} />
        <LegendeFeld fuellung="var(--karte-auswahl)" wort={STUFE_WORT.auswahl} />
        <LegendeFeld fuellung="var(--karte-duenn)" wort={STUFE_WORT.duenn} />
        <LegendeFeld fuellung="var(--karte-leer)" schraffiert wort="keine Erlasse" />
      </ul>
    </div>
  );
}
