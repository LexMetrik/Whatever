import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ROUTEN_MANIFEST, STATISCHE_SEITENROUTEN } from './routesManifest';
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
// Thema B, §5); seit dem QS-BASIS-Nachzug (15.9.2026) kommen die PRERENDERTEN
// statischen Seiten ebenso datengetrieben aus STATISCHE_SEITENROUTEN derselben
// Datei — `main.tsx` muss ihren Chunk vor dem Hydrieren nachschlagen können
// (Begründung dort). Hier stehen damit nur noch die Routen, die weder im
// Katalog noch prerendert sind: Redirects, dynamische Pfade, Catch-all.
// S-5c: Fristenspiegel AUFGELÖST (Auftrag David 10.6.2026 abends) — Link-Erbe
// alter Teilen-/.ics-Links übernimmt der Redirect auf die Fach-Rechner.
const FristenspiegelRedirect = lazyRetry(() => import('./pages/FristenspiegelRedirect').then((m) => ({ default: m.FristenspiegelRedirect })));
const RechnerStub = lazyRetry(() => import('./pages/RechnerStub').then((m) => ({ default: m.RechnerStub })));
// Rubrik V «Gesetze» (browsbare Rechtssammlung) — eigenständige Nav-Sektion,
// KEINE Katalog-Oberkategorie (oberkategorien.ts unberührt). Übersicht /gesetze
// wird prerendert (seo.ts), die Lesesicht /gesetze/:ebene/:key ist client-lazy
// (SPA-Fallback via vercel.json-Rewrite) — die Routenzahl bleibt stabil bei +1.
// Rank 2 (QS-PERF): der Gesetzes-Leser ist der schwerste Route-Chunk. Der Import-Thunk
// lebt in leserPrefetch.ts (EINE Quelle, §5), damit prefetchLeser() exakt denselben
// Chunk idle vorwärmen kann.
const GesetzLeser = lazyRetry(importGesetzLeser);
// Rubrik VI «Rechtsprechung» (Bundesgerichtsentscheide) — analog zu Gesetze:
// Übersicht /rechtsprechung wird prerendert (seo.ts), der Reader
// /rechtsprechung/:key ist client-lazy (SPA-Fallback). Routenzahl +1.
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
const MaterialLeser = lazyRetry(() => import('./pages/MaterialLeser').then((m) => ({ default: m.MaterialLeser })));
// W2·6c-DECKUNGS-SEITE (§11.5): «was wir nicht haben» — die Deckungs-Seite der
// Entstehungsgeschichte. Eigene statische Route UNTER /materialien; sie steht
// vor /materialien/:key, und weil alle Material-Schlüssel versal sind, kann der
// kleingeschriebene Pfad keinen Eintrag verschatten (Tor: routenManifest-Test).
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
      {/* Die statischen (= prerenderten) Seiten datengetrieben aus
          STATISCHE_SEITENROUTEN — dieselbe Liste, die main.tsx vor dem
          Hydrieren vorwärmt (§5, Herleitung oben). */}
      {STATISCHE_SEITENROUTEN.map((r) => (
        <Route key={r.pfad} path={r.pfad} element={<r.Comp />} />
      ))}
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
      <Route path="/gesetze/:ebene" element={<EbeneRedirect />} />
      <Route path="/gesetze/:ebene/:key" element={<GesetzLeser />} />
      {/* Rubrik VI «Rechtsprechung»: Übersicht (prerendert) + Reader (SPA-Fallback) */}
      <Route path="/rechtsprechung/:key" element={<EntscheidLeser />} />
      {/* Alt-Route «International» (IA-6 Stufe 2): Redirect auf die Säule, Anker abgebildet */}
      <Route path="/international" element={<InternationalRedirect />} />
      {/* Rubrik «Materialien»: Übersicht (prerendert) + Detail (Metadaten/Live-Link) */}
      <Route path="/materialien/:key" element={<MaterialLeser />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
