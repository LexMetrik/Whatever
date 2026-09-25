import { NormText } from '../components/NormText';
import {
  PV_DEFAULTS, PV_DEFAULT_MASSNAHMEN, PV_MASSNAHMEN, PV_SITUATIONEN,
  pvZusammenstellen, pruefePvGates, zielDefaults,
  type PvAntworten, type PvEntscheid, type PvZiel, type PvSituationId,
} from '../lib/vorlagen/patientenverfuegung';
import { BANNER_UNTERSCHREIBEN } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, inputCls } from '../components/vorlagen/ui';
import { SelectionGrid, type SelectionItem } from '../components/ui/SelectionGrid';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Vorlagen-Wizard: Patientenverfügung (Art. 370–373 ZGB) ─────────────────
// Form: schriftlich, datiert, eigenhändig unterschrieben (Art. 371 Abs. 1) —
// PC-Erstellung zulässig, Datum/Unterschrift HANDSCHRIFTLICH nach dem Druck.
// Kein Mindestalter (Urteilsfähigkeit genügt). Konsistenz-Engine R1/R2,
// Sterbehilfe-Block R6. Eingaben bleiben im Browser (localStorage).
// Seit W2·29-WERKBANK-VORLAGEN V2d auf `VorlagenSeite`; die Eingabe-Schritte
// sind eine Komponente, weil sie usePaneKlasse brauchen (s. VorlagenSeite.tsx).

const SPEICHER_KEY = 'lexmetrik.vorlage.patientenverfuegung.v1';

const SCHRITTE = [
  { id: 'person', label: 'Person' },
  { id: 'werte', label: 'Werte' },
  { id: 'situationen', label: 'Situationen & Ziel' },
  { id: 'massnahmen', label: 'Massnahmen' },
  { id: 'vertretung', label: 'Vertretung' },
  { id: 'wuensche', label: 'Weitere Wünsche' },
  { id: 'pruefen', label: 'Prüfen & Unterschreiben' },
] as const;

// D-3 (31.8.2026): die Reihe läuft über `ui/SelectionGrid` (variant «pille»).
// Der `ton` hält die BEDEUTUNGS-Farbe der Entscheide fest — sie sagt auf einen
// Blick, was verfügt wurde, und ist darum kein blosses Auswahl-Signal
// (Herleitung im Baustein). «keine Angabe» trägt keinen Ton und zeigt seither
// das Kanon-Signal statt der früheren invertierten ink-900-Füllung.
const ENTSCHEIDE: SelectionItem<PvEntscheid>[] = [
  { code: 'keine_angabe', label: 'keine Angabe' },
  { code: 'zustimmen', label: 'zustimmen', ton: 'zustimmung' },
  { code: 'ablehnen', label: 'ablehnen', ton: 'ablehnung' },
  { code: 'nur_befristet', label: 'nur befristet', ton: 'vorbehalt' },
];

const ZIELE: { code: Exclude<PvZiel, 'keine_angabe'>; label: string; sub: string }[] = [
  { code: 'maximal', label: 'Maximale Lebenserhaltung', sub: 'alle indizierten Massnahmen' },
  { code: 'befristet_reevaluation', label: 'Befristet mit Reevaluation', sub: 'beginnen, Nutzen regelmässig prüfen' },
  { code: 'palliativ', label: 'Leidenslinderung (Palliation)', sub: 'Verzicht auf Lebensverlängerung' },
];

type PvZ = { ergebnis: ReturnType<typeof pvZusammenstellen> };

