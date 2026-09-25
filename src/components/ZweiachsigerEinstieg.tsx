import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { einstiegMatrix } from '../lib/einstieg';

// ─── Zweiachsiger Einstieg: nach Rechtsgebiet (ROADMAP Schritt 5) ───────────
// Die zweite Achse zum bestehenden Aufgaben-Register auf /rechner: derselbe
// Katalog (§5), nach Rechtsgebiet aufgeschlüsselt, je Gebiet die Werkzeuge nach
// Aufgabe gruppiert. Reine Darstellung (§3); nur verfügbare Karten (§8).
//
// W2·29-WERKBANK-KATALOGE K4 (23.9.2026, Board «Unter-Rechner-Katalog»): statt
// eines Kachel-Rasters (`lc-tile`) eine Seitenspalte aus Klapp-Zeilen mit
// Haarlinie (`.kt-einstieg`, index.css) — ab 1100 px links neben dem Register,
// darunter als zweispaltige Liste. Der Zähler steht in einer Kolonne vor dem
// Chevron (`flex-1` am Titel statt `ml-auto`, gemessen: Zähler auf drei
// x-Positionen). Links im Registerton der Route, ohne Strich (F0.8, Listen-
// Link: Affordanz aus der Form).

export function ZweiachsigerEinstieg() {
  // ALLE_KARTEN ist modul-statisch → einmal projizieren statt pro Render.
  const matrix = useMemo(() => einstiegMatrix(), []);
  return (
    <section className="kt-einstieg space-y-3">
      <div className="space-y-1">
        <p className="lc-overline">Einstieg nach Rechtsgebiet</p>
        <p className="text-body-s text-ink-600 leading-relaxed max-w-reading-s">
          Dieselben Werkzeuge, quer nach Rechtsgebiet erschlossen – je Gebiet die
          passenden Rechner und Vorlagen nach Aufgabe gruppiert. Aufklappen oder
          unten direkt nach Aufgabe blättern.
        </p>
      </div>
      <div className="kt-gebiete">
        {matrix.map((g) => (
          <details key={g.id}>
            <summary className="flex cursor-pointer items-baseline gap-2">
              <span className="min-w-0 flex-1 text-body-s font-medium text-ink-900">{g.gebiet}</span>
              <span className="num flex-none text-xs text-ink-500">{g.anzahl}</span>
            </summary>
            <div className="mt-2 space-y-2 pb-1">
              {g.zellen.map((z) => (
                <div key={z.kategorie} className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{z.titel}</p>
                  <ul className="space-y-0.5">
                    {z.karten.map((k) => (
                      <li key={k.id}>
                        {k.href ? (
                          <Link to={k.href} className="text-body-s no-underline">{k.title}</Link>
                        ) : (
                          <span className="text-body-s text-ink-600">{k.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
