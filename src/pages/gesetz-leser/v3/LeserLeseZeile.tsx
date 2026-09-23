import type { ReactNode } from 'react';
import { schieneAufbau } from './leisteAufbau';
import type { RahmenBild } from './rahmenSpalten';
import { SatzspiegelKontext } from './satzspiegel';

// ─── Die Lese-Zeile: Gliederung/Schiene · Text · Beiwerk-Spur ────────────────
//
// Herausgelöst aus `LeserRahmenV3.tsx` (H4-Nachzug 18.8.2026, §6.6 — die Datei
// stand nach den vier Ä-Fixen bei 447 Zeilen gegen eine 420er-Sonde). Der
// Anlass ist die Zeilenzahl, der GRUND ist ein anderer und trägt allein: dies
// hier ist die einzige Stelle, an der die drei SPUREN nebeneinander stehen, und
// wer wissen will, wie die Breiten-Entscheidung aus `./rahmenSpalten` zu Markup
// wird, soll genau eine Datei lesen müssen.
//
// WELCHE Spuren auf welcher Breite stehen, WIE breit der Rahmen dafür wird und
// warum das Grid auch eingeklappt stehen bleibt: `./rahmenSpalten` (Befund
// David 16.8., Ä60 (c) 17./18.8., beide mit Messreihe). Diese Datei ENTSCHEIDET
// nichts davon — sie bekommt das fertige `RahmenBild` und ordnet an (§3); ihre
// Inhalte kommen als Slots herein, sie kennt weder Modell noch Erlass.

