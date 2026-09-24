import { NormText } from '../components/NormText';
import {
  KV_DEFAULTS, KV_MATERIEN, kvZusammenstellen, kvMaengel, kvHinweise, kvRouting, kvStreitwert, kvKlagefrist,
  type KvAnswers, type KvMaterie, type KvAusnahme,
  KV_GERICHTE_BS,
} from '../lib/vorlagen/klageVereinfacht';
import type { SgPartei } from '../lib/vorlagen/schlichtungsgesuchBs';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { BetragsFeld } from '../components/BetragsFeld';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, ListenEditor, NICHT_GESPEICHERT_HINWEIS, inputCls } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { GerichtsWahlBlock } from '../components/vorlagen/GerichtsWahlBlock';
import { ZefixSuche } from '../components/vorlagen/ZefixSuche';
import { uidGueltig, uidNormalisieren } from '../lib/uid';
import { kvPrefillLesen } from '../lib/vorlagen/klageVereinfacht';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Vorlagen-Wizard: Klage im vereinfachten Verfahren (BS-Pilot) ───────────
// Zweite Eingabe-Vorlage (nach Schlichtungsgesuch BS). Wie dort BEWUSST ohne
// localStorage (Parteidaten). Logik in lib/vorlagen/klageVereinfacht.ts (§3).

const SCHRITTE = [
  { id: 'materie', label: 'Materie & Streitwert' },
  { id: 'parteien', label: 'Parteien' },
  { id: 'begehren', label: 'Rechtsbegehren' },
  { id: 'begruendung', label: 'Begründung (freiwillig)' },
  { id: 'beilagen', label: 'Klagebewilligung & Beilagen' },
  { id: 'pruefen', label: 'Prüfen & Ausgabe' },
] as const;

const BANNER_KV: PdfBanner = {
  titel: 'NACH DEM AUSDRUCK DATIEREN, UNTERSCHREIBEN UND IM DOPPEL EINREICHEN',
  text:
    'Klage im vereinfachten Verfahren (Art. 243 ff. ZPO): unterschrieben einreichen, ein Exemplar ' +
    'für das Gericht und je eines pro Gegenpartei (Art. 131 ZPO); Klagebewilligung bzw. ' +
    'Ausnahme-Nachweis beilegen. Klagefrist nach Art. 209 Abs. 3/4 ZPO eigenverantwortlich wahren.',
};

