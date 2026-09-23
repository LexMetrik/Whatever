import { NormText } from '../components/NormText';
import {
  SB_DEFAULTS, sbZusammenstellen, sbMaengel, sbHinweise, type SbAntworten,
} from '../lib/vorlagen/scheidungsbegehren';
import { KV_GERICHTE_BS } from '../lib/vorlagen/klageVereinfacht';
import { ParteiEditor } from './VorlageKlageVereinfacht';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, ListenEditor, NICHT_GESPEICHERT_HINWEIS, inputCls } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { GerichtsWahlBlock } from '../components/vorlagen/GerichtsWahlBlock';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';

// ─── Vorlagen-Wizard: Gemeinsames Scheidungsbegehren (Art. 285/286 ZPO) ─────
// Zweite Musterklagen-Maske Familienrecht (Bauspez. §3.2). Weiche
// umfassende Einigung (Art. 111 ZGB/285 ZPO) ↔ Teileinigung (Art. 112
// ZGB/286 ZPO) mit dem PFLICHT-Antrag auf gerichtliche Beurteilung der
// streitigen Folgen. BEWUSST ohne localStorage (Parteidaten).

const SCHRITTE = [
  { id: 'gericht', label: 'Gericht & Einigung' },
  { id: 'parteien', label: 'Ehegatten & Kinder' },
  { id: 'vereinbarung', label: 'Vereinbarung & Anträge' },
  { id: 'pruefen', label: 'Prüfen & Ausgabe' },
] as const;

const BANNER_SB: PdfBanner = {
  titel: 'VON BEIDEN EHEGATTEN ZU UNTERZEICHNEN',
  text: 'Gemeinsames Scheidungsbegehren (Art. 285/286 ZPO) – mit der Vereinbarung über die Scheidungsfolgen und den Belegen einzureichen.',
};

const listeSetzen = (xs: string[], i: number, v: string) => xs.map((x, j) => (j === i ? v : x));

