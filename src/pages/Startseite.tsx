import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { STARTSEITE_ZAEHLER as z } from '../data/startseiteZaehler.generated';
import { usePaneKlasse } from '../components/layout/PaneKontext';
import { SuchBlock } from '../components/start/SuchBlock';
import { ZuletztVerwendet } from '../components/start/ZuletztVerwendet';
import { EntscheideListe } from '../components/start/EntscheideListe';
import { StartKachelFeld, type KachelDef } from '../components/start/StartKachelFeld';
import { EinfacheFristForm } from '../components/forms/EinfacheFristForm';
import { VertrauensFuss } from '../components/start/VertrauensFuss';

// ─── Startseite — Werkbank mit aufklappenden Kacheln (W2·29-WERKBANK-START) ──
//
// Prototyp + Go David 23.9.2026 (FAHRPLAN-WERKBANK-UMBAU §5d, Spec
// `start-prototyp/SPEC-START-UND-GRUNDTON.md`): «die startseite … die vier
// kacheln … wenn man eines davon anklickt [soll] es aufspringt» · «es soll die
// funktionen haben wie die werkbank … aber die kacheln sollen bedienbar sein».
//   · Kopf: die Begrüssung mit Suchfeld BLEIBT (Auswahlfrage 23.9.2026
//     «Begrüssung behalten»; D39 vom 7.9.2026 gilt weiter).
//   · Links: 2×2-Kachelfeld (Flächenton, Zahl aus dem Zähler, keine Linkzeilen)
//     und darunter «Neueste Entscheide» («neuste entscheide sollen nicht weg»).
//   · Rechts: «Zuletzt» und «Schnellwerkzeug» (Fristenrechner mit der echten
//     Engine) — «1 ja … 4 ja» am Prototyp.
//   · Der Modul-Baukasten (Ein-/Aus-/Umordnen, R10) ist gestrichen
//     (Auswahlfrage 23.9.2026 «Streichen»): Systematik, Kantone und Materialien
//     sind jetzt Stufen der Kacheln, nicht zweite Wege daneben.
//
// §8: jede Zahl kommt aus `STARTSEITE_ZAEHLER` (`gen:zaehler`, Drift-Tor
// `check:zaehler`); die Werkzeug-Summe wird hier gebildet, nie von Hand
// geschrieben. A11y: genau EINE <h1> (die Begrüssung im Suchblock), je
// Abschnitt eine <h2>. Reine Darstellung (§3).
const nf = (n: number) => n.toLocaleString('de-CH');

/** Die vier Rubrik-Kacheln — die Einheit sagt, WAS gezählt wurde (§8: «im
 *  Volltext» nur, wo Volltext erfasst ist; Materialien sind «erfasst»).
 *  `teile`: die Zahl aufgeschlüsselt, aus denselben Zählerfeldern (Summe =
 *  Kachelzahl, Wächter `zaehler-eine-quelle.test.tsx`). */
const KACHELN: readonly KachelDef[] = [
  { rubrik: 'gesetze', reg: 'g', ziel: '/gesetze', titel: 'Gesetze', zahl: nf(z.gesetzeVolltext),
    einheit: 'Erlasse im Volltext, Bund und Kantone',
    nutzen: 'Bundesrecht nach Rechtsgebiet, Kantone über die Landeskarte, internationales Recht',
    teile: `${nf(z.gesetzeBundesrechtVolltext)} Bundeserlasse · ${nf(z.gesetzeKantonVolltext)} Kantonserlasse · ${nf(z.gesetzeInternationalVolltext)} Staatsverträge` },
  { rubrik: 'rechtsprechung', reg: 'r', ziel: '/rechtsprechung', titel: 'Rechtsprechung', zahl: nf(z.rechtsprechungVolltext),
    einheit: 'Entscheide im Volltext', nutzen: 'Bundesgericht und kantonale Gerichte, nach Sachgebiet' },
  { rubrik: 'materialien', reg: 'm', ziel: '/materialien', titel: 'Materialien', zahl: nf(z.materialien),
    einheit: 'amtliche Materialien erfasst', nutzen: 'Kreisschreiben, Wegleitungen und Leitfäden nach Behörde' },
  // Ziel `/rechner`: der Werkzeug-Katalog (K4) führt Rechner und Vorlagen.
  { rubrik: 'werkzeuge', reg: 'w', ziel: '/rechner', titel: 'Werkzeuge', zahl: nf(z.rechner + z.vorlagen),
    einheit: 'Rechner und Vorlagen', nutzen: 'Fristen, Gebühren und Beträge, Zuständigkeiten · Verträge, Klagen und Gesuche',
    teile: `${nf(z.rechner)} Rechner · ${nf(z.vorlagen)} Vorlagen` },
];

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid content-start gap-y-3">
      <h2 id={id} className="border-b border-rule pb-1.5 font-sans text-body-s font-semibold text-ink-900">{titel}</h2>
      {children}
    </section>
  );
}

export function Startseite() {
  const pk = usePaneKlasse();
  return (
    <div className={`grid gap-y-9 ${pk('sm:-mt-6', '')}`}>
      <SuchBlock />
      <div className={`grid gap-x-10 gap-y-9 ${pk('lg:grid-cols-[minmax(0,1fr)_20rem]', '@5xl/pane:grid-cols-[minmax(0,1fr)_20rem]')}`}>
        <div className="grid min-w-0 content-start gap-y-9">
          <StartKachelFeld kacheln={KACHELN} />
          <Abschnitt titel="Neueste Entscheide"><EntscheideListe /></Abschnitt>
        </div>
        <aside aria-label="Arbeitsplatz" className="grid content-start gap-y-9">
          <ZuletztVerwendet />
          <Abschnitt titel="Schnellwerkzeug · Frist berechnen">
            <EinfacheFristForm />
            <p className="font-sans text-xs leading-relaxed text-ink-500">
              Rückwärtsrechnung, Zustellart, Hemmung und Kalender im{' '}
              <Link to="/rechner/tagerechner" className="underline hover:text-reg-w">Fristenrechner</Link>.
            </p>
          </Abschnitt>
        </aside>
      </div>
      <VertrauensFuss />
    </div>
  );
}
