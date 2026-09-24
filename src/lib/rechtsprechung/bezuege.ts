// ─── Bezüge am Artikel: Ladeschicht + Facetten-Auswahl (W2·7-BEZUG, B1) ─────
//
// Lazy geladener Shard `public/rechtsprechung/bezuege/<ERLASS>.json`: zu einem
// Erlass — Bundes-Register-key ('OR') ODER kantonaler Snapshot-key
// ('BS-154.100') — die Kanten aller Facetten-Klassen an seinen Artikeln.
//
// REINE DATENSCHICHT (§3): Laden, Auflösen, Filtern nach deklarierten Facetten.
// Keine Komponente, kein Zustand über die Sitzung hinaus, keine Voreinstellung —
// welche Facetten voreingestellt sind und wie sie bedient werden, entscheidet die
// Filter-UI (B4) und nicht diese Datei.
//
// ── ABGRENZUNG zu norm-index.ts, damit niemand das Falsche lädt ─────────────
//  · `norm-index/<Erlass>.json`  (LeitfallShard) — die BESTEHENDE, schlanke
//    Bundesgerichts-Sicht. Sie ist der Default-Pfad des ArtikelLesers und bleibt
//    unverändert; wer keine Facetten braucht, lädt nur sie.
//  · `bezuege/<Erlass>.json`     (diese Datei) — die generische Sicht mit ALLEN
//    Klassen. Sie ist eine OBERMENGE der ersten, also nie zusätzlich zu ihr zu
//    laden, sondern an ihrer Stelle, sobald Facetten im Spiel sind.
// Beide stammen aus demselben Bau (scripts/normtext/bezuege-bauen.ts); das Tor
// check:bezuege prüft, dass die Bundesgerichts-Projektion übereinstimmt (§5).

import type { BezugsFacetten, BezugStatus } from '../verzahnung/facetten';
import { STATUS_RANG } from '../verzahnung/facetten';
import { kodiereSchluessel } from '../normtext/dateiUrl';

/** Dokument-Kopf — EINMAL je Shard, nicht je Artikel (§15, siehe Generator). */
interface BezugsDokument {
  zitierung: string;
  regesteKurz: string | null;
  datum: string;
  facetten: BezugsFacetten;
  /** Nur gesetzt, wenn wahr: `datum` ist ein Platzhalter, die Quelle nennt kein Entscheiddatum (B-1). */
  datumUnbekannt?: true;
  /**
   * Nur an Kanten auf das VOLLSTÄNDIGE Urteil (`<bge-key>__voll`): der Artikel
   * steht ausschliesslich in einer nicht in der amtlichen Sammlung publizierten
   * Erwägung (E-1). `bge` = Fundstelle, `urteil` = Aktenzeichen.
   */
  unpubliziert?: { bge: string; urteil: string };
}

/**
 * Kanten-Eintrag: Verweis auf den Dokument-Kopf + artikel-lokales Gewicht.
 *
 * `gewicht: null` heisst NICHT MESSBAR, nicht «null Zitierungen» (W2·7-BEZUG,
 * Gegenprüfung Runde 1/B3). Der Zitier-Graph erkennt nur BGE-Fundstellen und
 * Bundesgerichts-Aktenzeichen; kantonale («BES.2026.15») und eidgenössische
 * Geschäftsnummern treffen keine dieser Formen. Wer die Zahl rendert, muss den
 * Unterschied mitrendern — eine 0 an einem kantonalen Entscheid behauptete, ihn
 * zitiere niemand (§8).
 */
interface BezugsEintrag {
  key: string;
  gewicht: number | null;
  /** E-1: Erwägungs-Marken des Volltexts, in denen DIESER Artikel steht («E. 3»). */
  erwaegungen?: string[];
}

export interface BezugsShard {
  erzeugt: string;
  erlass: string;
  erlassEbene: 'bund' | 'kanton';
  dokumente: Record<string, BezugsDokument>;
  proArtikel: Record<string, BezugsEintrag[]>;
  /** Grundgesamtheit je Artikel und Status VOR dem Deckel (§8). */
  gesamtProArtikel: Record<string, Partial<Record<BezugStatus, number>>>;
}

