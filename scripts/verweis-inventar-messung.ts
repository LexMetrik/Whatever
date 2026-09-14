// ─── Mess-Maschine des Verweis-Inventars (V-1) ──────────────────────────────
//
// Aus `scripts/check-verweis-inventar.ts` herausgelöst (31.8.2026, W2·20 —
// Steuerungs-Flächendeckel `scripts/check-*.ts`, CLAUDE.md §17-Gegengewicht).
// Die Trennlinie ist dieselbe INHALTLICHE wie bei
// `verweis-inventar-transkription.ts`, eine Ebene tiefer:
//
//   · HIER steht, WIE GEMESSEN WIRD — Korpus-Lauf über die Snapshots, der
//     Leser-Kontext je Erlass, der Aufruf des Klassifizierers, die Aggregation
//     je Klasse, die beiden Sonderlisten (tote Selbstziele, Zeit-Kanten) und
//     der Selbsttest, der die Pipeline bei jedem Lauf gegen bekannte Proben
//     hält (§6.7).
//   · DORT (`check-verweis-inventar.ts`) steht das TOR — CLI-Schalter,
//     Guard-Wächter, Basislinien-Vergleich und Bericht.
//
// Ohne Seiteneffekte beim Import: `berechne()` und `selbsttest()` laufen nur,
// wenn das Tor sie ruft.
//
// Zweck, Transkriptions-Offenlegung, GRENZEN (§8) und das Basislinien-Modell
// stehen unverändert im Kopf von `scripts/check-verweis-inventar.ts`; sie
// gelten für diese Messung.

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { chapeauZielFremdgesetz } from '../src/lib/fedlex';
import { GRUNDART_SEED } from '../src/lib/normtext/grundart.generated';
import {
  G, KLASSEN, NORMTEXT_PFAD, ZEIT_ALTRECHT, ZEIT_TITEL, etabliertFremdgesetz,
  glaetteInterpunktion, kuerzelKanon, normRef, stellenImText,
  type Ctx, type Entscheid,
} from './verweis-inventar-transkription';

export const WURZEL = process.cwd();
export const ARTEFAKT_PFAD = join(WURZEL, 'messwerte', 'verweis-inventar.json');
const REGISTER_PFAD = join(WURZEL, 'public', 'normtext', 'register.json');
const SNAPSHOT_WURZEL = join(WURZEL, 'public', 'normtext');

// ─── 4 · Korpus-Lauf ────────────────────────────────────────────────────────

interface RegisterErlass {
  key: string; ebene: string; kanton: string | null; kuerzel: string; status: string; datei: string | null;
}

// ─── V-3 · Kürzel-Register je Kanton (Spiegel von baueKantonKuerzelKarte) ────
//
// Der Leser leitet die Karte aus dem Browse-Manifest ab — und das IST
// `public/normtext/register.json` (`ladeBrowseManifest`, browse.ts:63), also
// dieselbe Datei, die dieses Tor liest. Kein zweiter Datenstand.
//
// Die Regeln stehen an `baueKantonKuerzelKarte` (inhalt-sprung.tsx); zwei
// davon sind als Literal transkribiert und vom Wächter gedeckt
// (KANTON_KUERZEL_KANDIDAT/-FILTER). Der ZIELWERT ist hier der Register-Key
// statt der Lese-Adresse: das Tor zählt Klassen, es baut keine URL — was es
// braucht, ist «gibt es genau ein Ziel und ist es ein anderer Erlass».
function kuerzelKandidaten(kuerzel: string): string[] {
  return kuerzel.split(';').map((s) => s.trim())
    .filter((s) => s.length >= 2 && !/\s/.test(s) && /^[A-ZÄÖÜ]/.test(s));
}

