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
//   U-24  amtlicher Gerichtsname kantonaler Court-Codes (GR: Obergericht ab 1.1.2025; AG/SG je
//         Aktenzeichen-Präfix) und U-16 amtliches GR-Aktenzeichen («SBK 26 88») in
//         `gerichtName`, `nummer` und `zitierung` (src/lib/rechtsprechung/kantonale-gerichte.ts).
import type { EntscheidAbschnitt, EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';
import { bereinigeZitierteNormen, verlegeSeitenmarkerVorNormzitat } from '../../src/lib/rechtsprechung/seitenmarker';
import { amtlicherGerichtName, amtlichesAktenzeichen, zitierungNachKorrektur } from '../../src/lib/rechtsprechung/kantonale-gerichte';
import { sha256EntscheidBloecke } from './sha-entscheide';

/** Ein Befund-Zähler je Regel (für Lauf-Protokolle und Tests). */
export type Bereinigung = Record<'seitenmarker' | 'zitierteNormen' | 'gerichtName' | 'aktenzeichen', number>;

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
  const out: Bereinigung = { seitenmarker: 0, zitierteNormen: 0, gerichtName: 0, aktenzeichen: 0 };

  const abs = bereinigeAbschnitte(snap.abschnitte);
  if (abs.n && abs.neu) { snap.abschnitte = abs.neu; snap.sha = sha256EntscheidBloecke(abs.neu); }
  const aus = bereinigeAbschnitte(snap.auszugAbschnitte);
  if (aus.n && aus.neu) snap.auszugAbschnitte = aus.neu;
  out.seitenmarker = abs.n + aus.n;

  const normen = snap.zitierteNormen ?? [];
  const sauber = bereinigeZitierteNormen(normen);
  if (sauber.length !== normen.length) { out.zitierteNormen = normen.length - sauber.length; snap.zitierteNormen = sauber; }

  // U-24/U-16: amtlicher Gerichtsname und amtliches Aktenzeichen (nur GR/AG/SG-Court-Codes).
  if (snap.kanton !== 'CH' && snap.quelle === 'opencaselaw') {
    const nummerNeu = amtlichesAktenzeichen(snap.gericht, snap.nummer);
    const nameNeu = amtlicherGerichtName(snap.gericht, nummerNeu, snap.datum) ?? snap.gerichtName;
    if (nummerNeu !== snap.nummer || nameNeu !== snap.gerichtName) {
      if (nameNeu !== snap.gerichtName) out.gerichtName = 1;
      if (nummerNeu !== snap.nummer) out.aktenzeichen = 1;
      snap.zitierung = zitierungNachKorrektur(snap.zitierung, { name: snap.gerichtName, nummer: snap.nummer }, { name: nameNeu, nummer: nummerNeu });
      snap.gerichtName = nameNeu;
      snap.nummer = nummerNeu;
    }
  }
  return out;
}
