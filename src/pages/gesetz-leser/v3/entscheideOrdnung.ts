import type { Bezug, KlassenZahlen } from '../../../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../../../lib/verzahnung/facetten';
import { BEDIENBARE_KLASSEN, KLASSE_KURZ } from '../bezugAuswahl';
import { zahl } from '../bezugPortion';
import { gruppiereKanten } from './panelModell';

// ─── Reiter «Entscheide» · Ordnung, Portion, Anzeige-Helfer (S6-W1b) ─────────
//
// Rein und deterministisch (§2/§3), ohne JSX — die Komponente
// `PanelEntscheide.tsx` ordnet an, hier wird entschieden, WAS in welcher
// Reihenfolge und wie viel davon steht.
//
// ── DIE ORDNUNG (Entscheid David 23.9.2026, wörtlich) ───────────────────────
// «zuerst bge aber nur die 5 neusten und dann kantonal jeweils 5 und dann der
// rest». Umgesetzt als Gruppenfolge:
//   1. Leitentscheide (BGE)
//   2. je kantonales GERICHT eine Gruppe (Kanton, dann Gerichtsname)
//   3. der Rest: übrige Bundesgerichtsurteile, dann eidg. Gerichte
// Jede Gruppe zeigt zuerst die fünf neusten, der Rest ist aufklappbar.
//
// WARUM DER REST NICHT IN EINE LISTE KIPPT: `facetten.ts` hält fest, dass eine
// datumssortierte Mischliste über Instanzen hinweg stillschweigend Gleichrang
// behauptet. Der «Rest» bleibt darum nach Instanz getrennt — er steht nur
// HINTER den kantonalen Gerichten, wie David es festgelegt hat.
//
// ── DIE ORDNUNG INNERHALB EINER GRUPPE IST DIE DES SHARDS (§5) ─────────────
// Der Generator (`scripts/normtext/bezuege-bauen.ts`) sortiert je Status
// «Datum neu → alt», Gleichstand über `vergleicheLeitfaelle` (Gewicht,
// Leitcharakter, dann `key` als totaler Schlüssel). Die Aufteilung nach Gericht
// ist eine STABILE Partition dieser Liste — sie übernimmt die Reihenfolge, statt
// eine zweite Sortier-Wahrheit daneben zu stellen.

/** Wie viele Entscheide eine Gruppe beim Öffnen zeigt — Davids «die 5 neusten». */
export const ERSTE_PORTION = 5;

/**
 * Wie viele ein Klick auf «weitere» nachholt (D-4, Audit 23.9.2026).
 *
 * NICHT wieder 5 wie am früheren Artikelfuss (`bezugPortion.PRO_SCHRITT`): im
 * Blatt steht die senkrechte Achse frei, und 4'139 Restentscheide an BGG Art. 42
 * in Fünferschritten wären 828 Klicks. NICHT «alle»: genau das hat der Audit als
 * Blockade gemessen (4144 Zeilen, bis 1137 ms bei 4× CPU-Drossel). 50 hält jede
 * Nachlade-Stufe unter der Grössenordnung, die der Audit als unkritisch sah.
 */
export const NACHLADE_SCHRITT = 50;

export interface EntscheidGruppe {
  /** Stabiler Schlüssel: Status, bei kantonalen Gruppen `kantonal:<gericht>`. */
  id: string;
  status: BezugStatus;
  /** Gerichts-Code der kantonalen Gruppe, sonst `null`. */
  gericht: string | null;
  titel: string;
  liste: Bezug[];
}

/**
 * Anzeigename eines kantonalen Gerichts aus der Zitierung.
 *
 * Die Zitierung beginnt bei kantonalen Entscheiden ausnahmslos mit
 * «<Gericht> <KT> <Geschäftsnummer> vom …» (nachgezählt 23.9.2026 über alle 311
 * Bezugs-Shards: 8 Gerichts-Codes, je genau EIN Präfix). Der Name wird darum
 * gelesen, nicht in einer zweiten Tabelle gepflegt (§5). Fehlt das Kantons-
 * kürzel in der Zitierung, gibt es keinen belegten Namen — dann `null`.
 */
export function gerichtAusZitierung(zitierung: string, kanton: string): string | null {
  const i = zitierung.indexOf(` ${kanton} `);
  return i > 0 ? zitierung.slice(0, i + 1 + kanton.length) : null;
}

/** Titel einer kantonalen Gruppe: der gemeinsame Gerichtsname aller Einträge,
 *  sonst ehrlich allgemein («Kantonal BS») — nie der Name eines einzelnen. */
function kantonalTitel(liste: readonly Bezug[], kanton: string): string {
  const namen = new Set(liste.map((b) => gerichtAusZitierung(b.zitierung, b.facetten.kanton)));
  const [einziger] = [...namen];
  return namen.size === 1 && einziger ? einziger : `${KLASSE_KURZ.kantonal} ${kanton}`;
}

/**
 * Kanten eines Artikels in Davids Gruppenfolge (Herleitung im Dateikopf).
 * Rein, ordnungserhaltend innerhalb jeder Gruppe.
 */
