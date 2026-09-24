import { cloneElement, createContext, isValidElement, useContext, useId, useState } from 'react';
import { fedlexLinkFuerArtikel } from '../../lib/fedlex';
import { NormText } from '../NormText';
import { usePaneKontext } from '../layout/PaneKontext';
import { useKopieren } from '../useKopieren';
import { NormChip } from './NormChip';
import { GruppenKopf } from '../ui/GruppenKopf';
import { useZielSichtbar } from './useZielSichtbar';

// Geteilter Formular-Baukasten BEIDER Werkzeug-Familien — Rechner und Vorlagen
// (Field, inputCls, FehlerBox, BeruehrtRahmen, Stepper, EckdatenKachel, …;
// gezählt 24.9.2026: 37 Rechner- und 40 Vorlagen-Importer). Der Ort unter
// `vorlagen/` ist historisch; ein Umzug wäre ein 77-Dateien-Churn ohne
// Verhaltenswert (Entscheid W2·29-WERKBANK-RECHNER R4).

export const inputCls = 'lc-input';

/** Geteilter Datenschutz-Hinweis für Vorlagen, deren Eingaben (anders als der
 *  Wizard-Standardtext in `wizard.tsx`) NICHT lokal zwischengespeichert
 *  werden — bisher drei Formulierungen in sechs Vorlagen (Familienrecht:
 *  Vollversalien-"NICHT"; ZPO-Eingaben: Nebensatz), jetzt eine (W2·19-
 *  DESIGN-KONSISTENZ R6-D, 5.9.2026). Wortlaut = die ZPO-Fassung: verstösst
 *  nicht gegen A2 (kein ALL-CAPS-Fliesstext, DESIGN-REGLEMENT.md), die
 *  Vollversalien-Fassung schon. AG-Gründung bleibt bewusst separat — dort
 *  wird tatsächlich lokal zwischengespeichert, andere Tatsachenlage. */
export const NICHT_GESPEICHERT_HINWEIS =
  'Eingaben werden nicht gespeichert – sie bestehen nur, solange diese Seite geöffnet ist.';

/** HTML-«labelable elements», soweit in Formularen dieses Hauses gebraucht.
 *  Steuert, wann `Field` `htmlFor` setzen darf (siehe dort). */
const BESCHRIFTBAR = ['input', 'select', 'textarea'];