/**
 * Aufgelöste Kante: Kopf + Gewicht, wie eine Komponente sie braucht.
 * `gewicht: null` = nicht messbar (siehe `BezugsEintrag`).
 */
export interface Bezug extends BezugsDokument {
  key: string;
  gewicht: number | null;
  erwaegungen?: string[];
}

/** Was ein Filter auswählen kann. Leere/fehlende Achse = keine Einschränkung. */
export interface FacettenAuswahl {
  status?: ReadonlySet<BezugStatus>;
  ebene?: ReadonlySet<'bund' | 'kanton'>;
  kanton?: ReadonlySet<string>;
  quelltyp?: ReadonlySet<string>;
}

const shardPromises = new Map<string, Promise<BezugsShard | null>>();

/**
 * Shard eines Erlasses laden. Promise-Cache je Erlass (Repo-Muster wie
 * `ladeLeitfallShard`): der erste Artikel stösst EINEN fetch an, alle weiteren
 * Artikel desselben Erlasses teilen ihn.
 *
 * FEHLSCHLÄGE WERDEN NICHT GECACHT — dieselbe Härtung wie in norm-index.ts (§5,
 * §8): ein transienter Netzfehler beim ersten Öffnen darf die Bezüge nicht für
 * die ganze Sitzung leer erscheinen lassen. Eine leere Liste liest sich als «zu
 * diesem Artikel gibt es keine Rechtsprechung» — das ist eine Aussage über die
 * Rechtslage, nicht ein fehlendes Feature. 404 bleibt gecacht: kein Shard heisst
 * belegbar «keine Kante zu diesem Erlass», das ist kein Fehler.
 *
 * ── S6-W1b (23.9.2026, Befunde E-3/D-3/B-8) · FEHLER WIRFT, 404 NICHT ──────
 * Bis hierher lösten auch Netzfehler und 5xx zu `null` auf — dieselbe Rückgabe
 * wie der 404. Der Absatz oben war damit nur halb eingelöst: der Fehlschlag
 * wurde zwar nicht gecacht, aber der Aufrufer las ihn als «kein Shard» und der
 * Reiter schrieb «kein Entscheid erfasst» (gemessen im Audit 23.9.2026, offline
 * an OR Art. 41). Jetzt: 404 ⇒ `null`, jeder andere Fehlschlag ⇒ Wurf. Nur so
 * kann die Oberfläche «konnte nicht geladen werden» von «nichts erfasst»
 * trennen (§8).
 */