export function ordneEntscheide(kanten: readonly Bezug[]): EntscheidGruppe[] {
  const aus: EntscheidGruppe[] = [];
  const rest: EntscheidGruppe[] = [];
  for (const [status, liste] of gruppiereKanten(kanten)) {
    if (status === 'bge') {
      aus.push({ id: 'bge', status, gericht: null, titel: KLASSE_KURZ.bge, liste });
    } else if (status === 'kantonal') {
      const jeGericht = new Map<string, Bezug[]>();
      for (const b of liste) {
        const l = jeGericht.get(b.facetten.gericht);
        if (l) l.push(b);
        else jeGericht.set(b.facetten.gericht, [b]);
      }
      const kantonVon = (g: EntscheidGruppe) => g.liste[0]?.facetten.kanton ?? '';
      const gerichte: EntscheidGruppe[] = [...jeGericht.entries()].map(([gericht, l]) => ({
        id: `kantonal:${gericht}`, status, gericht, liste: l,
        titel: kantonalTitel(l, l[0]?.facetten.kanton ?? ''),
      }));
      // Kanton, dann Gerichtsname, dann Code — total und ohne Zählgewichtung
      // (§2: nie nach Häufigkeit, das wäre eine Gewichtung, die die Daten nicht tragen).
      gerichte.sort((a, b) => vergleiche(kantonVon(a), kantonVon(b)) || vergleiche(a.titel, b.titel) || vergleiche(a.id, b.id));
      aus.push(...gerichte);
    } else {
      rest.push({ id: status, status, gericht: null, titel: KLASSE_KURZ[status], liste });
    }
  }
  return [...aus, ...rest];
}

function vergleiche(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Wie viele nach EINEM Klick sichtbar sind — an die Menge geklammert. */
export function naechsteMenge(sichtbar: number, anzahl: number): number {
  return Math.min(sichtbar + NACHLADE_SCHRITT, anzahl);
}

/**
 * Beschriftung des Nachlade-Knopfs. Davids Wort ist «weitere N»; ist der Rest
 * grösser als ein Schritt, sagt der Knopf, wie viele DIESER Klick bringt und
 * wie viele insgesamt ausstehen — sonst verspräche «weitere 4'139» eine Menge,
 * die der Klick nicht liefert (§8).
 */
export function weitereText(sichtbar: number, anzahl: number): string {
  const offen = anzahl - sichtbar;
  const schritt = Math.min(offen, NACHLADE_SCHRITT);
  return schritt === offen ? `weitere ${zahl(offen)}` : `weitere ${zahl(schritt)} von ${zahl(offen)}`;
}

/**
 * Zahlen je Instanz AM ARTIKEL (D-9, Audit 23.9.2026).
 *
 * Bis hierher nannte der Instanz-Schalter die Zahl des GANZEN Erlasses, während
 * die Liste darunter den Artikel zeigte — zwei Bezugsgrössen in einer Zeile. Am
 * Artikel ist «Kante» = «Entscheid» (ein Dokument steht dort genau einmal, s.
 * `ArtikelBezuege.gesamt`), also sind beide Zahlen dieselbe. Die Summe über alle
 * Klassen ist die Zahl der ungefilterten Kanten — dieselbe Menge, die die
 * Funktionszeile am Artikel zählt.
 *
 * Leeres Objekt = nicht geladen: dann steht am Schalter keine Zahl (§8), nie 0.
 */
export function klassenZahlenAmArtikel(
  alle: readonly Bezug[] | undefined,
  geladen: boolean,
): Partial<Record<BezugStatus, KlassenZahlen>> {
  if (!geladen) return {};
  const aus: Partial<Record<BezugStatus, KlassenZahlen>> = {};
  for (const k of BEDIENBARE_KLASSEN) aus[k] = { dokumente: 0, kanten: 0 };
  for (const b of alle ?? []) {
    const z = aus[b.facetten.status];
    if (z) { z.dokumente += 1; z.kanten += 1; }
  }
  return aus;
}

/**
 * Trägt die Zitierung ihr Datum schon selbst? (E-8, Audit 23.9.2026)
 *
 * Kantonale, übrige BGer- und eidg. Zitierungen enden auf «… vom 12.12.2025»
 * bzw. «… vom 19. Februar 2021»; das Datum daneben noch einmal als Unterzeile
 * zu setzen, sagt dasselbe zweimal. BGE-Zitierungen («BGE 151 III 95») tragen
 * kein Datum — dort bleibt die Unterzeile die einzige Datumsangabe.
 */
export function datumInZitierung(zitierung: string): boolean {
  return /\svom\s\S/.test(zitierung);
}

/**
 * Führendes Teil-Kennzeichen der Kurzregeste (B-2/E-6, nur DARSTELLUNG).
 *
 * Mehrteilige BGE-Regesten beginnen mit «a Art. 41 OR; …». Nackt gesetzt liest
 * sich das «a» wie die Abkürzung «aArt.» (alter Artikel). Die Anzeige nennt den
 * Teil darum ausdrücklich («Regeste a:»). WELCHER Teil zum Artikel passt, ist
 * Datenarbeit (Welle 2, D3) — hier wird nichts ausgewählt, nur benannt.
 *
 * Erkannt wird genau EIN Kleinbuchstabe mit Leerzeichen vor einem Grossbuchstaben
 * (oder vor «aArt.» u. ä.); «ad 1 …» und gewöhnliche Satzanfänge fallen nicht
 * darunter (gezählt 23.9.2026: 74 × «a Art.», 23 × «ad 1»).
 */
export function regesteTeil(text: string): { teil: string | null; rest: string } {
  const m = /^([a-z]) (?=[A-ZÄÖÜ]|a[A-ZÄÖÜ])/.exec(text);
  return m && m[1] ? { teil: m[1], rest: text.slice(m[0].length) } : { teil: null, rest: text };
}
