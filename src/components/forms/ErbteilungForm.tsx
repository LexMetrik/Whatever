import { BeruehrtRahmen, Checkbox, EckdatenKachel, FehlerBox, Field, GruppenTitel, inputCls, ListenEditor } from '../vorlagen/ui';
import { NormText } from '../NormText';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { useState } from 'react';
import { BetragsFeld } from '../BetragsFeld';
import type { ErbteilungInput, Zivilstand, Gueterstand, ErbteilungErgebnis } from '../../types/erbrecht';
import { berechneErbteilung } from '../../lib/erbteilung';
import { fmtB, zahl, istNull } from '../../lib/bruch';
import { chf as fmtCHF } from '../../lib/vorlagen/datum';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren, istISO, einerVon, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { usePaneKlasse } from '../layout/PaneKontext';

const ERB_DISCLAIMER =
  'Automatisierte Orientierungsberechnung der gesetzlichen Erbteile, Pflichtteile und der verfügbaren Quote ' +
  '(Art. 457 ff., 462, 470 ff. ZGB; Revision in Kraft seit 1.1.2023) – keine Rechtsberatung. Berechnet werden ' +
  'Quoten bzw. Wertansprüche, nicht die Realteilung. Hinzurechnungen zur Pflichtteilsberechnungsmasse ' +
  '(Art. 475/476 ZGB), Ausgleichung (Art. 626 ff. ZGB), Herabsetzung (Art. 522 ff. ZGB) und internationale ' +
  'Sachverhalte (IPRG) sind nicht modelliert. Die güterrechtliche Auseinandersetzung ist vereinfacht abgebildet; ' +
  'Ersatzforderungen und Mehrwertanteile (Art. 206/209 ZGB) bleiben unberücksichtigt. Verbindlich ist der ' +
  'Wortlaut auf Fedlex (SR 210); der konkrete Sachverhalt ist fachlich zu prüfen.';

const ZIVILSTAENDE: { code: Zivilstand; label: string }[] = [
  { code: 'verheiratet', label: 'Verheiratet' },
  { code: 'eingetragene_partnerschaft', label: 'Eingetragene Partnerschaft' },
  { code: 'ledig', label: 'Ledig / verwitwet / geschieden' },
];

const GUETERSTAENDE: { code: Gueterstand; label: string }[] = [
  { code: 'errungenschaftsbeteiligung', label: 'Errungenschaftsbeteiligung (ordentlicher Güterstand)' },
  { code: 'guetertrennung', label: 'Gütertrennung' },
  { code: 'guetergemeinschaft', label: 'Gütergemeinschaft' },
];

type ElternStatus = 'lebt' | 'vorverstorben_mit' | 'vorverstorben_ohne' | 'keine_angabe';

const ELTERN_OPTIONEN: { code: ElternStatus; label: string }[] = [
  { code: 'keine_angabe', label: '– keine Angabe / nicht vorhanden –' },
  { code: 'lebt', label: 'lebt' },
  { code: 'vorverstorben_mit', label: 'vorverstorben, hat Nachkommen (Geschwister des Erblassers)' },
  { code: 'vorverstorben_ohne', label: 'vorverstorben, ohne Nachkommen' },
];


