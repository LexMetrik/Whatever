import type { SuchTreffer } from '../universalSuche';
import { sucherTerme, rangiere, type RankEintrag } from './artikelRanking';
import { normalisiereBegriff, expandiereSuchbegriff } from './vokabular';
import { erlassPfadVonKey } from '../normtext/erlassAdresse';
import { ladeJsonStreng, pruefeFelder } from '../ladeJson';

const INDEX_PRUEFER = pruefeFelder('such-index/artikel.json', { eintraege: 'array' });

// ─── Artikel-Volltextsuche (ROADMAP Schritt 5, FlexSearch) ──────────────────
//
// LAZY: FlexSearch-Lib UND der Artikel-Index werden erst beim ERSTEN Aufruf dynamisch
// geladen und client-seitig zu einem Index gebaut — nie im Haupt-Bundle (§3/§6.4:
// eigener Chunk, nur Ladezeitpunkt). Danach gecacht. Term-/Zitat-Suche (z. B.
// «243 ZPO», «Notwehr»), KEINE semantische Suche — deklinationsabhängige Phrasen
// treffen unscharf (§8, ehrlich kommuniziert).
//
// UI-NAV S4: FlexSearch liefert nur noch den RECALL (Kandidatenmenge); die
// Reihenfolge bestimmt die deterministische Relevanz-Schicht artikelRanking.ts
// (Sachüberschrift-Boost + Termfrequenz + Kernerlass-Priorität + Synonyme). Feld
// `m` (Marginalie/Gliederung) macht Alltagsbegriffe wie «Miete» auffindbar, die
// im Artikeltext nie vorkommen (K10: dasselbe Daten-Sidecar, das der Reader nutzt).

interface IndexEintrag extends RankEintrag {
  k: string; ku: string; a: string; l: string; m: string; n: string; g: string; t: string; tb: string; f: string;
  /** Ebene des Erlasses — trägt den href auf die richtige Route. */
  eb: 'bund' | 'kanton';
  /** Kantonskürzel («AG») bei eb==='kanton', sonst ''. */
  kt: string;
}

// Kandidaten-Pool: deutlich grösser als das Anzeige-Limit, damit die Re-Rangierung
// die wirklich relevanten Treffer aus einer breiten Recall-Menge heben kann.
const POOL = 300;

/** Was die Anwendung vom lazy geladenen Index bekommt: die Suchfunktion PLUS die
 *  ehrliche Auskunft, welche Ebenen noch fehlen. Ohne dieses zweite Feld wäre das
 *  Staffeln keine Performance-Massnahme, sondern eine Auskunftslücke: eine leere
 *  kantonale Trefferliste liest sich sonst als «es gibt keine kantonale
 *  Bestimmung» statt als «wird noch geladen» (§8, Auflage David 25.7.2026). */
export interface ArtikelSuche {
  suche: (q: string, limit?: number) => SuchTreffer[];
  /** Noch nicht im Index — leer, sobald alle ERWARTETEN Ebenen stehen. */
  fehlendeEbenen: Ebene[];
  /** Ebenen, die das Artefakt GAR NICHT trägt (K3-Scharfschaltung 1.9.2026:
   *  «kanton»). Kategorisch verschieden von `fehlendeEbenen`: dort wird noch
   *  geladen, hier kommt nichts mehr nach — die Ebene liegt ausschliesslich am
   *  Edge. Zwei Felder statt eines Flags, weil die Oberfläche zwei VERSCHIEDENE
   *  Sätze sagen muss: «wird noch geladen» ist eine Vertröstung, «nur online»
   *  eine dauerhafte Einschränkung mit Offline-Folge (§8). Ein einziges Feld
   *  hätte die beiden Fälle stillschweigend gleichgesetzt. */
  nurOnlineEbenen: Ebene[];
}

/** Ersatz, wenn der Index-Abruf GANZ scheitert (Netz, 404, kaputtes JSON).
 *  Meldet BEIDE Ebenen als «nur online» — nicht aus Vorsicht, sondern weil es
 *  in diesem Zustand stimmt: lokal ist nichts durchsuchbar, die Edge-Suche
 *  deckt Bund UND Kanton ab, also ist sie der einzige verbleibende Weg. Bis zum
 *  1.9.2026 trug dieser Pfad `fehlendeEbenen: []` / keine Ebene — die
 *  Gesetzestext-Gruppe fiel damit ohne Treffer aus der Liste und die Suche
 *  verschwieg, dass ihr halber Bestand gar nicht geladen war (§8). */
