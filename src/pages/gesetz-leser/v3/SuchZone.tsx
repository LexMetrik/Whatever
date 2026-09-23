import type { ReactNode } from 'react';
import { zaehlform, type BestimmungsWort } from './erlassAnsicht';

// ═══ Ä19 (H2b) · DIE KLEBENDE SUCH-ZONE DES KOPF-BLOCKS ═════════════════════
//
// BEFUND, gemessen 17.8.2026 im Split @1440: `[data-v3-suchsprung] input`
// **count === 0**. Die Panes sind 590 px breit, unterschreiten also die
// xl-Schwelle; die Seitenleiste ist dort ein Bottom-Sheet, und das Such-/
// Sprungfeld lebte ausschliesslich darin. Wer im Split suchen wollte, musste ein
// Blatt öffnen, das das Pane vollständig verdeckt — man suchte im Text, den man
// dabei nicht mehr sah. V1 hat je Pane ein Feld; V3 hatte keines. Derselbe
// Mangel traf das Handy und, unbemerkt, den Desktop mit EINGEKLAPPTER Gliederung.
//
// DIE REGEL, die daraus folgt (und die Kap. 4b für die Spalte schon setzt):
// **Das Such-/Sprungfeld ist auf JEDER Breite das oberste Element des klebenden
// Blocks.** Welcher Block das ist, hing bis zum 6.9.2026 davon ab, ob die
// Gliederung als Spalte stand (Spalte → Seitenleiste, sonst → Kopfzeile).
//
// ── D28 (David 6.9.2026) · DER BLOCK IST JETZT IMMER DIE KOPFZEILE ──────────
// WÖRTLICH: «die suchleiste im gesetz, welche sich oben an der gliederung
// befindet, will ich oben am gesetz — dann verschiebt sie sich auch nicht, wenn
// gliederung eingeklappt ist». Der Lagewechsel WAR der Mangel: dasselbe Feld
// sass bei offener Gliederung in der 18-rem-Spalte (x ≈ 184) und beim Einklappen
// im Kopf-Block (x ≈ 190 … volle Rahmenbreite) — wer die Gliederung zuklappte,
// suchte sein Suchfeld. Seither trägt es AUSSCHLIESSLICH diese Zone, und die
// hängt am Kopf-Block, der über der ganzen Rahmenbreite steht: seine x-Position
// ist von jedem Spalten-Zustand unabhängig (D28-Zusatz, Δx = 0; Klapp-Sonde
// `e2e/leser-klapp-sonde.e2e.ts`).
// Die Gliederung behält damit nur noch die Gliederung.
//
// Damit gibt es weiterhin GENAU EIN Feld im DOM, es ist ohne Geste erreichbar,
// und es verdeckt keinen Text: die Zone ist Teil des Chromes, das ohnehin klebt.
// D38 (7.9.2026): die Trefferliste liegt seither über der LESESPALTE
// (`./LeserTrefferSpalte`); das Blatt am Feld ist gefallen. Diese Zone trägt
// damit genau zwei Dinge — das Feld und, solange die Liste weggeschaltet ist,
// eine Zeile mit den Zahlen und dem Weg zurück.
//
// DEKLARIERTE PRÄZISIERUNG von Kap. 4a («die Kopfzeile trägt kein Suchfeld»):
// die Kopf-ZEILE trägt weiterhin keines — ihre Element-Zahl ist unverändert
// (Design-Grundlage Kap. 6, ≤ 4 Elemente, davon ≤ 2 reine Icons). Der klebende
// Kopf-BLOCK bekommt eine zweite Zeile, und zwar nur dort, wo es sonst überhaupt
// kein erreichbares Feld gäbe. Kap. 4a hat diese Lage nicht bedacht; Ä19 ist der
// Befund dazu, und er ist der gewichtigste des Ästhetik-Reviews H1.
//
// HÖHE: der Rahmen legt sie als `--leser-v3-such-h` aus, mit ZWEI festen Werten
// statt einer Messung — `--nt-stick` (Sprung-Offset der Anker) rechnet die Zone
// mit, und eine gemessene Höhe wäre eine zweite Geometrie-Quelle neben der
// Kopfhöhe (Lehre LM-003). Die Zone wächst genau dann, wenn eine Suche läuft,
// und das ist eine Tastatur-Eingabe (CLS-exkludiert, §15.2).
//
// §3: reine Anordnung. Die Zone kennt weder Erlass noch Suchmaschine — Feld und
// Zahlen kommen fertig herein, der Weg zur Liste ist ein Callback.