// Permalink (FAHRPLAN-PRAXIS 1.3)
type BetraegeLink = { eigengut: string; vorschlagE: string; vorschlagU: string; gesamtgut: string; vermoegen: string; direkt: string };
type EtLink = {
  todesdatum: string; zivilstand: string; scheidung?: boolean; scheidung472?: boolean;
  kinderLebend?: number; staemme?: { enkel: number }[]; vater?: string; mutter?: string;
  dritteParentel?: boolean; gueterrechtAn?: boolean; gueterstand?: string; betraege?: BetraegeLink;
};
const BETRAG_FELDER = ['eigengut', 'vorschlagE', 'vorschlagU', 'gesamtgut', 'vermoegen', 'direkt'] as const;
const ET_LINK_SPEC: PermalinkSpec<EtLink & Record<string, unknown>> = {
  todesdatum: { p: 'td', typ: 'str', gueltig: istISO },
  zivilstand: { p: 'zs', typ: 'str', gueltig: einerVon('verheiratet', 'eingetragene_partnerschaft', 'ledig') },
  scheidung: { p: 'sc', typ: 'bool' },
  scheidung472: { p: 's4', typ: 'bool' },
  kinderLebend: { p: 'kl', typ: 'num', gueltig: (n) => Number.isInteger(n) && n >= 0 && n <= 30 },
  staemme: { p: 'st', typ: 'json', gueltig: (v): boolean => Array.isArray(v) && v.length <= 30 && v.every((e) => e && Number.isInteger((e as { enkel?: number }).enkel) && ((e as { enkel: number }).enkel) >= 0) },
  vater: { p: 'va', typ: 'str', gueltig: einerVon('lebt', 'vorverstorben_mit', 'vorverstorben_ohne', 'keine_angabe') },
  mutter: { p: 'mu', typ: 'str', gueltig: einerVon('lebt', 'vorverstorben_mit', 'vorverstorben_ohne', 'keine_angabe') },
  dritteParentel: { p: 'dp', typ: 'bool' },
  gueterrechtAn: { p: 'ga', typ: 'bool' },
  gueterstand: { p: 'gs', typ: 'str', gueltig: einerVon('errungenschaftsbeteiligung', 'guetertrennung', 'guetergemeinschaft') },
  betraege: { p: 'be', typ: 'json', gueltig: (v): boolean => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every((k) => (BETRAG_FELDER as readonly string[]).includes(k)) && Object.values(v).every((x) => typeof x === 'string' && x.length <= 16) },
};