export const SUCHE_OHNE_INDEX: ArtikelSuche = {
  suche: () => [],
  fehlendeEbenen: [],
  nurOnlineEbenen: ['bund', 'kanton'],
};

let fertig: ArtikelSuche | null = null;
let ladePromise: Promise<ArtikelSuche> | null = null;
/** Abnehmer, die beim Nachrücken einer Ebene neu auswerten wollen. */
const abnehmer = new Set<(s: ArtikelSuche) => void>();

/**
 * Liefert (lazy, gecacht) die Artikel-Suche — GESTAFFELT: das Promise löst auf,
 * sobald der BUND durchsuchbar ist; die kantonale Ebene rückt danach nach und
 * meldet sich über `beiNachladen`.
 *
 * `beiNachladen` ist keine Kür: eine laufende Suche muss automatisch neu
 * ausgewertet werden, sobald der kantonale Index steht — niemand darf gezwungen
 * sein, dieselbe Query ein zweites Mal zu tippen (Auflage David 25.7.2026).
 * Kommt der Abnehmer zu spät (Index schon vollständig), wird er NICHT mehr
 * gerufen; dafür trägt das aufgelöste Objekt `fehlendeEbenen: []`.
 */
export function ladeArtikelSuche(beiNachladen?: (s: ArtikelSuche) => void): Promise<ArtikelSuche> {
  if (beiNachladen && !fertig) abnehmer.add(beiNachladen);
  if (fertig) return Promise.resolve(fertig);
  if (!ladePromise) ladePromise = baue();
  return ladePromise;
}

function snippet(text: string, q: string): string {
  const lower = text.toLowerCase();
  const term = q.toLowerCase().split(/\s+/).find((w) => w.length > 2 && lower.includes(w));
  if (!term) return text.length > 120 ? text.slice(0, 120).trimEnd() + ' …' : text;
  const i = lower.indexOf(term);
  const start = Math.max(0, i - 45);
  const ende = Math.min(text.length, start + 130);
  return (start > 0 ? '… ' : '') + text.slice(start, ende).trim() + (ende < text.length ? ' …' : '');
}

function treffer(e: IndexEintrag, q: string): SuchTreffer {
  // HERKUNFT EHRLICH (§8, W2·5): Seit der Kanton im selben Index liegt, muss ein
  // kantonaler Treffer als kantonal lesbar sein — sonst liest sich «§ 1
  // Anwaltstarif» wie Bundesrecht. Zwei Träger, bewusst redundant (dasselbe
  // Muster wie gesetzGruppe in universalSuche.ts):
  //   · Label-Suffix « · AG» — steht auch dort, wo keine Marke gerendert wird.
  //   · Marke «AG» OHNE `redundant` — die Bund-Marke «Gesetzestext» ist auf
  //     Mobile ausgeblendet (redundant zum Gruppentitel), das Kantonskürzel
  //     trägt dagegen Information und muss auf JEDER Breite sichtbar bleiben.
  const kantonal = e.eb === 'kanton' && e.kt !== '';
  return {
    id: `art:${e.k}:${e.a}`,
    // Label: Anzeige-Kürzel (e.ku, «StGB»); href: ROUTEN-Key (e.k, «STGB»).
    label: kantonal ? `${e.l} ${e.ku} · ${e.kt}` : `${e.l} ${e.ku}`,
    untertitel: snippet(e.t, q),
    marke: kantonal
      ? { text: e.kt, ton: 'soft' as const }
      : { text: 'Gesetzestext', ton: 'soft' as const, redundant: true },
    href: `${erlassPfadVonKey(e.k, e.eb)}#art-${e.a}`,
  };
}

// Minimal-Typen für die FlexSearch-Document-Oberfläche (die Lib bringt keine
// passenden ESM-Typen für diese Nutzung mit).
interface DocLike {
  add(doc: { id: number; t: string; l: string; m: string; n: string; g: string; tb: string; f: string }): void;
  search(q: string, opt: { limit: number; suggest: boolean }): { field: string; result: (number | string)[] }[];
}
type FlexLike = {
  Document: new (cfg: unknown) => DocLike;
  Charset?: { LatinBalance?: unknown };
};

