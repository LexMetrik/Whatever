import { useMemo } from 'react';
import { NormText } from '../components/NormText';
import { KantonArtikelTrigger } from '../components/KantonQuelleLink';
import {
  VA_DEFAULTS, VA_BEREICHE, VA_MODULE, vaZusammenstellen, pruefeVaGates,
  type VaAntworten, type VaBereich, type VaBeauftragte, type VaErsatzperson, type VaFormMode,
  type VaVertretung,
} from '../lib/vorlagen/vorsorgeauftrag';
import { NOTARIATE, NOTARIAT_SYSTEM_LABEL } from '../lib/notariate';
import { berechneBeurkundung } from '../lib/beurkundung';
import { ngPostenText } from '../lib/notariatGrundbuch';
import { KANTONE as KANTON_CODES } from '../lib/kantone';
import type { KantonCode } from '../data/tarif/typen';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, inputCls, ListenEditor } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';

// ─── Vorlagen-Wizard: Vorsorgeauftrag (Art. 360–369 ZGB) ────────────────────
// Zentrale Weiche: formMode – eigenhändig (Abschreib-Mustertext) oder
// öffentlich beurkundet (Entwurf für die Urkundsperson). Eligibility-Gate
// (Handlungsfähigkeit) blockiert hart. Eingaben bleiben im Browser.
// Seit W2·29-WERKBANK-VORLAGEN V2d auf `VorlagenSeite`. Form-Gate §8: DOCX nur
// für den Beurkundungs-Entwurf (`docxSperre` bei eigenhändiger Form, zusätzlich
// zum Katalog-Gate docxAktiv); Banner/Dateiname/Bestätigung je Form-Weiche.

const SPEICHER_KEY = 'lexmetrik.vorlage.vorsorgeauftrag.v1';

const SCHRITTE = [
  { id: 'voraussetzungen', label: 'Voraussetzungen & Form' },
  { id: 'person', label: 'Person' },
  { id: 'beauftragte', label: 'Beauftragte & Ersatz' },
  { id: 'aufgaben', label: 'Aufgaben' },
  { id: 'regelungen', label: 'Vollmachten & Entschädigung' },
  { id: 'abschluss', label: 'Abschluss' },
  { id: 'pruefen', label: 'Prüfen & Ausgabe' },
] as const;

const KANTONE = ['', 'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'];

const BANNER_VA_ABSCHREIBEN: PdfBanner = {
  titel: 'MUSTERTEXT – VOLLSTÄNDIG VON HAND ABZUSCHREIBEN',
  text: 'Dieses Blatt ist nicht der Vorsorgeauftrag. Gültig ist nur die von Anfang bis Ende eigenhändig geschriebene, datierte und unterschriebene Fassung – oder die öffentliche Beurkundung (Art. 361 ZGB).',
};
const BANNER_VA_BEURKUNDUNG: PdfBanner = {
  titel: 'ENTWURF FÜR DIE ÖFFENTLICHE BEURKUNDUNG',
  text: 'Vorlage zur Besprechung mit der Urkundsperson. Rechtsgültig wird der Vorsorgeauftrag erst mit der öffentlichen Beurkundung nach kantonalem Recht (Art. 361 Abs. 1 ZGB; BGE 151 III 81).',
};

// ─── Beurkundungs-Hinweis aus den Stammdaten (SSoT, W2·8/B5, Befund F6) ─────
//
// Bis hierher speiste die Vorlagen-Engine diese Zeile aus einem eigenen
// Kantons-Katalog (`beurkundungsHinweis()`) — eine zweite Wahrheit mit drei
// belegten Abweichungen von den Stammdaten (TG-System, BE- und SG-Gebühren).
// Der Katalog ist gestrichen; die Zeile kommt jetzt aus den beiden bestehenden
// Einzelquellen: `NOTARIATE` für Notariatssystem und Anlaufstelle,
// `berechneBeurkundung` für die Gebühr mit Norm, Stand und amtlichem Link (D1).
// Fehlt der kantonale Tarif, zeigt die Engine ein ehrliches «offen» — hier wird
// nie ein Richtwert erfunden (§8). Render-Muster übernommen aus PostenAnzeige
// in components/forms/BeurkundungForm.tsx (gleiche Engine-Rückgabe, gleiche
// Darstellung: Betrag · Rahmen-Vorbehalt · Erlass/Artikel/Stand/Quelle).
const istKanton = (k?: string): k is KantonCode =>
  !!k && (KANTON_CODES as readonly string[]).includes(k);

