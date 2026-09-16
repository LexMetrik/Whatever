import { useEffect, useState } from 'react';
import { grussSkriptDaten, waehleBegruessung, waehleBegruessungFuerBuild } from '../../lib/begruessungen';

// ─── Begrüssung und Tagesdatum der Startseite (W2·23-STARTSEITE-V4 §4) ──────
//
// W2·24-R3: aus der Zeile «Gruss + Datum» ist ein HOOK geworden. Grund ist der
// Satzspiegel: der Gruss steht in der Textspalte (kursive Literata), Wochentag
// und Datum stehen in der Marginalie links — zwei Orte, EINE Uhrzeit. Genau
// dafür braucht es den gemeinsamen Aufruf; zwei Komponenten mit je eigenem
// `new Date()` könnten (nachts, an der Monatsgrenze) auseinanderlaufen.
// Wortlaut, Pool und Zufallsquelle sind unverändert.
//
// ZUFALL, bewusst UND an der richtigen Schicht (Auftrag David 5.9.2026
// «verschiedene Begrüssungen … etwas persönlicher»):
//  · bis 15.9.2026 zogen Prerender UND Client-Mount je einen EIGENEN
//    Zufallswert — die grösste Zeile der Seite tauschte nach dem JS-Download,
//    Lighthouse mass das als LCP bei 9.4 s (Befund in `lib/begruessungen.ts`);
//  · QS-PERF #879 (15.9.2026) fixierte den Gruss per Build-Seed aus dem
//    tageszeit-NEUTRALEN `IMMER`-Pool: kein Tausch mehr, aber Wechsel nur pro
//    DEPLOY und ohne Tageszeit-Bezug;
//  · 16.9.2026 (Entscheid David «a»): wieder PRO BESUCH und nach der ECHTEN
//    lokalen Stunde des Besuchers — ohne den Tausch zurückzubringen.
//
// WIE (16.9.2026): der Tausch entstand, weil ZWEI Stellen zogen. Jetzt zieht
// im Browser genau EINE, und zwar VOR dem ersten Paint. `SuchBlock` rendert
// direkt nach der h1 zwei <script>-Elemente:
//   1. `data-gruss="pools"` (`type="application/json"`): die Pools als DATEN
//      aus `grussSkriptDaten()` (§5 — keine Kopie der Grüsse im Skript-Code;
//      ein JSON-Datenblock wird nie ausgeführt und fällt nicht unter die CSP);
//   2. `data-gruss="wahl"`: `GRUSS_SKRIPT` unten, ein KONSTANTES klassisches
//      Inline-Skript. Der Parser hält an ihm an; es schreibt den Gruss der
//      Besuchsstunde in die h1 und legt ihn unter `window.__lexmetrikGruss`
//      ab. Weil der Text konstant ist, ist es auch sein sha256 — der steht in
//      der CSP von `vercel.json` (`script-src 'self' 'sha256-…'`, KEIN
//      `unsafe-inline`); `src/tests/begruessungen.test.ts` rechnet ihn nach.
// Der Client (`anfangsGruss`) übernimmt beim Mount GENAU diesen Text statt neu
// zu ziehen — unter `createRoot` (render-then-replace: gleicher Text, kein
// Tausch) wie unter `hydrateRoot` (Client-Text == DOM-Text, den das Skript
// schon geschrieben hat: kein Mismatch). Nur wo KEIN Skript lief (Client-
// Navigation auf «/», SPA-Fallback ohne Prerender) zieht der Client selbst —
// dort war vorher nichts zu sehen. Ohne JavaScript bleibt der deterministische
// Build-Gruss aus `IMMER` im Server-HTML stehen (tageszeit-neutral, also nie
// falsch). CLAUDE.md §2 ist nicht berührt: die Regel bindet die ENGINES; diese
// Zeile trägt keinen Rechtswert. `src/lib/**` bleibt rein — Uhr und Zufall
// leben nur hier und im Skript.
//
// PRERENDER: `datum`/`wochentag`
// bleiben live (echte Uhrzeit des Aufrufs) und divergieren wie bisher
// zwischen Build und Client; sie tragen darum weiterhin ehrlich
// `suppressHydrationWarning` (kleine Nebenzeile, nicht die LCP-h1). Ein
// min-height braucht `gruss` nicht: die Pool-Datei hält jeden Eintrag unter
// GRUSS_MAX_ZEICHEN (30), der Gruss bleibt also auch auf 390 px einzeilig
// (§15: kein Layout-Sprung, weil die Umbruchstelle nicht vom gezogenen Gruss
// abhängt).