function kartenJeKanton(erlasse: RegisterErlass[]): Map<string, Map<string, string>> {
  const je = new Map<string, Map<string, string>>();
  const mehrdeutig = new Map<string, Set<string>>();
  for (const e of erlasse) {
    if (!e.kanton || e.status !== 'snapshot') continue;
    if (!je.has(e.kanton)) { je.set(e.kanton, new Map()); mehrdeutig.set(e.kanton, new Set()); }
    const karte = je.get(e.kanton)!, doppelt = mehrdeutig.get(e.kanton)!;
    for (const k of kuerzelKandidaten(e.kuerzel)) {
      if (doppelt.has(k)) continue;
      const schon = karte.get(k);
      if (schon !== undefined && schon !== e.key) { karte.delete(k); doppelt.add(k); continue; }
      karte.set(k, e.key);
    }
  }
  return je;
}

/** Die Karte, wie der Leser DIESES Erlasses sie sieht: ohne die eigenen Kürzel. */
function karteFuerErlass(je: Map<string, Map<string, string>>, e: RegisterErlass):
ReadonlyMap<string, string> | undefined {
  if (!e.kanton) return undefined;
  const karte = new Map(je.get(e.kanton) ?? []);
  for (const k of kuerzelKandidaten(e.kuerzel)) karte.delete(k);
  return karte;
}
interface SnapshotBlock { text: string; items?: { text: string }[] }
interface SnapshotEintrag { id: string; artikel: string; titel?: string; bloecke?: SnapshotBlock[] }

interface KlassenZeile {
  klasse: string; entscheid: Entscheid; stellen: number; erlasse: number;
  selbstmarker: number; was: string;
}
export interface TotesZiel { erlass: string; fundstelle: string; bestimmung: string }
export interface Artefakt {
  _zweck: string;
  _regenerieren: string;
  _quellen: { normTextSha256: string; guards: number };
  korpus: { erlasse: number; eintraege: number; texte: number };
  gesamt: { stellen: number; self: number; fremd: number; text: number; selbstmarker: number };
  klassen: KlassenZeile[];
  toteSelbstziele: TotesZiel[];
  zeitKanten: { stellen: number; erlasse: number; uebergangsTitel: number; altrechtBlock: number };
}

function sha256(pfad: string): string {
  return createHash('sha256').update(readFileSync(pfad)).digest('hex');
}

