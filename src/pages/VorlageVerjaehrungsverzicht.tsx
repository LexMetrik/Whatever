import { Link } from 'react-router-dom';
import { NormText } from '../components/NormText';
import {
  VV_DEFAULTS, vvZusammenstellen, pruefeVvGates, type VvAntworten,
} from '../lib/vorlagen/verjaehrungsverzicht';
import { KDG_ZUGANGS_HINWEIS } from '../lib/vorlagen/kuendigungGemeinsam';
import { zahl } from '../lib/vorlagen/datum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';

// ─── Vorlagen-Wizard: Verjährungsverzichtserklärung (Art. 141 OR) ───────────
// P1-Vorlage der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V2).
// Erklärende Partei ist die SCHULDNERSEITE; Schriftform ist Gültigkeits-
// voraussetzung (Art. 141 Abs. 1bis OR). Die Höchstdauer-Mechanik liegt in
// pruefeVvGates; die salvatorische Begrenzung steht fest im Dokument.
// Umgestellt auf generische VorlagenSeite (FUNDAMENT-UMBAU Thema A).

const SPEICHER_KEY = 'lexmetrik.vorlage.verjaehrungsverzicht.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'forderung', label: 'Forderung & Dauer' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_VV: PdfBanner = {
  titel: 'VERJÄHRUNGSVERZICHT – SCHRIFTFORM ZWINGEND (ART. 141 ABS. 1bis OR)',
  text: 'Von der Schuldnerseite zu unterzeichnen und nachweisbar zuzustellen. Gilt längstens für die gesetzliche Höchstdauer.',
};

function eingabeInhalt({ a, set }: SeiteCtx<VvAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <div className="lc-notice text-body-s">
          Nur die <strong>Schuldnerseite</strong> kann auf die Einrede verzichten (Art. 141 Abs. 1 OR) –
          sie ist hier die erklärende Partei und unterschreibt.
        </div>
        <Field label="Schuldnerin / Schuldner (erklärende Partei)">
          <input className={inputCls} value={a.absenderName} onChange={(e) => set('absenderName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse der Schuldnerseite" optional>
          <input className={inputCls} value={a.absenderAdresse} onChange={(e) => set('absenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Gläubigerin / Gläubiger (Empfänger)">
          <input className={inputCls} value={a.adressatName} onChange={(e) => set('adressatName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse der Gläubigerseite" optional>
          <input className={inputCls} value={a.adressatAdresse} onChange={(e) => set('adressatAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'forderung': return (
      <div className="space-y-4">
        <Field label="Forderung" hint="bestimmte Bezeichnung – erscheint im Betreff und im Verzichts-Satz">
          <input className={inputCls} value={a.forderungBeschrieb} onChange={(e) => set('forderungBeschrieb', e.target.value)} placeholder="z. B. Werklohnforderung aus Werkvertrag vom 1. Februar 2026" />
        </Field>
        <Checkbox
          checked={a.betragErfassen}
          onChange={(v) => set('betragErfassen', v)}
          label={<><span>Betrag in der Erklärung nennen <span className="text-ink-500">(optional – die Bezeichnung muss die Forderung auch ohne Betrag bestimmen)</span></span></>} />
        {a.betragErfassen && (
          <Field label="Forderungsbetrag (CHF)">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.betrag} onChange={(v) => set('betrag', v)} placeholder="z. B. 25'000.00" />
          </Field>
        )}
        <Field label="Verzicht bis (Enddatum)" hint="höchstens zehn Jahre ab Datum dieser Erklärung (Art. 141 Abs. 1 OR) – das Gesetz lässt den Beginn offen, die Erklärung legt ihn darum selbst fest">
          <DatumsFeld value={a.verzichtBis} onChange={(v) => set('verzichtBis', v)} className={inputCls} />
        </Field>
        <Checkbox
          checked={a.vorbehaltEingetreten}
          onChange={(v) => set('vorbehaltEingetreten', v)}
          label={<><span>Vorbehalt: Verzicht gilt nur, <strong>soweit die Verjährung nicht bereits eingetreten</strong> ist <span className="text-ink-500">(Praxis-Standard)</span></span></>} />
        <Checkbox
          checked={a.keineAnerkennung}
          onChange={(v) => set('keineAnerkennung', v)}
          label={<><span>Klarstellung: <strong>keine Anerkennung</strong><NormText text={` der Forderung (Art. 135 Ziff. 1 OR) `} /><span className="text-ink-500">(Praxis-Standard)</span></span></>} />
        <div className="lc-notice text-body-s">
          Läuft die Frist bald ab? Verjährung samt Unterbrechungs-Folgen rechnen: {' '}
          <Link to="/rechner/verjaehrung" className="text-brass-700 underline">Verjährungs-Rechner</Link>.
        </div>
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: VvAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.absenderName.trim()) f.push('Schuldnerin/Schuldner (erklärende Partei) angeben.');
    if (!a.adressatName.trim()) f.push('Gläubigerin/Gläubiger angeben.');
  }
  if (schritt === 1) {
    if (!a.forderungBeschrieb.trim()) f.push('Forderung bezeichnen (z. B. «Werklohnforderung aus Werkvertrag vom 1. Februar 2026»).');
    if (!istIsoDatum(a.verzichtBis)) f.push('Ende des Verzichts angeben.');
    if (a.betragErfassen && zahl(a.betrag) === null) f.push('Betrag in CHF angeben (oder Erfassung deaktivieren).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<VvAntworten> = {
  cardId: 'verjaehrungsverzicht',
  musterdaten: MUSTER.verjaehrungsverzicht,
  defaults: VV_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: vvZusammenstellen,
  pruefeGates: pruefeVvGates,
  schritte: SCHRITTE,
  overlineFallback: 'Vertrag & Forderung (OR)',
  titel: 'Verjährungsverzichtserklärung',
  intro: 'Erklärung der Schuldnerseite, für eine bestimmte Zeit auf die Einrede der Verjährung zu verzichten (Art. 141 OR) – mit fester Begrenzung auf die gesetzliche Höchstdauer, Standard-Vorbehalten und zwingender Schriftform. Was Wertung wäre, wird offengelegt, nicht berechnet.',
  badge: 'Zu unterzeichnen',
  eingabeInhalt,
  fehlerEingabe,
  ortDatumLabel: 'Ort und Datum der Erklärung',
  ortPlaceholder: 'z. B. Basel',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum der Erklärung angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit der Verzicht trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Schriftform ist zwingend</strong><NormText text={` (Art. 141 Abs. 1bis OR) – drucken und von der Schuldnerseite unterschreiben lassen.`} /></li>
        <li><strong>Zustellung nachweisen</strong> – {KDG_ZUGANGS_HINWEIS}</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Der Verzicht wirkt längstens für die gesetzliche Höchstdauer und ist keine Anerkennung der Forderung – massgebend sind Gesetz und konkreter Sachverhalt.',
  banner: BANNER_VV,
  dateiBasis: 'Verjaehrungsverzicht',
  pdfLabel: 'Verzichtserklärung als PDF',
  docxLabel: 'Verzichtserklärung als Word (DOCX)',
};

export function VorlageVerjaehrungsverzicht() {
  return <VorlagenSeite config={CONFIG} />;
}