// ─── UND-Verknüpfung + Wortgrenzen-Schutz (Befund 29, Cowork 21.8.2026) ──────
//
// FlexSearch verknüpft eine MEHRWORT-Anfrage bei `suggest: true` faktisch NICHT
// per UND, sondern näherungsweise: «OR 257d» traf dann jeden Artikel, dessen
// irgendein Feld ein Wort mit dem Präfix «or» führt (Ordnung, Organisation, …)
// — «257d» wurde von diesen zahlreichen Treffern schlicht aus dem POOL-Fenster
// verdrängt, bevor der Einzelterm je an die Reihe kam (verifiziert: `doc.search
// ('or 257d', {suggest:true})` traf Dokumente, die nur EINEN der beiden Begriffe
// enthalten; `suggest:false` verknüpft dieselbe Anfrage korrekt per UND).
//
// Fix: der Recall-Pool bleibt wie bisher (FlexSearch liefert weiterhin die
// Kandidatenmenge, inkl. Synonym-Ausweitung) — zusätzlich muss bei ≥2
// signifikanten Termen JEDER Term den Kandidaten an einer WORTGRENZE treffen
// (Präfix-Match ab Wortanfang, exakt die Semantik von `tokenize:'forward'` —
// «or» matcht «Ordnung», nie ein Fragment mitten im Wort). Längere Terme
// («Miet» → «Mietzins») sind von dieser Prüfung unberührt, da sie schon vorher
// nur an Wortgrenzen griffen (Wortpräfix-Match, kein Substring-Match).
//
// KORREKTUR (Gegenprüfung 21.8.2026, Befund B2): «inkl. Synonym-Ausweitung» galt
// nur für den Recall-Pool, NICHT für den UND-Filter selbst — ein Kandidat, der
// nur über die Vokabular-Expansion eines Terms in den Pool kam (z. B. «geburt»
// als Synonym-Treffer von «vaterschaftsurlaub»), musste bislang trotzdem JEDEN
// orig-Term LITERAL an einer Wortgrenze tragen. «vaterschaftsurlaub» allein traf
// (Einzelterm, kein UND), «vaterschaftsurlaub lohn» lieferte 0, weil der Artikel
// das Kompositum nie im Wortlaut führt. Fix: ein Term gilt im UND-Filter als
// getroffen, wenn ER SELBST ODER EINE SEINER SYNONYM-EXPANSIONEN (dieselbe
// Funktion `expandiereSuchbegriff`, die auch den Recall-Pool speist, §5) den
// Kandidaten an einer Wortgrenze trifft.
const WORTGRENZEN_FELDER = ['t', 'l', 'm', 'n', 'g', 'tb', 'f', 'ku', 'k'] as const;
const haystackCache = new WeakMap<IndexEintrag, string>();

// FIX (Gegenprüfung 21.8.2026, Befund B1): die Terme durchlaufen `normalisiereBegriff`
// (NFKD, diakritika-bereinigt: «Kündigung» → «kundigung», s. sucherTerme/tokens()
// in artikelRanking.ts) — der Haystack MUSS dieselbe Normalisierung tragen, sonst
// trifft `'kündigung'.indexOf('kundigung')` nie (=-1) und JEDE Mehrwort-Query mit
// Umlaut lieferte 0 Treffer. `.toLowerCase()` allein reicht nicht: Normalisierung
// läuft je Kandidat GENAU EINMAL (WeakMap-Cache), nicht je Term — Performance bleibt
// linear in der Kandidatenzahl, nicht in Kandidaten × Termen.
function haystack(e: IndexEintrag): string {
  let h = haystackCache.get(e);
  if (h === undefined) {
    h = normalisiereBegriff(WORTGRENZEN_FELDER.map((f) => (e as unknown as Record<string, string>)[f] ?? '').join(' '));
    haystackCache.set(e, h);
  }
  return h;
}

/** Trifft `term` den Kandidaten an einer WORTGRENZE (Wortanfang), nie als
 *  Fragment mitten in einem längeren Wort? Spiegelt FlexSearch
 *  `tokenize:'forward'` — Grundlage der UND-Verknüpfung unten. */
