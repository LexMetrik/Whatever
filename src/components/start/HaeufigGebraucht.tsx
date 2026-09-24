import { Link } from 'react-router-dom';
import { erlassPfad } from '../../lib/normtext/erlassAdresse';
import { StartFlaeche } from './StartFlaeche';
import { haeufigeErlasse } from './haeufigAuswahl';

// ─── Startseite · «Häufig gebraucht» unter den vier Kacheln (U4, 24.9.2026) ──
//
// David 24.9.2026 «was kommt unter der kacheln?» → Auswahl mit Skizze: eine
// ruhige Zeile mit direkten Links BV · ZGB · OR · StGB · ZPO · StPO · SchKG in
// den Leser (FAHRPLAN-WERKBANK-UMBAU §5d-bis U4).
//
// §5 EINE QUELLE: `haeufigAuswahl.ts` führt nur die sieben KÜRZEL (Davids Auswahl).
// Titel, Schlüssel und Adresse kommen aus dem Erlass-Register und `erlassPfad`
// — keine handgeschriebene URL (die Schlüssel lauten teils anders als die
// Kürzel: StGB → `STGB`, SchKG → `SCHKG`). Fehlt ein Kürzel im Register, wirft
// der Modul-Aufbau nicht still weg, sondern der Wächter
// `src/tests/haeufig-gebraucht.test.tsx` wird rot.
//
// §15 LADEN: nichts nachgeladen. Das Register liegt über `usePaneLayout` →
// `erlassAdresse` ohnehin im Shell-Bündel (gemessen 24.9.2026, check:perf-budget).
//
// HÖHE: die Fläche füllt ab `lg` den Rest der linken Spalte bis zur Unterkante
// der Fläche Schnellwerkzeug (Raster in `pages/Startseite.tsx`); die Chips
// stehen darin senkrecht mittig, damit der Rest ruhig verteilt ist statt als
// Leerfeld unter einer Zeile.
//
// A11y: eine <h2> je Fläche (StartFlaeche); die Links sind eine Liste; der
// zugängliche Name trägt Kürzel UND vollen Titel (WCAG 2.5.3: der sichtbare
// Text steht vorn), der Titel zusätzlich als Tooltip.

const ERLASSE = haeufigeErlasse();

export function HaeufigGebraucht() {
  return (
    <StartFlaeche titel="Häufig gebraucht" fuellt>
      <ul className="flex flex-wrap content-center gap-2">
        {ERLASSE.map((e) => (
          <li key={e.key}>
            <Link to={erlassPfad(e)} title={e.titel} aria-label={`${e.kuerzel} – ${e.titel}`}
              className="lc-chip no-underline border-l-reg-g px-3 text-body-s text-ink-900 hover:bg-reg-g-flaeche">
              {e.kuerzel}
            </Link>
          </li>
        ))}
      </ul>
    </StartFlaeche>
  );
}
