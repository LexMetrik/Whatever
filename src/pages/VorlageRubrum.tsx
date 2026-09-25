import { NormText } from '../components/NormText';
import {
  RUBRUM_DEFAULTS, rubrumZusammenstellen, pruefeRubrumGates,
  type RubrumAntworten, type RubrumInstanz,
} from '../lib/vorlagen/rubrum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { Field, inputCls } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';

// ─── Vorlagen-Wizard: Rubrum (Art. 238 ZPO / Art. 112 BGG) ──────────────────
// Gerichts-Baustein-Set (ROADMAP W2·7). Reiner Nutzer-Eingabe-Builder für den
// Kopf eines Entscheids; keine Rechtslogik (§2/§3) — die Norm-Anker sind live
// gegen Fedlex verifiziert (src/lib/vorlagen/rubrum.ts). Status «Entwurf» (§8).

const SPEICHER_KEY = 'lexmetrik.vorlage.rubrum.v1';

const SCHRITTE = [
  { id: 'gericht', label: 'Gericht & Verfahren' },
  { id: 'parteien', label: 'Parteien' },
  { id: 'gegenstand', label: 'Streitgegenstand' },
  { id: 'pruefen', label: 'Prüfen & Ausfüllen' },
] as const;

const BANNER_RU: PdfBanner = {
  titel: 'RUBRUM (ENTWURF) – VOM GERICHT ZU VERVOLLSTÄNDIGEN',
  text: 'Gerüst für den Kopf eines Entscheids (Art. 238 ZPO; beim Weiterzug Art. 112 BGG). Dispositiv, Begründung, Rechtsmittelbelehrung und Unterschrift sind zu ergänzen.',
};

const INSTANZEN: { code: RubrumInstanz; label: string; sub: string }[] = [
  { code: 'zivil', label: 'Kantonaler Zivilentscheid', sub: 'Inhalt nach Art. 238 ZPO' },
  { code: 'bger', label: 'Urteil des Bundesgerichts', sub: 'Eröffnung nach Art. 112 BGG' },
];

