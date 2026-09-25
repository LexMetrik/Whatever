import { Link } from 'react-router-dom';
import type { BrowseMaterial } from '../../lib/materialien/typen';
import { StandChip } from '../ui/StandChip';

// ─── Material-Karte in der Übersicht /materialien ───────────────────────────
//
// Amtliche Ressource (Soft-Law) als Karte. Nüchtern/kanzleihaft (DESIGN-
// REGLEMENT §13): Doktyp+Nummer als Overline, Titel als Anker, Stand als Meta
// (die Behörde trägt der Gruppenkopf — LM-195). Reine Darstellung (§3). Die Karte führt auf die IN-APP-Detailseite
// (/materialien/:key) mit bibliografischen Metadaten + prominentem Live-Link —
// KEIN gespeicherter Dokumentinhalt (§7/§8), massgeblich bleibt die amtliche
// Quelle.

// Der Stand-Chip stand hier und in `normtext/ErlassKarte.tsx` zeichengleich als
// lokale Kopie (Design-Konsistenz, C-Begleitbefund «Stand-Chip-Dedupe»,
// 31.8.2026) — jetzt EIN Baustein: `ui/StandChip.tsx`.

// W2·29-WERKBANK-REST S2 (25.9.2026) · DIE KARTE DER K-RUBRIKEN. Dieselbe
// Anatomie wie die Entscheid-Karte (K3, `rechtsprechung/EntscheidKarte`):
// Haarlinien-Karte, Hover = neutrale Zeilen-Fläche (`.lc-hover-flaeche`) plus
// unterstrichener Titel, Fuss mit eigener Haarlinie. Messing entfällt (F0.2/
// F0.3) — die Weiterweg-Zeile tintet beim Überfahren nicht mehr um, der
// Unterstrich am Titel trägt die Affordanz. Inhalt, Reihenfolge und Wortlaut
// unverändert (Inventar 3.4, Material-Karte).
export function MaterialKarte({ m }: { m: BrowseMaterial }) {
  const overline = m.nummer ? `${m.doktypLabel} · ${m.nummer}` : m.doktypLabel;
  return (
    <Link
      to={`/materialien/${encodeURIComponent(m.key)}`}
      className="lc-card group flex h-full flex-col p-4 no-underline lc-hover-flaeche"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="lc-overline">{overline}</span>
        {m.sprache !== 'de' && <span className="lc-badge lc-badge-soft">{m.sprache}</span>}
      </div>
      <p className="mt-1.5 text-body-s font-medium text-ink-900 leading-snug line-clamp-3 underline-offset-2 group-hover:underline">{m.titel}</p>
      {/* lc-chip-zeile (LM-044/N1): der Stand-Chip ist ein <span> ohne role und
          bleibt darum ausdrücklich FLACH — reine Angabe, keine Aktion, kein Link.
          LM-028: `mt-auto` hängt den Fuss an die Kartenunterkante (die Karte ist
          eine Flex-Spalte); LM-195: kein Behördenkürzel, das trägt der
          Gruppenkopf. Die Weiterweg-Zeile steht dauerhaft sichtbar im selben
          Fuss (LM-195, zweiter Teil: die Sichtbarkeit einer Aktion hängt nicht
          am Zeigergerät, §8). */}
      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-rule-soft pt-2.5">
          <div className="lc-chip-zeile flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-500">
            <StandChip stand={m.stand} />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-600">
            Details &amp; amtliche Fassung →
          </span>
        </div>
      </div>
    </Link>
  );
}
