import { NormText } from '../components/NormText';
import {
  SK_DEFAULTS, skZusammenstellen, skMaengel, skWarnungen, skHinweise,
  type SkAntworten,
} from '../lib/vorlagen/scheidungsklage';
import { KV_GERICHTE_BS } from '../lib/vorlagen/klageVereinfacht';
import { ParteiEditor } from './VorlageKlageVereinfacht';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, ListenEditor, NICHT_GESPEICHERT_HINWEIS, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { GerichtsWahlBlock } from '../components/vorlagen/GerichtsWahlBlock';
import { usePaneKlasse } from '../components/layout/PaneKontext';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';

// ─── Vorlagen-Wizard: Scheidungsklage — unbegründete Eingabe (Art. 290 ZPO) ──
// Erste Musterklagen-Maske Familienrecht (Auftrag David 12.6.2026; Bauspez.
// familienrecht-klagen-vorlagen.md §3.3). Mindestinhalt lit. a–f als
// geführtes Raster; der 114-ZGB-Zweijahres-Check ist deterministisch,
// die 115-Würdigung wird offengelegt, nie geprüft (§2). Wie die
// Schwester-Klagen BEWUSST ohne localStorage (Parteidaten).

const SCHRITTE = [
  { id: 'gericht', label: 'Gericht & Scheidungsgrund' },
  { id: 'parteien', label: 'Parteien & Kinder' },
  { id: 'begehren', label: 'Scheidungsfolgen' },
  { id: 'pruefen', label: 'Prüfen & Ausgabe' },
] as const;

const BANNER_SK: PdfBanner = {
  titel: 'NACH DEM AUSDRUCK EIGENHÄNDIG UNTERZEICHNEN',
  text: 'Unbegründete Scheidungsklage (Art. 290 ZPO) – im Doppel beim Gericht am Wohnsitz einer Partei einzureichen.',
};

// Schritte sind eine Komponente, weil sie usePaneKlasse brauchen.
function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<SkAntworten>; schritt: number }) {
  const pk = usePaneKlasse();
  const kinderSetzen = (idx: number, k: Partial<SkAntworten['kinder'][number]>) => {
    const kinder = a.kinder.map((x, i) => (i === idx ? { ...x, ...k } : x));
    set('kinder', kinder);
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
          uebersteuertHinweis
          manuell={a.gerichtManuell} onManuell={(g) => set('gerichtManuell', g)}
          platzhalter={{ name: 'z. B. Bezirksgericht X', strasse: 'z. B. Gerichtsgasse 1', plzOrt: 'z. B. 8001 Zürich' }} />
        <Field label="Scheidungsgrund (Art. 290 lit. b ZPO)">
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
            items={[
              { code: '114' as const, label: 'Getrenntleben (Art. 114 ZGB)', sub: 'mindestens zwei Jahre bei Eintritt der Rechtshängigkeit' },
              { code: '115' as const, label: 'Unzumutbarkeit (Art. 115 ZGB)', sub: 'vor Ablauf der zwei Jahre — schwerwiegende, nicht zuzurechnende Gründe' },
            ]}
            value={a.grund}
            onSelect={(code) => set('grund', code)}
          />
        </Field>
        {a.grund === '114' && (
          <Field label="Getrennt lebend seit" hint="der Zweijahres-Check läuft gegen das Einreichungsdatum (Schritt 4)">
            <DatumsFeld value={a.trennungSeit} onChange={(v) => set('trennungSeit', v)} className={inputCls} />
          </Field>
        )}
      </div>
    );

    case 'parteien': return (
      <div className="space-y-5">
        <Field label="Klagende Partei (Ehegatte/Ehegattin)">
          <ParteiEditor p={a.klaeger} onChange={(p) => set('klaeger', p)} nurNatuerlich />
        </Field>
        <Field label="Vertretung" optional>
          <input className={inputCls} value={a.vertretung ?? ''} onChange={(e) => set('vertretung', e.target.value || undefined)}
            placeholder="z. B. RA lic. iur. X, Kanzlei Y, Adresse" />
        </Field>
        <Field label="Beklagte Partei (Ehegatte/Ehegattin)">
          <ParteiEditor p={a.beklagte} onChange={(p) => set('beklagte', p)} nurNatuerlich />
        </Field>
        <Checkbox
          checked={a.kinderErfassen}
          onChange={(v) => set('kinderErfassen', v)}
          label={<><span>Gemeinsame minderjährige Kinder <span className="text-ink-500"><NormText text={`(Rechtsbegehren zu den Kindern sind dann Mindestinhalt, Art. 290 lit. d ZPO)`} /></span></span></>} />
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
                  { code: 'gericht' as const, label: 'Gerichtlich zu regeln', sub: 'Offizialmaxime — kein eigener Antrag' },
                  { code: 'klaeger' as const, label: 'Obhut bei der klagenden Partei' },
                  { code: 'beklagte' as const, label: 'Obhut bei der beklagten Partei' },
                  { code: 'alternierend' as const, label: 'Alternierende Obhut' },
                ]}
                value={a.obhut}
                onSelect={(code) => set('obhut', code)}
              />
            </Field>
          </div>
        )}
      </div>
    );

    case 'begehren': return (
      <div className="space-y-4">
        <Field label="Nachehelicher Unterhalt (Art. 290 lit. c ZPO)">
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={[
              { code: 'gericht' as const, label: 'Gerichtlich festzusetzen' },
              { code: 'keiner' as const, label: 'Keiner (Negativ-Antrag)' },
              { code: 'beziffert' as const, label: 'Beziffert' },
            ]}
            value={a.unterhaltEhegatte}
            onSelect={(code) => set('unterhaltEhegatte', code)}
          />
        </Field>
        {a.unterhaltEhegatte === 'beziffert' && (
          <Field label="Monatlicher Unterhalt (CHF)" hint="die Höhe ist Ihre eigene Würdigung — LexMetrik rechnet keinen Unterhalt (Ermessensfrage)">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.unterhaltBetrag}
              onChange={(v) => set('unterhaltBetrag', v)} placeholder="z. B. 2'500" />
          </Field>
        )}
        <Checkbox
          checked={a.gueterrecht}
          onChange={(v) => set('gueterrecht', v)}
          label={<><span>Güterrechtliche Auseinandersetzung beantragen <span className="text-ink-500">(Bezifferung vorbehalten)</span></span></>} />
        <Checkbox
          checked={a.vorsorgeausgleich}
          onChange={(v) => set('vorsorgeausgleich', v)}
          label={<><span>Vorsorgeausgleich beantragen <span className="text-ink-500">(Art. 122 ff. ZGB)</span></span></>} />
        <Field label="Weitere Rechtsbegehren" optional>
          {/* Wrapper-<div> bleibt: `Field` verknüpft nur ein Einzel-Control. */}
          <div>
            {/* R2-F/F1-9: das «×» im `lc-btn-ghost lc-btn-sm` war die vierte
                Entfernen-Bauform des Hauses — Kanon ist der Text-Link des
                ListenEditors mit sprechendem aria-label. */}
            <ListenEditor
              element="Begehren"
              eintraege={a.weitereRechtsbegehren}
              className="space-y-2"
              onHinzufuegen={() => set('weitereRechtsbegehren', [...a.weitereRechtsbegehren, ''])}
              onEntfernen={(i) => set('weitereRechtsbegehren', a.weitereRechtsbegehren.filter((_, j) => j !== i))}
              kinder={(r, i) => (
                <input className={inputCls} value={r} aria-label={`Weiteres Rechtsbegehren ${i + 1}`}
                  onChange={(e) => set('weitereRechtsbegehren', a.weitereRechtsbegehren.map((x, j) => (j === i ? e.target.value : x)))} />
              )}
            />
          </div>
        </Field>
      </div>
    );
  }
}

