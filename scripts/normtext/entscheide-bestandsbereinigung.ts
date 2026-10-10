// ─── Bestandsbereinigung der Entscheid-Snapshots (idempotent, offline, §2/§5) ──
//
// Dieselben reinen Regeln, die der Adapter beim Neuzug anwendet, laufen hier über den
// BESTAND, den der Writer (`schreibeKorpus`) ohnehin neu schreibt — eine Stelle je Regel (§5),
// kein Handflicken der JSON-Projektionen (CLAUDE.md §5/§7). Jede Regel ist idempotent: ein
// Lauf über bereits bereinigte Snapshots ändert nichts, ein Vollbau liefert dasselbe wie
// Neuzug + Bestandslauf.
//
// Regeln (Befund-Nr. in plan/FEHLERBESTAND.md, Abschnitt 3 «Urteilsdaten»):
//   U-04  Seitenvermerk mitten im Normzitat → Marker vor das Zitat, Phantom-`zitierteNormen` raus
//         (src/lib/rechtsprechung/seitenmarker.ts).
import type { EntscheidAbschnitt, EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';
import { bereinigeZitierteNormen, verlegeSeitenmarkerVorNormzitat } from '../../src/lib/rechtsprechung/seitenmarker';
import { sha256EntscheidBloecke } from './sha-entscheide';

/** Ein Befund-Zähler je Regel (für Lauf-Protokolle und Tests). */
export type Bereinigung = Record<'seitenmarker' | 'zitierteNormen', number>;

function bereinigeAbschnitte(abschnitte: EntscheidAbschnitt[] | undefined): { neu: EntscheidAbschnitt[] | undefined; n: number } {
  if (!abschnitte) return { neu: abschnitte, n: 0 };
  let n = 0;
  const neu = abschnitte.map((a) => ({
    ...a,
    bloecke: a.bloecke.map((b) => {
      const t = verlegeSeitenmarkerVorNormzitat(b.text);
      if (t === b.text) return b;
      n++;
      return { ...b, text: t };
    }),
  }));
  return { neu: n ? neu : abschnitte, n };
}

/**
 * Wendet alle Bestandsregeln auf EINEN Snapshot an (in place, wie der Besetzungs-Freitext im
 * Writer). Berührt `sha` nur, wenn sich `abschnitte` geändert hat — `sha` deckt genau die
 * Abschnitte (Typ + Marke + Text) und hält so das Drift-Tor `check:entscheide` grün.
 */
export function bereinigeBestandSnapshot(snap: EntscheidSnapshot): Bereinigung {
  const out: Bereinigung = { seitenmarker: 0, zitierteNormen: 0 };

  const abs = bereinigeAbschnitte(snap.abschnitte);
  if (abs.n && abs.neu) { snap.abschnitte = abs.neu; snap.sha = sha256EntscheidBloecke(abs.neu); }
  const aus = bereinigeAbschnitte(snap.auszugAbschnitte);
  if (aus.n && aus.neu) snap.auszugAbschnitte = aus.neu;
  out.seitenmarker = abs.n + aus.n;

  const normen = snap.zitierteNormen ?? [];
  const sauber = bereinigeZitierteNormen(normen);
  if (sauber.length !== normen.length) { out.zitierteNormen = normen.length - sauber.length; snap.zitierteNormen = sauber; }
  return out;
}
