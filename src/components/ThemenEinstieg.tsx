import { Fragment } from 'react';
import { Link } from 'react-router-dom';

// ─── Themen-Einstieg unter der Werkzeug-Karte (DESIGN-REGLEMENT §R-10) ─────
// Direktlinks vom Rechner zu den passenden Vorlagen (Konsolidierung 7.6.2026
// E3: Einträge ohne eigene Katalog-Karte sind HIER erreichbar). Vorher als
// frei formatierte Absätze in den Seiten dupliziert.
//
// B13/LM-121 — EIN Trennzeichen. Bis 4.9.2026 trug jeder Link zusätzlich ein
// «→»; in der Reihe standen Pfeil und Mittelpunkt unmittelbar nebeneinander
// («… (ZPO) → · Streitwert …») und lasen sich beide als Trenner. Der
// Mittelpunkt bleibt (er trennt wirklich), der Pfeil geht — die Links sind
// über Farbe, Hover und das ankündigende Label als solche erkennbar, und «→»
// bleibt der Plattform-Marke «führt auf eine EIGENE Fläche» (Kartenfuss
// «Öffnen →») vorbehalten, statt dreimal in einer Zeile zu stehen.
export function ThemenEinstieg({ label, links }: {
  label: string;
  links: { to: string; label: string }[];
}) {
  return (
    <p className="text-body-s text-ink-600">
      <span className="font-medium text-ink-900">{label}</span>{' '}
      {links.map((l, i) => (
        <Fragment key={l.to}>
          {i > 0 && ' · '}
          <Link to={l.to} className="text-brass-700 hover:text-brass-600 no-underline">{l.label}</Link>
        </Fragment>
      ))}
    </p>
  );
}