// ── B9 (H2b-Nachzug) · DIE HÖHE STEHT DORT, WO DAS MARKUP STEHT ──────────────
//
// BEFUND (Architektur-Review 17.8.2026, Position 3): die zwei Höhenwerte lagen
// als Zahlen-Literale im RAHMEN (`LeserRahmenV3.tsx`, `'4.25rem'`/`'2.75rem'`),
// das Markup, dessen Höhe sie behaupten, liegt HIER — und kein Wächter verband
// beides. Wer der Zone eine Zeile hinzufügt oder ihr Polster ändert, verstellt
// still den Sprung-Offset aller Anker (`--nt-stick` rechnet die Zone mit). Genau
// diese Klasse hat LM-003 einmal gekostet.
//
// JETZT: die Werte gehören der Zone und werden vom Rahmen IMPORTIERT — eine
// Quelle, an derselben Stelle wie das Markup. Der Vertrag ist gemessen bewacht:
// `e2e/leser-v3-suchfeld-ueberall.e2e.ts` (e) vergleicht die tatsächliche
// Element-Höhe mit dem Wert der Variable, im Ruhezustand UND mit laufender Suche.
/** Höhe der Zone, solange keine Suche läuft (nur das Feld: 32 px + 8 px `pb-2`). */
export const SUCH_H_RUHE = '2.75rem';
/** Höhe mit laufender Suche (Feld + Zähler-Zeile `min-h-5` + `gap-1`). */
export const SUCH_H_AKTIV = '4.25rem';

/** W2·29 S4 (Werkbank): ‹ › eckig mit Linie; 20 px wie die Zeile (Höhe bleibt). */
const SCHRITT = 'inline-flex h-5 w-5 items-center justify-center border border-line bg-paper leading-none text-ink-900 transition-colors lc-hover-flaeche';

