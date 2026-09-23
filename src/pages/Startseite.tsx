import { useSyncExternalStore } from 'react';
import { START_MODULE } from '../lib/startseiteModule';
import {
  abonniere, istWerkseinstellung, schalte, schnappschuss, setzeZurueck,
  speichere, verschiebe, werkSchnappschuss, type StartPosten,
} from '../lib/startseiteEinstellung';
import { STARTSEITE_ZAEHLER as z } from '../data/startseiteZaehler.generated';
import { usePaneKlasse } from '../components/layout/PaneKontext';
import type { Register } from '../components/layout/bereiche';
import { RubrikKachel } from '../components/ui/RubrikKachel';
import { SuchBlock } from '../components/start/SuchBlock';
import { ZuletztVerwendet } from '../components/start/ZuletztVerwendet';
import { PultModul } from '../components/start/PultModul';
import { PultAbschluss } from '../components/start/PultAbschluss';
import { VertrauensFuss } from '../components/start/VertrauensFuss';

// ─── Startseite — das Pult (W2·24-DESIGN-IDENTITAET R10) ────────────────────
//
// Referenzbild `abnahme/design-identitaet/pult-freigegeben.html`, von David am
// 6.9.2026 freigegeben («ja das gefällt mir, nimm das als vorgabe für runde
// 10»). EIN Bildschirm in drei festen Ebenen — (1) Suche mit Begrüssung,
// (2) die vier Rubriken als Kacheln, (3) «Zuletzt» — und darunter die
// MODULE, die der Nutzer selbst ein- und ausschaltet und umordnet.
//
// W2·29-WERKBANK-KATALOGE K7 (Entscheid David 22.9.2026, Board «Main»): die
// frühere Bereichs-Reihe (`start/BereichsReihe`, fünf Einträge mit Strich)
// ist durch VIER `ui/RubrikKachel` ersetzt — Gesetze · Rechtsprechung ·
// Materialien · Werkzeuge (Rechner + Vorlagen, ein Register `w`), derselbe
// Baustein wie der /gesetze-Einstieg. §8: jede Zahl und jede Zahl-Unterzeile
// kommt aus `STARTSEITE_ZAEHLER` (`gen:zaehler`, Drift-Tor `check:zaehler`),
// die Werkzeug-Summe wird hier gebildet, nie von Hand geschrieben. Nicht
// gebaut (Board > Produkt): Linklisten in den Kacheln (kein Link im Link),
// Schnellwerkzeug-Auswahl, feste H1.
//
// WAS R3 HIER HATTE UND R10 NICHT MEHR HAT (§17-Gegengewicht):
//   · die MARGINALIENSPALTE (150 px + 36 px Rinne). Sie trug je Zeile Bereich
//     und Bestandszahl; beides steht jetzt EINMAL in den Rubrik-Kacheln. Der
//     Baustein `start/Satzspiegel` ist damit ersatzlos gestrichen — David
//     6.9.2026: «zu viel text und linien».
//   · das Modul «Titelblatt» (`start/Hero`) — der Kopf ist keine Registry-Zeile
//     mehr, sondern die feste erste Ebene (s. `lib/startseiteModule`).
//
// DER NUTZER-ZUSTAND KOMMT AUS EINEM EXTERNEN SPEICHER, NICHT AUS useState:
// `useSyncExternalStore` ist hier kein Zierrat, sondern der einzige Weg, der
// beides erfüllt (§15/CLS + §2/Prerender):
//   · Der PRERENDER hat kein localStorage und liefert `werkSchnappschuss` —
//     die Werkseinstellung steht damit deterministisch im HTML.
//   · Der CLIENT liest beim ersten Render synchron nach. Weicht sein
//     Schnappschuss ab, zieht React die Attribute unmittelbar nach der
//     Hydration nach. Mit `useState(() => lies())` täte es das NICHT: React
//     patcht bei der Hydration keine Attribute, und der erste Client-Render
//     wäre schon der «richtige» — die Seite bliebe optisch auf dem
//     Server-Stand stehen.
//   · Ein zweiter Tab (`storage`) und das eigene Blatt (`lm:startseite`) melden
//     sich über dasselbe Abonnement; es gibt keinen zweiten Zustand (§5).
//
// ORDNUNG PER CSS, NICHT PER DOM-UMBAU: die Module stehen IMMER in der
// Registry-Reihenfolge im Baum, ihre Anzeige-Position ist `style.order`, und
// zugeklappt heisst `hidden` (s. `start/PultModul`). So sind Server- und
// Client-Baum gestaltgleich — ein Struktur-Unterschied liesse React 19 die
// Hydration verwerfen und die ganze Seite neu rendern.
//
// A11y (§8): genau EINE <h1> (die Begrüssung im Suchblock, seit D39 —
// David 7.9.2026, s. `start/SuchBlock.tsx`), je Modul eine <h2> in einer
// `<section aria-labelledby>` — keine Heading-Sprünge. Reine Darstellung (§3).
const nf = (n: number) => n.toLocaleString('de-CH');

/** Die vier Rubrik-Kacheln (K7) — Einheit sagt, WAS gezählt wurde (§8:
 *  «im Volltext» nur, wo Volltext erfasst ist; Materialien sind «erfasst»).
 *  `teile`: die Zahl aufgeschlüsselt, aus denselben Zählerfeldern (Summe =
 *  Kachelzahl, Wächter `zaehler-eine-quelle.test.tsx`). */
