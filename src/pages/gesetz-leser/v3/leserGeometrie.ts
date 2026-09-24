import type { CSSProperties } from 'react';
import { kopfHoehe, type KopfStufe } from './kopfStufen';
import { SUCH_H_AKTIV, SUCH_H_RUHE } from './SuchZone';
import { LESEMASS_MAX, SPUR_ABSTAND } from './rahmenSpalten';

// ═══ Die EINE Stelle, an der die Geometrie des Lesers V3 gerechnet wird ══════
//
// Herausgelöst aus `LeserRahmenV3.tsx` (H3-Nachzug C5a, §6.6): der Rahmen soll
// sagen, WO etwas steht — nicht auch noch, welche CSS-Variable aus welcher
// anderen folgt. Der Block war 16 Zeilen JSX-Attribut mit sechs voneinander
// abhängigen Werten und liess sich nur im Browser prüfen; als reine Funktion ist
// er an jeder Kombination von Stufe, Fläche und Such-Zustand nachrechenbar
// (§2/§6.7) — genau das Argument, mit dem `kopfStufen` entstanden ist.
//
// ── RISIKO R1 / LEHRE LM-003, WÖRTLICH MITGENOMMEN ──────────────────────────
// `--leser-kopf-h` behält seine Ist-BEDEUTUNG (Topbar + Pane-Titelleiste). Sie
// umzudeuten hätte das geteilte `GliederungSheet` still verstellt, das daraus
// seine Höhe rechnet (§5: eine Variable, eine Bedeutung). Wer hier eine Zeile
// ändert, verschiebt jeden Artikel-Sprung; die Werte der Such-Zone kommen darum
// aus der Zone selbst (`./SuchZone`, B9) und nicht als Literal von hier.
//
// ── A-2 (David 17.8.2026) · DAS CHROME ÜBER DEM KOPF IST GESCHRUMPFT ────────
// Bis 17.8. stand über der klebenden V3-Kopfzeile die App-Krumen-Leiste (37 px)
// und sagte dasselbe noch einmal; `--leser-v3-kopf-top` und `--nt-stick`
// rechneten sie darum mit. Seit der Leisten-Verschmelzung trägt die Seite ihre
// Kopfzeile selbst (`KopfDaten.kopfzeileSelbst`) und die Leiste entfällt:
//  · EINZELANSICHT — über dem Kopf steht nur noch die Topbar (`APP_TOPBAR_H`).
//  · IM PANE — unverändert: die Pane-Titelleiste bleibt (sie trägt die
//    Fenster-Steuerung, die keine Inhaltsseite tragen kann) und liegt AUSSERHALB
//    des Pane-Scrollers, `--leser-v3-kopf-top` ist dort weiterhin 0.
// `--nt-stick` folgt daraus automatisch — der Sprung-Offset ist genau um die
// weggefallene Leiste kleiner, und das ist der ganze Punkt (Risiko R1: eine
// Quelle für «wie hoch klebt es»). Gemessen 17.8.2026 @1440 StPO: Kopf-Unterkante
// 159 → 122 px, `#art-429` landet auf 120 statt 156.
//
// ── KEIN `imPane` (Fundament-Sonde) ─────────────────────────────────────────
// Das Argument heisst `vollflaechig` und beschreibt eine EIGENSCHAFT DER
// LESEFLÄCHE, nicht ihre Umgebung. Die eine Übersetzung (`!umgebung.imPane`)
// steht im Rahmen — dieselbe Regel und derselbe Grund wie bei `panelForm`
// (Zurückweisung durch die Sonde am 17.8.2026).

/**
 * Höhe der klebenden App-Krone über dem Leser.
 *
 * ── W2·24-R4 · VOM LITERAL ZUM GETEILTEN TOKEN ──────────────────────────────
 * Hier stand bis zum 6.9.2026 `'4rem'` — die Höhe der Titelblatt-Zeile allein.
 * Solange sie das einzige klebende Stück war, war das richtig; mit der
 * Arbeitsleiste aus R2 (`components/layout/Reiterleiste.tsx`, §5a) ist es das
 * nicht mehr. R2 hat die Leiste deshalb im Fluss mitlaufen lassen und den
 * Nachzug ausdrücklich hierher gelegt (R2-Protokoll §2: «aus `APP_TOPBAR_H` ein
 * geteiltes Token machen, dann kann sie kleben»).
 *
 * Die Zahl lebt jetzt in `src/index.css` als `--app-kopf-h` (= `--app-krone-h`
 * + `--app-reiter-h`) und wird von BEIDEN Seiten gelesen: die Leiste klebt auf
 * `--app-krone-h` und ist `--app-reiter-h` hoch, der Leser setzt seinen
 * Kopf-Anschlag und `--nt-stick` aus der Summe. Ein zweites Literal auf einer
 * der beiden Seiten wäre genau die Zahl, die still auseinanderläuft — und der
 * Preis dafür ist nicht theoretisch: sie verschiebt jeden `#art-…`-Sprung.
 *
 * Bewusst KEIN `calc()` hier: der Wert wird ausschliesslich in CSS-Ausdrücke
 * eingesetzt, die die Variable selbst auflösen. Der Fallback deckt den einen
 * Fall ab, in dem die Regel nicht geladen ist (Vitest ohne Stylesheet).
 */
