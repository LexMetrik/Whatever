import { useEffect } from 'react';
import { FehlSeite, type FehlWeg } from '../components/ui/FehlSeite';
import { SITE_TITEL } from '../lib/seo';

// 404 in der Familie der statischen Seiten (SeitenKopf): Overline + Ablesekante
// + Display-Titel. Statt einer Sackgasse mehrere geführte Wiedereinstiege.
//
// ── D-6 (Design-Konsistenz, 31.8.2026) · EINE FEHLSEITE ────────────────────
// Diese Seite war von den vier Fehl-Flächen die reglementskonformste — sie
// allein trug schon den `SeitenKopf` mit Overline, Ablesekante und H1. Genau
// darum ist sie die VORLAGE des geteilten Bausteins geworden und nicht sein
// Sonderfall. Zwei Dinge ändern sich hier trotzdem:
//   · TITEL «Diese Seite gibt es nicht.» → «Seite nicht gefunden». Der Baustein
//     baut den Titel aus dem Objekt, damit alle vier Flächen denselben Satzbau
//     tragen. §8: nichts abgeschwächt — die Erklärung darunter steht Wort für
//     Wort weiter da, und die drei Wege bleiben vollzählig.
//   · WEGE: Kanon-Pfeil «←» und eine `<nav>`-Landmark statt der `lc-list` —
//     dieselbe Zeile wie auf den drei anderen Fehlseiten.
// Die frühere `max-w-reading`-Klammer entfällt: der Lead trägt die Lesespalte
// seit dem Qualitäts-Pass 29.8.2026 im `SeitenKopf` selbst (T1/L5), und die
// Wege-Zeile ist keine Fliesstext-Zeile.
const WEGE: [FehlWeg, ...FehlWeg[]] = [
  { to: '/rechner', label: 'Alle Rechner' },
  { to: '/vorlagen', label: 'Alle Vorlagen' },
  { to: '/methodik', label: 'Methodik' },
  { to: '/kontakt', label: 'Kontakt' },
];

// DK-23 (HN-D6, 30.9.2026): das erste Ziel hiess «Katalog – alle Rechner & Vorlagen»
// und führte auf «/», die Startseite — die beiden Kataloge liegen seit dem Umbau
// unter `/rechner` und `/vorlagen` (Herz-und-Nieren-Prüfung 24.9.2026, DK-23).
// Darum zwei Ziele, je eines pro Katalog, statt einer Beschriftung, die das
// Ziel verfehlt.
// ── LM-188 (W2·17-UI-BEFUNDE/B14) · EIGENER SEITENTITEL, KEIN FREMDES CANONICAL ─
// Gemessen 4.9.2026 @1440 auf `/gibtesnicht` (Preview von origin/main): Tab-Titel
// UND `link[rel=canonical]` waren die der STARTSEITE. Herkunft: die 404-Adresse ist
// keine prerenderte Route, der SPA-Fallback liefert das Startseiten-HTML, und
// `RouteMeta` lässt den Head bei `metaFuerPfad(pfad) === null` bewusst unverändert
// (Kommentar dort: «Stub/NotFound/Redirects»). Für die 404-Fläche ist «unverändert»
// aber falsch: der Reiter log über seinen Inhalt (§8), und ein Canonical auf «/»
// erklärt eine Fehlseite zur Startseite. Darum setzt DIESE Seite ihren Head selbst
// und räumt ihn beim Verlassen wieder auf, damit `RouteMeta` die nächste Route
// unverändert bespielen kann.
//
// NICHT über `lib/seo` gelöst: ein Eintrag in `STATISCHE_SEITEN` liefe über
// `alleRouten()` in Prerender UND Sitemap — eine gesitemappte 404-Adresse ist ein
// Widerspruch in sich (dieselbe Herleitung, mit der dort der /international-
// Redirect ausgetragen ist).
//
// NICHT gebaut, weil widerlegt: der zweite Teil des Befundes («es fehlt die
// Breadcrumb-Leiste, die alle anderen Seiten haben»). Gemessen am selben Stand:
// /methodik, /kontakt und /einstellungen tragen ebenfalls KEINE Krumenleiste —
// die trägt nur, wer eine Detail-Route ist (`INHALT_RE`, InhaltsKopfKontext.ts).
// Das Seitengerüst der 404 entspricht also den statischen Schwesterseiten.
const TITEL_404 = 'Seite nicht gefunden — LexMetrik';

function useFehlseitenHead() {
  useEffect(() => {
    const vorher = document.title;
    document.title = TITEL_404;
    const canonical = document.querySelector('link[rel="canonical"]');
    const canonicalHref = canonical?.getAttribute('href') ?? null;
    canonical?.remove();
    const robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex');
    document.head.appendChild(robots);
    return () => {
      // Der Titel wird von `RouteMeta` nachgeführt, sobald die Zielroute Meta
      // trägt; der Rückfall deckt die Routen ohne Meta ab (dann steht wieder der
      // Head der Hülle da, nicht der 404-Titel).
      document.title = vorher === TITEL_404 ? SITE_TITEL : vorher;
      robots.remove();
      if (canonical && canonicalHref) {
        canonical.setAttribute('href', canonicalHref);
        document.head.appendChild(canonical);
      }
    };
  }, []);
}

export function NotFound() {
  useFehlseitenHead();
  return (
    <FehlSeite bereich="404 · Nicht gefunden" objekt="Seite" wege={WEGE}
      erklaerung="Die Adresse ist veraltet oder vertippt. Hier kommen Sie zurück ins Werkzeug:" />
  );
}