const BEURKUNDUNG_GENERISCH =
  'Das Beurkundungsverfahren richtet sich nach kantonalem Recht (Art. 55 SchlT ZGB) – zuständige Urkundsperson am Wohnsitz erfragen.';

function BeurkundungsHinweis({ kanton }: { kanton?: string }) {
  const kt = istKanton(kanton) ? kanton : undefined;
  const kosten = useMemo(
    () => (kt ? berechneBeurkundung({ geschaeftsart: 'vorsorgeauftrag', kanton: kt }) : null),
    [kt],
  );
  if (!kt || !kosten) return <NormText text={BEURKUNDUNG_GENERISCH} />;

  const n = NOTARIATE[kt];
  const p = kosten.posten;
  return (
    <span className="block space-y-1">
      <span className="block">
        {kt}: {NOTARIAT_SYSTEM_LABEL[n.system]} – Anlaufstelle{' '}
        <a href={n.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-800">{n.stelle} ↗</a>
        {!n.urlBelegt ? ' (Angabe ohne Gewähr)' : ''}
        {n.hinweis ? ` ${n.hinweis}` : ''}
      </span>
      {p ? (
        <span className="block">
          Beurkundungsgebühr <span className="num">{ngPostenText(p)}</span>
          {!p.ergebnis.deterministisch ? ' – Rahmen bzw. aufwandabhängig, die konkrete Festsetzung erfolgt im Einzelfall' : ''}
          {' · '}{p.quelle.erlassName} ({p.quelle.erlassNr}), <KantonArtikelTrigger quelle={p.quelle} /> · Stand {p.quelle.stand}
          {p.quelle.verifiziert === 'recherche' ? ' · nicht abgenommen' : ''}
          {p.quelle.quelleUrl
            ? <> · <a href={p.quelle.quelleUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-800">amtliche Quelle ↗</a></>
            : null}
        </span>
      ) : (
        <span className="block">{kosten.hinweise.join(' ')}</span>
      )}
    </span>
  );
}

type VaZ = { ergebnis: ReturnType<typeof vaZusammenstellen> };

function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<VaAntworten, VaZ>; schritt: number }) {
  const eigenhaendig = a.formMode === 'eigenhaendig';
  const aktiveBereiche = new Set(a.beauftragte.flatMap((b) => (b.name.trim() ? b.bereiche : [])));

  const setBeauftragte = (i: number, patch: Partial<VaBeauftragte>) =>
    set('beauftragte', a.beauftragte.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const toggleBereich = (i: number, ber: VaBereich) => {
    const b = a.beauftragte[i];
    setBeauftragte(i, { bereiche: b.bereiche.includes(ber) ? b.bereiche.filter((x) => x !== ber) : [...b.bereiche, ber] });
  };
  const setErsatz = (i: number, patch: Partial<VaErsatzperson>) =>
    set('ersatzpersonen', a.ersatzpersonen.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  // Bereichs-Wahl der Ersatzperson: leere Auswahl bleibt `undefined`
  // (= Ersatz für alle übertragenen Bereiche, unveränderter Klauseltext).
  const toggleErsatzBereich = (i: number, ber: VaBereich) => {
    const cur = a.ersatzpersonen[i].bereiche ?? [];
    const neu = cur.includes(ber) ? cur.filter((x) => x !== ber) : [...cur, ber];
    setErsatz(i, { bereiche: neu.length > 0 ? neu : undefined });
  };
  const toggleModul = (ber: VaBereich, id: string) =>
    set('module', { ...a.module, [ber]: a.module[ber].includes(id) ? a.module[ber].filter((x) => x !== id) : [...a.module[ber], id] });

  switch (SCHRITTE[schritt].id) {
    case 'voraussetzungen': return (
      <div className="space-y-5">
        <div className="space-y-2">
          <GruppenTitel><NormText text={`Errichtungsvoraussetzungen (Art. 13 ZGB)`} /></GruppenTitel>
          <Checkbox
            checked={a.volljaehrig}
            onChange={(v) => set('volljaehrig', v)}
            label={<>Ich bin volljährig (Art. 14 ZGB)
                          </>} />
          <Checkbox
            checked={a.urteilsfaehigBestaetigt}
            onChange={(v) => set('urteilsfaehigBestaetigt', v)}
            label={<>Ich bin urteilsfähig (Art. 16 ZGB) – bei hohem Alter wird ein ärztliches Zeugnis zur Urteilsfähigkeit empfohlen
                          </>} />
          <Checkbox
            checked={a.keineUmfassendeBeistandschaft}
            onChange={(v) => set('keineUmfassendeBeistandschaft', v)}
            label={<>Ich stehe nicht unter umfassender Beistandschaft (Art. 398 ZGB)
                          </>} />
        </div>
        <div className="space-y-2">
          <GruppenTitel><NormText text={`Form (Art. 361 ZGB)`} /></GruppenTitel>
          <SelectionGrid
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            items={([
              ['eigenhaendig', 'Eigenhändig', 'Vollständig von Hand schreiben, datieren, unterschreiben – Ausgabe als Abschreib-Mustertext'],
              ['oeffentlich_beurkundet', 'Öffentlich beurkundet', 'Entwurf für die Urkundsperson (Notariat) – Verfahren nach kantonalem Recht'],
            ] as [VaFormMode, string, string][]).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.formMode}
            onSelect={(code) => set('formMode', code)}
          />
          {!eigenhaendig && (
            <div className="space-y-1 pt-1">
              <Field label="Kanton (für Beurkundungs-Hinweise)" optional>
                <select className={inputCls + ' sm:max-w-[10rem]'} value={a.kanton ?? ''} onChange={(e) => set('kanton', e.target.value || undefined)}>
                  {KANTONE.map((k) => <option key={k} value={k}>{k === '' ? '– wählen –' : k}</option>)}
                </select>
              </Field>
              <div className="text-xs text-ink-500"><BeurkundungsHinweis kanton={a.kanton} /></div>
            </div>
          )}
        </div>
      </div>
    );

    case 'person': return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Vorname"><input className={inputCls} value={a.vorname} onChange={(e) => set('vorname', e.target.value)} /></Field>
        <Field label="Nachname"><input className={inputCls} value={a.nachname} onChange={(e) => set('nachname', e.target.value)} /></Field>
        <Field label="Geburtsdatum"><DatumsFeld value={a.geburtsdatum} onChange={(v) => set('geburtsdatum', v)} className={inputCls} /></Field>
        <Field label="Heimatort"><input className={inputCls} value={a.heimatort} onChange={(e) => set('heimatort', e.target.value)} placeholder="z. B. Basel BS" /></Field>
        <div className="sm:col-span-2">
          <Field label="Adresse"><input className={inputCls} value={a.adresse} onChange={(e) => set('adresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" /></Field>
        </div>
      </div>
    );

    case 'beauftragte': return (
      <div className="space-y-5">
        <div className="space-y-3">
          <GruppenTitel>Beauftragte Person(en)</GruppenTitel>
          {/* W2·8/Gegenprüfung B1: «Medizinische Vertretung nur durch
              natürliche Personen» war kategorisch falsch — Art. 378 Abs. 1
              Ziff. 1 ZGB nennt schlicht «die in einer Patientenverfügung oder
              in einem Vorsorgeauftrag bezeichnete Person» und kennt keine
              Natürlichkeits-Schranke; diese steht wörtlich nur in Art. 370
              Abs. 2 ZGB — und dort für die PATIENTENVERFÜGUNG. Die Zeile gibt
              jetzt dieselbe Lehre-Position wieder wie die Engine-Warnung
              (§5: eine Aussage), als Empfehlung statt als Verbot. */}
          <p className="text-xs text-ink-500">
            Pro Aufgabenbereich kann dieselbe oder eine andere Person bestimmt werden.
            <NormText text={` Für die medizinische Vertretung nach verbreiteter Lehre eine natürliche Person bezeichnen (vgl. Art. 370 Abs. 2 ZGB zur Patientenverfügung).`} />
          </p>
          {/* R2-F/F1-9: beide Repeater dieses Schritts (Beauftragte,
              Ersatzpersonen) trugen `lc-card p-4` als Behälter und
              «+ … hinzufügen» als Knopf; der Entfernen-Link hing per
              `ml-auto` in der Bereichs-Zeile. Kanon ist der ListenEditor. */}
          <ListenEditor
            element="Beauftragte Person"
            eintraege={a.beauftragte}
            onHinzufuegen={() => set('beauftragte', [...a.beauftragte, { name: '', typ: 'natuerlich', angaben: '', bereiche: ['personensorge', 'vermoegenssorge', 'rechtsverkehr'] }])}
            onEntfernen={(i) => set('beauftragte', a.beauftragte.filter((_, j) => j !== i))}
            kinder={(b, i) => (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3">
                  <Field label="Name (Person oder Organisation)">
                    <input className={inputCls} value={b.name} onChange={(e) => setBeauftragte(i, { name: e.target.value })} />
                  </Field>
                  <Field label="Typ">
                    <select className={inputCls} value={b.typ} onChange={(e) => setBeauftragte(i, { typ: e.target.value as VaBeauftragte['typ'] })}>
                      <option value="natuerlich">natürliche Person</option>
                      <option value="juristisch">juristische Person</option>
                    </select>
                  </Field>
                </div>
                <Field label={b.typ === 'juristisch' ? 'Sitz / Adresse' : 'Geburtsdatum / Adresse'} hint="genaue Bezeichnung erleichtert der KESB die Eignungsprüfung">
                  <input className={inputCls} value={b.angaben} onChange={(e) => setBeauftragte(i, { angaben: e.target.value })} />
                </Field>
                <div className="flex flex-wrap items-center gap-3">
                  {VA_BEREICHE.map((ber) => (
                    <label key={ber.id} className="flex items-center gap-1.5 text-body-s cursor-pointer text-ink-700">
                      <input type="checkbox" checked={b.bereiche.includes(ber.id)} onChange={() => toggleBereich(i, ber.id)} />
                      {ber.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          />
        </div>

        {a.beauftragte.filter((b) => b.name.trim() && b.bereiche.length > 0).length > 1 && (
          <div className="space-y-2">
            <GruppenTitel>Zusammenwirken mehrerer beauftragter Personen</GruppenTitel>
            <SelectionGrid
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              items={([
                ['einzeln', 'Einzelvertretung (empfohlen)', 'Jede Person handelt im ihr übertragenen Bereich allein'],
                ['gemeinsam', 'Kollektivvertretung (nur gemeinsam)', 'Im selben Bereich beauftragte Personen handeln nur zusammen'],
              ] as [VaVertretung, string, string][]).map(([code, label, sub]) => ({ code, label, sub }))}
              value={a.vertretung}
              onSelect={(code) => set('vertretung', code)}
            />
            <p className="text-xs text-ink-500">Das Gesetz regelt das Zusammenwirken nicht ausdrücklich; die ausdrückliche Anordnung schafft Klarheit für KESB, Banken und Behörden.</p>
          </div>
        )}

        <div className="space-y-3">
          <GruppenTitel><NormText text={`Ersatzpersonen (Art. 360 Abs. 3 ZGB)`} /></GruppenTitel>
          <ListenEditor
            element="Ersatzperson"
            eintraege={a.ersatzpersonen}
            onHinzufuegen={() => set('ersatzpersonen', [...a.ersatzpersonen, { name: '', typ: 'natuerlich', angaben: '' }])}
            onEntfernen={(i) => set('ersatzpersonen', a.ersatzpersonen.filter((_, j) => j !== i))}
            kinder={(e, i) => (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3 items-end">
                  <Field label="Name (Person oder Organisation)">
                    <input className={inputCls} value={e.name} onChange={(ev) => setErsatz(i, { name: ev.target.value })} />
                  </Field>
                  <Field label="Typ">
                    <select className={inputCls} value={e.typ} onChange={(ev) => setErsatz(i, { typ: ev.target.value as VaErsatzperson['typ'] })}>
                      <option value="natuerlich">natürliche Person</option>
                      <option value="juristisch">juristische Person</option>
                    </select>
                  </Field>
                </div>
                <Field label={e.typ === 'juristisch' ? 'Sitz / Adresse' : 'Geburtsdatum / Adresse'} optional>
                  <input className={inputCls} value={e.angaben} onChange={(ev) => setErsatz(i, { angaben: ev.target.value })} />
                </Field>
                <div className="flex flex-wrap items-center gap-3">
                  {VA_BEREICHE.map((ber) => (
                    <label key={ber.id} className="flex items-center gap-1.5 text-body-s cursor-pointer text-ink-700">
                      <input type="checkbox" checked={(e.bereiche ?? []).includes(ber.id)} onChange={() => toggleErsatzBereich(i, ber.id)} />
                      {ber.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-ink-500">Bereiche leer lassen = Ersatz für alle übertragenen Bereiche.</p>
              </div>
            )}
          />
          <p className="text-xs text-ink-500">Empfehlung: Ersatzperson ausserhalb der Familie für Interessenkonfliktfälle.</p>
        </div>
      </div>
    );

    case 'aufgaben': return (
      <div className="space-y-5">
        {aktiveBereiche.size === 0 && (
          <p className="text-body-s text-ink-500">Zuerst im Schritt «Beauftragte & Ersatz» mindestens eine Person mit Aufgabenbereichen erfassen.</p>
        )}
        {VA_BEREICHE.filter((ber) => aktiveBereiche.has(ber.id)).map((ber) => (
          <div key={ber.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <GruppenTitel>{ber.label}</GruppenTitel>
              <button type="button" className="text-xs text-brass-700 hover:text-brass-600"
                onClick={() => set('module', { ...a.module, [ber.id]: VA_MODULE[ber.id].map((m) => m.id) })}>
                alle wählen
              </button>
            </div>
            {VA_MODULE[ber.id].map((m) => (
              <Checkbox
                key={m.id}
                checked={a.module[ber.id].includes(m.id)}
                onChange={() => toggleModul(ber.id, m.id)}
                label={<>{m.label}</>} />
            ))}
          </div>
        ))}
        {a.module.vermoegenssorge.includes('liegenschaften') && (
          <p className="lc-notice text-body-s">
            Liegenschaften gewählt: Die ausdrückliche Grundstück-Sondervollmacht wird automatisch
            aufgenommen (Art. 396 Abs. 3 OR i.V.m. Art. 365 Abs. 1 ZGB – Details im Prüfschritt).
          </p>
        )}
      </div>
    );

    case 'regelungen': return (
      <div className="space-y-5">
        <div className="space-y-2">
          <GruppenTitel>Sondervollmachten</GruppenTitel>
          <Checkbox
            checked={a.schenkungenErlaubt}
            onChange={(v) => set('schenkungenErlaubt', v)}
            label={<><span>Übliche Gelegenheitsgeschenke erlauben <span className="text-ink-500"><NormText text={`(Schranke: Art. 240 Abs. 2 OR)`} /></span></span></>} />
          <Checkbox
            checked={a.besondereGeschaefte}
            onChange={(v) => set('besondereGeschaefte', v)}
            label={<><span>Besondere Geschäfte ausdrücklich ermächtigen: Vergleich, Schiedsvereinbarung, Wechsel <span className="text-ink-500"><NormText text={`(Art. 396 Abs. 3 OR)`} /></span></span></>} />
        </div>
        <Field label="Weisungen für die Erfüllung der Aufgaben" optional hint="Art. 360 Abs. 2 ZGB – z. B. Anlagegrundsätze, Wohnwünsche">
          <textarea className={inputCls} rows={3} value={a.weisungen ?? ''} onChange={(e) => set('weisungen', e.target.value)} />
        </Field>
        <div className="space-y-2">
          <GruppenTitel><NormText text={`Entschädigung (Art. 366 ZGB)`} /></GruppenTitel>
          {/* D-3 (31.8.2026): Pillen-Reihe über den geteilten Baustein
              (`ui/SelectionGrid`, variant «pille») — die invertierte
              ink-900-Füllung als Auswahl-Signal ist entfallen, es gilt der
              Kanon `border-brass-500 bg-brass-100/60`. */}
          <SelectionGrid
            variant="pille"
            gruppenLabel="Entschädigung"
            className="flex flex-wrap gap-1.5"
            items={[
              { code: 'keine_angabe', label: 'keine Regelung (KESB legt fest)' },
              { code: 'unentgeltlich', label: 'unentgeltlich (Spesen ersetzt)' },
              { code: 'pauschale', label: 'Pauschale pro Jahr' },
              { code: 'nach_aufwand', label: 'nach Aufwand (CHF/Std.)' },
            ] as const}
            value={a.entschaedigung ?? ''}
            onSelect={(code) => set('entschaedigung', code)}
          />
          {(a.entschaedigung === 'pauschale' || a.entschaedigung === 'nach_aufwand') && (
            <Field label={a.entschaedigung === 'pauschale' ? 'Betrag (CHF pro Jahr)' : 'Ansatz (CHF pro Stunde)'}>
              <input type="number" min={0} className={inputCls + ' w-40'} value={a.entschaedigungBetrag ?? ''}
                onChange={(e) => set('entschaedigungBetrag', e.target.value === '' ? undefined : Number(e.target.value))} />
            </Field>
          )}
        </div>
      </div>
    );

    case 'abschluss': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.pvVorhanden}
          onChange={(v) => set('pvVorhanden', v)}
          label={<><span>Auf meine separate Patientenverfügung verweisen <span className="text-ink-500">(geht bei medizinischen Massnahmen vor)</span></span></>} />
        {a.pvVorhanden && (
          <Field label="Hinterlegungsort der Patientenverfügung" optional>
            <input className={inputCls} value={a.pvHinterlegung ?? ''} onChange={(e) => set('pvHinterlegung', e.target.value)} placeholder="z. B. Hausarztpraxis Dr. X" />
          </Field>
        )}
        <Checkbox
          checked={a.ersetztFruehere}
          onChange={(v) => set('ersetztFruehere', v)}
          label={<><span>Frühere Vorsorgeaufträge ersetzen <span className="text-ink-500"><NormText text={`(Widerruf in Errichtungsform, Art. 362 Abs. 1 ZGB)`} /></span></span></>} />
        {!a.ersetztFruehere && (
          <div className="space-y-2 pl-6">
            <p className="text-xs text-ink-500">
              <NormText text={`Nicht angekreuzt = dieser Vorsorgeauftrag ergänzt den früheren Auftrag und lässt ihn im Übrigen unberührt. Die Ergänzungs-Klausel wird aufgenommen; ohne sie träte der neue Auftrag von Gesetzes wegen an die Stelle des früheren (Art. 362 Abs. 3 ZGB).`} />
            </p>
            <Field label="Früherer Vorsorgeauftrag vom" optional hint="ohne Datum bleibt in der Klausel ein Ausfüll-Strich stehen">
              <DatumsFeld value={a.fruehererVaDatum ?? ''} onChange={(v) => set('fruehererVaDatum', v || undefined)} className={inputCls} />
            </Field>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ort" optional><input className={inputCls} value={a.ort ?? ''} onChange={(e) => set('ort', e.target.value)} placeholder="z. B. Basel" /></Field>
          {eigenhaendig ? (
            <Field label="Datum" hint="wird beim eigenhändigen Vorsorgeauftrag mit abgeschrieben (Art. 361 Abs. 2 ZGB)">
              <DatumsFeld value={a.datum} onChange={(v) => set('datum', v)} className={inputCls} />
            </Field>
          ) : (
            <p className="text-body-s text-ink-500 self-end pb-2">Ort/Datum/Unterschriften erfolgen anlässlich der Beurkundung.</p>
          )}
        </div>
      </div>
    );
  }
}

function fehlerEingabe(a: VaAntworten, i: number): string[] {
  const eigenhaendig = a.formMode === 'eigenhaendig';
  const f: string[] = [];
  if (i === 0 && (!a.volljaehrig || !a.urteilsfaehigBestaetigt || !a.keineUmfassendeBeistandschaft)) {
    f.push('Alle drei Errichtungsvoraussetzungen bestätigen (Handlungsfähigkeit, Art. 13 ZGB) – sonst ist ein Vorsorgeauftrag nicht gültig errichtbar.');
  }
  if (i === 1) {
    if (!a.vorname.trim() || !a.nachname.trim()) f.push('Vor- und Nachname angeben.');
    if (!a.geburtsdatum) f.push('Geburtsdatum angeben.');
    if (!a.heimatort.trim()) f.push('Heimatort angeben.');
    if (!a.adresse.trim()) f.push('Adresse angeben.');
  }
  if (i === 5 && eigenhaendig && !a.datum) {
    f.push('Datum angeben – es wird beim eigenhändigen Vorsorgeauftrag mit abgeschrieben (Art. 361 Abs. 2 ZGB).');
  }
  return f;
}

const istEigenhaendig = (a: VaAntworten) => a.formMode === 'eigenhaendig';

const CONFIG: VorlagenSeitenConfig<VaAntworten, VaZ> = {
  cardId: 'vorsorgeauftrag',
  musterdaten: MUSTER.vorsorgeauftrag,
  defaults: VA_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  normalisieren: (g) => ({
    ...g,
    beauftragte: Array.isArray(g.beauftragte) ? g.beauftragte : [],
    // Alt-Stände (vor W2·8) kennen weder `typ` noch `bereiche` bei den
    // Ersatzpersonen: fehlendes typ → 'natuerlich' (nie 'juristisch',
    // sonst entstünde ein Blocker aus einem Altstand); fehlende bereiche
    // bleiben undefined = Ersatz für alle übertragenen Bereiche.
    ersatzpersonen: Array.isArray(g.ersatzpersonen)
      ? (g.ersatzpersonen as Partial<VaErsatzperson>[]).map((e): VaErsatzperson => ({
        name: e.name ?? '',
        typ: e.typ === 'juristisch' ? 'juristisch' : 'natuerlich',
        angaben: e.angaben ?? '',
        bereiche: Array.isArray(e.bereiche) ? e.bereiche : undefined,
      }))
      : [],
    vertretung: g.vertretung === 'gemeinsam' ? 'gemeinsam' : 'einzeln',
    module: {
      personensorge: Array.isArray(g.module?.personensorge) ? g.module.personensorge : [],
      vermoegenssorge: Array.isArray(g.module?.vermoegenssorge) ? g.module.vermoegenssorge : [],
      rechtsverkehr: Array.isArray(g.module?.rechtsverkehr) ? g.module.rechtsverkehr : [],
    },
  }),
  // Ist-Zustand vor dem Umzug (§6): kein Profil-Prefill.
  profilPrefill: false,
  zusammenstellen: (a) => ({ ergebnis: vaZusammenstellen(a) }),
  pruefeGates: (a) => pruefeVaGates(a),
  schritte: SCHRITTE,
  overlineFallback: 'Vorsorge & Erwachsenenschutz',
  titel: 'Vorsorgeauftrag',
  intro: 'Bestimmen Sie, wer im Fall Ihrer Urteilsunfähigkeit Personensorge, Vermögenssorge und Vertretung im Rechtsverkehr übernimmt – aus festen, strukturierten Bausteinen, ohne Sprachmodell. Mit der Form-Weiche eigenhändig ↔ öffentlich beurkundet.',
  badge: 'Eigenhändig ODER beurkundet (Art. 361 ZGB)',
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: Ort/Datum stehen im Schritt «Abschluss», der
  // letzte Schritt kennt keine Pflichtfeld-Fehler; jeder Blocker steht in
  // einer eigenen Box und sperrt den Export (§6).
  ortDatumImPruefen: false,
  blockerImLetztenSchritt: false,
  blockerEinzeln: true,
  bestaetigung: ({ a }) => (
    <>
      <p className="lc-overline text-brass-700">Form-Gate – damit Ihr Vorsorgeauftrag gültig wird</p>
      {istEigenhaendig(a) ? (
        <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
          <li><strong>Vollständig von Hand abschreiben:</strong><NormText text={` Der ganze Text – einschliesslich Datum und Unterschrift – muss eigenhändig geschrieben sein (Art. 361 Abs. 2 ZGB). Ein am Computer erstellter und nur unterschriebener Text ist UNGÜLTIG; auch eine bloss beglaubigte Unterschrift genügt nicht.`} /></li>
          <li><strong>Alternative:</strong><NormText text={` öffentliche Beurkundung bei der Urkundsperson (Art. 361 Abs. 1 ZGB).`} /></li>
        </ul>
      ) : (
        <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
          <li><strong>Beurkundung:</strong> Diesen Entwurf mit der Urkundsperson besprechen; das Verfahren richtet sich nach kantonalem Recht (BGE 151 III 81 – keine Zeugen erforderlich). <BeurkundungsHinweis kanton={a.kanton} /></li>
        </ul>
      )}
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Wirksamkeit:</strong><NormText text={` Der Vorsorgeauftrag wird erst wirksam, wenn die KESB ihn bei eingetretener Urteilsunfähigkeit validiert (Art. 363 ZGB).`} /></li>
        {/* W2·8/B5 (Befund N1, Fedlex-AKN-Verifikation 2.8.2026): Der Eintrag
            erfolgt auf Antrag bei einem BELIEBIGEN Zivilstandsamt (Art. 23a ZStV,
            SR 211.112.2) und umfasst nur Tatsache und Hinterlegungsort, nie den
            Inhalt. Die Gebühr von CHF 75 ist ein FIXER Bundestarif (Anhang 1
            Ziff. 23 ZStGV, SR 172.042.110); weitere Gebühren sind unzulässig
            (Art. 1 Abs. 2 ZStGV). Die frühere Zeile war doppelt falsch: «Richtwerte»
            (es ist ein Fixtarif) und «Bestätigung +CHF 30» (kein Tatbestand im
            Anhang – die Ziff.-1.1-Gebühr betrifft beurkundete Personenstandsdaten,
            der VA-Eintrag ist nach Art. 8a ZStV gerade nicht beurkundet). */}
        {/* W2·8/Gegenprüfung B4 (D1): Die ZStGV-Angabe trug Norm und
            Stand, aber KEINEN Live-Link zur geltenden Fassung — ein
            gespeicherter Rechtswert ohne Weg zur Quelle. Die Zitat-Stelle
            ist jetzt ein externer Link auf die geltende Fassung; Muster
            übernommen von den «amtliche Quelle ↗»-Links der
            BeurkundungsHinweis-Komponente oben. Ziel-ELI live über den
            Fedlex-SPARQL-Endpunkt aufgelöst (3.8.2026): SR 172.042.110 →
            eli/cc/1999/490, aktive Konsolidierung seit 11.11.2024 ohne
            Endedatum und ohne dateNoLongerInForce — der angezeigte Stand
            ist damit der geltende. NormText verlinkt die Stelle nicht
            selbst: «Anhang 1 Ziff. 23» ist kein «Art. N GESETZ»-Verweis,
            und die ZStGV steht bewusst nicht im Norm-Register. */}
        <li><strong>Auffindbarkeit:</strong>
          <NormText text={` Errichtung und Hinterlegungsort auf Antrag bei einem beliebigen Zivilstandsamt eintragen lassen (Art. 361 Abs. 3 ZGB; Art. 23a ZStV). Gebühr CHF 75 (`} />
          <a href="https://www.fedlex.admin.ch/eli/cc/1999/490/de" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-800">Anhang 1 Ziff. 23 ZStGV ↗</a>
          <NormText text={`, SR 172.042.110, Stand 11.11.2024); eingetragen wird nur die Tatsache der Errichtung und der Hinterlegungsort, nicht der Inhalt. Die KESB anerkennt nur das Original; beauftragte Person informieren und Aufbewahrungsort mitteilen (nicht ins alleinige Bankschliessfach).`} />
        </li>
        <li><strong>Widerruf:</strong><NormText text={` jederzeit in einer Errichtungsform oder durch Vernichtung der Urkunde (Art. 362 ZGB).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: ({ a }) => (istEigenhaendig(a)
    ? 'Ich habe verstanden: Nur die vollständig handschriftliche (oder beurkundete) Fassung ist gültig – dieses Werkzeug liefert einen Mustertext zum Abschreiben.'
    : 'Ich habe verstanden: Dieses Werkzeug liefert einen Entwurf – rechtsgültig wird der Vorsorgeauftrag erst mit der öffentlichen Beurkundung.'),
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  pruefenFuss: (
    <p className="text-xs text-ink-500">
      Bei komplexen Vermögensverhältnissen, Unternehmen oder Auslandsbezug: Notariat bzw.
      anwaltliche Beratung beiziehen. Ein ärztliches Zeugnis zur Urteilsfähigkeit ist bei
      hohem Alter empfehlenswert.
    </p>
  ),
  // Form-Gate hat Vorrang: Word nur für den Beurkundungs-Entwurf (§8) — die
  // eigenhändige Form sperrt DOCX zusätzlich zum Katalog-Gate docxAktiv.
  docxSperre: istEigenhaendig,
  banner: (a) => (istEigenhaendig(a) ? BANNER_VA_ABSCHREIBEN : BANNER_VA_BEURKUNDUNG),
  dateiBasis: (a) => (istEigenhaendig(a) ? 'Vorsorgeauftrag-Mustertext' : 'Vorsorgeauftrag-Entwurf-Beurkundung'),
  pdfLabel: (a) => (istEigenhaendig(a) ? 'Mustertext als PDF' : 'Entwurf als PDF'),
  docxLabel: 'Entwurf als Word (DOCX)',
};

export function VorlageVorsorgeauftrag() {
  return <VorlagenSeite config={CONFIG} />;
}
