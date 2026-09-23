import { NormText } from '../components/NormText';
import {
  KO_DEFAULTS, koZusammenstellen, koMaengel, koHinweise, koStreitwert, koPrefillLesen,
  type KoAnswers,
} from '../lib/vorlagen/klageOrdentlich';
import { KV_GERICHTE_BS, kvKlagefrist, type KvAusnahme } from '../lib/vorlagen/klageVereinfacht';
import { ZPO_SCHWELLEN } from '../lib/zustaendigkeit';
import { ParteiEditor } from './VorlageKlageVereinfacht';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { BetragsFeld } from '../components/BetragsFeld';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, ListenEditor, NICHT_GESPEICHERT_HINWEIS, inputCls } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { GerichtsWahlBlock } from '../components/vorlagen/GerichtsWahlBlock';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Vorlagen-Wizard: Klage im ordentlichen Verfahren (alle Kantone) ─────────
// Auftrag David 10.6.2026. Dritte Klage-Vorlage; Gerüst und Bausteine wie
// die vereinfachte Klage (§10), aber: Begründung (Tatsachen + Beweismittel
// je Tatsache) ist PFLICHT (Art. 221 Abs. 1 lit. d/e ZPO), Streitwert ist
// Pflichtangabe (lit. c), Beweismittelverzeichnis automatisch (Abs. 2 lit. d).
// Wie die Schwester-Vorlagen BEWUSST ohne localStorage (Parteidaten).
// Logik in lib/vorlagen/klageOrdentlich.ts (§3).

const SCHRITTE = [
  { id: 'verfahren', label: 'Gericht & Streitwert' },
  { id: 'parteien', label: 'Parteien' },
  { id: 'begehren', label: 'Rechtsbegehren' },
  { id: 'begruendung', label: 'Begründung (Pflicht)' },
  { id: 'beilagen', label: 'Klagebewilligung & Beilagen' },
  { id: 'pruefen', label: 'Prüfen & Ausgabe' },
] as const;

const BANNER_KO: PdfBanner = {
  titel: 'NACH DEM AUSDRUCK EIGENHÄNDIG UNTERZEICHNEN',
  text: 'Einreichung in Papierform mit Unterschrift (Art. 130 ZPO); elektronisch nur mit anerkannter qualifizierter Signatur. Je ein Exemplar für das Gericht und jede Gegenpartei (Art. 131 ZPO).',
};

