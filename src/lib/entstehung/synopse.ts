// ─── Synopse alt/neu am Artikel ──────────────────────────────────────────────
//
// E5 von «Entstehung am Artikel» (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.4/§11.6).
// Zu jeder Fedlex-Konsolidierung ab Stand 1.1.2021 liegt der volle Wortlaut als
// Akoma-Ntoso-XML vor. Der Shard je Erlass hält je Konsolidierungs-SCHRITT die
// **Alt-Fassung** der Artikel, die sich in diesem Schritt geändert haben oder
// entfallen sind — und NUR die Alt-Fassung: die Neu-Fassung ist die Alt-Fassung des
// Folgeschritts bzw. der geltende Snapshot (§5, halbiert das Volumen; Recherche R2).
//
// FENSTER (§8 — die Grenze wird benannt, nicht verschwiegen): HTML/XML alter Stände
// gibt es erst ab 1.1.2021 (R2 §1: korpusweit 1369 html-Stände, davon nur 156 vor
// 2021, fast alle davon geltende Fassungen unveränderter Erlasse). Für ältere
// Fassungen existiert nur `doc`/`pdf-a` — dafür gibt es hier bewusst NICHTS, und die
// Oberfläche sagt «Fassungsvergleich erst für Stände ab 2021 verfügbar».
//
// ZITAT (§7 a–d): der gespeicherte Alt-Block ist gespeicherter Gesetzestext und trägt
// deshalb alle vier Merkmale — (a) `stand` der historischen Konsolidierung, (b) die
// Filestore-URL der ausgewerteten Manifestation (aus `isExemplifiedBy`, NIE
// konstruiert), (c) `liveUrl` auf die amtliche Fassung dieses Stands, (d) zwei
// Prüfsummen je Quelle und je Block als Drift-Erkennung.
//
// NORMALISIERUNGS-PROFIL: `entstehung-norm/4`. Ein gelandetes Profil wird NIE editiert —
// eine Verbesserung bekommt die nächste Nummer und entsteht daneben. Sonst entwertet jede
// Parser-Korrektur rückwirkend alle Prüfsummen (Muster law.soufien.lu, `soufien-lex.md`).
//
// §3 Schichtentrennung: Typen + Lazy-Loader + reine Auswahl-Helfer. Keine UI, keine
// Rechtslogik, kein Fetch im Lesefluss (der Shard lädt erst auf Klick, §15).