export function Field({ label, children, hint, optional, fehlt }: {
  /** Beschriftung. `ReactNode` (R2-E/F1-2), weil einzelne Felder dem Namen eine
   *  leise Präzisierung nachstellen («Zugang Kündigung (Stichtag B/C)») — die
   *  gehörte bis dahin zu den Gründen, warum ein Formular am Baustein
   *  vorbeibaute. Der Normalfall bleibt ein String. */
  label: React.ReactNode; children: React.ReactNode; hint?: string; optional?: boolean;
  /** D5 (W2·24): Meldung zu genau DIESEM Feld. Gesetzt heisst «Pflichtangabe
   *  fehlt/ist ungültig» — das native Control bekommt `aria-invalid` und eine
   *  Fehlerzeile, auf die es per `aria-describedby` zeigt. Bis D5 trug ein
   *  Vorlagen-Formular seine Fehler AUSSCHLIESSLICH in der Sammel-Box am Fuss
   *  der Karte; gemessen am 6./7.9.2026 (Befund D5) waren es auf
   *  `/vorlagen/schlichtungsgesuch-bs` 0 × `aria-invalid` im ganzen Wizard.
   *  Wer die Prop nicht setzt, bekommt exakt das bisherige Feld (§6). */
  fehlt?: string;
}) {
  // Label↔Control-Verknüpfung (FAHRPLAN-DESIGN 3.6): native Einzel-Controls
  // (input/select/textarea) bekommen automatisch id + htmlFor; zusammengesetzte
  // Einzel-Komponenten (DatumsFeld, BetragsFeld) bekommen das Label per
  // aria-labelledby aufs innere input gereicht (axe-Befund label/critical,
  // 10.6.2026) — ein Label-Wrap wäre dort riskant (Klick-Redispatch ins
  // Kalender-Popover). Eigenes aria-label des Kindes hat Vorrang.
  const id = useId();
  // NUR beschriftbare Elemente (QS-UI Teilpass (e), 5.9.2026): «type ist ein
  // String» hielt auch ein `<div>`-Wrapper für ein natives Control — `htmlFor`
  // zeigte dann auf ein DIV, das keine Beschriftung annehmen kann, und die
  // echten Controls darin blieben NAMENLOS. Gemessen am neuen Flächen-Tor:
  // `/rechner/schkg-fristen` meldete `label` (critical) UND `select-name`
  // (critical) für das Paar Zahl+Einheit in EINEM `<Field>`. `BESCHRIFTBAR` ist
  // die HTML-Menge der «labelable elements», soweit hier gebraucht; alles andere
  // fällt in den aria-labelledby-Zweig bzw. bleibt unangetastet.
  const nativ = isValidElement(children) && typeof children.type === 'string'
    && BESCHRIFTBAR.includes(children.type)
    && !(children.props as { id?: string }).id;
  const komposit = isValidElement(children) && typeof children.type !== 'string'
    && (children.props as Record<string, unknown>)['aria-label'] === undefined
    && (children.props as Record<string, unknown>)['aria-labelledby'] === undefined;
  // D5: `aria-invalid`/`aria-describedby` NUR auf ein natives Control — ein
  // zusammengesetztes Kind (DatumsFeld, BetragsFeld) reicht unbekannte Props
  // nicht an sein inneres <input> weiter, das Attribut landete dann auf einem
  // Wrapper-DIV und wäre eine Behauptung ohne Wirkung (§8). Dort bleibt die
  // sichtbare Fehlerzeile die ganze Aussage.
  const fehlerId = `${id}-fehler`;
  const invalid = nativ && fehlt
    ? { 'aria-invalid': true as const, 'aria-describedby': fehlerId }
    : {};
  const control = nativ
    ? cloneElement(children as React.ReactElement<{ id?: string }>, { id, ...invalid })
    : komposit
      ? cloneElement(children as React.ReactElement<{ 'aria-labelledby'?: string }>, { 'aria-labelledby': `${id}-label` })
      : children;
  return (
    <div className="space-y-1">
      <label id={`${id}-label`} htmlFor={nativ ? id : undefined} className="block text-body-s font-medium text-ink-700">
        {label}{optional && <span className="text-ink-500 font-normal"> · optional</span>}
      </label>
      {control}
      {/* ink-500 → ink-600 (QS-UI Teilpass (e), 5.9.2026 — dieselbe Richtung wie
          `lc-overline`/`lc-fineprint` auf Auftrag David 25.6.2026): der Hinweis
          ist 12-px-Kleintext und lag mit ink-500 nur knapp über AA. Auf einer
          getönten Fläche riss er: gemessen am neuen Flächen-Tor
          `/rechner/schkg-fristen`, Hinweis im brass-Vorlagenkasten
          #6F6B61 auf #F1E8D6 = 4.36:1 (AA verlangt 4.5). ink-600 (#56534C)
          liefert dort 6.35:1 und auf `--paper` 7.4:1 — AA auf JEDER Fläche des
          Hauses, statt einer Ausnahme je Kasten. */}
      {hint && <p className="text-xs text-ink-600"><NormText text={hint} /></p>}
      {/* D5: die Fehlerzeile steht AM Feld, nicht nur in der Sammel-Box —
          `role=alert` bleibt der Sammel-Box vorbehalten (sonst rufen bei einem
          leeren Formular ein Dutzend Zeilen gleichzeitig), die Verbindung zum
          Control macht `aria-describedby`. */}
      {fehlt && <p id={fehlerId} className="text-xs text-danger-700"><NormText text={fehlt} /></p>}
    </div>
  );
}

/** Geteiltes Ankreuzfeld (Redesign E11) — eine Trefferzeile (≥44px Touch),
 *  gebrandetes Häkchen (accent-color global), einheitlicher Abstand und
 *  Fokus. Ersetzt schrittweise die ~290 inline-Label-Checkboxen. Reine
 *  Darstellung (§3) — der Zustand bleibt beim aufrufenden Formular. */
