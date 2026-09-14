import { MenueGruppe, MenueSchalter, MenueTitel } from '../../../components/ui/Menue';
import type { LeserModus } from './einzelModus';

// ═══ W2·5m · «GANZER ERLASS | EINZELNER ARTIKEL» — DIE LESART ═══════════════
//
// D-E3 (David 14.9.2026, wörtlich): «man kann im ansichtsmenu wählen ob man das
// ganze gesetz sieht oder nur den jeweils einzelnen artikel». Genau hier steht
// diese Wahl — im BESTEHENDEN Menü «Ansicht ▾», als erste Gruppe. Kein neues
// Chrome, keine zusätzliche Leiste (Kap. 15.3): der Leser trägt schon drei
// Kopf-Griffe, ein vierter wäre die Zeile, die David an anderer Stelle
// wiederholt zusammengestrichen hat (Ä91/Ä114/G14).
//
// ── WARUM DIE GRUPPE ZUOBERST STEHT ────────────────────────────────────────
// Die beiden Gruppen darunter beantworten «was steht AM Artikel» (Rubriken) und
// «wie werden Änderungen geführt» (Vermerke). Diese hier beantwortet «was sehe
// ich überhaupt» — sie ist der Rahmen der beiden anderen, nicht ihr Nachbar.
// Wer den Einzelmodus wählt, ändert die Bedeutung der Rubriken-Gruppe (sie
// werden zu Blöcken, Kap. 15.5); die Reihenfolge sagt das ohne ein Wort.
//
// ── B3 (Kap. 15.4) · DER ZUSTAND HÄNGT NICHT AN DER FARBE ──────────────────
// Beide Stellungen sind AUSGESCHRIEBEN («Ganzer Erlass» / «Einzelner
// Artikel»), der aktive Zustand steht als `aria-checked` am
// `role="menuitemradio"` UND sichtbar als Punkt-Marke (`form="punkt"`,
// `ui/Menue`) — dieselbe Anatomie wie die Änderungs-Wahl eine Gruppe weiter
// unten (§5). Farbe allein trüge ihn nicht (DESIGN-REGLEMENT B3).
//
// ── KEIN EIGENER SPEICHER (§5) UND KEIN EIGENER SETZER ─────────────────────
// Die Wahl landet im geteilten Leser-Store (`../leserOptionen`, Schluessel
// `lm.leser.optionen`) — demselben, der Schriftstufe, Vermerke und Rubriken
// traegt. Ein zweiter Speicher fuer eine Darstellungsfrage waere eine zweite
// Wahrheit; die Migration (fehlendes Feld = «Ganzer Erlass») steht dort.
//
// Diese Datei ruft den Setzer NICHT selbst: ein Moduswechsel ist zugleich ein
// ADRESS-Vorgang (Kap. 15.6 — die Adresse schlaegt die Praeferenz, also muss
// sie mitziehen, sonst stuende die eben getroffene Wahl gegen den
// `?ansicht=`-Wert im Browserfeld). Beides zusammen erledigt
// `./useEinzelModus`; hier steht nur die Bedienoberflaeche (§3).

const STELLUNGEN: ReadonlyArray<{ wert: LeserModus; label: string; titel: string }> = [
  {
    wert: 'erlass',
    label: 'Ganzer Erlass',
    // F-E3 (entschieden David 14.9.2026: «ja») — die Vorgabe bleibt der Erlass.
    titel: 'Alle Bestimmungen untereinander, zum Scrollen — die gewohnte Ansicht',
  },
  {
    wert: 'artikel',
    // ── «BESTIMMUNG» STATT «ARTIKEL» (Korrektur zu Kap. 15.3, 14.9.2026) ────
    // Das Konzept schrieb «Einzelner Artikel». An einem §-Erlass (ZH-211.11,
    // BS-640.100) wäre das Wort falsch — der Leser liest dort durchweg «§».
    // Die Fundament-Sonde verbietet ein Zähl-Substantiv im `v3/`-Code
    // ausserhalb von `./erlassAnsicht.ts` (B8/C1), und die Ableitung dorthin zu
    // holen hiesse, die Datei über ihren Deckel zu heben. «Bestimmung» ist der
    // erlassneutrale Oberbegriff, den das Haus ohnehin führt (`BestimmungsWort`,
    // `beispielBestimmung`, `zaehlform`) — er ist für beide Erlassarten richtig
    // und braucht gar keine Ableitung.
    label: 'Einzelne Bestimmung',
    // D-E3: der gewonnene Platz ist der eigentliche Gewinn, nicht das Blättern
    // — darum nennt der Tooltip die Blöcke und nicht die Pfeile (§8: sagen, was
    // die Wahl bringt, nicht was sie wegnimmt).
    titel: 'Eine Bestimmung auf einmal, mit ihrer Fassung, ihren Verweisen und den passenden Werkzeugen darunter',
  },
];

export function LeserModusWahl({ wahl, onWahl }: {
  /** Der aktuelle Stand — nicht aus dem Store gelesen, sondern durchgereicht:
   *  im Einzelmodus kann die ADRESSE die Präferenz schlagen (Kap. 15.6), und
   *  das Menü soll zeigen, was gilt, nicht was gemerkt ist (§8). */
  wahl: LeserModus;
  /** Die Wahl vollziehen — merken UND die Adresse nachziehen (`./useEinzelModus`). */
  onWahl: (m: LeserModus) => void;
}) {
  return (
    <MenueGruppe attrs={{ role: 'group', 'aria-label': 'Lesart', 'data-v3-modus-wahl': '' }}>
      <MenueTitel>Lesart</MenueTitel>
      {STELLUNGEN.map((s) => (
        <MenueSchalter
          key={s.wert}
          an={wahl === s.wert}
          form="punkt"
          label={s.label}
          titel={s.titel}
          /* Idempotent: ein Klick auf die gesetzte Stellung ist ein No-op
             (`setzeLeserAnsicht`) — eine Radiogruppe schaltet sich nicht ab. */
          onKlick={() => onWahl(s.wert)}
          attrs={{ role: 'menuitemradio', 'data-v3-modus': s.wert }}
        />
      ))}
    </MenueGruppe>
  );
}
