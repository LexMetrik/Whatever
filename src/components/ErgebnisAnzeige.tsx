import { useEffect, useMemo, useState } from 'react';
import type { Berechnungsergebnis, BerechnungsStatus } from '../types/legal';
import { RechtsprechungAnker } from './RechtsprechungLink';
import { NormText } from './NormText';
import { AbschnittKopf } from './layout/AbschnittKopf';
// FAHRPLAN-DESIGN 2.6: lokaler NormChip entfernt — NormLink (vorlagen/ui)
// ist die EINE Fedlex-Chip-Komponente (deckt «bemerkung» jetzt mit ab).
import { KopierButton, NormLink } from './vorlagen/ui';

// Status-Badges (Design-Doc 5.8): gesichert→sage · umstritten/kein Anspruch→warn · nichtig/unzulässig→danger.
// «verdikt» färbt den Hauptsatz (Design-Review 6.6.2026): ok bleibt neutrale
// Tinte (das positive Signal trägt das sage-Badge), Problem-Status färben.
// «hint» präzisiert das knappe Badge-Wort per Tooltip (nur wo mehrdeutig).
const STATUS_CONFIG: Record<BerechnungsStatus, { label: string; cls: string; verdikt: string; hint?: string }> = {
  ok:            { label: 'Gültig',        cls: 'lc-badge lc-badge-ok',     verdikt: 'text-ink-900',
                   hint: 'Die Berechnung ergibt keinen Gültigkeits-Vorbehalt – Hinweise und Annahmen unten beachten.' },
  nichtig:       { label: 'NICHTIG',       cls: 'lc-badge lc-badge-danger', verdikt: 'text-danger-700' },
  kein_anspruch: { label: 'Kein Anspruch', cls: 'lc-badge lc-badge-warn',   verdikt: 'text-warn-700' },
  unzulaessig:   { label: 'Unzulässig',    cls: 'lc-badge lc-badge-danger', verdikt: 'text-danger-700' },
  ktg_regime:    { label: 'KTG-Regime',    cls: 'lc-chip',                  verdikt: 'text-ink-900' },
};

// Domänenneutral – der rechtsgebietsspezifische Disclaimer steht im jeweiligen
// Formular und in der PDF-Konfiguration. Hier darf kein Text eines einzelnen
// Rechtsgebiets stehen (kein Cross-Domain-Bleed am Bildschirm).
const DISCLAIMER =
  'Automatisierte Orientierungsberechnung – keine Rechtsberatung. ' +
  'Massgeblich sind Gesetz, Vertrag und der konkrete Sachverhalt; abweichende Regelungen gehen vor. ' +
  'Norm- und Rechtsprechungsverweise sind im Einzelfall zu prüfen.';

type Props = {
  titel: string;
  ergebnis: Berechnungsergebnis;
};

// LM-173 (Fahrplan B5, §6): Rechenweg/Annahmen/Hinweise sind einklappbar und
// standardmässig oft ZU — der Inhalt ist dann gar nicht im DOM (React
// conditional render), ein reines Druck-CSS kann ihn also nicht «wieder
// sichtbar» machen. `window.matchMedia('print')` erzwingt statt dessen den
// offenen Zustand NUR für den Druckdurchgang, ohne die eigentliche
// UI-Wahl des Nutzers zu verändern (kein setState auf den echten offen-
// Flags). SSR-sicher (matchMedia existiert nicht im Prerender → Default
// false, byte-gleich zum bisherigen ersten Render, §6). Cross-Browser
// über matchMedia statt beforeprint/afterprint (in Firefox nicht immer
// verlässlich) — dieselbe Technik, mit der `page.emulateMedia({ media:
// 'print' })` in den e2e-Specs geprüft werden kann (kein Sonderfall nur
// für echte Drucker-Dialoge).
function useDruckErzwingtOffen(): boolean {
  // Lazy-Init statt setState im Effect-Body (react-hooks/set-state-in-effect,
  // vermeidet einen kaskadierenden Extra-Render): der Initialwert liest
  // matchMedia synchron im ERSTEN Client-Render — SSR-sicher, da window dort
  // fehlt und der try/catch auf false fällt.
  const [drucktGerade, setDrucktGerade] = useState(() => {
    try { return window.matchMedia('print').matches; } catch { return false; }
  });
  useEffect(() => {
    let mql: MediaQueryList;
    try { mql = window.matchMedia('print'); } catch { return; }
    const auf = () => setDrucktGerade(mql.matches);
    mql.addEventListener('change', auf);
    return () => mql.removeEventListener('change', auf);
  }, []);
  return drucktGerade;
}

