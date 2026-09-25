import { Link } from 'react-router-dom';
import { LexMetrikSiegel, LexMetrikWortmarke } from './Logo';
import { SAMMLUNG_BESTAND, SITE_KURZFORM } from '../../lib/seo';
import { NAVIGATION_META } from '../../lib/navigation';

// Footer (ausgebaut): dreispaltig – Marke + Kurzbeschrieb, Navigation,
// Hinweise; darunter Mono-Feinschriftzeile. Paper-Grund, obere Hairline.

// ── D26 (David 6.9.2026) · DER FUSS TRÄGT DIE META-ZIELE, UND ZWAR DIE EINE LISTE ──
// Die Seitenleiste zeigt seit D26 nur noch Inhalt; Einstellungen · Methodik ·
// Über · Kontakt · Datenschutz sind hierher gewandert. Sie werden dabei NICHT
// abgeschrieben, sondern aus derselben SSoT gelesen, die sie vorher in der
// Leiste zeichnete (`NAVIGATION_META`, lib/navigation.ts) — sonst gäbe es nach
// dem Umzug zwei Meta-Listen, die auseinanderlaufen können (§5). Vorher fehlte
// im Fuss ausgerechnet «Einstellungen»; mit der Ableitung kann das nicht mehr
// passieren.
//
// ── D36 (David 7.9.2026) · «EINSTELLUNGEN» KEHRT IN DIE SEITENLEISTE ZURÜCK ──
// … und zwar ALLEIN, nicht die anderen vier — sie steht wieder unten in
// `Sidebar.tsx`, abgesetzt durch eine eigene Haarlinie. Der Fuss liest darum
// weiterhin `NAVIGATION_META`, filtert das Einstellungen-Ziel aber heraus:
// dieselbe Angabe an zwei Orten wäre eine Dopplung (D4), und die Seitenleiste
// ist für ein Ziel, das man häufig braucht, der näherliegende Ort. Die vier
// übrigen (Methodik/Über/Kontakt/Datenschutz) bleiben unverändert hier.
//
// Die beiden Übersichts-Ziele (Rechner · Vorlagen) sind KEINE Meta-Ziele und
// stehen darum weiter literal davor:
//   Free/Pro-Zweiteilung aufgehoben (FAHRPLAN-EINE-HAUPTSEITE; Bug-Check
//   7.6.2026 M-2: die alten zwei Einträge zeigten auf dieselbe Seite).
//   W2·10-UI-NAV/N0a: der eine «Rechner & Vorlagen»-Eintrag zeigte auf «/»
//   (Startseite), nicht auf die Übersichten, die das Label verspricht — die tote
//   Verbindung ist zu zwei ehrlichen Zielen aufgelöst (/rechner · /vorlagen).
//
// Zwei Beschriftungen bleiben im Fuss länger als in der Leiste («Über
// LexMetrik», «Datenschutzerklärung»): der Fuss ist der Ort, an dem eine
// Pflichtseite mit ihrem vollen Namen stehen muss. Die Abweichung ist darum
// deklariert und nicht abgeleitet — sie betrifft nur den Text, nie das Ziel.
const FUSS_TEXT: Record<string, string> = {
  '/ueber': 'Über LexMetrik',
  '/datenschutz': 'Datenschutzerklärung',
};

const NAVIGATION = [
  { to: '/rechner', label: 'Rechner' },
  { to: '/vorlagen', label: 'Vorlagen' },
  ...NAVIGATION_META
    .filter((l) => l.ziel !== '/einstellungen') // D36: lebt allein in der Seitenleiste
    .map((l) => ({ to: l.ziel, label: FUSS_TEXT[l.ziel] ?? l.label })),
];