export async function ladeBezugsShard(erlass: string): Promise<BezugsShard | null> {
  let p = shardPromises.get(erlass);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`/rechtsprechung/bezuege/${kodiereSchluessel(erlass)}.json`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Bezugs-Shard ${erlass}: HTTP ${res.status}`);
        // SPA-RÜCKFALL = 404: ein Server ohne die Datei, der stattdessen die App
        // ausliefert (`vite dev`/`vite preview`; jede Rewrite-Regel ohne die
        // Ausnahme in vercel.json), antwortet 200 mit HTML. Das ist dieselbe
        // Auskunft wie der 404 — «keine Datei» —, kein Leitungsfehler. Gemessen
        // 23.9.2026 an `vite preview`: ZH-211.11 → 200 text/html.
        if (!(res.headers?.get('content-type') ?? '').includes('json')) return null;
        return (await res.json()) as BezugsShard;
      } catch (e) {
        shardPromises.delete(erlass);
        throw e instanceof Error ? e : new Error(String(e));
      }
    })();
    shardPromises.set(erlass, p);
  }
  return p;
}

/**
 * Artikel-Token normalisieren — IDENTISCH zu `normArtikelToken` in norm-index.ts.
 * Re-exportiert statt nachgebaut (§5): der Reader reicht die eId-nahe
 * Unterstrich-Form durch ('727_a'), die Shard-Tokens sind whitespace- und
 * unterstrich-frei ('727a'). Zwei Normalisierungen, die auseinanderlaufen,
 * kosten die Bezüge JEDES Buchstaben-Artikels — der Bug ist im Bestand belegt
 * (W2·7-VZUI/V1b, OR Art. 727a).
 */
export { normArtikelToken } from './norm-index';

/**
 * Kanten eines Artikels, aufgelöst und in Shard-Ordnung: Status-Rang, dann
 * Datum neu → alt, Gleichstand über die Bestands-Ordnung
 * (`scripts/normtext/bezuege-bauen.ts`, Sortierung seit B7; der frühere
 * Wortlaut «Gewicht/Leitentscheid/Datum/key» beschrieb die Ordnung vor B7 —
 * nachgeführt S6-W1b, Befund E-11 vom 23.9.2026). Rein (§2). Ein Eintrag ohne Dokument-Kopf
 * wird ÜBERSPRUNGEN statt halb gerendert — ein Chip ohne Zitierung wäre eine
 * Behauptung ohne Fundstelle (§7).
 */
export function bezuegeFuerArtikel(shard: BezugsShard, artikelToken: string): Bezug[] {
  const out: Bezug[] = [];
  for (const e of shard.proArtikel[artikelToken] ?? []) {
    const kopf = shard.dokumente[e.key];
    if (!kopf) continue;
    out.push({ key: e.key, gewicht: e.gewicht, ...kopf, ...(e.erwaegungen ? { erwaegungen: e.erwaegungen } : {}) });
  }
  return out;
}

/** Kanten nach einer Facetten-Auswahl filtern. Rein, ordnungserhaltend (§2). */
export function filtereBezuege(bezuege: readonly Bezug[], auswahl: FacettenAuswahl): Bezug[] {
  return bezuege.filter((b) => {
    const f = b.facetten;
    if (auswahl.status?.size && !auswahl.status.has(f.status)) return false;
    if (auswahl.ebene?.size && !auswahl.ebene.has(f.ebene)) return false;
    if (auswahl.kanton?.size && !auswahl.kanton.has(f.kanton)) return false;
    if (auswahl.quelltyp?.size && !auswahl.quelltyp.has(f.quelltyp)) return false;
    return true;
  });
}

/**
 * Trefferzahlen je Status MIT ehrlicher Grundgesamtheit (§8).
 *
 * `gezeigt` ist, was im Shard steht (nach Deckel); `gesamt` ist, wie viele
 * Kanten es VOR dem Deckel gab. Beide Zahlen gehören zusammen ausgegeben —
 * «8 kantonale Entscheide» ohne das «von 214» ist die Vollständigkeits-
 * Behauptung, die §8 verbietet. Fehlt die Grundgesamtheit im Shard (Alt-Datei),
 * wird `gesamt` = `gezeigt` gesetzt: lieber gleich als erfunden.
 */
export function trefferJeStatus(shard: BezugsShard, artikelToken: string): Array<{
  status: BezugStatus; gezeigt: number; gesamt: number;
}> {
  const gezeigt: Partial<Record<BezugStatus, number>> = {};
  for (const b of bezuegeFuerArtikel(shard, artikelToken)) {
    gezeigt[b.facetten.status] = (gezeigt[b.facetten.status] ?? 0) + 1;
  }
  const gesamt = shard.gesamtProArtikel?.[artikelToken] ?? {};
  const alle = new Set<BezugStatus>([
    ...(Object.keys(gezeigt) as BezugStatus[]),
    ...(Object.keys(gesamt) as BezugStatus[]),
  ]);
  return [...alle]
    .sort((a, b) => STATUS_RANG[a] - STATUS_RANG[b])
    .map((status) => ({
      status,
      gezeigt: gezeigt[status] ?? 0,
      gesamt: gesamt[status] ?? gezeigt[status] ?? 0,
    }));
}

/**
 * Zwei Zahlen je Status-Klasse über den GANZEN Shard eines Erlasses (B7/c).
 *
 * ── DER BEFUND, DEN DIESE FUNKTION BEANTWORTET ─────────────────────────────
 * David 28.7.2026 zum Instanz-Schalter «Eidg.»: «das scheint keine funktion zu
 * haben?» Er war verdrahtet — er hatte nur nichts zu zeigen. Gemessen am
 * committeten Korpus trägt die Klasse `eidg` 164 Fundstellen an 93 von 6'217
 * Artikel-Buckets; an Art. 41 OR sind es null. Ein Steuerelement, das in 98,5 %
 * der Fälle wirkungslos aussieht, ohne zu sagen warum, ist von einem kaputten
 * nicht zu unterscheiden (§13 F4).
 *
 * ── WARUM ZWEI ZAHLEN UND NICHT EINE (Gegenprüfung Runde 1/I1, §8) ─────────
 * Die erste Fassung gab nur die KANTEN zurück und beschriftete sie im Panel als
 * «Entscheide». Das ist am einzelnen Artikel dasselbe (dort steht ein Entscheid
 * genau einmal), über einen ganzen Erlass aber nicht: ein BGE, der zwanzig
 * Artikel des BGG auslegt, ist EIN Entscheid und zwanzig Fundstellen. Gemessen
 * am BGG-Shard: 10'559 bge-Kanten gegen 1'253 verschiedene BGE — Faktor 8,4.
 * Der Korpus führt insgesamt nur 1'259 BGE; die Schalterzahl behauptete also
 * fast das Achtfache des gesamten Bestands. Das ist keine Ungenauigkeit,
 * sondern eine falsche Aussage über die Datenlage.
 * Seither trägt die Funktion beides, und die Bedienfläche benennt beides mit
 * seinem eigenen Wort: `dokumente` sind ENTSCHEIDE, `kanten` sind FUNDSTELLEN.
 *
 * Rein (§2). Kein Filter: die Zahlen sagen, was der Erlass HAT, nicht was
 * gerade eingestellt ist — sonst zeigte ein abgeschalteter Schalter immer 0 und
 * bewiese sich damit selbst.
 */
export interface KlassenZahlen {
  /** Verschiedene Dokumente dieser Klasse im Erlass — «Entscheide». */
  dokumente: number;
  /** (Artikel, Dokument)-Paare — «Fundstellen». Immer ≥ `dokumente`. */
  kanten: number;
}

export function klassenImShard(shard: BezugsShard | null | undefined): Partial<Record<BezugStatus, KlassenZahlen>> {
  const aus: Partial<Record<BezugStatus, KlassenZahlen>> = {};
  if (!shard) return aus;
  const gesehen: Partial<Record<BezugStatus, Set<string>>> = {};
  for (const eintraege of Object.values(shard.proArtikel)) {
    for (const e of eintraege) {
      const st = shard.dokumente[e.key]?.facetten.status;
      if (!st) continue;
      const z = aus[st] ?? (aus[st] = { dokumente: 0, kanten: 0 });
      z.kanten += 1;
      const set = gesehen[st] ?? (gesehen[st] = new Set());
      if (!set.has(e.key)) { set.add(e.key); z.dokumente += 1; }
    }
  }
  return aus;
}

/**
 * Korpusweite Facetten-Bilanz (`public/rechtsprechung/bezuege-bilanz.json`).
 *
 * Erzeugt vom selben Lauf wie die Shards und vom Tor check:bezuege aus ihnen
 * nachgerechnet — also eine Projektion, keine zweite Wahrheit (§5). Sie liefert
 * dem Rechtsprechungs-Dropdown die Aussage, die der Einzel-Erlass nicht machen
 * kann: dass eine Klasse KORPUSWEIT selten trägt und nicht bloss hier gerade.
 */
export interface BezugsBilanz {
  erzeugt: string;
  /** Fundstellen ((Artikel, Dokument)-Paare) je Klasse — NICHT Entscheide.
   *  Der Unterschied ist in `klassenImShard` gemessen und begründet (§8). */
  kantenJeStatus: Partial<Record<BezugStatus, number>>;
  artikelJeStatus: Partial<Record<BezugStatus, number>>;
  erlasseJeStatus: Partial<Record<BezugStatus, number>>;
  artikelGesamt: number;
  erlasseGesamt: number;
}

