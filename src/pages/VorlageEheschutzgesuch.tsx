import { NormText } from '../components/NormText';
import {
  EG_DEFAULTS, egZusammenstellen, egMaengel, egHinweise, type EgAntworten,
} from '../lib/vorlagen/eheschutzgesuch';
import { KV_GERICHTE_BS } from '../lib/vorlagen/klageVereinfacht';
import { ParteiEditor } from './VorlageKlageVereinfacht';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, ListenEditor, NICHT_GESPEICHERT_HINWEIS, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { GerichtsWahlBlock } from '../components/vorlagen/GerichtsWahlBlock';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Vorlagen-Wizard: Eheschutzgesuch (Art. 175 ff. ZGB, summarisch) ────────
// Dritte Musterklagen-Maske Familienrecht (Bauspez. §3.1): der Begehren-
// Katalog trägt deterministische FORMELN (Wohnungs-Auszugsfrist, «monatlich
// im Voraus auf den Ersten», Rückwirkungs-Zusatz 173 III) — Beträge und
// Würdigungen bleiben Eingaben (§2). BEWUSST ohne localStorage.

const SCHRITTE = [
  { id: 'gericht', label: 'Gericht' },
  { id: 'parteien', label: 'Parteien & Kinder' },
  { id: 'massnahmen', label: 'Massnahmen & Unterhalt' },
  { id: 'pruefen', label: 'Prüfen & Ausgabe' },
] as const;

const BANNER_EG: PdfBanner = {
  titel: 'NACH DEM AUSDRUCK EIGENHÄNDIG UNTERZEICHNEN',
  text: 'Eheschutzgesuch (Art. 175 ff. ZGB) – summarisches Verfahren; Tatsachen glaubhaft machen, Belege beilegen.',
};