/**
 * Version des Normalisierungs-Profils. Ein GELANDETES Profil wird nie editiert — eine
 * Verbesserung bekommt eine neue Nummer und entsteht daneben, sonst entwertet sie
 * rückwirkend jede gespeicherte Prüfsumme (Muster law.soufien.lu, `soufien-lex.md`).
 *
 * WARUM ES KEIN `/1` IM REPO GIBT: die Fassung /1 ist nie gelandet. Sie fiel in der
 * Gegenprüfung zu PR #794 durch (Prüfer-Stichprobe n = 13 auf `ohne_ereignis`-Blöcken:
 * 11/13 = 84,6 %, unter der Schwelle von 90 %) an zwei Artefakt-Klassen, die die
 * Bau-Stichprobe nicht getroffen hatte — siehe `normalisiere()`. Es gibt also keinen
 * Bestand, den /2 entwerten könnte; die Nummer wächst trotzdem, damit die Provenienz
 * der Prüfsummen eindeutig bleibt.
 *
 * `/3` (Befund Bauer #796, 11.9.2026): `/2` verglich weiterhin den GANZEN
 * Artikel-Innenraum (`flachText`), der Leser aber nur die gespeicherten `bloecke`
 * (`zerlegeBloecke`, ausschliesslich `<paragraph>`-Inhalt) — zwei verschiedene
 * Vergleichs-SCOPES, nicht nur zwei Zeichentabellen (§5: zwei Wahrheiten). Ein
 * `<heading>`/`<subheading>`-Randvermerk, der sich ändert, während der Artikeltext
 * byte-gleich bleibt (Beleg AVIV Art. 109b, 2021-04-01 → 2021-07-01: derselbe
 * Absatz, der Querverweis «(Art. 83 Abs. 1 Bst. i und o AVIG)» wird zu
 * «(Art. 83 Abs. 1bis AVIG)» wegen einer Umnummerierung ANDERSWO im Erlass), liess
 * den Generator «geändert» buchen und den Leser «kein Unterschied» zeigen — Messung
 * 11.9.2026: 36 von 3484 `belegt`-Blöcken, 34 von 999 `ohne_ereignis`-Blöcken (70
 * insgesamt). `/3` schneidet `flachText` auf denselben `<paragraph>`-Scope wie
 * `zerlegeBloecke` zurück UND bezieht die Zeichen-Normalisierung («geändert ja/nein»)
 * aus DERSELBEN Funktion wie der Leser (`src/lib/entstehung/normalisierung.ts`,
 * `vergleichsform`/`vergleichsformLeerraumBlind`) statt aus einer zweiten,
 * eigenständigen Zeichenliste. Der gespeicherte Wortlaut (`bloecke`) ist von alledem
 * unberührt — nur die Entscheidung «geändert ja/nein» wird geschärft.
 *
 * `/4` (Gegenprüfung PR #798, 12.9.2026 — `/3` ist NIE GELANDET und wird darum wie `/1`
 * ersetzt statt editiert): die Gegenprüfung hat an `/3` zwei Fehler belegt.
 *  (A1) `zerlegeBloecke` kannte je Absatz nur `listIntroduction` + `item`, nie den
 *       Fliesstext davor, dazwischen oder DANACH (gemessen 12.9.2026: 651 Absätze je
 *       Stand mit Nachlauftext). `/3` hat diese STORAGE-Lücke nicht geschlossen, sondern
 *       den Nachlauftext aus dem VERGLEICH geworfen («Regel (c)») — und damit vier echte
 *       Wortlautänderungen von KLV Art. 12 Bst. e gelöscht (Kantonsliste der
 *       Früherkennungsprogramme: «Basel-Stadt, Freiburg, Genf …» wird um Bern und Luzern
 *       erweitert, Schritte 2021-11-04 → 2022-01-01, 2022-10-01 → 2023-01-01,
 *       2024-07-01 → 2025-01-01, 2026-05-11 → 2026-07-01). `/4` erfasst den Text im
 *       SPEICHER und vergleicht ihn darum wieder.
 *  (A2) `/3` nahm die Sachüberschrift ganz aus dem Vergleich — damit wurden 35 Schritte
 *       unsichtbar, in denen sich NUR der amtliche Randtitel änderte (BVG Art. 33b
 *       «Erwerbstätigkeit nach dem ordentlichen Rentenalter» → «… nach dem
 *       Referenzalter», STPO Art. 55/431, HMG Art. 41, HREGV Art. 77, PARTG Art. 10,
 *       AHVV Art. 52a, EPV Art. 90, VAG Art. 84, FINFRAG Art. 41 …). Der Leser sagte
 *       «kein Unterschied erkennbar», und das war falsch (§8). `/4` vergleicht den Titel
 *       wieder — aber er wird auch GESPEICHERT (`ueberschrift`/`ueberschriftNeu`), damit
 *       der Leser den Unterschied sehen kann statt ihn nur zu erben (§5).
 */
export const NORM_PROFIL = 'entstehung-norm/4';

/** Frühester Stand mit maschinenlesbarem Volltext (R2 §1, gemessen 6.9.2026). */
export const SYNOPSE_FENSTER_AB = '2021-01-01';

/** Verzeichnis der Shards (öffentliche Auslieferung, lädt erst auf Klick). */
export const SYNOPSE_DIR = 'public/materialien/synopse';

/**
 * Ein Block (Absatz, Ziffer, Buchstabe) der Alt-Fassung als TUPEL
 * `[absatz, num, text]` — Wortlaut amtlich.
 *
 * Beide Etiketten sind die LITERALEN `<num>` des AKN-Baums; es wird nie eines
 * zusammengesetzt oder erfunden (Skill `scraping-swiss-official-sources`: Listen-
 * Etiketten unterscheiden sich je Sprache und Erlass, `a.` vs. `abis` vs. Gedankenstrich).
 * Leerer String = kein Etikett auf dieser Ebene.
 *
 * WARUM TUPEL statt Objekt: 33 000 Blöcke × drei Schlüsselnamen sind gemessen 0,6 MB
 * reines Gerüst auf einem Artefakt mit 8-MB-Deckel (§11.6 — den Deckel hebt man nie an,
 * man senkt die Nutzlast). `SynopseBlockIndex` benennt die Stellen, damit der Zugriff
 * lesbar bleibt.
 */
