import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { AbschnittKopf } from '../components/layout/AbschnittKopf';
import { getCalculator } from '../lib/calculators';
import { NormLink } from '../components/vorlagen/ui';
import { VerzugszinsForm } from '../components/forms/VerzugszinsForm';

// ─── Verzugszins-/Forderungs-/Inkasso-Strecke (ROADMAP W2·7) ────────────────
// Verzahnungs-Klinge: eine stateless Strecke, die die Schritte der Durchsetzung
// einer Geldforderung strukturiert liest (Reverse-Reader) und an die jeweils
// zuständige Engine/Vorlage verweist. Der Verzugszins wird vom bestehenden
// Rechner (berechneVerzugszins) berechnet; die Mahnung ruft dieselbe Engie-Norm
// (Art. 104 OR) auf und rechnet 5 % nicht selbst nach (§5). Reine Darstellung
// (§3): keine eigene Rechtslogik, stateless (keine Speicherung).

type Schritt = {
  nr: number;
  titel: string;
  norm?: string;
  text: string;
  ziel?: { label: string; to: string };
};

const STRECKE: Schritt[] = [
  {
    nr: 1,
    titel: 'Fälligkeit & Verzug',
    norm: 'Art. 102 OR',
    text: 'Der Verzug tritt mit Mahnung der fälligen Forderung ein – oder ohne Mahnung, wenn ein bestimmter Verfalltag vereinbart war (Art. 102 Abs. 2 OR).',
  },
  {
    nr: 2,
    titel: 'Verzugszins berechnen',
    norm: 'Art. 104 OR',
    text: 'Ab Verzug läuft der gesetzliche Verzugszins von 5 % pro Jahr (oder ein höherer vertraglicher Satz). Betrag im Rechner unten – mit Teilzahlungen (Art. 85 OR) und Zinseszinsverbot (Art. 105 Abs. 3 OR).',
  },
  {
    nr: 3,
    titel: 'Mahnung / Inverzugsetzung schreiben',
    norm: 'Art. 102 OR',
    text: 'Die Mahnung setzt den Verzug in Kraft und ist nachweisbar zuzustellen. Sie ist keine Betreibung; den Verzugszins bziffert der Rechner, der Brief rechnet ihn nicht nach.',
    ziel: { label: 'Mahnung erstellen', to: '/vorlagen/mahnung' },
  },
  {
    nr: 4,
    titel: 'Betreibung einleiten',
    norm: 'Art. 67 SchKG',
    text: 'Bleibt die Zahlung aus, folgt das Betreibungsbegehren. Die Betreibungskosten hängen vom Forderungsbetrag ab.',
    ziel: { label: 'Betreibungskosten', to: '/rechner/betreibungskosten' },
  },
  {
    nr: 5,
    titel: 'Fristen im Betreibungsverfahren',
    norm: 'Art. 74 SchKG',
    text: 'Nach dem Zahlungsbefehl laufen Rechtsvorschlags- und Rechtsöffnungsfristen mit Betreibungsferien und Rechtsstillstand.',
    ziel: { label: 'Betreibungs- & Konkursfristen', to: '/rechner/schkg-fristen' },
  },
];

export function RechnerInkassoStrecke() {
  const calc = getCalculator('inkasso-strecke')!;
  return (
    <div className="space-y-6">
      <RechnerKopf calc={calc} />

      {/* 1 — Die Strecke (stateless Reverse-Reader) */}
      <Card>
        <div className="space-y-4">
          <AbschnittKopf overline="Übersicht" titel="Von der offenen Forderung zur Betreibung">
            Fünf Schritte der Forderungsdurchsetzung – jeder verweist auf das zuständige Werkzeug.
            Nichts wird gespeichert; die Beträge bleiben in Ihrer Sitzung.
          </AbschnittKopf>
          <ol className="space-y-3">
            {STRECKE.map((s) => (
              <li key={s.nr} className="lc-panel p-4">
                <div className="flex items-start gap-3">
                  <span className="lc-badge shrink-0 num" aria-hidden="true">{s.nr}</span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h3 className="text-body font-semibold text-ink-900">{s.titel}</h3>
                      {s.norm && <NormLink artikel={s.norm} />}
                    </div>
                    <p className="text-body-s text-ink-600">{s.text}</p>
                    {s.ziel && (
                      <Link to={s.ziel.to} className="inline-block text-body-s text-brass-700 underline pt-1">
                        {s.ziel.label} →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Card>

      {/* 2 — Verzugszins-Rechner (interaktiv, bestehende Engine) */}
      <Card>
        <AbschnittKopf overline="Schritt 2" titel="Verzugszins berechnen" className="mb-4" />
        <VerzugszinsForm />
      </Card>
    </div>
  );
}