const APP_TOPBAR_H = 'var(--app-kopf-h, 4rem)';
/** Höhe der Pane-Titelleiste (`components/layout/PaneKopf.tsx`, `h-9`). */
const PANE_LEISTE_H = '2.25rem';
/**
 * A-2 · Das reservierte BAND der App-Krumen-Leiste (`h-9`).
 *
 * BUG-CHECK 17.8.2026 (Nachzug): hier stand `calc(2.25rem + 1px)` = 37 px, «h-9
 * plus 1 px Kante». Gemessen sind es **36**: der stille Träger in
 * `components/layout/InhaltsKopf.tsx` trägt `h-9 border-b border-transparent`,
 * und mit `box-sizing: border-box` (Tailwind-Grundlage) liegt die Kante INNEN —
 * die 1 px sind in den 2.25rem enthalten, nicht darüber. Die 37 px gelten nur
 * für die LAUTE Leiste, wo die Kante am äusseren Träger sitzt und die `h-9` an
 * einem Kind. Ein Pixel zu viel verschluckt heisst: der Kopf legt sich einen
 * Pixel höher, als das Band reicht.
 *
 * Die Leiste zeigt unter `kopfzeileSelbst` nichts mehr, BEHÄLT aber ihre Höhe —
 * sonst wandert der ganze Inhalt beim Eintreffen der Meldung 37 px hoch (die
 * Route ist `lazy`, die Shell rät bis dahin; Messung und Tor-Beleg in
 * `components/layout/InhaltsKopf.tsx`). Der Kopf verschluckt das Band statt
 * dessen: sichtbar gewonnen sind die 37 px, gesprungen ist nichts.
 * NUR in der Einzelansicht — im Pane trägt die Titelleiste weiter die
 * Fenster-Steuerung und ist damit kein leeres Band.
 */
const APP_BAND_H = '2.25rem';

