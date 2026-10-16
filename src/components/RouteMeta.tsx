// ─── RouteMeta: Head-Nachführung bei Client-Navigation (SSG-Etappe E2) ─────
//
// Dossier: docs/ssg-diagnose.md
//
// Das Prerender (scripts/prerender.ts) liefert jede Route mit individuellem
// <title>/description/canonical aus; bei SPA-Navigation bliebe sonst der
// Head der EINSTIEGS-Route stehen. Dieser Baustein führt die Werte aus
// derselben Quelle (lib/seo.ts, §5) nach — Vorbild ScrollToTop in App.tsx.
// useEffect läuft weder im Smoke noch im Prerender → SSR-neutral (§6).
// O-68: der Hash geht mit — bei Seiten, deren H1 ihm folgt (Zuständigkeit: #schkg, #straf), trägt
// auch der Tab-Titel die Weiche (`metaFuerPfad`, Wahl in `splitKarte`). Sonst ändert er nichts.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteMeta() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    let veraltet = false;
    // Dynamischer Import (§6.4): lib/seo zieht startseiteConfig — statisch
    // importiert wanderte der 65-kB-Katalog-Chunk in den Erstlade-Pfad.
    void import('../lib/seo').then(({ metaFuerPfad }) => {
      if (veraltet) return;
      const meta = metaFuerPfad(pathname, hash);
      if (!meta) return; // Stub/NotFound/Redirects: Head unverändert lassen
      document.title = meta.titel;
      document.querySelector('meta[name="description"]')?.setAttribute('content', meta.beschreibung);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.titel);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', meta.ogBeschreibung ?? meta.beschreibung);
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', meta.canonical);
      // canonical fehlt in der unbefüllten Hülle (index.html/app.html) → anlegen
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', meta.canonical);
    });
    return () => { veraltet = true; };
  }, [pathname, hash]);
  return null;
}
