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

/** Anzeige-Titel: steht die gebräuchliche Bezeichnung in Klammern am Ende
 *  («… (Obligationenrecht)»), dann diese — sonst der amtliche Titel. Nur
 *  Darstellung; der volle Titel bleibt Tooltip und zugänglicher Name. */
const anzeigeTitel = (titel: string) => /\(([^()]+)\)$/.exec(titel)?.[1] ?? titel;

// U7 (David 24.9.2026 «häufig gesucht ist sehr leer» → Auswahl «Kürzel + voller
// Titel»): je Erlass eine Zeile Kürzel · Titel · SR-Nummer, zweispaltig; der
// SR-Nummer unter dem Kürzel, der Titel darf zweizeilig umbrechen (höchstens zwei Zeilen).
export function HaeufigGebraucht() {
  return (
    <StartFlaeche titel="Häufig gebraucht" fuellt>
      {/* W2·31-BILDSCHIRMBREITE (25.9.2026, Startseite auf `weit`): ab 52rem
          Flächenbreite drei Spalten statt zwei — nur auf dem `weit`-Rahmen ab
          `2xl` (Fläche @1920 ≈ 62rem; auf `content` ≈ 42rem, dort zwei wie
          bisher). Sieben Einträge in drei statt vier Zeilen; die Titelspalte
          bleibt ≈ 40 Zeichen (Wächter `e2e/startseite-breite.e2e.ts`). */}
      <ul className="grid grid-cols-1 content-center gap-x-6 @[34rem]:grid-cols-2 @[52rem]:grid-cols-3">
        {ERLASSE.map((e) => (
          <li key={e.key} className="border-t border-rule-soft first:border-t-0 @[34rem]:[&:nth-child(2)]:border-t-0 @[52rem]:[&:nth-child(3)]:border-t-0">
            <Link to={erlassPfad(e)} title={e.titel} aria-label={`${e.kuerzel} – ${e.titel}`}
              className="lc-menu-zeile items-start gap-3 whitespace-normal no-underline">
              <span className="w-14 shrink-0 font-sans leading-tight">
                <span className="block text-body-s font-semibold text-ink-900">{e.kuerzel}</span>
                {e.sr && <span className="num block text-xs text-ink-500">SR {e.sr}</span>}
              </span>
              <span className="line-clamp-2 min-w-0 flex-1 font-sans text-xs leading-snug text-ink-600">{anzeigeTitel(e.titel)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </StartFlaeche>
  );
}
