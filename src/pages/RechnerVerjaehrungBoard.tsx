import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { DatenTabelle } from '../components/ui/DatenTabelle';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { AbschnittKopf } from '../components/layout/AbschnittKopf';
import { getCalculator } from '../lib/calculators';
import { NormLink } from '../components/vorlagen/ui';
import { GewaehrleistungForm } from '../components/forms/GewaehrleistungForm';
import { REGIME, type VerjaehrungRegime } from '../lib/verjaehrung';

// ─── Verjährungs-/Gewährleistungs-Board (ROADMAP W2·7) ──────────────────────
// Verzahnungs-Klinge: die Verjährungs-Regime-Matrix (verjaehrung.ts REGIME) als
// Übersichts-Rückgrat, daneben der interaktive Gewährleistungs-Sonderfall
// (berechneGewaehrleistung) und die Brücke zur AT-Mechanik. Reine Darstellung
// (§3): keine eigene Rechtslogik, die Engines bleiben unberührt. CISG nur Link.

const REGIME_REIHE: VerjaehrungRegime[] =
  ['ordentlich', 'kurz', 'delikt', 'delikt_person', 'vertrag_person', 'bereicherung'];

const jahre = (n: number) => `${n} Jahr${n === 1 ? '' : 'e'}`;

// CISG (Wiener Kaufrecht) SR 0.221.211.1 — amtliche Fedlex-Fassung, nur Link
// (ROADMAP W2·7: «CISG nur Link»). Für internationale Warenkäufe weichen die
// Rüge- und Verjährungsfristen ab (Art. 38 f. / Art. 39 Abs. 2 CISG).
const CISG_URL = 'https://www.fedlex.admin.ch/eli/cc/1991/307_307_307/de';

export function RechnerVerjaehrungBoard() {
  const calc = getCalculator('verjaehrung-board')!;
  return (
    <div className="space-y-6">
      <RechnerKopf calc={calc} />

      {/* 1 — Regime-Matrix (Rückgrat) */}
      <Card>
        <div className="space-y-4">
          <AbschnittKopf overline="Übersicht" titel="Verjährungs-Regime im OR">
            Die sechs Grundregime mit relativer und absoluter Frist. Für die konkrete Berechnung
            mit Stillstand, Unterbrechung und Einredeverzicht führt der{' '}
            <Link to="/rechner/verjaehrung" className="text-brass-700 underline">Verjährungsrechner</Link>{' '}
            die Allgemeinen-Teil-Mechanik (Art. 132/134/135 ff. OR).
          </AbschnittKopf>
          <div className="overflow-x-auto">
            {/* HN-D6/DK-14 (30.9.2026): die Tabelle stand von Hand da — sie ist der
                erste Aufrufer des geteilten Bausteins `ui/DatenTabelle`; Klassen
                und Zeilen sind Zeichen für Zeichen dieselben (Prerender-Vergleich
                im PR). LM-191 (W2·17-UI-BEFUNDE/B18): Zahlenspalten rechtsbündig.
                Linksbündig stand «Jahre» bei «10 Jahre» eine Ziffernbreite neben
                «5 Jahre»/«3 Jahre» — die Spalte liess sich nicht als Spalte
                lesen. `num` (Tabellenziffern) allein reicht dafür nicht: es hält
                die ZIFFERN gleich breit, nicht die Zahlen gleich lang. Darum
                `ziffern` = rechtsbündig + `whitespace-nowrap` (die Auto-Layout-
                Breite verschob sich mit der Ausrichtung, «10 Jahre» brach sonst
                hinter der Zahl um). Reine Darstellung (§3), Werte unverändert. */}
            <DatenTabelle
              caption="Verjährungs-Regime im OR: relative und absolute Frist, Fristbeginn, Normen"
              spalten={[
                { kopf: 'Anspruchstyp', zelle: 'text-ink-900' },
                { kopf: 'Relative Frist', ziffern: true },
                { kopf: 'Absolute Frist', ziffern: true },
                { kopf: 'Fristbeginn', zelle: 'text-ink-700' },
                { kopf: 'Normen' },
              ]}
              zeilen={REGIME_REIHE.map((r) => {
                const m = REGIME[r];
                return {
                  key: r,
                  zellen: [
                    m.label.split(' – ')[0],
                    jahre(m.relativJahre),
                    m.absolutJahre != null ? jahre(m.absolutJahre) : '—',
                    m.beginnLabel,
                    <div className="flex flex-wrap gap-1">
                      {m.normen.map((n) => <NormLink key={n.artikel} artikel={n.artikel} bemerkung={n.bemerkung} />)}
                    </div>,
                  ],
                };
              })}
            />
          </div>
          <div className="lc-notice text-body-s">
            <p className="lc-overline mb-1">Verzahnung: Rügefrist ↔ Verjährung</p>
            {/* B1b (W2·31-BILDSCHIRMBREITE, 25.9.2026): bis hier ungedeckelt —
                gemessen 973 px / bis 139 Zeichen je Zeile. */}
            <p className="text-ink-600 max-w-reading-s">
              Bei Kauf und Werkvertrag laufen zwei Fristen getrennt: die <strong>Rügefrist</strong> ist
              eine Verwirkungsfrist (Versäumnis = Genehmigungsfiktion, keine Hemmung/Unterbrechung), die{' '}
              <strong>Verjährung der Mängelrechte</strong> ist eine Einrede und folgt der AT-Mechanik.
              Eine Mängelrüge unterbricht die Verjährung nicht. Der Gewährleistungs-Rechner unten rechnet
              beide; für Stillstand/Unterbrechung/Verzicht der Verjährungsfrist der{' '}
              <Link to="/rechner/verjaehrung" className="text-brass-700 underline">Verjährungsrechner</Link>.
            </p>
          </div>
          <div className="lc-notice text-body-s">
            <p className="lc-overline mb-1">Internationaler Warenkauf</p>
            {/* B1b (W2·31-BILDSCHIRMBREITE, 25.9.2026): bis hier ungedeckelt. */}
            <p className="text-ink-600 max-w-reading-s">
              Für grenzüberschreitende Warenkäufe kann das UN-Kaufrecht (CISG) gelten, mit abweichenden
              Rüge- und Verjährungsregeln.{' '}
              <a href={CISG_URL} target="_blank" rel="noopener noreferrer" className="text-brass-700 underline">CISG (SR 0.221.211.1) auf Fedlex</a>.
            </p>
          </div>
        </div>
      </Card>

      {/* 2 — Gewährleistungs-Sonderfall (interaktiv, bestehende Engine) */}
      <Card>
        <AbschnittKopf overline="Sonderfall Kauf / Werkvertrag" titel="Gewährleistung & Mängelrüge" className="mb-4" />
        <GewaehrleistungForm />
      </Card>
    </div>
  );
}
