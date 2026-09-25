import { Link, useLocation } from 'react-router-dom';
import { passendeRechner, karteIdFuerPfad } from './passendeRechnerDaten';

// V6 · Die Fläche zur Verdrahtung — Herleitung und Begründung stehen im
// Kopf von `passendeRechnerDaten.ts` (dort liegen auch die reinen Helfer;
// diese Datei darf nur Komponenten exportieren, react-refresh).

export function PassendeRechner() {
  const { pathname } = useLocation();
  const id = karteIdFuerPfad(pathname);
  const rechner = id ? passendeRechner(id) : [];
  if (rechner.length === 0) return null;
  return (
    // `max-w-reading`: Diese Zeile ist FLIESSTEXT mit eingebetteten Links, keine
    // Kachel und keine Tabelle — damit gilt für sie die Lesespalten-Regel
    // (DESIGN-REGLEMENT B2/D-1.5: «NUR Prosa-<p>; Kacheln/lc-tile/Tabellen
    // bleiben unbegrenzt»), gegatet von e2e/qsui-hierarchie (I3). Ohne die
    // Begrenzung lief sie auf 1280 px über die Lesespalte und riss das Tor auf
    // /vorlagen/arbeitsvertrag und /vorlagen/klage-vereinfacht (Gegenprüfungs-
    // Befund B7). Massgeblich ist das Reglement, nicht der neue Chip: die Regel
    // gilt seit 11.6.2026 für jeden Prosa-Absatz der App, V6 ist keine Ausnahme.
    <p className="text-body-s text-ink-600 max-w-reading-s">
      <span className="font-medium text-ink-900">Zuerst rechnen:</span>{' '}
      {rechner.map((r, i) => (
        <span key={r.id}>
          {i > 0 && ' · '}
          <Link to={r.href} className="text-brass-700 hover:text-brass-600 no-underline">{r.title} →</Link>
        </span>
      ))}
    </p>
  );
}