const RUBRIKEN: Array<{ reg: Register; ziel: string; titel: string; zahl: number; einheit: string; nutzen: string; teile?: string }> = [
  { reg: 'g', ziel: '/gesetze', titel: 'Gesetze', zahl: z.gesetzeVolltext,
    einheit: 'Erlasse im Volltext, Bund und Kantone',
    nutzen: 'Systematische Ordnung, 26 Kantone, internationales Recht',
    teile: `${nf(z.gesetzeBundesrechtVolltext)} Bundeserlasse · ${nf(z.gesetzeKantonVolltext)} Kantonserlasse · ${nf(z.gesetzeInternationalVolltext)} Staatsverträge` },
  { reg: 'r', ziel: '/rechtsprechung', titel: 'Rechtsprechung', zahl: z.rechtsprechungVolltext,
    einheit: 'Entscheide im Volltext', nutzen: 'Bundesgericht und kantonale Gerichte, nach Sachgebiet' },
  { reg: 'm', ziel: '/materialien', titel: 'Materialien', zahl: z.materialien,
    einheit: 'amtliche Materialien erfasst', nutzen: 'Kreisschreiben, Wegleitungen und Leitfäden nach Behörde' },
  // Ziel `/rechner`: der Werkzeug-Katalog (K4) führt Rechner und Vorlagen.
  { reg: 'w', ziel: '/rechner', titel: 'Werkzeuge', zahl: z.rechner + z.vorlagen,
    einheit: 'Rechner und Vorlagen', nutzen: 'Fristen, Gebühren und Beträge, Zuständigkeiten · Verträge, Klagen und Gesuche',
    teile: `${nf(z.rechner)} Rechner · ${nf(z.vorlagen)} Vorlagen` },
];

export function Startseite() {
  const pk = usePaneKlasse();
  const posten = useSyncExternalStore(
    abonniere,
    () => schnappschuss(START_MODULE),
    () => werkSchnappschuss(START_MODULE),
  );
  const platz = new Map(posten.map((p, i) => [p.id, i] as const));
  const zustand = new Map(posten.map((p) => [p.id, p.an] as const));
  const schreibe = (neu: StartPosten[]) => speichere(neu);

  return (
    // LEERRAUM ÜBER DEM PULT (David-Befund D3, 6.9.2026, unverändert
    // fortgeschrieben): der Route-Wrapper (`layout/Shell.tsx`, `py-8 sm:py-12`)
    // polstert 48 px; ab `sm` nimmt die Seite 24 px davon zurück. NUR im
    // Vollfenster — im Pane polstert `Pane.tsx` mit `py-6`, dort wäre der Abzug
    // der ganze Abstand. Wurzel (eine je Routentyp gesetzte Wrapper-Polsterung)
    // liegt in `layout/`, das diese Runde nicht anfasst.
    <div className={`grid gap-y-9 ${pk('sm:-mt-6', '')}`}>
      <SuchBlock />
      {/* K7-NACHZUG (Sichtprüfung 23.9.2026): Kacheln, «Zuletzt» und Module
          stehen in EINER Gruppe mit 6-px-Fuge. Vorher waren es drei Glieder
          des `gap-y-9`-Rasters: 36 + 24 (leere `min-h-beiwerk`-Reserve der
          Zuletzt-Zeile, §15) + 36 = 96 px Leerraum bis zur ersten Modul-Linie.
          Jetzt 6 + 24 + 6 = 36 px = der Abschnittsabstand der Seite; die
          Reserve bleibt (sie hält den Nachlade-Sprung der Zeile fern), sie
          liegt nur nicht mehr zwischen zwei vollen Abständen. */}
      <div className="grid gap-y-1.5">
        {/* NAME «Bereiche der Sammlung», NICHT «Bereiche»: die Reiterleiste der
            Krone trägt bereits `nav aria-label="Bereiche"` (R10, e2e-Anker).
            SCHMAL EINSPALTIG (unter 480 px bzw. Pane unter `@lg`): zweispaltig
            blieben bei 390 px je Kachel ~130 px Satzbreite — der Titel musste
            getrennt werden, die Unterzeilen liefen in Ein-Wort-Zeilen. Der
            Titel trennt nie (`break-words` nur als Überlauf-Netz, ohne
            `hyphens`). */}
        <nav aria-label="Bereiche der Sammlung" className={`grid gap-3 ${pk(
          'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4',
          'grid-cols-1 @lg/pane:grid-cols-2 @5xl/pane:grid-cols-4',
        )}`}>
          {RUBRIKEN.map((k) => (
            <RubrikKachel key={k.ziel} reg={k.reg} ziel={k.ziel} zahl={nf(k.zahl)} einheit={k.einheit}
              titel={<span className="break-words">{k.titel}</span>} nutzen={k.nutzen}
              extra={k.teile && <span className="num text-body-s leading-snug text-ink-700">{k.teile}</span>} />
          ))}
        </nav>
        <ZuletztVerwendet />

        <div className="grid border-t border-rule-soft">
          {START_MODULE.map((modul) => {
            const Komponente = modul.Komponente;
            const an = zustand.get(modul.id) ?? modul.standard;
            return (
              <PultModul key={modul.id} id={modul.id} titel={modul.titel} reg={modul.reg} an={an}
                position={platz.get(modul.id) ?? 0}
                aufSchalten={() => schreibe(schalte(posten, modul.id))}>
                <Komponente an={an} />
              </PultModul>
            );
          })}
        </div>
      </div>

      <PultAbschluss
        module={START_MODULE}
        posten={posten}
        istWerk={istWerkseinstellung(START_MODULE, posten)}
        aufSchalten={(id) => schreibe(schalte(posten, id))}
        aufVerschieben={(id, richtung) => schreibe(verschiebe(posten, id, richtung))}
        aufZuruecksetzen={setzeZurueck}
      />
      <VertrauensFuss />
    </div>
  );
}