function trifftWortgrenze(e: IndexEintrag, term: string): boolean {
  const h = haystack(e);
  let i = h.indexOf(term);
  while (i !== -1) {
    const davor = i === 0 ? '' : h[i - 1];
    if (!/[a-z0-9]/.test(davor)) return true;
    i = h.indexOf(term, i + 1);
  }
  return false;
}

export type Ebene = 'bund' | 'kanton';
/** Aufbau- UND Recall-Reihenfolge: Bund zuerst (s. baueSucher). */
const EBENEN_REIHE: readonly Ebene[] = ['bund', 'kanton'];

/** Einträge je Aufbau-Häppchen, bevor die Kontrolle an den Browser zurückgeht.
 *  Klein genug, dass Tippen/Scrollen während des Nachladens flüssig bleibt;
 *  gross genug, dass der Yield-Overhead nicht die Aufbauzeit dominiert. */
const HAEPPCHEN = 2000;

export interface Sucher {
  /** Nimmt ALLE Einträge einer Ebene synchron in den Index auf. */
  ergaenze(eb: Ebene): void;
  /** Wie `ergaenze`, aber in Häppchen — gibt zwischendurch die Kontrolle zurück,
   *  damit der Hauptthread während des Nachladens nicht blockiert (§15). */
  ergaenzeGestaffelt(eb: Ebene): Promise<void>;
  /** Ebenen, die bereits im Index stehen (in EBENEN_REIHE-Ordnung). */
  bereiteEbenen(): Ebene[];
  suche(q: string, limit?: number): SuchTreffer[];
}

/**
 * Baut den INKREMENTELLEN Sucher: je Ebene ein FlexSearch-Index, ergänzbar
 * NACH der ersten Nutzung. Die Dokument-IDs sind die GLOBALEN Positionen in
 * `eintraege` — darum lässt sich der Kanton später zuschalten, ohne den
 * Bund-Index neu zu bauen (der wäre sonst zweimal zu zahlen, s. `baue()`).
 * Herausgezogen (§5), damit der Query-Testset-Test (src/tests/suche/…) exakt
 * dieselbe Pipeline (Recall + Re-Rangierung) gegen den echten Korpus fährt.
 */