export function ErbteilungForm() {
  const pk = usePaneKlasse();
  const ausLink = usePermalinkFelder(ET_LINK_SPEC);
  const [todesdatum, setTodesdatum] = useState(ausLink.todesdatum ?? '2025-06-01');
  const [zivilstand, setZivilstand] = useState<Zivilstand>((ausLink.zivilstand as Zivilstand | undefined) ?? 'verheiratet');
  const [scheidung, setScheidung] = useState(ausLink.scheidung ?? false);
  const [scheidung472, setScheidung472] = useState(ausLink.scheidung472 ?? false);
  const [kinderLebend, setKinderLebend] = useState(ausLink.kinderLebend ?? 2);
  const [staemme, setStaemme] = useState<{ enkel: number }[]>(ausLink.staemme ?? []);
  const [vater, setVater] = useState<ElternStatus>((ausLink.vater as ElternStatus | undefined) ?? 'keine_angabe');
  const [mutter, setMutter] = useState<ElternStatus>((ausLink.mutter as ElternStatus | undefined) ?? 'keine_angabe');
  const [dritteParentel, setDritteParentel] = useState(ausLink.dritteParentel ?? false);
  const [gueterrechtAn, setGueterrechtAn] = useState(ausLink.gueterrechtAn ?? false);
  const [gueterstand, setGueterstand] = useState<Gueterstand>((ausLink.gueterstand as Gueterstand | undefined) ?? 'errungenschaftsbeteiligung');
  const [betraege, setBetraege] = useState<{ eigengut: string; vorschlagE: string; vorschlagU: string; gesamtgut: string; vermoegen: string; direkt: string }>(() => ({
    eigengut: '', vorschlagE: '', vorschlagU: '', gesamtgut: '', vermoegen: '', direkt: '',
    ...(ausLink.betraege ?? {}),
  }));

  const elternteil = (s: ElternStatus) =>
    s === 'keine_angabe' ? undefined : { lebt: s === 'lebt', stammNachkommen: s === 'vorverstorben_mit' };
  // Transiente Tipp-Zustände («-», «.») nie als NaN weiterreichen (Bug-Check 5.6.2026)
  // Bewusst lokal (B15/§1): plainer Number-Parse OHNE CH-Normalisierung
  // (Apostroph/Komma), leer/ungültig→undefined statt `vorlagen/datum.zahl`→null. Nicht mergen.
  const num = (s: string) => { const n = Number(s); return s.trim() === '' || !Number.isFinite(n) ? undefined : n; };

  const hatErste = kinderLebend > 0 || staemme.some((s) => s.enkel > 0);

  const input: ErbteilungInput = {
    todesdatum,
    zivilstand,
    scheidungHaengig: zivilstand !== 'ledig' ? scheidung : undefined,
    scheidung472Erfuellt: zivilstand !== 'ledig' && scheidung ? scheidung472 : undefined,
    kinderLebend,
    kinderVorverstorben: staemme.length ? staemme : undefined,
    vater: elternteil(vater),
    mutter: elternteil(mutter),
    dritteParentelVorhanden: dritteParentel,
    // Beträge: güterrechtliche Herleitung (Panel offen) hat Vorrang,
    // sonst zählt der direkt erfasste Nachlass; leer = nur Quoten.
    ...(gueterrechtAn
      ? {
          gueterstand,
          eigengutErblasser: num(betraege.eigengut),
          vorschlagErblasser: num(betraege.vorschlagE),
          vorschlagUeberlebender: num(betraege.vorschlagU),
          gesamtgut: num(betraege.gesamtgut),
          vermoegenErblasser: num(betraege.vermoegen),
        }
      : betraege.direkt.trim() !== ''
        ? { nachlassDirekt: num(betraege.direkt) }
        : {}),
  };

  const fehler: string[] = [];
  if (!todesdatum) fehler.push('Bitte das Todesdatum angeben (Recht-Schalter, Art. 15/16 SchlT ZGB).');
  // LM-Fix Finder-6 A1 (5.9.2026): Obergrenze in der Fehlerpruefung nachgezogen — bisher
  // nur >=0 geprueft, dieselbe Grenze wie die Permalink-Validierung (ET_LINK_SPEC.kinderLebend,
  // <= 30) fehlte hier. Ohne sie rendert die Tabelle ungeprueft z. B. 5000 Zeilen (§15).
  if (!Number.isInteger(kinderLebend) || kinderLebend < 0 || kinderLebend > 30) fehler.push('Anzahl lebender Kinder: ganze Zahl zwischen 0 und 30 (realistische Obergrenze).');
  staemme.forEach((s, i) => { if (!Number.isInteger(s.enkel) || s.enkel < 0) fehler.push(`Stamm ${i + 1}: Anzahl Nachkommen als ganze Zahl ≥ 0.`); });

  let ergebnis: ErbteilungErgebnis | null = null;
  if (fehler.length === 0) {
    try { ergebnis = berechneErbteilung(input); } catch (err) { fehler.push((err as Error).message); }
  }

  const eingaben: Record<string, string> = {
    'Todesdatum': todesdatum,
    'Zivilstand': ZIVILSTAENDE.find((z) => z.code === zivilstand)?.label ?? zivilstand,
    ...(zivilstand !== 'ledig' && scheidung ? { 'Scheidungsverfahren hängig': scheidung472 ? 'ja, Voraussetzungen Art. 472 ZGB erfüllt' : 'ja, Voraussetzungen Art. 472 ZGB nicht erfüllt' } : {}),
    'Lebende Kinder': String(kinderLebend),
    ...(staemme.length ? { 'Stämme vorverstorbener Kinder': staemme.map((s, i) => `Stamm ${i + 1}: ${s.enkel} Nachkommen`).join('; ') } : {}),
    ...(vater !== 'keine_angabe' ? { 'Vater': ELTERN_OPTIONEN.find((o) => o.code === vater)!.label } : {}),
    ...(mutter !== 'keine_angabe' ? { 'Mutter': ELTERN_OPTIONEN.find((o) => o.code === mutter)!.label } : {}),
    ...(dritteParentel ? { '3. Parentel vorhanden': 'ja' } : {}),
    ...(ergebnis?.nachlassChf != null ? { 'Nachlass (CHF)': fmtCHF(ergebnis.nachlassChf) } : {}),
  };

  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Erbteilung & Pflichtteil (ZGB)',
    domain: 'erbrecht',
    fileBase: 'Erbteilung-Pflichtteil',
    inputs: eingaben,
    sections: ergebnis ? [{ titel: 'Erbteilung & Pflichtteil (Art. 457 ff., 462, 470 ff. ZGB)', ergebnis }] : [],
    disclaimer: ERB_DISCLAIMER,
  };

  // CHF-Beträge kommen seit dem Ultra-Review-Fix (7.6.2026, §3) fertig aus
  // der Engine (erbteilChf/pflichtteilChf/verfuegbareQuoteChf) — hier wird
  // nur noch gerendert.
  const nachlass = ergebnis?.nachlassChf;

  return (
    <BeruehrtRahmen>
    <div className="space-y-6 lc-rechner-spalten">
      {/* Pflicht-Disclaimer */}
      <PflichtDisclaimer kurz="Quoten-Orientierung (Art. 457 ff., 470 ff. ZGB, Revision 2023). Massgebend ist das Todesdatum." text={ERB_DISCLAIMER} />

      {/* Grundangaben */}
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Todesdatum" hint="Recht-Schalter: bis 31.12.2022 altes Recht, ab 1.1.2023 neues Recht (Art. 15/16 SchlT ZGB)">
          <DatumsFeld value={todesdatum} onChange={(v) => setTodesdatum(v)} className={inputCls} />
        </Field>
        <Field label="Zivilstand des Erblassers" hint="Eingetragene Partner sind Ehegatten gleichgestellt (Art. 462 ZGB)">
          <select value={zivilstand} onChange={(e) => setZivilstand(e.target.value as Zivilstand)} className={inputCls}>
            {ZIVILSTAENDE.map((z) => <option key={z.code} value={z.code}>{z.label}</option>)}
          </select>
        </Field>
        <Field label="Nachlass (CHF)" optional
          hint={gueterrechtAn
            ? 'Wird unten güterrechtlich hergeleitet – Direkteingabe ist deaktiviert'
            : 'Leer = nur Quoten; mit Betrag werden Erb- und Pflichtteile in CHF ausgewiesen'}>
          <input type="number" inputMode="decimal" min={0} value={betraege.direkt} disabled={gueterrechtAn}
            onChange={(e) => setBetraege((b) => ({ ...b, direkt: e.target.value }))}
            placeholder="z. B. 500'000" className={inputCls + (gueterrechtAn ? ' opacity-50 cursor-not-allowed' : '')} />
        </Field>
      </div>

      {zivilstand !== 'ledig' && (
        <div className="space-y-2">
          <Checkbox checked={scheidung} onChange={setScheidung} label="Scheidungs-/Auflösungsverfahren beim Tod hängig" />
          {scheidung && (
            <Checkbox checked={scheidung472} onChange={setScheidung472} label="Voraussetzungen von Art. 472 ZGB erfüllt (gemeinsames Begehren oder ≥ 2 Jahre getrennt) → Pflichtteilsverlust" className="pl-6" />
          )}
        </div>
      )}

      {/* 1. Parentel */}
      <div className="space-y-3">
        <GruppenTitel><NormText text={`1. Parentel – Nachkommen (Art. 457 ZGB)`} /></GruppenTitel>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Lebende Kinder (Anzahl)">
            {/* LM-072 (B12, 4.9.2026): die feste Feldbreite ist weg — das Feld folgt jetzt
                seiner Rasterzelle wie jedes andere `Field` derselben Reihe. GEMESSEN
                @1440 stand es als 112 px neben Feldern von 495 px, ohne dass die
                schmalere Breite etwas aussagte (§8: eine Breite ist eine Zusage über
                die erwartete Eingabelänge). Die schmalen Felder der INLINE-Reihen
                (Zahl + Einheit nebeneinander, `w-24`) bleiben, dort trägt die Breite
                die Zusammengehörigkeit. */}
            <input type="number" inputMode="decimal" min={0} max={30} step={1} value={kinderLebend} onChange={(e) => setKinderLebend(Number(e.target.value))} className={inputCls} aria-invalid={!Number.isInteger(kinderLebend) || kinderLebend < 0 || kinderLebend > 30} />
          </Field>
          <Field label="Vorverstorbene Kinder mit Nachkommen (Stämme)" hint="Deren Nachkommen treten nach Stämmen ein (Art. 457 Abs. 3)">
            {/* Der Wrapper-<div> bleibt: `Field` verknüpft nur ein natives
                Einzel-Control, hier steht eine ganze Liste darin. */}
            <div>
              {/* R2-F/F1-9: Repeater auf den geteilten ListenEditor. Die
                  Stamm-Nummer trägt jetzt die Kopfzeile des Eintrags statt
                  eines Inline-«Stamm N:»; das Zahlenfeld behält sie als
                  aria-label, damit die Zuordnung vorgelesen bleibt. */}
              <ListenEditor
                element="Stamm"
                eintraege={staemme}
                className="space-y-2"
                onHinzufuegen={() => setStaemme((arr) => [...arr, { enkel: 1 }])}
                onEntfernen={(i) => setStaemme((arr) => arr.filter((_, j) => j !== i))}
                kinder={(s, i) => (
                  <div className="flex items-center gap-2">
                    <input type="number" inputMode="decimal" min={0} step={1} value={s.enkel}
                      aria-label={`Nachkommen Stamm ${i + 1}`}
                      onChange={(e) => setStaemme((arr) => arr.map((x, j) => (j === i ? { enkel: Number(e.target.value) } : x)))}
                      className={inputCls + ' w-24'} />
                    <span className="text-body-s text-ink-500">Nachkommen</span>
                  </div>
                )}
              />
            </div>
          </Field>
        </div>
      </div>

      {/* 2./3. Parentel – nur relevant ohne Nachkommen */}
      {!hatErste && (
        <div className="space-y-3">
          <GruppenTitel><NormText text={`2. Parentel – elterlicher Stamm (Art. 458 ZGB)`} /></GruppenTitel>
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            <Field label="Vater">
              <select value={vater} onChange={(e) => setVater(e.target.value as ElternStatus)} className={inputCls}>
                {ELTERN_OPTIONEN.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Mutter">
              <select value={mutter} onChange={(e) => setMutter(e.target.value as ElternStatus)} className={inputCls}>
                {ELTERN_OPTIONEN.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          {vater === 'keine_angabe' && mutter === 'keine_angabe' && zivilstand === 'ledig' && (
            <Checkbox checked={dritteParentel} onChange={setDritteParentel} label="3. Parentel vorhanden (Grosseltern oder deren Nachkommen, Art. 459 ZGB)" />
          )}
        </div>
      )}

      {/* Güterrechtliche Herleitung (optional) – übersteuert das Direktfeld oben */}
      <div className="border border-line ">
        <button type="button" onClick={() => setGueterrechtAn(!gueterrechtAn)}
          className={`w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-brass-100 text-left ${gueterrechtAn ? '' : ''}`}>
          <span className="text-body-s font-medium text-ink-700">Güterrechtliche Vorstufe – Nachlass herleiten (optional)</span>
          <span className="text-ink-500">{gueterrechtAn ? '▲' : '▼'}</span>
        </button>
        {gueterrechtAn && (
          <div className="p-4 space-y-4">
            <Field label="Güterstand">
              <select value={gueterstand} onChange={(e) => setGueterstand(e.target.value as Gueterstand)} className={inputCls}>
                {GUETERSTAENDE.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
              </select>
            </Field>
            {gueterstand === 'errungenschaftsbeteiligung' && (
              <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
                <Field label="Eigengut Erblasser (CHF)"><BetragsFeld erlaubeNegativ value={betraege.eigengut} onChange={(v) => setBetraege((b) => ({ ...b, eigengut: v }))} className={inputCls} /></Field>
                <Field label="Vorschlag Erblasser (CHF)" hint="negativ = Rückschlag (mindert den Nachlass voll, Art. 209 Abs. 2, 474 Abs. 2 ZGB)"><BetragsFeld erlaubeNegativ value={betraege.vorschlagE} onChange={(v) => setBetraege((b) => ({ ...b, vorschlagE: v }))} className={inputCls} /></Field>
                <Field label="Vorschlag Überlebender (CHF)"><BetragsFeld erlaubeNegativ value={betraege.vorschlagU} onChange={(v) => setBetraege((b) => ({ ...b, vorschlagU: v }))} className={inputCls} /></Field>
              </div>
            )}
            {gueterstand === 'guetertrennung' && (
              <Field label="Vermögen des Erblassers (CHF)"><BetragsFeld erlaubeNegativ value={betraege.vermoegen} onChange={(v) => setBetraege((b) => ({ ...b, vermoegen: v }))} className={inputCls + ' w-44'} /></Field>
            )}
            {gueterstand === 'guetergemeinschaft' && (
              <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
                <Field label="Eigengut Erblasser (CHF)"><BetragsFeld erlaubeNegativ value={betraege.eigengut} onChange={(v) => setBetraege((b) => ({ ...b, eigengut: v }))} className={inputCls} /></Field>
                <Field label="Gesamtgut (CHF)"><BetragsFeld erlaubeNegativ value={betraege.gesamtgut} onChange={(v) => setBetraege((b) => ({ ...b, gesamtgut: v }))} className={inputCls} /></Field>
              </div>
            )}
          </div>
        )}
      </div>

      <FehlerBox fehler={fehler} />

      {ergebnis && (
        <ErgebnisBlock>
          {/* Eckdaten */}
          <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
            <EckdatenKachel label="Rechtsstand"
              wert={ergebnis.rechtsstand === 'neu' ? 'Neues Recht (ab 1.1.2023)' : 'Altes Recht (bis 31.12.2022)'} />
            <EckdatenKachel akzent num label="Verfügbare Quote"
              wert={`${fmtB(ergebnis.verfuegbareQuote)}${ergebnis.verfuegbareQuoteChf != null ? ` · CHF ${fmtCHF(ergebnis.verfuegbareQuoteChf)}` : ''}`} />
            {/* LM-034 (B11-Karten, 4.9.2026): `num` gilt der KACHEL, nicht dem
                Wert — der Ersatzsatz «nur Quoten (keine Beträge erfasst)» lief
                dadurch in Geist Mono (am 4.9. auf /rechner/erbteilung gemessen)
                und stand als dritte Schrift neben «Neues Recht (ab 1.1.2023)»
                (Sans) und «1/2» (Mono). Die Zwei-Stimmen-Regel
                (DESIGN-REGLEMENT §4b(e), Fassung 29.8.2026) gibt Mono an
                Zahlen, Aktenzeichen und Struktur-Etiketten — ein Satz ist
                keines davon. `num` hängt darum jetzt am Wert. */}
            <EckdatenKachel num={nachlass != null} label="Nachlass"
              wert={nachlass != null ? `CHF ${fmtCHF(nachlass)}` : 'nur Quoten (keine Beträge erfasst)'} />
          </div>

          {/* QS-UI 8b (R4 Ziff. 2 / B1 «Verdikt zuerst»): Die ErgebnisAnzeige stand
              hier bis 4.8.2026 NACH Erben-Tabelle und Quoten-Balken — als einziger
              Rechner der App. Gemessen (1280×800): Abstand erste Eckdaten-Kachel →
              Verdikt-Satz 666 px gegen 243–283 px auf allen anderen 13 Flächen; das
              Verdikt lag bei 2.15 Bildschirmhöhen statt 1.4–1.7. R4 ordnet Verdikt
              VOR jede abgeleitete Ansicht («Eckdaten beantworten die Frage, die
              ErgebnisAnzeige trägt das rechtliche Verdikt samt Vorbehalten — beides
              VOR Kalender/Timeline»). Tabelle und Balken sind genau solche
              abgeleiteten Ansichten und folgen darum jetzt darunter. Reine
              DOM-Reihenfolge: kein Text, kein Wert, keine Berechnung geändert. */}
          <ErgebnisAnzeige titel="Erbteilung & Pflichtteil (Art. 457 ff., 462, 470 ff. ZGB)" ergebnis={ergebnis} />

          {/* Erben-Tabelle — abgeleitete Ansicht (R4 Ziff. 3, `data-ansicht`). */}
          <div data-ansicht="erben-tabelle" className="lc-card p-5 overflow-x-auto">
            <p className="lc-overline mb-3">Erbteile & Pflichtteile</p>
            <table className="w-full min-w-[42rem] text-body-s">
              <thead>
                <tr className="text-left text-ink-500 border-b border-line">
                  <th className="py-1.5 pr-3 font-medium">Erbe</th>
                  <th className="py-1.5 pr-3 font-medium">Gesetzlicher Erbteil</th>
                  <th className="py-1.5 pr-3 font-medium">Pflichtteil</th>
                  {nachlass != null && <th className="py-1.5 pr-3 font-medium num">Erbteil (CHF)</th>}
                  {nachlass != null && <th className="py-1.5 font-medium num">Pflichtteil (CHF)</th>}
                </tr>
              </thead>
              <tbody>
                {ergebnis.erben.map((e) => (
                  <tr key={e.bezeichnung} className="border-b border-line last:border-0">
                    <td className="py-1.5 pr-3 text-ink-900">{e.bezeichnung}{e.anzahl ? ` – ${e.anzahl} Personen, je:` : ''}</td>
                    <td className="py-1.5 pr-3 num text-ink-900">{fmtB(e.erbteil)}</td>
                    <td className="py-1.5 pr-3 num">{istNull(e.pflichtteil) ? <span className="text-ink-500">– kein PT</span> : <span className="text-ink-900">{fmtB(e.pflichtteil)}</span>}</td>
                    {e.erbteilChf != null && <td className="py-1.5 pr-3 num text-ink-700">{fmtCHF(e.erbteilChf)}</td>}
                    {e.pflichtteilChf != null && <td className="py-1.5 num text-ink-700">{istNull(e.pflichtteil) ? '–' : fmtCHF(e.pflichtteilChf)}</td>}
                  </tr>
                ))}
                <tr className="bg-surface">
                  <td className="py-1.5 pr-3 font-semibold text-ink-900">Verfügbare Quote</td>
                  <td className="py-1.5 pr-3" />
                  <td className="py-1.5 pr-3 num font-semibold text-brass-700">{fmtB(ergebnis.verfuegbareQuote)}</td>
                  {nachlass != null && <td className="py-1.5 pr-3" />}
                  {ergebnis.verfuegbareQuoteChf != null && <td className="py-1.5 num font-semibold text-brass-700">{fmtCHF(ergebnis.verfuegbareQuoteChf)}</td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quoten-Balken: gebundener Teil vs. verfügbare Quote — abgeleitete
              Ansicht aus reinen Divs (R4 Ziff. 3, `data-ansicht`). */}
          <div data-ansicht="quoten-balken" className="lc-card p-5">
            <p className="lc-overline mb-3">Gebundene vs. verfügbare Quote</p>
            <div className="flex h-7 overflow-hidden border border-line">
              {ergebnis.erben.filter((e) => !istNull(e.pflichtteil)).map((e) => {
                const breite = zahl(e.pflichtteil) * (e.anzahl ?? 1) * 100;
                return (
                  <div key={e.bezeichnung} className="bg-warn-bg border-r border-line flex items-center justify-center"
                    style={{ width: `${breite}%` }} title={`${e.bezeichnung}: Pflichtteil ${fmtB(e.pflichtteil)}${e.anzahl ? ` × ${e.anzahl}` : ''}`}>
                    <span className="text-micro text-warn-700 truncate px-1">{fmtB(e.pflichtteil)}{e.anzahl ? `×${e.anzahl}` : ''}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-center flex-1" style={{ background: 'var(--brass-100)' }}
                title={`Verfügbare Quote: ${fmtB(ergebnis.verfuegbareQuote)}`}>
                <span className="text-micro text-brass-700 font-semibold">verfügbar {fmtB(ergebnis.verfuegbareQuote)}</span>
              </div>
            </div>
            <p className="text-body-s text-ink-500 mt-2">Gelb: Pflichtteile (gebundene Quote) · Gold: frei verfügbar (Testament/Erbvertrag)</p>
          </div>

          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
            query={() => permalinkKodieren(ET_LINK_SPEC, {
              todesdatum, zivilstand, scheidung, scheidung472, kinderLebend, staemme,
              vater, mutter, dritteParentel, gueterrechtAn, gueterstand, betraege,
            })} />
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
