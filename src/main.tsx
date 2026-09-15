import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// LexMetrik-Typografie (W2·24-DESIGN-IDENTITAET R1, 6.9.2026): ZWEI Stimmen,
// beide OFL und selbst gehostet (kein Google-Fonts-Request zur Laufzeit).
//   · Archivo  = Bedienung (Reiter, Knöpfe, Marginalien, Meta-Zeilen)
//   · Literata = alles Gelesene (Normtext, Entscheide, Titel)
// Geist/Geist Mono/Source Serif 4 sind mit der Creme-Gold-Signatur gegangen.
// Geladen wird bewusst NUR die `wght`-Achse: die `wdth`-Achse von Archivo
// (Bedienbreite 87.5 % im Referenzbild) kostet im latin-Subset 90.1 KB statt
// 34.9 KB — +158 % Erstlast für eine Breitenstufe (§15). Entscheid dazu ist in
// R2/R5 offen; die Rückkehr wäre ein Import-Wechsel auf `wdth.css` plus
// `font-stretch: 87.5%`.
import '@fontsource-variable/archivo/wght.css'
import '@fontsource-variable/archivo/wght-italic.css'
// D12 «Lesekomfort» (6.9.2026): Literata AUFRECHT laeuft neu auf der
// `opsz`-Achse (optische Groesse). Serifen am Bildschirm brauchen sie — der
// Browser stellt mit `font-optical-sizing: auto` (index.css) den Schnitt auf die
// tatsaechliche Schriftgroesse ein, statt eine Textgroesse hochzuskalieren.
// Gemessen im latin-Subset: 110 080 B statt 52 496 B, also +57.6 KB. Das ist
// die eine bewusst gekaufte Erstlast dieser Runde.
// Die KURSIVE bleibt auf `wght`: sie traegt Randtitel und Gruss, nie
// Langlese-Fliesstext, und die opsz-Kursive kostete noch einmal +58.2 KB —
// das waere Budget fuer eine Achse, die an keiner Lesestelle wirkt (§15).
import '@fontsource-variable/literata/opsz.css'
import '@fontsource-variable/literata/wght-italic.css'
import './index.css'
import App from './App.tsx'
import { effektivesThema, wendeThemaAn } from './components/thema'
import { wendeSchriftskalaAn } from './components/layout/useSchriftskala'
import { wendeLeserOptionenAn } from './pages/gesetz-leser/leserOptionen'
import { meldeFehler } from './components/fehlermeldung'
import { fruehesSuchKuerzelStarten } from './components/suche/fruehesSuchKuerzel'
import { hydrationsPinSetzen } from './lib/hydration'

// Thema so früh wie möglich anwenden (vor dem ersten App-Render) — ohne
// CSP-verbotenes Inline-Script bleibt für Dunkel-Nutzer ein kurzes Aufblitzen
// des prerenderten Light-HTML; das hält es minimal.
wendeThemaAn(effektivesThema())
// Ebenso die gespeicherte Schriftskala (R3) vor dem ersten Render anwenden —
// kein Aufblitzen der Default-Grösse für Nutzer mit eigener Wahl.
wendeSchriftskalaAn()
// Und die gespeicherten Leser-Optionen (W2·5d G2a; seit S1 Fussnoten ·
// Änderungsvermerke · Rechtsprechung im Text — «Verweise» ist entfallen)
// als data-*-Attribute ans <html> — CSP-konform ohne Inline-Script, analog
// Thema/Schriftskala. Default 'an' ⇒ CSS-No-op ⇒ heutige Darstellung byte-gleich.
wendeLeserOptionenAn()
// ⌘K/«/» AB DEM ERSTEN PAINT (§17-Wurzel-Fix 4.9.2026, CI-Shard 3/8): die
// Kürzel-Bindung von `HeaderSuche` hängt an einem React-Effekt und existiert
// erst nach dem ersten Commit — bis dahin ging der Tastendruck verloren
// (gemessen am origin/main-Stand: 0/20 unmittelbar nach `domcontentloaded`).
// Dieser Aufruf registriert einen Vorlauf, der ihn auffängt und merkt; das
// Suchfeld löst ihn beim Mount ein. Hier auf Modul-Ebene, weil ein
// `type="module"`-Script implizit `defer` ist und damit VOR `DOMContentLoaded`
// läuft — die früheste Stelle, die die CSP (`script-src 'self'`, kein
// Inline-Script) überhaupt zulässt.
fruehesSuchKuerzelStarten()

// Veralteter Chunk nach einem Deploy: Vite feuert 'vite:preloadError', wenn ein
// vorab geladener Modul-Chunk fehlt (offener Tab zeigt auf alte Hashes). Einmal
// neu laden holt das frische index.html mit gültigen Hashes (per sessionStorage
// gegen eine Endlosschleife abgesichert). Ergänzt lazyRetry für Chunks, die nicht
// über einen Lazy-Import, sondern über modulepreload geladen werden.
window.addEventListener('vite:preloadError', () => {
  try {
    if (!sessionStorage.getItem('lex-chunk-reload')) {
      sessionStorage.setItem('lex-chunk-reload', '1')
      window.location.reload()
    }
  } catch { /* sessionStorage nicht verfügbar */ }
})

