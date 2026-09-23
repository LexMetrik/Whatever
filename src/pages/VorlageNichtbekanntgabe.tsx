import { Link } from 'react-router-dom';
import { NormText } from '../components/NormText';
import {
  NB_DEFAULTS, nbZusammenstellen, pruefeNbGates, nbFruehesterGesuchstag, type NbAntworten,
} from '../lib/vorlagen/nichtbekanntgabe';
import { fmtDatum } from '../lib/vorlagen/datum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';

// ─── Vorlagen-Wizard: Nichtbekanntgabe Betreibung (Art. 8a III lit. d SchKG) ─
// P1-Vorlage der Wettbewerbsanalyse 12.6.2026 («Löschungsgesuch
// Betreibungsregister», FAHRPLAN-VORLAGEN-AUSBAU V2). Die 3-Monats-Schwelle
// und die Rechtsvorschlag-Voraussetzung liegen in pruefeNbGates.
// Umgestellt auf generische VorlagenSeite (FUNDAMENT-UMBAU Thema A).

const SPEICHER_KEY = 'lexmetrik.vorlage.nichtbekanntgabe.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Schuldner & Amt' },
  { id: 'betreibung', label: 'Betreibung' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_NB: PdfBanner = {
  titel: 'NICHTBEKANNTGABE – ERST 3 MONATE NACH ZUSTELLUNG (ART. 8a SCHKG)',
  text: 'Voraussetzung: Rechtsvorschlag erhoben. Das Amt fragt den Gläubiger an (20-Tage-Frist); keine Löschung im engeren Sinn.',
};

function eingabeInhalt({ a, set }: SeiteCtx<NbAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <Field label="Schuldnerin / Schuldner (gesuchstellende Partei)">
          <input className={inputCls} value={a.absenderName} onChange={(e) => set('absenderName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse" optional>
          <input className={inputCls} value={a.absenderAdresse} onChange={(e) => set('absenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Betreibungsamt" hint="das Amt, das die Betreibung führt (steht auf dem Zahlungsbefehl)">
          <input className={inputCls} value={a.adressatName} onChange={(e) => set('adressatName', e.target.value)} placeholder="z. B. Betreibungsamt Basel-Stadt" />
        </Field>
        <Field label="Adresse des Betreibungsamts" optional>
          <input className={inputCls} value={a.adressatAdresse} onChange={(e) => set('adressatAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <div className="lc-notice text-body-s">
          Zuständiges Betreibungsamt samt Adresse ermitteln: {' '}
          <Link to="/rechner/zustaendigkeit?rechtsweg=schkg" className="text-brass-700 underline">Zuständigkeits-Rechner (Betreibung)</Link>.
        </div>
      </div>
    );

    case 'betreibung': {
      const fruehester = nbFruehesterGesuchstag(a.zustellungZb);
      return (
        <div className="space-y-4">
          <Field label="Betreibungsnummer">
            <input className={inputCls + ' sm:max-w-[14rem]'} value={a.betreibungNr} onChange={(e) => set('betreibungNr', e.target.value)} placeholder="z. B. 2026/12345" />
          </Field>
          <Field label="Gläubigerin / Gläubiger" optional>
            <input className={inputCls} value={a.glaeubigerName} onChange={(e) => set('glaeubigerName', e.target.value)} placeholder="Firma / Vorname Name" />
          </Field>
          <Field label="Zustellung des Zahlungsbefehls" hint="das Gesuch ist erst nach Ablauf von drei Monaten seit der Zustellung zulässig">
            <DatumsFeld value={a.zustellungZb} onChange={(v) => set('zustellungZb', v)} className={inputCls} />
          </Field>
          {fruehester && (
            <div className="lc-notice text-body-s">
              Frühester Gesuchstag: <strong>{fmtDatum(fruehester)}</strong> – drei Monate seit Zustellung (Art. 8a Abs. 3 lit. d SchKG), vorsichtig nach den ZPO-Fristenregeln gerechnet (Fristbeginn am Folgetag, Art. 31 SchKG i. V. m. Art. 142 ZPO).
            </div>
          )}
          <Checkbox
            checked={a.rechtsvorschlag}
            onChange={(v) => set('rechtsvorschlag', v)}
            label={<><span>Ich habe <strong>Rechtsvorschlag erhoben</strong> <span className="text-ink-500">(zwingende Voraussetzung)</span></span></>} />
          <Checkbox
            checked={a.keinVerfahrenBekannt}
            onChange={(v) => set('keinVerfahrenBekannt', v)}
            label={<><span>Aussage aufnehmen: <strong>kein Beseitigungs-Verfahren bekannt</strong> <span className="text-ink-500">(nur wenn zutreffend – Rechtsöffnung/Klage wäre das Gegenteil)</span></span></>} />
          <Checkbox
            checked={a.beilageZb}
            onChange={(v) => set('beilageZb', v)}
            label={<><span>Beilagen-Zeile: <strong>Kopie des Zahlungsbefehls</strong></span></>} />
        </div>
      );
    }

    default: return null;
  }
}

function fehlerEingabe(a: NbAntworten, schritt: number, gates: { blocker: string[] }): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.absenderName.trim()) f.push('Schuldnerin/Schuldner (gesuchstellende Partei) angeben.');
    if (!a.adressatName.trim()) f.push('Betreibungsamt angeben.');
  }
  if (schritt === 1) {
    if (!a.betreibungNr.trim()) f.push('Betreibungsnummer angeben.');
    if (!istIsoDatum(a.zustellungZb)) f.push('Zustellungsdatum des Zahlungsbefehls angeben.');
    if (!a.rechtsvorschlag) f.push(...gates.blocker.filter((b) => b.includes('RECHTSVORSCHLAG')));
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<NbAntworten> = {
  cardId: 'nichtbekanntgabe-betreibung',
  musterdaten: MUSTER['nichtbekanntgabe-betreibung'],
  defaults: NB_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: nbZusammenstellen,
  pruefeGates: pruefeNbGates,
  schritte: SCHRITTE,
  overlineFallback: 'Betreibung & Konkurs (SchKG)',
  titel: 'Gesuch um Nichtbekanntgabe einer Betreibung',
  intro: 'Gesuch an das Betreibungsamt, eine Betreibung mit erhobenem Rechtsvorschlag Dritten nicht mehr bekannt zu geben («Löschung» im Betreibungsregisterauszug, Art. 8a Abs. 3 lit. d SchKG, Fassung seit 1.1.2026) – mit deterministischer 3-Monats-Schwelle und ehrlicher Offenlegung der Wieder-Bekanntgabe. Was Wertung wäre, wird offengelegt, nicht berechnet.',
  badge: 'Zu unterzeichnen',
  eingabeInhalt,
  fehlerEingabe,
  ortDatumLabel: 'Ort und Datum des Gesuchs',
  ortPlaceholder: 'z. B. Basel',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum des Gesuchs angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit das Gesuch trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Frühestens drei Monate nach Zustellung</strong><NormText text={` des Zahlungsbefehls einreichen (Art. 8a Abs. 3 lit. d SchKG).`} /></li>
        <li><strong>Unterschreiben</strong> – das Gesuch geht als unterzeichnete Eingabe an das Betreibungsamt.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Der Eintrag wird nicht gelöscht, sondern Dritten nicht mehr bekannt gegeben – und wieder bekannt gegeben, falls der Gläubiger den Nachweis erbringt oder die Betreibung fortsetzt.',
  banner: BANNER_NB,
  dateiBasis: 'Nichtbekanntgabe-Gesuch',
  pdfLabel: 'Gesuch als PDF',
  docxLabel: 'Gesuch als Word (DOCX)',
};

export function VorlageNichtbekanntgabe() {
  return <VorlagenSeite config={CONFIG} />;
}
