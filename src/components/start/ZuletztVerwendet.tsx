import { useState } from 'react';
import { Link } from 'react-router-dom';
import { holeZuletzt, type ZuletztTyp } from '../../lib/zuletztVerwendet';
import type { Register } from '../layout/bereiche';
import { StartFlaeche } from './StartFlaeche';

// ─── «Zuletzt» — dritte Ebene des Pults (W2·24-R10) ─────────────────────────
//
// Auto-getrackte Verweise auf die zuletzt besuchten Inhalts-Routen. Reine
// Darstellung (§3): liest die vom ZuletztTracker (App-Shell) geschriebene Liste
// SYNCHRON aus localStorage (kein async-Nachwachsen → kein Shift; §15).
//
// R10 (Referenzbild `pult-freigegeben.html`, Marke `.zuletzt`): aus der
// Fliesstext-Zeile «Zuletzt geöffnet: A · B · C» ist eine MARKEN-ZEILE geworden
// — kleines Etikett «Zuletzt», dann je Eintrag ein 3-px-Registerstrich vor dem
// Namen. Der Strich sagt auf einen Blick, aus welchem Bestand der Eintrag kommt
// (dieselbe Registerfarbe wie Bereichs-Reihe und Modulzeilen, §5); das Wort
// «geöffnet» fällt weg, weil das Etikett schon sagt, was die Zeile ist. Die
// Ziele, ihre Reihenfolge und die Kappung sind unverändert.
//
// KEINE ZWEITE ZUORDNUNG (§5): der Registerstrich hängt am `typ`, den
// `lib/zuletztVerwendet.typVonRoute` deterministisch aus der Route ableitet —
// hier wird nur übersetzt, nicht neu entschieden.
//
// EIGENE FLÄCHE (W2·29-WERKBANK-START-LAYOUT, David 24.9.2026 «klarer
// unterteilt · also auch die spalte selbst»): aus der Marken-Zeile mit
// Etikett ist eine Mulde mit Überschrift «Zuletzt geöffnet» geworden
// (`StartFlaeche`, dieselbe wie das Schnellwerkzeug). Die Zeile darin — Marke
// je Eintrag, Umbruch statt Scroll-Achse, Ziele, Reihenfolge, Kappung — ist
// unverändert.
//
// OHNE EINTRÄGE KEINE FLÄCHE (§8: keine Überschrift über Leerraum). Die frühere
// Platzreservierung (`min-h-beiwerk`, R10-Nachzug) fällt weg: sie hielt Platz
// frei, weil die Zeile ÜBER dem Schnellwerkzeug stand und es beim Nachlesen
// nach unten schob (§15). Seit Davids Auswahl «Schnellwerkzeug oben»
// (24.9.2026) steht die Fläche am Ende der Spalte — in der Spalte liegt nichts
// darunter, das springen könnte, und die Höhe des Kachelfelds hängt nur am
// Schnellwerkzeug (`pages/Startseite.tsx`). Reservieren liesse sie sich auch
// nicht: bis zu zwölf Einträge brechen in einer 20-rem-Spalte beliebig um.
// SSR/Prerender: serverseitig leer; der Client liest beim Mount synchron nach.

/** Inhalts-Typ → Register. `seite` gehört keinem Bestand an und bleibt Tinte. */
const REGISTER: Record<ZuletztTyp, Register | 'ink'> = {
  gesetz: 'g', entscheid: 'r', material: 'm', rechner: 'w', vorlage: 'w', seite: 'ink',
};

/** Literale Klassennamen — Tailwind sieht nur ganze Namen im Quelltext. */
const MARKE: Record<Register | 'ink', string> = {
  g: 'bg-reg-g', r: 'bg-reg-r', m: 'bg-reg-m', w: 'bg-reg-w', ink: 'bg-ink-500',
};

export function ZuletztVerwendet() {
  const [eintraege] = useState(holeZuletzt); // lazy, synchron — kein Effect-Nachwachsen
  if (eintraege.length === 0) return null;
  return (
    <StartFlaeche titel="Zuletzt geöffnet">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 font-sans text-body-s">
        {eintraege.map((e) => (
          <Link key={e.route} to={e.route}
            className="border-b border-rule-soft pb-px no-underline hover:border-ink-900 hover:text-ink-900">
            <span aria-hidden
              className={`mr-1.5 inline-block h-2.5 w-[3px] align-[-1px] ${MARKE[REGISTER[e.typ]]}`} />
            {e.titel}
          </Link>
        ))}
      </div>
    </StartFlaeche>
  );
}
