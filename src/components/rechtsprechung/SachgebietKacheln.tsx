import type { SachgebietZaehler } from '../../lib/rechtsprechung/browse';
import type { Rechtsgebiet } from '../../lib/normtext/register';
import { zahlGruppiert } from '../typografie';

// Sachgebiet-Navigation — die EINZIGE Sachgebiet-Steuerung (das alte Filter-
// Select entfällt, Entdoppelung). Kontrastreiche, zählende Rail: der kuratierte
// Primär-Einstieg (Mehrwert ggü. einer flachen Trefferliste). Desktop: vertikale,
// klebende Liste; Mobil/Tablet: horizontales Chip-Band. Reine Darstellung (§3);
// Zähler kommen aus zaehleSachgebiete().
// Werkbank K3 (23.9.2026): der aktive Eintrag trägt das Register «r» —
// Registerstrich links + helle `reg-r-flaeche` mit Tinte (F0.2), Zahl im
// Registerton — statt der Messing-Fläche; kein Radius (Linien, F0.6).

export function SachgebietKacheln({ zaehler, gesamt, aktiv, onWaehle }: {
  zaehler: SachgebietZaehler[];
  gesamt: number;
  aktiv: Rechtsgebiet | null;
  onWaehle: (g: Rechtsgebiet | null) => void;
}) {
  const eintraege: { id: Rechtsgebiet | null; label: string; count: number }[] = [
    { id: null, label: 'Alle Sachgebiete', count: gesamt },
    ...zaehler.map((z) => ({ id: z.sachgebiet, label: z.label, count: z.count })),
  ];

  return (
    <nav aria-label="Sachgebiete" className="lg:sticky lg:top-20">
      {/* Desktop: vertikale Rail. Mobil/Tablet: scrollbares Chip-Band. */}
      {/* ── LM-063 (B8, 31.8.2026) · DER STATISCHE VERLAUF IST ERSETZT ─────────
          Bis hier lag unter der Liste ein absolut gesetzter Verlaufsstreifen
          aus Papierfarbe (Responsive-Audit D10). Er stand IMMER — auch
          ganz rechts am Ende der Strecke, wo nichts mehr kommt; damit
          behauptete er «hier geht es weiter», wenn es nicht weiterging (§8).
          Genau diese Lüge nennt die Notiz zu LM-061 (30.8.2026) als Grund,
          die statische Form nicht weiter zu vervielfachen.
          JETZT: die geteilte `lc-scrollrand-x` (index.css, Regel-Block
          `lc-scrollrand`). Sie kennt den Scrollstand ohne JavaScript — der
          Schatten steht nur an der Kante, hinter der wirklich noch Kacheln
          liegen. GEMESSEN @720 vor dem Bau: 672 px sichtbar bei 1'169 px
          Inhalt. Ab `lg` ist die Rail senkrecht und scrollt nicht (`lg:
          overflow-visible`) — dort MUSS die Zeichnung weg (`lg:bg-none`),
          sonst stünden beide Schatten dauerhaft an einer Liste, die gar nicht
          scrollt. Mit dem Verlauf entfällt auch der `relative`-Rahmen, der
          nur ihn getragen hat (§17-Rückbau). */}
      <ul className="lc-scrollrand-x lg:bg-none flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {eintraege.map((e) => {
          const an = aktiv === e.id;
          return (
            <li key={e.id ?? 'alle'} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => onWaehle(e.id)}
                aria-current={an ? 'true' : undefined}
                className={`flex w-full items-center justify-between gap-2 whitespace-nowrap lg:whitespace-normal border-l-2 px-3 py-2 text-left text-body-s transition-colors ${
                  an
                    ? 'border-reg-r bg-reg-r-flaeche font-semibold text-ink-900'
                    : 'border-transparent text-ink-600 lc-hover-flaeche hover:text-ink-900'
                }`}
              >
                {/* lg (vertikale Leiste): Label voll umbrechen statt abschneiden
                    (Auftrag David: «nicht abschneiden», z.B. «Steuern, Sozial­
                    versicherung & Abgaben»). Mobil (horizontale Scroll-Reihe)
                    bleibt es einzeilig. */}
                <span className="truncate lg:overflow-visible lg:whitespace-normal lg:leading-snug">{e.label}</span>
                <span className={`num text-xs ${an ? 'text-reg-r' : 'text-ink-500'}`}>{zahlGruppiert(e.count)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