// Kompakter Partei-Editor (natürlich/juristisch) — Darstellung, keine Logik.
// nurNatuerlich: blendet den Personentyp-Umschalter aus und erzwingt eine
// natürliche Person (Auftrag David: bei der Scheidung sind die Parteien stets
// Ehegatten — eine «juristische Person» ergibt dort keinen Sinn).
export function ParteiEditor({ p, onChange, nurNatuerlich }: { p: SgPartei; onChange: (p: SgPartei) => void; nurNatuerlich?: boolean }) {
  const pk = usePaneKlasse();
  return (
    <div className="space-y-3">
      {!nurNatuerlich && (
        <SelectionGrid
          className="grid grid-cols-2 gap-2"
          items={[
            { code: 'natuerlich' as const, label: 'Natürliche Person' },
            { code: 'juristisch' as const, label: 'Juristische Person' },
          ]}
          value={p.typ}
          onSelect={(code) => onChange(code === 'natuerlich'
            ? { typ: 'natuerlich', vorname: '', name: '', strasse: '', plz: '', ort: '' }
            : { typ: 'juristisch', firma: '', sitzStrasse: '', sitzPlz: '', sitzOrt: '' })}
        />
      )}
      {p.typ === 'natuerlich' ? (
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
          <Field label="Vorname"><input className={inputCls} value={p.vorname} onChange={(e) => onChange({ ...p, vorname: e.target.value })} /></Field>
          <Field label="Nachname"><input className={inputCls} value={p.name} onChange={(e) => onChange({ ...p, name: e.target.value })} /></Field>
          <Field label="Strasse Nr."><input className={inputCls} value={p.strasse} onChange={(e) => onChange({ ...p, strasse: e.target.value })} /></Field>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <Field label="PLZ"><input className={inputCls + ' num'} value={p.plz} onChange={(e) => onChange({ ...p, plz: e.target.value })} /></Field>
            <Field label="Ort"><input className={inputCls} value={p.ort} onChange={(e) => onChange({ ...p, ort: e.target.value })} /></Field>
          </div>
        </div>
      ) : (
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
          <Field label="Firma (gemäss Handelsregister)"><input className={inputCls} value={p.firma} onChange={(e) => onChange({ ...p, firma: e.target.value })} /></Field>
          <Field label="UID" optional hint={p.uid?.trim() && !uidGueltig(p.uid) ? 'Prüfziffer stimmt nicht — Format CHE-xxx.xxx.xxx' : undefined}>
            <input className={inputCls} placeholder="CHE-xxx.xxx.xxx" value={p.uid ?? ''}
              onChange={(e) => onChange({ ...p, uid: e.target.value })}
              onBlur={() => { const n = p.uid ? uidNormalisieren(p.uid) : null; if (n && n !== p.uid) onChange({ ...p, uid: n }); }} />
          </Field>
          <Field label="Strasse Nr."><input className={inputCls} value={p.sitzStrasse} onChange={(e) => onChange({ ...p, sitzStrasse: e.target.value })} /></Field>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <Field label="PLZ"><input className={inputCls + ' num'} value={p.sitzPlz} onChange={(e) => onChange({ ...p, sitzPlz: e.target.value })} /></Field>
            <Field label="Ort"><input className={inputCls} value={p.sitzOrt} onChange={(e) => onChange({ ...p, sitzOrt: e.target.value })} /></Field>
          </div>
          <div className={pk('sm:col-span-2', '@lg/pane:col-span-2')}>
            <ZefixSuche firma={p.firma} uid={p.uid} onUebernehmen={(t) =>
              onChange({
                ...p, firma: t.firma, uid: t.uid,
                sitzStrasse: t.strasse || p.sitzStrasse,
                sitzPlz: t.plz || p.sitzPlz,
                sitzOrt: t.ort || p.sitzOrt,
              })} />
          </div>
        </div>
      )}
    </div>
  );
}

