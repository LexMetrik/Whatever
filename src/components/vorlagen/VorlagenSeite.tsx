import { useMemo, useState, type ReactNode } from 'react';
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
// QS-CODE-ENTDOPPLUNG D1 (Tranche 1) — vier rückwärtskompatible Erweiterungen,
// damit sechs weitere Seiten hier landen konnten. Die fünf Pilot-Seiten ändern
// sich dadurch um exakt null Zeichen (alle vier sind optional bzw. per Default
// deckungsgleich mit dem bisherigen Verhalten):
//   • Typparameter `Z` — `zusammenstellen` darf neben `ergebnis` Rechenwerte
//     liefern (Beendigungsdatum, Rückzahlungsfrist); sie erreichen Gates und
//     Eingabe-Schritte über `ctx.z`, statt die Engine ein zweites Mal zu fahren.
//   • `kopfSchalter` — der VariantenKopf (Untertyp/Detailgrad) über dem Stepper.
//   • `fussnote` — durchgereicht an VorlagenWizardRahmen (Themen-Brücke).
//   • `bestaetigungLabelCls` — hält die vorgefundene Trefferfläche der
//     Bestätigungs-Zeile byte-gleich (siehe Feld-Kommentar).
// Ein Hook (z. B. usePaneKlasse) gehört NICHT direkt in `eingabeInhalt` — es
// läuft nur auf den Eingabe-Schritten, der Hook wechselte die Hook-Reihenfolge
// je Schritt. Braucht ein Schritt einen Hook, rendert `eingabeInhalt` eine
// Komponente der Seite (`<EingabeSchritt ctx schritt />`), die ihn aufruft.
// W2·29-WERKBANK-VORLAGEN V2a — fünf optionale Slots (normalisieren,
// profilPrefill, blockerKasten, pruefenZusatz, bestaetigung als Funktion), je
// per Default deckungsgleich mit dem bisherigen Verhalten: Darstellung bzw.
// Zustands-Hygiene, NIE Fachlogik.
// V2c (Verträge) — drei weitere optionale Slots (detailgradAusEinstellungen,
// vorauswahl, pruefenFuss) und zwei Erweiterungen (blockerKasten mit eigener
// Überschrift, ortFehler optional), wieder je per Default deckungsgleich.

/** Einheitliche Gate-Form aller Vorlagen-Engines. */
type VorlagenGates = { blocker: string[]; warnungen: string[]; hinweise: string[] };

/** Mindest-Form des Assemble-Ergebnisses. Engines, die daneben Rechenwerte
 *  liefern (Beendigungsdatum, Rückzahlungsfrist), tragen diese in `Z` — der
 *  Rahmen reicht sie unverändert an Gates und Eingabe-Schritte durch. */
type Zusammenstellung = { ergebnis: AssembleErgebnis };

/** Kontext für die Eingabe-Schritt-Renderer der Seite. `z` ist das ungekürzte
 *  Ergebnis von `zusammenstellen` — damit ein Schritt einen Engine-Rechenwert
 *  anzeigen kann, OHNE die Engine ein zweites Mal zu fahren (§2/§15). */
export interface SeiteCtx<T, Z = Zusammenstellung> {
  a: T;
  set: <K extends keyof T>(k: K, v: T[K]) => void;
  z: Z;
}

export interface VorlagenSeitenConfig<
  T extends { ort: string; datum: string },
  Z extends Zusammenstellung = Zusammenstellung,
> {
  /** Katalog-Id (startseiteConfig) — liefert rechtsgebiet, norms, modus/output. */
  cardId: string;
  defaults: T;
  speicherKey: string;
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
  // «pruefen»-Schritt
  /** «Export gesperrt»-Box (role=alert) mit den gates.blocker oben im
   *  Prüfen-Schritt (Default false). Ein String ersetzt die Überschrift. */
  blockerKasten?: boolean | string;
  /** Seiten-Block zwischen den Hinweisen und Ort/Datum (z. B. Endtermin-
   *  Kachel aus `ctx.z`). */
  pruefenZusatz?: (ctx: SeiteCtx<T, Z>) => ReactNode;
  /** Ob der letzte-Schritt-Fehler die gates.blocker enthält (Default true).
   *  false z. B. bei Mahnung, deren Navigations-Fehler nur Ort/Datum prüft
   *  (Blocker sperren dort nur den Export, nicht die Fehlerbox). */
  blockerImLetztenSchritt?: boolean;
  ortDatumLabel: string;
  ortPlaceholder: string;
  /** Fehlertext bei leerem Ort. Fehlt er, ist der Ort keine Pflichtangabe
   *  (kein Eintrag in Fehlerbox/Sammel-Befund, kein aria-invalid). */
  ortFehler?: string;
  datumFehler: string;
  /** Inhalt der lc-highlight-Sektion ÜBER der Bestätigungs-Checkbox. Als
   *  Funktion, wenn ein Bullet von den Antworten abhängt. */
  bestaetigung: ReactNode | ((ctx: SeiteCtx<T, Z>) => ReactNode);
  bestaetigungLabel: ReactNode;
  /** Klassen der Bestätigungs-Zeile. Default ist die Form der fünf Pilot-Seiten
   *  (`gap-2`, kein Padding). Die handgeschriebenen Seiten tragen historisch
   *  `gap-2.5 py-1.5` — die grössere Trefferfläche (DESIGN-REGLEMENT F9). Beim
   *  Umzug auf den Rahmen bleibt die vorgefundene Form erhalten, statt sie still
   *  zu verkleinern (§6). Die Vereinheitlichung ist eine SICHTBARE Änderung und
   *  gehört in einen eigenen, deklarierten Schritt (W2·17-UI-BEFUNDE-B10). */
  bestaetigungLabelCls?: string;
  /** Block UNTER der Export-Leiste (z. B. «Offene Verifikationen»). */
  pruefenFuss?: ReactNode;
  // Export
  banner: PdfBanner;
  dateiBasis: string;             // z. B. 'Abtretungserklaerung' → .pdf/.docx
  pdfLabel: string;
  docxLabel: string;
}