function eingabeInhalt({ a, set }: SeiteCtx<SbAntworten>, schritt: number) {
  const kinderSetzen = (idx: number, k: Partial<SbAntworten['kinder'][number]>) => {
    set('kinder', a.kinder.map((x, i) => (i === idx ? { ...x, ...k } : x)));
  };

  const freitextListe = (feld: 'streitigePunkte' | 'antraegeEhegatte1' | 'antraegeEhegatte2', label: string, placeholder: string) => (
    <Field label={label} optional={feld !== 'streitigePunkte'}>
      {/* Wrapper-<div> bleibt: `Field` verknüpft nur ein Einzel-Control. */}
      <div>
        {/* R2-F/F1-9: «×» als Entfernen und «+ Eintrag hinzufügen» wichen dem
            geteilten ListenEditor. Das `label` der Gruppe steht am `Field`,
            der Eintrag trägt neu die Nummer in der Kopfzeile. */}
        <ListenEditor
          element="Eintrag"
          eintraege={a[feld]}
          className="space-y-2"
          onHinzufuegen={() => set(feld, [...a[feld], ''])}
          onEntfernen={(i) => set(feld, a[feld].filter((_, j) => j !== i))}
          kinder={(r, i) => (
            <input className={inputCls} value={r} placeholder={placeholder}
              aria-label={`${label} — Eintrag ${i + 1}`}
              onChange={(e) => set(feld, listeSetzen(a[feld], i, e.target.value))} />
          )}
        />
      </div>
    </Field>
  );

  switch (SCHRITTE[schritt].id) {
    case 'gericht': return (
      <div className="space-y-4">
        <Field label="Einigungsstand">
          <SelectionGrid
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            items={[
              { code: 'voll' as const, label: 'Umfassende Einigung (Art. 285 ZPO)', sub: 'vollständige Vereinbarung über ALLE Scheidungsfolgen liegt vor (Art. 111 ZGB)' },
              { code: 'teil' as const, label: 'Teileinigung (Art. 286 ZPO)', sub: 'streitige Folgen soll das Gericht beurteilen (Art. 112 ZGB)' },
            ]}
            value={a.einigung}
            onSelect={(code) => set('einigung', code)}
          />
        </Field>
        <GerichtsWahlBlock
          layout="gestapelt"
          kantonHinweis="zwingender Gerichtsstand: Wohnsitz einer Partei (Art. 23 Abs. 1 ZPO)"
          kanton={a.gerichtsKanton} onKanton={(k) => set('gerichtsKanton', k)}
          bsAdresse={{
            zeilen: [KV_GERICHTE_BS.zivilgericht.name, KV_GERICHTE_BS.zivilgericht.strasse, KV_GERICHTE_BS.zivilgericht.plzOrt],
            url: KV_GERICHTE_BS.zivilgericht.url,
          }}
          aufgeloest={a.gerichtAufgeloest}
          ohneAdresseHinweis="Gericht unten über die kantonale Gerichtsschicht bestimmen — oder von Hand erfassen."
          materie="" onAufgeloest={(z) => set('gerichtAufgeloest', z ?? undefined)}
          manuellAktiv={a.gerichtManuellAktiv ?? false}
          onManuellAktiv={(v) => set('gerichtManuellAktiv', v || undefined)}
          uebersteuertHinweis={false}
          manuell={a.gerichtManuell} onManuell={(g) => set('gerichtManuell', g)}
          platzhalter={{ name: 'z. B. Bezirksgericht X' }}
          // Diese Maske ist als einzige der fünf NICHT pane-adaptiv (kein
          // usePaneKlasse). Entdopplung D2 hält den Ist-Zustand byte-gleich
          // fest (§6) — die Angleichung wäre eine sichtbare Änderung und
          // gehört in einen eigenen, deklarierten Schritt.
          spaltenKlasse="grid grid-cols-1 sm:grid-cols-2 gap-3" />
      </div>
    );

    case 'parteien': return (
      <div className="space-y-5">
        <Field label="Ehegatte/Ehegattin 1">
          <ParteiEditor p={a.ehegatte1} onChange={(p) => set('ehegatte1', p)} nurNatuerlich />
        </Field>
        <Field label="Vertretung Partei 1" optional>
          <input className={inputCls} value={a.vertretung1 ?? ''} onChange={(e) => set('vertretung1', e.target.value || undefined)} placeholder="z. B. RA lic. iur. X" />
        </Field>
        <Field label="Ehegatte/Ehegattin 2">
          <ParteiEditor p={a.ehegatte2} onChange={(p) => set('ehegatte2', p)} nurNatuerlich />
        </Field>
        <Field label="Vertretung Partei 2" optional>
          <input className={inputCls} value={a.vertretung2 ?? ''} onChange={(e) => set('vertretung2', e.target.value || undefined)} placeholder="z. B. RA lic. iur. Y" />
        </Field>
        <Checkbox
          checked={a.kinderErfassen}
          onChange={(v) => set('kinderErfassen', v)}
          label={<><span>Gemeinsame minderjährige Kinder <span className="text-ink-500"><NormText text={`(gemeinsame Anträge sind Mindestinhalt, Art. 285 lit. d ZPO)`} /></span></span></>} />
        {a.kinderErfassen && (
          <div className="space-y-3 pl-6">
            {/* R2-F/F1-9: «Entfernen» stand hier als `lc-btn-ghost lc-btn-sm`
                in einer eigenen Grid-Spalte, der Knopf hiess «+ Kind
                hinzufügen». Kanon ist der ListenEditor; die Kind-Nummer
                trägt neu die Kopfzeile statt des Vornamen-Labels. */}
            <ListenEditor
              element="Kind"
              eintraege={a.kinder}
              onHinzufuegen={() => set('kinder', [...a.kinder, { vorname: '', geburtsdatum: '' }])}
              onEntfernen={(i) => set('kinder', a.kinder.filter((_, j) => j !== i))}
              kinder={(k, i) => (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_11rem] gap-3 items-end">
                  <Field label="Vorname">
                    <input className={inputCls} value={k.vorname} onChange={(e) => kinderSetzen(i, { vorname: e.target.value })} />
                  </Field>
                  <Field label="Geburtsdatum">
                    <DatumsFeld value={k.geburtsdatum} onChange={(v) => kinderSetzen(i, { geburtsdatum: v })} className={inputCls} />
                  </Field>
                </div>
              )}
            />
          </div>
        )}
      </div>
    );

    case 'vereinbarung': return (
      <div className="space-y-4">
        <Field label={a.einigung === 'voll' ? 'Datum der vollständigen Vereinbarung' : 'Datum der Teilvereinbarung'}
          hint="die Vereinbarung ist Pflichtbeilage (Art. 285 lit. c ZPO) — diese Eingabe erstellt das Begehren, nicht die Vereinbarung selbst">
          <DatumsFeld value={a.vereinbarungDatum} onChange={(v) => set('vereinbarungDatum', v)} className={inputCls} />
        </Field>
        {a.einigung === 'teil' && (
          <>
            {freitextListe('streitigePunkte',
              'Streitige Scheidungsfolgen (Pflicht, Art. 286 Abs. 1 ZPO)',
              'z. B. nachehelicher Unterhalt')}
            {freitextListe('antraegeEhegatte1',
              'Anträge Partei 1 zu den streitigen Folgen (Art. 286 Abs. 2 ZPO)',
              'z. B. Es sei kein nachehelicher Unterhalt zuzusprechen')}
            {freitextListe('antraegeEhegatte2',
              'Anträge Partei 2 zu den streitigen Folgen (Art. 286 Abs. 2 ZPO)',
              'z. B. Die Partei 1 sei zu monatlichem Unterhalt von CHF … zu verpflichten')}
          </>
        )}
        <Checkbox
          checked={a.kostenHaelftig}
          onChange={(v) => set('kostenHaelftig', v)}
          label={<><span>Kosten-Antrag: hälftige Gerichtskosten, keine Parteientschädigungen <span className="text-ink-500">(üblich beim gemeinsamen Begehren)</span></span></>} />
      </div>
    );
  }
}

