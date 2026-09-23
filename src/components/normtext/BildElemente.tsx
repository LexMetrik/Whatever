// Bild-/Formel-Darstellung für Normtext-Blöcke (§3 reine Darstellung): eine
// amtliche Einzel-Abbildung/Formel (BildFigur) sowie ein Kachel-Katalog von
// Piktogrammen (BildKacheln, z.B. SSV Anhang 2 — Signaltafeln). Aus ArtikelBody
// ausgelagert (Schichtentrennung/Übersicht); die Render-Schicht importiert NICHT
// aus scripts/, darum sind die Block-Datenformen hier lokal typisiert (wie
// TabSpalte in ArtikelBody). Die Dateien liegen unter public/normtext/bilder/…;
// die URL ist stets `/normtext/${datei}`.

// Eine amtliche Einzel-Abbildung ODER Formel. breite/hoehe = Pixelmasse der
// Quelle (für CLS-freie Platzreservierung); formel unterscheidet die Beschriftung.
export interface BildDaten {
  datei: string;
  alt: string;
  formel?: boolean;
  breite?: number;
  hoehe?: number;
  sha?: string;
}

// Eine Katalog-Kachel (Signaltafel): Bild + amtliche Nummer + Name. Das Bild kann
// fehlen (reine Text-Kachel, z.B. reservierte Nummer) — dann nur Nummer + Name.
export interface BildKachel {
  bild?: Omit<BildDaten, 'formel'>;
  nummer?: string;
  name?: string;
}

// Bildquelle unter public/normtext/ (bilder/…). Zentral, damit BildFigur und
// BildKacheln dieselbe URL-Bildung teilen.
function bildUrl(datei: string): string {
  return `/normtext/${datei}`;
}

// BildFigur: eine einzelne amtliche Abbildung/Formel als <figure> in der
// Lesespalte. CLS = 0: width/height-Attribute geben dem Browser das intrinsische
// Seitenverhältnis, sodass der Platz VOR dem Laden reserviert ist; `max-w-full
// h-auto` skaliert das Bild trotzdem responsiv in die Spalte (kein Overflow).
// loading/decoding lazy — Bilder blockieren den Textfluss nicht.
export function BildFigur({ bild }: { bild: BildDaten }) {
  return (
    <figure className="my-3 [text-indent:0]">
      <img
        src={bildUrl(bild.datei)}
        alt={bild.alt}
        loading="lazy"
        decoding="async"
        width={bild.breite}
        height={bild.hoehe}
        className="block h-auto max-w-full rounded-md border border-line bg-paper-raised"
      />
      <figcaption className="mt-1.5 text-xs text-ink-500">
        {bild.formel ? 'Amtliche Formel' : 'Amtliche Abbildung'}
      </figcaption>
    </figure>
  );
}

// BildKacheln: responsives Kachel-Gitter (auto-fill, reflowt auf Mobil/Desktop —
// gleiche Idiomatik wie Katalog.tsx) statt einer ragged Tabelle. Je Kachel oben
// das zentrierte Piktogramm in einer FESTEN Box (h-24), darunter die Nummer
// (fett) und der Name. Die feste Bildbox reserviert die Zeilenhöhe unabhängig von
// den Bildmassen → CLS = 0; `object-contain` hält das Signal proportional.
export function BildKacheln({ kacheln }: { kacheln: BildKachel[] }) {
  return (
    <div
      role="list"
      aria-label="Signaltafeln"
      className="my-3 grid grid-cols-[repeat(auto-fill,minmax(min(9rem,100%),1fr))] gap-3 [text-indent:0]"
    >
      {kacheln.map((k, i) => (
        <div
          key={i}
          role="listitem"
          className="flex flex-col items-center rounded-md border border-line bg-surface p-3 text-center"
        >
          {k.bild && (
            <span className="flex h-24 w-full items-center justify-center">
              <img
                src={bildUrl(k.bild.datei)}
                alt={k.bild.alt}
                loading="lazy"
                decoding="async"
                width={k.bild.breite}
                height={k.bild.hoehe}
                className="max-h-full max-w-full"
              />
            </span>
          )}
          {k.nummer && <span className="num mt-2 font-semibold text-ink-800">{k.nummer}</span>}
          {k.name && <span className="mt-0.5 text-xs text-ink-600 leading-snug">{k.name}</span>}
        </div>
      ))}
    </div>
  );
}
