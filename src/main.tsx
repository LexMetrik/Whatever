import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
import { sitzungsSpeicher } from './lib/sichererSpeicher';

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
    if (!sitzungsSpeicher.lies('lex-chunk-reload')) {
      sitzungsSpeicher.schreib('lex-chunk-reload', '1')
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
