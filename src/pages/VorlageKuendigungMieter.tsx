import { NormText } from '../components/NormText';
import {
  KM_DEFAULTS, kmZusammenstellen, pruefeKmGates, type KmAntworten,
} from '../lib/vorlagen/kuendigungMieter';
import { KDG_ZUGANGS_HINWEIS } from '../lib/vorlagen/kuendigungGemeinsam';
import type { Mietobjekt, TerminQuelle } from '../types/mietrecht';
import type { Kanton } from '../types/legal';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, inputCls, NormLink } from '../components/vorlagen/ui';
import { KANTONE } from '../lib/kantone';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Vorlagen-Wizard: Kündigung des Mietverhältnisses durch Mieter:in (2a) ──
// Bauspezifikation: bibliothek/recherche/kuendigungs-masken.md (6.6.2026).
// Engine: lib/mietrecht.ts (LIVE) — Familienwohnung ohne Zustimmung =
// NICHTIG (Art. 266m/266o OR) → harter Export-Blocker. Keine Rechtslogik
// hier (§3); Endtermin/Form-Prüfung kommen aus der Engine.
// Orchestrierung im generischen Rahmen (W2·29-WERKBANK-VORLAGEN V2a). Die
// Eingabe-Schritte sind eine KOMPONENTE (`EingabeSchritt`), weil sie
// usePaneKlasse brauchen — ein Hook direkt in `eingabeInhalt` wechselte die
// Hook-Reihenfolge je Schritt (s. VorlagenSeite.tsx).

const SPEICHER_KEY = 'lexmetrik.vorlage.kuendigung-mieter.v1';