// Datum «5. September 2026» + Wochentag getrennt — deterministisch ohne
// Locale-Abhängigkeit (SSR-stabil, keine Intl-Überraschungen zwischen Node und
// Browser).
const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export interface Heute {
  /** Gezogener Gruss aus dem Pool (`lib/begruessungen.ts`). */
  gruss: string;
  /** «Samstag» */
  wochentag: string;
  /** «5. September 2026» */
  datum: string;
  /** «14:32» — `null` vor der Hydration (Prerender UND erster Client-Render,
   *  s. `uhrzeit()` unten), danach jede Minute nachgeführt. NIE im
   *  Server-HTML: SuchBlock reserviert dafür Platz, statt ihn erst beim
   *  Erscheinen zu öffnen (§15, CLS 0). */
  uhrzeit: string | null;
}

// Build-Seed für `waehleBegruessungFuerBuild` — dieselbe Kennung, die
// `components/fehlermeldung.ts` schon für die Fehlerkanal-Zuordnung liest
// (§5, Single Source): Vercel-Commit-SHA (vite.config.ts `define`), sonst
// 'dev'. Identisch für `vite build` (Client-Bundle) UND
// `vite-node scripts/prerender.ts` (derselbe Vite-`define`, beide Schritte
// desselben `npm run build`-Aufrufs) — NIE eine Uhrzeit, die zwischen den
// zwei Prozessen leicht auseinanderliefe.
const BUILD_SEED = (import.meta.env?.VITE_BUILD_ID as string | undefined) ?? 'dev';

// ─── Inline-Skript: Gruss der Besuchsstunde VOR dem ersten Paint ───────────
// Steht im HTML direkt hinter `<h1>` und `<script data-gruss="pools">`
// (`SuchBlock`). `document.currentScript` findet den Datenblock als Vorgänger
// und die h1 im selben Elternknoten — ohne id, damit zwei Instanzen (Pane)
// sich nicht in die Quere kommen. Die Auswahl ist Zeichen für Zeichen
// `waehleBegruessung(stunde, Math.random)` über `t[s[stunde]] ++ i` =
// `begruessungsPool(stunde)` (Äquivalenz-Wächter im Unit-Test). try/catch: ein
// Fehler hier darf die Seite nie brechen — dann bleibt der Build-Gruss stehen.
// ACHTUNG: jede Änderung an diesem Text ändert seinen sha256 — die CSP in
// `vercel.json` im selben Commit nachführen (Wächter sonst rot).
export const GRUSS_SKRIPT =
  `(function(){try{var s=document.currentScript,d=JSON.parse(s.previousElementSibling.textContent),h=s.parentNode.querySelector('h1'),p=d.t[d.s[new Date().getHours()]].concat(d.i),g=p[Math.min(p.length-1,Math.floor(Math.random()*p.length))];if(h&&g){h.textContent=g;window.__lexmetrikGruss=g}}catch(e){}})()`;

/** Pools als JSON für `<script type="application/json" data-gruss="pools">`;
 *  `<` maskiert, damit kein Eintrag den Datenblock je schliessen könnte. */
export const GRUSS_DATEN_JSON = JSON.stringify(grussSkriptDaten()).replace(/</g, '\\u003c');