function ergebnisAlsText(titel: string, e: Berechnungsergebnis): string {
  const z: string[] = [titel, '', e.ergebnis, '', 'Rechenweg:'];
  e.rechenweg.forEach((s, i) => z.push(`${i + 1}. ${s.beschreibung}: ${s.zwischenergebnis}`));
  if (e.normverweise.length) z.push('', 'Normverweise: ' + e.normverweise.map((n) => n.artikel).join(', '));
  if (e.warnungen.length) { z.push('', 'Hinweise / Vorbehalte:'); e.warnungen.forEach((w) => z.push('– ' + w)); }
  z.push('', 'Orientierungsberechnung – keine Rechtsberatung (LexMetrik).');
  return z.join('\n');
}

export function ErgebnisAnzeige({ titel, ergebnis }: Props) {
  const [rechenWegOffen, setRechenWegOffen] = useState(false);
  const [annahmenOffen, setAnnahmenOffen] = useState(false);
  // UX-Programm A6: Bei nicht-«ok»-Status sind die Vorbehalte das Wichtigste →
  // standardmässig offen (Lazy-Init; Live-Neuberechnungen lassen die manuelle
  // Wahl des Nutzers unangetastet).
  const [warnungenOffen, setWarnungenOffen] = useState(() => ergebnis.status !== 'ok');
  const druckErzwingtOffen = useDruckErzwingtOffen();
  const cfg = STATUS_CONFIG[ergebnis.status];
  // Der Kopier-Text hing zuvor am Klick; als Prop des KopierButton liefe er
  // sonst bei JEDER Live-Neuberechnung mit (§15) — darum memoisiert.
  const kopierText = useMemo(() => ergebnisAlsText(titel, ergebnis), [titel, ergebnis]);

  return (
    // Einblendung + aria-live trägt der umgebende ErgebnisBlock (R4) — eine
    // Live-Region pro Ergebnis statt zwei verschachtelter (D3, 11.6.2026);
    // Screenreader erfahren von Live-Neuberechnungen weiterhin (UX C7).
    // W2·29-WERKBANK-RECHNER R2 (24.9.2026): Abschnitt statt Kasten wie
    // «Rechenweg» im Board «Unter-Rechner» — Registerstrich oben, Haarlinie
    // unten (`.lc-werkzeug-karte`), kein Rahmen, keine Füllung, kein Schatten
    // (F0.5/F0.6). Die Messing-Ablesekante `scale-rule` darüber entfällt: der
    // Strich IST die Ablesekante.
    <div>
      <div className="lc-werkzeug-karte">
      {/* Header */}
      {/* R5-F2 (6.9.2026): GEMESSEN @390 auf 8 der 20 Rechner-Routen lief diese
          Kopfzeile über ihre Spalte hinaus (`/rechner/mietrecht` 355 px in einer
          355→298-px-Zelle, `/rechner/erb-fristen` 341, `/rechner/kuendigung`
          326) — der Titel-Block ist ein Flex-Kind mit `min-width:auto` und
          konnte darum nicht unter seine längste Zeile schrumpfen; der Rest
          wurde vom `overflow-hidden` der Karte abgeschnitten. `min-w-0` gibt
          dem Titel die Umbrucherlaubnis zurück, `flex-wrap` schickt den
          Kopier-Knopf (`shrink-0`, breite Beschriftung) auf einer engen Zelle in
          die zweite Zeile, statt dem Titel 95 px zu lassen. Anatomie und
          Reihenfolge unverändert (§3). */}
      <div className="border-b border-rule-soft py-4 flex flex-wrap items-start justify-between gap-3">
        {/* Titel als `h2` (R5-F2 6.9.2026, axe `heading-order`: der Ergebnisblock
            IST die zweite Ebene unter dem Seiten-`h1`); Kopf seit R5b aus
            `AbschnittKopf` wie die Abschnitte der Sonderseiten. */}
        <AbschnittKopf overline="Ergebnis" titel={titel} />
        {/* R2-E/F1-10: der geteilte KopierButton — vorher eine dritte Optik
            (`lc-btn-ghost`) mit dem nackten «Kopieren», das offenliess, WAS in
            der Zwischenablage landet. Die eigene Clipboard-Mechanik ist damit
            entfallen; sie zeigte «Kopiert ✓» zudem ohne aria-Ankündigung an
            derselben Stelle. */}
        <KopierButton text={kopierText} gegenstand="Ergebnis"
          className="lc-btn-outline lc-btn-sm shrink-0" />
      </div>

      <div className="py-6 space-y-5">
        {/* Status + Hauptergebnis — das Verdikt ist der typografische Peak
            des Blocks (Display-Schnitt statt Mono-Zeile, Design-Review
            6.6.2026); Tabellenziffern bleiben für Daten im Satz erhalten. */}
        <div className="space-y-3">
          <span className={cfg.cls} title={cfg.hint}>{cfg.label}</span>
          {/* D-1.5 (Befund 21): Verdikt-/Prosa-Zeilen auf die Lesespalte begrenzt
              (vorher ~135 CPL auf breiten Rechner-Layouts, B2-Verstoss) —
              NUR Prosa-<p>; Kacheln/lc-tile/Tabellen bleiben unbegrenzt. */}
          {/* R5-B (5.9.2026): der Ziffernsatz kam bis hierher als rohes
              `style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}` —
              Wort für Wort die Deklaration von `.num` aus index.css, nur ohne
              deren Monospace-Familie (die den Display-Peak brechen würde).
              `.lc-ziffern` ist genau diese Rolle ohne Familie (§5). */}
          <p className={`lc-ziffern font-display font-semibold text-h3 leading-snug max-w-reading ${cfg.verdikt}`}>
            {ergebnis.ergebnis}
          </p>
        </div>

        {/* Warnungen / Vorbehalte – einklappbar, um das Ergebnis übersichtlich zu halten.
            `data-vorbehalte` (QS-UI 8b): stabiler Griff für das Tor
            `e2e/qsui-hierarchie.e2e.ts` (I2 — R6 Ziff. 2, Abstand zum Verdikt).
            Vorher suchte das Tor über `[class*="bg-warn-bg"]` und griff damit
            JEDE Fläche in Warn-Tönung — im Erbteilungs-Rechner traf es die
            Segmente des Quoten-Balkens statt einer Warnung und mass einen
            negativen «Abstand» (§9-Bug-Check zu PR #440, B3). Reines Test-Attribut,
            keine Darstellungswirkung. */}
        {/* ── LM-056 (B15, 4.9.2026) · EIN AKKORDEON-BILD JE SEITE ─────────────
            GEMESSEN vor dem Bau auf `/rechner/zpo-fristen` @1440: diese drei
            Köpfe trugen ein Glyphen-TAUSCHENDES ▲/▼, die `<details>` derselben
            Seite («Für die Rechtsschrift …», «Rechtlicher Hinweis …») ein
            7.7-9.8 px kleines «▸» mitten im Textfluss. Zwei Klapp-Gestalten auf
            einem Bildschirm. Die geteilte Regel in `index.css` trägt jetzt das
            Bild (rechte Kante, ▸, Drehung um 90°); diese drei Köpfe sind
            `<button>` und werden von ihr nicht erreicht — sie übernehmen
            dieselbe Gestalt von Hand: gleiche Glyphe, gleiche Drehung, gleiche
            Kante. `aria-hidden` ist neu und richtig: das Zeichen stand bisher IM
            zugänglichen Namen des Knopfs («Rechenweg (6 Schritte)▼»); den
            Zustand trägt `<details>`/der Inhalt, nicht eine Glyphe im Namen.
            `.lc-druck-chevron` bleibt — die Druckregel blendet die reine
            Auf/Zu-Deko weiterhin aus (LM-173). */}
        {/* C4-2/D-18 (R9-2, 6.9.2026): der Vorbehalts-Block war ein KASTEN von Hand
            — 1-px-Vollrahmen `var(--warn-500)` als Inline-Style plus `bg-warn-bg`
            ZWEIMAL (Kopf und Körper) — neben dem geteilten `.lc-notice-warn`, das
            dieselbe Aussage als LINIE trägt (F0.6). Der Rahmen ist die Linie des
            Bausteins geworden; die Füllung kommt jetzt EINMAL vom Container, die
            Kinder erben sie. `rounded-md` ist ersatzlos weg: alle fünf Radius-Token
            stehen auf 0 (F0.5), die Utility behauptete eine Rundung, die es seit
            der Handschrift nicht mehr gibt — mit Playwright gemessen (`border-radius:
            0px`, Befund D-18). `p-0` schaltet die Polsterung des Bausteins ab, weil
            Kopf und Körper des Aufklappers ihre eigene tragen (sonst doppelt).
            Mechanik, Zustände, `data-vorbehalte`-Tor-Griff und Wortlaut unverändert. */}
        {ergebnis.warnungen.length > 0 && (
          <div data-vorbehalte={ergebnis.warnungen.length} className="lc-notice-warn p-0 overflow-hidden">
            <button type="button" onClick={() => setWarnungenOffen(!warnungenOffen)}
              className="lc-druck-kopf w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors">
              <span className="lc-overline text-warn-700">Hinweise / Vorbehalte ({ergebnis.warnungen.length})</span>
              <span aria-hidden className={`lc-druck-chevron shrink-0 text-warn-700 transition-transform motion-reduce:transition-none ${warnungenOffen ? 'rotate-90' : ''}`}>▸</span>
            </button>
            {(warnungenOffen || druckErzwingtOffen) && (
              <div className="px-4 pb-3 space-y-1">
                {/* Norm- UND Entscheid-Zitate in Warnungen verlinkt (Web-Anzeige; Text unverändert) */}
                {ergebnis.warnungen.map((w, i) => <p key={i} className="text-body-s text-warn-700 max-w-reading"><NormText text={w} /></p>)}
              </div>
            )}
          </div>
        )}

        {/* Rechenweg (5.6.1) — geöffnet trägt der Block einen Messing-Tick
            (FAHRPLAN-DESIGN 5.7: Marken-Element am täglichsten Interaktionspunkt) */}
        {/* D-18: `rounded-md` entfernt — Radius-Token = 0 (F0.5), die Utility log. */}
        <div className={`border-y border-rule-soft ${rechenWegOffen ? 'border-l-2 border-l-brass-500' : ''}`}>
          <button type="button"
            onClick={() => setRechenWegOffen(!rechenWegOffen)}
            className="lc-druck-kopf w-full flex items-center justify-between px-4 py-3 hover:bg-brass-100 text-left transition-colors"
          >
            <span className="text-body-s font-medium text-ink-700">Rechenweg ({ergebnis.rechenweg.length} Schritte)</span>
            <span aria-hidden className={`lc-druck-chevron shrink-0 text-ink-400 transition-transform motion-reduce:transition-none ${rechenWegOffen ? 'rotate-90' : ''}`}>▸</span>
          </button>
          {(rechenWegOffen || druckErzwingtOffen) && (
            <div className="divide-y divide-line">
              {ergebnis.rechenweg.map((schritt, i) => (
                <div key={i} className="px-4 py-3 space-y-2">
                  <p className="lc-overline">{schritt.beschreibung}</p>
                  <p className="text-body-s text-ink-700 num">{schritt.zwischenergebnis}</p>
                  {/* lc-chip-zeile (LM-044/N1): NormLink rendert ein <a> → Link-
                      Unterstreichung als Form-Merkmal. Die Rechtsprechungs-Anker
                      daneben sind lc-badge (andere Achse) und bleiben unberührt. */}
                  <div className="lc-chip-zeile flex flex-wrap gap-1.5">
                    {schritt.normen.map((n, j) => (
                      <NormLink key={j} artikel={n.artikel} bemerkung={n.bemerkung} />
                    ))}
                    {schritt.rechtsprechung?.map((r, j) => (
                      /* Aktenzeichen → amtlicher bger.ch-Link (Auftrag David 6.6.2026);
                         der Verifikations-Vorbehalt (§8) bleibt unverändert sichtbar */
                      <span key={j} className="lc-badge lc-badge-danger gap-1 font-mono">
                        {/* B-L1 (R9-1, 6.9.2026): `no-underline hover:underline` fällt —
                            der Strich erschien erst beim Überfahren, also für Tastatur
                            und Touch gar nicht. Der Anker steht IN einem `.lc-badge`,
                            trägt seine Affordanz damit aus der Form (F0.8) und bleibt
                            dauerhaft ohne Strich; die Rückmeldung gibt die Farbe. */}
                        <RechtsprechungAnker aktenzeichen={r.aktenzeichen}
                          className="no-underline hover:text-brass-800" />
                        {!r.verifiziert && <span className="font-sans text-micro">· zu verifizieren</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Annahmen */}
        {ergebnis.annahmen.length > 0 && (
          <div className={`border-y border-rule-soft ${annahmenOffen ? 'border-l-2 border-l-brass-500' : ''}`}>
            <button type="button"
              onClick={() => setAnnahmenOffen(!annahmenOffen)}
              className="lc-druck-kopf w-full flex items-center justify-between px-4 py-3 hover:bg-brass-100 text-left transition-colors"
            >
              <span className="text-body-s font-medium text-ink-700">Annahmen ({ergebnis.annahmen.length})</span>
              <span aria-hidden className={`lc-druck-chevron shrink-0 text-ink-400 transition-transform motion-reduce:transition-none ${annahmenOffen ? 'rotate-90' : ''}`}>▸</span>
            </button>
            {(annahmenOffen || druckErzwingtOffen) && (
              <ul className="px-4 py-3 space-y-1">
                {ergebnis.annahmen.map((a, i) => (
                  <li key={i} className="text-body-s text-ink-600">• <NormText text={a} /></li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Normverweise */}
        {ergebnis.normverweise.length > 0 && (
          <div>
            <p className="lc-overline mb-2">Normverweise</p>
            {/* lc-chip-zeile (LM-044/N1): Normverweise sind <a> — unterstrichen. */}
            <div className="lc-chip-zeile flex flex-wrap gap-1.5">
              {ergebnis.normverweise.map((n, i) => <NormLink key={i} artikel={n.artikel} />)}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="border-t border-line pt-4">
          <p className="text-body-s text-ink-500 italic leading-relaxed max-w-reading">{DISCLAIMER}</p>
        </div>
      </div>
      </div>
    </div>
  );
}