const SCHRITTE = [
  { id: 'objekt', label: 'Parteien & Objekt' },
  { id: 'familienwohnung', label: 'Familienwohnung' },
  { id: 'termin', label: 'Termin & Frist' },
  { id: 'ausserterminlich', label: 'Ausserterminlich?' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_KM: PdfBanner = {
  titel: 'KÜNDIGUNGSSCHREIBEN – ZU UNTERZEICHNEN UND NACHWEISBAR ZUZUSTELLEN',
  text: 'Wohn- und Geschäftsräume: Schriftform (Art. 266l Abs. 1 OR) — Brief unterschreiben; bei der Familienwohnung unterschreiben BEIDE (Art. 266m OR). Frist gewahrt mit ZUGANG bei der Vermieterschaft spätestens am letzten rechtzeitigen Zustelltag.',
};

const OBJEKTE: { code: Mietobjekt; label: string }[] = [
  { code: 'wohnung', label: 'Wohnung (3 Monate, Art. 266c)' },
  { code: 'geschaeftsraum', label: 'Geschäftsraum (6 Monate, Art. 266d)' },
  { code: 'unbewegliche_sache', label: 'Übrige unbewegliche Sache (3 Monate, Art. 266b)' },
  { code: 'moebliertes_zimmer', label: 'Möbliertes Zimmer / Einstellplatz (2 Wochen, Art. 266e)' },
  { code: 'bewegliche_sache', label: 'Bewegliche Sache (3 Tage, Art. 266f)' },
];

type KmZusammenstellung = ReturnType<typeof kmZusammenstellen>;

const brauchtMietbeginn = (a: KmAntworten) => a.terminQuelle === 'gesetzlich' || a.objekt === 'moebliertes_zimmer';

function terminKachel(engine: KmZusammenstellung['engine']) {
  const nichtig = engine?.status === 'nichtig';
  return engine && !nichtig && engine.endtermin && (
    <div className="lc-tile">
      <GruppenTitel>Wirksamer Endtermin</GruppenTitel>
      <p className="text-h2 font-display font-semibold text-ink-900 leading-none num">{engine.endtermin}</p>
      <p className="text-body-s text-ink-600 mt-1.5">
        {engine.verfehlterTermin
          ? `Gewünschter Termin verfehlt — wirkt auf den nächstmöglichen (Art. 266a Abs. 2 OR).`
          : `Spätester rechtzeitiger Zugang für diesen Termin: ${engine.spaetesterZugang ?? '–'}.`}
      </p>
    </div>
  );
}

function EingabeSchritt({ ctx: { a, set, z }, schritt }: { ctx: SeiteCtx<KmAntworten, KmZusammenstellung>; schritt: number }) {
  const pk = usePaneKlasse();
  const engine = z.engine;
  const nichtig = engine?.status === 'nichtig';
  switch (SCHRITTE[schritt].id) {
    case 'objekt': return (
      <div className="space-y-4">
        <Field label="Ihr Name (kündigende Mieterin / kündigender Mieter)">
          <input className={inputCls} value={a.absenderName} onChange={(e) => set('absenderName', e.target.value)} placeholder="Vorname Name" />
        </Field>
        <Field label="Ihre Adresse">
          <input className={inputCls} value={a.absenderAdresse} onChange={(e) => set('absenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Weitere Mieter:innen" optional hint="unterschreiben mit (ein Name pro Zeile)">
          <textarea className={inputCls + ' min-h-[3.5rem]'} value={a.mitmieter.join('\n')}
            onChange={(e) => set('mitmieter', e.target.value.split('\n'))} placeholder="Vorname Name" />
        </Field>
        <Field label="Vermieterschaft / Verwaltung">
          <input className={inputCls} value={a.adressatName} onChange={(e) => set('adressatName', e.target.value)} placeholder="Name / Firma" />
        </Field>
        <Field label="Adresse der Vermieterschaft">
          <input className={inputCls} value={a.adressatAdresse} onChange={(e) => set('adressatAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Mietobjekt (Adresse, ggf. Wohnungs-Nr.)">
          <input className={inputCls} value={a.mietobjektAdresse} onChange={(e) => set('mietobjektAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort, 3. OG links" />
        </Field>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Objektart" hint="bestimmt die gesetzliche Mindestfrist">
            <select className={inputCls} value={a.objekt} onChange={(e) => set('objekt', e.target.value as Mietobjekt)}>
              {OBJEKTE.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Kanton des Mietobjekts">
            <select className={inputCls + ' sm:max-w-[9rem]'} value={a.kanton} onChange={(e) => set('kanton', e.target.value as Kanton | '')}>
              <option value="">– wählen –</option>
              {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
        </div>
      </div>
    );

    case 'familienwohnung': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.familienwohnung}
          onChange={(v) => set('familienwohnung', v)}
          label={<><span>Die Mietsache dient als <strong>Wohnung der Familie</strong>
              <span className="text-ink-500"><NormText text={` (verheiratet oder in eingetragener Partnerschaft, gemeinsame Wohnung — Art. 266m OR)`} /></span></span></>} />
        {a.familienwohnung && (
          <div className="space-y-3">
            <Checkbox
              checked={a.zustimmungEhegatte}
              onChange={(v) => set('zustimmungEhegatte', v)}
              label={<><span>Die <strong>ausdrückliche Zustimmung</strong> des Ehegatten / der eingetragenen Partnerin bzw. des Partners liegt vor
                  <span className="text-danger-700"> — ohne sie wäre die Kündigung NICHTIG (Art. 266m/266o OR)</span></span></>} />
            <Field label="Name der zustimmenden Person" hint="unterschreibt das Schreiben mit (zweite Unterschriftslinie)">
              <input className={inputCls} value={a.ehegatteName} onChange={(e) => set('ehegatteName', e.target.value)} placeholder="Vorname Name" />
            </Field>
            {nichtig && (
              <div role="alert" className="lc-notice-danger">
                <p className="text-body-s text-danger-700 font-medium">
                  Ohne Zustimmung ist die Kündigung nichtig — der Export bleibt gesperrt, bis die Zustimmung bestätigt ist.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );

    case 'termin': return (
      <div className="space-y-4">
        <Field label="Erwarteter Zugang der Kündigung" hint="Stichtag — nicht das Absendedatum">
          <DatumsFeld value={a.zugang} onChange={(v) => set('zugang', v)} className={inputCls} />
        </Field>
        <Field label="Kündigungstermine" hint="Hierarchie: Vertrag → Ortsgebrauch → gesetzliche Auffangregel">
          <select className={inputCls} value={a.terminQuelle} onChange={(e) => set('terminQuelle', e.target.value as TerminQuelle)}>
            <option value="ortsueblich">Ortsüblicher Termin (kantonale Übung)</option>
            <option value="vertraglich_monate">Vertraglich bestimmte Monatsenden</option>
            <option value="jedes_monatsende">Vertraglich «auf jedes Monatsende»</option>
            <option value="gesetzlich">Gesetzliche Auffangregel (ab Mietbeginn)</option>
          </select>
        </Field>
        {a.terminQuelle === 'vertraglich_monate' && (
          <Field label="Vereinbarte Monatsenden">
            <div className={pk('grid grid-cols-3 sm:grid-cols-4 gap-1.5', 'grid grid-cols-3 @3xl/pane:grid-cols-4 gap-1.5')}>
              {Array.from({ length: 12 }, (_, m) => m + 1).map((m) => (
                <label key={m} className="flex items-center gap-1.5 text-body-s cursor-pointer text-ink-700">
                  <input type="checkbox" checked={a.vertragsTermineMonate.includes(m)}
                    onChange={(e) => set('vertragsTermineMonate', e.target.checked
                      ? [...a.vertragsTermineMonate, m].sort((x, y) => x - y)
                      : a.vertragsTermineMonate.filter((x) => x !== m))} />
                  {['Jan.', 'Feb.', 'März', 'April', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'][m - 1]}
                </label>
              ))}
            </div>
          </Field>
        )}
        {a.terminQuelle === 'jedes_monatsende' && (
          <Checkbox
            checked={a.dezemberAusgeschlossen}
            onChange={(v) => set('dezemberAusgeschlossen', v)}
            label={<><span>«… ausser auf den 31. Dezember» vereinbart</span></>} />
        )}
        {brauchtMietbeginn(a) && (
          <Field label="Mietbeginn" hint={a.objekt === 'moebliertes_zimmer' ? 'Art. 266e: Ende einer einmonatigen Mietdauer' : 'für die gesetzliche Termin-Regel'}>
            <DatumsFeld value={a.mietbeginn} onChange={(v) => set('mietbeginn', v)} className={inputCls} />
          </Field>
        )}
        <Field label="Vertraglich vereinbarte Frist (Monate)" optional hint="länger als das Gesetz zulässig; kürzer → gesetzliches Minimum">
          <input type="number" min={0} className={inputCls + ' num sm:max-w-[9rem]'} value={a.vereinbarteFristMonate ?? ''}
            onChange={(e) => set('vereinbarteFristMonate', e.target.value === '' ? null : Number(e.target.value))} placeholder="leer = gesetzlich" />
        </Field>
        {terminKachel(engine)}
        <div className="lc-notice text-body-s">{KDG_ZUGANGS_HINWEIS}</div>
      </div>
    );

    case 'ausserterminlich': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.ausserterminlich}
          onChange={(v) => set('ausserterminlich', v)}
          label={<><span>Ich gebe die Mietsache <strong>vorzeitig</strong> zurück und schlage eine:n Nachmieter:in vor
              <span className="text-ink-500"><NormText text={` (Art. 264 OR — Befreiung nur bei zumutbarem, zahlungsfähigem Ersatz zu gleichen Bedingungen)`} /></span></span></>} />
        {a.ausserterminlich && (
          <div className="space-y-3">
            <Field label="Nachmieter:in (Name)">
              <input className={inputCls} value={a.nachmieterName} onChange={(e) => set('nachmieterName', e.target.value)} placeholder="Vorname Name" />
            </Field>
            <Checkbox
              checked={a.nachmieterZahlungsfaehig}
              onChange={(v) => set('nachmieterZahlungsfaehig', v)}
              label={<><span>Zahlungsfähigkeit ist belegbar (Betreibungsauszug, Lohnnachweis)</span></>} />
            <Checkbox
              checked={a.uebernahmeGleicheBedingungen}
              onChange={(v) => set('uebernahmeGleicheBedingungen', v)}
              label={<><span>Übernahme zu den GLEICHEN Vertragsbedingungen ist zugesichert</span></>} />
          </div>
        )}
        <Field label="Gewünschtes Rückgabedatum" optional hint="für die Übergabe-Bitte im Schreiben">
          <DatumsFeld value={a.rueckgabeWunschdatum} onChange={(v) => set('rueckgabeWunschdatum', v)} className={inputCls} />
        </Field>
      </div>
    );
    default: return null;
  }
}

function fehlerEingabe(a: KmAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.absenderName.trim()) f.push('Eigenen Namen angeben.');
    if (!a.absenderAdresse.trim()) f.push('Eigene Adresse angeben.');
    if (!a.adressatName.trim()) f.push('Vermieterschaft/Verwaltung angeben.');
    if (!a.adressatAdresse.trim()) f.push('Adresse der Vermieterschaft angeben.');
    if (!a.mietobjektAdresse.trim()) f.push('Adresse des Mietobjekts angeben.');
    if (a.kanton === '') f.push('Kanton des Mietobjekts wählen (ortsübliche Termine, Feiertage).');
  }
  if (schritt === 1 && a.familienwohnung) {
    if (!a.ehegatteName.trim()) f.push('Name des Ehegatten / der eingetragenen Partnerin bzw. des Partners angeben (unterschreibt mit).');
  }
  if (schritt === 2) {
    if (!istIsoDatum(a.zugang)) f.push('Erwarteten Zugang der Kündigung angeben.');
    if (brauchtMietbeginn(a) && !istIsoDatum(a.mietbeginn)) f.push('Mietbeginn angeben (für die gesetzliche Termin-Regel).');
    if (a.terminQuelle === 'vertraglich_monate' && a.vertragsTermineMonate.length === 0) f.push('Mindestens einen vertraglichen Kündigungstermin (Monat) wählen.');
  }
  if (schritt === 3 && a.ausserterminlich) {
    if (!a.nachmieterName.trim()) f.push('Nachmieter:in angeben (Art. 264 OR) — oder den ausserterminlichen Pfad abwählen.');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<KmAntworten, KmZusammenstellung> = {
  cardId: 'kuendigung-mieter',
  musterdaten: MUSTER['kuendigung-mieter'],
  defaults: KM_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  // Array-Hydration absichern (Wizard-Konvention; vgl. Bug-Check A zu 1b).
  normalisieren: (g) => ({
    ...g,
    mitmieter: Array.isArray(g.mitmieter) ? g.mitmieter : [],
    vertragsTermineMonate: Array.isArray(g.vertragsTermineMonate) ? g.vertragsTermineMonate : [],
  }),
  // Ist-Zustand vor dem Umzug: kein Profil-Prefill (§6).
  profilPrefill: false,
  zusammenstellen: kmZusammenstellen,
  pruefeGates: (a, z) => pruefeKmGates(a, z.engine),
  schritte: SCHRITTE,
  overlineFallback: 'Miete',
  titel: 'Kündigung durch Mieter:in',
  intro: 'Stellt das Kündigungsschreiben aus festen Bausteinen zusammen und berechnet den wirksamen Endtermin live (Termin-Hierarchie Vertrag → Ortsgebrauch → Gesetz, Art. 266a–f OR). Familienwohnung ohne Zustimmung wird blockiert (Art. 266m/266o); ausserterminliche Rückgabe mit Nachmieter-Vorschlag nach Art. 264. Ohne Sprachmodell: gleiche Eingaben, gleiches Dokument.',
  badge: 'Zu unterzeichnen',
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: die Blocker stehen im eigenen «Export
  // gesperrt»-Kasten und sperren den Export, nicht die Fehlerbox (§6).
  blockerImLetztenSchritt: false,
  blockerKasten: true,
  pruefenZusatz: ({ z }) => terminKachel(z.engine),
  ortDatumLabel: 'Ort und Datum der Erklärung',
  ortPlaceholder: 'z. B. Basel',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum der Erklärung angeben.',
  bestaetigung: ({ a }) => (
    <>
      <p className="lc-overline text-brass-700">Damit die Kündigung trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Schriftform</strong> (<NormLink artikel="Art. 266l OR" />): Brief eigenhändig unterschreiben — alle Mieter:innen{a.familienwohnung ? ', bei der Familienwohnung zusätzlich die zustimmende Person' : ''}.</li>
        <li><strong>Zugang entscheidet</strong> — eingeschrieben und zusätzlich per A-Post; spätester rechtzeitiger Zustelltag beachten (siehe Endtermin-Kachel).</li>
        <li><strong>Ortsübliche Termine sind eine Tatfrage</strong> des konkreten Ortes — im Zweifel den Mietvertrag und die örtliche Übung prüfen.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Endtermin und Form-Prüfung beruhen auf meinen Eingaben (Objektart, Termine, Familienwohnung) — Vertrag und örtliche Übung gehen vor.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_KM,
  dateiBasis: 'Kuendigung-Mietverhaeltnis',
  pdfLabel: 'Kündigung als PDF',
  docxLabel: 'Kündigung als Word (DOCX)',
};

export function VorlageKuendigungMieter() {
  return <VorlagenSeite config={CONFIG} />;
}