// O-1.9: Fehler ausserhalb des React-Baums (Event-Handler, async, Promises) erreichen
// den ErrorBoundary nicht. window.onerror/unhandledrejection fangen sie und melden
// gesampelt + datensparsam (nur Meldung + Route + Build). meldeFehler() wirft nie.
window.addEventListener('error', (e) => {
  meldeFehler(e.message || (e.error instanceof Error ? e.error.message : ''))
})
window.addEventListener('unhandledrejection', (e) => {
  const g = e.reason
  meldeFehler(g instanceof Error ? g.message : typeof g === 'string' ? g : 'Unhandled promise rejection')
})

// ─── Start: hydrieren, wo der Prerender die ECHTE App geschrieben hat ───────
//
// QS-BASIS (15.9.2026). Bis hierher startete JEDE Seite mit `createRoot()` —
// also render-then-replace: der Browser malt das prerenderte HTML, React wirft
// es nach dem JS-Download weg und malt es neu. Gemessen (Lighthouse Mobil,
// 4x CPU + langsames 4G, Median aus 3): Startseite LCP 9.20 s bei TBT 0 —
// das LCP-Element ist die prerenderte <h1>, die erst der Ersatz-Render
// «endgueltig» macht. Hydration behaelt den DOM, damit zaehlt der ERSTE Paint.
//
// WELCHE Seite hydriert wird, entscheidet NICHT eine Routenliste im Client
// (die waere eine zweite Wahrheit neben scripts/prerender.ts, §5), sondern ein
// Marker, den der Prerender an den Container schreibt:
//   · `data-prerender="app"`  → HTML kommt aus `entry-server` = dieser App
//                               ⇒ hydrierbar (die 64 Katalog-/Seiten-Routen).
//   · kein Marker             → Leser-Detailseiten (Erlasse/Entscheide/
//                               Materialien) mit bewusst ANDEREM SEO-Markup
//                               aus `lib/seo-detail`, und der SPA-Fallback
//                               `app.html` mit leerem #root ⇒ createRoot.
//
// WAECHTER (perf-Bauregel 5: «kein NAIVES hydrateRoot — ein Markup-Mismatch ist
// stiller Normtext-Verlust»). Er macht das Nicht-Naive aus:
//  (a) `onRecoverableError` meldet JEDEN Mismatch sichtbar auf der Konsole,
//      mit Route und erster Zeile — nichts scheitert mehr still;
//  (b) `window.__lexmetrikHydration` zaehlt mit, damit e2e darauf assertieren
//      kann (`e2e/hydration-startseite.e2e.ts`), statt Optik zu raten.
//  (c) Der Rueckfall selbst kommt aus React 19 und ist in react-dom 19.2.8
//      nachgelesen, nicht vermutet: `throwOnHydrationMismatch` wirft
//      («…this tree will be regenerated on the client»), und ohne umgebende
//      Suspense-Grenze greift der Root-Pfad «React was able to recover by
//      instead client rendering the entire root». Der schlechteste Fall ist
//      damit exakt das bisherige Verhalten (voller Client-Render), nie ein
//      halb ersetzter Baum und nie fehlender Text.
//  ACHTUNG, Grenze desselben Belegs: reine ATTRIBUT-Abweichungen wirft React
//  NICHT — es laesst den Server-Wert stehen und meldet in der Produktion gar
//  nichts. Darum muss jeder Client-Initialstate, der von einem Attribut
//  abhaengt, auf den Server-Zustand gepinnt sein (perf-Bauregel 2); die
//  Startseite tut das ueber `useSyncExternalStore` mit Werk-Schnappschuss.
type HydrationsStand = { modus: 'hydration' | 'client'; fehler: number; meldungen: string[] }

const wurzel = document.getElementById('root')!
const stand: HydrationsStand = { modus: 'client', fehler: 0, meldungen: [] }
;(window as unknown as { __lexmetrikHydration: HydrationsStand }).__lexmetrikHydration = stand

const baum = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

if (wurzel.dataset.prerender === 'app') {
  stand.modus = 'hydration'
  // Vor dem ersten Render: Zustandsquellen, die im Prerender leer sind, halten
  // sich fuer diesen einen Render an den Server-Stand (lib/hydration).
  hydrationsPinSetzen()
  hydrateRoot(wurzel, baum, {
    onRecoverableError: (fehler, info) => {
      const text = fehler instanceof Error ? fehler.message : String(fehler)
      stand.fehler += 1
      stand.meldungen.push(text)
      console.error(
        `[Hydration] ${window.location.pathname}: ${text.split('\n')[0]}`,
        info.componentStack ?? '',
      )
    },
  })
} else {
  createRoot(wurzel).render(baum)
}
