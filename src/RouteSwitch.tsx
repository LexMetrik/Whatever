import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ROUTEN_MANIFEST } from './routesManifest';
import { lazyRetry } from './lazyRetry';
import { importGesetzLeser, importEntscheidLeser } from './leserPrefetch';

// ─── Routen-Baum (eine Quelle) ─────────────────────────────────────────────
//
// Split-View-Fundament (Strang B-0, verhaltensneutral): Der <Routes>-Baum ist
// aus App.tsx herausgezogen, damit GENAU DERSELBE Baum später in zwei Routern
// laufen kann — der Primär-Pane im bestehenden <BrowserRouter> (treibt die URL),
// ein Sekundär-Pane in einem <MemoryRouter> (eigene History/Scroll). §5: Es gibt
// weiterhin nur EINE Routendefinition. App.tsx rendert <RouteSwitch /> an
// derselben Stelle wie zuvor → Verhalten + Prerender unverändert (Golden/Build).
//
// Code-Splitting auf Routenebene: Jede Seite ist ein eigener Chunk – der
// Erstbesuch lädt nur Shell + angefragte Seite, nicht alle Engines/Wizards.
// Reine Ladezeitpunkt-Änderung (CLAUDE.md §6.4), keine Logik betroffen.
// Karten-Routen (Rechner/Vorlagen) kommen datengetrieben aus dem
// ROUTEN_MANIFEST (src/routesManifest.ts), katalog-gegated (FUNDAMENT-UMBAU
// Thema B, §5). Hier stehen nur die Sonderrouten, die bewusst NICHT im
// Katalog sind.
const Startseite = lazyRetry(() => import('./pages/Startseite').then((m) => ({ default: m.Startseite })));
// Rubrik-Übersichten (UI-Welle): /rechner und /vorlagen lösen die frühere
// /recherche-Such-Seite ab — eigene Browse-Übersichten analog /gesetze; die
// Suche lebt seither im Header-Dropdown.
const RechnerUebersicht = lazyRetry(() => import('./pages/RechnerUebersicht').then((m) => ({ default: m.RechnerUebersicht })));
const VorlagenUebersicht = lazyRetry(() => import('./pages/VorlagenUebersicht').then((m) => ({ default: m.VorlagenUebersicht })));
// S-5c: Fristenspiegel AUFGELÖST (Auftrag David 10.6.2026 abends) — Link-Erbe
// alter Teilen-/.ics-Links übernimmt der Redirect auf die Fach-Rechner.
const FristenspiegelRedirect = lazyRetry(() => import('./pages/FristenspiegelRedirect').then((m) => ({ default: m.FristenspiegelRedirect })));
const RechnerStub = lazyRetry(() => import('./pages/RechnerStub').then((m) => ({ default: m.RechnerStub })));
const Methodik = lazyRetry(() => import('./pages/Methodik').then((m) => ({ default: m.Methodik })));
const Ueber = lazyRetry(() => import('./pages/Ueber').then((m) => ({ default: m.Ueber })));
const Kontakt = lazyRetry(() => import('./pages/Kontakt').then((m) => ({ default: m.Kontakt })));
const Datenschutz = lazyRetry(() => import('./pages/Datenschutz').then((m) => ({ default: m.Datenschutz })));
const Einstellungen = lazyRetry(() => import('./pages/Einstellungen').then((m) => ({ default: m.Einstellungen })));
// UI-NAV S3/E1: Korpus-Abdeckungsseite «Was ist drin» (Suche-Fusszeile verlinkt hierher).
const Abdeckung = lazyRetry(() => import('./pages/Abdeckung').then((m) => ({ default: m.Abdeckung })));
// UI-NAV S5: Volltext-Ergebnisseite (?q=) — macht die im Dropdown gekappten
// Treffer zugänglich (bes. die Gesetzestext-Gruppe). Additiv zum A5/A6-Dropdown.
const Suche = lazyRetry(() => import('./pages/Suche').then((m) => ({ default: m.Suche })));
// Rubrik V «Gesetze» (browsbare Rechtssammlung) — eigenständige Nav-Sektion,
// KEINE Katalog-Oberkategorie (oberkategorien.ts unberührt). Übersicht /gesetze
// wird prerendert (seo.ts), die Lesesicht /gesetze/:ebene/:key ist client-lazy
// (SPA-Fallback via vercel.json-Rewrite) — die Routenzahl bleibt stabil bei +1.
const Gesetze = lazyRetry(() => import('./pages/Gesetze').then((m) => ({ default: m.Gesetze })));
// Rank 2 (QS-PERF): der Gesetzes-Leser ist der schwerste Route-Chunk. Der Import-Thunk
// lebt in leserPrefetch.ts (EINE Quelle, §5), damit prefetchLeser() exakt denselben
// Chunk idle vorwärmen kann.
const GesetzLeser = lazyRetry(importGesetzLeser);
// Rubrik VI «Rechtsprechung» (Bundesgerichtsentscheide) — analog zu Gesetze:
// Übersicht /rechtsprechung wird prerendert (seo.ts), der Reader
// /rechtsprechung/:key ist client-lazy (SPA-Fallback). Routenzahl +1.
const Rechtsprechung = lazyRetry(() => import('./pages/Rechtsprechung').then((m) => ({ default: m.Rechtsprechung })));
const EntscheidLeser = lazyRetry(importEntscheidLeser);
// Rubrik «International»: die Übersicht lebt kanonisch in der Gesetzes-Säule
// /gesetze?ebene=international (IA-6 Stufe 2, FAHRPLAN-GESETZES-UX §11.4 Ziff. 3
// / §11.8 Y-C, David-Go 3.8.2026). Die frühere Alias-Seite /international ist
// AUFGELÖST — geblieben ist ihr Link-Erbe: dieser Redirect bildet die fünf
// Sach-Anker auf die Säule ab (Server-Seite: 308 in vercel.json). Nicht mehr
// prerendert, darum Routenzahl −1 (scripts/prerender.ts).
const InternationalRedirect = lazyRetry(() => import('./pages/InternationalRedirect').then((m) => ({ default: m.InternationalRedirect })));
// Rubrik «Materialien»: amtliche Ressourcen / Soft-Law (Kreisschreiben,
// Wegleitungen, Leitfäden …) — alle nur-live-link (amtliche Quelle), kein
// Volltext-Snapshot. Übersicht /materialien wird prerendert, Detail /materialien/:key
// als Metadaten-/Live-Link-Seite (seo-detail.ts). Routenzahl +1.
const Materialien = lazyRetry(() => import('./pages/Materialien').then((m) => ({ default: m.Materialien })));
const MaterialLeser = lazyRetry(() => import('./pages/MaterialLeser').then((m) => ({ default: m.MaterialLeser })));
// W2·6c-DECKUNGS-SEITE (§11.5): «was wir nicht haben» — die Deckungs-Seite der
// Entstehungsgeschichte. Eigene statische Route UNTER /materialien; sie steht
// vor /materialien/:key, und weil alle Material-Schlüssel versal sind, kann der
// kleingeschriebene Pfad keinen Eintrag verschatten (Tor: routenManifest-Test).
const MaterialienDeckung = lazyRetry(() => import('./pages/MaterialienDeckung').then((m) => ({ default: m.MaterialienDeckung })));
const NotFound = lazyRetry(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// Alt-Routen der aufgehobenen Free/Pro-Zweiteilung (FAHRPLAN-EINE-HAUPTSEITE
// E2, Auftrag David 7.6.2026): /pro, /fachpersonen, /rechner → «/».
// DAUERHAFT, kein Übergangs-Provisorium — alte Permalinks (?gebiet=, ?q=,
// ?modus=) und versendete .ics-Kalenderlinks tragen die alten Pfade; der
// Suchstring bleibt deshalb erhalten.
function AltRouteRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/${search}`} replace />;
}

// Cowork-Befund 13 (18.8.2026): `/gesetze/:ebene` (ohne Schlüssel — z. B. ein
// abgeschnittener/veralteter Link auf `/gesetze/bund`) lieferte 404 statt der
// gefilterten Übersicht. `/gesetze/:ebene/:key` (Zeile unten) bleibt die
// Lesesicht; diese Route fängt NUR den Zwei-Segment-Fall ab. Unbekannte Ebene
// (Tippfehler, alter Wert) → neutral `/gesetze` statt eines zweiten 404.
function EbeneRedirect() {
  const { ebene } = useParams();
  const bekannt = ebene === 'bund' || ebene === 'kanton' || ebene === 'international';
  return <Navigate to={bekannt ? `/gesetze?ebene=${ebene}` : '/gesetze'} replace />;
}

/**
 * Die EINE Routendefinition der App. Rendert pfadabhängig die passende Seite.
 * Muss in einem Router-Kontext (BrowserRouter) stehen.
 *
 * `location` (Split-View B-1): Wird ein Pfad übergeben, rendert dieser Schalter
 * die Seite für DIESE Location statt für die aktuelle URL — react-routers
 * unterstützte Mehrfach-Sicht-Primitive (`<Routes location>`). So zeigt ein
 * sekundäres Pane einen ZWEITEN Erlass/Rechner im SELBEN BrowserRouter, OHNE
 * einen zweiten Router zu verschachteln (verboten in react-router v7).
 */
export function RouteSwitch({ location }: { location?: string }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Startseite />} />
      {/* Rubrik-Übersichten (UI-Welle): Rechner + Vorlagen je eigene Seite. */}
      <Route path="/rechner" element={<RechnerUebersicht />} />
      <Route path="/vorlagen" element={<VorlagenUebersicht />} />
      {/* /recherche aufgelöst → auf die Rechner-Übersicht (alte Permalinks). */}
      <Route path="/recherche" element={<Navigate to="/rechner" replace />} />
      {/* Alt-Routen (Free/Pro aufgehoben): alle auf die eine Hauptseite */}
      <Route path="/pro" element={<AltRouteRedirect />} />
      <Route path="/fachpersonen" element={<AltRouteRedirect />} />
      {/* Karten-Routen (Rechner + Vorlagen) datengetrieben aus dem
          katalog-gegateten ROUTEN_MANIFEST — Reihenfolge wie zuvor
          (Rechner, dann Vorlagen); react-router v6 rankt konkrete vor
          dynamischen Pfaden, der Stub /rechner/:slug unten greift erst danach. */}
      {ROUTEN_MANIFEST.map((r) => (
        <Route key={r.pfad} path={r.pfad} element={<r.Comp />} />
      ))}
      {/* Sonderroute (nicht im Katalog): erbt alte Fristenspiegel-/.ics-Links */}
      <Route path="/rechner/fristenspiegel" element={<FristenspiegelRedirect />} />
      {/* Noch nicht implementierte Rechner (geplant / in Vorbereitung) */}
      <Route path="/rechner/:slug" element={<RechnerStub />} />
      {/* Rubrik V «Gesetze»: Übersicht (prerendert) + Lesesicht (SPA-Fallback) */}
      <Route path="/gesetze" element={<Gesetze />} />
      <Route path="/gesetze/:ebene" element={<EbeneRedirect />} />
      <Route path="/gesetze/:ebene/:key" element={<GesetzLeser />} />
      {/* Rubrik VI «Rechtsprechung»: Übersicht (prerendert) + Reader (SPA-Fallback) */}
      <Route path="/rechtsprechung" element={<Rechtsprechung />} />
      <Route path="/rechtsprechung/:key" element={<EntscheidLeser />} />
      {/* Alt-Route «International» (IA-6 Stufe 2): Redirect auf die Säule, Anker abgebildet */}
      <Route path="/international" element={<InternationalRedirect />} />
      {/* Rubrik «Materialien»: Übersicht (prerendert) + Detail (Metadaten/Live-Link) */}
      <Route path="/materialien" element={<Materialien />} />
      <Route path="/materialien/deckung" element={<MaterialienDeckung />} />
      <Route path="/materialien/:key" element={<MaterialLeser />} />
      <Route path="/methodik" element={<Methodik />} />
      <Route path="/ueber" element={<Ueber />} />
      <Route path="/kontakt" element={<Kontakt />} />
      <Route path="/datenschutz" element={<Datenschutz />} />
      <Route path="/einstellungen" element={<Einstellungen />} />
      <Route path="/abdeckung" element={<Abdeckung />} />
      <Route path="/suche" element={<Suche />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