export interface LeserGeometrieLage {
  /** Zuschnitt der Kopfzeile (gemessene Breite → `kopfStufe`). */
  stufe: KopfStufe;
  /** Hat der Leser die ganze Seite für sich (Einzelansicht)? */
  vollflaechig: boolean;
  /** Trägt der klebende Kopf-BLOCK die Such-Zone? (Ä19: nur ohne Spalte.) */
  suchZoneKlebt: boolean;
  /** ── W2·24-F (7.9.2026) · DIE ZONE IST HOCH, SOBALD IM FELD ETWAS STEHT ───
   *  Die Zone ist höher, wenn die Zähler-Zeile darunter Platz braucht. Die
   *  Frage LAUTETE bis hierher «läuft eine Suche?» und wurde vom ENTPRELLTEN
   *  Suchwert beantwortet (`m.sucheAktiv`, 200 ms). Das war der Defekt:
   *
   *  GEMESSEN 7.9.2026, Preview 4410, `/gesetze/bund/BV` @390, Drossel 20×,
   *  Geste `pressSequentially('Kanton', 60 ms)` wie in `e2e/leser-r1-r2.e2e.ts`
   *  (A9-DoD): `--leser-v3-such-h` sprang 2.75rem → 4.25rem, der klebende Kopf
   *  93 → 117 px, und die Lesespalte darunter (`LeserLeseZeile.tsx:136`,
   *  `DIV.relative min-w-0`) rutschte mit — **CLS 0.019140**, `hadRecentInput
   *  = false`, fremd 0. Auf schneller CPU verfällt die Entprellung NACH dem
   *  letzten Tastendruck und der Sprung fällt ins 500-ms-Eingabefenster; auf
   *  langsamer CPU dauert EIN Tastendruck länger als 200 ms, die Entprellung
   *  feuert MITTEN im Tippen, und der Browser verbucht den Sprung als
   *  eingabefrei. Dasselbe sieht ein Leser auf einem schwachen Telefon.
   *
   *  DER WERT KOMMT DARUM VOM ROHEN FELDWERT (`m.suche.trim() !== ''`, Rahmen —
   *  `.trim()`, damit ein reines Leerzeichen die Zone nicht dauerhaft hochstellt,
   *  ohne dass je eine Zähler-Zeile käme; im Ruhezustand deckungsgleich mit
   *  `sucheFeldLeer` des Modells, das dieselbe Frage für die Treffer stellt):
   *  die Höhe wächst in DERSELBEN Eingabe-Aufgabe wie der Tastendruck, also
   *  eingabe-nah. Der Name sagt jetzt, was er meint — die Zone ist HOCH, nicht
   *  «die Suche läuft»; das eine ist Geometrie und sofort, das andere ist die
   *  Datenlage und entprellt. Zwei Fragen, zwei Namen (§5).
   *
   *  PREIS, offengelegt (§8): zwischen erstem Zeichen und Entprellung steht die
   *  Zone 200 ms lang hoch, aber ohne Zähler-Zeile — reservierter Platz statt
   *  falscher Zahlen. Eine sofort mitgerenderte Zeile müsste «0 Artikel»
   *  behaupten, solange die entprellten Treffer fehlen. Der Ruhezustand ist
   *  unberührt: leeres Feld ⇒ `SUCH_H_RUHE` wie bisher (Leeren wirkt ohnehin
   *  sofort, `inhalt-zustand.tsx` entprellt nur das Tippen).
   *  VERWORFEN (Weg 1 vom 18.8.2026): 24 px dauerhaft reservieren — das nimmt
   *  jedem Leser, der nie sucht, Lesehöhe @390.
   *  ROT ZU BEKOMMEN (§6.7): hier wieder `m.sucheAktiv` einsetzen ⇒ die
   *  A9-DoD-Sonde misst unter Drossel 20× erneut CLS 0.01914. */
  zoneHoch: boolean;
  /** ── N4 (David 7.9.2026) · EINE KOPFZEILE STATT ZWEIER REIHEN ─────────────
   *  Steht die Such-Zone IN der Kopfzeile (statt als zweite Reihe darunter)?
   *  Gemessen 7.9.2026 @1440: der klebende Block war 100 px hoch — Kopfzeile
   *  56 px mit den zwei Griffen rechts, darunter die Such-Zone 44 px mit dem
   *  Feld links; dazwischen rund 70 % Leerfläche. Sobald das Feld nach D32 an
   *  der Kante des Gesetzestextes beginnt, liegen Feld und Griffe ohnehin auf
   *  EINER Achse. Der Block misst dann `max(Kopfzeile, Zone)` statt ihrer
   *  Summe: **−44 px** klebende Höhe im Ruhezustand.
   *  Nur wo eine linke Spur steht (`rahmenBild.spurVersatzRem > 0`) — im Pane
   *  und @390 gäbe es neben dem Feld keinen Platz, dort bleiben es zwei. */
  suchInZeile: boolean;
  /** D32: waagrechter Versatz der Lese-Zelle (rem) — `rahmenBild.spurVersatzRem`. */
  spurVersatzRem: number;
  /** Entscheid A (24.9.2026): Breite der rechten Spur samt Abstand (rem) —
   *  `rahmenBild.spurVersatzRechtsRem`, der Spiegel von `spurVersatzRem`. */
  spurVersatzRechtsRem: number;
}

/**
 * Die CSS-Variablen am Wurzel-Element des Lesers.
 *
 * Reihenfolge und Werte sind gegenüber dem Zwischenstand UNVERÄNDERT — dies ist
 * eine Auslagerung, keine Änderung (§6: Verhaltensneutralität ist zu beweisen;
 * `leser-v3-kopf-buendig` und `leser-v3-suchfeld-ueberall` messen beide Enden).
 */