export type SynopseBlock = readonly [absatz: string, num: string, text: string];

/** Sprechende Indizes für `SynopseBlock` (nie Zahlen im Konsumenten-Code). */
export const SynopseBlockIndex = { absatz: 0, num: 1, text: 2 } as const;

/** Gültigkeits-Zustand eines Alt-Blocks gegen die Fussnoten-Historie (§8, nie still aufgelöst). */
export type SynopseZustand =
  /** Textänderung UND passendes Fussnoten-Ereignis am selben Stand-Datum. */
  | 'belegt'
  /** Textänderung ohne Fussnoten-Ereignis — der Widerspruch wird ANGEZEIGT (§11.6). */
  | 'ohne_ereignis'
  /** KEINE Textänderung, sondern eine LÜCKE DER QUELLE: die amtliche Konsolidierung
   *  dieses Stands führt die eId nicht im Artikelbaum, der nächste Stand führt sie
   *  wieder — mit demselben Wortlaut (Zeichen für Zeichen in der Vergleichsform des
   *  Profils). Der Artikel war nie aufgehoben; unvollständig ist das Artefakt, nicht
   *  das Recht. Gebucht wird das statt «entfallen» + «neu eingefügt»
   *  (`findeQuellLuecken` in `scripts/entstehung/synopse.ts`, Beleg CHEMRRV
   *  `cc/2005/478` @2022-05-01/@2022-10-01: Art. 4–24 stehen dort als
   *  `<mod>`/`<quotedStructure>` eines Änderungsanhangs statt als `<article>`). */
  | 'quelle_unvollstaendig';