export function berechne(): Artefakt {
  const register = JSON.parse(readFileSync(REGISTER_PFAD, 'utf8')) as { erlasse: RegisterErlass[] };
  const erlasse = register.erlasse
    .filter((e) => e.status === 'snapshot' && e.datei)
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  // V-3: Kürzel-Register je Kanton — EINMAL für den ganzen Lauf (der Leser baut
  // es je Erlass, das Ergebnis ist dasselbe; hier wäre es 1 231 Mal dieselbe
  // Schleife über das Register).
  const kantonKarten = kartenJeKanton(register.erlasse);

  const stellenJeKlasse = new Map<string, number>();
  const selbstJeKlasse = new Map<string, number>();
  const erlasseJeKlasse = new Map<string, Set<string>>();
  const toteSelbstziele: TotesZiel[] = [];
  const zeitErlasse = new Set<string>();
  let zeitStellen = 0, zeitTitel = 0, zeitAltrecht = 0;
  let eintraegeGesamt = 0, texteGesamt = 0;

  for (const e of erlasse) {
    const datei = join(SNAPSHOT_WURZEL, e.datei!);
    if (!existsSync(datei)) continue;
    const snap = JSON.parse(readFileSync(datei, 'utf8')) as { eintraege: SnapshotEintrag[] };
    const tokenMap = new Map<string, string>();
    for (const x of snap.eintraege) tokenMap.set(normRef(x.artikel), x.artikel);
    const leser: Ctx = {
      tokenMap,
      // Produktion: kuerzelKanon(basisPfad.split('/').pop()) — das letzte
      // Pfadsegment IST der Register-Key (erlassPfad baut es so).
      eigenesKuerzel: kuerzelKanon(e.key),
      // V-2: `useInternRefs` reicht `erlassKuerzel: erlass?.kuerzel` durch —
      // das ist genau das Register-Feld `kuerzel` (leserV3Modell.ts:353).
      registerKuerzel: e.kuerzel,
      paragrafDesigniert: GRUNDART_SEED[e.key]?.bestimmungsEtikett === 'paragraf',
      // V-3: `leserV3Modell` gibt genau diese Karte an `useInternRefs` weiter
      // (Bund ⇒ kein Kanton ⇒ undefined ⇒ die Weiche ruht).
      kantonKuerzel: karteFuerErlass(kantonKarten, e),
      // V-7: NormText leitet die Ebene aus dem Basispfad ab (`/gesetze/kanton/…`).
      ebene: e.ebene === 'kanton' ? 'kanton' : 'bund',
      // V-7c: NormText reicht das letzte Pfadsegment (= Register-Key) roh an
      // `fremdRoutingFormB` durch — Schlüssel der Trägergesetz-Tabelle.
      erlassKey: e.key,
    };

    for (const eintrag of snap.eintraege) {
      eintraegeGesamt += 1;
      const titelZeit = ZEIT_TITEL.test(eintrag.titel ?? '');
      for (const b of eintrag.bloecke ?? []) {
        const blockZeit = ZEIT_ALTRECHT.test(b.text ?? '');
        const fremdKey = chapeauZielFremdgesetz(b.text ?? '', e.kuerzel);
        const fremdItems = etabliertFremdgesetz(b.text ?? '', e.kuerzel);
        const itemCtx: Ctx | null = fremdKey
          ? { tokenMap: new Map(), eigenesKuerzel: '', paragrafDesigniert: false, fremdKuerzel: fremdKey, ebene: leser.ebene }
          : fremdItems ? null : leser;

        const texte: { text: string; ctx: Ctx | null }[] = [{ text: b.text ?? '', ctx: leser }];
        for (const it of b.items ?? []) texte.push({ text: it.text ?? '', ctx: itemCtx });

        for (const t of texte) {
          if (!t.text) continue;
          texteGesamt += 1;
          const stellen = stellenImText(
            glaetteInterpunktion(t.text), t.ctx, leser.paragrafDesigniert,
          );
          for (const st of stellen) {
            stellenJeKlasse.set(st.klasse, (stellenJeKlasse.get(st.klasse) ?? 0) + 1);
            if (!erlasseJeKlasse.has(st.klasse)) erlasseJeKlasse.set(st.klasse, new Set());
            erlasseJeKlasse.get(st.klasse)!.add(e.key);
            if (st.selbstmarker) {
              selbstJeKlasse.set(st.klasse, (selbstJeKlasse.get(st.klasse) ?? 0) + 1);
              if (titelZeit || blockZeit) {
                zeitStellen += 1;
                zeitErlasse.add(e.key);
                if (titelZeit) zeitTitel += 1;
                if (blockZeit) zeitAltrecht += 1;
              }
            }
            if (st.totesZiel && st.nummer) {
              toteSelbstziele.push({ erlass: e.key, fundstelle: eintrag.id, bestimmung: st.nummer });
            }
          }
        }
      }
    }
  }

  const klassen: KlassenZeile[] = Object.keys(KLASSEN).sort().map((k) => ({
    klasse: k,
    entscheid: KLASSEN[k].entscheid,
    stellen: stellenJeKlasse.get(k) ?? 0,
    erlasse: erlasseJeKlasse.get(k)?.size ?? 0,
    selbstmarker: selbstJeKlasse.get(k) ?? 0,
    was: KLASSEN[k].was,
  }));
  const summe = (f: (z: KlassenZeile) => boolean) =>
    klassen.filter(f).reduce((a, z) => a + z.stellen, 0);

  return {
    _zweck:
      'Verweis-Inventar des Normtext-Korpus (V-1, W2·20-VERWEIS-SCHAERFE). Basislinie: '
      + 'jede Abweichung Artefakt ↔ Neuberechnung ist ROT. Erzeugung und Grenzen: '
      + 'scripts/check-verweis-inventar.ts (Kopf).',
    _regenerieren: 'npm run check:verweis-inventar -- --schreiben',
    _quellen: { normTextSha256: sha256(NORMTEXT_PFAD), guards: Object.keys(G).length },
    korpus: { erlasse: erlasse.length, eintraege: eintraegeGesamt, texte: texteGesamt },
    gesamt: {
      stellen: klassen.reduce((a, z) => a + z.stellen, 0),
      self: summe((z) => z.entscheid === 'SELF'),
      fremd: summe((z) => z.entscheid === 'FREMD'),
      text: summe((z) => z.entscheid === 'TEXT'),
      selbstmarker: klassen.reduce((a, z) => a + z.selbstmarker, 0),
    },
    klassen,
    toteSelbstziele: toteSelbstziele.sort((a, b) =>
      `${a.fundstelle}|${a.bestimmung}` < `${b.fundstelle}|${b.bestimmung}` ? -1
        : `${a.fundstelle}|${a.bestimmung}` > `${b.fundstelle}|${b.bestimmung}` ? 1 : 0),
    zeitKanten: {
      stellen: zeitStellen, erlasse: zeitErlasse.size,
      uebergangsTitel: zeitTitel, altrechtBlock: zeitAltrecht,
    },
  };
}