const fehlerEingabe = (a: SbAntworten, schritt: number): string[] =>
  sbMaengel(a).filter((m) => m.schritt === schritt).map((m) => m.text);

// Orchestrierung im generischen Rahmen (W2·29-WERKBANK-VORLAGEN V2b). Ist-Zustand
// vor dem Umzug, je per Slot gehalten (§6): kein speicherKey, Mängel-Liste als
// Schritt-Fehler (auch im letzten Schritt) und als Export-Gate (ExportLeiste +
// Direkt-Export, B1-1), Hinweise im Ist-Format ohne NormText (pruefenZusatz),
// Ort/Datum ohne Feld-Fehler, kompakte Vorschau.
const CONFIG: VorlagenSeitenConfig<SbAntworten> = {
  cardId: 'scheidungsbegehren-gemeinsam',
  defaults: SB_DEFAULTS,
  zusammenstellen: (a) => ({ ergebnis: sbZusammenstellen(a) }),
  pruefeGates: (a) => ({ blocker: sbMaengel(a).map((m) => m.text), warnungen: [], hinweise: [] }),
  schritte: SCHRITTE,
  overlineFallback: 'Familienrecht',
  titel: 'Gemeinsames Scheidungsbegehren',
  intro: 'Die gemeinsame Eingabe beider Ehegatten nach Art. 285/286 ZPO — bei umfassender Einigung mit Genehmigungsantrag zur vollständigen Vereinbarung (Art. 111 ZGB), bei Teileinigung mit dem Pflicht-Antrag, die streitigen Folgen gerichtlich zu beurteilen (Art. 112 ZGB). Inhalte der Vereinbarung bleiben Ihre Entscheidung; die Eingabe strukturiert den gesetzlichen Mindestinhalt.',
  badge: 'Beide unterzeichnen',
  fussnote: NICHT_GESPEICHERT_HINWEIS,
  eingabeInhalt,
  fehlerEingabe,
  fehlerEingabeImLetztenSchritt: true,
  pruefenZusatz: ({ a }) => sbHinweise(a).map((h, i) => (
    <div key={i} className="lc-notice text-body-s">{h}</div>
  )),
  ortDatumLabel: 'Ort und Datum der Eingabe (Art. 285 lit. f ZPO)',
  ortPlaceholder: 'z. B. Zürich',
  bestaetigung: ({ a }) => (
    <>
      <p className="lc-overline text-brass-700">Vor der Einreichung</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>BEIDE Ehegatten unterzeichnen</strong><NormText text={` die Eingabe (Art. 285 lit. f ZPO).`} /></li>
        <li><strong>Beilegen:</strong> {a.einigung === 'voll' ? 'vollständige Vereinbarung' : 'Teilvereinbarung'} samt Belegen, Familienausweis{a.kinderErfassen ? ', Geburtsurkunden' : ''} (Art. 285 lit. c/e ZPO).</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Das Gericht hört beide Parteien an, prüft die Vereinbarung und ist bei Kinderbelangen an die Anträge nicht gebunden.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  vorschauKompakt: true,
  banner: BANNER_SB,
  dateiBasis: 'Gemeinsames-Scheidungsbegehren',
  pdfLabel: 'Begehren als PDF',
  docxLabel: 'Begehren als Word (DOCX)',
};

export function VorlageScheidungsbegehren() {
  return <VorlagenSeite config={CONFIG} />;
}