export function Checkbox({ checked, onChange, label, hint, disabled, name, className = '' }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
  name?: string;
  /** Zusatzklassen am Label (z. B. pl-6 für eingerückte Unter-Optionen). */
  className?: string;
}) {
  return (
    <label className={`flex items-start gap-2.5 py-1.5 min-h-[2.25rem] text-body-s ${disabled ? 'text-ink-500 cursor-not-allowed' : 'text-ink-700 cursor-pointer'}${className ? ' ' + className : ''}`}>
      {/* Grössenklasse (B12 #675, QS-UI 5.9.2026): explizit `h-[1.1rem]
          w-[1.1rem]` statt implizit über `input[type="checkbox"]` in
          index.css — deckt sich zahlengleich mit der globalen Regel (1.1rem,
          Redesign E7), ändert am gebauten Stand also NICHTS (gemessen
          `/rechner/zpo-fristen`: 17.59×17.59 px vorher/nachher), macht die
          Grösse aber am Baustein selbst nachlesbar/testbar statt nur über
          einen Typ-Selektor im globalen Stylesheet. Es gibt (noch) keinen
          geteilten Radio-/Switch-Baustein zum Angleichen — beide sind app-
          weit rohe `<input>`, ebenfalls von derselben globalen Regel erfasst. */}
      <input type="checkbox" name={name} checked={checked} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)} className="mt-0.5 shrink-0 h-[1.1rem] w-[1.1rem]" />
      <span className="min-w-0">
        {label}
        {hint && <span className="block text-xs text-ink-500">{hint}</span>}
      </span>
    </label>
  );
}

/** Listen-Editor («Repeater») — EIN Baustein für jede wiederholbare Zeile
 *  (Begehren, Kinder, Beilagen, Sperrereignisse, Gründer:innen …).
 *
 *  ANLASS (Design-Konsistenz R2-F/F1-9, 31.8.2026): gemessen waren 43
 *  Hinzufügen-Knöpfe in 20 Dateien — in DREI Optiken (`lc-btn-outline
 *  lc-btn-sm`, nacktes `lc-btn-outline`, ein handgebautes `px-3 py-1.5
 *  bg-surface hover:bg-brass-100 rounded-lg` in SperrereignisseEditor), in
 *  ZWEI Beschriftungsgrammatiken («+ Begehren» 19× vs. «+ Begehren
 *  hinzufügen» 24×) und mit vier Entfernen-Formen («Entfernen» gross,
 *  «entfernen» klein, `lc-btn-ghost lc-btn-sm` mit aria-label,
 *  `text-ink-500 hover:text-danger-700`). Die Einträge sassen mal in
 *  `lc-panel`, mal in einem handgebauten `border border-line rounded-md`,
 *  mal in gar keinem Behälter.
 *
 *  KANON (Mehrheitsform, §5/§10):
 *  - Behälter je Eintrag: `lc-panel p-3` — dieselbe Fläche wie in
 *    VerzugszinsForm/SperrereignisseEditor, die sie schon trugen.
 *  - Kopfzeile je Eintrag: Overline «<Element> N», rechts der Entfernen-Link.
 *  - Entfernen: roter Text-Link, klein, Wortlaut «entfernen» (20:9 gegen
 *    «Entfernen»); dazu ein sprechendes `aria-label`, weil zwanzig gleich
 *    beschriftete Links sonst in der Vorlesereihenfolge nicht unterscheidbar
 *    sind.
 *  - Hinzufügen: `lc-btn-outline lc-btn-sm`, Beschriftung «+ <Element>» ohne
 *    «hinzufügen» — das Pluszeichen sagt die Handlung bereits, das Wort
 *    verdoppelt sie nur (und bricht auf schmalen Panes in die zweite Zeile).
 *
 *  Reine Darstellung (§3): der Zustand — und damit jede fachliche Regel über
 *  Mindest-/Höchstzahl von Einträgen — bleibt beim aufrufenden Formular; der
 *  Baustein bekommt sie nur als Zahl (`mindestens`/`hoechstens`) gereicht. */