// ─── 6 · Selbsttest (§6.7) ──────────────────────────────────────────────────

export function selbsttest(): void {
  const artErlass: Ctx = {
    tokenMap: new Map([['5', '5'], ['12', '12']]),
    eigenesKuerzel: 'AHVG', registerKuerzel: 'AHVG', paragrafDesigniert: false,
  };
  const parErlass: Ctx = {
    tokenMap: new Map([['19', '19']]),
    eigenesKuerzel: 'BS162100', registerKuerzel: 'Personalgesetz', paragrafDesigniert: true,
  };
  // V-3: derselbe §-Erlass, aber MIT dem Kürzel-Register seines Kantons. «IRG»
  // ist dort eindeutig, «StG» fehlt (mehrdeutig ⇒ nicht in der Karte), das
  // eigene «Personalgesetz» ist entfernt (Regel 3).
  const parMitKarte: Ctx = {
    ...parErlass,
    kantonKuerzel: new Map([['IRG', '/gesetze/kanton/BS-131.100']]),
  };
  // Voll zitierter Anker auf den gelesenen Erlass (V-2 Ziel 3): Kontext = SSV.
  const ssv: Ctx = {
    tokenMap: new Map([['65', '65']]),
    eigenesKuerzel: 'SSV', registerKuerzel: 'SSV', paragrafDesigniert: false,
  };
  // V-6: Item unter einem Fremdgesetz-Chapeau (M6-D) — wie `berechne()` ihn baut.
  const chapeau: Ctx = {
    tokenMap: new Map(), eigenesKuerzel: '', paragrafDesigniert: false, fremdKuerzel: 'AHVG',
  };
  // V-7: kantonaler Art.-Erlass (AR-146.1 Datenschutzgesetz) — Ebene «kanton».
  const kantonArt: Ctx = {
    tokenMap: new Map([['7', '7']]),
    eigenesKuerzel: 'AR1461', registerKuerzel: 'DSG AR', paragrafDesigniert: false, ebene: 'kanton',
  };
  // V-7c: Vollzugsverordnung mit Trägergesetz-Eintrag (ARGV1 → ArG).
  const argv1: Ctx = {
    tokenMap: new Map([['18', '18']]),
    eigenesKuerzel: 'ARGV1', registerKuerzel: 'ArGV 1', paragrafDesigniert: false, erlassKey: 'ARGV1',
  };
  // … derselbe Erlass für die Selbstmarker-Gegenprobe (Art. 5 existiert dort).
  const argv1self: Ctx = { ...argv1, tokenMap: new Map([['5', '5']]) };
  const proben: [string, Ctx | null, string, boolean][] = [
    // Text, Kontext, erwartete Klasse der ERSTEN Stelle, erwarteter Selbstmarker
    ['Massgeblich ist Art. 336c OR für diesen Fall.', artErlass, 'anker-fedlex', false],
    ['Die Frist nach Art. 5 beginnt zu laufen.', artErlass, 'art-self', false],
    ['Die Frist nach Art. 99 dieses Gesetzes beginnt.', artErlass, 'art-kein-token', true],
    ['Es gilt Art. 7 des Bundesgesetzes über die Sache.', artErlass, 'art-desder-guard', false],
    ['Es gilt Art. 5 sinngemäss.', parErlass, 'art-f41', false],
    // ── V-2-Weichen (Commit 967870b41) ──────────────────────────────────────
    // Ziel 1, Wendung: schlägt den des/der-Guard (Zwilling AHVG Art. 9).
    ['Der Beitrag nach Art. 5 des vorliegenden Gesetzes ist geschuldet.', artErlass, 'art-self', true],
    // … auch mit Passus dazwischen (PARAGRAF_ANHANG wird überlesen).
    ['Der Beitrag nach Art. 5 Absatz 2 des vorliegenden Gesetzes ist geschuldet.', artErlass, 'art-self', true],
    // Ziel 1, Wendung schlägt F41 (BS-833.100 § 6, «Art. 12 dieses Vertrages»).
    ['Er erlässt gemäss Art. 19 dieses Vertrages Vorschriften.', parErlass, 'art-self', true],
    // Ziel 2, eigenes Kürzel: schlägt den §-Grosswort-Guard (BS-162.100 § 19a).
    ['Es gilt § 19 Personalgesetz sinngemäss.', parErlass, 'paragraf-self', true],
    // … ein FREMDES Grosswort bleibt Text.
    ['Es gilt § 19 Integrationsgesetz sinngemäss.', parErlass, 'paragraf-fremd-grosswort', false],
    // Ziel 2, Bindestrich-Wortgrenze (Lehre KKV vs. KKV-FINMA): ein Kürzel mit
    // angehängtem «-…» ist ein ANDERER Erlass — ohne diese Regel wäre das hier
    // ein Self-Link auf die falsche Bestimmung (§1).
    ['Es gilt § 19 Personalgesetz-Anhang sinngemäss.', parErlass, 'paragraf-fremd-grosswort', false],
    // ── V-3-Weiche (Kanton-Kürzel-Resolver) ─────────────────────────────────
    // Beleg-Fall des Auftrags: «§ 6 IRG» in BS-111.100 → BS-131.100.
    ['Gesuche nach § 6 IRG sind einzureichen.', parMitKarte, 'paragraf-kanton-kuerzel', false],
    // … mit Passus dazwischen (der Passus gehört zum Zitat, nicht zum Kürzel).
    ['Gesuche nach § 6 Abs. 2 IRG sind einzureichen.', parMitKarte, 'paragraf-kanton-kuerzel', false],
    // … Satzzeichen am Ende zählen nicht zum Kürzel.
    ['Vorbehalten bleibt § 6 IRG.', parMitKarte, 'paragraf-kanton-kuerzel', false],
    // Ein Kürzel MIT Anhang ist ein anderer Erlass (Wortgrenze inkl. Bindestrich).
    ['Vorbehalten bleibt § 6 IRG-Anhang.', parMitKarte, 'paragraf-fremd-grosswort', false],
    // Nicht im Register des Kantons ⇒ unverändert Text.
    ['Vorbehalten bleibt § 6 Integrationsgesetz.', parMitKarte, 'paragraf-fremd-grosswort', false],
    // Das EIGENE Kürzel bleibt ein Selbstverweis (V-2 schlägt V-3).
    ['Es gilt § 19 Personalgesetz sinngemäss.', parMitKarte, 'paragraf-self', true],
    // OHNE Karte (Bund, Kanton ohne Register-Treffer) bleibt alles wie vorher.
    ['Gesuche nach § 6 IRG sind einzureichen.', parErlass, 'paragraf-fremd-grosswort', false],
    // ── V-6-Weiche (M12 sieht auch HINTER den Passus) ───────────────────────
    // Kernfall (Produktions-Beleg OR Art. 973g «(Art. 895–898 ZGB)»): der
    // Aufzählungs-Schwanz trägt kein führendes Leerzeichen, der Guard sah das
    // Kürzel darum bis V-6 nicht — Ergebnis war ein Self-Link auf einen
    // ZGB-Artikel im OR.
    ['Es gilt Art. 5–7 ZGB sinngemäss.', artErlass, 'art-m12-kuerzel', false],
    // ODER, nicht Ersetzung: hier bricht der Passus-Überleser hinter dem «a» ab
    // («–e» ist kein Zahlenglied), und der Rest «–e ZGB» trägt kein führendes
    // Leerzeichen. Nur weil der ROHE Rest weiter geprüft wird, greift N2 —
    // eine Ersetzung machte daraus einen falschen Self-Link (150 Stellen).
    // Z5 (W2·22): seither wird genau diese Stelle nicht mehr unterdrückt,
    // sondern auf ZGB art_5 verlinkt — die ODER-Regel oben bleibt trotzdem
    // nötig, denn sie ist es, die das Kürzel überhaupt sichtbar macht.
    ['Es gilt Art. 5 Buchstaben a–e ZGB sinngemäss.', artErlass, 'anker-ausgeschrieben', false],
    // Abgrenzung: das Passus-Wort selbst ist nie ein Kürzel (EIN Grossbuchstabe).
    ['Es gilt Art. 5 Absatz 2 sinngemäss.', artErlass, 'art-self', false],
    // Im Fremdgesetz-Chapeau ruht die Erweiterung: das genannte Kürzel IST das
    // Chapeau-Ziel (IVG Art. 66 «die Ausgleichskassen (Art. 53–70 AHVG)»), und
    // der Guard würde einen RICHTIGEN Fremd-Link unterdrücken.
    ['die Ausgleichskassen (Art. 53–70 AHVG);', chapeau, 'art-chapeau-fremd', false],
    // Ziel 3, voll zitierter Anker auf den gelesenen Erlass.
    ['Vorbehalten bleibt Art. 65 SSV.', ssv, 'anker-self', false],
    // … derselbe Anker in einem ANDEREN Erlass bleibt der Fedlex-Chip.
    ['Vorbehalten bleibt Art. 65 SSV.', artErlass, 'anker-fedlex', false],
    // ── V-7/V-8 (Erlassnamen-Positivliste, Kürzel-Schreibweisen) ────────────
    // V-7b Volltitel mit Datums-Einschub, Bund-Kontext.
    ['Es gilt Art. 7 des Bundesgesetzes vom 20. Dezember 1946 über die Alters- und Hinterlassenenversicherung.', ssv, 'n2b-titel', false],
    // … derselbe Volltitel in einem KANTONALEN Erlass (Kopf «Bundesgesetzes» gilt überall).
    ['Es gilt Art. 80 des Bundesgesetzes über Schuldbetreibung und Konkurs.', kantonArt, 'n2b-titel', false],
    // … Kopf «Verordnung» nur im Bund; im Kanton bleibt es der des/der-Guard.
    ['Es gilt Art. 7 der Verordnung über die Krankenversicherung.', ssv, 'n2b-titel', false],
    ['Es gilt Art. 7 der Verordnung über die Krankenversicherung.', kantonArt, 'art-desder-guard', false],
    // ── V-7c (Trägergesetz-Kontext «des Gesetzes») ─────────────────────────
    // Vollzugsverordnung MIT Legaldefinition im Ingress ⇒ Link aufs Trägergesetz.
    ['Die Pause nach Artikel 15 des Gesetzes ist zu gewähren.', argv1, 'n2b-traeger', false],
    // … derselbe Satz in einem Erlass OHNE Trägergesetz-Eintrag bleibt Text.
    ['Die Pause nach Artikel 15 des Gesetzes ist zu gewähren.', ssv, 'art-desder-guard', false],
    // «dieses Gesetzes» bleibt der Selbstmarker — die V-7c-Weiche darf ihn nicht fassen.
    ['Die Frist nach Art. 5 dieses Gesetzes beginnt.', argv1self, 'art-self', true],
    // Zitiertes Datum, das dem Trägergesetz WIDERSPRICHT ⇒ kein Link (Zeit-Kante).
    ['Die Pause nach Artikel 15 des Gesetzes vom 1. Januar 1900 ist zu gewähren.', argv1, 'art-desder-guard', false],
    // V-7a Kurztitel mit Geltung «bund»: im Bund Link, im Kanton Text (AR-146.1 heisst gleich).
    ['Es gilt Art. 7 des Datenschutzgesetzes.', ssv, 'n2b-genitiv', false],
    ['Es gilt Art. 7 des Datenschutzgesetzes.', kantonArt, 'art-desder-guard', false],
    // Klammer hinter dem Datum widerspricht dem Namen (BE-154.21, Falschlink auf main) ⇒ kein Link.
    ['Es gilt Art. 21 des Datenschutzgesetzes vom 19. Februar 1986 (KDSG).', ssv, 'art-desder-guard', false],
    // Volltitel des GELESENEN Erlasses ist kein Fremdverweis.
    ['Es gilt Art. 5 des Bundesgesetzes über die Alters- und Hinterlassenenversicherung.', artErlass, 'art-desder-guard', false],
    // V-8 amtliche Kürzel-Schreibweise: Anker und N2-Unterdrückung erkennen «BankG».
    ['Massgeblich ist Art. 1b BankG.', ssv, 'anker-fedlex', false],
    // Z5 (W2·22): die ausgeschriebene Präpositions-Form wird jetzt geroutet.
    ['Es gilt Artikel 4 Absatz 2 des FinfraG sinngemäss.', ssv, 'anker-ausgeschrieben', false],
    // ── Z5-Weichen (W2·22): was der neue Pfad NICHT verlinkt ────────────────
    // Zeit-Kante: das zitierte Datum ist das des AUFGEHOBENEN aDSG (1992), das
    // Register führt das DSG von 2020 ⇒ Z5 tritt zurück, N2 unterdrückt weiter.
    ['Es gilt Artikel 5 DSG vom 19. Juni 1992 sinngemäss.', ssv, 'art-n2-fremdkuerzel', false],
    // Self: nennt der Verweis den GELESENEN Erlass, bleibt es der Self-Sprung.
    // (Selbstmarker true: das genannte Kürzel IST das eigene — V-2 Ziel 2.)
    ['Es gilt Artikel 5 Absatz 2 AHVG sinngemäss.', artErlass, 'art-self', true],
    // Suffix jenseits der geteilten Nummern-Grammatik («29septies») erzeugt gar
    // keine Stelle — ART_INTERN matcht die Nummer nicht; der Negativ-Kontrakt
    // steht darum im Unit-Test (src/lib/fedlex/artikelverweis-ausgeschrieben.test.ts, N6).
  ];
  for (const [text, ctx, sollKlasse, sollSelbst] of proben) {
    const st = stellenImText(text, ctx, false);
    if (st.length === 0 || st[0].klasse !== sollKlasse || st[0].selbstmarker !== sollSelbst) {
      console.error(
        `check:verweis-inventar ROT (Selbsttest §6.7): «${text}» ergab `
        + `${st.length === 0 ? '<keine Stelle>' : `${st[0].klasse}/selbstmarker=${st[0].selbstmarker}`}`
        + `, erwartet ${sollKlasse}/selbstmarker=${sollSelbst} — der Klassifizierer misst nicht, was er messen soll.`,
      );
      process.exit(1);
    }
  }
  // Totes Selbstziel muss als solches erkannt werden (Sonderliste 1).
  const tot = stellenImText('Die Frist nach Art. 99 dieses Gesetzes beginnt.', artErlass, false);
  if (!tot[0].totesZiel) {
    console.error('check:verweis-inventar ROT (Selbsttest §6.7): totes Selbstziel «Art. 99 dieses Gesetzes» nicht erkannt.');
    process.exit(1);
  }
}
