// Passus-Ziel-Bestimmung: welche Stelle eines Artikel-Snapshots ist zitiert?
// Reine, deterministische Logik (§2/§3) — gemeinsame Wahrheit für die
// Darstellung (ArtikelBody: Hervorhebung) UND den Live-Link-Sprung (NormPopover:
// Text-Fragment). Vorher inline in NormPopover.tsx; ausgelagert, damit Popover
// und die Gesetzes-Lesesicht (Rubrik V) denselben Treffer berechnen — keine
// zweite Wahrheit (§5). Verhaltensneutral aus NormPopover übernommen.

import type { NormSnapshot } from './typen';

type Block = NormSnapshot['bloecke'][number];
type Item = NonNullable<Block['items']>[number];

/** Das zitierte Stück: Absatz und (optional) lit./Ziff.-Marke. */
export interface PassusInfo {
  absatz: string | null;
  lit?: string;
  ziff?: string;
}

/** Aufgelöstes Ziel: normalisierte Marke, Item-Koordinate, Block/Item-Treffer. */
export interface PassusZiel {
  /** Normalisierte lit/Ziff-Marke oder null (nur Absatz / nichts zitiert). */
  passusMarke: string | null;
  /** Koordinate des EINEN markierten Items oder null. */
  zielItemKey: { bi: number; ji: number } | null;
  /** Hervorzuhebender Absatz-Block (nur Absatz zitiert) oder undefined. */
  hervorBlock: Block | undefined;
  /** Hervorzuhebendes Item (lit/Ziff zitiert) oder undefined. */
  hervorItem: Item | undefined;
  /**
   * Nur bei Auflösung über die Ziffer-Ebene (`Block.ziffer`, P6): Indizes der
   * hervorzuhebenden Inhalts-Blöcke (Überschrift-Blöcke zählen nicht). `undefined`
   * = Legacy-Auflösung (Absatz-Vergleich je Block) — dort ändert sich nichts.
   */
  zielBloecke?: ReadonlySet<number>;
}

// Vergleichs-Normalisierung für lit/Ziff-Marken: case-insensitive, ohne
// umschliessende Punkte/Klammern/Leerzeichen ('a)', '(a)', '17.', ' b ' → 'a',
// '17', 'b'). Innere Suffixe (z.B. '5a', '20a', 'bis') bleiben erhalten — die
// Marke wird nur an den Rändern gesäubert, damit lit/Ziff aus dem Zitat exakt
// gegen die Snapshot-Marke matcht (einheitlich Bund-lit ↔ Kanton-Ziff).
export function markeNorm(s: string): string {
  return s.trim().replace(/^[.()\s]+|[.()\s]+$/g, '').toLowerCase();
}

// Teile einer Block-Ziffer: «2_3» = Sammel-Ziffer («2. und 3. …», Konvention `art_77_78`) gilt für
// jede ihrer Ziffern. EINE Stelle für Passus-Auflösung UND Ziffer-Anker (`zifferAnker.ts`, §5).
export const zifferTeile = (ziffer: string): string[] => markeNorm(ziffer).split('_');

// Absatz-Vergleichs-Normalisierung: nachgestellte Punkte/Whitespace strippen.
// Manche Snapshots tragen den Absatz als «1.» (z.B. FR-261.16), das Zitat aber
// als «1» — ohne Normalisierung matchten sie nicht und die Hervorhebung griffe
// nicht. Innere Form bleibt unangetastet (nur die Ränder rechts werden gesäubert).
export function absatzNorm(a: string | null): string | null {
  return a?.replace(/[.\s]+$/, '') ?? null;
}