/** Die Alt-Fassung eines Artikels in EINEM Konsolidierungs-Schritt. */
export interface SynopseArtikel {
  /** Amtliche eId der Konsolidierung, z. B. «art_336_c». */
  eId: string;
  /** Kanonischer Artikel-Token der Korpus-Schreibweise, z. B. «336c» — null, wenn nicht ableitbar. */
  token: string | null;
  /** Amtliches Artikel-Etikett der Alt-Fassung, z. B. «Art. 336c». */
  label: string;
  /** Sachüberschrift der Alt-Fassung (amtlich zitiert); fehlt, wenn der Artikel keine hat.
   *  Ohne den Klammer-Randvermerk des AKN-`<subheading>` — der ist ein Querverweis auf die
   *  Delegationsnorm und ändert sich mit Umnummerierungen ANDERSWO (`titelFuerVergleich`
   *  in `scripts/entstehung/synopse.ts`, 2096 von 2096 gemessen). */
  ueberschrift?: string;
  /** Sachüberschrift der NEU-Fassung dieses Schritts — nur gesetzt, wenn sie sich von
   *  `ueberschrift` unterscheidet (Profil `/4`, Gegenprüfung PR #798 Auflage A2).
   *
   *  WARUM DER GENERATOR BEIDE SEITEN SPEICHERT statt den Leser den neuen Titel aus dem
   *  Korpus holen zu lassen: der geltende Korpus-Snapshot führt für Bundeserlasse fast nie
   *  einen Artikel-`titel` (gemessen 12.9.2026: 7500 von 22 496 Artikeln stimmen überein,
   *  die übrigen tragen im Korpus GAR KEINEN Titel). Ein Leser, der den neuen Titel von
   *  dort nähme, zeigte bei zwei Dritteln aller Artikel eine Titel-Streichung, die es nie
   *  gab (§1). Die beiden amtlichen Konsolidierungen kennt dagegen der Generator. */
  ueberschriftNeu?: string;
  /** `geaendert` = eId in beiden Ständen, Wortlaut verschieden · `entfallen` = nur im
   *  Alt-Stand. Die Angabe beschreibt, was die QUELLE strukturell zeigt; ob daraus eine
   *  Aufhebung folgt, sagt `zustand` (`quelle_unvollstaendig` = die eId fehlt bloss in
   *  diesem Stand). ZWEI FELDER, ZWEI FRAGEN — nie dasselbe zweimal (§5). */
  art: 'geaendert' | 'entfallen';
  /** Wortlaut der Alt-Fassung — LEER genau dann, wenn `zustand: 'quelle_unvollstaendig'`:
   *  dort gibt es keine zwei Fassungen, weil der Wortlaut über die Lücke hinweg derselbe
   *  bleibt. Ihn aus dem `<quotedStructure>` des Lücken-Stands zu übernehmen wäre eine
   *  ZWEITE, anders provenierte Kopie derselben Wörter (§5) — und sie wäre nicht einmal
   *  über die eId zuzuordnen: die Blöcke im Änderungsanhang tragen `annex_1_a/mod_uN/…`,
   *  nie `art_N` (gemessen 12.9.2026 an CHEMRRV @2022-05-01). `check:entstehung` hält
   *  beide Richtungen fest. */
  alt: SynopseBlock[];
  /** sha256 über den NORMALISIERTEN Wortlaut (Profil `NORM_PROFIL`) — die Prüfsumme,
   *  an der der Determinismus-Wächter eine echte Textänderung von Parser-Drift trennt.
   *  Die zweite der von `soufien-lex.md` verlangten zwei Prüfsummen (Bytes der Quelle)
   *  sitzt eine Ebene höher, als `sha` je `SynopseStand` — pro Artikel wäre sie 64 Byte
   *  Rauschen je Eintrag und würde den Shard-Deckel ohne Erkenntnisgewinn belasten. */
  shaNorm: string;
  /** Gültigkeits-Zustand gegen die Fussnoten-Historie. */
  zustand: SynopseZustand;
  /** NUR bei `zustand: 'quelle_unvollstaendig'`: der Stand, ab dem die amtliche Quelle
   *  den Artikel wieder im Artikelbaum führt. Die Lücken-Stände selbst stehen nicht
   *  hier — sie sind genau die Stände zwischen `schritt.bis` (einschliesslich) und
   *  `zurueckAb` (ausschliesslich) und werden aus `SynopseShard.staende` abgeleitet,
   *  statt ein zweites Mal gespeichert zu werden (§5). */
  zurueckAb?: string;
  /** NUR bei `zustand: 'quelle_unvollstaendig'`, und dort PFLICHT: der Artikel steht in
   *  JEDEM Lücken-Stand als `<mod>`/`<quotedStructure>` eines Änderungsanhangs derselben
   *  Datei — belegt über die amtliche Änderungs-Referenz, nicht vermutet.
   *
   *  ES IST DIE BEDINGUNG DER BUCHUNG, NICHT IHR SCHMUCK (Auflage Gegenprüfung PR #801):
   *  ohne diesen positiven Beleg ist eine wortgleiche Rückkehr von einer echten Aufhebung
   *  mit späterer, wortgleicher Wiedereinführung nicht zu unterscheiden — solche Fälle
   *  bleiben «entfallen» + «neu eingefügt» und werden im Quell-Register vermerkt
   *  (`quellLueckeOhneBeleg`), statt als Lücke getarnt zu werden (§1). Optional ist das
   *  Feld nur im TYP, weil es an den anderen Zuständen nichts zu suchen hat;
   *  `check:entstehung` verlangt es an jedem Lücken-Block. */
  imAnhang?: true;
  /** AS-ELIs der Fussnoten-Ereignisse dieses Stands in Kurzform («oc/2023/750»; voller
   *  ELI = `https://fedlex.data.admin.ch/eli/` + Kurzform, Repo-Konvention `eliKurz`).
   *  Zusammen mit dem Stand-Datum der Ereignis-Schlüssel (§11.6, nie der Listenindex —
   *  122 Fälle «zwei Erlasse am selben Datum im selben Artikel»). Fehlt bei `ohne_ereignis`. */
  oc?: string[];
}