export function leserCssVariablen(lage: LeserGeometrieLage): CSSProperties {
  const { stufe, vollflaechig, suchZoneKlebt, zoneHoch, suchInZeile, spurVersatzRem, spurVersatzRechtsRem } = lage;
  return {
    '--leser-v3-kopf-h': kopfHoehe(stufe),
    // A-2: in der Einzelansicht klebt der Kopf direkt unter der Topbar — die
    // App-Krumen-Leiste dazwischen gibt es nicht mehr.
    '--leser-v3-kopf-top': vollflaechig ? APP_TOPBAR_H : '0rem',
    '--leser-kopf-h': `calc(${APP_TOPBAR_H} + ${PANE_LEISTE_H})`,
    // Ä19: Höhe der Such-Zone — 0, wo die Leiste als Spalte das Feld trägt.
    // Zwei feste Werte, damit `--nt-stick` unten aus derselben Quelle rechnet.
    // B9: die zwei Werte gehören der Zone (`./SuchZone`), nicht dieser Datei.
    '--leser-v3-such-h': suchZoneKlebt ? (zoneHoch ? SUCH_H_AKTIV : SUCH_H_RUHE) : '0rem',
    // Ä1: Wrapper-Polsterung, die der Kopf verschluckt. Vorgabe in index.css
    // (Shell `py-8 sm:py-12`); im Pane sind es `py-6` (Pane.tsx).
    ...(vollflaechig ? {} : { '--leser-v3-kopf-luecke': '1.5rem' }),
    // A-2: das zweite, GETRENNT geführte Stück, das der Kopf verschluckt — das
    // reservierte Band der App-Leiste. Getrennt von der Wrapper-Polsterung, weil
    // die beiden verschiedenen Eigentümern gehören und sich verschieden ändern:
    // die Polsterung folgt dem Route-Wrapper und braucht dessen Breakpoint (darum
    // steht sie in `index.css`), das Band folgt der App-Leiste und hängt nur an
    // der Fläche (darum steht es hier). In eine Variable gerechnet wären sie beim
    // nächsten Umbau nicht mehr auseinanderzuhalten (§5).
    '--leser-v3-app-band': vollflaechig ? APP_BAND_H : '0rem',
    '--leser-sub-h': vollflaechig ? '0rem' : 'var(--leser-v3-kopf-h)',
    // N4: die Höhe des ganzen klebenden Kopf-BLOCKS. Zwei Reihen ⇒ Summe; EINE
    // Reihe ⇒ das Maximum, denn die Zone steht dann in der Zeile und wächst sie
    // nur, wenn eine laufende Suche sie höher macht als die Griffe (68 px
    // gegen 56). Alles, was «wie hoch klebt es» wissen muss, liest diese eine
    // Variable — `--nt-stick` unten rechnet daraus, nicht neben ihr (LM-003).
    // D32: die Kante des Gesetzestextes, EINMAL benannt. Die Kopfzeile stellt
    // ihre linke Zone genau so breit; damit beginnt die Erlass-Suche über dem
    // Text statt über der Gliederung — ohne dass die Kopfzeile die Spuren
    // nachrechnen müsste (LM-003: eine Geometrie-Quelle, `./rahmenSpalten`).
    '--leser-spur-versatz': `${spurVersatzRem}rem`,
    // Entscheid A (24.9.2026): dieselbe Kante rechts — der Streifen über der
    // Blatt-Spur, in dem «Erlass-Blatt ausblenden ›» steht.
    '--leser-spur-versatz-rechts': `${spurVersatzRechtsRem}rem`,
    // Der Abstand ZWISCHEN den Spuren (`gap-5` der Lese-Zeile), damit der
    // Gliederungs-Griff in der Kopfzeile über der Gliederung endet und nicht
    // über dem Gesetzestext.
    '--leser-spur-abstand': `${SPUR_ABSTAND}rem`,
    '--leser-v3-kopf-block-h': suchInZeile
      ? 'max(var(--leser-v3-kopf-h), var(--leser-v3-such-h))'
      : 'calc(var(--leser-v3-kopf-h) + var(--leser-v3-such-h))',
    // Auftrag David 21.8.2026 (`./rahmenSpalten`, LESEMASS_MAX): der Deckel des
    // Lesemasses, EINMAL benannt, von `index.css` gelesen (`#lc-lesespalte`
    // und `.max-w-normtext` im V3-Wurzelbaum). Zustandsunabhängig — anders als
    // die übrigen Variablen hier gilt derselbe Wert in jeder Lage.
    '--leser-lesemass-max': `${LESEMASS_MAX}rem`,
    '--nt-stick': vollflaechig
      ? `calc(${APP_TOPBAR_H} + var(--leser-v3-kopf-block-h))`
      // Im Pane steht die Zone nie in der Zeile (dort gibt es keine linke
      // Spur) — die Summe bleibt darum die Summe.
      : 'calc(var(--leser-sub-h) + var(--leser-v3-such-h))',
  } as CSSProperties;
}