export function baueSucher(eintraege: IndexEintrag[], FlexSearch: FlexLike): Sucher {
  const Document = FlexSearch.Document;
  const Charset = FlexSearch.Charset;
  const neuesDoc = () => new Document({
    document: {
      id: 'id',
      index: [
        { field: 't', tokenize: 'forward' },
        { field: 'l', tokenize: 'forward' },
        // S4: Marginalie (primär + nachrangig) + Gliederung als eigene Recall-
        // Felder — «Miete» findet so «Achter Titel: Die Miete», auch wo der
        // Artikeltext das Wort nie führt.
        { field: 'm', tokenize: 'forward' },
        { field: 'n', tokenize: 'forward' },
        { field: 'g', tokenize: 'forward' },
        // G-SUCH: Tabellen-Tier (Tabellenzellen + Bild-Alt + grundlage) und
        // Fussnoten-Body als eigene Recall-Felder — findet Werte, die NUR in
        // einer Tabelle oder Fussnote stehen (Korpus-Suche fand sie bisher nie).
        { field: 'tb', tokenize: 'forward' },
        { field: 'f', tokenize: 'forward' },
      ],
    },
    encoder: Charset?.LatinBalance,
  });

  // EIN INDEX JE EBENE (W2·5) — nicht ein gemeinsamer.
  //
  // Gemessen am 25.7.2026, und der Grund für diese Aufteilung: FlexSearch kappt
  // JE FELD bei `limit`. In einem gemeinsamen Index teilen sich Bund und Kanton
  // dieses eine Kontingent — die 29 055 kantonalen Artikel drückten OR 253
  // («Miete» ist dort NUR über die Gliederung «Achter Titel: Die Miete»
  // erreichbar) im g-Feld von Rang 259 auf 339 und damit aus dem 300er-Fenster:
  // der zentrale Mietrechts-Artikel war über «Miete» nicht mehr auffindbar.
  //
  // Mit einem eigenen Recall-Kontingent je Ebene ist der Bund-Recall EXAKT der
  // von vorher — er hängt nicht mehr davon ab, wie viel kantonales Recht im
  // Korpus liegt. Jeder weitere Kanton kann die Bund-Trefferlage damit nicht
  // mehr verschlechtern (§1: Vollständigkeit vor Sparsamkeit; §6: der Zuwachs
  // verschlechtert Bestehendes nicht). Die Re-Rangierung sieht danach beide
  // Mengen und ordnet sie deterministisch (artikelRanking: Bund vor Kanton bei
  // gleicher Themennähe).
  const indizes: { eb: Ebene; doc: DocLike }[] = [];

  /** Gehört der Eintrag zu dieser Ebene? Ein unbekanntes/fehlendes `eb` zählt
   *  zum Bund statt ins Nichts — ein Eintrag darf nie unauffindbar werden, nur
   *  weil sein Ebenen-Feld fehlt (§8). */
  const gehoertZu = (e: IndexEintrag, eb: Ebene) =>
    e.eb === eb || (eb === 'bund' && e.eb !== 'kanton');

  /** @returns Zahl der eingefügten Einträge. Trägt die EBENEN-EHRLICHKEIT (§8, s.
   *  `ergaenze`): eine Ebene, für die der Index nichts liefert, darf nicht als
   *  bereit gelten — sonst meldete `fehlendeEbenen` sie als vorhanden. */
  const fuegeEin = (doc: DocLike, eb: Ebene, von: number, bis: number): number => {
    let anzahl = 0;
    for (let i = von; i < bis; i++) {
      const e = eintraege[i];
      if (!gehoertZu(e, eb)) continue;
      anzahl++;
      doc.add({
        id: i,
        // Kürzel UND Routen-Key mitindexieren (z. B. «StGB» und «STGB», «ArGV 1»/«ARGV_1»).
        t: (e.l + ' ' + e.ku + ' ' + e.k + ' ' + e.t).toLowerCase(),
        l: (e.l + ' ' + e.ku + ' ' + e.k).toLowerCase(),
        m: e.m.toLowerCase(),
        n: e.n.toLowerCase(),
        g: e.g.toLowerCase(),
        tb: (e.tb ?? '').toLowerCase(),
        f: (e.f ?? '').toLowerCase(),
      });
    }
    return anzahl;
  };

  /** Neuen Ebenen-Index anlegen und in EBENEN_REIHE-Ordnung einhängen (Bund vor
   *  Kanton) — die Recall-Schleife unten läuft in dieser Ordnung. */
  const haengeEin = (eb: Ebene, doc: DocLike) => {
    indizes.push({ eb, doc });
    indizes.sort((a, b) => EBENEN_REIHE.indexOf(a.eb) - EBENEN_REIHE.indexOf(b.eb));
  };

  // Feld-Priorität im Recall: Marginalie/Gliederung ZUERST einsammeln, damit
  // topische Treffer nicht von der (oft grösseren) Textmenge aus dem Pool
  // gedrängt werden. Kritisch für Fälle wie OR 253, dessen Artikeltext das Wort
  // «Miete» nie führt — er ist NUR über die Gliederung «Die Miete» auffindbar.
  // tb/f sammeln NACH dem Haupttext ein (niedrigster Recall-Rang): ein reiner
  // Tabellen-/Fussnoten-Treffer soll topische und Haupttext-Treffer nicht aus dem
  // Pool drängen. Tabelle vor Fussnote (Feld-Gewichtung t > m > n > g > tb > f).
  const FELD_PRIO: Record<string, number> = { m: 0, n: 1, g: 2, l: 3, t: 4, tb: 5, f: 6 };

  const suche = (q: string, limit = 40): SuchTreffer[] => {
    // RECALL: Original-Query + Vokabular-Synonyme (OCL-portiert, §2-deterministisch)
    // über alle Felder sammeln — grosser Pool, damit die Re-Rangierung die besten
    // Treffer heben kann (z. B. «vaterschaftsurlaub» → «Urlaub … Geburt»).
    const { orig, syn } = sucherTerme(q);
    const terme = [q.toLowerCase(), ...orig, ...syn];
    const gesehen = new Set<number>();
    const kandidaten: IndexEintrag[] = [];
    for (const term of terme) {
      if (kandidaten.length >= POOL) break;
      // Je Ebene das VOLLE Kontingent (POOL je Feld) — die Ebenen konkurrieren
      // nicht um dieselben Plätze. Bund zuerst eingesammelt, damit die
      // Ankunftsordnung der rein textuellen Stufe (rangiere, Gruppe B) die
      // bisherige bleibt.
      for (const { doc } of indizes) {
        const buckets = doc.search(term, { limit: POOL, suggest: true })
          .slice()
          .sort((a, b) => (FELD_PRIO[a.field] ?? 9) - (FELD_PRIO[b.field] ?? 9));
        for (const bucket of buckets) {
          for (const id of bucket.result) {
            const n = id as number;
            if (!gesehen.has(n)) { gesehen.add(n); kandidaten.push(eintraege[n]); }
          }
        }
      }
    }
    // UND-Verknüpfung (Befund 29): bei ≥2 signifikanten Termen («OR 257d») muss
    // JEDER Term an einer Wortgrenze treffen — sonst würde ein zweiter Term
    // faktisch ignoriert, sobald ein freizügiger erster Term (z. B. das kurze
    // «or») den Kandidaten-Pool allein schon füllt. Ein einzelner Term bleibt
    // unverändert (kein AND nötig, keine Verschlechterung von «Miet» → «Mietzins»).
    // Je orig-Term EINMAL (nicht je Kandidat) die eigenen Synonym-Expansionen
    // holen (Befund B2) — ein Term gilt als getroffen, wenn er selbst ODER
    // eine seiner Expansionen trifft. Bewusst PRO TERM statt der gemeinsamen
    // `syn`-Liste der ganzen Query: ein Term darf nur über SEINE EIGENEN
    // Synonyme durchgelassen werden, nicht über die eines anderen Terms.
    const termGruppen = orig.length >= 2
      ? orig.map((t) => {
          const exp = expandiereSuchbegriff(t);
          return exp.length ? [t, ...exp] : [t];
        })
      : null;
    const gefiltert = termGruppen
      ? kandidaten.filter((e) => termGruppen.every((gruppe) => gruppe.some((t) => trifftWortgrenze(e, t))))
      : kandidaten;

    // RE-RANGIERUNG (S4): deterministische Relevanz statt FlexSearch-Roh-Ordnung.
    return rangiere(gefiltert, q, limit).map((e) => treffer(e, q));
  };

  return {
    // EBENE OHNE EINTRÄGE WIRD NICHT EINGEHÄNGT (K3-Vorbereitung, 31.8.2026).
    //
    // Heute verhaltensneutral: der ausgelieferte Index trägt beide Ebenen, die
    // Zählung ist immer > 0, es ändert sich nichts. Die Regel greift erst, wenn
    // der Generator eine Ebene weglässt (SUCHE_INDEX_EBENEN, s.
    // scripts/such-index-generieren.ts) — dann MUSS `fehlendeEbenen` diese Ebene
    // melden, damit die Oberfläche sie als fehlend ausweist statt Vollständigkeit
    // zu behaupten (§8). Ohne diese Zeile hinge ein leerer Ebenen-Index im
    // `indizes`-Array, `bereiteEbenen()` meldete ihn als bereit, `fehlendeEbenen`
    // bliebe leer — und die Suche verschwiege 29 055 kantonale Artikel lautlos.
    ergaenze(eb) {
      const doc = neuesDoc();
      if (fuegeEin(doc, eb, 0, eintraege.length) === 0) return;
      haengeEin(eb, doc);
    },
    async ergaenzeGestaffelt(eb) {
      const doc = neuesDoc();
      let anzahl = 0;
      for (let von = 0; von < eintraege.length; von += HAEPPCHEN) {
        anzahl += fuegeEin(doc, eb, von, Math.min(von + HAEPPCHEN, eintraege.length));
        // Kontrolle zurück an den Browser: Eingabe und Scrollen bleiben während
        // des Nachladens bedienbar. Erst NACH dem letzten Häppchen einhängen —
        // ein halb gefüllter Index würde sonst unvollständige Treffer liefern
        // und damit genau die Auskunftslücke erzeugen, die das Staffeln
        // vermeiden soll (§8).
        await new Promise((r) => setTimeout(r, 0));
      }
      if (anzahl === 0) return; // s. `ergaenze` — leere Ebene bleibt «fehlend»
      haengeEin(eb, doc);
    },
    bereiteEbenen: () => indizes.map((i) => i.eb),
    suche,
  };
}

