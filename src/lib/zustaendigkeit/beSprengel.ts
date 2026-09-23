// ─── BE: Gemeinde → Regionalgericht / regionale Staatsanwaltschaft ──────────
//
// Liest die generierte Projektion `src/data/zustaendigkeit/beSprengel.json`
// (Erzeuger: scripts/zustaendigkeit/be-sprengel-generieren.ts aus den amtlichen
// Geodaten ADMRG/ADMRSA/GRENZ5 des Amts für Geoinformation BE). Reiner
// Nachschlagedienst, deterministisch, ohne Netz und ohne Geometrie zur
// Laufzeit (CLAUDE.md §2) — die Fläche ist zur Bauzeit in eine Tabelle
// aufgelöst.
//
// NORMBASIS (BSG 161.1, Fassung in Kraft seit 1.5.2026):
//   · Art. 80 Abs. 1  vier Gerichtsregionen
//   · Art. 80 Abs. 2  Berner Jura-Seeland = Verwaltungsregionen Berner Jura +
//                     Seeland; übrige = gleichnamige Verwaltungsregion (Art. 39a OrG)
//   · Art. 81 Abs. 1  je ein Regionalgericht; Berner Jura-Seeland mit
//                     Aussenstelle im Berner Jura
//   · Art. 92 Abs. 1/2 vier regionale Staatsanwaltschaften, Sprengel ebenfalls
//                     an die Verwaltungsregionen gebunden
//   · Art. 88a        Aussenstelle des Regionalgerichts (und der Schlichtungs-
//                     behörde, Art. 84 Abs. 4) darf wegen des Wechsels Moutiers
//                     zum Kanton Jura vorübergehend im Verwaltungskreis
//                     Biel/Bienne liegen; Art. 92 Abs. 4 sagt dasselbe für die
//                     regionale Staatsanwaltschaft. Darum steht die «Aussenstelle
//                     Berner Jura» heute in Biel — ein Provisorium mit
//                     gesetzlichem Verfalldatum, kein Datenfehler.
// Herleitung, Lizenz und Messprotokoll:
// bibliothek/behoerden/be-sprengel-geodaten-2026-09-12.md
//
// STATUS (§8): Erstrecherche mit amtlicher Vollerhebung — die fachliche
// Abnahme durch David steht aus. Kein `verified`-Merkmal wird hier gesetzt.

import { istRecord, pruefeJson, type JsonPruefer } from '../../data/jsonSchutz';
import { namensKandidaten } from '../../data/schlichtung/zhAmt';

interface BeAnschrift { adresse: string; plzOrt: string }
export interface BeStaatsanwaltschaft { region: string; name: string; adresse: string; plzOrt: string }

/** Auflösung für eine Gemeinde. */
export interface BeSprengel {
  bfsNr: number;
  gemeinde: string;
  gericht: BeGericht;
  staatsanwaltschaft: BeStaatsanwaltschaft;
}
export interface BeGericht {
  region: string;
  name: string;
  nameFr: string | null;
  aussenstelle: string | null;
  zivil: BeAnschrift;
  straf: BeAnschrift;
  url: string | null;
}

interface BeSprengelDaten {
  stand: string;
  quelle: {
    herausgeber: string;
    abgerufen: string;
    lizenz: string;
    lizenzUrl: string;
    normbasis: string;
    normUrl: string;
    quellenangabe: string;
    uebersichtGerichte: string;
    uebersichtStaatsanwaltschaft: string;
    datensaetze: { code: string; titel: string; detail: string; bezug: string }[];
  };
  gerichte: BeGericht[];
  staatsanwaltschaften: BeStaatsanwaltschaft[];
  gemeinden: Record<string, [number, number]>;
  namen: Record<string, number>;
  kreise: Record<string, number>;
}

const istAnschrift = (w: unknown): boolean =>
  istRecord(w) && typeof w.adresse === 'string' && typeof w.plzOrt === 'string';

/** Strukturprüfer (§ QS-CODE-AUSSENKANTEN): fängt Generator-Drift zur Ladezeit,
 *  statt still auf null zurückzufallen. */
