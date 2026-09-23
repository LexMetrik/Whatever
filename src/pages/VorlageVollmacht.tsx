import { NormText } from '../components/NormText';
import { Link } from 'react-router-dom';
import {
  VOLLMACHT_DEFAULTS, VOLLMACHT_TYPEN, VOLLMACHT_TITEL, VM_BEREICHE, VM_ERMAECHTIGUNGEN,
  vollmachtZusammenstellen, pruefeVollmachtGates,
  type VollmachtAntworten, type VmBereich, type VmErmaechtigung,
  type VmGeberTyp, type VmSubstitution, type VmVertretung,
} from '../lib/vorlagen/vollmacht';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, inputCls, ListenEditor } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';

// ─── Vorlagen-Wizard: Vollmacht (Art. 32 ff. OR) ────────────────────────────
// EINE Maske mit Typ-Schalter (Anwalts-/General-/Spezialvollmacht). Einfache
// Schriftform genügt (Art. 11 OR) → druckfertiges Dokument; deterministische
// Form-Gates: Bürgschaft (Sperre), Grundstück (Warnung), Bank (eigene
// Formulare), Vorsorgefall (Weiche zum Vorsorgeauftrag).
// Seit W2·29-WERKBANK-VORLAGEN V2d auf `VorlagenSeite`.

const SPEICHER_KEY = 'lexmetrik.vorlage.vollmacht.v1';

const SCHRITTE = [
  { id: 'typ', label: 'Vollmachtstyp' },
  { id: 'geber', label: 'Vollmachtgeber/in' },
  { id: 'bevollmaechtigte', label: 'Bevollmächtigte' },
  { id: 'umfang', label: 'Umfang' },
  { id: 'befugnisse', label: 'Besondere Ermächtigungen' },
  { id: 'dauer', label: 'Dauer & Abschluss' },
  { id: 'pruefen', label: 'Prüfen & Ausgabe' },
] as const;

const BANNER_VOLLMACHT: PdfBanner = {
  titel: 'NACH DEM AUSDRUCK DATIEREN UND UNTERSCHREIBEN',
  text:
    'Die Vollmacht ist grundsätzlich formfrei (Art. 11 OR) – gültig wird die Urkunde als Ausweis ' +
    'gegenüber Dritten mit der Unterschrift der vollmachtgebenden Person. Für Grundbuch-, ' +
    'Handelsregister- oder Bankgebrauch die Unterschrift beglaubigen lassen (Usanz).',
};

type VmZ = { ergebnis: ReturnType<typeof vollmachtZusammenstellen> };