// Schritte sind eine Komponente, weil sie usePaneKlasse brauchen.
function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<KoAnswers>; schritt: number }) {
  const pk = usePaneKlasse();
  const sw = koStreitwert(a);
  const frist = a.klagebewilligungVorhanden && a.klagebewilligungDatum
    ? kvKlagefrist(a.klagebewilligungDatum, a.mietePacht ? 'miete_kernbereich' : 'vermoegensrechtlich', a.gerichtsKanton) : null;

  switch (SCHRITTE[schritt].id) {
    case 'verfahren': return (
      <div className="space-y-4">
        <GerichtsWahlBlock
          layout="nebeneinander" gruppenTitel="Zuständiges Gericht"
          kanton={a.gerichtsKanton} onKanton={(k) => set('gerichtsKanton', k)}
          bsAdresse={{
            zeilen: [KV_GERICHTE_BS.zivilgericht.name, KV_GERICHTE_BS.zivilgericht.strasse, KV_GERICHTE_BS.zivilgericht.plzOrt],
            url: KV_GERICHTE_BS.zivilgericht.url,
          }}
          aufgeloest={a.gerichtAufgeloest}
          ohneAdresseHinweis="Gericht wird unten über die kantonale Gerichtsschicht bestimmt — oder von Hand erfassen."
          materie="" onAufgeloest={(z) => set('gerichtAufgeloest', z ?? undefined)}
          manuellAktiv={a.gerichtManuellAktiv ?? false}
          onManuellAktiv={(v) => set('gerichtManuellAktiv', v || undefined)}
          uebersteuertHinweis
          manuell={a.gerichtManuell} onManuell={(g) => set('gerichtManuell', g)}
          platzhalter={{ name: 'z. B. Bezirksgericht X', strasse: 'z. B. Gerichtsgasse 1', plzOrt: 'z. B. 8001 Zürich' }} />
        <Checkbox
          checked={a.vermoegensrechtlich}
          onChange={(v) => set('vermoegensrechtlich', v)}
          label={<><span>Vermögensrechtliche Streitigkeit <span className="text-ink-500"><NormText text={`(Streitwertangabe ist Pflichtinhalt, Art. 221 Abs. 1 lit. c ZPO)`} /></span></span></>} />
        {a.vermoegensrechtlich && (
          <Field label="Streitwert (CHF)" hint="nach Art. 91 ZPO – ohne Zinsen und Kosten; über CHF 30'000 (sonst gilt das vereinfachte Verfahren)">
            <BetragsFeld value={a.streitwert} onChange={(v) => set('streitwert', v)} className={inputCls}
              placeholder="z. B. 80'000" aria-label="Streitwert in Franken" />
          </Field>
        )}
        <Checkbox
          checked={a.mietePacht}
          onChange={(v) => set('mietePacht', v)}
          label={<><span>Streitigkeit aus Miete/Pacht von Wohn-/Geschäftsräumen oder landwirtschaftlicher Pacht <span className="text-ink-500"><NormText text={`(Klagefrist 30 Tage, Art. 209 Abs. 4 ZPO)`} /></span></span></>} />
        <Checkbox
          checked={a.einzigeInstanz}
          onChange={(v) => set('einzigeInstanz', v)}
          label={<><span>Einzige kantonale Instanz <span className="text-ink-500">(Art. 5/6/8 ZPO — ordentliches Verfahren auch bis CHF 30'000, Art. 243 Abs. 3)</span></span></>} />
        {a.vermoegensrechtlich && sw !== null && sw > ZPO_SCHWELLEN.VEREINFACHT && (
          <p className="lc-notice text-body-s">
            Ordentliches Verfahren (Art. 219 ff. ZPO) — Streitwert über der Grenze des vereinfachten Verfahrens (Art. 243 Abs. 1 ZPO).
          </p>
        )}
      </div>
    );

    case 'parteien': return (
      <div className="space-y-5">
        <div className="space-y-2">
          <GruppenTitel>Klagende Partei</GruppenTitel>
          <ParteiEditor p={a.klaeger} onChange={(p) => set('klaeger', p)} />
          <Field label="Vertretung" optional hint="Name/Kanzlei; Vollmacht als Beilage (Art. 221 Abs. 2 lit. a ZPO)">
            <input className={inputCls} value={a.vertretung ?? ''} onChange={(e) => set('vertretung', e.target.value)} />
          </Field>
        </div>
        <div className="space-y-2">
          <GruppenTitel>Beklagte Partei</GruppenTitel>
          <ParteiEditor p={a.beklagte} onChange={(p) => set('beklagte', p)} />
        </div>
        <p className="text-xs text-ink-500">
          Parteien müssen mit Schlichtungsgesuch/Klagebewilligung übereinstimmen (Art. 209 Abs. 2 lit. a ZPO).
        </p>
      </div>
    );

    case 'begehren': return (
      <div className="space-y-4">
        <SelectionGrid
          className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
          items={[
            { code: 'beziffert' as const, label: 'Beziffertes Begehren', sub: 'Bestimmter Betrag (Art. 84 Abs. 2 ZPO)' },
            { code: 'unbeziffert' as const, label: 'Unbezifferte Forderungsklage', sub: 'Mit Mindestwert (Art. 85 ZPO)' },
            { code: 'frei' as const, label: 'Frei formuliert', sub: 'z. B. Feststellung, Gestaltung, Realleistung' },
          ]}
          value={a.begehrenTyp}
          onSelect={(code) => set('begehrenTyp', code)}
        />
        {a.begehrenTyp === 'beziffert' && (
          <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
            <Field label="Betrag (CHF)"><BetragsFeld value={a.streitwert} onChange={(v) => set('streitwert', v)} className={inputCls} aria-label="Forderungsbetrag" /></Field>
            <Field label="Zins %" optional><input className={inputCls + ' num'} value={a.zins?.satz ?? ''} onChange={(e) => set('zins', { satz: e.target.value, abDatum: a.zins?.abDatum ?? '' })} placeholder="5" /></Field>
            <Field label="Zins seit" optional><DatumsFeld value={a.zins?.abDatum ?? ''} onChange={(v) => set('zins', { satz: a.zins?.satz ?? '', abDatum: v })} className={inputCls} /></Field>
          </div>
        )}
        {a.begehrenTyp === 'unbeziffert' && (
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
            <Field label="Mindestwert (CHF)" hint="Art. 85 Abs. 1 ZPO – vorläufiger Streitwert">
              <BetragsFeld value={a.unbeziffertMindest ?? ''} onChange={(v) => set('unbeziffertMindest', v)} className={inputCls} aria-label="Mindestwert" />
            </Field>
            <Field label="Grund der Unbezifferbarkeit" optional>
              <input className={inputCls} value={a.unbeziffertGrund ?? ''} onChange={(e) => set('unbeziffertGrund', e.target.value)} placeholder="z. B. Bezifferung erst nach Beweisverfahren möglich" />
            </Field>
          </div>
        )}
        {a.begehrenTyp === 'frei' && (
          <div className="space-y-2">
            <GruppenTitel>Rechtsbegehren</GruppenTitel>
            {/* R2-F/F1-9: Knopf-Optik und Wortlaut waren hier schon Kanon,
                der BEHÄLTER fehlte (nackte `flex`-Zeilen). Der ListenEditor
                bringt ihn — und nummeriert die Begehren sichtbar. */}
            <ListenEditor
              element="Begehren"
              eintraege={a.freieRechtsbegehren}
              className="space-y-2"
              onHinzufuegen={() => set('freieRechtsbegehren', [...a.freieRechtsbegehren, ''])}
              onEntfernen={(i) => set('freieRechtsbegehren', a.freieRechtsbegehren.filter((_, j) => j !== i))}
              kinder={(w, i) => (
                <textarea className={inputCls} rows={2} value={w} aria-label={`Rechtsbegehren ${i + 1}`}
                  onChange={(e) => set('freieRechtsbegehren', a.freieRechtsbegehren.map((x, j) => j === i ? e.target.value : x))} />
              )}
            />
          </div>
        )}
        <Checkbox
          checked={a.rechtsoeffnung}
          onChange={(v) => set('rechtsoeffnung', v)}
          label={<><span>Beseitigung des Rechtsvorschlags beantragen <span className="text-ink-500">(laufende Betreibung)</span></span></>} />
        {a.rechtsoeffnung && (
          <Field label="Betreibungs-Nr." optional>
            <input className={inputCls + ' sm:max-w-[14rem]'} value={a.betreibungNr ?? ''} onChange={(e) => set('betreibungNr', e.target.value)} />
          </Field>
        )}
        <Field label="Streitgegenstand" hint="Kurzbezeichnung für das Rubrum; identisch mit der Klagebewilligung">
          <textarea className={inputCls} rows={2} value={a.streitgegenstand} onChange={(e) => set('streitgegenstand', e.target.value)} />
        </Field>
        <div className="space-y-2">
          <GruppenTitel>Weitere Rechtsbegehren <span className="normal-case text-ink-500">(optional)</span></GruppenTitel>
          <ListenEditor
            element="Begehren"
            eintraege={a.weitereRechtsbegehren}
            className="space-y-2"
            onHinzufuegen={() => set('weitereRechtsbegehren', [...a.weitereRechtsbegehren, ''])}
            onEntfernen={(i) => set('weitereRechtsbegehren', a.weitereRechtsbegehren.filter((_, j) => j !== i))}
            kinder={(w, i) => (
              <input className={inputCls} value={w} aria-label={`Weiteres Rechtsbegehren ${i + 1}`}
                onChange={(e) => set('weitereRechtsbegehren', a.weitereRechtsbegehren.map((x, j) => j === i ? e.target.value : x))} />
            )}
          />
        </div>
      </div>
    );

    case 'begruendung': return (
      <div className="space-y-4">
        <p className="lc-notice text-body-s">
          Im ordentlichen Verfahren sind die Tatsachenbehauptungen und die Beweismittel zu den
          einzelnen Tatsachen <strong>Pflichtinhalt</strong> der Klage (Art. 221 Abs. 1 lit. d/e ZPO).
        </p>
        {/* Auftrag David 11.6.2026: Begründung wahlweise hier erfassen oder
            als Platzhalter im Dokument später ausfüllen. */}
        <Checkbox
          checked={a.begruendungModus === 'platzhalter'}
          onChange={(v) => set('begruendungModus', v ? 'platzhalter' : 'maske')}
          label={<><span>Begründung später ausfüllen <span className="text-ink-500">(die Klage erhält nummerierte Platzhalter für Tatsachen, Beweise und Rechtliches; die Pflichtinhalte sind vor der Einreichung zu ergänzen)</span></span></>} />
        {a.begruendungModus === 'platzhalter' && (
          <p className="lc-notice-warn text-body-s">
            Das Dokument enthält Leer-Ziffern («________») unter «I. Tatsächliches», «II. Rechtliches»
            und im Beweismittelverzeichnis — vor der Einreichung vollständig ausfüllen (Art. 221 Abs. 1 lit. d/e ZPO).
          </p>
        )}
        {a.begruendungModus !== 'platzhalter' && (<>
        <div className="space-y-3">
          <GruppenTitel>Tatsachenbehauptungen mit Beweisofferte</GruppenTitel>
          <ListenEditor
            element="Tatsachenbehauptung"
            eintraege={a.tatsachen}
            mindestens={1}
            kopf={(_t, i) => `Ziffer ${i + 1}`}
            onHinzufuegen={() => set('tatsachen', [...a.tatsachen, { text: '', beweise: [] }])}
            onEntfernen={(i) => set('tatsachen', a.tatsachen.filter((_, j) => j !== i))}
            kinder={(t, i) => (
              <div className="space-y-3">
                <textarea className={inputCls} rows={3} value={t.text} aria-label={`Tatsachenbehauptung Ziffer ${i + 1}`}
                  placeholder="Behauptete Tatsache, je Ziffer ein Lebenssachverhalt"
                  onChange={(e) => set('tatsachen', a.tatsachen.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                <div className="space-y-2 pl-2 border-l-2 border-line">
                  <p className="text-xs text-ink-600"><NormText text={`Beweismittel zu dieser Tatsache (Art. 221 Abs. 1 lit. e ZPO):`} /></p>
                  <ListenEditor
                    element="Beweismittel"
                    eintraege={t.beweise}
                    className="space-y-2"
                    kopf={null}
                    onHinzufuegen={() => set('tatsachen', a.tatsachen.map((x, j) => j === i
                      ? { ...x, beweise: [...x.beweise, { bezeichnung: '' }] } : x))}
                    onEntfernen={(bi) => set('tatsachen', a.tatsachen.map((x, j) => j === i
                      ? { ...x, beweise: x.beweise.filter((_, k) => k !== bi) } : x))}
                    kinder={(b, bi) => (
                      <input className={inputCls} value={b.bezeichnung} aria-label={`Beweismittel ${bi + 1} zu Ziffer ${i + 1}`}
                        placeholder="z. B. Werkvertrag vom 1.2.2026 (Urkunde); Zeuge X; Parteibefragung"
                        onChange={(e) => set('tatsachen', a.tatsachen.map((x, j) => j === i
                          ? { ...x, beweise: x.beweise.map((y, k) => k === bi ? { bezeichnung: e.target.value } : y) } : x))} />
                    )}
                  />
                </div>
              </div>
            )}
          />
        </div>
        <div className="space-y-2">
          <GruppenTitel>Rechtliche Begründung <span className="normal-case text-ink-500"><NormText text={`(fakultativ, Art. 221 Abs. 3 ZPO)`} /></span></GruppenTitel>
          <ListenEditor
            element="Erwägung"
            eintraege={a.rechtlicheBegruendung}
            className="space-y-2"
            onHinzufuegen={() => set('rechtlicheBegruendung', [...a.rechtlicheBegruendung, { text: '' }])}
            onEntfernen={(i) => set('rechtlicheBegruendung', a.rechtlicheBegruendung.filter((_, j) => j !== i))}
            kinder={(r, i) => (
              <textarea className={inputCls} rows={2} value={r.text} aria-label={`Erwägung ${i + 1}`}
                onChange={(e) => set('rechtlicheBegruendung', a.rechtlicheBegruendung.map((x, j) => j === i ? { text: e.target.value } : x))} />
            )}
          />
        </div>
        <p className="text-xs text-ink-500">
          Das Beweismittelverzeichnis (Art. 221 Abs. 2 lit. d ZPO) und das Beilagenverzeichnis
          werden aus den bezeichneten Beweismitteln automatisch erstellt.
        </p>
        </>)}
      </div>
    );

    case 'beilagen': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.klagebewilligungVorhanden}
          onChange={(v) => set('klagebewilligungVorhanden', v)}
          label={<><span>Klagebewilligung der Schlichtungsbehörde liegt vor <span className="text-ink-500"><NormText text={`(Art. 221 Abs. 2 lit. b ZPO)`} /></span></span></>} />
        {a.klagebewilligungVorhanden ? (
          <div className="space-y-2">
            <Field label="Datum der Klagebewilligung (Eröffnung/Zustellung)" hint="massgeblich für die Klagefrist (BGE 140 III 227)">
              <DatumsFeld value={a.klagebewilligungDatum} onChange={(v) => set('klagebewilligungDatum', v)} className={inputCls} />
            </Field>
            {frist && (
              <p className="lc-notice-warn text-body-s">
                Klagefrist {frist.fristLabel}: Ablauf am <strong>{frist.ablauf}</strong>
                {frist.stillstandAktiv ? ' (Gerichtsferien berücksichtigt, Art. 145 Abs. 1 ZPO)' : ''} — danach erlischt die Klagebewilligung.
              </p>
            )}
          </div>
        ) : (
          <Field label="Verzicht/Ausnahme (Art. 198/199 ZPO)">
            <div className="space-y-2">
              <select className={inputCls} value={a.ausnahme} onChange={(e) => set('ausnahme', e.target.value as KvAusnahme)}>
                <option value="">– wählen –</option>
                <option value="verzicht_gemeinsam">Gemeinsamer Verzicht (Streitwert ≥ CHF 100'000, Art. 199 Abs. 1)</option>
                <option value="verzicht_einseitig">Einseitiger Verzicht (Gegenpartei im Ausland/unbekannt — Art. 199 Abs. 2)</option>
                <option value="art198">Ausnahme nach Art. 198 ZPO</option>
              </select>
              {a.ausnahme === 'art198' && (
                <input className={inputCls} value={a.ausnahmeText ?? ''} onChange={(e) => set('ausnahmeText', e.target.value)}
                  placeholder="Tatbestand, z. B. einzige kantonale Instanz (lit. f) oder Widerklage (lit. g)" />
              )}
            </div>
          </Field>
        )}
        <Checkbox
          checked={a.vollmachtBeilage}
          onChange={(v) => set('vollmachtBeilage', v)}
          label={<>Vollmacht als Beilage (bei Vertretung, Art. 221 Abs. 2 lit. a ZPO)
                      </>} />
        <div className="space-y-2">
          <GruppenTitel>Weitere Beilagen</GruppenTitel>
          <ListenEditor
            element="Beilage"
            eintraege={a.weitereBeilagen}
            className="space-y-2"
            onHinzufuegen={() => set('weitereBeilagen', [...a.weitereBeilagen, { bezeichnung: '' }])}
            onEntfernen={(i) => set('weitereBeilagen', a.weitereBeilagen.filter((_, j) => j !== i))}
            kinder={(b, i) => (
              <input className={inputCls} value={b.bezeichnung} aria-label={`Weitere Beilage ${i + 1}`}
                onChange={(e) => set('weitereBeilagen', a.weitereBeilagen.map((x, j) => j === i ? { bezeichnung: e.target.value } : x))} />
            )}
          />
        </div>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Ort"><input className={inputCls} value={a.ort} onChange={(e) => set('ort', e.target.value)} /></Field>
          <Field label="Datum"><DatumsFeld value={a.datum} onChange={(v) => set('datum', v)} className={inputCls} /></Field>
        </div>
      </div>
    );
  }
}

const fehlerEingabe = (a: KoAnswers, schritt: number): string[] =>
  koMaengel(a).filter((m) => m.schritt === schritt).map((m) => m.text);

// Orchestrierung im generischen Rahmen (W2·29-WERKBANK-VORLAGEN V2b). Ist-Zustand
// vor dem Umzug, je per Slot gehalten (§6): kein speicherKey, Prefill-Brücke aus
// `?…` bei jedem Render gelesen (defaultsZusatz), Mängel-Liste als Schritt-Fehler
// (auch im letzten Schritt) und als Export-Gate der ExportLeiste — der
// Direkt-Export der Vorschau war NICHT an die Mängel gebunden
// (direktExportBlocker: false). Mängel-Kästen und Hinweise im Ist-Format
// (pruefenZusatz); Ort/Datum erfasst der Schritt «Beilagen» (ortDatumImPruefen: false);
// Kanton in der Overline; kompakte Vorschau.
const CONFIG: VorlagenSeitenConfig<KoAnswers> = {
  cardId: 'klage-ordentlich',
  musterdaten: MUSTER['klage-ordentlich'],
  defaults: KO_DEFAULTS,
  defaultsZusatz: () => { try { return koPrefillLesen(window.location.search) ?? {}; } catch { return {}; } },
  zusammenstellen: (a) => ({ ergebnis: koZusammenstellen(a) }),
  pruefeGates: (a) => ({ blocker: koMaengel(a).map((m) => m.text), warnungen: [], hinweise: [] }),
  schritte: SCHRITTE,
  overlineFallback: 'Zivilprozess (ZPO)',
  overlineZusatz: ({ a }) => (a.gerichtsKanton === 'BS' ? 'Basel-Stadt' : `Kanton ${a.gerichtsKanton}`),
  titel: 'Klage im ordentlichen Verfahren',
  intro: 'Erstellt die Klageschrift nach Art. 221 ZPO aus festen Bausteinen: Rechtsbegehren, Streitwertangabe, Tatsachenbehauptungen mit Beweisofferte je Ziffer (Pflicht), fakultative rechtliche Begründung, Beweismittel- und Beilagenverzeichnis — Gerichts-Adressat für alle Kantone, Klagefrist-Berechnung mit Gerichtsferien. Ohne Sprachmodell.',
  badge: 'Papierform · unterschreiben · im Doppel',
  fussnote: NICHT_GESPEICHERT_HINWEIS,
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  fehlerEingabeImLetztenSchritt: true,
  pruefenZusatz: ({ a }) => (
    <>
      {koMaengel(a).map((m, i) => (
        <div role="alert" key={i} className="lc-notice-danger">
          <p className="text-body-s text-danger-700">{m.text}</p>
        </div>
      ))}
      {koHinweise(a).map((h, i) => <div key={i} className="lc-notice text-body-s">{h}</div>)}
    </>
  ),
  ortDatumImPruefen: false,
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Form & Einreichung</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Unterschreiben und im Doppel einreichen:</strong><NormText text={` ein Exemplar für das Gericht, je eines pro Gegenpartei (Art. 131 ZPO); Papierform oder elektronisch mit qualifizierter Signatur (Art. 130 ZPO).`} /></li>
        <li><strong>Klagebewilligung beilegen</strong><NormText text={` (bzw. Verzichts-/Ausnahme-Nachweis) und die verfügbaren Beweisurkunden (Art. 221 Abs. 2 ZPO).`} /></li>
        <li><strong>Identität wahren:</strong> Parteien, Rechtsbegehren und Streitgegenstand müssen der Klagebewilligung entsprechen; Änderungen nur nach Art. 227/230 ZPO.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Dieses Werkzeug erstellt eine Eingabe-Vorlage aus festen Bausteinen — Fristen und Vollständigkeit sind eigenverantwortlich zu prüfen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  pruefenFuss: (
    <p className="text-xs text-ink-500">
      Gerichtsadresse aus zweifach geprüfter Recherche (fachliche Abnahme ausstehend);
      Spruchkörper und kantonale Besonderheiten richten sich nach kantonalem Recht —
      Angaben vor Einreichung prüfen.
    </p>
  ),
  vorschauKompakt: true,
  direktExportBlocker: false,
  banner: BANNER_KO,
  dateiBasis: 'Klage-ordentliches-Verfahren',
  pdfLabel: 'Klage als PDF',
  docxLabel: 'Klage als Word (DOCX)',
};

export function VorlageKlageOrdentlich() {
  return <VorlagenSeite config={CONFIG} />;
}
