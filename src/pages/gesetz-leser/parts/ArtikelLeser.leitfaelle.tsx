import { useState, memo } from 'react';
import { KanteMitVorschau } from '../../../components/verzahnung/KanteMitVorschau';
import { MehrKante } from '../../../components/verzahnung/MehrKante';
import type { LeitfallRef } from '../../../lib/rechtsprechung/norm-index';
import {
  klassifiziereFassungsBezug, entscheidDatum, type ArtikelRevision,
} from '../../../lib/verzahnung/artikel-revisionen';

// Schaufenster-Chips: nur die zentralen Leitfälle direkt zeigen (Reihenfolge =
// `gewicht` aus dem Shard), Rest hinter «+n weitere». V2·B-2 (David 10.7.2026,
// «auch mehr als fünf»): Kappung von 5 auf 10 angehoben; below-fold, kein
// Normtext-Re-Render (§15). Bewusst klein, kein Panel.
const LEITFAELLE_SICHTBAR = 10;

// «Leitfälle zu diesem Artikel» (FAHRPLAN-DATENHALTUNG §11.2, Weiche B): Chip-Zeile
// analog «Verweise». V1a-Endzustand (CI-Befund W2·7-VZUI, 3 Iterationen): die Zeile
// ist ein REINER Renderer — die Daten kommen als Prop vom Reader, der den erlass-
// lokalen Shard GENAU EINMAL idle lädt (inhalt.tsx). Vorher fetchte jede der ~1000
// Zeilen grosser Erlasse selbst (idle-Herde: >13 s Long-Tasks im 20×-Throttle,
// ★ nach ~15 s; ein Sichtbarkeits-Ansatz je Zeile scheiterte am Hydrations-Drift).
// Ein Fetch + ein setState auf Reader-Ebene: kein Herden-Jam, kein Race — memo
// re-rendert nur Artikel, deren `leitfaelle`-Prop wirklich wechselt (§15.4).
//
// Chips = geteilter KantenChip (Dichte-Regel: ★-Glyph als EIN Zusatz, aria-label
// aus dem StatusBadge-Vokabular), «+n weitere» = MehrKante. `normZitat`
// («Art. 957 OR») wandert als ?norm= an den Entscheid-Link — der EntscheidLeser
// springt zur ERSTEN Erwägung, die den Artikel zitiert (Auftrag David 3.7.2026;
// keine Fundstelle ableitbar → ehrlicher Seitenanfang, §8).
export const LeitfallZeile = memo(function LeitfallZeile({ refs, normZitat, revision }: {
  /** Leitfälle dieses Artikels aus dem erlass-lokalen Shard (Reader lädt einmal). */
  refs?: LeitfallRef[];
  /** Voll zitierfähige Norm («Art. 957 OR») für den Fundstellen-Sprung im Ziel. */
  normZitat: string;
  /** Revision r(a) dieses Artikels (§V1c): undefined = unbekannt (⇒ still),
   *  null = Urfassung (⇒ still), Objekt = letzte Textänderung. Ein Leitfall,
   *  dessen Entscheiddatum VOR r(a) liegt, legt eine ältere Fassung aus → ↻-Glyph. */
  revision?: ArtikelRevision | null;
}) {
  const [alleAuf, setAlleAuf] = useState(false);

  // Wie die «Verweise»-Zeile: ohne Treffer GAR KEINE Zeile (kein reservierter
  // Leerraum, §15.2 — die grosse Mehrheit der Artikel hat keine Leitfälle; eine
  // Reservierung zöge in fast jeden Artikel Weissraum ein). Die Zeilen wachsen
  // mit dem EINEN Shard-Resolve am Artikel-Fuss ein (below-fold); der
  // prerenderte Normtext (LCP/Ctrl+F) bleibt unberührt (§15.1/3).
  if (!refs || refs.length === 0) return null;

  // W2·7-BEZUG/B5: die frühere Zeitraum-Kappung («alle · 20 · 10 · 5 J.») ist HIER
  // ENTFALLEN. Sie war die einzige Verbraucherin der abgelösten Stufen-Wahl; der
  // Zeit-Bereich wirkt seit B5 eine Schicht früher, nämlich in der Kanten-Auswahl
  // (`waehleBezuege`), und damit auf ALLE Instanzen statt nur auf die BGE-Zeile.
  // Diese Zeile filtert deshalb gar nicht mehr — sie rendert, was sie bekommt.
  const sichtbar = alleAuf ? refs : refs.slice(0, LEITFAELLE_SICHTBAR);
  const rest = refs.length - sichtbar.length;
  return (
    <div data-leitfall-zeile className="mt-4 flex flex-wrap items-center gap-2">
      <span className="lc-overline mr-1" title="Maschinell aus den zitierten Normen zugeordnet — keine redaktionelle Präjudizienauswahl. Entscheide beziehen sich auf die im Entscheidzeitpunkt geltende Fassung."><span className="lc-punkt lc-punkt-entscheid" aria-hidden />Leitfälle</span>
      {sichtbar.map((r) => {
        // ?norm= trägt die Fundstellen-Absicht: das Ziel springt zur ersten
        // Erwägung, die diese Norm zitiert (Auflösung im EntscheidLeser, §5).
        const ziel = `/rechtsprechung/${encodeURIComponent(r.key)}?norm=${encodeURIComponent(normZitat)}`;
        // §V1c: hat sich die Norm SEIT diesem Entscheid revidiert? Q1-sicher über
        // die Entscheid-Präzision (BGE-Bandjahr-Platzhalter ⇒ strikter Jahresvergleich).
        const revidiert = klassifiziereFassungsBezug(entscheidDatum(r.datum, r.gericht), revision) === 'revidiert'
          ? (revision ?? null) : null;
        return (
          <KanteMitVorschau key={r.key} ziel={ziel} zitierung={r.zitierung}
            kurztext={r.regesteKurz}
            leitentscheid={r.leitcharakter === 'leitentscheid'}
            revidiert={revidiert}
            titel={r.regesteKurz ?? r.zitierung} />
        );
      })}
      <MehrKante rest={rest} offen={alleAuf} onOeffne={() => setAlleAuf(true)} />
      {/* Weiche-B-Erweiterungspunkt (§10(6)): der Massen-Anteil «+n weitere (online)»
          aus der Edge-Query kommt HIER dazu, sobald E2 live ist — heute nur der
          geshardete Schaufenster-Anteil, kein Edge-Fetch. NICHT bauen. */}
    </div>
  );
});