function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<VollmachtAntworten, VmZ>; schritt: number }) {
  const istAnwalt = a.typ === 'anwalt';
  const istSpezial = a.typ === 'spezial';
  const natuerlich = a.geberTyp === 'natuerlich';

  const toggleBereich = (b: VmBereich) =>
    set('bereiche', a.bereiche.includes(b) ? a.bereiche.filter((x) => x !== b) : [...a.bereiche, b]);
  const toggleErmaechtigung = (e: VmErmaechtigung) =>
    set('ermaechtigungen', a.ermaechtigungen.includes(e) ? a.ermaechtigungen.filter((x) => x !== e) : [...a.ermaechtigungen, e]);

  switch (SCHRITTE[schritt].id) {
    case 'typ': return (
      <div className="space-y-4">
        <SelectionGrid
          className="grid grid-cols-1 gap-2"
          items={VOLLMACHT_TYPEN.map((t) => ({ code: t.id, label: t.label, sub: t.sub }))}
          value={a.typ}
          onSelect={(code) => set('typ', code)}
        />
        <p className="lc-notice text-body-s">
          Für die Vorsorge bei <strong>Urteilsunfähigkeit</strong> (Personensorge, Vermögenssorge im
          Vorsorgefall) ist nicht die Vollmacht, sondern der{' '}
          <Link to="/vorlagen/vorsorgeauftrag" className="text-brass-700 hover:underline">Vorsorgeauftrag (Art. 360 ff. ZGB)</Link>{' '}
          das gesetzlich vorgesehene Instrument; für medizinische Behandlungswünsche die{' '}
          <Link to="/vorlagen/patientenverfuegung" className="text-brass-700 hover:underline">Patientenverfügung</Link>.
        </p>
      </div>
    );

    case 'geber': return (
      <div className="space-y-4">
        <SelectionGrid
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          items={([
            ['natuerlich', 'Natürliche Person', 'Name, Geburtsdatum, Adresse'],
            ['juristisch', 'Juristische Person', 'Firma, Sitz, Vertretungsorgan'],
          ] as [VmGeberTyp, string, string][]).map(([code, label, sub]) => ({ code, label, sub }))}
          value={a.geberTyp}
          onSelect={(code) => set('geberTyp', code)}
        />
        {natuerlich ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vorname"><input className={inputCls} value={a.vorname} onChange={(e) => set('vorname', e.target.value)} /></Field>
            <Field label="Nachname"><input className={inputCls} value={a.nachname} onChange={(e) => set('nachname', e.target.value)} /></Field>
            <Field label="Geburtsdatum" optional hint="erleichtert die eindeutige Identifikation">
              <DatumsFeld value={a.geburtsdatum} onChange={(v) => set('geburtsdatum', v)} className={inputCls} />
            </Field>
            <Field label="Adresse"><input className={inputCls} value={a.adresse} onChange={(e) => set('adresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" /></Field>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Firma (gemäss Handelsregister)"><input className={inputCls} value={a.firma} onChange={(e) => set('firma', e.target.value)} /></Field>
            <Field label="Sitz"><input className={inputCls} value={a.sitz} onChange={(e) => set('sitz', e.target.value)} placeholder="PLZ Ort" /></Field>
            <div className="sm:col-span-2">
              <Field label="Vertreten durch" hint="zeichnungsberechtigte Person(en) gemäss Handelsregister">
                <input className={inputCls} value={a.vertretenDurch} onChange={(e) => set('vertretenDurch', e.target.value)} />
              </Field>
            </div>
          </div>
        )}
      </div>
    );

    case 'bevollmaechtigte': return (
      <div className="space-y-5">
        <div className="space-y-3">
          <GruppenTitel>Bevollmächtigte Person(en)</GruppenTitel>
          {/* R2-F/F1-9: Behälter war `lc-card p-4`, der Knopf ein nacktes
              `lc-btn-outline` mit «+ … hinzufügen» — beides kommt neu aus
              dem geteilten ListenEditor. */}
          <ListenEditor
            element="Bevollmächtigte Person"
            eintraege={a.bevollmaechtigte}
            onHinzufuegen={() => set('bevollmaechtigte', [...a.bevollmaechtigte, { name: '', angaben: '' }])}
            onEntfernen={(i) => set('bevollmaechtigte', a.bevollmaechtigte.filter((_, j) => j !== i))}
            kinder={(b, i) => (
              <div className="space-y-3">
                <Field label={istAnwalt ? 'Name (Anwältin/Anwalt bzw. Kanzlei)' : 'Name'}>
                  <input className={inputCls} value={b.name}
                    onChange={(e) => set('bevollmaechtigte', a.bevollmaechtigte.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                </Field>
                <Field label="Geburtsdatum / Adresse" optional hint="genaue Angaben erleichtern den Ausweis gegenüber Dritten (Art. 33 Abs. 3 OR)">
                  <input className={inputCls} value={b.angaben}
                    onChange={(e) => set('bevollmaechtigte', a.bevollmaechtigte.map((x, j) => j === i ? { ...x, angaben: e.target.value } : x))} />
                </Field>
              </div>
            )}
          />
        </div>

        {a.bevollmaechtigte.filter((b) => b.name.trim()).length > 1 && (
          <div className="space-y-2">
            <GruppenTitel><NormText text={`Mehrere Bevollmächtigte (Art. 33 Abs. 2 OR)`} /></GruppenTitel>
            <SelectionGrid
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              items={([
                ['einzeln', 'Je einzeln', 'Jede Person kann allein handeln (Usanz)'],
                ['gemeinsam', 'Nur gemeinsam', 'Kollektivvollmacht – alle müssen zusammenwirken'],
              ] as [VmVertretung, string, string][]).map(([code, label, sub]) => ({ code, label, sub }))}
              value={a.vertretung}
              onSelect={(code) => set('vertretung', code)}
            />
          </div>
        )}

        <div className="space-y-2">
          <GruppenTitel>Substitution (Untervollmacht)</GruppenTitel>
          <SelectionGrid
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            items={([
              ['verboten', 'Ausgeschlossen', 'Persönliche Besorgung (Art. 398 Abs. 3 OR)'],
              ['erlaubt', 'Erlaubt', 'Untervollmacht zulässig (Art. 399 Abs. 2 OR) – in Anwaltsvollmachten üblich'],
            ] as [VmSubstitution, string, string][]).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.substitution}
            onSelect={(code) => set('substitution', code)}
          />
        </div>
      </div>
    );

    case 'umfang': return (
      <div className="space-y-5">
        {istAnwalt && (
          <>
            <Field label="Mandatsgegenstand («in Sachen …»)" optional hint="leer = Ausfüll-Strich im Dokument">
              <input className={inputCls} value={a.mandatsgegenstand} onChange={(e) => set('mandatsgegenstand', e.target.value)}
                placeholder="z. B. Forderung aus Werkvertrag gegen X AG" />
            </Field>
            <div className="space-y-2">
              <GruppenTitel><NormText text={`Besondere Prozessbefugnisse (Art. 396 Abs. 3 OR)`} /></GruppenTitel>
              <Checkbox
                checked={a.prozessbefugnisse}
                onChange={(v) => set('prozessbefugnisse', v)}
                label={<><span>Vergleich abschliessen, Klage anerkennen und zurückziehen <span className="text-ink-500"><NormText text={`(materielle Verfügungshandlungen – ausdrücklich, Art. 241 ZPO)`} /></span></span></>} />
              <Checkbox
                checked={a.geheimnisentbindung}
                onChange={(v) => set('geheimnisentbindung', v)}
                label={<><span>Geheimnisentbindung Dritter (Ärzte, Banken, Versicherungen, Behörden) zur Aktenbeschaffung <span className="text-ink-500">(jederzeit schriftlich widerrufbar)</span></span></>} />
            </div>
          </>
        )}
        {a.typ === 'general' && (
          <div className="space-y-3">
            <p className="text-body-s text-ink-700">
              Die Generalvollmacht ermächtigt zur Vertretung in <strong>allen</strong> Rechtshandlungen,
              für die eine Stellvertretung gesetzlich zulässig ist. Die Grenze wird als fester Baustein
              aufgenommen: höchstpersönliche Rechte (Testament, Eheschliessung, Kindesanerkennung) sind
              vertretungsfeindlich (Art. 19c ZGB).
            </p>
            <p className="lc-notice text-body-s">
              Empfehlung: Geschäfte besonderer Tragweite (Grundstücke, Vergleich, Schenkungen) im
              nächsten Schritt <strong>ausdrücklich</strong> ermächtigen – ohne ausdrückliche Nennung
              gelten sie als nicht erteilt (Art. 396 Abs. 3 OR).
            </p>
          </div>
        )}
        {istSpezial && (
          <>
            <Field label="Geschäft / Angelegenheit" optional hint="genaue Bezeichnung, z. B. «Verkauf des Personenwagens VW Golf, Stammnummer …»">
              <textarea className={inputCls} rows={2} value={a.geschaeft} onChange={(e) => set('geschaeft', e.target.value)} />
            </Field>
            <div className="space-y-2">
              <GruppenTitel>Vertretungsbereiche</GruppenTitel>
              {VM_BEREICHE.map((b) => (
                <Checkbox
                  checked={a.bereiche.includes(b.id)}
                  onChange={() => toggleBereich(b.id)}
                  label={<>{b.label}</>} />
              ))}
            </div>
            <p className="lc-notice text-body-s">
              Gesundheits- und Personensorge sind hier bewusst <strong>nicht</strong> wählbar – dafür sind{' '}
              <Link to="/vorlagen/vorsorgeauftrag" className="text-brass-700 hover:underline">Vorsorgeauftrag</Link> und{' '}
              <Link to="/vorlagen/patientenverfuegung" className="text-brass-700 hover:underline">Patientenverfügung</Link> da.
            </p>
          </>
        )}
      </div>
    );

    case 'befugnisse': return (
      <div className="space-y-4">
        <p className="text-body-s text-ink-700">
          Diese Geschäfte verlangen eine <strong>besondere Ermächtigung</strong> – ohne ausdrückliche
          Nennung gelten sie als nicht erteilt (Art. 396 Abs. 3 OR):
        </p>
        <div className="space-y-2">
          {VM_ERMAECHTIGUNGEN.map((e) => (
            <Checkbox
              checked={a.ermaechtigungen.includes(e.id)}
              onChange={() => toggleErmaechtigung(e.id)}
              label={<><span>{e.label}{e.id === 'grundstuecke' && <span className="text-warn-700"> – löst Beurkundungs-/Beglaubigungs-Warnung aus</span>}</span></>} />
          ))}
        </div>
        <div className="space-y-2 pt-2 border-t border-line">
          <Checkbox
            checked={a.buergschaft}
            onChange={(v) => set('buergschaft', v)}
            label={<><span>Eingehung von Bürgschaften <span className="text-danger-700"><NormText text={`(Form-Gate: Art. 493 Abs. 6 OR – sperrt den Export, Notariat erforderlich)`} /></span></span></>} />
          {a.buergschaft && (
            <div role="alert" className="lc-notice-danger">
              <p className="text-body-s text-danger-700">
                Die Bürgschaftsvollmacht bedarf derselben Form wie die Bürgschaft selbst (Art. 493 Abs. 6 OR);
                bei natürlichen Personen über CHF 2000 heisst das öffentliche Beurkundung (Art. 493 Abs. 2 OR).
                Eine einfach-schriftliche Vollmacht genügt nicht – bitte an ein Notariat wenden.
              </p>
            </div>
          )}
        </div>
      </div>
    );

    case 'dauer': return (
      <div className="space-y-4">
        <Field label="Befristet bis" optional hint="leer = unbefristet; die Vollmacht bleibt jederzeit widerruflich (Art. 34 OR)">
          <DatumsFeld value={a.befristetBis} onChange={(v) => set('befristetBis', v)} className={inputCls} />
        </Field>
        <Checkbox
          checked={a.fortgeltungTod}
          onChange={(v) => set('fortgeltungTod', v)}
          label={<><span>Fortgeltung über Tod und Verlust der Handlungsfähigkeit hinaus <span className="text-ink-500"><NormText text={`(Art. 35 Abs. 1 OR, dispositiv)`} /></span></span></>} />
        {a.fortgeltungTod && (
          <p className="lc-notice-warn text-body-s">
            Eine Dauervollmacht deckt den Vorsorgefall nur unvollkommen – Banken und Behörden akzeptieren
            sie bei eingetretener Urteilsunfähigkeit nicht zuverlässig. Für die Vorsorge:{' '}
            <Link to="/vorlagen/vorsorgeauftrag" className="text-brass-700 hover:underline">Vorsorgeauftrag (Art. 360 ff. ZGB)</Link>.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ort" optional><input className={inputCls} value={a.ort} onChange={(e) => set('ort', e.target.value)} placeholder="z. B. Basel" /></Field>
          <Field label="Datum" optional hint="leer = nach dem Ausdruck von Hand datieren">
            <DatumsFeld value={a.datum} onChange={(v) => set('datum', v)} className={inputCls} />
          </Field>
        </div>
      </div>
    );
  }
}

function fehlerEingabe(a: VollmachtAntworten, i: number): string[] {
  const istSpezial = a.typ === 'spezial';
  const natuerlich = a.geberTyp === 'natuerlich';
  const f: string[] = [];
  if (i === 1) {
    if (natuerlich) {
      if (!a.vorname.trim() || !a.nachname.trim()) f.push('Vor- und Nachname angeben.');
      if (!a.adresse.trim()) f.push('Adresse angeben.');
    } else {
      if (!a.firma.trim()) f.push('Firma angeben.');
      if (!a.sitz.trim()) f.push('Sitz angeben.');
      if (!a.vertretenDurch.trim()) f.push('Zeichnungsberechtigte Person angeben (Vertretungsorgan).');
    }
  }
  if (i === 2 && a.bevollmaechtigte.filter((b) => b.name.trim()).length === 0) {
    f.push('Mindestens eine bevollmächtigte Person bezeichnen (Art. 32 Abs. 1 OR).');
  }
  if (i === 3 && istSpezial && !a.geschaeft.trim() && a.bereiche.length === 0) {
    f.push('Geschäft beschreiben oder mindestens einen Vertretungsbereich wählen (Art. 33 Abs. 2 OR).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<VollmachtAntworten, VmZ> = {
  cardId: 'vollmacht',
  defaults: VOLLMACHT_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  // Hydration-Härtung (Review 5.6.2026): alte/korrupte Speicherstände
  // dürfen die Seite nicht crashen (Elementform!) und keine ungültigen
  // Enum-Werte einschleusen (sonst «undefined als PDF»).
  normalisieren: (g) => ({
    ...g,
    typ: VOLLMACHT_TYPEN.some((t) => t.id === g.typ) ? g.typ : 'general',
    geberTyp: g.geberTyp === 'juristisch' ? 'juristisch' : 'natuerlich',
    vertretung: g.vertretung === 'gemeinsam' ? 'gemeinsam' : 'einzeln',
    substitution: g.substitution === 'erlaubt' ? 'erlaubt' : 'verboten',
    bevollmaechtigte: (Array.isArray(g.bevollmaechtigte) ? (g.bevollmaechtigte as unknown[]) : [])
      .filter((b): b is Record<string, unknown> => !!b && typeof b === 'object')
      .map((b) => ({ name: String(b.name ?? ''), angaben: String(b.angaben ?? '') })),
    bereiche: (Array.isArray(g.bereiche) ? g.bereiche : []).filter((x) => VM_BEREICHE.some((vb) => vb.id === x)),
    ermaechtigungen: (Array.isArray(g.ermaechtigungen) ? g.ermaechtigungen : []).filter((x) => VM_ERMAECHTIGUNGEN.some((ve) => ve.id === x)),
  }),
  // Ist-Zustand vor dem Umzug (§6): kein Profil-Prefill.
  profilPrefill: false,
  zusammenstellen: (a) => ({ ergebnis: vollmachtZusammenstellen(a) }),
  pruefeGates: (a) => pruefeVollmachtGates(a),
  schritte: SCHRITTE,
  overlineFallback: 'Vorsorge & Erwachsenenschutz',
  titel: 'Vollmacht',
  intro: 'Anwaltsvollmacht, Generalvollmacht oder Spezialvollmacht – eine Maske mit Typ-Schalter. Feste, juristisch vorformulierte Bausteine (Art. 32 ff. OR), besondere Ermächtigungen nach Art. 396 Abs. 3 OR und deterministische Form-Warnungen. Ohne Sprachmodell.',
  badge: 'Einfache Schriftform – drucken & unterschreiben',
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: Ort/Datum stehen im Schritt «Dauer &
  // Abschluss» (beide optional), der letzte Schritt kennt keine
  // Pflichtfeld-Fehler; jeder Blocker steht in einer eigenen Box (§6).
  ortDatumImPruefen: false,
  blockerImLetztenSchritt: false,
  blockerEinzeln: true,
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Form – damit Ihre Vollmacht wirkt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Unterschreiben:</strong><NormText text={` Die Vollmacht ist formfrei gültig (Art. 11 OR); als Ausweis gegenüber Banken, Behörden und Gerichten dient die `} /><strong>unterzeichnete</strong><NormText text={` schriftliche Fassung (Art. 33 Abs. 3 OR). Nach dem Ausdruck datieren und unterschreiben.`} /></li>
        <li><strong>Beglaubigung (Usanz):</strong> Für Grundbuch-, Handelsregister- oder Bankgebrauch sowie im Auslandsverkehr die Unterschrift beglaubigen lassen (kantonal: Notariat, teilweise Gemeinde).</li>
        <li><strong>Widerruf:</strong><NormText text={` jederzeit möglich (Art. 34 Abs. 1 OR); kundgegebenen Dritten den Widerruf mitteilen (Art. 34 Abs. 3 OR) und die Urkunde zurückverlangen (Art. 36 OR).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Dieses Werkzeug liefert eine Vorlage zum Unterschreiben – formbedürftige Geschäfte (Bürgschaft, Grundstückkauf) und der Vorsorgefall sind gesondert zu regeln.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  pruefenFuss: (
    <p className="text-xs text-ink-500">
      Bei Geschäften besonderer Tragweite (Liegenschaften, Unternehmensanteile, Auslandsbezug):
      notarielle bzw. anwaltliche Beratung beiziehen.
    </p>
  ),
  banner: BANNER_VOLLMACHT,
  dateiBasis: (a) => VOLLMACHT_TITEL[a.typ],
  pdfLabel: (a) => `${VOLLMACHT_TITEL[a.typ]} als PDF`,
  docxLabel: (a) => `${VOLLMACHT_TITEL[a.typ]} als Word (DOCX)`,
};

export function VorlageVollmacht() {
  return <VorlagenSeite config={CONFIG} />;
}
