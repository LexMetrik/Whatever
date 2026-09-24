import { MEHR_KNOPF_KLASSEN } from '../ui/mehrKnopfKlassen';

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
export function BlattSuchFeld({ wert, setze, label, platzhalter, schmal = false }: {
  wert: string; setze: (s: string) => void; label: string; platzhalter?: string; schmal?: boolean;
}) {
  return (
    <label className={schmal ? 'block max-w-md' : 'block'}>
      <span className="sr-only">{label}</span>
      <input type="search" value={wert} onChange={(e) => setze(e.target.value)} placeholder={platzhalter ?? label}
        className="lc-input" />
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