// Schritte sind eine Komponente, weil sie usePaneKlasse brauchen.
function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<KvAnswers>; schritt: number }) {
  const pk = usePaneKlasse();
  const sw = kvStreitwert(a);
  const routing = a.materie ? kvRouting(a.materie, sw, a.gerichtsKanton) : null;
  const frist = a.klagebewilligungVorhanden && a.klagebewilligungDatum && a.materie
    ? kvKlagefrist(a.klagebewilligungDatum, a.materie, a.gerichtsKanton) : null;

  switch (SCHRITTE[schritt].id) {
    case 'materie': return (
      <div className="space-y-4">
        {/* Kantonsausbau 10.6.2026 (Auftrag David): Gericht je Kanton.
            BS = GOG-Routing (Entwurf, fachliche Abnahme ausstehend); übrige Kantone über die zweifach
            geprüfte Recherche-Schicht (KvGerichtWahl) bzw. Handeingabe. */}
        {/* BS-Adressat routing-abhängig (§ 71 GOG BS): Arbeitsgericht bzw.
            Zivilgericht — die Schwester-Masken adressieren fest das
            Zivilgericht, deshalb bleibt die Auflösung hier bei der Seite. */}
        <GerichtsWahlBlock
          layout="nebeneinander" gruppenTitel="Zuständiges Gericht"
          kanton={a.gerichtsKanton} onKanton={(k) => set('gerichtsKanton', k)}
          bsAdresse={(() => {
            const g = routing?.anwendbar && routing.gericht !== 'kantonal'
              ? KV_GERICHTE_BS[routing.gericht] : KV_GERICHTE_BS.zivilgericht;
            return { zeilen: [g.name, g.strasse, g.plzOrt], url: g.url };
          })()}
          aufgeloest={a.gerichtAufgeloest}
          ohneAdresseHinweis="Gericht wird unten über die kantonale Gerichtsschicht bestimmt — oder von Hand erfassen."
          materie={a.materie} onAufgeloest={(z) => set('gerichtAufgeloest', z ?? undefined)}
          manuellAktiv={a.gerichtManuellAktiv ?? false}
          onManuellAktiv={(v) => set('gerichtManuellAktiv', v || undefined)}
          uebersteuertHinweis
          manuell={a.gerichtManuell} onManuell={(g) => set('gerichtManuell', g)}
          platzhalter={{ name: 'z. B. Bezirksgericht X', strasse: 'z. B. Gerichtsgasse 1', plzOrt: 'z. B. 8001 Zürich' }} />
        <SelectionGrid
          className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
          items={KV_MATERIEN.map((m) => ({ code: m.id, label: m.label, sub: m.hint }))}
          value={a.materie}
          onSelect={(code) => set('materie', code as KvMaterie)}
        />
        <Field label="Streitwert (CHF)" hint="nach Art. 91 ZPO – ohne Zinsen und Kosten; bei unbezifferter Klage der Mindestwert (Schritt Rechtsbegehren)">
          <BetragsFeld value={a.streitwert} onChange={(v) => set('streitwert', v)} className={inputCls}
            placeholder="z. B. 12'000" aria-label="Streitwert in Franken" />
        </Field>
        {routing?.anwendbar && (
          <p className="lc-notice text-body-s">
            Zuständig: <strong>{routing.spruchkoerper}</strong> ({routing.spruchkoerperNorm}) ·
            vereinfachtes Verfahren{routing.abs2Lit ? ` (Art. 243 Abs. 2 lit. ${routing.abs2Lit} ZPO)` : ' (Art. 243 Abs. 1 ZPO)'}
            {routing.kostenlos && routing.kostenlosNorm ? <> · <strong>gerichtskostenfrei</strong> ({routing.kostenlosNorm})</> : null}.
          </p>
        )}
      </div>
    );

    case 'parteien': return (
      <div className="space-y-5">
        <div className="space-y-2">
          <GruppenTitel>Klagende Partei</GruppenTitel>
          <ParteiEditor p={a.klaeger} onChange={(p) => set('klaeger', p)} />
          <Field label="Vertretung" optional hint="Name/Kanzlei; Vollmacht als Beilage (Schritt Beilagen)">
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
          className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
          items={[
            { code: 'beziffert' as const, label: 'Beziffertes Begehren', sub: 'Bestimmter Betrag (Art. 84 Abs. 2 ZPO)' },
            { code: 'unbeziffert' as const, label: 'Unbezifferte Forderungsklage', sub: 'Mit Mindestwert (Art. 85 ZPO)' },
          ]}
          value={a.begehrenTyp}
          onSelect={(code) => set('begehrenTyp', code)}
        />
        {a.begehrenTyp === 'beziffert' ? (
          <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
            <Field label="Betrag (CHF)"><BetragsFeld value={a.streitwert} onChange={(v) => set('streitwert', v)} className={inputCls} aria-label="Forderungsbetrag" /></Field>
            <Field label="Zins % " optional><input className={inputCls + ' num'} value={a.zins?.satz ?? ''} onChange={(e) => set('zins', { satz: e.target.value, abDatum: a.zins?.abDatum ?? '' })} placeholder="5" /></Field>
            <Field label="Zins seit" optional><DatumsFeld value={a.zins?.abDatum ?? ''} onChange={(v) => set('zins', { satz: a.zins?.satz ?? '', abDatum: v })} className={inputCls} /></Field>
          </div>
        ) : (
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
            <Field label="Mindestwert (CHF)" hint="Art. 85 Abs. 1 ZPO – vorläufiger Streitwert">
              <BetragsFeld value={a.unbeziffertMindest ?? ''} onChange={(v) => set('unbeziffertMindest', v)} className={inputCls} aria-label="Mindestwert" />
            </Field>
            <Field label="Grund der Unbezifferbarkeit" optional>
              <input className={inputCls} value={a.unbeziffertGrund ?? ''} onChange={(e) => set('unbeziffertGrund', e.target.value)} placeholder="z. B. Bezifferung erst nach Beweisverfahren möglich" />
            </Field>
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
        <Field label="Streitgegenstand" hint="in wenigen Sätzen oder Stichworten (Art. 244 Abs. 1 lit. c ZPO); identisch mit der Klagebewilligung">
          <textarea className={inputCls} rows={2} value={a.streitgegenstand} onChange={(e) => set('streitgegenstand', e.target.value)} />
        </Field>
        <div className="space-y-2">
          <GruppenTitel>Weitere Rechtsbegehren <span className="normal-case text-ink-500">(optional)</span></GruppenTitel>
          {/* R2-F/F1-9: Knopf und Wortlaut waren Kanon, der Behälter fehlte —
              der ListenEditor bringt ihn und nummeriert die Begehren. */}
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
        <Checkbox
          checked={a.begruendungAktiv}
          onChange={(v) => set('begruendungAktiv', v)}
          label={<><span>Schriftliche Begründung beifügen <span className="text-ink-500"><NormText text={`(freiwillig, Art. 244 Abs. 2 ZPO — ohne Begründung lädt das Gericht direkt zur Verhandlung vor, Art. 245 Abs. 1)`} /></span></span></>} />
        {a.begruendungAktiv && (
          <>
            {/* Auftrag David 11.6.2026: wahlweise Platzhalter im Dokument. */}
            <Checkbox
              checked={a.begruendungPlatzhalter ?? false}
              onChange={(v) => set('begruendungPlatzhalter', v || undefined)}
              label={<><span>Begründung später ausfüllen <span className="text-ink-500">(die Klage erhält Leer-Ziffern für Tatsachendarstellung und Beweismittel)</span></span></>}
              className='pl-6' />
            {a.begruendungPlatzhalter && (
              <p className="lc-notice-warn text-body-s">
                Das Dokument enthält Platzhalter («________») unter «Begründung» und «Beweismittel» —
                vor der Einreichung ausfüllen oder hier in der Maske erfassen.
              </p>
            )}
            {!a.begruendungPlatzhalter && (<>
            <div className="space-y-2">
              <GruppenTitel>Sachverhalt — Tatsachenbehauptungen</GruppenTitel>
              <ListenEditor
                element="Behauptung"
                eintraege={a.sachverhalt}
                className="space-y-2"
                onHinzufuegen={() => set('sachverhalt', [...a.sachverhalt, { text: '' }])}
                onEntfernen={(i) => set('sachverhalt', a.sachverhalt.filter((_, j) => j !== i))}
                kinder={(s, i) => (
                  <textarea className={inputCls} rows={2} value={s.text} aria-label={`Behauptung ${i + 1}`}
                    onChange={(e) => set('sachverhalt', a.sachverhalt.map((x, j) => j === i ? { text: e.target.value } : x))} />
                )}
              />
            </div>
            <div className="space-y-2">
              <GruppenTitel>Beweismittel</GruppenTitel>
              <ListenEditor
                element="Beweismittel"
                eintraege={a.beweismittel}
                className="space-y-2"
                onHinzufuegen={() => set('beweismittel', [...a.beweismittel, { bezeichnung: '' }])}
                onEntfernen={(i) => set('beweismittel', a.beweismittel.filter((_, j) => j !== i))}
                kinder={(b, i) => (
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[12rem]">
                      <Field label="Bezeichnung"><input className={inputCls} value={b.bezeichnung}
                        onChange={(e) => set('beweismittel', a.beweismittel.map((x, j) => j === i ? { ...x, bezeichnung: e.target.value } : x))} /></Field>
                    </div>
                    <div className="flex-1 min-w-[12rem]">
                      <Field label="zum Beweis von" optional><input className={inputCls} value={b.fuer ?? ''}
                        onChange={(e) => set('beweismittel', a.beweismittel.map((x, j) => j === i ? { ...x, fuer: e.target.value } : x))} /></Field>
                    </div>
                  </div>
                )}
              />
              <p className="text-xs text-ink-500"><NormText text={`Verfügbare Urkunden sind beizulegen (Art. 244 Abs. 3 ZPO) — sie erscheinen automatisch im Beilagenverzeichnis.`} /></p>
            </div>
            </>)}
          </>
        )}
      </div>
    );

    case 'beilagen': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.klagebewilligungVorhanden}
          onChange={(v) => set('klagebewilligungVorhanden', v)}
          label={<><span>Klagebewilligung der Schlichtungsbehörde liegt vor <span className="text-ink-500"><NormText text={`(Prozessvoraussetzung, Art. 209 ZPO)`} /></span></span></>} />
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
          <Field label="Ausnahme/Verzicht (Art. 198/199 ZPO)">
            <div className="space-y-2">
              <select className={inputCls} value={a.ausnahme} onChange={(e) => set('ausnahme', e.target.value as KvAusnahme)}>
                <option value="">– wählen –</option>
                <option value="verzicht_gemeinsam">Gemeinsamer Verzicht (Streitwert ≥ CHF 100'000, Art. 199 Abs. 1)</option>
                <option value="verzicht_einseitig">Einseitiger Verzicht (Gegenpartei im Ausland/unbekannt; GlG — Art. 199 Abs. 2)</option>
                <option value="art198">Ausnahme nach Art. 198 ZPO</option>
              </select>
              {a.ausnahme === 'art198' && (
                <input className={inputCls} value={a.ausnahmeText ?? ''} onChange={(e) => set('ausnahmeText', e.target.value)}
                  placeholder="Tatbestand, z. B. Widerklage (lit. g) oder gerichtliche Klagefrist (lit. h)" />
              )}
            </div>
          </Field>
        )}
        <Checkbox
          checked={a.vollmachtBeilage}
          onChange={(v) => set('vollmachtBeilage', v)}
          label={<>Vollmacht als Beilage (bei Vertretung)
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

const fehlerEingabe = (a: KvAnswers, schritt: number): string[] =>
  kvMaengel(a).filter((m) => m.schritt === schritt).map((m) => m.text);

// Fachlicher Stopp (vereinfachtes Verfahren nicht anwendbar) — dieselbe
// Herleitung wie zuvor im Seiten-Körper (sw → routing → stopp), 1:1 übernommen.
const stoppVon = (a: KvAnswers): boolean => {
  const routing = a.materie ? kvRouting(a.materie, kvStreitwert(a), a.gerichtsKanton) : null;
  return routing !== null && !routing.anwendbar;
};

// Orchestrierung im generischen Rahmen (W2·29-WERKBANK-VORLAGEN V2b). Ist-Zustand
// vor dem Umzug, je per Slot gehalten (§6): KEIN speicherKey (Parteidaten — wie
// Schlichtungsgesuch BS), Prefill-Brücke 2.1b aus `?…` bei jedem Render gelesen
// (defaultsZusatz), Mängel-Liste als Schritt-Fehler (auch im letzten Schritt) und
// als Export-Gate der ExportLeiste; «Weiter» sperrt NUR der fachliche Stopp im
// ersten Schritt (weiterDeaktiviert), der Stopp ersetzt die Vorschau ganz
// (vorschauErsatz), Vollständigkeits-Mängel sperren den Blanko-Export der
// Vorschau nicht (direktExportBlocker: false). Mängel-Kästen und Hinweise im
// Ist-Format (pruefenZusatz); Ort/Datum erfasst der Schritt «Beilagen»
// (ortDatumImPruefen: false); Kanton in der Overline; kompakte Vorschau.
const CONFIG: VorlagenSeitenConfig<KvAnswers> = {
  cardId: 'klage-vereinfacht',
  musterdaten: MUSTER['klage-vereinfacht'],
  defaults: KV_DEFAULTS,
  // Prefill-Brücke 2.1b (Zuständigkeits-Wizard): Materie + Streitwert
  // vorbefüllt, voll editierbar; SSR-sicher via try/catch.
  defaultsZusatz: () => { try { return kvPrefillLesen(window.location.search) ?? {}; } catch { return {}; } },
  zusammenstellen: (a) => ({ ergebnis: kvZusammenstellen(a) }),
  pruefeGates: (a) => ({ blocker: kvMaengel(a).map((m) => m.text), warnungen: [], hinweise: [] }),
  schritte: SCHRITTE,
  overlineFallback: 'Zivilprozess (ZPO)',
  overlineZusatz: ({ a }) => (a.gerichtsKanton === 'BS' ? 'Basel-Stadt' : `Kanton ${a.gerichtsKanton}`),
  titel: 'Klage im vereinfachten Verfahren',
  intro: 'Erstellt die Klage nach Art. 244 ZPO aus festen Bausteinen: Rechtsbegehren, Streitgegenstand, freiwillige strukturierte Begründung, Beilagen mit Klagebewilligung — Gerichts-Adressat aller Kantone (BS: Routing nach GOG BS, fachliche Abnahme ausstehend), Kostenfreiheits-Prüfung und Klagefrist-Berechnung mit Gerichtsferien. Ohne Sprachmodell.',
  badge: 'Papierform · unterschreiben · im Doppel',
  fussnote: NICHT_GESPEICHERT_HINWEIS,
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  fehlerEingabeImLetztenSchritt: true,
  weiterDeaktiviert: ({ a }, schritt) => stoppVon(a) && schritt === 0,
  pruefenZusatz: ({ a }) => (
    <>
      {kvMaengel(a).map((m, i) => (
        <div role="alert" key={i} className="lc-notice-danger">
          <p className="text-body-s text-danger-700">{m.text}</p>
        </div>
      ))}
      {kvHinweise(a).map((h, i) => <div key={i} className="lc-notice text-body-s">{h}</div>)}
    </>
  ),
  ortDatumImPruefen: false,
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Form & Einreichung</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Unterschreiben und im Doppel einreichen:</strong><NormText text={` ein Exemplar für das Gericht, je eines pro Gegenpartei (Art. 131 ZPO); Papierform oder elektronisch mit qualifizierter Signatur (Art. 130 ZPO).`} /></li>
        <li><strong>Klagebewilligung beilegen</strong><NormText text={` (bzw. Ausnahme-Nachweis) — fehlt sie, setzt das Gericht Nachfrist (Art. 132 ZPO); die Klagefrist (Art. 209 Abs. 3/4 ZPO) läuft unabhängig davon.`} /></li>
        <li><strong>Identität wahren:</strong> Parteien, Rechtsbegehren und Streitgegenstand müssen der Klagebewilligung entsprechen; Änderungen nur nach Art. 227/230 ZPO.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Dieses Werkzeug erstellt eine Eingabe-Vorlage aus festen Bausteinen — Fristen und Vollständigkeit sind eigenverantwortlich zu prüfen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  pruefenFuss: ({ a }) => (
    <p className="text-xs text-ink-500">
      {a.gerichtsKanton === 'BS'
        ? 'Basel-Stadt: Spruchkörper-Routing nach GOG BS (Entwurf, fachliche Abnahme ausstehend) — Angaben vor Einreichung prüfen.'
        : `Kanton ${a.gerichtsKanton}: Gerichtsadresse aus zweifach geprüfter Recherche (fachliche Abnahme ausstehend); Spruchkörper und kantonale Besonderheiten richten sich nach kantonalem Recht — Angaben vor Einreichung prüfen.`}
    </p>
  ),
  vorschauKompakt: true,
  vorschauErsatz: ({ a }) => (stoppVon(a)
    ? <div className="lc-card p-5 text-body-s text-ink-600">Kein Dokument — siehe Hinweis: Für diese Konstellation ist das vereinfachte Verfahren nicht anwendbar (Streitwert/Materie prüfen).</div>
    : undefined),
  /* Vollständigkeits-Mängel sperren den Blanko-Export nicht; der fachliche Stopp ersetzt die Vorschau ganz. */
  direktExportBlocker: false,
  banner: BANNER_KV,
  dateiBasis: 'Klage-vereinfachtes-Verfahren',
  pdfLabel: 'Klage als PDF',
  docxLabel: 'Klage als Word (DOCX)',
};

export function VorlageKlageVereinfacht() {
  return <VorlagenSeite config={CONFIG} />;
}