// Die Breite reicht die Shell herein (Seitenart-Tabelle `./seitenbreite`,
// W2·31 B1a), damit die Kanten des Fusses mit der Inhaltsspalte fluchten.
export function Footer({ breiteKlasse }: { breiteKlasse: string }) {
  return (
    <footer className="border-t-2 border-rule bg-paper mt-16">
      <div className={`${breiteKlasse} mx-auto px-5 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr] gap-x-12 gap-y-8`}>
        {/* Marke */}
        <div className="space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 no-underline" aria-label="LexMetrik – Startseite">
            <LexMetrikSiegel size={26} />
            <LexMetrikWortmarke />
          </Link>
          {/* Marken-Kurzbeschrieb aus der I2-SSoT (seo.ts, §5) — Bestands-
              Aufzählung + Methodik-Kurzform statt einer zweitgepflegten
              Marketing-Zeile. W2·24-R3 (Sprach-Diät, Fahrplan §6 (h)): hier stand
              `HERO_TITEL` = «Schweizer Recht an einem Ort»; die Konstante ist
              mit dem Slogan gestrichen, der Fuss nennt jetzt den Bestand. */}
          <p className="text-body-s text-ink-500 leading-relaxed max-w-[34ch]">
            {SAMMLUNG_BESTAND} {SITE_KURZFORM}
          </p>
        </div>

        {/* ── LM-139 / LM-145 (W2·17-UI-BEFUNDE/B16) · SPALTENHÖHEN AUSGLEICHEN ──
            Die sechs Links standen in EINER Kolonne (`space-y-2` über je
            `min-h-11`), also 6 × 44 px + 5 × 8 px. Gemessen 4.9.2026 @1440 auf /
            und /materialien/ESTV-KS-DBG-5A (Preview von origin/main): rund 52 px
            Zeilenabstand gegenüber der eng gesetzten Hinweis-Spalte daneben, und
            unter der Marken-Spalte blieb eine grosse leere Fläche. LM-139 und
            LM-145 sind derselbe Defekt auf zwei Routen — ein Posten.

            DIE 44 PX BLEIBEN. Das weite Zeilenmass ist kein Zierrat, sondern das
            Ergebnis des Responsive-Audit-Fixes D2 (Fuss-Tap-Ziele 44 px, WCAG
            2.5.8 / FAHRPLAN-UI-NAVIGATION §4 R6). Zusammendrücken nähme genau den
            zurück; der zulässige Weg ist der Ausgleich der HÖHEN ohne
            Verkleinerung der Trefferflächen. Darum stehen die Links ab `sm` in
            zwei Kolonnen: gleiche Tap-Fläche je Link, halbe Spaltenhöhe. Unter
            `sm` bleibt es einspaltig — dort ist der Fuss ohnehin gestapelt. */}
        <nav aria-label="Footer-Navigation">
          <p className="lc-overline mb-3">Navigation</p>
          {/* ── R8 «Nichts abgeschnitten» (7.9.2026) · EIN LANGES WORT DARF SEINE
              SPALTE NIE SPRENGEN ────────────────────────────────────────────
              Gemessen auf ALLEN 25 Sweep-Routen x 1024/1280/1440 x hell/dunkel:
              150 Funde der Kategorie a, immer derselbe Link — «Datenschutz-
              erklaerung» braucht 137 px, die `sm:grid-cols-2`-Spalte bietet
              124 px (Nav-Spalte ~272 px, minus `gap-x-6`). Das Wort ist EIN
              Token, also greift der normale Wortumbruch nicht: es lief 13 px
              aus seiner Zelle.
              KEINE Ruecknahme von LM-139/B16 (zwei Kolonnen zum Hoehenausgleich)
              und keine von D2 (44 px Tap-Ziel, WCAG 2.5.8): beides bleibt. Statt
              die Spalte auf eine Magic-Number-Breite zu ziehen, die beim naechsten
              laengeren Label und bei jeder Stufe des Schriftgroessen-Reglers wieder
              risse, darf das Wort selbst brechen: `lc-wortumbruch` (Rezept in
              index.css, dieselbe Wurzel traegt auch die Bereichs-Kacheln und die
              Sektions-Titel des Lesers). Waechst dadurch eine Zeile auf zwei,
              bleibt die Trefferflaeche >= 44 px (`min-h-11` ist ein Minimum,
              kein Deckel). */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {NAVIGATION.map((n) => (
              <Link key={n.label} to={n.to}
                className="flex items-center min-h-11 lc-wortumbruch text-body-s text-ink-600 hover:text-ink-900 underline underline-offset-2 decoration-rule-soft hover:decoration-ink-900 transition-colors">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Hinweise */}
        <div className="space-y-2">
          <p className="lc-overline mb-3">Hinweise</p>
          <p className="text-body-s text-ink-500 leading-relaxed">
            Orientierung, keine Rechtsberatung. Ergebnisse und Entwürfe sind im
            Einzelfall fachlich zu prüfen.
          </p>
          <p className="text-body-s text-ink-500 leading-relaxed">
            Normverweise führen auf die amtliche Sammlung:{' '}
            <a href="https://www.fedlex.admin.ch" target="_blank" rel="noopener noreferrer"
              className="text-ink-900 underline underline-offset-2">fedlex.admin.ch</a>
          </p>
          {/* Präzisiert (Cowork-Befund 31, 18.8.2026): der Pauschalsatz «Ihre
              Eingaben verlassen den Browser nicht» stand im Widerspruch zur
              Online-Volltextsuche, deren Fusszeile ehrlich sagt, dass
              Suchbegriffe den Browser dafür verlassen (§8). Der Satz nennt
              jetzt seinen Geltungsbereich; die Ausnahme steht dort, wo sie
              anfällt — an der Online-Suche selbst. */}
          <p className="text-body-s text-ink-500 leading-relaxed">
            Eingaben in Rechnern und Vorlagen verlassen den Browser nicht; nur
            Online-Suchen senden die Suchbegriffe an den jeweiligen Suchdienst.
          </p>
        </div>
      </div>

      {/* Feinschriftzeile */}
      <div className="border-t border-rule-soft">
        <div className={`${breiteKlasse} mx-auto px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2`}>
          <p className="lc-fineprint">© 2026 LexMetrik</p>
          <p className="lc-fineprint sm:text-right">
            Orientierungsrechner · keine Rechtsberatung · läuft vollständig im Browser
          </p>
        </div>
      </div>
    </footer>
  );
}