// Schritte sind eine Komponente, weil sie usePaneKlasse brauchen.
function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<EgAntworten>; schritt: number }) {
  const pk = usePaneKlasse();
  const kinderSetzen = (idx: number, k: Partial<EgAntworten['kinder'][number]>) => {
    set('kinder', a.kinder.map((x, i) => (i === idx ? { ...x, ...k } : x)));
  };

  switch (SCHRITTE[schritt].id) {
    case 'gericht': return (
      <div className="space-y-4">
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
          manuell={a.gerichtManuell} onManuell={(g) => set('gerichtManuell', g)} />
        <Field label="Faktisch getrennt seit" optional hint="erscheint im Feststellungs-Begehren">
          <DatumsFeld value={a.getrenntSeit} onChange={(v) => set('getrenntSeit', v)} className={inputCls} />
        </Field>
      </div>
    );

    case 'parteien': return (
      <div className="space-y-5">
        <Field label="Gesuchstellende Partei">
          <ParteiEditor p={a.gesuchsteller} onChange={(p) => set('gesuchsteller', p)} nurNatuerlich />
        </Field>
        <Field label="Vertretung" optional>
          <input className={inputCls} value={a.vertretung ?? ''} onChange={(e) => set('vertretung', e.target.value || undefined)} placeholder="z. B. RA lic. iur. X" />
        </Field>
        <Field label="Gesuchsgegnerische Partei">
          <ParteiEditor p={a.gesuchsgegner} onChange={(p) => set('gesuchsgegner', p)} nurNatuerlich />
        </Field>
        <Checkbox
          checked={a.kinderErfassen}
          onChange={(v) => set('kinderErfassen', v)}
          label={<><span>Gemeinsame minderjährige Kinder <span className="text-ink-500"><NormText text={`(Massnahmen nach Kindesrecht, Art. 176 Abs. 3 ZGB)`} /></span></span></>} />
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
                <div className={pk('grid grid-cols-1 sm:grid-cols-[1fr_11rem] gap-3 items-end', 'grid grid-cols-1 @xl/pane:grid-cols-[1fr_11rem] gap-3 items-end')}>
                  <Field label="Vorname">
                    <input className={inputCls} value={k.vorname} onChange={(e) => kinderSetzen(i, { vorname: e.target.value })} />
                  </Field>
                  <Field label="Geburtsdatum">
                    <DatumsFeld value={k.geburtsdatum} onChange={(v) => kinderSetzen(i, { geburtsdatum: v })} className={inputCls} />
                  </Field>
                </div>
              )}
            />
            <Field label="Obhut (Antrag)">
              <SelectionGrid
                className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
                items={[
                  { code: 'gericht' as const, label: 'Gerichtlich zu regeln' },
                  { code: 'gesuchsteller' as const, label: 'Obhut bei der gesuchstellenden Partei' },
                  { code: 'gesuchsgegner' as const, label: 'Obhut bei der gesuchsgegnerischen Partei' },
                  { code: 'alternierend' as const, label: 'Alternierende Obhut' },
                ]}
                value={a.obhut}
                onSelect={(code) => set('obhut', code)}
              />
            </Field>
            <Checkbox
              checked={a.verkehrGerichtsueblich}
              onChange={(v) => set('verkehrGerichtsueblich', v)}
              label={<><span>Persönlicher Verkehr nach dem <strong>gerichtsüblichen</strong> Besuchs- und Ferienrecht beantragen <span className="text-ink-500">(sonst: gerichtlich zu regeln)</span></span></>} />
          </div>
        )}
      </div>
    );

    case 'massnahmen': return (
      <div className="space-y-4">
        <Field label="Eheliche Wohnung (Art. 176 Abs. 1 Ziff. 2 ZGB)">
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
            items={[
              { code: 'gesuchsteller' as const, label: 'Zuweisung an die gesuchstellende Partei' },
              { code: 'gesuchsgegner' as const, label: 'Zuweisung an die Gegenpartei' },
              { code: 'gericht' as const, label: 'Gerichtlich zu regeln' },
              { code: 'keine' as const, label: 'Kein Wohnungs-Begehren' },
            ]}
            value={a.wohnung}
            onSelect={(code) => set('wohnung', code)}
          />
        </Field>
        {(a.wohnung === 'gesuchsteller' || a.wohnung === 'gesuchsgegner') && (
          <Field label="Auszugsfrist (Tage seit Rechtskraft)" hint="übliches Raster — keine gesetzliche Vorgabe">
            <input className={inputCls + ' sm:max-w-[8rem]'} inputMode="numeric" value={String(a.auszugsfristTage)}
              onChange={(e) => set('auszugsfristTage', Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
          </Field>
        )}
        {a.kinderErfassen && (
          <>
            <Field label="Kindesunterhalt">
              <SelectionGrid
                className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
                items={[
                  { code: 'gericht' as const, label: 'Gerichtlich festzusetzen' },
                  { code: 'beziffert' as const, label: 'Beziffert (Bar/Betreuung getrennt)' },
                ]}
                value={a.kindesunterhalt}
                onSelect={(code) => set('kindesunterhalt', code)}
              />
            </Field>
            {a.kindesunterhalt === 'beziffert' && (
              <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
                <Field label="Barunterhalt je Kind (CHF/Monat)">
                  <BetragsFeld className={inputCls} value={a.barunterhaltBetrag}
                    onChange={(v) => set('barunterhaltBetrag', v)} placeholder="z. B. 1'200" />
                </Field>
                <Field label="Betreuungsunterhalt (CHF/Monat)" optional>
                  <BetragsFeld className={inputCls} value={a.betreuungsunterhaltBetrag}
                    onChange={(v) => set('betreuungsunterhaltBetrag', v)} placeholder="z. B. 800" />
                </Field>
              </div>
            )}
          </>
        )}
        <Field label="Ehegattenunterhalt (Art. 176 Abs. 1 Ziff. 1 ZGB)">
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={[
              { code: 'gericht' as const, label: 'Gerichtlich festzusetzen' },
              { code: 'beziffert' as const, label: 'Beziffert' },
              { code: 'keiner' as const, label: 'Kein Begehren' },
            ]}
            value={a.ehegattenunterhalt}
            onSelect={(code) => set('ehegattenunterhalt', code)}
          />
        </Field>
        {a.ehegattenunterhalt === 'beziffert' && (
          <Field label="Ehegattenunterhalt (CHF/Monat)" hint="die Höhe ist Ihre Würdigung — LexMetrik rechnet keinen Unterhalt">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.ehegattenBetrag}
              onChange={(v) => set('ehegattenBetrag', v)} placeholder="z. B. 2'500" />
          </Field>
        )}
        {a.ehegattenunterhalt !== 'keiner' && (
          <Checkbox
            checked={a.rueckwirkung}
            onChange={(v) => set('rueckwirkung', v)}
            label={<><span>Rückwirkend auch für das <strong>Jahr vor Einreichung</strong> fordern <span className="text-ink-500"><NormText text={`(Art. 173 Abs. 3 ZGB — weiter zurück nicht möglich)`} /></span></span></>} />
        )}
        <Checkbox
          checked={a.gueterTrennung}
          onChange={(v) => set('gueterTrennung', v)}
          label={<><span>Gütertrennung beantragen <span className="text-ink-500"><NormText text={`(Art. 176 Abs. 1 Ziff. 3 ZGB — nur «wenn es die Umstände rechtfertigen»)`} /></span></span></>} />
        <Checkbox
          checked={a.schuldneranweisung}
          onChange={(v) => set('schuldneranweisung', v)}
          label={<><span>Schuldneranweisung beantragen <span className="text-ink-500"><NormText text={`(Art. 177 ZGB — bei Nichterfüllung der Unterhaltspflicht)`} /></span></span></>} />
        {a.schuldneranweisung && (
          <Field label="Arbeitgeberin / Schuldner der Gegenpartei">
            <input className={inputCls} value={a.arbeitgeberName} onChange={(e) => set('arbeitgeberName', e.target.value)} placeholder="z. B. Muster AG, Zürich" />
          </Field>
        )}
        <Checkbox
          checked={a.verfuegungsbeschraenkung}
          onChange={(v) => set('verfuegungsbeschraenkung', v)}
          label={<><span>Verfügungsbeschränkung beantragen <span className="text-ink-500"><NormText text={`(Art. 178 ZGB — Vermögenswert individuell bezeichnen)`} /></span></span></>} />
        {a.verfuegungsbeschraenkung && (
          <Field label="Vermögenswert (individuell)" hint="z. B. Grundstück mit Grundbuchblatt-Nr., Konto mit IBAN — keine Gesamtsperre">
            <input className={inputCls} value={a.vermoegenswert} onChange={(e) => set('vermoegenswert', e.target.value)} />
          </Field>
        )}
      </div>
    );
  }
}

