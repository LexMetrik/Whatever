import type { ReactNode, RefObject } from 'react';
import type { Register } from '../layout/bereiche';
import { Ladeanzeige } from '../ui/Ladeanzeige';
import { MEHR_KNOPF_KLASSEN } from '../ui/mehrKnopfKlassen';
import { FehlerBox } from '../vorlagen/ui';

// ─── Startseite · geteilte Bausteine der aufgeklappten Blätter (W2·29-WERKBANK-START-FEINSCHLIFF)
//
// Vorher stand das Filterfeld zweimal wortgleich (`GesetzeBlatt`,
// `WerkzeugeBlatt`), das Suchfeld und der «Weitere»-Knopf je einmal in
// `MaterialienBlatt` und `RechtsprechungBlatt` — und keines der Such-Blätter
// sagte einem Screenreader, wie viele Treffer die Eingabe ergab (Posten
// FEINSCHLIFF, Gegenprüfung S2/S3 24.9.2026). Eine Quelle je Baustein (§5/§10).
// Reine Darstellung (§3): Suchlogik, Filter und Zählung bleiben beim Aufrufer.

/** Such- bzw. Filterfeld im Blatt. `label` ist der Name für Screenreader und —
 *  ohne eigenen `platzhalter` — zugleich der Platzhalter. `schmal`: auf
 *  Lesebreite begrenzt (Filter über einer Liste); ohne: volle Blattbreite
 *  (die Suche IST die Stufe, Materialien/Rechtsprechung). */
export function BlattSuchFeld({ wert, setze, label, platzhalter, schmal = false, onFocus, feldRef }: {
  wert: string; setze: (s: string) => void; label: string; platzhalter?: string; schmal?: boolean;
  /** Ziel für `useSuchFokus` (suchFokus.ts) — damit der Weiterweg des Leerzustands den Fokus
   *  aufs Feld zurückgibt (sonst verschwindet der gedrückte Knopf und der
   *  Tastaturfokus fällt auf `body`). */
  feldRef?: RefObject<HTMLInputElement | null>;
  /** Vorabruf beim Fokus (U11, Gesetze-Blatt: Register erst auf Wunsch, §15). */
  onFocus?: () => void;
}) {
  return (
    <label className={schmal ? 'block max-w-md' : 'block'}>
      <span className="sr-only">{label}</span>
      <input ref={feldRef} type="search" value={wert} onChange={(e) => setze(e.target.value)} placeholder={platzhalter ?? label}
        onFocus={onFocus} className="lc-input" />
    </label>
  );
}

/** Trefferzahl der aktuellen Auswahl — sichtbar UND per `aria-live` gemeldet,
 *  sobald sie sich ändert. Die Zahl kommt aus der gefilterten Liste des
 *  Aufrufers (§8: gezählt, nicht behauptet). */
export function TrefferZahl({ n, einzahl, mehrzahl }: { n: number; einzahl: string; mehrzahl: string }) {
  return (
    <p role="status" aria-live="polite" className="font-sans text-xs text-ink-500">
      <span className="num text-ink-900">{n.toLocaleString('de-CH')}</span> {n === 1 ? einzahl : mehrzahl}
    </p>
  );
}

/** «Weitere anzeigen» unter einer portionierten Liste. */
export function WeitereKnopf({ rest, mehr }: { rest: number; mehr: () => void }) {
  return (
    <button type="button" onClick={mehr} className={`lc-btn-mini ${MEHR_KNOPF_KLASSEN}`}>
      Weitere anzeigen (<span className="num">{rest.toLocaleString('de-CH')}</span> weitere)
    </button>
  );
}

/** Laden · Fehler · bereit einer Sammlung im Blatt — EINE Weiche statt je Blatt
 *  eine eigene (Gesetze, Materialien, Rechtsprechung trugen je eine Kopie: nackter
 *  `<p>` in ink-500 bzw. ink-700, Fehler ohne Haus-Box). Laden = der eine
 *  Lade-Zustand (`ui/Ladeanzeige`, Ablesekante + Text, `role="status"`), Fehler =
 *  die Haus-Fehlerbox (`FehlerBox`, `role="alert"`). Der Wortlaut bleibt beim
 *  Aufrufer: er nennt die Sammlung (§8), der Baustein nicht. W2·19 DK-B. */
export function BlattLaedt({ laedt, fehler, ladetext, fehlertext, children }: {
  laedt: boolean; fehler: boolean; ladetext: string; fehlertext: string; children: () => ReactNode;
}) {
  if (fehler) return <FehlerBox titel="Laden fehlgeschlagen" fehler={[fehlertext]} />;
  if (laedt) return <Ladeanzeige text={ladetext} className="py-6" />;
  return <>{children()}</>;
}

/** Fläche je Register — volle Klassennamen, damit Tailwind sie findet. */
const SPALTEN_FLAECHE: Record<Register, string> = {
  g: 'bg-reg-g-flaeche', r: 'bg-reg-r-flaeche', m: 'bg-reg-m-flaeche', w: 'bg-reg-w-flaeche',
};

/** Eine Spalte der Wahl-Stufe (START-UEBERARBEITUNG U1 Gesetze, U8 Werkzeuge):
 *  die Kachel als Kopf, darunter die nächste Stufe auf derselben Fläche. Die
 *  Fläche liegt auf der Spalte, damit sie bis unten reicht; der Kopf bringt
 *  Strich und Rundung selbst mit. Ab `lg` teilen die Spalten ihre zwei Zeilen
 *  (`subgrid`): die Köpfe sind gleich hoch, auch wenn eine Einheit umbricht,
 *  und die Listen beginnen auf einer Linie. Seit U8 hier statt in
 *  `GesetzeBlatt` (zwei Aufrufer, eine Anatomie — §10). */
//
// U13 (Nachtrag David 24.9.2026 abends: «es soll nicht zu scrollen kommen wenn
// man kachel aufmacht» / «also bei gesetz») · ab `lg` rückt der Kopf 16 statt
// 20 px ein (`[&>button]:p-4`). Gemessen 25.9.2026 @1440: in der Bund-Spalte
// brauchten Zahl + Einheit 59 + 8 + 93 = 160 px bei 159 px Platz — «Bundes-
// erlasse» brach unter die Zahl, und über `subgrid` wurden alle drei Köpfe
// 134 statt ~100 px hoch. Mit 16 px passen sie (167 px Platz), und die
// Kopfschrift fluchtet mit den Listenzeilen darunter (px-2 + px-2 = 16 px).
export function WahlSpalte({ reg, kopf, children }: { reg: Register; kopf: ReactNode; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col rounded-xl ${SPALTEN_FLAECHE[reg]} pb-3 lg:row-span-2 lg:grid lg:grid-rows-subgrid`}>
      <div className="flex lg:[&>button]:p-4">{kopf}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