export function LeserLeseZeile({
  bild, vollflaechig, onSchieneAuf, leiste, zelle, panelZone, trefferSpalte,
}: {
  /** Die Breiten-Entscheidung. `bild.spalten === undefined` = kein Grid, alles
   *  steht untereinander wie vor Ä60 (c). */
  bild: RahmenBild;
  /** Nur für die Höhen-Rechnung der Spalte: in der Einzelansicht deckelt das
   *  FENSTER, sonst die Pane-Höhe. Die Prop heisst NICHT `imPane`, und das ist
   *  kein Kosmetik-Entscheid — dieselbe Begründung wie bei `kopfStufen.panelForm`:
   *  die Fundament-Sonde lässt `imPane` nur in den Wurzel-Dateien zu, denn eine
   *  Datei, die den Hüllen-Zustand selbst liest, verzweigt auf ihn. Diese Datei
   *  verzweigt auf eine EIGENSCHAFT DER FLÄCHE, die ihr der Rahmen mitteilt. */
  vollflaechig: boolean;
  /** Klick auf die Schiene — läuft im Rahmen durch den Stick-Ausgleich.
   *  D33 (7.9.2026): er holt keinen Platz mehr vom Blatt zurück, weil das Blatt
   *  keine Spur mehr belegt (`bild.schieneHoltPlatz` ist mit ihr gefallen). */
  onSchieneAuf: () => void;
  /** Inhalt der Gliederungsspalte (Übersicht · Feld · Baum). */
  leiste: ReactNode;
  /** Rechte Zelle: Erlass-Kopf, Ingress und Lesekörper. */
  zelle: ReactNode;
  /** Panel-Zone — im Spalten-Modus die dritte Spur, sonst ohne Box und
   *  ausserhalb des Flusses. `null`, solange es weder Öffner noch Panel gibt. */
  panelZone: ReactNode;
  /** D38 · Die Trefferliste, solange sie über der Lesespalte liegt.
   *
   *  EIGENER SLOT, nicht in `zelle` mitgegeben, und das ist kein Geschmack: die
   *  Zelle steht in einem `space-y-5`-Fluss, dessen `> * + *`-Regel jedem
   *  weiteren Kind einen `margin-top` gäbe — auch einem absolut gesetzten, denn
   *  Margins verschieben eine absolute Box gegenüber ihrem `inset`. Die Liste
   *  läge damit 20 px zu tief, ohne dass jemand eine Zahl geschrieben hätte.
   *  Hier steht sie als LETZTES Kind der `relative`-Zelle — ihrem Bezugsrahmen
   *  (`absolute inset-0`) — und über den beiden Verlaufskanten, damit über der
   *  Liste kein zweiter Schleier liegt. `null` im Ruhezustand: kein Element,
   *  kein Kasten, kein Platz. */
  trefferSpalte?: ReactNode;
}) {
  return (
    <div
      className={bild.spalten
        ? // gap-5 statt gap-8 (Auftrag David 29.8.2026: «weniger Abstand Gesetz ↔
          // Gliederung») — muss mit SPUR_ABSTAND in rahmenSpalten.ts übereinstimmen.
          //
          // E-4 (31.8.2026): Dauer und Kurve kommen aus den Motion-Token
          // (`duration-slow`, Default-Kurve = `var(--ease)`), nie roh.
          'grid gap-5 motion-safe:transition-[grid-template-columns] motion-safe:duration-slow'
        : ''}
      style={bild.spalten ? { gridTemplateColumns: bild.spalten } : undefined}>
      {bild.schiene && (
        // Optik und Herleitung in `./leisteAufbau` (C5b, §6.6).
        schieneAufbau(onSchieneAuf)
      )}
      {bild.gliederungSpalte && (
        <aside role="navigation" aria-label="Gliederung" data-v3-aside
          // Geometrie WÖRTLICH wie die Ist-Spalte, und aus demselben Grund:
          // `top` ist derselbe Ausdruck wie der Sprung-Offset der Anker, damit
          // Spalte und Sprung konstruktiv nicht auseinanderlaufen (LM-003).
          // `flex flex-col` + `maxHeight` ist die tragende Kombination — NICHT
          // `overflow-hidden` mit `h-full` im Kind: `height:100%` löst gegen
          // eine Maximalhöhe nicht auf, der Scroller wüchse auf die volle
          // Inhaltshöhe und der Überschuss würde stumm abgeschnitten
          // (reproduziert am OR @1440×900).
          // W2·24-R6/L16: Der Ausdruck trägt kein Inhaltsverzeichnis und kein
          // Suchfeld. GEMESSEN 6.9.2026 (`emulateMedia('print')`, ZPO): die
          // Spalte druckte mit `display:flex`, 288×506 px, samt «Im Erlass
          // suchen …» — Bedienung auf Papier. Titelblatt, Reiterleiste und
          // Pane-Köpfe waren schon still; hier fehlte die Regel.
          className="sticky flex min-h-0 flex-col self-start print:hidden"
          style={{
            top: 'var(--nt-stick)',
            maxHeight: vollflaechig
              ? 'calc(100vh - var(--nt-stick) - 1.5rem)'
              : 'calc(100dvh - var(--leser-kopf-h) - var(--leser-sub-h) - 1rem)',
          }}>
          {/* D32 (7.9.2026): der Griff «‹ Gliederung ausblenden» steht im
              linken Streifen der Kopfzeile (`./LeserKopf`), nicht mehr hier. */}
          {leiste}
        </aside>
      )}

      {/* Rechte Zelle: Erlass-Kopf UND Lesespalte (seit H1 nicht mehr über die
          volle Breite — sonst rutschte die Seitenleiste @1440 unter die Falz).
          SCROLL-BLUR (Auftrag David 21.8.2026, «dezenter» nachgezogen): je eine
          16-px-Verlaufskante am Kopf-Unterrand und am unteren Rand, reines CSS
          (§15) — `sticky` folgt dem jeweils näheren Scroll-Container (Fenster
          oder Pane). Die Träger sind `h-0` (kein Platz, kein CLS), `bg-paper`
          wie der klebende Kopf, im Druck ausgeblendet.
          Der Satzspiegel (`bild.satzspiegel`, aus der Breite DIESER Zelle
          gerechnet) geht als Kontext an `parts/ArtikelLeser`; `data-lr-spiegel`
          hat seit R6c keinen CSS-Leser mehr und bleibt als Sonden-Anker
          (`leser-klapp-sonde`, `leser-v3-kontext-cls`, `w224-leser-d32-d33`). */}
      <SatzspiegelKontext.Provider value={bild.satzspiegel}>
      <div className="relative min-w-0" data-lr-spiegel={bild.satzspiegel}>
        {/* D33 (7.9.2026): die Panel-Zone steht IN der Lese-Zelle, nicht neben
            ihr. Ihre klebende Gestalt braucht einen `relative`-Bezug und eine
            natürliche Lage unter dem Kopf-Block — beides gibt genau diese Zelle
            her (Herleitung in `./LeserPanelZone`). Sie nimmt keinen Platz: im
            Ruhezustand ist sie `display: contents` ohne Kinder, offen eine
            0-Höhen-Hülle mit absolut gesetztem Blatt. */}
        {panelZone}
        <div aria-hidden data-v3-blur="oben" className="pointer-events-none sticky z-sticky h-0 overflow-visible print:hidden"
          style={{ top: 'var(--nt-stick)' }}>
          <div className="h-4 bg-gradient-to-b from-paper/70 to-transparent" />
        </div>
        {/* D38 · `inert`, solange die Trefferliste darüberliegt: der Text ist
            dann VERDECKT, und was verdeckt ist, darf weder den Tab-Fokus
            aufnehmen noch vorgelesen werden. Ohne das wanderte der Fokus hinter
            eine opake Fläche — der klassische «wo bin ich»-Fehler eines
            Overlays (WCAG 2.4.3/2.4.7). `inert` berührt Layout und Geometrie
            NICHT: der Sprung zu `#art-…` misst und scrollt unverändert, und die
            Liste gibt die Fläche ohnehin frei, bevor er ankommt. */}
        <div className="space-y-5" inert={trefferSpalte ? true : undefined}>{zelle}</div>
        <div aria-hidden data-v3-blur="unten" className="pointer-events-none sticky bottom-0 z-sticky h-0 overflow-visible print:hidden">
          <div className="-mt-4 h-4 bg-gradient-to-t from-paper/70 to-transparent" />
        </div>
        {trefferSpalte}
      </div>
      </SatzspiegelKontext.Provider>
    </div>
  );
}