const fehlerEingabe = (a: EgAntworten, schritt: number): string[] =>
  egMaengel(a).filter((m) => m.schritt === schritt).map((m) => m.text);

// Orchestrierung im generischen Rahmen (W2·29-WERKBANK-VORLAGEN V2b). Ist-Zustand
// vor dem Umzug, je per Slot gehalten (§6): kein speicherKey, Mängel-Liste als
// Schritt-Fehler (auch im letzten Schritt) und als Export-Gate (ExportLeiste +
// Direkt-Export, B1-1), Hinweise im Ist-Format ohne NormText samt Vollmacht-
// Schalter (pruefenZusatz), Ort/Datum ohne Feld-Fehler, kompakte Vorschau.
const CONFIG: VorlagenSeitenConfig<EgAntworten> = {
  cardId: 'eheschutzgesuch',
  defaults: EG_DEFAULTS,
  zusammenstellen: (a) => ({ ergebnis: egZusammenstellen(a) }),
  pruefeGates: (a) => ({ blocker: egMaengel(a).map((m) => m.text), warnungen: [], hinweise: [] }),
  schritte: SCHRITTE,
  overlineFallback: 'Familienrecht',
  titel: 'Eheschutzgesuch',
  intro: 'Das Gesuch um Regelung des Getrenntlebens (Art. 175 f. ZGB) im summarischen Verfahren — mit dem vollen Begehren-Katalog: Wohnung mit Auszugsfrist, Obhut und persönlicher Verkehr, Bar- und Betreuungsunterhalt als getrennte Begehren, Rückwirkung nach Art. 173 Abs. 3 ZGB, Gütertrennung, Schuldneranweisung und Verfügungsbeschränkung. Formeln sind berechnet, Beträge und Würdigungen bleiben Ihre Eingabe.',
  badge: 'Zu unterzeichnen',
  fussnote: NICHT_GESPEICHERT_HINWEIS,
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  fehlerEingabeImLetztenSchritt: true,
  pruefenZusatz: ({ a, set }) => (
    <>
      {egHinweise(a).map((h, i) => (
        <div key={i} className="lc-notice text-body-s">{h}</div>
      ))}
      <Checkbox
        checked={a.vollmachtBeilage}
        onChange={(v) => set('vollmachtBeilage', v)}
        label={<><span>Vollmacht als Beilage aufführen</span></>} />
    </>
  ),
  ortDatumLabel: 'Ort und Datum der Eingabe',
  ortPlaceholder: 'z. B. Zürich',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Vor der Einreichung</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Unterschreiben und im Doppel einreichen</strong><NormText text={` (Art. 131 ZPO).`} /></li>
        <li><strong>Glaubhaft machen:</strong> Einkommens-, Wohnkosten- und Kinderbelege beilegen — im Summarverfahren zählen die Urkunden.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Unterhaltshöhen bestimmt das Gericht nach den konkreten Verhältnissen; die Begehren strukturieren meinen Standpunkt.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  vorschauKompakt: true,
  banner: BANNER_EG,
  dateiBasis: 'Eheschutzgesuch',
  pdfLabel: 'Gesuch als PDF',
  docxLabel: 'Gesuch als Word (DOCX)',
};

export function VorlageEheschutzgesuch() {
  return <VorlagenSeite config={CONFIG} />;
}
