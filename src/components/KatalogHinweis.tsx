import { Link } from 'react-router-dom';
import { SITE_KURZFORM } from '../lib/seo';

// Gemeinsamer Fuss der Rechner-/Vorlagen-Übersicht (vormals inline in
// Recherche.tsx): Methodik-Zeile + Pflichthinweis (§8). Reine Darstellung;
// die Langtexte leben auf /methodik (SSoT, §5). K4 (W2·29-WERKBANK-KATALOGE):
// zwei Spalten im Fuss (`.kt-fuss`) statt Hinweis-Kästen mit Messingkante;
// der Methodik-Link im Registerton (`.kt-weiter`).
export function KatalogHinweis() {
  return (
    <>
      <section className="space-y-2">
        <p className="text-body-s text-ink-600">
          <span className="font-medium text-ink-900">So rechnet LexMetrik:</span>{' '}
          {SITE_KURZFORM}
        </p>
        <Link to="/methodik" className="kt-weiter text-body-s font-medium no-underline whitespace-nowrap">
          Zur Methodik →
        </Link>
      </section>

      <section>
        <p className="lc-overline mb-1">Rechtlicher Hinweis</p>
        <p className="text-body-s text-ink-600 max-w-reading-s">
          Alle Rechner liefern automatisierte Orientierungsberechnungen und keine Rechtsberatung. Massgeblich
          sind Gesetz, GAV, Vertrag und der konkrete Sachverhalt. Für die Wahrung einer Frist im Einzelfall ist
          allein die nutzende Person verantwortlich.
        </p>
      </section>
    </>
  );
}
