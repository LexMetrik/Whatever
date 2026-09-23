import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { DatumsFeld } from '../DatumsFeld';
import { Checkbox, Field, inputCls } from './ui';
import { NormText } from '../NormText';
import { useWizardState } from './useWizardState';
import { VorlagenWizardRahmen, VorschauPanel, ExportLeiste } from './wizard';
import { karte } from '../../lib/startseiteConfig';
import { docxAktiv, istIsoDatum } from './seiteHelfer';
import type { AssembleErgebnis } from '../../lib/vorlagen/engine';
import type { PdfBanner } from '../../lib/vorlagen/banner';
import { getProfil, getVorlagenDetailgrad } from '../../lib/einstellungen';

// ─── Generische Vorlagen-Seite (FUNDAMENT-UMBAU Thema A, opt-in) ────────────
//
// Übernimmt die in allen linearen Vorlagen IDENTISCHE, kopier-fehleranfällige
// Orchestrierung — und NUR diese (§3, reine Darstellung):
//   • useWizardState + die zwei useMemo (zusammenstellen / pruefeGates),
//   • das fehlerImSchritt-Gerüst (letzter Schritt: Ort + ISO-Datum + Blocker),
//   • den «pruefen»-Schritt (gates.hinweise · Ort/Datum-Raster · Bestätigungs-
//     Sektion · ExportLeiste mit dem DOCX-Form-Gate),
//   • VorlagenWizardRahmen + VorschauPanel (Direkt-Export mit demselben Gate).
//
// Das seiten-SPEZIFISCHE JSX (Eingabe-Schritte, Bestätigungs-Bullets) bleibt in
// der Config-Datei der Seite — eine generische Abstraktion über fachlich
// verschiedene Felder wäre §1-widrig. KEINE Rechtslogik hier: zusammenstellen/
// pruefeGates/Normtexte kommen als fertige Funktionsreferenzen aus src/lib.
// Opt-in für lineare Wizards; seit W2·29-WERKBANK-VORLAGEN §5c ziehen auch Seiten
// mit Live-Kacheln und Sonder-Props um — über die optionalen Slots unten.
//
// Slot-Inventar (V4, 23.9.2026 — gezählt über die 29 Konfigurationen):
// Jeder optionale Slot ist per Default deckungsgleich mit dem Verhalten der
// Seiten, die ihn nicht setzen; Slots sind Darstellung bzw. Zustands-Hygiene,
// NIE Fachlogik. Entstehung: QS-CODE-ENTDOPPLUNG D1 (Typparameter `Z`,
// kopfSchalter, fussnote, bestaetigungLabelCls), dann W2·29-WERKBANK-VORLAGEN
// V2a–V2e (Rest) — Einzelheiten im git-Verlauf dieser Datei.
//   • Zustand:   speicherKey (23) · defaultsZusatz (3) · normalisieren (8) ·
//                profilPrefill (13) · detailgradAusEinstellungen (5) · vorauswahl (1)
//   • Kopf:      kopfSchalter (9) · overlineZusatz (3) · fussnote (7)
//   • Schritte:  fehlerEingabeImLetztenSchritt (6) · fehlerBox (1) ·
//                pruefBefund (1) · weiterDeaktiviert (2)
//   • Prüfen:    blockerKasten (7) · blockerEinzeln (3) · pruefenZusatz (8) ·
//                blockerImLetztenSchritt (14) · ortDatumImPruefen (7) ·
//                ortDatumLabel/ortPlaceholder (22) · ortFehler (14) ·
//                datumFehler (19) · ohneBestaetigung (1) ·
//                bestaetigungLabelCls (23) · exportLeiste (1) · pruefenFuss (9)
//   • Vorschau:  vorschauKompakt (6) · vorschauErsatz (2) ·
//                direktExportBlocker (3) · vorschauExtra (1) ·
//                vorschauNichtAufgenommen (1)
//   • Export:    docxSperre (2); banner/dateiBasis/pdfLabel/docxLabel/
//                bestaetigungLabel wahlweise als Funktion der Antworten
// Kein Slot ist tot. blockerKasten (EINE Sammelbox) und blockerEinzeln (je
// Blocker eine Box) sind keine Doppelung: zwei vorgefundene DOM-Formen. Die
// Einzel-Nutzer (fehlerBox, pruefBefund, ohneBestaetigung, exportLeiste,
// vorschauNichtAufgenommen: Schlichtungsgesuch BS) bleiben, bis eine SICHTBARE,
// deklarierte Angleichung die Sonderform der Seite aufhebt — ein Streichen
// hier wäre eine Verhaltensänderung im Rückbau (§6).
// Hook-Regel: Ein Hook (z. B. usePaneKlasse) gehört NICHT direkt in
// `eingabeInhalt` — es läuft nur auf den Eingabe-Schritten, der Hook wechselte
// die Hook-Reihenfolge je Schritt. Braucht ein Schritt einen Hook, rendert
// `eingabeInhalt` eine Komponente der Seite (`<EingabeSchritt ctx schritt />`),
// die ihn aufruft.

