import { useMemo, useRef, useState } from 'react';
import { NormText } from '../components/NormText';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { Checkbox, Field, inputCls, ListenEditor } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { DatumsFeld } from '../components/DatumsFeld';
import { MappenAbschnitt, MappenAnsicht, MappenGates, MappenSeite, NotariatsHinweis, HrAmtHinweis } from '../components/vorlagen/Dokumentmappe';
import type { PdfBanner } from '../lib/vorlagen/banner';
import {
  keDokumentmappe,
  keVerfallDatum,
  KE_DEFAULTS,
  type KeAntworten,
  type KeRechtsform,
  type KeEinlageArt,
  type KeZeichnerZeile,
  type KeKlausel,
} from '../lib/vorlagen/kapitalerhoehung';
import { KANTONE } from '../lib/kantone';
import { karte } from '../lib/startseiteConfig';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Maske: Kapitalerhöhung AG/GmbH (Plan 9c, Auftrag David 7.6.2026) ────────
// Rechtslogik in lib/vorlagen/kapitalerhoehung.ts (§3); Wortlaut-Grundlage
// bibliothek/recherche/kapitalerhoehung-wortlaute.md. GV-/Feststellungs-
// Urkunden als ENTWURF (Beurkundungszwang 650 II / 652g II OR, §8);
// Zeichnungsscheine, Bericht und Anmeldung druckfertig.
// Hinweis /simplify: Tab-/Export-/Vorschau-Block ist bewusst dupliziert mit
// Gmbh-/AgDokumentmappe (3 Stellen) — Kandidat für einen geteilten Rahmen.

const BANNER_ENTWURF: PdfBanner = {
  titel: 'ENTWURF – KEIN GÜLTIGES DOKUMENT',
  text: 'Vorbereitung für die Urkundsperson: Erhöhungsbeschluss und Feststellungs-Urkunde bedürfen der öffentlichen Beurkundung (Art. 650 Abs. 2 / Art. 652g Abs. 2 OR).',
};
const BANNER_FERTIG: PdfBanner = {
  titel: 'NACH DEM AUSDRUCK DATIEREN UND UNTERSCHREIBEN',
  text: 'Im Original einzureichen (Art. 20 HRegV); Anmeldung innert sechs Monaten nach dem Beschluss, sonst fällt er dahin (Art. 650 Abs. 3 / Art. 781 Abs. 4 OR).',
};

const KLAUSELN: { id: KeKlausel; label: string }[] = [
  { id: 'nachschuss', label: 'Nachschusspflicht' },
  { id: 'nebenleistung', label: 'Nebenleistungspflichten' },
  { id: 'konkurrenzverbot', label: 'Konkurrenzverbot' },
  { id: 'vorkaufsrecht', label: 'Vorhand-/Vorkaufs-/Kaufsrechte' },
  { id: 'konventionalstrafe', label: 'Konventionalstrafen' },
];