/**
 * Baut die synchrone Suchfunktion über ALLE Ebenen — die einfache, vollständige
 * Form für Tests und Mess-Werkzeuge (`suche-eval`, Query-Testset). Die Anwendung
 * lädt stattdessen gestaffelt, s. `baue()`.
 */
export function baueSuchFn(eintraege: IndexEintrag[], FlexSearch: FlexLike): (q: string, limit?: number) => SuchTreffer[] {
  const sucher = baueSucher(eintraege, FlexSearch);
  for (const eb of EBENEN_REIHE) sucher.ergaenze(eb);
  return sucher.suche;
}

/**
 * GESTAFFELTER AUFBAU (W2·5, Auflage David 25.7.2026).
 *
 * Der volle Index wird weiterhin VOLLSTÄNDIG geladen — gestaffelt ist nur der
 * Zeitpunkt, zu dem eine Ebene durchsuchbar wird, nicht der Inhalt. Gemessen am
 * 25.7.2026: ungestaffelt lag die erste Trefferanzeige bei 5 328 ms, weil vor der
 * ersten Antwort BEIDE Ebenen indexiert wurden; auf dem ~3.9× langsameren
 * CI-Runner riss das die 10-s-Assertion-Grenze der Browser-Smoke-Suite.
 *
 * Reihenfolge: Bund zuerst (Alltagsfall, hält die bisherige Zeit bis zum ersten
 * Treffer), Kanton in Häppchen hinterher. Beide Ebenen sind am Ende vollständig
 * da; wer währenddessen sucht, sieht das über `fehlendeEbenen` in der Oberfläche.
 */
