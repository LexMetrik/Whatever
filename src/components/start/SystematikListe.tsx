import { Link } from 'react-router-dom';
import { STARTSEITE_ZAEHLER } from '../../data/startseiteZaehler.generated';
import { ModulFuss } from './PultModul';
import { systematikZeilen, kuerzelZiel, type SystematikZeile } from './modulZiele';

// ─── Systematische Ordnung des Bundesrechts (W2·24-R3, D29-Fix R10-Nachzug-3) ─
//
// Ersetzt die Chip-Wolke «Bund» (GesetzeChips) durch die ORDNUNG, nach der die
// Gesetzes-Übersicht gliedert: dieselben Kategorien, dieselben Anker
// (`/gesetze?ebene=bund#sys-<id>`), dieselben Titel — die eine Anzeige-Ordnung
// bleibt `lib/normtext/systematik.ts` (§5). Sie wird hier NICHT importiert:
// Ordnung, Titel, Beispiel-Kürzel und Zahl kommen buildseitig aus dem
// generierten Zähler (`gen:zaehler`, Drift-Tor `check:zaehler`). Die Ziel-
// Ableitung (Zeilen- UND Kürzel-Ziel) steht in `./modulZiele` — eigene Datei,
// weil dieses Modul (react-refresh) nur Komponenten exportieren darf.
//
// D29 (David 6.9.2026, «jede Kachel führt zu der gleichen Seite»): der Href
// selbst war je Zeile schon distinkt (`#sys-<id>` bzw. die International-
// Säule, Nachweis im Bau-Bericht) — sichtbar gleich sah es aus, weil die
// KÜRZEL-Zeile (BV · ParlG · …) reiner Text war und nirgendwohin führte. Sie
// sind jetzt eigene Links (`modulZiele.kuerzelZiel`), Details dort.
//
// §8 · DIE ZAHLEN SIND GEMESSEN, NICHT ILLUSTRIERT. Das Referenzbild
// (`vorschlag-freigegeben.html`) trägt an dieser Stelle ausdrücklich
// Beispielwerte und sagt es in seiner Fussnote. Ausgeliefert wird so etwas nie:
// gezählt ist je Kategorie der ERFASSTE VOLLTEXT (status `snapshot`), ein
// gelisteter Erlass ohne Snapshot zählt nicht mit. Die fünf Kategorien ergeben
// `gesetzeBundesrechtVolltext`, die Zeile «Internationales Recht»
// `gesetzeInternationalVolltext`; die Fusszeile nennt beide getrennt (K7,
// 23.9.2026 — bis dahin «231 Erlasse» unter der Überschrift «Bundesrecht»,
// dieselbe Mischung, die K5 im /gesetze-Kopf behoben hat).
// Reine Darstellung (§3).
// W2·24-R10 (Referenzbild `pult-freigegeben.html`): das Modul rendert nur noch
// seinen INHALT. Kopfzeile, Registerstrich und der Schalter «Anzeigen/Ausblenden»
// kommen aus dem EINEN Rahmen `start/PultModul`, Titel und Register aus dem
// Registry (`lib/startseiteModule`) — die frühere Marginalie mit Bereich und
// Bestandszahl ist gestrichen, die Zahl steht einmal in den Rubrik-Kacheln.


const z = STARTSEITE_ZAEHLER;
const nf = (n: number) => n.toLocaleString('de-CH');

function Zeile({ nr, titel, kuerzel, anzahl, ziel }: SystematikZeile) {
  return (
    <div className="grid grid-cols-[1.4rem_minmax(0,1fr)_auto] items-baseline gap-x-2.5 border-t border-rule-soft py-1.5">
      <span aria-hidden className="num font-sans font-medium text-xs text-ink-500">{nr}</span>
      <span className="font-serif text-ink-900">
        <Link to={ziel} className="no-underline hover:text-reg-g hover:underline">{titel}</Link>
        <small className="mt-0.5 block font-sans text-xs leading-snug text-ink-500">
          {kuerzel.map((k, i) => {
            const pfad = kuerzelZiel(k);
            return (
              <span key={k}>
                {i > 0 && ' · '}
                {pfad
                  ? <Link to={pfad} className="text-ink-500 no-underline hover:text-reg-g hover:underline">{k}</Link>
                  : k}
              </span>
            );
          })}
        </small>
      </span>
      <span className="num font-sans text-xs text-reg-g">{anzahl}</span>
    </div>
  );
}

export function SystematikListe() {
  return (
    <>
      {/* Zwei Spalten erst, wenn beide Spalten eine Zeile tragen können — im
          schmalen Pane und auf dem Telefon bleibt es eine Liste. */}
      <div className="grid gap-x-9 sm:grid-cols-2">
        {systematikZeilen().map((zl) => <Zeile key={zl.ziel} {...zl} />)}
      </div>
      <ModulFuss>
        Die Zahl je Zeile ist der bei uns erfasste Volltext ({nf(z.gesetzeBundesrechtVolltext)} Erlasse
        des Bundesrechts und {nf(z.gesetzeInternationalVolltext)} Staatsverträge), nicht der Umfang der
        Systematischen Rechtssammlung des Bundes.
      </ModulFuss>
    </>
  );
}
