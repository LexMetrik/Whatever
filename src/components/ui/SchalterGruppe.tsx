// ─── SchalterGruppe — die Gruppe gedrückter Text-Schalter (`.ub-schalter`) ───
//
// W2·29-WERKBANK-REST S1 (25.9.2026): aus `normtext/GesetzeGliederung.tsx`
// hierher umgezogen, Rumpf zeichengleich (Posten «SchalterGruppe nach ui/»).
// Sie war nie Normtext-Logik, sondern das EINE Bild für jede «wähle eins aus
// wenigen»-Zeile; /rechtsprechung (Ansicht, Live-Sortierung) baute es bis
// hierher zweimal von Hand nach (§5/§10).

/** Gruppe gedrückter TEXT-Schalter (`.ub-schalter`, D22 «keine Kästen»):
 *  `role=group` + `aria-pressed` (F3/F4). EIN Bild für Ebene, Gliederung,
 *  Karte/Liste und Sortierung auf /gesetze (K2, vorher drei Pill-Kopien mit
 *  Messing-Fläche). `etikett` = sichtbare Beschriftung vor den Optionen. */
export function SchalterGruppe<T extends string | null>({ name, etikett, optionen, wert, onWahl, className }: {
  name: string; etikett?: string;
  optionen: readonly { id: T; label: string; title?: string }[];
  wert: T; onWahl: (id: T) => void; className?: string;
}) {
  return (
    <div role="group" aria-label={name} className={`flex flex-wrap items-baseline gap-x-5 gap-y-1${className ? ` ${className}` : ''}`}>
      {/* LM-055 (B15, 4.9.2026): das Etikett darf sich nicht als weitere Option
          lesen — eigene Stimme (Overline) und ein Schritt mehr Abstand. */}
      {etikett && <span className="lc-overline mr-1">{etikett}</span>}
      {optionen.map((o) => (
        <button key={o.id ?? 'alle'} type="button" className="ub-schalter" aria-pressed={wert === o.id}
          title={o.title} onClick={() => onWahl(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
