import { Link } from 'react-router-dom';

// FE-4 (FAHRPLAN-FRISTEN-EINHEIT): Rück-Abzweigung der Spezialrechner —
// wer nur Datum + feste gesetzliche Länge braucht, gehört in den EINEN
// Fristenrechner-Einstieg. Reiner Hinweis, keine Auto-Navigation (§2).
export function TagerechnerRueckverweis() {
  return (
    <p className="text-body-s text-ink-500">
      Nur ein Datum und eine feste gesetzliche Länge – ohne die Sonderregeln dieses Rechners?{' '}
      <Link to="/rechner/tagerechner"
        className="font-medium text-brass-700 hover:text-brass-600 lc-link whitespace-nowrap">
        Zum Fristenrechner →
      </Link>
    </p>
  );
}