export function SuchZone({
  suchFeld, sucheAktiv, bestimmungen, fundstellen, bestimmungsWort, onListe,
  onVor, onZurueck, listeSteht, markenSchalter,
}: {
  /** Das Such-/Sprungfeld. Oberstes Element — das ist die ganze Zusage (Ä19).
   *
   *  A2 (H2b-Nachzug): `undefined`, solange das Bottom-Sheet offen ist. Das Feld
   *  steht dann IM Gliederungs-Sheet (dort ist es fokussierbar, dort greift Esc
   *  auf den Dialog); die Zone bleibt mit UNVERÄNDERTER Höhe stehen, damit das
   *  Chrome hinter dem Overlay nichts verschiebt. Es gibt weiterhin genau EIN
   *  Feld im DOM — die Zone gibt es her, das Sheet nimmt es (§5/K2). */
  suchFeld?: ReactNode;
  /** Läuft gerade eine Suche? Nur dann gibt es etwas zu berichten. */
  sucheAktiv: boolean;
  /** Getroffene Bestimmungen (Artikel bzw. Paragraphen). */
  bestimmungen: number;
  /** Fundstellen darin — dieselben Zahlen wie im Kopf der Trefferliste (§5). */
  fundstellen: number;
  /** Zähl-Substantiv aus dem Datenmodell (Ä23) — nie ein Bund-Vorgabewert.
   *  B8: Typ und Zählform aus `./erlassAnsicht` (eine Quelle). */
  bestimmungsWort: BestimmungsWort;
  /** Weg zur vollen Trefferliste: holt sie über die Lesespalte zurück (D38). */
  onListe: () => void;
  /** ── D28 (David 6.9.2026) · «Treffer-Navigation ‹ › und Zähler in derselben
   *  Zeile» ──────────────────────────────────────────────────────────────────
   *  Bis hierher lag der Schritt von Fundstelle zu Fundstelle allein auf ↑↓ im
   *  Feld und auf den Pfeilen im Kopf der TREFFERLISTE — also hinter einer
   *  Geste, die man kennen muss, bzw. hinter einer Liste, die man erst öffnen
   *  muss. Beides ist in derselben Zone vorhanden, sobald eine Suche läuft; sie
   *  sichtbar zu machen kostet zwei 20-px-Griffe und keine Zeile Höhe (§8:
   *  «sichtbar im Ruhezustand» — die Zahl daneben verspricht die Fundstellen
   *  bereits, der Weg dorthin war der einzige unbenannte Teil).
   *  KEINE zweite Mechanik: dieselben Callbacks, die ↑↓ im Feld bedienen und
   *  die die Trefferliste ruft (`m.springeZuFundstelle`, §5). Fehlen sie oder
   *  gibt es nichts zu treffen, stehen die Griffe gar nicht erst da. */
  onVor?: () => void;
  onZurueck?: () => void;
  /** ── D28-NACHZUG (6.9.2026), FORTGESCHRIEBEN MIT D38 (7.9.2026) ────────────
   *  STEHT DIE LISTE SCHON DA? Dann schweigt diese Zeile.
   *  GEMESSEN am ersten D28-Stand @1440 (StPO, «Kosten», Screen
   *  `r6d-leser-1440-suche-aktiv`): weil die Zone seit D28 auch bei stehender
   *  Gliederungs-Spalte da ist, erschien das Treffer-Blatt (Ä76) am Feld — und
   *  legte sich über die Spalte, die dieselbe Trefferliste samt demselben Kopf
   *  «49 Artikel · 110 Fundstellen» bereits zeigte. Zwei gleiche Listen
   *  übereinander, die obere verdeckte die untere (§5).
   *  Der Fall ist mit D38 ein anderer und die Regel dieselbe: die Liste liegt
   *  jetzt über der LESESPALTE, und solange sie dort liegt, sagt sie ihre Zahlen
   *  und ihr ↑↓ selbst. Diese Zeile schweigt dann — kein zweiter Zähler, kein
   *  «Treffer anzeigen →» auf eine Liste, die man ansieht.
   *  KEIN Layout-Sprung dadurch: die Zonen-Höhe hängt seit D38 am ROHEN
   *  Feldwert (`zoneHoch`, `./leserGeometrie`), nicht daran, ob die Zeile
   *  gerade etwas sagt. Der Platz bleibt reserviert, damit das Wegschalten der
   *  Liste die Zeile zurückbringt, ohne den Lesetext zu verschieben (§15.2). */
  listeSteht?: boolean;
  /** W2·28 · L-2 — der Schalter «Hervorhebung», als fertiges Element vom Rahmen.
   *
   *  Er steht IN der bestehenden Zähler-Zeile und bekommt keine eigene: die
   *  Zonenhöhe ist über `SUCH_H_AKTIV` festgeschrieben und gegen die gemessene
   *  Element-Höhe bewacht (B9) — eine zweite Zeile verstellte still den
   *  Sprung-Offset aller Anker (LM-003). Als Geschwister von ‹ › in einem
   *  `min-h-5`-Flex bleibt die Höhe unverändert. */
  markenSchalter?: ReactNode;
}) {
  return (
    // D28 «Druck ohne Feld»: `print:hidden` an der ZONE, nicht am Feld — auch
    // Zähler-Zeile und Griffe fallen aus der Kanzlei-Akte (W2·29 S4: vorher die
    // eine Druck-Regel in index.css, jetzt am Markup).
    <div data-v3-such-zone className="flex flex-col justify-start gap-1 pb-2 print:hidden"
      style={{ height: 'var(--leser-v3-such-h)' }}>
      {/* ── D28 · DAS FELD IST EIN FELD, KEINE WAND ──────────────────────────
          GEMESSEN 6.9.2026 @1440 (STPO, Preview 4372) nach dem Umzug: das
          Eingabefeld lief über die volle Rahmenbreite von **1072 px**. Vorher
          sass es in der 18-rem-Spalte und war 264 px breit; die Zone erbt
          dagegen die Breite des Kopf-Blocks. Ein Unterstrich-Feld über einen
          Meter Bildschirm ist keine Eingabe mehr, sondern eine Linie — und der
          Cursor steht am linken Ende einer Fläche, die zu 90 % leer bleibt
          (Design-Grundlage Kap. 8 Nr. 7, «nie Fensterbreite für eine Zeile»).
          DER DECKEL IST DAS LESEMASS, nicht eine gegriffene Zahl: `max-w-reading`
          (40 rem = 640 px, `tailwind.config.js`) ist dieselbe Token-Breite, an
          der sich die Lesespalte orientiert — das Feld steht damit über dem Text
          und nicht über der Fensterbreite. Ein arbitrary `max-w-[…rem]` verbietet
          der Linien-/Typo-Kanon hier ausdrücklich (R2, `eslint.config.js`), und
          zu Recht: die zweite Zahl wäre die, die vom Lesemass wegdriftet.
          Darunter (Pane · Handy) greift der Deckel nie, dort bleibt `w-full` in
          Kraft — kein Breakpoint, ein `max-width`. */}
      <div className="w-full max-w-reading">{suchFeld}</div>
      {sucheAktiv && !listeSteht && (
        // §8: die Zahl steht dran, und der Weg zur Liste ist BENANNT statt als ☰
        // zu erraten — genau das war der zweite Teil des Ä19-Befunds («das
        // geöffnete Blatt verdeckt das Pane»): der Leser soll selbst entscheiden,
        // ob er die Liste sehen will. Kein zweiter Zähler: dieselben Werte wie im
        // Listenkopf, aus derselben Quelle (§5).
        // D28: EINE Zeile, zwei Rollen — links die Zahlen samt Weg zur Liste,
        // rechts der Schritt durch die Fundstellen. Der Zähler bleibt ein
        // eigener Knopf (er hat sein eigenes Ziel); die zwei Griffe stehen
        // NEBEN ihm statt darin, weil ein Knopf im Knopf kein Knopf ist.
        <div className="flex min-h-5 w-full items-center gap-1">
          {/* ── S1 (Sichtprüfung 21.9.2026) · DIE ZEILE SCHRIEB SICH SELBST ZU ──
              GEMESSEN @390 (hell, OR/«Kündigung», Liste mit ↵ geschlossen):
              die Zeile hat 350 px; der Zähler-Knopf bekam als `flex-1` davon
              200 px, sein INHALT mass 234 px (`scrollW`) — und weil der Knopf
              weder umbricht noch klemmt, lief «Treffer anzeigen →» bis x=254
              weiter, während der Schalter «✓ Hervorhebung» bei x=224 begann.
              30 px Text auf Text, beides unlesbar. Die Kästen selbst lagen
              dabei sauber nebeneinander (Flex hatte sie korrekt verteilt) —
              darum sah keine Sonde etwas: der Überlauf war INNEN.
              @1440 gibt es ihn nicht (623 px Zeile, 473 px Inhalt).
              ZWEI TEILE, weil eine Breite allein nicht trägt:
              (1) DER KNOPF KLEMMT (`overflow-hidden whitespace-nowrap`) — die
                  harte Zusage: was nicht passt, wird abgeschnitten statt über
                  den Nachbarn gemalt, bei JEDER Zahl und jedem Zähl-Substantiv
                  («1 146 Paragraphen …» ist deutlich breiter als der Messfall).
              (2) DIE WORTE WEICHEN (`hidden sm:inline`) — damit im Normalfall
                  gar nichts erst klemmen muss: unter `sm` bleibt «Liste →».
                  Kein Funktionsverlust und keine zweite a11y-Aussage — der
                  ganze Span ist `aria-hidden`, der zugängliche Name des Knopfs
                  sind seine Zahlen, auf jeder Breite dieselben. Der Weg bleibt
                  BENANNT (§8, D28) statt zu einem Glyphen zu verkümmern.
              NACH DEM FIX @390: Inhalt 155 px in 262 px Knopf — 107 px Luft.
              UMBRUCH war keine Option: die Zone ist über `SUCH_H_AKTIV` auf
              68 px festgeschrieben (Feld 32 + gap 4 + Zeile 24 + pb 8), eine
              zweite Zeile verstellte den Sprung-Offset jedes Ankers (LM-003). */}
          <button type="button" data-v3-treffer-weg onClick={onListe}
            className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden whitespace-nowrap text-left text-micro text-ink-600 transition-colors hover:text-ink-900">
            <span className="num">{bestimmungen}</span>
            <span>{zaehlform(bestimmungen, bestimmungsWort)}</span>
            <span aria-hidden className="text-ink-300">·</span>
            <span className="num">{fundstellen}</span>
            <span>{fundstellen === 1 ? 'Fundstelle' : 'Fundstellen'}</span>
            <span aria-hidden className="ml-auto shrink-0 truncate text-brass-700">
              <span className="hidden sm:inline">Treffer anzeigen</span>
              <span className="sm:hidden">Liste</span> →
            </span>
          </button>
          {fundstellen > 0 && markenSchalter}
          {fundstellen > 0 && (onZurueck || onVor) && (
            <span data-v3-treffer-schritt className="flex shrink-0 items-center gap-0.5">
              <button type="button" data-v3-treffer-zurueck onClick={onZurueck}
                aria-label="Vorherige Fundstelle" title="Vorherige Fundstelle (↑)"
                className={SCHRITT}>
                <span aria-hidden>‹</span>
              </button>
              <button type="button" data-v3-treffer-vor onClick={onVor}
                aria-label="Nächste Fundstelle" title="Nächste Fundstelle (↓ oder ↵)"
                className={SCHRITT}>
                <span aria-hidden>›</span>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