/** Einheitliche Gate-Form aller Vorlagen-Engines. */
type VorlagenGates = { blocker: string[]; warnungen: string[]; hinweise: string[] };

/** Mindest-Form des Assemble-Ergebnisses. Engines, die daneben Rechenwerte
 *  liefern (Beendigungsdatum, Rückzahlungsfrist), tragen diese in `Z` — der
 *  Rahmen reicht sie unverändert an Gates und Eingabe-Schritte durch. */
type Zusammenstellung = { ergebnis: AssembleErgebnis };

/** Ort/Datum-Felder des Prüfen-Schritts (Default-Fall `ortDatumImPruefen`). */
type OrtDatum = { ort: string; datum: string };

/** Wert oder Funktion der Antworten (Form-Weiche: Banner/Dateiname je Variante). */
type JeAntwort<T, W> = W | ((a: T) => W);
const aufloesen = <T, W>(w: JeAntwort<T, W>, a: T): W =>
  typeof w === 'function' ? (w as (a: T) => W)(a) : w;

/** Kontext für die Eingabe-Schritt-Renderer der Seite. `z` ist das ungekürzte
 *  Ergebnis von `zusammenstellen` — damit ein Schritt einen Engine-Rechenwert
 *  anzeigen kann, OHNE die Engine ein zweites Mal zu fahren (§2/§15). */
export interface SeiteCtx<T, Z = Zusammenstellung> {
  a: T;
  set: <K extends keyof T>(k: K, v: T[K]) => void;
  /** Funktionales Update mehrerer Felder in einem Zug (useWizardState.setA). */
  setA: Dispatch<SetStateAction<T>>;
  z: Z;
}

export interface VorlagenSeitenConfig<
  T extends object,
  Z extends Zusammenstellung = Zusammenstellung,