const BE_SPRENGEL_PRUEFER: JsonPruefer = {
  quelle: 'zustaendigkeit/beSprengel.json',
  wurzel: (w) => {
    if (!istRecord(w)) return 'Wurzel ist kein Objekt';
    if (typeof w.stand !== 'string') return 'stand fehlt';
    if (!istRecord(w.quelle) || typeof w.quelle.abgerufen !== 'string') return 'quelle.abgerufen fehlt';
    if (!Array.isArray(w.gerichte) || w.gerichte.length === 0) return 'gerichte ist keine gefüllte Liste';
    for (const g of w.gerichte) {
      if (!istRecord(g) || typeof g.name !== 'string' || typeof g.region !== 'string') return 'Gericht ohne name/region';
      if (!istAnschrift(g.zivil) || !istAnschrift(g.straf)) return 'Gericht ohne Zivil-/Straf-Anschrift';
    }
    if (!Array.isArray(w.staatsanwaltschaften) || w.staatsanwaltschaften.length === 0) return 'staatsanwaltschaften ist keine gefüllte Liste';
    if (!istRecord(w.gemeinden) || !istRecord(w.namen)) return 'gemeinden/namen fehlen';
    return null;
  },
};

let cache: BeSprengelDaten | null = null;
async function daten(): Promise<BeSprengelDaten> {
  if (cache === null) {
    cache = pruefeJson<BeSprengelDaten>((await import('../../data/zustaendigkeit/beSprengel.json')).default, BE_SPRENGEL_PRUEFER);
  }
  return cache;
}

function baue(d: BeSprengelDaten, bfs: number): BeSprengel | null {
  const paar = d.gemeinden[String(bfs)];
  if (paar === undefined) return null;
  const gericht = d.gerichte[paar[0]];
  const sta = d.staatsanwaltschaften[paar[1]];
  if (gericht === undefined || sta === undefined) return null;
  const gemeinde = Object.keys(d.namen).find((n) => d.namen[n] === bfs);
  if (gemeinde === undefined) return null;
  return { bfsNr: bfs, gemeinde, gericht, staatsanwaltschaft: sta };
}

/** Auflösung über die BFS-Gemeindenummer — der stabile Schlüssel. */
export async function beSprengelFuerBfsNr(bfsNr: number): Promise<BeSprengel | null> {
  if (!Number.isInteger(bfsNr)) return null;
  return baue(await daten(), bfsNr);
}

/** Auflösung über den Gemeindenamen. Kandidatenreihenfolge und
 *  Schreibweisen-Normalisierung wie in der Schlichtungs-Auflösung
 *  (`namensKandidaten`, dieselbe swisstopo-Schreibweise) — exakte Namen,
 *  danach case-insensitiv; KEIN Fuzzy-Matching (§2). */
export async function beSprengelFuerGemeinde(gemeinde: string): Promise<BeSprengel | null> {
  const g = gemeinde.trim();
  if (g === '') return null;
  const d = await daten();
  const kandidaten = namensKandidaten(g, 'BE');
  for (const k of kandidaten) {
    const bfs = d.namen[k];
    if (bfs !== undefined) return baue(d, bfs);
  }
  const klein = new Map(Object.entries(d.namen).map(([n, b]) => [n.toLowerCase(), b]));
  for (const k of kandidaten) {
    const bfs = klein.get(k.toLowerCase());
    if (bfs !== undefined) return baue(d, bfs);
  }
  return null;
}

/** Stand, Abrufdatum, Lizenz und Live-Links — für die Offenlegung in der UI
 *  (§7: gespeicherter amtlicher Inhalt nur mit sichtbarem Live-Link). */
export async function beSprengelHerkunft(): Promise<BeSprengelDaten['quelle'] & { stand: string }> {
  const d = await daten();
  return { ...d.quelle, stand: d.stand };
}

/** Alle Standorte — für Auswahl-Listen, wenn die Gemeinde unbekannt ist. */
export async function beRegionalgerichte(): Promise<BeGericht[]> {
  return (await daten()).gerichte;
}
export async function beStaatsanwaltschaften(): Promise<BeStaatsanwaltschaft[]> {
  return (await daten()).staatsanwaltschaften;
}