// Ziffer-Ebene (P6): «Ziff. N» ist dort, wo der Artikel Blöcke mit `ziffer`
// trägt (BV Art. 196/197, StGB-Strafnormen), die Gliederungsstufe ÜBER dem Absatz
// («Art. 197 Ziff. 9 Abs. 2 lit. b», «Art. 140 Ziff. 1 Abs. 2»), nicht eine
// Aufzählungs-Marke. Existiert keine Ziffer N im Artikel, gilt die Legacy-
// Auflösung unverändert (Item-Marke) — kein Verhalten ändert sich ohne `ziffer`.
// Absatz in der Ziffer: erst per Absatz-Label (BV: jede Ziffer zählt neu ab 1);
// trägt KEIN Block der Ziffer ein Label (StGB: unnummerierte Folge-Absätze),
// zählt die Reihenfolge der Textblöcke (Abs. 1 = der Ziffer-Block selbst).
// Nicht auflösbar → die Ziffer als Ganzes, nie eine fremde Ziffer.
function bestimmeZifferZiel(bloecke: Block[], passus: PassusInfo): PassusZiel | null {
  if (passus.ziff == null) return null;
  const n = markeNorm(passus.ziff);
  // Sammel-Ziffer «3_4» gilt für jede ihrer Ziffern (`zifferTeile`).
  const scope = bloecke.flatMap((b, i) => (b.ziffer != null && zifferTeile(b.ziffer).includes(n) ? [i] : []));
  if (scope.length === 0) return null;
  const inhalt = scope.filter((i) => bloecke[i].titel === undefined);
  let treffer = inhalt;
  if (passus.absatz != null && inhalt.length > 0) {
    const a = absatzNorm(passus.absatz);
    const perLabel = inhalt.filter((i) => absatzNorm(bloecke[i].absatz) === a);
    const hatLabel = inhalt.some((i) => bloecke[i].absatz != null);
    const textBloecke = inhalt.filter((i) => bloecke[i].text !== '');
    const positional = !hatLabel && a != null && /^\d+$/.test(a) ? textBloecke[Number(a) - 1] : undefined;
    if (perLabel.length > 0) treffer = perLabel;
    else if (positional !== undefined) treffer = [positional];
  }
  const passusMarke = passus.lit != null ? markeNorm(passus.lit) : null;
  let zielItemKey: PassusZiel['zielItemKey'] = null;
  if (passusMarke != null) {
    for (const bi of treffer) {
      const ji = bloecke[bi].items?.findIndex((it) => markeNorm(it.marke) === passusMarke) ?? -1;
      if (ji >= 0) { zielItemKey = { bi, ji }; break; }
    }
  }
  return {
    passusMarke,
    zielItemKey,
    hervorBlock: treffer.length > 0 ? bloecke[treffer[0]] : undefined,
    hervorItem: zielItemKey != null ? bloecke[zielItemKey.bi].items![zielItemKey.ji] : undefined,
    zielBloecke: new Set(treffer),
  };
}

/**
 * Bestimmt aus den Blöcken eines Snapshots und dem zitierten Passus genau EINE
 * hervorzuhebende Stelle. Ist ein lit/ziff zitiert, gilt GENAU das erste in
 * Dokumentreihenfolge passende Item (B1: bei gleicher Marke in mehreren Blöcken
 * nur das erste). Sonst (nur Absatz) der passende Block.
 */
export function bestimmePassusZiel(bloecke: Block[], passus: PassusInfo): PassusZiel {
  const ziffer = bestimmeZifferZiel(bloecke, passus);
  if (ziffer != null) return ziffer;
  const passusMarke = passus.lit != null
    ? markeNorm(passus.lit)
    : passus.ziff != null ? markeNorm(passus.ziff) : null;

  const hervorBlock = passus.absatz != null
    ? bloecke.find((b) => absatzNorm(b.absatz) === absatzNorm(passus.absatz))
    : undefined;

  const zielItemKey = (() => {
    if (passusMarke == null) return null;
    for (let bi = 0; bi < bloecke.length; bi++) {
      const b = bloecke[bi];
      const istZielBlock = passus.absatz == null || absatzNorm(b.absatz) === absatzNorm(passus.absatz);
      if (!istZielBlock || b.items == null) continue;
      const ji = b.items.findIndex((it) => markeNorm(it.marke) === passusMarke);
      if (ji >= 0) return { bi, ji };
    }
    return null;
  })();

  const hervorItem = zielItemKey != null
    ? bloecke[zielItemKey.bi].items![zielItemKey.ji]
    : undefined;

  return { passusMarke, zielItemKey, hervorBlock, hervorItem };
}