export function ListenEditor<T>({
  element, eintraege, onHinzufuegen, onEntfernen, kinder,
  kopf, leer, mindestens = 0, hoechstens, weitere, schluessel, className = 'space-y-3',
}: {
  /** Singular-Name eines Eintrags («Begehren», «Kind», «Ereignis»). Trägt die
   *  Knopf-Beschriftung, die Vorgabe-Kopfzeile und das Entfernen-aria-label. */
  element: string;
  eintraege: readonly T[];
  onHinzufuegen: () => void;
  onEntfernen: (index: number) => void;
  /** Inhalt eines Eintrags (Felder). Der Behälter kommt vom Baustein. */
  kinder: (eintrag: T, index: number) => React.ReactNode;
  /** Ersetzt die Vorgabe-Kopfzeile «<Element> N»; `null` lässt sie weg. */
  kopf?: ((eintrag: T, index: number) => React.ReactNode) | null;
  /** Satz für die leere Liste (sonst steht dort nichts). */
  leer?: React.ReactNode;
  /** Bis zu dieser Anzahl wird kein «entfernen» angeboten (z. B. ein
   *  Rechtsbegehren muss stehen bleiben). */
  mindestens?: number;
  /** Ab dieser Anzahl verschwindet der Hinzufügen-Knopf. */
  hoechstens?: number;
  /** Weitere Hinzufügen-Knöpfe DERSELBEN Liste (VerzugszinsForm:
   *  «+ Teilzahlung» und «+ Satzänderung» füllen eine Ereignis-Liste). */
  weitere?: readonly { element: string; onHinzufuegen: () => void }[];
  /** React-Schlüssel je Eintrag; Vorgabe ist der Index. */
  schluessel?: (eintrag: T, index: number) => React.Key;
  className?: string;
}) {
  const zeigeEntfernen = eintraege.length > mindestens;
  const entfernenKnopf = (i: number, extra = '') => (
    <button type="button" onClick={() => onEntfernen(i)}
      aria-label={`${element} ${i + 1} entfernen`}
      className={`text-body-s text-danger-700 hover:underline${extra}`}>entfernen</button>
  );
  return (
    <div className={className}>
      {eintraege.length === 0 && leer && <p className="text-body-s text-ink-500">{leer}</p>}
      {eintraege.map((e, i) => (
        <div key={schluessel ? schluessel(e, i) : i} className="lc-panel p-3 space-y-2">
          {kopf !== null && (
            <div className="flex items-baseline justify-between gap-3">
              <p className="lc-overline text-brass-700 min-w-0">{kopf ? kopf(e, i) : `${element} ${i + 1}`}</p>
              {zeigeEntfernen && entfernenKnopf(i, ' shrink-0')}
            </div>
          )}
          {kinder(e, i)}
          {kopf === null && zeigeEntfernen && entfernenKnopf(i)}
        </div>
      ))}
      {(hoechstens === undefined || eintraege.length < hoechstens) && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onHinzufuegen} className="lc-btn-outline lc-btn-sm">{`+ ${element}`}</button>
          {weitere?.map((w) => (
            <button key={w.element} type="button" onClick={w.onHinzufuegen} className="lc-btn-outline lc-btn-sm">{`+ ${w.element}`}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Sektions-Kopf innerhalb eines Wizard-Schritts (Redesign, Entscheid David):
 *  Overline (Messing) + Haarlinie — gleiche Anatomie wie die Abschnitts-Köpfe
 *  der Rechner/des Katalogs, damit lange Schritte in lesbare Sektionen
 * zerfallen. Ersetzt das zuvor leise <p className="lc-overline">-Muster.
 *
 *  B3-1 (R3-β, 31.8.2026): «gleiche Anatomie wie …» war bis hierher eine
 *  zeichengleiche KOPIE der Anatomie von `ui/GruppenKopf` — ohne dessen
 *  Zähler-Kanon und ohne die Wächter, die dort hängen. Jetzt ein dünner Aufruf
 *  (§5/§10). Das `<p>` statt einer Überschrift bleibt: der Wizard-Schritt
 *  trägt seine Überschrift schon, diese Sektionen sollen im Dokument-Outline
 *  nichts eröffnen — genau dafür trägt der Baustein `als="p"`. */
export function GruppenTitel({ children }: { children: React.ReactNode }) {
  return <GruppenKopf als="p" titel={children} />;
}

/** Dünner Wrapper auf NormChip — bewahrt das heutige NormLink-Markup
 *  byte-genau: der Default-title («… auf Fedlex öffnen») gilt nur, wenn der
 *  Chip wirklich als Link rendert; im span-Fallback (unbekanntes Gesetz) bleibt
 *  der title roh wie bisher (undefined → kein Attribut). */
export function NormLink({ artikel, title, bemerkung }: { artikel: string; title?: string; bemerkung?: string }) {
  const istLink = fedlexLinkFuerArtikel(artikel) !== null;
  return (
    <NormChip
      artikel={artikel}
      title={istLink ? (title ?? `${artikel} auf Fedlex öffnen`) : title}
      anzeige={
        <>
          {/* LM-103: das Zitat selbst («Art. 60 Abs. 1bis OR») darf am
              Zeilenende nie mitten im Erlasskürzel brechen — whitespace-nowrap
              NUR auf den Zitat-Teil, nicht auf eine allfällige `bemerkung`
              (die kann lang sein und soll normal umbrechen dürfen; einziger
              zentraler Fix-Ort, da NormLink von allen betroffenen Rechnern
              geteilt wird, §5). */}
          <span className="whitespace-nowrap">{artikel}</span>
          {bemerkung && <span className="text-ink-600"> · {bemerkung}</span>}
        </>
      }
    />
  );
}

// Stepper-Leiste (klickbar bis zum erreichten Schritt).
// W2·29-WERKBANK-VORLAGEN V1: eine REITERZEILE (Board «Unter-Vorlage-Wizard») —
// Haarlinie unter der Zeile, der aktive Schritt trägt die 2-px-Unterkante im
// Werkzeug-Register (`--reg-w`), erledigte Schritte das ✓ in derselben Farbe
// (Glyphe = Form, nicht Farbe allein: F2/B3). Kein Gewichtswechsel am aktiven
// Reiter — die Zeile darf beim Umschalten nicht springen (wie `.ub-schalter`).
export function Stepper({ schritte, aktiv, onWechsel }: {
  schritte: readonly { id: string; label: string }[];
  aktiv: number;
  onWechsel: (i: number) => void;
}) {
  const anteil = (aktiv + 1) / schritte.length;
  return (
    <nav aria-label="Schritte">
      {/* Mobile: kompakter Fortschritt statt Reiter-Wolke (Redesign E6). */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="lc-overline shrink-0">Schritt <span className="num">{aktiv + 1}</span>/<span className="num">{schritte.length}</span></span>
          <span className="text-body-s font-medium text-ink-700 truncate text-right">{schritte[aktiv].label}</span>
        </div>
        <div className="h-1 bg-well overflow-hidden"
          role="progressbar" aria-valuenow={aktiv + 1} aria-valuemin={1} aria-valuemax={schritte.length}>
          <div className="h-full bg-reg-w origin-left transition-transform motion-reduce:transition-none" style={{ transform: `scaleX(${anteil})` }} />
        </div>
      </div>
      {/* Desktop: EINE Zeile; bei Platzmangel waagrechter Scroll mit Rand
          (`lc-scrollrand-x`) statt Umbruch — eine zweizeilige Leiste liest
          sich wie zwei Gruppen (R5-F2/D6). */}
      <div className="hidden sm:flex gap-x-0.5 overflow-x-auto lc-scrollrand-x border-b border-line">
        {schritte.map((s, i) => {
          const erledigt = i < aktiv;
          const istAktiv = i === aktiv;
          return (
            <button key={s.id} type="button" onClick={() => i <= aktiv && onWechsel(i)}
              aria-current={istAktiv ? 'step' : undefined}
              // LM-058 (B15): Unerreichbarkeit wird GESAGT (`aria-disabled` +
              // `title`), nicht mit `disabled` erzwungen — das nähme den Reiter
              // aus der Tabreihenfolge und änderte die Bedienung (§3).
              aria-disabled={i > aktiv ? true : undefined}
              title={i > aktiv ? 'Noch nicht erreichbar — vorherige Schritte zuerst ausfüllen' : undefined}
              className={`-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                istAktiv ? 'border-reg-w text-ink-900'
                : erledigt ? 'border-transparent text-ink-900 hover:border-line-strong'
                : 'border-transparent text-ink-600 cursor-not-allowed'
              }`}>
              {/* GB-21: Ziffer blank in der Zeile, kein Kästchen; erledigt = ✓. */}
              <span className={`num ${istAktiv || erledigt ? 'text-reg-w' : ''}`}>{erledigt ? '✓' : i + 1}</span>
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Geteilte Engine-UI (UX-Programm Etappe 1, 5.6.2026) ────────────────────
// Entdoppelung wortgleicher Muster aus den 12 Rechner-Formularen (§10).

/** Live-Hinweis über dem Ergebnisblock — vorher 9× wortgleich dupliziert. */
export function LiveHeader() {
  return (
    <p className="lc-live lc-overline lc-overline-soft">
      Live-Berechnung – aktualisiert sich automatisch
    </p>
  );
}

// Grundsatz David (14.6.2026): im leeren Anfangszustand keine Eingabefehler.
// FehlerBox wird erst sichtbar, wenn das umschliessende Formular «berührt»
// wurde. Default true → ausserhalb eines BeruehrtRahmen (z. B. Vorlagen-
// Wizards, die selbst gaten) unverändert. BeruehrtRahmen ist layout-transparent
// (display:contents) und setzt «berührt» beim ersten onInput/onChange.
const BeruehrtContext = createContext(true);

export function BeruehrtRahmen({ children }: { children: React.ReactNode }) {
  const [beruehrt, setBeruehrt] = useState(false);
  const merke = () => { if (!beruehrt) setBeruehrt(true); };
  return (
    <BeruehrtContext.Provider value={beruehrt}>
      {/* Bewusst nur onInput/onChange (keine onClick): ein Fokus-Klick ins leere
          Feld ist noch keine Eingabe und darf keine Fehler zeigen (Grundsatz
          David). Reine Klick-Auswahlen (SelectionGrid) lösen «berührt» daher
          erst über ein begleitendes Feld aus — in der Praxis unkritisch, da
          Fehler dieser Formulare von onChange-Feldern abhängen. */}
      <div className="contents" onInput={merke} onChange={merke}>{children}</div>
    </BeruehrtContext.Provider>
  );
}

/** Einheitliche Eingabefehler-Box (vorher 4 Varianten; immer role="alert"). */
export function FehlerBox({ fehler }: { fehler: string[] }) {
  const beruehrt = useContext(BeruehrtContext);
  if (!beruehrt || fehler.length === 0) return null;
  return (
    <div role="alert" className="lc-notice lc-notice-danger space-y-1">
      <p className="lc-overline text-danger-700 mb-1">Eingabefehler</p>
      {fehler.map((f, i) => <p key={i} className="text-body-s text-danger-700">• <NormText text={f} /></p>)}
    </div>
  );
}

/** Kopier-Knopf — EIN Baustein für alle «… in die Zwischenablage»-Knöpfe
 *  (R2-E/F1-10). Vorher standen drei Bauformen nebeneinander: `lc-btn-outline
 *  lc-btn-sm` mit «Absatz kopieren» (BegruendungAbsatz), `lc-btn-outline` mit
 *  «Text kopieren» (ExportLeiste) und `lc-btn-ghost lc-btn-sm` mit dem nackten
 *  «Kopieren» (ErgebnisAnzeige) — gleiche Handlung, drei Optiken und zwei
 *  Beschriftungsgrammatiken.
 *
 *  Kanon: `lc-btn-outline lc-btn-sm`, Label «<Gegenstand> kopieren», Erfolg
 *  «Kopiert ✓». `gegenstand` benennt, WAS kopiert wird (Absatz · Text ·
 *  Ergebnis) — ein Knopf ohne Gegenstand lässt offen, was in der Zwischenablage
 *  landet.
 *
 *  Die Mechanik ist `useKopieren`: «Kopiert ✓» erscheint erst NACH erfolgreichem
 *  Schreiben (eine verweigerte Clipboard-Berechtigung darf keinen Erfolg
 *  vortäuschen, §8). Wo der Zustand schon beim Aufrufer liegt (ExportLeiste
 *  bekommt ihn aus `useVorlage`), werden `kopiert`/`onKopieren` durchgereicht —
 *  dann steuert der Aufrufer, die Optik bleibt trotzdem die eine. */
export function KopierButton({
  text, gegenstand, className = 'lc-btn-outline lc-btn-sm', disabled, kopiert: kopiertExtern, onKopieren,
}: {
  text: string;
  gegenstand: string;
  className?: string;
  disabled?: boolean;
  /** Gesteuerter Modus (nur zusammen mit `onKopieren`). */
  kopiert?: boolean;
  onKopieren?: (text: string) => void;
}) {
  const eigen = useKopieren(text);
  const gesteuert = kopiertExtern !== undefined && onKopieren !== undefined;
  const kopiert = gesteuert ? kopiertExtern : eigen.kopiert;
  return (
    <button type="button" disabled={disabled} className={className}
      onClick={() => (gesteuert ? onKopieren(text) : eigen.kopieren())}>
      {kopiert ? 'Kopiert ✓' : `${gegenstand} kopieren`}
    </button>
  );
}

/** Beispiel-Chips über den Eingaben (UX A5) — vorher 2× wortgleich dupliziert;
 *  die Beispiel-INHALTE bleiben fachlich beim jeweiligen Formular. */
export function BeispielChips({ items }: { items: { label: string; laden: () => void }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="lc-overline lc-overline-soft">Beispiel laden:</span>
      {items.map((b) => (
        <button type="button" key={b.label} onClick={b.laden} className="lc-chip hover:bg-brass-200 transition-colors">{b.label}</button>
      ))}
    </div>
  );
}

/** Eckdaten-Kachel (UX C2) — vorher in 6+ Formularen wortgleich dupliziert.
 *  Nur die einfache Label/Wert(-Sub)-Form; Spezialkacheln (z. B. Verjährungs-
 *  FristKarte mit «massgeblich»-Badge) bleiben bewusst eigenständig.
 *  `akzent` markiert die EINE wichtigste Kachel des Blocks mit der
 *  Werkzeug-Oberkante und -Fläche `.lc-akzent-w` (DESIGN-REGLEMENT §R-4 Ziff. 1). */
export function EckdatenKachel({ label, wert, sub, num, akzent }: { label: string; wert: string; sub?: string; num?: boolean; akzent?: boolean }) {
  return (
    <div className={akzent ? 'lc-tile lc-akzent-w' : 'lc-tile'}>
      <p className="text-xs text-ink-500 mb-1">{label}</p>
      {/* key={wert}: bei Wertänderung re-mountet der Knoten → der lc-wert-puls
          läuft erneut, also wird die Live-Neuberechnung sichtbar (Redesign E8). */}
      <p key={wert} className={`lc-wert-puls text-body-l font-semibold text-ink-900${num ? ' num' : ''}`}>{wert}</p>
      {sub && <p className="text-xs text-ink-500 mt-0.5">{sub}</p>}
    </div>
  );
}

/** Leerzustand des Ergebnisplatzes (W2·10-UI-NAV/N0d·W1) — reserviert die Fläche
 *  mit fester Mindesthöhe (CLS-positiv, §15.2) und sagt an, WAS erscheint, ohne vor
 *  der ersten Eingabe einen Fehler zu zeigen (C2/§13).
 *
 *  QS-UI 8b (4.8.2026): Aus `StreitwertForm` hierher gehoben (§10 — ein Muster statt
 *  Einzellösungen). Das Audit fand ihn in genau EINER der sechs Rechner-Flächen, die
 *  ohne Eingabe kein Ergebnis zeigen; auf den übrigen blieb an der Stelle des
 *  künftigen Ergebnisses nichts — der Nutzer sah nicht, dass dort eines erscheint.
 *
 *  `was` beschreibt in einem Satz, welche Eingabe fehlt und was danach erscheint.
 *  Der Satz ist reine Navigation: er nennt keine Frist, keinen Schwellenwert und
 *  kein Ergebnis (§3 — Rechtsinhalt bleibt in Engine und Schema).
 *
 *  QS-UI 8b Teil 2 (4.8.2026): `titel` kam hinzu, weil derselbe Leerzustand auf den
 *  Vorlagen-Dokumentmappen fehlte — dort heisst der künftige Inhalt nicht «Ergebnis»,
 *  sondern «Dokumente». Default unverändert, also byte-gleich für die Rechner-Aufrufe.
 *  `data-platzhalter` ist der Tor-Griff (qsui-hierarchie I8).
 *
 *  RL-24-Nachzug (W2·30-RL-W2A, 25.9.2026): `rahmen="notiz"` für die Startseite.
 *  Seit Entscheid W-12 (c) (David 24.9.2026) zeigt das Schnellwerkzeug «Frist»
 *  vor der Ferien-Wahl kein Fristende, sondern diesen Leerzustand — die
 *  gestrichelte `lc-tile` bräche dort das Startseiten-Rezept «kein lc-tile»
 *  (katalog R3, design-r2c). Die Notiz nimmt denselben Rahmen wie das
 *  Fristende, das an ihre Stelle tritt (`lc-notice`), ohne die 10-rem-
 *  Mindesthöhe: die Startseiten-Bühne reserviert ihre Höhe selbst (Token
 *  `start-schnell`). Default unverändert ⇒ alle Rechner-Aufrufe byte-gleich. */
export function ErgebnisPlatzhalter({ was, titel = 'Ergebnis', rahmen = 'kachel' }: {
  was: React.ReactNode; titel?: string; rahmen?: 'kachel' | 'notiz';
}) {
  if (rahmen === 'notiz') {
    return (
      <div data-platzhalter className="lc-notice space-y-1.5">
        <p className="lc-overline">{titel}</p>
        <p className="text-body-s text-ink-500">{was}</p>
      </div>
    );
  }
  return (
    <div data-platzhalter className="lc-tile border-dashed min-h-40 flex flex-col justify-center gap-1.5 text-center">
      <p className="lc-overline">{titel}</p>
      <p className="text-body-s text-ink-500 max-w-reading mx-auto">{was}</p>
    </div>
  );
}

/** Sprungmarke zum Live-Ergebnis (UX A7) — nur sichtbar, wenn ein Ergebnis
 *  existiert und noch nicht im Bild steht; rein navigatorisch.
 *  W2·10-UI-NAV/N0d·W5: blendet sich per IntersectionObserver aus, sobald das
 *  Ergebnis selbst im Viewport steht (kein FAB, der auf ohnehin Sichtbares zeigt);
 *  taucht beim Zurückscrollen zu den Eingaben wieder auf. Reine Navigation (§3).
 *
 *  QS-UI 8b (4.8.2026): Die Marke trug bis dahin `sm:hidden` — sie war also genau
 *  dort abgeschaltet, wo sie ebenso gebraucht wird. Gemessen auf allen 14
 *  Rechner-Flächen mit Sofort-Ergebnis (1280×800): das Verdikt steht bei 1.32 bis
 *  3.15 Bildschirmhöhen, also auf KEINER Fläche im ersten Viewport — und die Marke
 *  war auf allen 14 im DOM, aber `display:none`. Sie gilt darum neu auf jeder
 *  Breite. IM PANE bleibt es beim bisherigen Verhalten: die Marke ist
 *  viewport-`fixed`, zwei nebeneinander liegende Panes würden zwei Marken
 *  übereinanderlegen (dieselbe Begründung wie bei `sprung={false}` oben).
 *
 *  QS-UI 8b Teil 2 (4.8.2026): `label` kam hinzu, damit die Vorlagen-Dokumentmappen
 *  DIESELBE Marke benutzen statt einer Kopie (§10). Dort heisst das Ziel nicht
 *  «Ergebnis», sondern «Dokumente». Default unverändert ⇒ die 14 Rechner-Aufrufe
 *  rendern byte-gleich. */
export function ErgebnisSprung({ zielId, label = '↓ Ergebnis' }: { zielId: string; label?: string }) {
  const { imPane } = usePaneKontext();
  const zielSichtbar = useZielSichtbar(zielId);
  if (zielSichtbar) return null;
  return (
    // `print:hidden` zusätzlich zur Druckregel in `src/index.css`: die Marke ist
    // als einziges Bedienelement viewport-`fixed`, ihr Fehlversagen im Druck ist
    // darum das schlimmste (sie läge auf JEDER Seite über dem Inhalt). Die
    // Utility hängt am Element und überlebt jede künftige Umformulierung des
    // globalen Druckblocks. §9-Bug-Check zu PR #440, B1.
    <a href={`#${zielId}`} data-verdikt-sprung className={`${imPane ? 'sm:hidden ' : ''}print:hidden fixed bottom-4 right-4 z-overlay lc-btn-outline lc-btn-sm shadow-md bg-surface`}
      onClick={(e) => { e.preventDefault(); document.getElementById(zielId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
      {label}
    </a>
  );
}