function EingabeSchritt({ ctx: { a, set, setA }, schritt }: { ctx: SeiteCtx<PvAntworten, PvZ>; schritt: number }) {
  const pk = usePaneKlasse();

  const toggleSituation = (id: PvSituationId) =>
    set('situationen', a.situationen.includes(id) ? a.situationen.filter((s) => s !== id) : [...a.situationen, id]);

  // RULE R1: Zielwahl setzt Defaults nur für noch offene Massnahmen
  const waehleZiel = (z: Exclude<PvZiel, 'keine_angabe'>) =>
    setA((alt) => ({ ...alt, ziel: z, massnahmen: zielDefaults(z, alt.massnahmen) }));

  switch (SCHRITTE[schritt].id) {
    case 'person': return (
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Vorname"><input className={inputCls} value={a.vorname} onChange={(e) => set('vorname', e.target.value)} /></Field>
        <Field label="Nachname"><input className={inputCls} value={a.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Geburtsdatum" hint="Kein Mindestalter – massgebend ist die Urteilsfähigkeit (Art. 16 ZGB)">
          <DatumsFeld value={a.geburtsdatum} onChange={(v) => set('geburtsdatum', v)} className={inputCls} />
        </Field>
        <Field label="Wohnort">
          <input className={inputCls} value={a.wohnort} onChange={(e) => set('wohnort', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="AHV-/Versichertennummer" optional hint="erleichtert die Zuordnung (Versichertenkarte, Art. 371 Abs. 2 ZGB)">
          <input className={inputCls} value={a.versichertenNr ?? ''} onChange={(e) => set('versichertenNr', e.target.value)} placeholder="756.____.____.__" />
        </Field>
      </div>
    );

    case 'werte': return (
      <div className="space-y-4">
        <p className="text-body-s text-ink-600">
          Eine kurze Werteerklärung hilft Ärzteschaft und Vertretungsperson, Ihre Verfügung in
          nicht geregelten Situationen auszulegen. Alle Felder sind optional.
        </p>
        <Field label="Meine Einstellung zu Leben und Sterben" optional>
          <textarea className={inputCls} rows={3} value={a.einstellungLeben ?? ''}
            onChange={(e) => set('einstellungLeben', e.target.value)}
            placeholder="z. B. Was Lebensqualität für mich bedeutet …" />
        </Field>
        <Field label="Was ich besonders fürchte" optional>
          <textarea className={inputCls} rows={2} value={a.aengste ?? ''}
            onChange={(e) => set('aengste', e.target.value)}
            placeholder="z. B. langes Leiden, Abhängigkeit von Maschinen …" />
        </Field>
        <Field label="Religiöse / spirituelle Haltung" optional>
          <textarea className={inputCls} rows={2} value={a.religioesSpirituell ?? ''}
            onChange={(e) => set('religioesSpirituell', e.target.value)} />
        </Field>
      </div>
    );

    case 'situationen': return (
      <div className="space-y-5">
        <div className="space-y-2">
          <GruppenTitel>Anwendungssituationen</GruppenTitel>
          {PV_SITUATIONEN.map((s) => (
            <Checkbox
              checked={a.situationen.includes(s.id)}
              onChange={() => toggleSituation(s.id)}
              label={<>{s.label}</>} />
          ))}
          <Checkbox
            checked={a.psychischeStoerungKontext ?? false}
            onChange={(v) => set('psychischeStoerungKontext', v)}
            label={<><span>Behandlung einer psychischen Störung in einer Klinik ist für mich relevant
                <span className="text-ink-500"> (Hinweis zur abgeschwächten Verbindlichkeit, Art. 380/433 ZGB)</span></span></>}
            className='pt-1' />
        </div>
        <div className="space-y-2">
          <GruppenTitel>Behandlungsziel</GruppenTitel>
          <p className="text-xs text-ink-500">Die Zielwahl setzt sinnvolle Vorgaben für noch offene Massnahmen (überschreibbar) – Widersprüche werden geprüft, nie still aufgelöst.</p>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={ZIELE.map((z) => ({ code: z.code, label: z.label, sub: z.sub }))}
            value={a.ziel}
            onSelect={waehleZiel}
          />
        </div>
      </div>
    );

    case 'massnahmen': return (
      <div className="space-y-3">
        <p className="text-body-s text-ink-600">
          Entscheiden Sie je Massnahme – «keine Angabe» überlässt den Entscheid Vertretungsperson
          und Ärzteschaft (mutmasslicher Wille, Art. 378 Abs. 3 ZGB). Schmerz- und Symptomlinderung
          ist immer eingeschlossen.
        </p>
        {PV_MASSNAHMEN.map((m) => (
          <div key={m.id} className="lc-card p-3.5 space-y-2">
            <p className="text-body-s font-medium text-ink-900">{m.label}</p>
            <SelectionGrid
              variant="pille"
              gruppenLabel={m.label}
              className="flex flex-wrap gap-1.5"
              items={ENTSCHEIDE}
              value={a.massnahmen[m.id] ?? ''}
              onSelect={(code) => set('massnahmen', { ...a.massnahmen, [m.id]: code })}
            />
          </div>
        ))}
      </div>
    );

    case 'vertretung': return (
      <div className="space-y-4">
        <p className="text-body-s text-ink-600">
          Die Vertretungsperson bespricht die Behandlung mit der Ärzteschaft und entscheidet in
          Ihrem Namen, wo die Verfügung keine Antwort gibt (Art. 370 Abs. 2 ZGB). Ohne Bezeichnung
          gilt die gesetzliche Kaskade (Art. 378 ZGB).
        </p>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Vertretungsperson" optional>
            <input className={inputCls} value={a.vertretungName ?? ''} onChange={(e) => set('vertretungName', e.target.value)} placeholder="Vorname Nachname" />
          </Field>
          <Field label="Kontakt (Telefon/Adresse)" optional>
            <input className={inputCls} value={a.vertretungKontakt ?? ''} onChange={(e) => set('vertretungKontakt', e.target.value)} />
          </Field>
        </div>
        {a.vertretungName?.trim() && (
          <>
            <Field label="Weisungen an die Vertretungsperson" optional>
              <textarea className={inputCls} rows={2} value={a.vertretungWeisungen ?? ''}
                onChange={(e) => set('vertretungWeisungen', e.target.value)} />
            </Field>
            <Field label="Ersatzperson" optional hint="falls die Vertretungsperson ungeeignet ist, ablehnt oder kündigt (Art. 370 Abs. 3 ZGB)">
              <input className={inputCls} value={a.ersatzName ?? ''} onChange={(e) => set('ersatzName', e.target.value)} />
            </Field>
            <p className="text-xs text-ink-500">Die Entbindung von der Schweigepflicht gegenüber der Vertretungsperson wird automatisch aufgenommen.</p>
          </>
        )}
      </div>
    );

    case 'wuensche': return (
      <div className="space-y-4">
        <Field label="Sterbeort, Begleitung, Seelsorge" optional>
          <textarea className={inputCls} rows={2} value={a.sterbeortBegleitung ?? ''}
            onChange={(e) => set('sterbeortBegleitung', e.target.value)}
            placeholder="z. B. Wenn möglich möchte ich zu Hause sterben …" />
        </Field>
        <div className="space-y-2">
          <GruppenTitel>Organspende</GruppenTitel>
          {/* D-3: Pillen-Reihe über den geteilten Baustein. Anders als bei den
              Massnahmen trägt hier keine Antwort einen semantischen Ton — die
              Auswahl zeigt das Kanon-Signal. */}
          <SelectionGrid
            variant="pille"
            gruppenLabel="Organspende"
            className="flex flex-wrap gap-1.5"
            items={[
              { code: 'keine_angabe', label: 'keine Angabe' },
              { code: 'ja', label: 'Ich stimme zu' },
              { code: 'nein', label: 'Ich lehne ab' },
            ] as const}
            value={a.organspende ?? ''}
            onSelect={(code) => set('organspende', code)}
          />
          {a.organspende === 'ja' && (
            <Checkbox
              checked={a.organspendeVorbereitend ?? false}
              onChange={(v) => set('organspendeVorbereitend', v)}
              label={<>Einschliesslich vorbereitender medizinischer Massnahmen (z. B. Aufrechterhaltung der Organdurchblutung)
                              </>} />
          )}
        </div>
        <Checkbox
          checked={a.ersetztFruehere}
          onChange={(v) => set('ersetztFruehere', v)}
          label={<><span>Frühere Patientenverfügungen ersetzen <span className="text-ink-500"><NormText text={`(empfohlen, Art. 371 Abs. 3 ZGB)`} /></span></span></>} />
        <Field label="Ort (für die Schlusszeile)" optional>
          <input className={inputCls + ' sm:max-w-xs'} value={a.ort ?? ''} onChange={(e) => set('ort', e.target.value)} placeholder="z. B. Basel" />
        </Field>
      </div>
    );
  }
}

function fehlerEingabe(a: PvAntworten, i: number): string[] {
  const f: string[] = [];
  if (i === 0) {
    if (!a.vorname.trim() || !a.name.trim()) f.push('Vor- und Nachname angeben.');
    if (!a.geburtsdatum) f.push('Geburtsdatum angeben.');
    if (!a.wohnort.trim()) f.push('Wohnort angeben.');
  }
  return f;
}

// bestaetigt = GATE_1: Urteilsfähigkeit + Form verstanden
const CONFIG: VorlagenSeitenConfig<PvAntworten, PvZ> = {
  cardId: 'patientenverfuegung',
  musterdaten: MUSTER.patientenverfuegung,
  defaults: PV_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  normalisieren: (g) => ({
    ...g,
    situationen: Array.isArray(g.situationen) ? g.situationen : [],
    massnahmen: { ...PV_DEFAULT_MASSNAHMEN, ...(g.massnahmen ?? {}) },
  }),
  // Ist-Zustand vor dem Umzug (§6): kein Profil-Prefill.
  profilPrefill: false,
  zusammenstellen: (a) => ({ ergebnis: pvZusammenstellen(a) }),
  pruefeGates: (a) => pruefePvGates(a),
  schritte: SCHRITTE,
  overlineFallback: 'Vorsorge & Erwachsenenschutz',
  titel: 'Patientenverfügung',
  intro: 'Legen Sie fest, welchen medizinischen Massnahmen Sie im Fall Ihrer Urteilsunfähigkeit zustimmen – aus festen, strukturierten Bausteinen, ohne Sprachmodell. Widersprüche zwischen Therapieziel und Massnahmen werden geprüft, nie still aufgelöst.',
  badge: 'Handschriftlich datieren & unterschreiben',
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: der Ort steht im Schritt «Weitere Wünsche»,
  // das Datum wird von Hand gesetzt; der letzte Schritt kennt keine
  // Pflichtfeld-Fehler; jeder Blocker steht in einer eigenen Box (§6).
  ortDatumImPruefen: false,
  blockerImLetztenSchritt: false,
  blockerEinzeln: 'Nicht zulässig – vor der Ausgabe zu beheben',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Form-Gate – damit Ihre Patientenverfügung gültig wird</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Ausdrucken genügt:</strong><NormText text={` Die Erstellung am Computer ist zulässig – anders als beim Testament ist keine Eigenhändigkeit des Textes nötig (Art. 371 Abs. 1 ZGB). Keine Beglaubigung erforderlich.`} /></li>
        <li><strong>Handschriftlich datieren und unterschreiben:</strong> Erst mit von Hand eingesetztem Datum und eigenhändiger Unterschrift ist das Dokument errichtet.</li>
        <li><strong>Auffindbarkeit:</strong><NormText text={` Kopien an Vertretungsperson und Hausarztpraxis; Hinterlegungsort auf der Versichertenkarte eintragen lassen (Art. 371 Abs. 2 ZGB; in der Praxis noch nicht überall zuverlässig); Hinweiskarte im Portemonnaie.`} /></li>
        <li><strong>Aktualisierung:</strong> rechtlich unbefristet gültig; Erneuerung der Unterschrift etwa alle zwei Jahre wird empfohlen.</li>
        <li><strong>Widerruf:</strong><NormText text={` jederzeit – durch Vernichtung, neue Verfügung oder schriftlichen Widerruf (Art. 371 Abs. 3 ZGB).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich errichte diese Verfügung im Vollbesitz meiner Urteilsfähigkeit und nach reiflicher Überlegung (Art. 16 ZGB) – und habe verstanden, dass Datum und Unterschrift von Hand zu leisten sind.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  pruefenFuss: (
    <p className="text-xs text-ink-500">
      Bei Zweifeln an der Urteilsfähigkeit (z. B. beginnende Demenz): ärztliche Bestätigung der
      Urteilsfähigkeit beilegen (Empfehlung der SAMW). Diese Vorlage ist eine Kurzversion in
      Anlehnung an FMH/SAMW; für differenzierte Festlegungen je Situation empfiehlt sich das
      Gespräch mit Ihrer Ärztin/Ihrem Arzt.
    </p>
  ),
  banner: BANNER_UNTERSCHREIBEN,
  dateiBasis: 'Patientenverfuegung-Entwurf',
  pdfLabel: 'Entwurf als PDF',
  docxLabel: 'Entwurf als Word (DOCX)',
};

export function VorlagePatientenverfuegung() {
  return <VorlagenSeite config={CONFIG} />;
}