async function baue(): Promise<ArtikelSuche> {
  const [flex, daten] = await Promise.all([
    import('flexsearch'),
    ladeJsonStreng<{ eintraege: IndexEintrag[]; ebenen?: Ebene[] }>(import.meta.env.BASE_URL + 'such-index/artikel.json', INDEX_PRUEFER),
  ]);
  const FlexSearch = ((flex as unknown as { default?: unknown }).default ?? flex) as FlexLike;
  const sucher = baueSucher(daten.eintraege, FlexSearch);

  // WELCHE EBENEN DAS ARTEFAKT ÜBERHAUPT TRÄGT (K3-Scharfschaltung 1.9.2026).
  // Der Generator schreibt sie in `ebenen` — genau dafür steht das Feld dort seit
  // K3. Ohne diese Zeile müsste der Client aus der Abwesenheit von Einträgen
  // RATEN, ob eine Ebene noch lädt oder gar nicht erst gebaut wurde; das sind zwei
  // verschiedene Auskünfte an den Nutzer (§8). Fallback auf alle Ebenen nur für
  // ein altes Artefakt ohne das Feld — dann verhält sich der Client wie vor K3.
  const erwartet: readonly Ebene[] = daten.ebenen?.length
    ? EBENEN_REIHE.filter((eb) => daten.ebenen!.includes(eb))
    : EBENEN_REIHE;
  const nurOnline = EBENEN_REIHE.filter((eb) => !erwartet.includes(eb));

  // Stufe 1: Bund — ab hier ist die Suche benutzbar.
  sucher.ergaenze('bund');
  const nachStufe = (): ArtikelSuche => ({
    suche: sucher.suche,
    fehlendeEbenen: erwartet.filter((eb) => !sucher.bereiteEbenen().includes(eb)),
    nurOnlineEbenen: [...nurOnline],
  });
  const erste = nachStufe();

  // Stufe 2: die restlichen Ebenen im Hintergrund. Bewusst NICHT awaited — das
  // Promise dieser Funktion löst mit Stufe 1 auf. Scheitert das Nachladen, bleibt
  // die Bund-Suche nutzbar und `fehlendeEbenen` weiterhin gefüllt: die Oberfläche
  // sagt dann dauerhaft, dass kantonale Treffer fehlen, statt Vollständigkeit
  // vorzutäuschen (§8).
  void (async () => {
    for (const eb of erwartet) {
      if (sucher.bereiteEbenen().includes(eb)) continue;
      try { await sucher.ergaenzeGestaffelt(eb); } catch { /* Ebene bleibt als fehlend gemeldet */ }
    }
    fertig = nachStufe();
    for (const melde of abnehmer) melde(fertig);
    abnehmer.clear();
  })();

  return erste;
}
