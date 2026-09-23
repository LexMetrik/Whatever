import { Link } from 'react-router-dom';
import { NormText } from '../components/NormText';
import {
  MA_DEFAULTS, maZusammenstellen, pruefeMaGates, type MaAntworten, type MaVariante,
} from '../lib/vorlagen/mahnung';
import { KDG_ZUGANGS_HINWEIS } from '../lib/vorlagen/kuendigungGemeinsam';
import { zahl } from '../lib/vorlagen/datum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';

// ─── Vorlagen-Wizard: Mahnung & Inverzugsetzung (Art. 102/104/107 OR) ───────
// Bauspezifikation: bibliothek/recherche/or-vertragsvorlagen.md §§3–4.
// EINE Maske mit Varianten-Weiche: Zahlungs-Mahnung (Art. 102 Abs. 1) ↔
// Nachfristansetzung beim zweiseitigen Vertrag (Art. 107). Die Nachfrist-
// «Angemessenheit» ist Wertungsfrage — wird offengelegt, nie berechnet (§2).
// Umgestellt auf generische VorlagenSeite (FUNDAMENT-UMBAU Thema A).

const SPEICHER_KEY = 'lexmetrik.vorlage.mahnung.v1';

const SCHRITTE = [
  { id: 'variante', label: 'Was mahnen Sie an?' },
  { id: 'parteien', label: 'Parteien' },
  { id: 'forderung', label: 'Forderung & Frist' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_MA: PdfBanner = {
  titel: 'MAHNUNG – ZU UNTERZEICHNEN UND NACHWEISBAR ZUZUSTELLEN',
  text: 'Massgebend ist der Zugang beim Empfänger – eingeschriebene Zustellung empfohlen. Die Mahnung ist keine Betreibung.',
};

const VARIANTEN: { code: MaVariante; label: string; sub: string }[] = [
  { code: 'zahlung', label: 'Geldforderung mahnen', sub: 'Zahlungsaufforderung mit Verzugsfolgen (Art. 102 Abs. 1, 104 OR)' },
  { code: 'nachfrist', label: 'Leistung anmahnen + Nachfrist', sub: 'Zweiseitiger Vertrag: Nachfrist mit Wahlrechts-Vorbehalt (Art. 107 OR)' },
];

function eingabeInhalt({ a, set }: SeiteCtx<MaAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'variante': return (
      <div className="space-y-4">
        <SelectionGrid
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          items={VARIANTEN.map((v) => ({ code: v.code, label: v.label, sub: v.sub }))}
          value={a.variante}
          onSelect={(code) => set('variante', code as MaVariante)}
        />
        <div className="lc-notice text-body-s">
          Verzugszins zur gemahnten Forderung beziffern? → <Link to="/rechner/verzugszins" className="text-brass-700 underline">Verzugszins-Rechner</Link>{' '}
          (Zinsbeginn «Mahnung» = Erhalt der Mahnung). · Zahlt die Gegenseite nicht, ist die Betreibung der nächste Schritt
          (Kosten: <Link to="/rechner/betreibungskosten" className="text-brass-700 underline">Betreibungskosten-Rechner</Link>).
        </div>
      </div>
    );

    case 'parteien': return (
      <div className="space-y-4">
        <Field label="Ihr Name">
          <input className={inputCls} value={a.absenderName} onChange={(e) => set('absenderName', e.target.value)} placeholder="Vorname Name / Firma" />
        </Field>
        <Field label="Ihre Adresse">
          <input className={inputCls} value={a.absenderAdresse} onChange={(e) => set('absenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Schuldnerin / Schuldner">
          <input className={inputCls} value={a.adressatName} onChange={(e) => set('adressatName', e.target.value)} placeholder="Firma / Name" />
        </Field>
        <Field label="Adresse der Schuldnerseite">
          <input className={inputCls} value={a.adressatAdresse} onChange={(e) => set('adressatAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'forderung': return a.variante === 'zahlung' ? (
      <div className="space-y-4">
        <Field label="Forderungsbetrag (CHF)">
          <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.betrag} onChange={(v) => set('betrag', v)} placeholder="z. B. 1'250.00" />
        </Field>
        <Field label="Rechtsgrund / Rechnung" hint="erscheint im Betreff und im Forderungs-Satz">
          <input className={inputCls} value={a.rechtsgrund} onChange={(e) => set('rechtsgrund', e.target.value)} placeholder="z. B. Rechnung Nr. 4711 vom 12. Mai 2026" />
        </Field>
        <Field label="Fällig seit" optional>
          <DatumsFeld value={a.faelligSeit} onChange={(v) => set('faelligSeit', v)} className={inputCls} />
        </Field>
        <Checkbox
          checked={a.verfalltagVereinbart}
          onChange={(v) => set('verfalltagVereinbart', v)}
          label={<><span>Es war ein <strong>bestimmter Verfalltag</strong> vereinbart <span className="text-ink-500"><NormText text={`(Verzug trat dann schon mit dessen Ablauf ein, Art. 102 Abs. 2 OR)`} /></span></span></>} />
        {a.verfalltagVereinbart && (
          <Field label="Vereinbarter Verfalltag">
            <DatumsFeld value={a.verfalltag} onChange={(v) => set('verfalltag', v)} className={inputCls} />
          </Field>
        )}
        <Field label="Zahlungsfrist (Tage seit Erhalt)" hint="Praxis-Wahl, keine gesetzliche Vorgabe – üblich sind 10 bis 30 Tage">
          <input className={inputCls + ' sm:max-w-[8rem]'} inputMode="numeric" value={String(a.zahlungsfristTage)}
            onChange={(e) => set('zahlungsfristTage', Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
        </Field>
        <Field label="Zahlungsverbindung (IBAN/Konto)" optional>
          <input className={inputCls} value={a.zahlungsverbindung} onChange={(e) => set('zahlungsverbindung', e.target.value)} placeholder="z. B. IBAN CH00 0000 0000 0000 0000 0" />
        </Field>
        <Checkbox
          checked={a.zinsVertraglich}
          onChange={(v) => set('zinsVertraglich', v)}
          label={<><span>Vertraglich ist ein <strong>höherer Verzugszins</strong> als 5 % vereinbart <span className="text-ink-500"><NormText text={`(Art. 104 Abs. 2 OR)`} /></span></span></>} />
        {a.zinsVertraglich && (
          <Field label="Vertraglicher Verzugszins (% pro Jahr)">
            <input className={inputCls + ' sm:max-w-[8rem]'} inputMode="decimal" value={a.zinssatzProzent} onChange={(e) => set('zinssatzProzent', e.target.value)} placeholder="z. B. 8" />
          </Field>
        )}
        <Checkbox
          checked={a.mahngebuehrErfassen}
          onChange={(v) => set('mahngebuehrErfassen', v)}
          label={<><span>Mahngebühr verrechnen <span className="text-warn-700">(nur mit vertraglicher Grundlage geschuldet)</span></span></>} />
        {a.mahngebuehrErfassen && (
          <div className="space-y-3 pl-6">
            <Field label="Mahngebühr (CHF)">
              <BetragsFeld className={inputCls + ' sm:max-w-[8rem]'} value={a.mahngebuehr} onChange={(v) => set('mahngebuehr', v)} placeholder="z. B. 20.00" />
            </Field>
            <Checkbox
              checked={a.mahngebuehrVertraglich}
              onChange={(v) => set('mahngebuehrVertraglich', v)}
              label={<><span>Die vertragliche Grundlage (AGB/Vertrag) liegt vor – erst dann nimmt der Brief die Gebühr auf</span></>} />
          </div>
        )}
        <Checkbox
          checked={a.betreibungAndrohen}
          onChange={(v) => set('betreibungAndrohen', v)}
          label={<><span>Betreibung nach Fristablauf ankündigen</span></>} />
        <div className="lc-notice text-body-s">{KDG_ZUGANGS_HINWEIS}</div>
      </div>
    ) : (
      <div className="space-y-4">
        <Field label="Vertrag" hint="erscheint im Betreff">
          <input className={inputCls} value={a.vertragBezeichnung} onChange={(e) => set('vertragBezeichnung', e.target.value)} placeholder="z. B. Werkvertrag vom 1. Februar 2026" />
        </Field>
        <Field label="Geschuldete Leistung">
          <input className={inputCls} value={a.leistungBeschrieb} onChange={(e) => set('leistungBeschrieb', e.target.value)} placeholder="z. B. Lieferung und Montage der Kücheneinrichtung" />
        </Field>
        <Field label="Fällig seit" optional>
          <DatumsFeld value={a.faelligSeit} onChange={(v) => set('faelligSeit', v)} className={inputCls} />
        </Field>
        <Field label="Nachfrist (Tage seit Erhalt)" hint="muss ANGEMESSEN sein (Art. 107 Abs. 1 OR) – Wertungsfrage, LexMetrik berechnet hier nichts">
          <input className={inputCls + ' sm:max-w-[8rem]'} inputMode="numeric" value={String(a.nachfristTage)}
            onChange={(e) => set('nachfristTage', Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
        </Field>
        <div className="lc-notice text-body-s">{KDG_ZUGANGS_HINWEIS}</div>
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: MaAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 1) {
    if (!a.absenderName.trim()) f.push('Eigenen Namen angeben.');
    if (!a.absenderAdresse.trim()) f.push('Eigene Adresse angeben.');
    if (!a.adressatName.trim()) f.push('Schuldnerin/Schuldner angeben.');
    if (!a.adressatAdresse.trim()) f.push('Adresse der Schuldnerseite angeben.');
  }
  if (schritt === 2 && a.variante === 'zahlung') {
    if (zahl(a.betrag) === null) f.push('Forderungsbetrag in CHF angeben.');
    if (!a.rechtsgrund.trim()) f.push('Rechtsgrund angeben (z. B. «Rechnung Nr. 4711 vom 12. Mai 2026»).');
    if (a.verfalltagVereinbart && !istIsoDatum(a.verfalltag)) f.push('Vereinbarten Verfalltag angeben.');
    if (!(a.zahlungsfristTage >= 1)) f.push('Zahlungsfrist in Tagen angeben (mindestens 1).');
    if (a.zinsVertraglich) {
      const satz = zahl(a.zinssatzProzent);
      if (satz === null || satz <= 5) f.push('Vertraglicher Verzugszins nur erfassen, wenn er ÜBER 5 % liegt (Art. 104 Abs. 2 OR) – sonst Feld deaktivieren.');
    }
    if (a.mahngebuehrErfassen && a.mahngebuehrVertraglich && zahl(a.mahngebuehr) === null) {
      f.push('Mahngebühr in CHF angeben (oder Erfassung deaktivieren).');
    }
  }
  if (schritt === 2 && a.variante === 'nachfrist') {
    if (!a.vertragBezeichnung.trim()) f.push('Vertrag bezeichnen (z. B. «Werkvertrag vom 1. Februar 2026»).');
    if (!a.leistungBeschrieb.trim()) f.push('Geschuldete Leistung beschreiben.');
    if (!(a.nachfristTage >= 1)) f.push('Nachfrist in Tagen angeben (mindestens 1).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<MaAntworten> = {
  cardId: 'mahnung',
  musterdaten: MUSTER.mahnung,
  defaults: MA_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: maZusammenstellen,
  pruefeGates: pruefeMaGates,
  schritte: SCHRITTE,
  overlineFallback: 'Vertrag & Forderung (OR)',
  titel: 'Mahnung & Inverzugsetzung',
  intro: 'Zahlungsaufforderung, die den Verzug auslöst (Art. 102 Abs. 1 OR), mit Verzugszins-Androhung (Art. 104 OR) – oder als Variante die Nachfristansetzung beim zweiseitigen Vertrag mit Wahlrechts-Vorbehalt (Art. 107 OR). Fristen sind Ihre eigene Wahl; wo das Gesetz nichts vorgibt, wird nichts erfunden.',
  badge: 'Zu unterzeichnen',
  eingabeInhalt,
  fehlerEingabe,
  blockerImLetztenSchritt: false,
  ortDatumLabel: 'Ort und Datum der Erklärung',
  ortPlaceholder: 'z. B. Basel',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum der Erklärung angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit die Mahnung trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Unterschreiben und nachweisbar zustellen</strong> – eingeschrieben empfohlen; massgebend ist der Zugang.</li>
        <li><strong>Fälligkeit prüfen:</strong><NormText text={` Die Mahnung wirkt nur bei fälliger Forderung (Art. 102 Abs. 1 OR).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Die Mahnung ist keine Betreibung, und die gesetzten Fristen sind meine eigene Wahl – massgebend sind Vertrag und Gesetz.',
  banner: BANNER_MA,
  dateiBasis: 'Mahnung',
  pdfLabel: 'Mahnung als PDF',
  docxLabel: 'Mahnung als Word (DOCX)',
};

export function VorlageMahnung() {
  return <VorlagenSeite config={CONFIG} />;
}