export function VorlageKapitalerhoehung() {
  const card = karte('kapitalerhoehung');

  const [rechtsform, setRechtsform] = useState<KeRechtsform>('ag');
  const [einlageArt, setEinlageArt] = useState<KeEinlageArt>('bar');
  const [firma, setFirma] = useState('');
  const [sitz, setSitz] = useState('');
  const [kanton, setKanton] = useState('ZH');
  const [bisher, setBisher] = useState(KE_DEFAULTS.bisherigesKapitalChf);
  const [bisherAnzahl, setBisherAnzahl] = useState(KE_DEFAULTS.bisherigeAnzahl);
  const [nennwert, setNennwert] = useState(KE_DEFAULTS.nennwertChf);
  const [anzahlNeue, setAnzahlNeue] = useState(KE_DEFAULTS.anzahlNeue);
  const [ausgabebetrag, setAusgabebetrag] = useState(KE_DEFAULTS.ausgabebetragChf);
  const [statutenArtikel, setStatutenArtikel] = useState(KE_DEFAULTS.statutenArtikelNr);
  const [gvDatum, setGvDatum] = useState('');
  const [zeichner, setZeichner] = useState<(KeZeichnerZeile & { key: number })[]>([]);
  const [bezugsrechtGewahrt, setBezugsrechtGewahrt] = useState(true);
  const [bankInUrkunde, setBankInUrkunde] = useState(true);
  const [bankName, setBankName] = useState('');
  const [bankOrt, setBankOrt] = useState('');
  const [befristung, setBefristung] = useState(true);
  const [berichtUnterzeichner, setBerichtUnterzeichner] = useState('');
  const [vorsitz, setVorsitz] = useState('');
  const [klauseln, setKlauseln] = useState<KeKlausel[]>([]);
  const [ort, setOrt] = useState('');
  const [datum, setDatum] = useState('');

  const naechsterKey = useRef(1);
  const neuerKey = () => naechsterKey.current++;

  // V5 (W2·29-WERKBANK-VORLAGEN): «Mit Musterdaten füllen» — Beispiel aus
  // components/vorlagen/musterdaten.ts (eine Quelle, §5), vollständiger Ersatz.
  const musterdatenFuellen = () => {
    const d = MUSTER.kapitalerhoehung();
    setRechtsform(d.rechtsform); setEinlageArt(d.einlageArt); setFirma(d.firma); setSitz(d.sitz); setKanton(d.kanton);
    setBisher(d.bisherigesKapitalChf); setBisherAnzahl(d.bisherigeAnzahl); setNennwert(d.nennwertChf);
    setAnzahlNeue(d.anzahlNeue); setAusgabebetrag(d.ausgabebetragChf); setStatutenArtikel(d.statutenArtikelNr);
    setGvDatum(d.gvDatum); setZeichner(d.zeichner.map((z) => ({ ...z, key: neuerKey() })));
    setBezugsrechtGewahrt(d.bezugsrechtGewahrt); setBankInUrkunde(d.bankInUrkundeGenannt);
    setBankName(d.bankName); setBankOrt(d.bankOrt); setBefristung(d.befristungsKlausel);
    setBerichtUnterzeichner(d.berichtUnterzeichner); setVorsitz(d.vorsitzName);
    setKlauseln([...d.statutKlauseln]); setOrt(d.ort); setDatum(d.datum);
  };

  const antworten: KeAntworten = useMemo(() => ({
    ...KE_DEFAULTS,
    rechtsform, einlageArt, firma, sitz, kanton,
    bisherigesKapitalChf: bisher, bisherigeAnzahl: bisherAnzahl,
    nennwertChf: nennwert, anzahlNeue, ausgabebetragChf: ausgabebetrag,
    statutenArtikelNr: statutenArtikel, gvDatum, zeichner,
    bezugsrechtGewahrt, bankInUrkundeGenannt: bankInUrkunde, bankName, bankOrt,
    befristungsKlausel: befristung, berichtUnterzeichner, vorsitzName: vorsitz,
    statutKlauseln: klauseln, ort, datum,
  }), [rechtsform, einlageArt, firma, sitz, kanton, bisher, bisherAnzahl, nennwert, anzahlNeue,
    ausgabebetrag, statutenArtikel, gvDatum, zeichner, bezugsrechtGewahrt, bankInUrkunde,
    bankName, bankOrt, befristung, berichtUnterzeichner, vorsitz, klauseln, ort, datum]);

  const mappe = useMemo(() => keDokumentmappe(antworten), [antworten]);

  const toggleKlausel = (k: KeKlausel) =>
    setKlauseln((alt) => (alt.includes(k) ? alt.filter((x) => x !== k) : [...alt, k]));

  const ag = rechtsform === 'ag';
  const docxErlaubt = card?.modus === 'vorlage' && (card.output?.includes('docx') ?? false);
  const pk = usePaneKlasse();

  return (
    <MappenSeite karte={card} titel="Kapitalerhöhung (AG / GmbH)" musterdaten={musterdatenFuellen} badge="Beschluss-Urkunden als Entwurf"
        intro={<>
          Ordentliche Kapitalerhöhung gegen Bareinlage: Erhöhungsbeschluss und Feststellungs-Urkunde
          mit Statutenänderung entstehen als ENTWURF für die Urkundsperson (öffentliche Beurkundung
          bleibt zwingend); Zeichnungsscheine, Kapitalerhöhungsbericht und Handelsregister-Anmeldung
          druckfertig. Achtung Verfall: Anmeldung innert sechs Monaten nach dem Beschluss.
        </>}>
      <MappenAbschnitt className="space-y-5">
        <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
          <Field label="Rechtsform">
            <select className={inputCls} value={rechtsform} onChange={(e) => setRechtsform(e.target.value as KeRechtsform)}>
              <option value="ag">Aktiengesellschaft (AG)</option>
              <option value="gmbh">GmbH</option>
            </select>
          </Field>
          <Field label="Art der Einlage">
            <select className={inputCls} value={einlageArt} onChange={(e) => setEinlageArt(e.target.value as KeEinlageArt)}>
              <option value="bar">Bareinlage</option>
              <option value="sacheinlage">Sacheinlage</option>
              <option value="verrechnung">Verrechnung</option>
              <option value="eigenkapital">Umwandlung von Eigenkapital</option>
            </select>
          </Field>
          <Field label="Kanton (Handelsregisteramt)">
            <select className={inputCls} value={kanton} onChange={(e) => setKanton(e.target.value)}>
              {KANTONE.map((kt) => <option key={kt} value={kt}>{kt}</option>)}
            </select>
          </Field>
        </div>

        <NotariatsHinweis kanton={kanton} />
        <HrAmtHinweis kanton={kanton} />

        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label={`Firma (mit Zusatz «${ag ? 'AG' : 'GmbH'}»)`}>
            <input className={inputCls} value={firma} onChange={(e) => setFirma(e.target.value)} />
          </Field>
          <Field label="Sitz (politische Gemeinde)">
            <input className={inputCls} value={sitz} onChange={(e) => setSitz(e.target.value)} />
          </Field>
        </div>
        <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
          <Field label={`Bisheriges ${ag ? 'Aktienkapital' : 'Stammkapital'} (CHF)`}>
            {/* R2-E/F1-7: CHF-Beträge auf dem Haus-BetragsFeld; der Rohwert-
                Vertrag zum Schema bleibt unverändert (fmtCHF/zahl normalisieren
                Apostrophe ohnehin). Der Apostroph-Hinweis entfällt, weil das
                Feld die Gruppierung selbst setzt. */}
            <BetragsFeld className={inputCls} placeholder="z. B. 100'000" value={bisher} onChange={setBisher} />
          </Field>
          <Field label={`Bisherige Anzahl ${ag ? 'Aktien' : 'Stammanteile'}`}>
            <input className={inputCls} inputMode="numeric" value={bisherAnzahl} onChange={(e) => setBisherAnzahl(e.target.value)} />
          </Field>
          <Field label="Nennwert (CHF)">
            <BetragsFeld className={inputCls} value={nennwert} onChange={setNennwert} />
          </Field>
          <Field label={`Anzahl NEUE ${ag ? 'Namenaktien' : 'Stammanteile'}`}>
            <input className={inputCls} inputMode="numeric" value={anzahlNeue} onChange={(e) => setAnzahlNeue(e.target.value)} />
          </Field>
          <Field label="Ausgabebetrag je Stück (CHF, ≥ Nennwert; Agio zulässig)">
            <BetragsFeld className={inputCls} value={ausgabebetrag} onChange={setAusgabebetrag} />
          </Field>
          <Field label="Statuten-Artikel der Kapitalbestimmung">
            <input className={inputCls} value={statutenArtikel} onChange={(e) => setStatutenArtikel(e.target.value)} placeholder="z. B. 3" />
          </Field>
        </div>
        <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
          <Field label={`Datum ${ag ? 'GV' : 'GsV'}-Beschluss (6-Monats-Verfall!)`}
            hint={(() => { const v = keVerfallDatum(gvDatum); return v
              ? `Anmeldung spätestens am ${v.split('-').reverse().join('.')} — sonst fällt der Beschluss dahin (früher anmelden; eine Wochenend-/Feiertagsverlängerung ist nicht gesichert).`
              : undefined; })()}>
            {/* R2-E/F1-1: DatumsFeld statt nativem type="date" — der Browser
                rendert Letzteres in SEINER Locale (US: MM/DD/YYYY), und an
                diesem Datum hängt die 6-Monats-Verfallfrist. Wert bleibt ISO. */}
            <DatumsFeld value={gvDatum} onChange={setGvDatum} className={inputCls} />
          </Field>
          <Field label="Kapitalerhöhungsbericht: unterzeichnet durch">
            <input className={inputCls} value={berichtUnterzeichner} onChange={(e) => setBerichtUnterzeichner(e.target.value)} placeholder={ag ? 'VR-Mitglied' : 'Geschäftsführer:in'} />
          </Field>
          <Field label={`Vorsitz ${ag ? 'Verwaltungsrat' : 'Geschäftsführung'}`}>
            <input className={inputCls} value={vorsitz} onChange={(e) => setVorsitz(e.target.value)} />
          </Field>
        </div>

        {/* Zeichner */}
        <div className="space-y-2">
          <p className="text-body-s font-medium text-ink-900"><NormText text={`Zeichner:innen (Zeichnungsschein je Person, Art. 652 OR)`} /></p>
          {/* R2-F/F1-9: «✕» im `lc-btn-ghost lc-btn-sm` und «+ … hinzufügen»
              wichen dem geteilten ListenEditor. */}
          <ListenEditor
            element="Zeichner:in"
            eintraege={zeichner}
            className="space-y-2"
            schluessel={(z) => z.key}
            onHinzufuegen={() => setZeichner((alt) => [...alt, { key: neuerKey(), name: '', angaben: '', anzahl: '', bereitsBeteiligt: true }])}
            onEntfernen={(i) => setZeichner((alt) => alt.filter((_, j) => j !== i))}
            kinder={(z) => (
              <div className={pk('grid grid-cols-1 sm:grid-cols-[2fr_3fr_1fr_auto] gap-2 items-end', 'grid grid-cols-1 @5xl/pane:grid-cols-[2fr_3fr_1fr_auto] gap-2 items-end')}>
                <Field label="Name">
                  <input className={inputCls} value={z.name}
                    onChange={(e) => setZeichner((alt) => alt.map((x) => x.key === z.key ? { ...x, name: e.target.value } : x))} />
                </Field>
                <Field label="Angaben (Wohnort/Sitz)">
                  <input className={inputCls} value={z.angaben}
                    onChange={(e) => setZeichner((alt) => alt.map((x) => x.key === z.key ? { ...x, angaben: e.target.value } : x))} />
                </Field>
                <Field label="Stück">
                  <input className={inputCls} inputMode="numeric" value={z.anzahl}
                    onChange={(e) => setZeichner((alt) => alt.map((x) => x.key === z.key ? { ...x, anzahl: e.target.value } : x))} />
                </Field>
                {!ag && (
                  <Checkbox checked={z.bereitsBeteiligt} className="pb-2" label="bereits Gesellschafter:in"
                    onChange={(v) => setZeichner((alt) => alt.map((x) => x.key === z.key ? { ...x, bereitsBeteiligt: v } : x))} />
                )}
              </div>
            )}
          />
        </div>

        {/* GmbH: statutarische Klauseln für den 777a-Hinweis an neue Zeichner */}
        {!ag && zeichner.some((z) => z.name.trim() && !z.bereitsBeteiligt) && (
          <div>
            <p className="text-body-s font-medium text-ink-900 mb-1.5">
              Statutarische Klauseln (Hinweispflicht im Zeichnungsschein für NEUE Gesellschafter, Art. 777a Abs. 2 OR)
            </p>
            <div className="flex flex-wrap gap-x-6">
              {KLAUSELN.map((k) => (
                <Checkbox key={k.id} checked={klauseln.includes(k.id)} onChange={() => toggleKlausel(k.id)} label={k.label} />
              ))}
            </div>
          </div>
        )}

        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-x-6', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-x-6')}>
          <Checkbox checked={bezugsrechtGewahrt} onChange={setBezugsrechtGewahrt} label="Bezugsrecht weder eingeschränkt noch aufgehoben (Art. 652b OR)" />
          <Checkbox checked={!bankInUrkunde} onChange={(v) => setBankInUrkunde(!v)} label="Bank wird in der Urkunde NICHT genannt (separate Bescheinigung)" />
          <Checkbox checked={befristung} onChange={setBefristung} label="Zeichnungsschein-Befristung 3 Monate (Usanz, kein Gesetzesinhalt)" />
        </div>
        {bankInUrkunde && (
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            <Field label="Bank (in der Urkunde genannt)">
              <input className={inputCls} value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </Field>
            <Field label="Bank-Ort">
              <input className={inputCls} value={bankOrt} onChange={(e) => setBankOrt(e.target.value)} />
            </Field>
          </div>
        )}
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Ort (Unterschriften)">
            <input className={inputCls} value={ort} onChange={(e) => setOrt(e.target.value)} />
          </Field>
          <Field label="Datum (Unterschriften)">
            <DatumsFeld value={datum} onChange={setDatum} className={inputCls} />
          </Field>
        </div>

        <MappenGates gates={mappe.gates} />

        <MappenAnsicht dokumente={mappe.dokumente} docxErlaubt={docxErlaubt}
          startDokId="gv-beschluss" bannerEntwurf={BANNER_ENTWURF}
          bannerFertig={BANNER_FERTIG} />
      </MappenAbschnitt>
    </MappenSeite>
  );
}
