import { NormText } from '../NormText';
import { befundZahl, type SchrittBefund } from './seiteHelfer';

// ─── D5 (W2·24-DESIGN-IDENTITAET) · Der «Prüfen»-Schritt prüft ───────────────
//
// Der letzte Schritt sammelt die Fehler ALLER Schritte und sagt, was offen ist
// und wo es steht (Befund und Ursache: `abnahme/design-identitaet/D5-VORLAGEN.md`).
// EIN ÜBERBLICK, KEINE SPERRE (§8 · Daueranweisung David 12.6.2026 «jede
// Vorlage ist jederzeit herunterladbar — auch unausgefüllt»): der Export bleibt
// möglich und fragt einmal nach (ExportLeiste); blockiert wird nur, was
// fachlich falsch wäre (gates.blocker). §3: welche Angabe Pflicht ist,
// entscheidet die Seite/Engine (`fehlerJeSchritt`); dieser Baustein zählt und
// zeigt.
//
// W2·29-WERKBANK-VORLAGEN V1: Werkbank-Stil — Kopfzeile «Prüfung · N offen»
// in EINER Zeile, die Schritte als Zeilenliste mit Haarlinien statt
// Einrückung (F0.6 «Linien statt Flächen»). Die Fläche selbst bleibt der
// EINE Danger-Baustein `.lc-notice-danger` (Wächter design-r9-fehlerbox).

/** Sammel-Hinweis am Kopf des «Prüfen»-Schritts.
 *
 *  `data-pruefbefund` ist der Tor-Griff (Wächter `wizard-pruefschritt-d5`,
 *  e2e `vorlagen-pruefschritt-d5`): «offen» = es fehlt etwas, «vollstaendig» =
 *  geprüft und nichts offen. Der Vollzugs-Fall ist bewusst KEIN `role=alert`
 *  (nichts ist eingetreten) und trägt die neutrale `.lc-notice`-Grammatik. */
export function PruefBefund({ befunde, onSpringe }: {
  befunde: SchrittBefund[];
  /** Sprung in den Schritt, der die Lücke trägt. */
  onSpringe: (schritt: number) => void;
}) {
  const zahl = befundZahl(befunde);
  if (zahl === 0) {
    return (
      <div data-pruefbefund="vollstaendig" className="lc-notice text-body-s">
        Alle Pflichtangaben dieser Vorlage sind ausgefüllt.
      </div>
    );
  }
  return (
    <div role="alert" data-pruefbefund="offen" className="lc-notice lc-notice-danger space-y-2">
      <p className="flex flex-wrap items-baseline gap-x-2 text-body-s text-danger-700">
        <span className="lc-overline text-danger-700">Prüfung</span>
        <span>Es fehlen <span className="num">{zahl}</span> {zahl === 1 ? 'Pflichtangabe' : 'Pflichtangaben'}.</span>
      </p>
      <ul>
        {befunde.map((b) => (
          <li key={b.index} className="space-y-0.5 border-t border-danger-line py-1.5">
            {/* Sprungliste: der Knopf trägt Schritt-Nummer UND Beschriftung —
                «Schritt 3» allein sagt nicht, wo man landet. Haus-Textknopf
                (`lc-btn-ghost lc-btn-sm`, B-K1) ohne Polster auf der Textkante;
                der Unterstrich sagt «hier geht es weiter» (F0.8). */}
            <button type="button" onClick={() => onSpringe(b.index)}
              className="lc-btn-ghost lc-btn-sm px-0 text-danger-700 underline underline-offset-2 hover:no-underline">
              {/* Eine Textspanne: im Flex-Knopf fielen die Leerzeichen um die
                  Ziffer sonst weg («Schritt1· Parteien», gemessen V1). */}
              <span>Schritt <span className="num">{b.index + 1}</span> · {b.label} →</span>
            </button>
            <ul className="space-y-0.5">
              {b.fehler.map((f, i) => (
                <li key={i} className="text-body-s text-danger-700">• <NormText text={f} /></li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {/* §8/Daueranweisung David 12.6.2026: der Ausweg wird benannt. */}
      <p className="text-xs text-danger-700">
        Herunterladen ist trotzdem möglich; offene Stellen erscheinen im Dokument als Ausfüll-Striche («________»).
      </p>
    </div>
  );
}