function eingabeInhalt({ a, set }: SeiteCtx<RubrumAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'gericht': return (
      <div className="space-y-4">
        <SelectionGrid
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          items={INSTANZEN.map((v) => ({ code: v.code, label: v.label, sub: v.sub }))}
          value={a.instanz}
          onSelect={(code) => set('instanz', code as RubrumInstanz)}
        />
        <Field label="Bezeichnung des Gerichts" hint="Art. 238 lit. a ZPO">
          <input className={inputCls} value={a.gericht} onChange={(e) => set('gericht', e.target.value)} placeholder="z. B. Bezirksgericht Zürich" />
        </Field>
        <Field label="Zusammensetzung / mitwirkende Personen" optional hint="Art. 238 lit. a ZPO – z. B. Einzelgericht, Kammer, Gerichtsschreiber">
          <input className={inputCls} value={a.besetzung} onChange={(e) => set('besetzung', e.target.value)} placeholder="z. B. Einzelrichterin lic. iur. A. Muster" />
        </Field>
        <Field label="Geschäftsnummer" optional>
          <input className={inputCls} value={a.verfahrenNr} onChange={(e) => set('verfahrenNr', e.target.value)} placeholder="z. B. CG26 12345" />
        </Field>
      </div>
    );

    case 'parteien': return (
      <div className="space-y-4">
        <Field label="Klagende / gesuchstellende Partei" hint="Art. 238 lit. c ZPO">
          <input className={inputCls} value={a.klaeger} onChange={(e) => set('klaeger', e.target.value)} placeholder="Vorname Name / Firma, Adresse" />
        </Field>
        <Field label="Vertretung der klagenden Partei" optional>
          <input className={inputCls} value={a.klaegerVertretung} onChange={(e) => set('klaegerVertretung', e.target.value)} placeholder="z. B. Rechtsanwältin B. Beispiel" />
        </Field>
        <Field label="Beklagte / gesuchsgegnerische Partei" hint="Art. 238 lit. c ZPO">
          <input className={inputCls} value={a.beklagte} onChange={(e) => set('beklagte', e.target.value)} placeholder="Vorname Name / Firma, Adresse" />
        </Field>
        <Field label="Vertretung der beklagten Partei" optional>
          <input className={inputCls} value={a.beklagteVertretung} onChange={(e) => set('beklagteVertretung', e.target.value)} placeholder="z. B. Rechtsanwalt C. Muster" />
        </Field>
      </div>
    );

    case 'gegenstand': return (
      <div className="space-y-4">
        <Field label="Streitgegenstand" hint="erscheint als «betreffend …»">
          <input className={inputCls} value={a.streitgegenstand} onChange={(e) => set('streitgegenstand', e.target.value)} placeholder="z. B. Forderung" />
        </Field>
        <div className="lc-notice text-body-s">
          <NormText text={`Das Rubrum ist der Kopf des Entscheids. Dispositiv, Entscheidgründe, Rechtsmittelbelehrung und Unterschrift ergänzt die zuständige Person (Art. 238 ZPO; Art. 112 BGG).`} />
        </div>
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: RubrumAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (SCHRITTE[schritt].id === 'gericht' && !a.gericht.trim()) f.push('Bezeichnung des Gerichts angeben (Art. 238 lit. a ZPO).');
  if (SCHRITTE[schritt].id === 'parteien') {
    if (!a.klaeger.trim()) f.push('Klagende/gesuchstellende Partei bezeichnen (Art. 238 lit. c ZPO).');
    if (!a.beklagte.trim()) f.push('Beklagte/gesuchsgegnerische Partei bezeichnen (Art. 238 lit. c ZPO).');
  }
  if (SCHRITTE[schritt].id === 'gegenstand' && !a.streitgegenstand.trim()) f.push('Streitgegenstand angeben.');
  return f;
}

const CONFIG: VorlagenSeitenConfig<RubrumAntworten> = {
  cardId: 'rubrum',
  musterdaten: MUSTER.rubrum,
  defaults: RUBRUM_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: rubrumZusammenstellen,
  pruefeGates: pruefeRubrumGates,
  schritte: SCHRITTE,
  overlineFallback: 'Zivilprozess (ZPO) & Bundesgericht',
  titel: 'Rubrum (Entscheidkopf)',
  intro: 'Gerüst für den Kopf eines Gerichtsentscheids – Gericht und Besetzung, Parteien und ihre Vertretung, Streitgegenstand (Art. 238 ZPO; beim Weiterzug ans Bundesgericht Art. 112 BGG). Reiner Baustein: LexMetrik füllt nur Ihre Angaben ein und berechnet nichts.',
  badge: 'Entwurf',
  eingabeInhalt,
  fehlerEingabe,
  ortDatumLabel: 'Ort und Datum des Entscheids',
  ortPlaceholder: 'z. B. Zürich',
  ortFehler: 'Ort des Entscheids angeben (Art. 238 lit. b ZPO).',
  datumFehler: 'Datum des Entscheids angeben (Art. 238 lit. b ZPO).',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit das Rubrum vollständig wird</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Kopf zuerst:</strong> Das Rubrum bezeichnet Gericht, Parteien und Gegenstand.</li>
        <li><strong>Was noch fehlt:</strong><NormText text={` Dispositiv, Entscheidgründe, Rechtsmittelbelehrung und Unterschrift ergänzen (Art. 238 ZPO; beim Weiterzug Art. 112 BGG).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Das Rubrum ist ein Entwurf des Entscheidkopfs; der vollständige Entscheid wird von der zuständigen Person erstellt.',
  banner: BANNER_RU,
  dateiBasis: 'Rubrum',
  pdfLabel: 'Rubrum als PDF',
  docxLabel: 'Rubrum als Word (DOCX)',
};

export function VorlageRubrum() {
  return <VorlagenSeite config={CONFIG} />;
}