export function VorlagenSeite<
  T extends { ort: string; datum: string },
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
  const defaults = config.detailgradAusEinstellungen !== false && 'detailgrad' in config.defaults
    ? { ...config.defaults, detailgrad: getVorlagenDetailgrad() }
    : config.defaults;
  const { a, set, schritt, setSchritt, bestaetigt, setBestaetigt, kopiert, kopieren, zuruecksetzen } =
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
  const ctx: SeiteCtx<T, Z> = { a, set, z };

  const letzter = config.schritte.length - 1;

  const fehlerImSchritt = (i: number): string[] => {
    if (i !== letzter) return config.fehlerEingabe(a, i, gates);
    const f: string[] = [];
    if (config.ortFehler && !a.ort.trim()) f.push(config.ortFehler);
    if (!istIsoDatum(a.datum)) f.push(config.datumFehler);
    if (config.blockerImLetztenSchritt !== false) f.push(...gates.blocker);
    return f;
  };
  const fehler = fehlerImSchritt(schritt);

  const docxZiel = (label: string) =>
    docxAktiv(card) ? { label, banner: config.banner, dateiName: `${config.dateiBasis}.docx` } : undefined;

  const ortFehlt = !config.ortFehler || a.ort.trim() ? '' : config.ortFehler;
  const datumFehlt = istIsoDatum(a.datum) ? '' : config.datumFehler;

  const pruefenInhalt = (
    <div className="space-y-5">
      {config.blockerKasten && gates.blocker.length > 0 && (
        <div role="alert" className="lc-notice-danger space-y-1">
          <p className="lc-overline text-danger-700 mb-1">{typeof config.blockerKasten === 'string' ? config.blockerKasten : 'Export gesperrt'}</p>
          {gates.blocker.map((b, i) => <p key={i} className="text-body-s text-danger-700">• <NormText text={b} /></p>)}
        </div>
      )}
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
      <Field label={config.ortDatumLabel} fehlt={ortFehlt || datumFehlt ? [ortFehlt, datumFehlt].filter(Boolean).join(' · ') : undefined}>
        <div className="grid grid-cols-[1fr_11rem] gap-3">
          <input className={inputCls} aria-invalid={ortFehlt ? true : undefined}
            value={a.ort} onChange={(e) => set('ort', e.target.value as T['ort'])} placeholder={config.ortPlaceholder} />
          <DatumsFeld value={a.datum} onChange={(v) => set('datum', v as T['datum'])} className={inputCls} />
        </div>
      </Field>

      <section className="lc-highlight space-y-3">
        {typeof config.bestaetigung === 'function' ? config.bestaetigung(ctx) : config.bestaetigung}
        <Checkbox
          checked={bestaetigt}
          onChange={setBestaetigt}
          label={config.bestaetigungLabel}
          className={config.bestaetigungLabelCls ?? 'text-ink-900 font-medium pt-1'}
        />
      </section>

      <ExportLeiste ergebnis={ergebnis} deaktiviert={!bestaetigt || gates.blocker.length > 0}
        kopiert={kopiert} onKopieren={kopieren}
        pdf={{ label: config.pdfLabel, banner: config.banner, dateiName: `${config.dateiBasis}.pdf` }}
        docx={docxZiel(config.docxLabel)} />
      {config.pruefenFuss}
    </div>
  );

  const inhalt = schritt === letzter ? pruefenInhalt : config.eingabeInhalt(ctx, schritt);

  return (
    <VorlagenWizardRahmen
      overline={`${card?.rechtsgebiet ?? config.overlineFallback} · Vorlage`}
      titel={config.titel}
      intro={config.intro}
      norms={card?.norms ?? []}
      badge={config.badge}
      zuruecksetzen={zuruecksetzen}
      schritte={config.schritte} schritt={schritt} setSchritt={setSchritt}
      fehler={fehler}
      fehlerJeSchritt={fehlerImSchritt}
      kopfSchalter={config.kopfSchalter?.(ctx)}
      inhalt={inhalt}
      fussnote={config.fussnote}
      vorschau={<VorschauPanel ergebnis={ergebnis} direktExport={{
        pdf: { label: 'PDF', banner: config.banner, dateiName: `${config.dateiBasis}.pdf` },
        docx: docxZiel('DOCX'),
        blocker: gates.blocker,
      }} />}
    />
  );
}