> {
  /** Katalog-Id (startseiteConfig) — liefert rechtsgebiet, norms, modus/output. */
  cardId: string;
  defaults: T;
  /** Fehlt er, bleibt der Zustand nur im Speicher (Parteidaten, «nicht gespeichert»). */
  speicherKey?: string;
  /** Zusatz-Defaults, bei JEDEM Render gelesen und über `defaults` gelegt
   *  (z. B. Prefill-Brücke aus `?…`) — wirkt beim ersten Render und beim
   *  Zurücksetzen, wie zuvor der Inline-Ausdruck am useWizardState-Aufruf. */
  defaultsZusatz?: () => Partial<T>;
  /** Reine Engine-Referenzen (src/lib) — keine Logik in dieser Schicht. */
  zusammenstellen: (a: T) => Z;
  pruefeGates: (a: T, z: Z) => VorlagenGates;
  /** Hydration absichern (Array-Felder aus älteren/fremdeditierten
   *  Speicherständen) — unverändert an useWizardState durchgereicht. */
  normalisieren?: (geladen: T) => T;
  /** Profil-Prefill der Absender-Felder (Default true). */
  profilPrefill?: boolean;
  /** Globalen Vorlagen-Detailgrad (Einstellungen) als Default übernehmen,
   *  wenn das Schema `detailgrad` führt (Default true). false = der Default
   *  des Schemas gilt (Ist-Zustand der Vertrags-Seiten). */
  detailgradAusEinstellungen?: boolean;
  /** Vorauswahl aus der Adresse (z. B. `#untermiete`): läuft beim ersten
   *  Render und bei jedem Wechsel von `schluessel` genau einmal, während des
   *  Renderns (React-Muster «adjusting state», kein Effect). `anwenden`
   *  liefert die zu setzenden Felder oder undefined. */
  vorauswahl?: { schluessel: string; anwenden: (a: T) => Partial<T> | undefined };
  schritte: readonly { id: string; label: string }[];
  // Rahmen-Kopf
  overlineFallback: string;       // Rechtsgebiet-Fallback, falls Karte fehlt
  titel: string;
  intro: ReactNode;
  badge: string;
  /** Segment-Schalter ÜBER dem Stepper (VariantenKopf: Untertyp/Detailgrad).
   *  Funktion statt ReactNode, weil der Schalter `a`/`set` braucht. */
  kopfSchalter?: (ctx: SeiteCtx<T, Z>) => ReactNode;
  /** Statischer Block UNTER dem Wizard (z. B. ThemenEinstieg-Brücke). */
  fussnote?: ReactNode;
  // Eingabe-Schritte (alle ausser dem letzten «pruefen»-Schritt)
  eingabeInhalt: (ctx: SeiteCtx<T, Z>, schritt: number) => ReactNode;
  /** Pflichtfeld-Fehler je Eingabe-Schritt (NICHT für den letzten Schritt).
   *  `gates` für Seiten, die schon in einem Eingabe-Schritt einen fachlichen
   *  Blocker spiegeln (z. B. Nichtbekanntgabe: Rechtsvorschlag-Voraussetzung). */
  fehlerEingabe: (a: T, schritt: number, gates: VorlagenGates) => string[];
  /** true = `fehlerEingabe` liefert auch die Fehler des letzten Schritts
   *  (Mängel-Listen mit Schritt-Index); die Ort/Datum/Blocker-Regel entfällt
   *  (Default false). */
  fehlerEingabeImLetztenSchritt?: boolean;
  /** Fehlerbox am Schritt (Rahmen-Prop `fehler`, Default true). false = der
   *  Rahmen erhält keine Schritt-Fehler: keine FehlerBox, die Weiter-Sperre
   *  kommt dann allein aus `weiterDeaktiviert`. Der Prüf-Befund bleibt. */
  fehlerBox?: boolean;
  /** Prüf-Befund im letzten Schritt (Rahmen-Prop `fehlerJeSchritt`, Default
   *  immer). false = kein Befund (z. B. Stopp-Fall ohne Dokument). */
  pruefBefund?: (ctx: SeiteCtx<T, Z>) => boolean;
  /** Weiter-Sperre des Rahmens übersteuern (Default: Fehler des Schritts). */
  weiterDeaktiviert?: (ctx: SeiteCtx<T, Z>, schritt: number) => boolean;
  // «pruefen»-Schritt
  /** «Export gesperrt»-Box (role=alert) mit den gates.blocker oben im
   *  Prüfen-Schritt (Default false). Ein String ersetzt die Überschrift. */
  blockerKasten?: boolean | string;
  /** Jeder Blocker als eigene role=alert-Box (Default aus). Ein String ist die
   *  Überschrift jeder Box. */
  blockerEinzeln?: boolean | string;
  /** Seiten-Block zwischen den Hinweisen und Ort/Datum (z. B. Endtermin-
   *  Kachel aus `ctx.z`). */
  pruefenZusatz?: (ctx: SeiteCtx<T, Z>) => ReactNode;
  /** Ob der letzte-Schritt-Fehler die gates.blocker enthält (Default true).
   *  false z. B. bei Mahnung, deren Navigations-Fehler nur Ort/Datum prüft
   *  (Blocker sperren dort nur den Export, nicht die Fehlerbox). */
  blockerImLetztenSchritt?: boolean;
  /** Ort/Datum-Raster im Prüfen-Schritt samt Ort-/Datums-Fehler im letzten
   *  Schritt (Default true). false = die Seite erfasst Ort/Datum in einem
   *  Eingabe-Schritt (Klagen) oder führt sie nicht (Testament); dann werden
   *  ort/datum nicht gelesen und ortDatumLabel/ortPlaceholder/ortFehler/
   *  datumFehler entfallen. */
  ortDatumImPruefen?: boolean;
  ortDatumLabel?: string;
  ortPlaceholder?: string;
  /** Fehlertext bei leerem Ort. Fehlt er, ist der Ort keine Pflichtangabe
   *  (kein Eintrag in Fehlerbox/Sammel-Befund, kein aria-invalid). */
  ortFehler?: string;
  /** Fehlertext bei unvollständigem Datum. Fehlt er, ist das Datum keine
   *  Pflichtangabe dieses Schritts (analog `ortFehler`). */
  datumFehler?: string;
  /** Inhalt der lc-highlight-Sektion ÜBER der Bestätigungs-Checkbox. Als
   *  Funktion, wenn ein Bullet von den Antworten abhängt. */
  bestaetigung: ReactNode | ((ctx: SeiteCtx<T, Z>) => ReactNode);
  bestaetigungLabel: ReactNode | ((ctx: SeiteCtx<T, Z>) => ReactNode);
  /** true = keine Bestätigungs-Sektion; der Export sperrt dann allein an
   *  gates.blocker (Default false). `bestaetigung`/`bestaetigungLabel` werden
   *  nicht gelesen (null übergeben). */
  ohneBestaetigung?: boolean;
  /** Klassen der Bestätigungs-Zeile. Default ist die Form der fünf Pilot-Seiten
   *  (`gap-2`, kein Padding). Die handgeschriebenen Seiten tragen historisch
   *  `gap-2.5 py-1.5` — die grössere Trefferfläche (DESIGN-REGLEMENT F9). Beim
   *  Umzug auf den Rahmen bleibt die vorgefundene Form erhalten, statt sie still
   *  zu verkleinern (§6). Die Vereinheitlichung ist eine SICHTBARE Änderung und
   *  gehört in einen eigenen, deklarierten Schritt (W2·17-UI-BEFUNDE-B10). */
  bestaetigungLabelCls?: string;
  /** Export-Leiste im Prüfen-Schritt zeigen (Default immer). false z. B. im
   *  Stopp-Fall ohne Dokument. */
  exportLeiste?: (ctx: SeiteCtx<T, Z>) => boolean;
  /** Block UNTER der Export-Leiste (z. B. «Offene Verifikationen»). Als
   *  Funktion, wenn er von den Antworten abhängt. */
  pruefenFuss?: ReactNode | ((ctx: SeiteCtx<T, Z>) => ReactNode);
  /** Anhang an die Overline (` · <Zusatz>`), z. B. der gewählte Kanton. */
  overlineZusatz?: (ctx: SeiteCtx<T, Z>) => string;
  // Vorschau
  /** VorschauPanel in kompakter Schrift (Default false). */
  vorschauKompakt?: boolean;
  /** Ersetzt das VorschauPanel, solange es einen Knoten liefert (z. B.
   *  fachlicher Stopp: «Kein Dokument»). */
  vorschauErsatz?: (ctx: SeiteCtx<T, Z>) => ReactNode;
  /** Direkt-Export der Vorschau an gates.blocker binden (Default true). */
  direktExportBlocker?: boolean;
  /** Zusatz-Block im Vorschau-Panel (VorschauPanel `extra`). */
  vorschauExtra?: (ctx: SeiteCtx<T, Z>) => ReactNode;
  /** «nicht aufgenommen»-Liste des Bausteinprotokolls (VorschauPanel
   *  `nichtAufgenommen`, Default keine). */
  vorschauNichtAufgenommen?: (ctx: SeiteCtx<T, Z>) => { label: string; grund: string }[] | undefined;
  // Export — je als Wert oder als Funktion der Antworten (Form-Weiche)
  banner: JeAntwort<T, PdfBanner>;
  dateiBasis: JeAntwort<T, string>; // z. B. 'Abtretungserklaerung' → .pdf/.docx
  pdfLabel: JeAntwort<T, string>;
  docxLabel: JeAntwort<T, string>;
  /** Formvorschrift der SEITE sperrt DOCX zusätzlich zum Katalog-Gate
   *  docxAktiv (§8; z. B. eigenhändige Form). Default: keine Sperre. */
  docxSperre?: (a: T) => boolean;
}