const fehlerEingabe = (a: SkAntworten, schritt: number): string[] =>
  skMaengel(a).filter((m) => m.schritt === schritt).map((m) => m.text);

// Orchestrierung im generischen Rahmen (W2·29-WERKBANK-VORLAGEN V2b). Ist-Zustand
// vor dem Umzug, je per Slot gehalten (§6): kein speicherKey, Mängel-Liste als
// Schritt-Fehler (auch im letzten Schritt) und als Export-Gate (ExportLeiste +
// Direkt-Export, B1-1), Warnungen/Hinweise im Ist-Format ohne NormText samt
// Vollmacht-Schalter (pruefenZusatz), Ort/Datum ohne Feld-Fehler, kompakte Vorschau.
const CONFIG: VorlagenSeitenConfig<SkAntworten> = {
  cardId: 'scheidungsklage',
  musterdaten: MUSTER.scheidungsklage,
  defaults: SK_DEFAULTS,
  zusammenstellen: (a) => ({ ergebnis: skZusammenstellen(a) }),
  pruefeGates: (a) => ({ blocker: skMaengel(a).map((m) => m.text), warnungen: [], hinweise: [] }),
  schritte: SCHRITTE,
  overlineFallback: 'Familienrecht',
  titel: 'Scheidungsklage (unbegründete Eingabe)',
  intro: 'Die Scheidungsklage nach Art. 290 ZPO mit dem gesetzlichen Mindestinhalt — Scheidungsgrund (Art. 114/115 ZGB), Begehren zu Kindern, Unterhalt, Güterrecht und Vorsorgeausgleich. Der Zweijahres-Check ist berechnet; was Würdigung wäre (Art. 115, Unterhaltsbeträge), wird offengelegt, nie gerechnet.',
  badge: 'Zu unterzeichnen',
  fussnote: NICHT_GESPEICHERT_HINWEIS,
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  fehlerEingabeImLetztenSchritt: true,
  pruefenZusatz: ({ a, set }) => (
    <>
      {skWarnungen(a).map((w, i) => (
        <div key={i} className="lc-notice-warn text-body-s">{w}</div>
      ))}
      {skHinweise(a).map((h, i) => (
        <div key={i} className="lc-notice text-body-s">{h}</div>
      ))}
      <Checkbox
        checked={a.vollmachtBeilage}
        onChange={(v) => set('vollmachtBeilage', v)}
        label={<><span>Vollmacht als Beilage aufführen</span></>} />
    </>
  ),
  ortDatumLabel: 'Ort und Datum der Eingabe (Art. 290 lit. f ZPO)',
  ortPlaceholder: 'z. B. Zürich',
  bestaetigung: ({ a }) => (
    <>
      <p className="lc-overline text-brass-700">Vor der Einreichung</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Unterschreiben und im Doppel einreichen</strong><NormText text={` (Art. 131 ZPO) — beim Gericht am Wohnsitz einer Partei.`} /></li>
        <li><strong>Belege beilegen</strong> (Art. 290 lit. e ZPO): Familienausweis/Eheurkunde{a.kinderErfassen ? ', Geburtsurkunden der Kinder' : ''}.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Die Eingabe ist unbegründet zulässig; das Gericht lädt zur Einigungsverhandlung vor, und Kinderbelange regelt es von Amtes wegen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  vorschauKompakt: true,
  banner: BANNER_SK,
  dateiBasis: 'Scheidungsklage',
  pdfLabel: 'Scheidungsklage als PDF',
  docxLabel: 'Scheidungsklage als Word (DOCX)',
};

export function VorlageScheidungsklage() {
  return <VorlagenSeite config={CONFIG} />;
}