/** Ein Konsolidierungs-Schritt: von Stand `von` auf Stand `bis`. */
export interface SynopseSchritt {
  /** Stand der ALT-Konsolidierung (ISO). */
  von: string;
  /** Stand der NEU-Konsolidierung (ISO) — das Datum, an dem die Änderung gilt. */
  bis: string;
  /** eIds, die nur im NEUEN Stand vorkommen (neu eingefügt) — nur Liste, kein Text. */
  neuEIds?: string[];
  /** eIds, deren Alt-Fassung keinen Wortlaut trug (blosse Hülse oder reine Etikett-/
   *  Sachtitel-Änderung) — nichts zu zeigen, aber auch nichts zu verschweigen (§8). */
  ohneAltText?: string[];
  /** Fussnoten-Ereignisse am Stand `bis`, zu denen KEINE Textänderung beobachtet wurde
   *  (Widerspruch, §11.6 `validity_conflict` — angezeigt, nie still aufgelöst). */
  ereignisOhneAenderung?: string[];
  artikel: SynopseArtikel[];
}

/** Eine ausgewertete Konsolidierung (Quell-Beleg, §7 a–d). */
export interface SynopseStand {
  /** `dateApplicability` der Konsolidierung (ISO) — amtlicher Stand. */
  datum: string;
  /** Filestore-URL der AKN-XML-Manifestation (aus `isExemplifiedBy`, nie konstruiert). */
  xmlUrl: string;
  /** Live-Link zur amtlichen Fassung dieses Stands (§7c). */
  liveUrl: string;
  /** sha256 über das abgerufene XML (Quell-Hash, §7d). */
  sha: string;
  /** Bytes des abgerufenen XML. */
  bytes: number;
  /** Abrufdatum ISO (§7a). */
  abgerufen: string;
  /** Zahl der Artikel-eIds in diesem Stand (Zähl-Tor gegen stille Extraktionsverluste). */
  artikelZahl: number;
}

/** Shard je Erlass: `public/materialien/synopse/<ERLASS-KEY>.json`. */
export interface SynopseShard {
  /** Erlass-Key des Korpus, z. B. «ZPO» (= Dateiname ohne .json). */
  erlass: string;
  /** ELI-Kurzform des Erlasses, z. B. «cc/2010/262». */
  eli: string;
  /** Normalisierungs-Profil, unter dem `shaNorm` gebildet wurde. */
  normProfil: string;
  /** Erzeugungsdatum ISO (§2: aus der Shell, nie Date.now). */
  erzeugt: string;
  /** Früheste ausgewertete Konsolidierung (= `SYNOPSE_FENSTER_AB` oder später). */
  fensterAb: string;
  /** Amtliche Stände, die am Erzeugungstag NOCH NICHT GALTEN (`dateApplicability` in der
   *  Zukunft; korpusweit 57 belegt, R2 §7). Sie werden bewusst NICHT verglichen: der
   *  «Alt»-Text eines künftigen Schritts ist der GELTENDE Text, und den hält der Korpus
   *  schon (§5 — keine zweite Wahrheit). Die Daten stehen hier, damit die Zeitleiste
   *  «tritt in Kraft am …» sagen kann, ohne dass die Synopse sie speichert (§11.5 B5). */
  kuenftigeStaende: string[];
  staende: SynopseStand[];
  schritte: SynopseSchritt[];
}

const cache = new Map<string, Promise<SynopseShard | null>>();

/**
 * Lädt den Synopse-Shard eines Erlasses — LAZY, erst auf Klick (§15: im Lesefluss
 * null Byte). Fehlt der Shard, ist das ein gültiger Zustand («keine Fassung ab 2021»),
 * kein Fehler.
 */
export function ladeSynopseShard(erlassKey: string): Promise<SynopseShard | null> {
  const vorhanden = cache.get(erlassKey);
  if (vorhanden) return vorhanden;
  const p = fetch(`/materialien/synopse/${encodeURIComponent(erlassKey)}.json`)
    .then((r) => (r.ok ? (r.json() as Promise<SynopseShard>) : null))
    .catch(() => null);
  cache.set(erlassKey, p);
  return p;
}

/** Quell-Beleg eines Stands (für die Zitat-Angabe am Alt-Block, §7 a–c). */
export function standVon(s: SynopseShard, datum: string): SynopseStand | null {
  return s.staende.find((x) => x.datum === datum) ?? null;
}