/** Der Gruss, mit dem `useHeute` startet (lazy init, einmal je Mount):
 *  1. ohne DOM (Prerender, Unit-Test): Build-Gruss — der Fallback-Text im
 *     Server-HTML, den sieht, wer kein JavaScript ausführt;
 *  2. hat das Inline-Skript gezogen: GENAU dieser Text (kein Tausch);
 *  3. steht die prerenderte h1 noch im DOM, das Skript lief aber nicht (etwa
 *     CSP-Hash veraltet): deren Text — lieber neutral als ein Tausch;
 *  4. sonst (Client-Navigation, SPA-Fallback ohne Prerender): selbst ziehen,
 *     aus dem Pool der lokalen Stunde — sichtbar war vorher nichts. */
function anfangsGruss(): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return waehleBegruessungFuerBuild(BUILD_SEED);
  }
  const gezogen = (window as { __lexmetrikGruss?: unknown }).__lexmetrikGruss;
  if (typeof gezogen === 'string' && gezogen) return gezogen;
  const gezeigt = document.querySelector('script[data-gruss="wahl"]')
    ?.parentElement?.querySelector('h1')?.textContent?.trim();
  if (gezeigt) return gezeigt;
  return waehleBegruessung(new Date().getHours(), Math.random);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** «14:32», 24-Stunden, ohne Locale-Abhängigkeit (wie Wochentag/Datum oben). */
function uhrzeit(jetzt: Date): string {
  return `${pad(jetzt.getHours())}:${pad(jetzt.getMinutes())}`;
}

/** Gruss, Wochentag und Datum aus EINER Uhrzeit (einmal beim Mount, lazy init).
 *
 *  UHRZEIT SEPARAT (D39, David 7.9.2026 «datum und uhrzeit»): Gruss/Wochentag/
 *  Datum bleiben wie bisher EIN Bild vom Mount-Zeitpunkt (§4-Kommentar oben —
 *  sie sollen nicht mitten in der Sitzung springen). Die Uhrzeit dagegen SOLL
 *  ticken; sie lebt darum in einem eigenen State, startet mit `null` (identisch
 *  zwischen Server- und erstem Client-Render, also keine Hydration-Divergenz
 *  UND kein Prerender-Wert, der beim Build einfriert) und wird erst im
 *  `useEffect` — also NACH der Hydration — gesetzt und danach jede Minute
 *  nachgeführt.
 *
 *  ZEITQUELLE INJIZIERBAR: bewusst KEIN eigener Injektions-Parameter hier —
 *  die Komponente ruft schlicht `new Date()`/`setInterval`, dieselben
 *  Globals, die Playwrights `page.clock` (verfügbar ab 1.45, hier 1.60)
 *  transparent abfängt. Ein zweiter, nur für Tests existierender Parameter
 *  wäre eine spekulative Abstraktion für einen Bedarf, den es schon gibt
 *  (Minimalismus-Prinzip, `.claude/rules/schichtentrennung.md`) — der e2e-
 *  Wächter (`e2e/d39-begruessung.e2e.ts`) installiert die Uhr vor `goto`. */
export function useHeute(): Heute {
  const [heute] = useState<Omit<Heute, 'uhrzeit'>>(() => {
    const jetzt = new Date();
    return {
      gruss: anfangsGruss(),
      wochentag: WOCHENTAGE[jetzt.getDay()],
      datum: `${jetzt.getDate()}. ${MONATE[jetzt.getMonth()]} ${jetzt.getFullYear()}`,
    };
  });
  const [zeit, setZeit] = useState<string | null>(null);
  useEffect(() => {
    const nachfuehren = () => setZeit(uhrzeit(new Date()));
    nachfuehren();
    const id = setInterval(nachfuehren, 60_000);
    return () => clearInterval(id);
  }, []);
  return { ...heute, uhrzeit: zeit };
}