export function VorlagenSeite<
  T extends object,
  Z extends Zusammenstellung = Zusammenstellung,
>(
  { config }: { config: VorlagenSeitenConfig<T, Z> },
) {
  const card = karte(config.cardId);
  // Profil-Prefill (Auftrag David): nur die SELBST-evidenten Absender-/Verfasser-
  // Felder vorbelegen (= die nutzende Person), und nur wenn das Schema sie führt.
  // Reiner Komfort (§3); leere Felder, gespeicherte Werte gewinnen (useWizardState).
  const prefill = config.profilPrefill === false ? undefined : ((): Partial<T> => {
    const profil = getProfil();
    const p: Record<string, unknown> = {};
    if (profil.name && 'absenderName' in config.defaults) p.absenderName = profil.name;
    if (profil.adresse && 'absenderAdresse' in config.defaults) p.absenderAdresse = profil.adresse;
    return p as Partial<T>;
  })();
  // Globaler Vorlagen-Detailgrad (Einstellungen) als Default, wenn die Vorlage das
  // Feld führt — ein gespeicherter Wizard-Stand oder eine Wizard-Wahl gewinnt weiter.
  const basis = config.defaultsZusatz ? { ...config.defaults, ...config.defaultsZusatz() } : config.defaults;
  const defaults = config.detailgradAusEinstellungen !== false && 'detailgrad' in basis
    ? { ...basis, detailgrad: getVorlagenDetailgrad() }
    : basis;
  const { a, setA, set, schritt, setSchritt, bestaetigt, setBestaetigt, kopiert, kopieren, zuruecksetzen } =
    useWizardState<T>({ defaults, speicherKey: config.speicherKey, normalisieren: config.normalisieren, prefill });

  // Vorauswahl aus der Adresse — «adjusting state» während des Renderns.
  const [vorauswahlStand, setVorauswahlStand] = useState<string | null>(null);
  if (config.vorauswahl && vorauswahlStand !== config.vorauswahl.schluessel) {
    setVorauswahlStand(config.vorauswahl.schluessel);
    const patch = config.vorauswahl.anwenden(a);
    if (patch) for (const k of Object.keys(patch) as (keyof T)[]) set(k, patch[k] as T[keyof T]);
  }

  const z = useMemo(() => config.zusammenstellen(a), [a, config]);
  const { ergebnis } = z;
  const gates = useMemo(() => config.pruefeGates(a, z), [a, z, config]);
  const ctx: SeiteCtx<T, Z> = { a, set, setA, z };
  const od = a as unknown as OrtDatum;
  const setOd = (k: keyof OrtDatum, v: string) => set(k as keyof T, v as T[keyof T]);
  const ortDatum = config.ortDatumImPruefen !== false;
  const banner = aufloesen(config.banner, a);
  const dateiBasis = aufloesen(config.dateiBasis, a);

  const letzter = config.schritte.length - 1;

  const fehlerImSchritt = (i: number): string[] => {
    if (i !== letzter || config.fehlerEingabeImLetztenSchritt) return config.fehlerEingabe(a, i, gates);
    const f: string[] = [];
    if (ortDatum && config.ortFehler && !od.ort.trim()) f.push(config.ortFehler);
    if (ortDatum && config.datumFehler && !istIsoDatum(od.datum)) f.push(config.datumFehler);
    if (config.blockerImLetztenSchritt !== false) f.push(...gates.blocker);
    return f;
  };
  const fehler = fehlerImSchritt(schritt);

  const docxZiel = (label: string) =>
    docxAktiv(card) && !config.docxSperre?.(a) ? { label, banner, dateiName: `${dateiBasis}.docx` } : undefined;

  const ortFehlt = !ortDatum || !config.ortFehler || od.ort.trim() ? '' : config.ortFehler;
  const datumFehlt = !ortDatum || !config.datumFehler || istIsoDatum(od.datum) ? '' : config.datumFehler;

  const pruefenInhalt = (
    <div className="space-y-5">
      {config.blockerKasten && gates.blocker.length > 0 && (
        <div role="alert" className="lc-notice-danger space-y-1">
          <p className="lc-overline text-danger-700 mb-1">{typeof config.blockerKasten === 'string' ? config.blockerKasten : 'Export gesperrt'}</p>
          {gates.blocker.map((b, i) => <p key={i} className="text-body-s text-danger-700">• <NormText text={b} /></p>)}
        </div>
      )}
      {config.blockerEinzeln && gates.blocker.map((b, i) => (
        <div role="alert" key={`b${i}`} className="lc-notice-danger">
          {typeof config.blockerEinzeln === 'string' && <p className="lc-overline text-danger-700 mb-1">{config.blockerEinzeln}</p>}
          <p className="text-body-s text-danger-700"><NormText text={b} /></p>
        </div>
      ))}
      {/* §8 (QS-UI 8b Teil 2): Bis hierher hing das Rendern der Engine-Warnungen an
          einem Opt-in-Flag `zeigeWarnungen`. Drei der fünf Seiten auf diesem Rahmen
          (Forderungsabtretung · Verjährungsverzicht · Rubrum) setzten es NICHT — heute
          folgenlos, weil ihre Engines nie in `warnungen` schreiben (nachgeprüft in
          `src/lib/vorlagen/{forderungsabtretung,verjaehrungsverzicht,rubrum}.ts`).
          Genau das ist die Falle: die erste Warnung, die eine dieser Engines je
          ergänzt, wäre still verschwunden — und §8 verbietet, eine Unsicherheit
          wegzuglätten. Das Flag ist darum weg; Warnungen werden immer gezeigt.
          DOM-neutral im Ist-Zustand (leere Liste rendert nichts).
          `data-vorbehalte` ist derselbe Tor-Griff wie auf den Rechner-Flächen. */}
      {gates.warnungen.map((w, i) => (
        <div key={`w${i}`} data-vorbehalte className="lc-notice-warn text-body-s"><NormText text={w} /></div>
      ))}
      {gates.hinweise.map((h, i) => (
        <div key={i} className="lc-notice text-body-s"><NormText text={h} /></div>
      ))}
      {config.pruefenZusatz?.(ctx)}

      {/* D5 (W2·24): Ort und Datum sind die einzigen Pflichtangaben, die IN
          diesem Schritt stehen — sie bekommen die Rückmeldung am Feld selbst
          (`aria-invalid` am nativen Ort-Feld über die `fehlt`-Prop; das
          DatumsFeld trägt die Fehlerzeile, siehe Field-Kommentar). Alles
          Übrige liegt in früheren Schritten und wird oben im Sammel-Befund
          samt Sprung angezeigt. */}
      {ortDatum && (
        <Field label={config.ortDatumLabel ?? ''} fehlt={ortFehlt || datumFehlt ? [ortFehlt, datumFehlt].filter(Boolean).join(' · ') : undefined}>
          <div className="grid grid-cols-[1fr_11rem] gap-3">
            <input className={inputCls} aria-invalid={ortFehlt ? true : undefined}
              value={od.ort} onChange={(e) => setOd('ort', e.target.value)} placeholder={config.ortPlaceholder} />
            <DatumsFeld value={od.datum} onChange={(v) => setOd('datum', v)} className={inputCls} />
          </div>
        </Field>
      )}

      {!config.ohneBestaetigung && (
        <section className="lc-highlight space-y-3">
          {typeof config.bestaetigung === 'function' ? config.bestaetigung(ctx) : config.bestaetigung}
          <Checkbox
            checked={bestaetigt}
            onChange={setBestaetigt}
            label={typeof config.bestaetigungLabel === 'function' ? config.bestaetigungLabel(ctx) : config.bestaetigungLabel}
            className={config.bestaetigungLabelCls ?? 'text-ink-900 font-medium pt-1'}
          />
        </section>
      )}

      {config.exportLeiste?.(ctx) !== false && (
        <ExportLeiste ergebnis={ergebnis} deaktiviert={(!config.ohneBestaetigung && !bestaetigt) || gates.blocker.length > 0}
          kopiert={kopiert} onKopieren={kopieren}
          pdf={{ label: aufloesen(config.pdfLabel, a), banner, dateiName: `${dateiBasis}.pdf` }}
          docx={docxZiel(aufloesen(config.docxLabel, a))} />
      )}
      {typeof config.pruefenFuss === 'function' ? config.pruefenFuss(ctx) : config.pruefenFuss}
    </div>
  );

  const inhalt = schritt === letzter ? pruefenInhalt : config.eingabeInhalt(ctx, schritt);

  return (
    <VorlagenWizardRahmen
      overline={`${card?.rechtsgebiet ?? config.overlineFallback} · Vorlage${config.overlineZusatz ? ` · ${config.overlineZusatz(ctx)}` : ''}`}
      titel={config.titel}
      intro={config.intro}
      norms={card?.norms ?? []}
      badge={config.badge}
      zuruecksetzen={zuruecksetzen}
      schritte={config.schritte} schritt={schritt} setSchritt={setSchritt}
      fehler={config.fehlerBox === false ? undefined : fehler}
      fehlerJeSchritt={config.pruefBefund?.(ctx) === false ? undefined : fehlerImSchritt}
      weiterDeaktiviert={config.weiterDeaktiviert?.(ctx, schritt)}
      kopfSchalter={config.kopfSchalter?.(ctx)}
      inhalt={inhalt}
      fussnote={config.fussnote}
      vorschau={config.vorschauErsatz?.(ctx) ?? <VorschauPanel ergebnis={ergebnis} kompakt={config.vorschauKompakt} extra={config.vorschauExtra?.(ctx)} nichtAufgenommen={config.vorschauNichtAufgenommen?.(ctx)} direktExport={{
        pdf: { label: 'PDF', banner, dateiName: `${dateiBasis}.pdf` },
        docx: docxZiel('DOCX'),
        blocker: config.direktExportBlocker === false ? undefined : gates.blocker,
      }} />}
    />
  );
}
